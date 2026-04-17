# SQL Scripts - Setup Inicial Completo

## Orden de Ejecución

Ejecutar en este orden para crear la base de datos con **estructura completa**:

1. `000_create_database.sql` - Creación de la base de datos
2. `001_create_tables.sql` - Todas las tablas (incluyendo Jobs)
3. `002_create_constraints_relationships.sql` - Constraints, defaults, FKs
4. `003_create_indexes.sql` - Todos los índices para optimización
5. `004_verify_integrity.sql` - Verificación de integridad (opcional)

## Contenido Consolidado

Estos scripts incluyen la estructura completa resultante de **todas las migraciones 002-011**:

### Tablas
- `Usuarios` - Autenticación y gestión de usuarios
- `Propietarios` - Catálogo de propietarios
- `VTAs` - Puntos de venta (con `tipovta`, `udmvta`, `requiere_tipo`, `ceco`)
- `Tarifas` - Tarifación de servicios
- `RefreshTokens` - Tokens JWT con rotación (familia tracking)
- `Movimientos` - Registro de movimientos (con `tipovta`, `tarifa`, `total`, `version`)
- `Logs` - Auditoría de cambios
- `Jobs` - Cola de trabajos asincronos

### Cobertura
- ✅ Todas las tablas del sistema
- ✅ Relaciones y claves foráneas (FK) nombradas
- ✅ Constraints: `CHECK`, `DEFAULT`, `UNIQUE`
- ✅ Índices de optimización para autenticación, búsquedas y auditoría
- ✅ Versionado optimista (optimistic locking)
- ✅ Soporte para múltiples roles (`admin`, `operador`, `consultor`)
- ✅ Integridad referencial entre VTAs y Propietarios

## Migraciones Históricas

Las migraciones originales (002-011) se mantienen en `../migrations/` como **referencia histórica** de cómo se construyó la estructura actual. No necesitan ejecutarse en nuevas instalaciones.

## Alternativa: Archivo Consolidado

Para un setup de una sola ejecución, ver:
- `..\migrations\001_initial_schema.sql` - Versión previa consolidada
