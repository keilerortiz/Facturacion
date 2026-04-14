# Changelog

## [2.0.0] - 2026-04-13
### Optimización de endpoints y orquestación frontend
- **Backend**: endpoint agregador `GET /movimientos/init` (propietarios + primera página en un solo request)
- **Backend**: caché de usuario en `authMiddleware` vía Redis (TTL 2 min) — elimina query SQL por cada request autenticado
- **Frontend**: `deduplicatedFetch` — deduplicación de requests concurrentes (protección contra React StrictMode y race conditions)
- **Frontend**: `movimientosStore` — store singleton pub/sub para compartir datos de `/init` entre páginas sin llamadas adicionales
- **Frontend**: `AbortController` en `loadMovimientos` — cancela requests en vuelo al cambiar filtros
- **Frontend**: `handleEdit` elimina la llamada a `GET /movimientos/:id` — usa datos del row directamente
- **Frontend**: `DashboardPage` ya no llama a `/api/movimientos` — consume datos del store
- **Frontend**: `AuthContext` bootstrap usa `deduplicatedFetch` para `/auth/validate` y `/auth/refresh`
- **Frontend**: invalidación de caché de tarifas tras create/update

## [0.2.0] - 2026-04-13
### Estado: Antes de la optimización de los endpoints y la orquestación
- Versión base funcional con implementación inicial
- Sistema de autenticación con JWT
- Gestión de movimientos de inventario
- Sistema de jobs con Redis
- Control de acceso basado en roles (RBAC)

## [0.1.0] - Inicial
- Configuración inicial del monorepo
- Setup de frontend con React y Vite
- Setup de backend con Express
- Estructura de carpetas base
