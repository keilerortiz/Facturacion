# Sistema de Facturación — Documentación Técnica

**Versión:** 2.0.0  
**Fecha:** Abril 2026  
**Estado:** Producción  
**Clasificación:** Interno — IT / Desarrollo

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura General](#2-arquitectura-general)
3. [Arquitectura Backend](#3-arquitectura-backend)
4. [Arquitectura Frontend](#4-arquitectura-frontend)
5. [Modelo de Datos](#5-modelo-de-datos)
6. [Seguridad](#6-seguridad)
7. [Procesamiento Asíncrono](#7-procesamiento-asíncrono)
8. [Observabilidad](#8-observabilidad)
9. [Performance y Escalabilidad](#9-performance-y-escalabilidad)
10. [Despliegue](#10-despliegue)
11. [Operación en Producción](#11-operación-en-producción)
12. [Riesgos y Consideraciones](#12-riesgos-y-consideraciones)
13. [Roadmap](#13-roadmap)

---

## 1. Resumen Ejecutivo

### ¿Qué es el sistema?

Sistema web empresarial para la gestión y registro de **movimientos de carga y descarga** (entradas/salidas) asociados a propietarios y tipos de VTA (Venta/Transacción). El sistema emite cálculos automáticos de tarifa y total según las tarifas vigentes configuradas, y genera reportes exportables en formato Excel.

Está diseñado para operar en entornos corporativos con múltiples usuarios concurrentes, auditoría de cambios, y acceso controlado por roles.

### ¿Para qué sirve?

| Función | Descripción |
|---|---|
| Registro de movimientos | Altas, modificaciones y consultas de operaciones diarias |
| Control tarifario | Lookup automático de tarifa vigente por propietario y VTA |
| Auditoría | Trazabilidad completa de cada modificación de registro |
| Reportes | Exportación a Excel (sincrónica hasta 10K filas, asíncrona para volúmenes mayores) |
| Administración de usuarios | Gestión de cuentas, roles, contraseñas y sesiones |

### Nivel de madurez

El sistema se encuentra en estado **producción** con las siguientes garantías implementadas:

- Autenticación robusta con rotación de tokens y detección de robo
- Locking optimista para prevención de conflictos de concurrencia
- Auditoría de cambios a nivel de campo
- Sistema de jobs asíncronos con recuperación ante fallos
- Cache distribuido con degradación controlada
- Health checks, logging estructurado, y proceso supervisor (PM2)

---

## 2. Arquitectura General

### Visión de alto nivel

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENTE                            │
│              React 18 + MUI + Vite                      │
│              (SPA — puerto 5173 dev / Nginx prod)       │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTPS  /api/*
                        │ Bearer Token
┌───────────────────────▼─────────────────────────────────┐
│                   BACKEND — Node.js 20 ESM              │
│                   Express 4.x — puerto 5000             │
│                                                         │
│   ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│   │  Routes  │→ │Controller│→ │    Service Layer      │  │
│   └──────────┘  └──────────┘  └──────────┬───────────┘  │
│                                           │             │
│                              ┌────────────▼──────────┐  │
│                              │  Repository Layer      │  │
│                              └────────────┬──────────┘  │
└───────────────────────────────────────────┼─────────────┘
                        ┌──────────────────-┤
                        │                  │
          ┌─────────────▼──────┐   ┌───────▼──────┐
          │   SQL Server       │   │   Redis       │
          │   (MovimientosDB)  │   │   (cache +    │
          │                    │   │   rate limit) │
          └────────────────────┘   └──────────────┘
```

### Componentes principales

| Componente | Tecnología | Responsabilidad |
|---|---|---|
| Frontend SPA | React 18 / MUI 5 / Vite 5 | Interfaz de usuario |
| API Server | Node.js 20 / Express 4 | Lógica de negocio y datos |
| Base de datos | SQL Server (mssql) | Persistencia principal |
| Cache | Redis (ioredis) | Catálogos, rate limiting |
| Process Manager | PM2 | Supervisión y restart automático |

### Flujo de interacción típico

1. El usuario ingresa credenciales en el SPA.
2. El SPA solicita `POST /api/auth/login` y almacena el par `accessToken` / `refreshToken` en `localStorage`.
3. Cada request API incluye `Authorization: Bearer <accessToken>` inyectado por el interceptor de Axios.
4. Si el server responde `401`, el interceptor intenta renovar el access token via `POST /api/auth/refresh` de forma transparente y reintenta el request original.
5. Si el refresh también falla, se emite el evento `AUTH_EXPIRED_EVENT` y el SPA redirige al login.

---

## 3. Arquitectura Backend

### Estructura de capas

El backend implementa una arquitectura de capas estricta sin bypass entre niveles:

```
Request HTTP
    │
    ▼
Middleware Pipeline
  (requestId → CORS → helmet → compression → logger → rateLimiter)
    │
    ▼
Router  (/api/auth, /api/movimientos, /api/jobs, /health)
    │
    ▼
Controller  (validación Zod + delegación)
    │
    ▼
Service  (lógica de negocio, transacciones)
    │
    ▼
Repository  (SQL parametrizado, sin ORM)
    │
    ▼
SQL Server (mssql pool)
```

### Middleware pipeline

El pipeline se configura en `createApp.js` y se aplica en este orden:

| Orden | Middleware | Función |
|---|---|---|
| 1 | `requestId` | Genera o propaga `X-Request-ID` (UUID) |
| 2 | `cors` | Whitelist de origen (`FRONTEND_URL`) |
| 3 | `helmet` | Headers de seguridad HTTP |
| 4 | `compression` | gzip de respuestas |
| 5 | `express.json` | Parsing del body, límite configurable |
| 6 | `requestLogger` | Log estructurado de inicio/fin de request |
| 7 | `rateLimiter` | Rate limiting por IP/usuario (Redis-backed) |
| 8 | `authMiddleware` | Validación de Bearer token (rutas protegidas) |
| 9 | `roleMiddleware` | Verificación de rol (rutas de admin) |
| 10 | `notFoundHandler` | 404 JSON |
| 11 | `errorHandler` | Conversión de errores a respuestas HTTP |

### Capa de Controllers

Los controllers son exclusivamente responsables de:
- Extraer y validar el input HTTP (body, query, params) usando esquemas Zod del directorio `domain/`
- Invocar el servicio correspondiente
- Retornar la respuesta HTTP

Ningún controller contiene lógica de negocio. Todos los handlers están envueltos en `asyncHandler()` que captura errores asíncronos y los propaga al `errorHandler` global.

**Ejemplo de flujo — exportación Excel:**
1. `movimientosController.exportExcel` extrae filtros, delega a `movimientosService.exportToExcel`
2. El service valida el volumen (lanza `422` si supera 10.000 filas)
3. El service genera el workbook con ExcelJS y lo escribe como stream directo a `res`
4. Se registra el evento de exportación en el log estructurado

### Endpoint agregador `/movimientos/init`

La ruta `GET /api/movimientos/init` resuelve en paralelo los datos necesarios para el primer render de la página de movimientos:

```
GET /api/movimientos/init?propietarioId=...&...
  → Promise.all([listOwners(), list(query)])
  → { propietarios: [...], movimientos: { data, totalCount, page, pageSize } }
```

Esto reduce dos round-trips de red a uno solo durante la carga inicial de la página. El endpoint requiere autenticación y está registrado antes de las rutas individuales en `movimientosRoutes.js`.

### Cache de sesión en authMiddleware

El middleware `authMiddleware.js` almacena en Redis el resultado de la consulta de usuario por `userId` (TTL 120 segundos). En requests sucesivos dentro de ese período, el lookup de usuario no genera consulta a SQL Server:

```
Cache key:  facturacion:user:auth:{userId}
TTL:        120 s
Invalidado: nunca explícitamente (TTL natural); la cuenta activa se re-lee al expirar
```

Si Redis no está disponible, el sistema degradea silenciosamente y consulta la base de datos en cada request (comportamiento previo a v2.0.0).

### Capa de Services

Contiene toda la lógica de negocio. Sus responsabilidades incluyen:
- Orquestar múltiples llamadas a repositorios en una sola transacción
- Aplicar reglas de negocio (fechas permitidas, cálculo de tarifa, validación de tipos)
- Gestionar el ciclo de vida de tokens JWT
- Realizar invalidaciones de cache cuando los datos cambian

Las operaciones que deben ser atómicas usan `withTransaction(callback)` del módulo de base de datos, que gestiona `BEGIN TRANSACTION`, `COMMIT` y `ROLLBACK` automáticamente.

### Capa de Repositories

Capa de acceso a datos. Cada método ejecuta exactamente una consulta SQL parametrizada. No contiene lógica de negocio. Los repositorios reciben el objeto transacción cuando la operación requiere atomicidad, o usan el pool directo en caso contrario.

**Política de queries:**
- Todo input de usuario va como parámetro `mssql.input()`, nunca interpolado en la cadena SQL
- Las consultas de listado incluyen `COUNT(*) OVER()` para evitar un segundo round-trip de conteo
- Las consultas de exportación proyectan únicamente las columnas necesarias

### Manejo de errores

El `errorHandler` central mapea excepciones a respuestas HTTP estructuradas:

| Tipo de error | Código HTTP |
|---|---|
| `AppError` (negocio) | El definido en el error (400, 401, 403, 404, 409, 422) |
| SQL `2601` / `2627` (UK violation) | 409 Conflict |
| SQL `547` (FK violation) | 409 Conflict |
| SQL connection error | 503 Service Unavailable |
| `ZodError` (validación) | 400 Bad Request con detalle de campos |
| Error no controlado | 500 Internal Server Error |

En producción (`NODE_ENV=production`) los mensajes de error 500 se suprimen para el cliente; el detalle queda en los logs.

---

## 4. Arquitectura Frontend

### Estructura y organización

```
src/
├── app/          App.jsx — raíz de la aplicación
├── router/       AppRouter.jsx — rutas y lazy loading
├── context/      AuthContext.jsx — estado global de sesión
├── pages/        Una carpeta por dominio (dashboard, movimientos, admin, auth)
├── components/
│   ├── common/   ProtectedRoute, PageHeader, StatCard, LoadingScreen, ErrorBoundary
│   ├── layout/   AppLayout (sidebar + navbar)
│   └── movimientos/ Form, Filters, Table, HistorialDialog
├── services/     httpClient, authService, movimientosService, sessionStorage
├── hooks/        useDebouncedValue
├── utils/        date, cache, apiError, requestDeduplicator, movimientosStore
└── styles/       global.css, theme.js (MUI tema)
```

### Gestión de estado

El sistema no utiliza gestor de estado global (Redux/Zustand). El estado se maneja en cuatro niveles:

| Nivel | Mecanismo | Alcance |
|---|---|---|
| Sesión de usuario | `AuthContext` + `localStorage` | Aplicación completa |
| Estado de página | `useState` / `useEffect` local | Por componente de página |
| Cache de catálogos | `createTtlCache()` in-memory | Por sesión de pestaña |
| Store de datos compartidos | `movimientosStore` (módulo singleton) | Por sesión de pestaña |

`AuthContext` expone: `session`, `user`, `isAuthenticated`, `loading`, `login()`, `logout()`, `changePassword()`, `refreshProfile()`. Es el único estado compartido entre rutas.

### Deduplicación de requests en bootstrap

El SPA activa `React.StrictMode` en desarrollo, lo que provoca que cada `useEffect` se ejecute dos veces. La utilidad `requestDeduplicator.js` evita que se disparen requests HTTP duplicados:

```js
// src/utils/requestDeduplicator.js
const pending = new Map();

export function deduplicatedFetch(key, fetchFn) {
  if (pending.has(key)) return pending.get(key);
  const promise = fetchFn().finally(() => pending.delete(key));
  pending.set(key, promise);
  return promise;
}
```

El segundo invocador obtiene la misma `Promise` ya en curso; la entrada del `Map` se elimina al resolver. Esto garantiza exactamente una llamada HTTP por clave, independientemente de cuántas veces se invoque simultáneamente.

Se aplica en:
- `AuthContext.jsx` — bootstrap de sesión (`auth:bootstrap:validate`, `auth:bootstrap:refresh`)
- `MovimientosPage.jsx` — carga inicial (`movimientos:page:init`), VTAs y tarifas
- `DashboardPage.jsx` — carga de usuarios (`dashboard:users`)

### Store de módulo para datos compartidos

`movimientosStore.js` es un singleton de módulo que implementa un patrón pub/sub mínimo:

```js
// src/utils/movimientosStore.js
let _data = null;
const _listeners = new Set();

export const movimientosStore = {
  get()           { return _data; },
  set(value)      { _data = value; _listeners.forEach(fn => fn(value)); },
  subscribe(fn)   { _listeners.add(fn); return () => _listeners.delete(fn); },
};
```

**Flujo:**
1. `MovimientosPage` llama `GET /api/movimientos/init` al montarse.
2. Cuando el resultado llega, escribe `movimientosStore.set(initData.movimientos)`.
3. `DashboardPage` suscribe al store con `movimientosStore.subscribe(setMovimientosData)`. Si ya hay datos (usuario navegó antes a Movimientos), los lee directamente con `movimientosStore.get()`.
4. `DashboardPage` no realiza ninguna llamada independiente a `GET /api/movimientos`.

Esto elimina el problema de `DashboardPage` disparando su propia carga de movimientos al montarse en la ruta raíz `/dashboard`, independientemente de si el usuario visita o no la página de movimientos.

### Comunicación con el backend

Toda comunicación HTTP pasa por la instancia centralizada de Axios configurada en `httpClient.js`:

- `baseURL`: `/api` (configurable via `VITE_API_BASE_URL` para proxying en desarrollo)
- **Interceptor de request**: inyecta `Authorization: Bearer <token>` automáticamente desde `localStorage`
- **Interceptor de respuesta**: maneja el reintento transparente en caso de `401`:
  1. Si el token expiró, solicita refresh silencioso
  2. Si el refresh es exitoso, repone el token en storage y reintenta el request original
  3. Si el refresh falla, emite `AUTH_EXPIRED_EVENT` → `AuthContext` limpia la sesión → redirección a `/login`
- Los errores de respuesta `blob` (exports) se decodifican a JSON para extraer el mensaje de error

### Routing y protección de rutas

Las páginas se cargan con `React.lazy()` + `<Suspense>` para reducir el bundle inicial. El componente `ProtectedRoute` bloqueea el acceso según:

1. `isAuthenticated` — redirige a `/login` si no hay sesión válida
2. `roles` prop — redirige a `/dashboard` si el rol no está autorizado (e.g. `roles={['admin']}` para `/usuarios`)

El bundle de producción está dividido en tres chunks manuales: `vendor` (React), `mui` (@mui/material), `emotion`.

---

## 5. Modelo de Datos

### Entidades principales

#### `Usuarios`
Tabla de cuentas de acceso al sistema. El campo `activo` controla el acceso sin eliminar el registro. `rol` acepta únicamente `admin` u `operador`.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | INT PK IDENTITY | Identificador |
| `usuario` | NVARCHAR(100) UNIQUE | Nombre de usuario para login |
| `nombre` | NVARCHAR(150) | Nombre completo |
| `password_hash` | NVARCHAR(255) | Hash bcrypt |
| `rol` | NVARCHAR(20) | `admin` / `operador` |
| `activo` | BIT DEFAULT 1 | Estado de la cuenta |
| `fecha_ultimo_acceso` | DATETIME2 | Actualizado en cada login |

#### `Propietarios`
Catálogo de titulares. El campo `nit` fue agregado en migración `005`.

#### `VTAs`
Tipos de transacción por propietario. Cada VTA puede requerir que el movimiento especifique si es `CARGUE` o `DESCARGUE` (`requiere_tipo = 1`). Tiene `tipovta` y `udmvta` como atributos característicos agregados en migración `002`/`004`.

#### `Tarifas`
Definición de precios vigentes por combinación `(propietario_id, vta_id)`. El sistema mantiene histórico de tarifas por `vigente_desde`. En cada creación/edición de movimiento se busca la tarifa activa más reciente (`MAX(vigente_desde) WHERE activa=1 AND (vigente_hasta IS NULL OR vigente_hasta >= fecha)`).

#### `Movimientos`
Tabla central del sistema. Cada fila representa una operación registrada.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | INT PK IDENTITY | Identificador |
| `fecha` | DATE | Fecha de la operación |
| `decada` | DATE | Agrupación por decena |
| `propietario_id` | INT FK | Propietario |
| `vta_id` | INT FK | VTA asociada |
| `cantidad` | DECIMAL | Unidades/volumen |
| `tipovta` | NVARCHAR(20) nullable | `CARGUE` / `DESCARGUE` / NULL |
| `tarifa` | DECIMAL(18,4) | Tarifa aplicada al momento |
| `total` | DECIMAL(18,4) | `cantidad × tarifa` |
| `observaciones` | NVARCHAR(4000) | Texto libre |
| `version` | INT DEFAULT 1 | Contador de versión para locking optimista |
| `usuario_creacion_id` | INT FK | Autor del registro |
| `usuario_modificacion_id` | INT FK nullable | Último editor |

#### `RefreshTokens`
Tokens de refresco activos. Agrupados por `familia` (cadena de rotación). La revocación de una familia invalida toda la sesión del usuario asociado.

#### `Logs`
Auditoría a nivel de campo. Por cada campo modificado en un movimiento se inserta un registro con valor anterior y posterior. El campo `usuario` es el nombre (no FK) para preservar el historial ante eliminaciones.

#### `Jobs`
Estado de los trabajos asíncronos. Campos clave: `estado` (`pending/processing/completed/failed`), `progreso` (0-100), `archivo` (ruta relativa del Excel generado), `resultado` (JSON con metadatos), `error` (mensaje si falló).

### Relaciones

```
Propietarios ──┬── VTAs ─────────── Tarifas
               │                        │
               └── Movimientos ─────────┘
                        │
                        └── Logs (auditoría por campo)

Usuarios ──── RefreshTokens
         └─── Jobs
         └─── Movimientos (usuario_creacion_id, usuario_modificacion_id)
```

### Convenciones e índices

Los índices críticos para performance de consulta están definidos en las migraciones `003` y `009`:

| Índice | Tabla | Columnas | Uso |
|---|---|---|---|
| `IX_Movimientos_propietario_fecha` | Movimientos | `(propietario_id, fecha DESC)` | Filtros y ordenamiento principales |
| `IX_Movimientos_propietario_vta` | Movimientos | `(propietario_id, vta_id)` | Joins de catálogo |
| `IX_Tarifas_lookup` | Tarifas | `(propietario_id, vta_id, activa)` | Lookup de tarifa vigente |
| `IX_RefreshTokens_TokenHash` | RefreshTokens | `(token_hash)` | Búsqueda en cada refresh |
| `IX_Jobs_Estado` | Jobs | `(estado)` | Polling de trabajos pendientes |

**Locking optimista:** El campo `version` en `Movimientos` se incrementa en cada `UPDATE`. El service verifica que el `version` enviado por el cliente coincide con el de la base de datos antes de escribir. Una discrepancia retorna `409 Conflict`.

---

## 6. Seguridad

### Autenticación — JWT con rotación de tokens

El sistema implementa autenticación stateful-aware sobre JWT, con separación entre tokens de acceso y tokens de refresco.

**Flujo de login:**
1. El servidor verifica credenciales contra el hash bcrypt almacenado.
2. Genera un `accessToken` JWT firmado con `JWT_ACCESS_SECRET` (expiración corta, configurable).
3. Genera un `refreshToken` como hex aleatorio de 64 bytes (no JWT).
4. Almacena en `RefreshTokens` el SHA-256 del refresh token junto con `familia` (cadena de rotación) y fecha de expiración.
5. Retorna ambos tokens al cliente.

**Rotación de tokens:**
1. El cliente envía `POST /api/auth/refresh` con el refresh token actual.
2. El servidor busca el SHA-256 en `RefreshTokens` y verifica que no esté revocado ni expirado.
3. **Detección de robo:** Si el token ya fue utilizado (marcado como revocado), se invalida **toda la familia** — esto revoca todas las sesiones activas del usuario.
4. Si es válido: se revoca el token usado, se emite un nuevo par (access + refresh) con la misma `familia`.

**Logout:**
- Revoca la familia completa del token actual, invalidando todos los dispositivos activos del usuario.

### Autorización basada en roles

| Rol | Capacidades |
|---|---|
| `admin` | Acceso total: movimientos, usuarios, exportaciones, administración |
| `operador` | Solo lectura/escritura de movimientos; no puede acceder a gestión de usuarios |

El middleware `requireRoles(...roles)` se aplica a nivel de ruta y retorna `403 Forbidden` si el rol no coincide.

### Rate Limiting

Implementado con `express-rate-limit` y store Redis (con fallback en memoria si Redis no está disponible).

| Endpoint | Límite | Ventana |
|---|---|---|
| `POST /api/auth/login` | 10 intentos | 1 minuto por IP |
| `POST /api/auth/register` | Heredado del límite general | — |
| API general | 100 requests | 1 minuto por usuario autenticado o IP |

### Protección de la API

| Mecanismo | Detalle |
|---|---|
| **Helmet** | Headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, etc. |
| **CORS** | Origen permitido restringido a `FRONTEND_URL`; credenciales habilitadas |
| **SQL Injection** | Todo input pasa por parámetros `mssql.input()`; sin interpolación de strings |
| **Bcrypt** | Factor de costo configurable (`BCRYPT_ROUNDS`, default 12) |
| **Validación Zod** | Input validado en el controller antes de llegar al service |
| **Password policy** | Mínimo 8 caracteres, mayúscula, minúscula, dígito |

---

## 7. Procesamiento Asíncrono

### Sistema de jobs

El sistema implementa una cola de trabajos in-process con persistencia de estado en base de datos. La arquitectura es intencionalmente simple para un despliegue de instancia única.

**Componentes:**

| Módulo | Responsabilidad |
|---|---|
| `jobQueue.js` | Cola en memoria, concurrencia máxima de 2 workers |
| `exportWorker.js` | Handler registrado para el tipo `export_movimientos` |
| `jobsRepository.js` | Persistencia de estado en tabla `Jobs` |
| `jobsService.js` | Orquestación: crear job, consultar estado, autorizar descarga |
| `jobsController.js` | HTTP: `POST /jobs/export`, `GET /jobs/:id`, `GET /jobs/:id/download` |

### Flujo de exportación asíncrona

```
Cliente
  │ POST /api/jobs/export  {filtros}
  ▼
jobsController → jobsService.createExportJob()
  │ INSERT Jobs (estado='pending', parametros=filtros) → jobId
  │ jobQueue.enqueue({ id: jobId, tipo: 'export_movimientos', payload: filtros })
  │ → retorna 202 { jobId }
  ▼
jobQueue (background worker picks up job)
  │ UPDATE Jobs estado='processing', fecha_inicio=NOW()
  │ exportWorker.process(filtros)
  │   → count rows (422 si > 10K)
  │   → fetch all rows (minimal columns)
  │   → build ExcelJS workbook
  │   → write file to ./exports/{jobId}.xlsx
  │   → UPDATE Jobs estado='completed', archivo=path, resultado={rows,filename}
  │ (on error) → UPDATE Jobs estado='failed', error=message
  ▼
Cliente (polling)
  │ GET /api/jobs/{jobId}  → { estado, progreso, resultado }
  │ GET /api/jobs/{jobId}/download  → file stream (solo si estado='completed')
```

### Recuperación ante fallos

Al iniciar el servidor, antes de aceptar conexiones, se ejecuta `recoverZombieJobs()`:

```
UPDATE Jobs SET estado='failed', error='Interrupted by server restart'
WHERE estado = 'processing'
```

Esto garantiza que cualquier job que estuviera en ejecución cuando el proceso terminó abruptamente no quede bloqueado en estado `processing` indefinidamente.

Adicionalmente, `cleanupOldJobs(7)` elimina jobs con más de 7 días de antigüedad en cada arranque, manteniendo la tabla Jobs limpia.

---

## 8. Observabilidad

### Logging estructurado

Todo log del sistema se emite en formato **JSON por línea** (`pino`-compatible), facilitando el ingestion en herramientas como Datadog, Splunk, Loki o CloudWatch.

Campos garantizados en cada entrada:

| Campo | Tipo | Ejemplo |
|---|---|---|
| `timestamp` | ISO 8601 | `"2026-04-12T08:14:56.803Z"` |
| `level` | string | `"info"`, `"warn"`, `"error"` |
| `message` | string | `"request:finish"` |
| `service` | string | `"facturacion-api"` |
| `environment` | string | `"production"` |
| `requestId` | UUID | `"d93d1e46-..."` |

Campos adicionales por evento:

| Evento (`message`) | Campos adicionales |
|---|---|
| `request:start` | `method`, `url`, `ip` |
| `request:finish` | `statusCode`, `durationMs`, `contentLength`, `userId` |
| `auth:token_reuse_detected` | `userId`, `familia` |
| `jobs:cleanup` | `deleted` |
| `jobQueue:zombie_recovery` | `recoveredCount` |
| `db:connected` | `server`, `database` |

El nivel de log se controla con la variable de entorno `LOG_LEVEL` (`debug`, `info`, `warn`, `error`). En producción el default es `info`.

### Request ID

Cada request recibe un identificador único (`requestId`) generado por el middleware `requestId.js`:
- Si el cliente envía `X-Request-ID`, ese valor se usa (para correlación end-to-end)
- Si no, se genera un UUID v4
- El `requestId` se retorna al cliente en el header de respuesta `X-Request-ID`
- Todas las entradas de log del mismo request incluyen el mismo `requestId`

Esto permite reconstruir el trace completo de cualquier operación buscando un único UUID en los logs.

### Health Checks

El sistema expone dos endpoints de health diseñados para integrarse con load balancers y orquestadores:

| Endpoint | Tipo | Comprobación | Uso |
|---|---|---|---|
| `GET /health/live` | Liveness | Proceso activo, `{ status: "ok" }` | Restart si falla |
| `GET /health/ready` | Readiness | Conectividad real a SQL Server | Quitar del pool si falla |

El endpoint `/health/ready` ejecuta `pingDatabase()` que realiza un `SELECT 1` contra la base de datos real, garantizando que el servidor puede servir tráfico.

---

## 9. Performance y Escalabilidad

### Cache Redis

El sistema usa Redis como capa de cache para catálogos de lectura frecuente y baja volatilidad. La implementación en `redisCache.js` ofrece degradación controlada: si Redis no está disponible, el `getOrSetJsonCache()` invoca el loader directamente y retorna el resultado sin error.

| Dato cacheado | TTL | Clave |
|---|---|---|
| Sesión de usuario (auth) | 120 s | `facturacion:user:auth:{userId}` |
| Lista de propietarios | 600 s | `facturacion:propietarios:lista` |
| VTAs por propietario | 600 s | `facturacion:vtas:{propietarioId}` |
| Tarifa vigente | 300 s | `facturacion:tarifa:{propietarioId}:{vtaId}` |

La cache de sesión `user:auth:{userId}` fue incorporada en v2.0.0: el `authMiddleware` almacena el resultado de `findUserById` para evitar una consulta a SQL Server en cada request autenticado durante los primeros 120 segundos de actividad de la sesión.

### Optimización de base de datos

- **Connection pool**: min/max configurable via `DB_POOL_MIN` / `DB_POOL_MAX`. El pool maneja reconexiones con backoff exponencial.
- **Índices cubiertos**: Las consultas de filtrado y ordenamiento más frecuentes están cubiertas por índices compuestos (ver sección 5).
- **Paginación server-side**: Todos los listados usan `OFFSET/FETCH NEXT` con `COUNT(*) OVER()` en una sola query.
- **Proyección mínima en exportaciones**: Las queries de export solo proyectan las columnas que aparecen en el Excel, reduciendo I/O de red hacia el motor SQL.

### Procesamiento asíncrono

Para exportaciones de volúmenes elevados (hasta 10.000 filas por job), el sistema desacopla la solicitud HTTP del procesamiento:
- El endpoint retorna `202 Accepted` con un `jobId` en < 100ms
- El procesamiento ocurre en background en el mismo proceso
- El cliente hace polling del estado por `GET /api/jobs/:id`

Esto elimina timeouts HTTP en exportaciones pesadas y permite al cliente mostrar progreso.

### Frontend

- **Code splitting**: Tres chunks de build manual (`vendor`, `mui`, `emotion`) con `manualChunks` en Vite
- **Lazy loading**: Todas las páginas se cargan con `React.lazy()` + `<Suspense>`
- **Debouncing de filtros**: 450ms de debounce en inputs de filtro antes de disparar queries al backend (`useDebouncedValue`)
- **Cache in-memory de catálogos**: `createTtlCache()` evita recargar propietarios y VTAs en cada render dentro de la misma sesión de pestaña. La cache de tarifas se invalida explícitamente tras cada creación o edición de movimiento.
- **Deduplicación de requests**: `deduplicatedFetch()` garantiza un único request HTTP por clave activa, previniendo llamadas duplicadas causadas por `React.StrictMode` o múltiples renderizados concurrentes.
- **Endpoint init agregador**: `MovimientosPage` realiza un único `GET /api/movimientos/init` en lugar de dos requests separados, reduciendo la latencia visible de la carga inicial.
- **AbortController en listado**: Las peticiones de `GET /api/movimientos` con filtros activan un `AbortController`; si el usuario cambia filtros antes de que la respuesta llegue, el request anterior se cancela, evitando actualizaciones fuera de orden.
- **Store compartido sin fetch duplicado**: `DashboardPage` lee y suscribe al `movimientosStore`; no emite requests propios a `/api/movimientos`.
- **Persistencia de preferencias de tabla**: Widths de columnas y columnas visibles se almacenan en `localStorage`

---

## 10. Despliegue

### Requisitos de infraestructura

| Componente | Mínimo recomendado | Notas |
|---|---|---|
| Node.js | v20 LTS | ESM nativo requerido |
| SQL Server | 2017+ | Express edition soportada |
| Redis | 6.0+ | Opcional; degradación controlada sin él |
| RAM (API) | 512 MB | PM2 reinicia automáticamente si supera 500 MB |
| Reverse proxy | Nginx / IIS | Sirve el build de React y hace proxy al API |

### Variables de entorno — Backend

El archivo `backend/.env` (nunca incluir en control de versiones) debe definir:

```
# Base de datos
DB_SERVER=localhost
DB_PORT=1433
DB_NAME=MovimientosDB
DB_USER=sa
DB_PASSWORD=<contraseña>
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_ENCRYPT=true          # requerido en producción

# JWT
JWT_ACCESS_SECRET=<secreto-aleatorio-32-bytes-mínimo>
JWT_REFRESH_SECRET=<secreto-diferente-al-access>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Redis (opcional)
REDIS_URL=redis://localhost:6379
REDIS_KEY_PREFIX=facturacion

# Aplicación
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://app.miempresa.com
BCRYPT_ROUNDS=12
LOG_LEVEL=info

# Tests (solo entorno de desarrollo)
TEST_ADMIN_USER=admin.facturacion
TEST_ADMIN_PASSWORD=<contraseña-del-admin-local>
```

> **Seguridad:** `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET` deben ser distintos, generados aleatoriamente (`openssl rand -hex 32`), y nunca compartidos entre entornos.

### Variables de entorno — Frontend

```
VITE_API_BASE_URL=/api     # en producción con reverse proxy
# VITE_API_BASE_URL=http://localhost:5000/api  # para desarrollo local
```

### Flujo de deployment

**Backend:**

```bash
# 1. Instalar dependencias de producción
npm ci --omit=dev

# 2. Ejecutar migraciones pendientes (si las hay)
node scripts/setupDatabase.js

# 3. Iniciar con PM2
pm2 start pm2.config.cjs --env production
pm2 save
pm2 startup   # para auto-arranque en reinicio del sistema
```

**Frontend:**

```bash
# Build estático
npm run build    # genera dist/

# Servir con Nginx (ejemplo mínimo)
# location / { root /var/www/facturacion/dist; try_files $uri /index.html; }
# location /api/ { proxy_pass http://localhost:5000; }
```

**Nginx — configuración mínima recomendada:**

```nginx
server {
    listen 443 ssl;
    server_name app.miempresa.com;

    root /var/www/facturacion/dist;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Request-ID $request_id;
        proxy_read_timeout 120s;
    }
}
```

---

## 11. Operación en Producción

### Logs de aplicación

Los logs estructurados JSON se almacenan en dos destinos:
- **stdout/stderr**: Capturados por PM2 en `./logs/pm2-out.log` y `./logs/pm2-error.log`
- **Redirección recomendada**: Configurar `log_date_format` en PM2 o redirigir a un agente de log centralizado (Filebeat, Fluentd, etc.)

**Consultas de operación frecuentes:**

```bash
# Ver errores recientes
pm2 logs facturacion-api --err --lines 100

# Buscar por requestId
grep "requestId" logs/pm2-out.log | grep "d93d1e46"

# Ver todos los errores 500
grep '"statusCode":500' logs/pm2-out.log

# Ver intentos de token reuse
grep "token_reuse_detected" logs/pm2-out.log
```

### Monitoreo

| Métrica | Fuente | Umbral de alerta sugerido |
|---|---|---|
| Uptime del proceso | PM2 / `/health/live` | < 99.5% |
| DB Readiness | `/health/ready` | 3 fallos consecutivos |
| Latencia p99 | `durationMs` en logs | > 2000ms |
| Errores 5xx | `statusCode:5` en logs | > 1% del tráfico |
| Jobs fallidos | tabla `Jobs` WHERE `estado='failed'` | > 0 en window de 1h |
| Intentos login fallidos | `statusCode:401` en `/auth/login` | > 20 en 5 minutos |
| Memoria RSS | PM2 — `pm2 monit` | > 400 MB |

### Gestión de sesiones activas

Desde la base de datos:

```sql
-- Ver tokens activos por usuario
SELECT u.usuario, COUNT(*) AS sesiones_activas
FROM RefreshTokens rt
JOIN Usuarios u ON rt.usuario_id = u.id
WHERE rt.revocado_en IS NULL AND rt.expira_en > SYSUTCDATETIME()
GROUP BY u.usuario;

-- Revocar todas las sesiones de un usuario (urgencia)
UPDATE RefreshTokens SET revocado_en = SYSUTCDATETIME()
WHERE usuario_id = <id_usuario> AND revocado_en IS NULL;
```

### Mantenimiento de la tabla Jobs

La limpieza de jobs viejos se ejecuta automáticamente en cada arranque del servidor (retención 7 días). Para limpieza forzada:

```sql
DELETE FROM Jobs WHERE fecha_creacion < DATEADD(day, -7, SYSUTCDATETIME());
```

Los archivos Excel generados en `./exports/` **no se eliminan automáticamente** junto con los jobs. Se recomienda un cron externo que elimine archivos con más de 7 días:

```bash
# Linux/Mac
find ./backend/exports -name "*.xlsx" -mtime +7 -delete

# Windows (PowerShell)
Get-ChildItem .\backend\exports\*.xlsx |
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } |
  Remove-Item
```

### Comandos de operación PM2

```bash
pm2 status                          # estado de todos los procesos
pm2 restart facturacion-api         # restart graceful
pm2 reload facturacion-api          # zero-downtime reload
pm2 logs facturacion-api --lines 50 # últimas 50 líneas de log
pm2 monit                           # dashboard en tiempo real
```

---

## 12. Riesgos y Consideraciones

### Limitaciones arquitectónicas

| Limitación | Impacto | Mitigación |
|---|---|---|
| **Job queue in-memory** | Los jobs pendientes en memoria se pierden al reiniciar el proceso abruptamente (los jobs `processing` se marcan como `failed` en el próximo arranque, pero los `pending` en cola RAM se pierden) | Aceptable para 1 instancia + volumen actual. Para escala horizontal o alta disponibilidad, reemplazar con Redis Bull o BullMQ |
| **Instancia única (instances: 1 en PM2)** | No hay paralelismo; un request largo (exportación) puede impactar la latencia del resto | Para mayor throughput, migrar la cola a Redis y usar `cluster_mode` en PM2 |
| **Export limit 10.000 filas** | Exportaciones mayores no están soportadas | Ajustable via limit en el service/worker, pero requiere pruebas de memoria |
| **Redis opcional** | Sin Redis, el rate limiting opera in-memory (no compartido entre procesos); los catálogos se recargan de DB en cada request de la primera carga | Instalar Redis para producción con múltiples usuarios concurrentes |

### Puntos críticos de operación

| Punto crítico | Descripción |
|---|---|
| **Rotación de JWT secrets** | Cambiar `JWT_ACCESS_SECRET` o `JWT_REFRESH_SECRET` invalida **todas** las sesiones activas. Requiere ventana de mantenimiento o implementación de multi-key validation |
| **Migración de base de datos** | No existe herramienta de migración automática. Las migraciones se aplican manualmente con `setupDatabase.js`. En producción, deben aplicarse en ventana de mantenimiento con backup previo |
| **Disk space para exports** | Los archivos `.xlsx` en `./exports/` crecen indefinidamente si no hay limpieza periódica. Un volumen de exportaciones alto puede agotar disco |
| **Timeout de exportación async** | El frontend no implementa longpolling ni WebSocket; el usuario debe refrescar manualmente o hay polling cada N segundos. Un interval corto genera carga innecesaria en el endpoint `GET /jobs/:id` |
| **Único administrador** | Si la cuenta admin queda bloqueada o con contraseña perdida, la recuperación requiere acceso directo a la base de datos |

### Deuda técnica conocida

- No existe test de carga ni benchmark documentado de la configuración de pool SQL Server actual
- Los archivos generados en `./exports/` no tienen limpieza automática integrada (se depende de tarea externa)
- No se sincroniza la versión del frontend con la del backend; en un deploy parcial puede haber incompatibilidad temporal de API
- La autenticación del worker de jobs no está aislada del pool principal de DB; un worker lento no tiene límite de timeout propio

---

## 13. Roadmap

Las siguientes mejoras están identificadas. Las marcadas con ✅ fueron completadas en v2.0.0.

### Corto plazo

| Mejora | Estado | Justificación |
|---|---|---|
| ✅ Cache Redis en authMiddleware (TTL 120 s) | Completado en v2.0.0 | Elimina consulta SQL en cada request autenticado |
| ✅ Endpoint `/movimientos/init` agregador | Completado en v2.0.0 | Reduce round-trips de carga inicial de 2 a 1 |
| ✅ Deduplicación de requests con `deduplicatedFetch` | Completado en v2.0.0 | Previene duplicados de `React.StrictMode` |
| ✅ AbortController en listado de movimientos | Completado en v2.0.0 | Cancela requests stale al cambiar filtros rápido |
| ✅ `movimientosStore` — eliminar fetch duplicado en Dashboard | Completado en v2.0.0 | Dashboard no emite requests independientes |
| Separar `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET` en .env | Pendiente | Buena práctica de seguridad; deben ser distintos |
| Habilitar `DB_ENCRYPT=true` en producción | Pendiente | Requerido para conexiones SQL Server en producción segura |
| Cron para limpieza de archivos `./exports/` | Pendiente | Operación actualmente manual; riesgo de agotamiento de disco |
| Cobertura de tests > smoke | Pendiente | Tests de integración por servicio, mocking de DB para tests unitarios |

### Mediano plazo

| Mejora | Justificación |
|---|---|
| Migrar job queue a Redis (BullMQ) | Elimina pérdida de jobs `pending` ante restart abrupto; habilita workers en múltiples instancias |
| Herramienta de migraciones DB (Flyway / db-migrate) | Gestión de versión de schema reproducible y auditable |
| Websocket o Server-Sent Events para progreso de jobs | Elimina el polling del cliente; mejora UX en exportaciones largas |
| Dashboard de operaciones (Prometheus + Grafana) | Visibilidad de métricas de negocio y sistema en tiempo real |

### Largo plazo

| Mejora | Justificación |
|---|---|
| Multi-instancia con PM2 cluster mode | Escala horizontal ante aumento de usuarios concurrentes |
| Refresh token en httpOnly cookie | Elimina exposición de refresh token en `localStorage` (XSS risk mitigation) |
| 2FA para usuarios admin | Capa adicional de seguridad en cuentas privilegiadas |
| CI/CD pipeline | Automatización de tests y deploy; actualmente proceso manual |

---

*Documento actualizado el 13 de abril de 2026. Refleja el estado del código en el commit `c92f7be` (tag `v2.0.0`, branch `feature/production-hardening-week-1`).*
