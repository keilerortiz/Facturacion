# Facturación - Sistema de Gestión de Movimientos

Aplicación full-stack profesional para la gestión de movimientos de almacén (cargues/descargas) con interfaz moderna tipo SaaS ejecutada en Node.js + React.

**Versión actual:** v1.8.0 | **Build:** 1019 módulos, 0 errores | **Verificación:** 77/77 checks PASS

---

## 📋 Tabla de contenidos

- [Stack Tecnológico](#stack-tecnológico)
- [Características Principales](#características-principales)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Instalación](#instalación)
- [Inicio Rápido](#inicio-rápido)
- [Documentación de Páginas](#documentación-de-páginas)
- [Documentación de Componentes](#documentación-de-componentes)
- [API Backend](#api-backend)
- [Changelog](#changelog)

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** — SPA con hooks y context API
- **Vite 5.4** — Build tool moderno con terser minification
- **Material UI v5** — Componentes profesionales y theming
- **React Router v6** — Routing con lazy loading
- **Axios** — HTTP client con interceptores y retry logic
- **IBM Plex Sans** — Tipografía corporate

### Backend
- **Node.js + Express** — API RESTful con middleware
- **SQL Server** — Base de datos relacional
- **JWT** — Autenticación stateless
- **bcrypt** — Hashing seguro de contraseñas
- **MSSQL** — Driver nativo con transacciones

### Arquitectura
- **Monorepo** — `frontend/` y `backend/` con `package.json` raíz
- **Layered Backend** — Controllers → Services → Repositories → Database
- **Service Layer Frontend** — Centralización de llamadas HTTP
- **Roles y Permisos** — RBAC integrado (Admin, Usuario)

---

## ✨ Características Principales

### Módulo de Movimientos
- **CRUD Completo** — Crear, editar, eliminar, visualizar movimientos
- **Tabla Profesional** — Redimensionamiento de columnas, sort, paginación, densidad ajustable
- **Doble-clic Auto-ajuste** — Columnas se ajustan automáticamente al contenido
- **Filtros Avanzados** — Propietario, VTA, tipo, fechas con presets (Hoy, Semana, Mes, etc.)
- **Autocomplete** — Búsqueda para Propietario y VTA con carga inteligente
- **Exportación Excel** — Con filtros aplicados usando librería XLSX
- **Historial** — Dialog modal con todo el historial de cambios por movimiento
- **Snackbar Toast** — Notificaciones de éxito/error/info en tiempo real

### Autenticación y Seguridad
- **JWT Stateless** — Token en localStorage con refresh automático
- **Validación Zod** — Schemas en frontend y backend
- **Parametrización SQL 100%** — Sin inyección SQL posible
- **Rate Limiting** — Protección contra fuerza bruta
- **CORS Configurado** — Control de acceso de origen
- **Stack Traces Ocultos** — En producción se ocultan detalles técnicos

### Admin y Usuarios
- **Gestión de Usuarios** — Panel solo-admin para crear/editar usuarios
- **Control de Roles** — Admin vs Usuario estándar
- **Dashboard Admin** — Estadísticas y controles
- **Logout Global** — Limpieza de sesión y redireccionamiento

### Performance y Optimizaciones
- **React.memo** — Prevención de re-renders innecesarios en componentes puros
- **useCallback** — Callbacks estables para event handlers
- **useMemo** — Memoización de cálculos costosos
- **Code Splitting** — Lazy loading de rutas con React.lazy
- **Terser Minification** — drop_console y drop_debugger en producción
- **Batch INSERT** — Inserciones SQL optimizadas con indexed params
- **Tokens Visuales** — 26 tokens semánticos para colores (0 hardcoded rgba)

---

## 📁 Estructura del Proyecto

```
Facturacion/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   └── App.jsx                    # Componente raíz with ErrorBoundary
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── ErrorBoundary.jsx      # Captura de errores React
│   │   │   │   ├── PageHeader.jsx         # Header con título y acciones
│   │   │   │   ├── StatCard.jsx           # Tarjeta de estadística
│   │   │   │   └── ...
│   │   │   ├── layout/
│   │   │   │   └── AppLayout.jsx          # Shell con sidebar + main content
│   │   │   └── movimientos/
│   │   │       ├── MovimientosPage.jsx    # Página principal (30/70 layout)
│   │   │       ├── MovimientosTable.jsx   # Tabla con resize/sort/paginate
│   │   │       ├── MovimientosFilters.jsx # Barra de filtros con presets
│   │   │       ├── MovimientoForm.jsx     # Modal form create/edit
│   │   │       ├── MovimientoRow.jsx      # Row component (memoizado)
│   │   │       └── HistorialDialog.jsx    # Dialog de historial
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   └── LoginPage.jsx          # Login form
│   │   │   ├── dashboard/
│   │   │   │   └── DashboardPage.jsx      # Dashboard con estadísticas
│   │   │   ├── admin/
│   │   │   │   └── UsersPage.jsx          # Gestión de usuarios (admin)
│   │   │   └── movimientos/
│   │   │       └── MovimientosPage.jsx    # Página principal movimientos
│   │   ├── router/
│   │   │   └── AppRouter.jsx              # Definición de rutas con lazy load
│   │   ├── context/
│   │   │   └── AuthContext.jsx            # Context para estado auth global
│   │   ├── services/
│   │   │   ├── authService.js             # API de autenticación
│   │   │   ├── movimientosService.js      # API de movimientos
│   │   │   ├── httpClient.js              # Axios config + interceptores
│   │   │   └── sessionStorage.js          # Manejo de sesión
│   │   ├── hooks/
│   │   │   └── useDebouncedValue.js       # Hook para debounce
│   │   ├── styles/
│   │   │   ├── theme.js                   # MUI theme + 26 tokens visuales
│   │   │   └── global.css                 # Estilos globales
│   │   ├── utils/
│   │   │   ├── apiError.js                # Manejo de errores HTTP
│   │   │   ├── cache.js                   # Cache client-side
│   │   │   └── date.js                    # Utilidades de fecha
│   │   └── main.jsx                       # Entry point
│   ├── index.html
│   ├── vite.config.js                     # Vite config con terser
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── app/
│   │   │   └── createApp.js               # Express app factory
│   │   ├── config/
│   │   │   ├── database.js                # Pool de SQL Server
│   │   │   └── env.js                     # Variables de entorno
│   │   ├── constants/
│   │   │   └── roles.js                   # Constantes de roles
│   │   ├── controllers/
│   │   │   ├── auth/
│   │   │   │   └── authController.js      # Auth endpoints
│   │   │   └── movimientos/
│   │   │       └── movimientosController.js # Movimientos endpoints
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js          # Verificación JWT
│   │   │   ├── roleMiddleware.js          # RBAC enforcement
│   │   │   ├── errorHandler.js            # Centralizado error handler
│   │   │   ├── notFoundHandler.js         # 404 handler
│   │   │   ├── rateLimiters.js            # Rate limiting
│   │   │   └── requestTimer.js            # Timing de requests
│   │   ├── repositories/
│   │   │   ├── auth/
│   │   │   │   └── authRepository.js      # Auth queries
│   │   │   └── movimientos/
│   │   │       └── movimientosRepository.js # Movimientos queries
│   │   ├── routes/
│   │   │   ├── authRoutes.js              # POST /auth/login, /logout
│   │   │   ├── movimientosRoutes.js       # CRUD de movimientos
│   │   │   └── index.js                   # Agregación de rutas
│   │   ├── services/
│   │   │   ├── auth/
│   │   │   │   └── authService.js         # Lógica de auth
│   │   │   └── movimientos/
│   │   │       └── movimientosService.js  # Lógica de movimientos
│   │   ├── domain/
│   │   │   ├── auth/
│   │   │   │   └── authSchemas.js         # Zod schemas para auth
│   │   │   └── movimientos/
│   │   │       └── movimientoSchemas.js   # Zod schemas para movimientos
│   │   ├── utils/
│   │   │   ├── AppError.js                # Error personalizado
│   │   │   ├── asyncHandler.js            # Wrapper de rutas async
│   │   │   ├── passwordUtils.js           # Hash y compare passwords
│   │   │   ├── tokenUtils.js              # JWT sign/verify
│   │   │   └── dateUtils.js               # Utilidades de fecha
│   │   └── server.js                      # Entry point con graceful shutdown
│   ├── database/
│   │   ├── migrations/                    # Migraciones incrementales SQL
│   │   ├── scripts/                       # Setup y verificación de BD
│   │   └── seeds/                         # Datos de prueba
│   └── package.json
├── CHANGELOG.md                           # Historial de cambios
└── package.json                           # Workspace root
```

---

## 🚀 Instalación

### Requisitos previos
- Node.js 18+
- npm 9+
- SQL Server 2019+ (local o remoto)

### Pasos

1. **Clonar el repositorio**
```bash
git clone <repo-url>
cd Facturacion
```

2. **Instalar dependencias (monorepo)**
```bash
npm install
```

3. **Configurar variables de entorno**

**Backend** — `backend/.env`:
```env
NODE_ENV=development
PORT=3000
SERVER=localhost\SQLEXPRESS
DATABASE=facturacion_db
USER=sa
PASSWORD=your_password
JWT_SECRET=your_jwt_secret_key_min_32_chars_!!!
JWT_EXPIRES_IN=24h
RATE_LIMIT_WINDOW_MS=15000
RATE_LIMIT_MAX_REQUESTS=10
IS_PRODUCTION=false
```

**Frontend** — `frontend/.env` (opcional, Vite auto-detecta):
```env
VITE_API_BASE_URL=http://localhost:3000
```

4. **Crear y seed base de datos**
```bash
cd backend
npm run setup-db      # Crea tablas y esquema
npm run seed-db       # Carga datos de prueba
```

5. **Iniciar en desarrollo**
```bash
npm run dev           # Concurrently backend + frontend
```

O por separado:
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### Acceso
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

### Credenciales de prueba
```
Usuario: usuario001@example.com
Contraseña: Password123!

Admin: admin@example.com
Contraseña: AdminPassword123!
```

---

## ⚡ Inicio Rápido

```bash
# Instalar dependencias
npm install

# Configurar BD (primera vez)
cd backend && npm run setup-db && cd ..

# Iniciar desarrollo
npm run dev

# Build de producción
npm run build

# Ejecutar en producción
npm start
```

---

## 📄 Documentación de Páginas

### 1. **LoginPage** (`/login`)
**Propósito:** Autenticación de usuarios

**Características:**
- Input email y password validados con Zod
- Real-time error display
- Remember me (localStorage)
- Redirect automático a `/dashboard` si ya está autenticado
- Link a recovery (placeholder)

**Estado:**
- Loading durante validate/submit
- Error handling con snackbar

**Flujo:**
1. User ingresa credenciales
2. POST `/auth/login` con email + password
3. Backend retorna `{ token, user }`
4. Frontend guarda en sessionStorage
5. Redirect a `/dashboard`

---

### 2. **DashboardPage** (`/dashboard`)
**Propósito:** Visión general con estadísticas

**Características:**
- Cards de estadísticas (Total movimientos, Pendientes, etc.)
- Gráficos por tipo de movimiento
- Links rápidos a secciones
- Acceso solo autenticado (ProtectedRoute)

**Componentes:**
- `PageHeader` — Título + acciones
- `StatCard` (memoizado) — Cards de métrica
- Gráficos MUI Charts (placeholder)

---

### 3. **MovimientosPage** (`/movimientos`)
**Propósito:** CRUD completo de movimientos

**Layout:** Split 30/70 (Filtros | Tabla + Formulario)

**Secciones:**

#### Filtros (30% izquierda)
- **Propietario** — Autocomplete con búsqueda
- **VTA** — Autocomplete con búsqueda
- **Tipo** — Select dropdown (CARGUE/DESCARGUE)
- **Rango de Fechas** — Date pickers + quick presets (Hoy, Semana, Mes, etc.)
- **Filtros Secundarios** — Popover con más opciones
- **Chips activos** — Mostrar filtros aplicados + delete individual
- **Icon reset** — Limpia todos los filtros

**Tabla (70% derecha)**
- Columnas: ID, Propietario, VTA, Tipo, Fecha, Cantidad, etc.
- **Redimensionamiento** — Drag borders entre columnas
- **Auto-fit** — Doble-clic en border para ajuste automático
- **Sort** — Clic en header para ordenar (asc/desc)
- **Paginación** — Rows per page + next/prev
- **Densidad** — Compact/Standard/Comfortable (menú toolbar)
- **Column Visibility** — Toggle columnas (gear icon)
- **Skeleton Loading** — Mientras carga datos
- **Actions** — Edit, Delete, View History

#### Formulario Modal (Overlay)
- **Create** — Nuevo movimiento (botón en toolbar)
- **Edit** — Seleccionar row + edit (o double-click)
- **Campos:** Propietario (Autocomplete), VTA, Tipo, Quantity, Notes
- **Validación** — Real-time con Zod
- **Submit** — POST (new) / PUT (update) con refresh de tabla

#### Historial Dialog
- Modal con timeline de cambios
- Campo, valor anterior, valor nuevo, autor, fecha
- Scroll vertical si hay muchos cambios

**Debounce:** Filtros tienen 300ms debounce para no hacer requests excesivos

---

### 4. **UsersPage** (`/usuarios`) — Admin-only
**Propósito:** Gestión de usuarios

**Características:**
- Tabla de usuarios (Email, Nombre, Rol, Fechas)
- Crear usuario (modal form)
- Editar usuario (rol + estado)
- Eliminar usuario (confirmación)
- ProtectedRoute + RoleRoute (admin)

---

## 🧩 Documentación de Componentes

### Componentes Principales

#### **AppLayout** (`components/layout/AppLayout.jsx`)
**Propósito:** Shell de la aplicación

**Props:** children (React.ReactNode)

**Estado:**
- `sidebarOpen` — Colapso del sidebar
- `mobileOpen` — Drawer en mobile
- Drawer responsive

**Layout:**
- Sidebar (fixed) con nav items, user profile, logout button
- Main content area scrollable
- Topbar optional

**Optimizaciones:**
- `useCallback` en handleLogout, handleCloseMobile, handleClosePasswordDialog
- `useMemo` en filteredItems para navs
- Tokens visuales para colores sidebar

---

#### **MovimientosPage** (`pages/movimientos/MovimientosPage.jsx`)
**Propósito:** Contenedor de CRUD movimientos

**Componentes internos:**
- MovimientosFilters (30% width)
- MovimientosTable (70% width)
- MovimientoForm (modal overlay)
- HistorialDialog (modal)

**Estado:**
- `movimientos` — Array de datos
- `filters` — Objeto con filtros activos
- `debouncedFilters` — Filtros con debounce
- `editingId` — Movimiento en edición
- `formData` — Datos del form (useRef para estabilidad)
- `historyMovement` — Movimiento con historial abierto
- `loading`, `error` — Estados de carga

**Optimizaciones:**
- formDataRef pattern para stable handleSubmit
- `useCallback` en 8+ handlers
- Derived state: `historyOpen = historyMovement !== null`
- Module-level constants: `toggleableCols`, Popover configs
- `memoized effectiveVisible` para columnas

---

#### **MovimientosTable** (`components/movimientos/MovimientosTable.jsx`)
**Propósito:** Tabla con resize, sort, paginate, density

**Props:**
- `items` — Array de movimientos
- `onEdit` — Callback al editar
- `onDelete` — Callback al eliminar
- `onViewHistory` — Callback historial
- `loading` — Boolean
- `density` — 'compact' | 'standard' | 'comfortable'
- `hiddenColumns` — Set de columnas ocultas
- `onToggleColumn` — Callback toggle

**Características:**
- **Resize:** addEventListener en thead cells, mousedown/move/up con cleanup
- **Auto-fit:** Double-click en border de header
- **Sort:** onClick header cell
- **Paginate:** State de page + rowsPerPage
- **Density:** Padding ajustable
- **Column Visibility:** Gear icon → popover

**Componente hijo:**
- **MovimientoRow** (memoized) — Renderiza cada fila
  - useCallback en handleEdit, handleHistory
  - Popover de acciones (Edit, Delete, History)

**Skeleton:** Mientras `loading=true`, renderiza 5 filas de placeholder

---

#### **MovimientosFilters** (`components/movimientos/MovimientosFilters.jsx`)
**Propósito:** Panel de filtros avanzados

**Props:**
- `filters` — Objeto filtros actuales
- `onChange` — Callback con filtro actualizado
- `onReset` — Callback limpiar todos

**Campos:**
- Propietario (Autocomplete) — Opción buscar + seleccionar
- VTA (Autocomplete) — Similar
- Tipo (Select) — CARGUE / DESCARGUE
- Fecha desde/hasta (DatePickers)
- Quick presets (buttons) — Hoy, Semana, Mes, Custom

**Optimizaciones:**
- `memo()` para no re-renderizar si props no cambian
- `useMemo` en secondaryCount, activePreset, chips
- `useCallback` en handleChipDelete, handleCloseMore
- Module-level: isIdEqual function, AUTOCOMPLETE_SX, DATE_INPUT_STYLE, POPOVER_*

---

#### **MovimientoForm** (`components/movimientos/MovimientoForm.jsx`)
**Propósito:** Modal form create/edit

**Props:**
- `open` — Boolean
- `movimiento` — Movimiento a editar (null = new)
- `onSubmit` — Callback con datos
- `onClose` — Callback cerrar

**Campos:**
- Propietario (Autocomplete)
- VTA (Autocomplete)
- Tipo (Select)
- Cantidad (Number input)
- Notas (Textarea)

**Validación:** Zod schema en tiempo real

**Optimización:** formDataRef pattern para stable form state

---

#### **HistorialDialog** (`components/movimientos/HistorialDialog.jsx`)
**Propósito:** Modal timeline de cambios

**Props:**
- `open` — Boolean
- `movimiento` — Objeto con `historial` array
- `onClose` — Callback

**Contenido:**
- Timeline vertical con cambios
- Cada item: Campo, Valor anterior, Valor nuevo, Autor, Fecha/hora

**Optimización:** memo() para no re-renderizar

---

#### **PageHeader** (`components/common/PageHeader.jsx`)
**Propósito:** Encabezado con título y acciones

**Props:**
- `title` — String
- `subtitle` — String (optional)
- `actions` — React.ReactNode

**Contenido:**
- Título grande + subtitle
- Flex para acomodar buttons o links

**Optimización:** memo()

---

#### **StatCard** (`components/common/StatCard.jsx`)
**Propósito:** Card de métrica con número, etiqueta e icono

**Props:**
- `title` — String
- `value` — Number | String
- `icon` — React Component
- `color` — Color variant

**Layout:**
- Icono + Texto centrado
- Hover effect
- Responsive

**Optimización:** memo() + tokens para colores

---

#### **ErrorBoundary** (`components/common/ErrorBoundary.jsx`)
**Propósito:** Manejo global de errores React

**Fallback UI:**
- Mensaje amigable de error
- Botón "Try again" para reload

**Cambios:**
- Removed console.error (terser drops anyway)

---

## 🔌 API Backend

### Autenticación

#### **POST /auth/login**
```json
{
  "email": "usuario@example.com",
  "password": "Password123!"
}
```
**Response:**
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "usuario@example.com",
    "nombre": "Usuario",
    "rol": "usuario"
  }
}
```

#### **POST /auth/logout**
Sin body. Solo header `Authorization: Bearer <token>`

---

### Movimientos

#### **GET /api/movimientos**
**Query params:**
- `propietarioId` — Filter
- `vtaId` — Filter
- `tipo` — Filter (CARGUE/DESCARGUE)
- `fechaDesde` — Filter
- `fechaHasta` — Filter
- `page` — Paginación (default: 1)
- `limit` — Rows per page (default: 10)
- `sortBy` — Columna (default: fecha)
- `order` — asc/desc

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "propietarioId": 10,
      "propietarioNombre": "Granja A",
      "vtaId": 5,
      "vtaNombre": "Bogotá",
      "tipo": "CARGUE",
      "cantidad": 100,
      "notas": "...",
      "fechaCreacion": "2024-04-12T10:30:00Z",
      "usuarioCreacion": "admin@example.com"
    }
  ],
  "total": 450,
  "page": 1,
  "limit": 10,
  "pages": 45
}
```

#### **POST /api/movimientos**
**Body:**
```json
{
  "propietarioId": 10,
  "vtaId": 5,
  "tipo": "CARGUE",
  "cantidad": 100,
  "notas": "..."
}
```

**Response:** Movimiento creado con ID

#### **PUT /api/movimientos/:id**
Similar a POST. Solo actualiza campos modificados.

#### **DELETE /api/movimientos/:id**
Elimina movimiento (soft delete con auditoria)

#### **GET /api/movimientos/:id/historial**
Timeline de cambios

---

## 📝 Changelog

### v1.8.0 (2026-04-12)
**Performance & Code Quality Audit (Phases 20-30)**

✅ **Backend Optimizations:**
- Graceful shutdown con cleanup de conexiones en `server.js`
- Stack trace stripping en producción (`errorHandler.js`)
- Batch INSERT con params indexados (`movimientosRepository.js`)

✅ **Frontend Optimizations:**
- React.memo() en PageHeader, StatCard, HistorialDialog (3 componentes)
- useCallback en 15+ event handlers (AppLayout, MovimientosPage, MovimientosFilters)
- useMemo en cálculos costosos (filteredItems, secondaryCount, activePreset, chips)
- Module-level constants para estabilidad (isIdEqual, toggleableCols, Popover configs)
- MovimientoRow extraído como component memoized
- formDataRef pattern para form handling estable

✅ **CSS/Design Tokens:**
- 26 semantic color tokens en `theme.js`
- Reemplazo de valores hardcoded rgba en 9 componentes
- 0 valores rgba fuera de theme.js

✅ **Code Cleanup:**
- HistorialPage.jsx eliminado (reemplazado por HistorialDialog)
- 3 placeholder READMEs removidos
- console.error removido de ErrorBoundary
- date.js functions un-exported (internas solamente)

✅ **Verification:**
- 77/77 functional checks PASS (backend 18, frontend 59)
- Build: 1019 modules, 0 errors
- Terser minification activo: drop_console + drop_debugger

---

### v1.7.1 (2026-04-12)
**UI/UX Refinements**

- MovimientosTable: doble-clic auto-fit columnas
- Filter bar: overflow fixes, reduced date presets
- Form: JSX comment fixes
- Reset filters icon
- Autocomplete: removed saved filters

---

### v1.7.0 (2026-04-11)
**SaaS UI Overhaul**

- Global: IBM Plex Sans font, borderRadius 8, custom shadows
- AppLayout: nav con items redondeados y transiciones
- MovimientosPage: split layout 30/70 (Filtros | Tabla)
- MovimientosFilters: barra compacta con presets, Autocomplete
- MovimientoForm: Autocomplete para propietario y VTA
- MovimientosTable: redimensionamiento, skeleton loading, densidad
- Snackbar toast system
- Fixes: sticky thead, viewport without page scroll

---

### v1.6.0 (2026-03-15)
**Propietarios y VTA Enhancement**

- NIT field en Propietarios
- 49 propietarios reales cargados desde Excel
- Select tipo CARGUE/DESCARGUE
- Mismos VTAs por propietario

---

### v1.5.2
**Table Optimization**

- Removed tarifa y usuario columns de movimientos

---

### v1.5.1 (2026-02-20)
**Layout Visual Optimization**

- Padding y spacing refinements
- Tabla full-width sin scroll
- Responsive improvements

---

### v1.5.0
**Performance Optimizations**

- Code splitting por rutas
- Excel streaming
- Compound indexes en BD
- React.memo
- Vite chunks optimization

---

### v1.4.0
**Production Audit**

- JWT validation
- Global rate limiter
- Password crypto (bcrypt)
- COUNT OVER analytics
- Graceful shutdown
- ErrorBoundary

---

### v1.3.0
**ERP Sidebar y Responsive**

- Collapsible sidebar
- Responsive table
- Timezone fixes

---

---

## 🔐 Seguridad

- ✅ SQL injection: 0 posible (100% parametrizado)
- ✅ XSS: React escapa por defecto + Zod validation
- ✅ CSRF: JWT stateless, no cookies
- ✅ CORS: Configurado en origen
- ✅ Passwords: bcrypt + salt 10
- ✅ Rate limiting: 10 requests / 15 segundos por IP
- ✅ Tokens: JWT con expiry 24h
- ✅ Roles: RBAC enforcement en backend + frontend

---

## 📊 Arquitectura de Datos

```sql
-- Tablas principales
Propietarios (id, nombre, nit, ...)
VTAs (id, nombre, propietarioId, ...)
Movimientos (id, propietarioId, vtaId, tipo, cantidad, fechaCreacion, usuarioCreacion, ...)
HistorialMovimientos (id, movimientoId, campo, valorAnterior, valorNuevo, usuarioModificacion, fechaModificacion)
Usuarios (id, email, passwordHash, nombre, rol, fechaCreacion, ...)
```

---

## 🚀 Deployment

### Build Production
```bash
npm run build
```

Genera `dist/` en frontend con assets minificados y optimizados.

### Environment en Producción
```env
NODE_ENV=production
IS_PRODUCTION=true
JWT_SECRET=<long-secret-key>
DATABASE=facturacion_prod
PORT=80 (o reverse proxy)
```

### Servidor
- Node.js + Express escucha en puerto (default 3000)
- Frontend servido desde CDN o Nginx static
- Base de datos SQL Server con backups programados

---

## 👥 Contribución

1. Create feature branch desde `master`
2. Implement cambios
3. Commit con mensajes descriptivos
4. Push y crear PR para review

---

**Última actualización:** v1.8.0 | Compilado desde 30 fases de desarrollo con todas las optimizaciones y auditorías integradas.
#   F a c t u r a c i o n  
 