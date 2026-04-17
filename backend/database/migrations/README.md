# Database Migrations (Histórico)

## Estado Actual

Las migraciones **002 a 011** han sido **consolidadas en los scripts de setup** (`../scripts/`) para simplificar la creación de nuevas bases de datos.

## Archivos en este Directorio

### Archivo Principal
- `001_initial_schema.sql` - Schema inicial consolidado (referencia histórica)

### Migraciones Históricas (Consolidadas en scripts/)
- `002_add_tipovta_udmvta_tarifa_total.sql` - ✅ Integrada en scripts/001 y 002
- `003_add_performance_indexes.sql` - ✅ Integrada en scripts/003
- `004_add_requiere_tipo_tipovta.sql` - ✅ Integrada en scripts/001 y 002
- `005_add_nit_to_propietarios.sql` - ✅ Integrada en scripts/001
- `006_refresh_token_indexes_familia.sql` - ✅ Integrada en scripts/001 y 003
- `007_add_version_optimistic_locking.sql` - ✅ Integrada en scripts/001 y 002
- `008_create_jobs_table.sql` - ✅ Integrada en scripts/001
- `009_add_scalability_indexes.sql` - ✅ Integrada en scripts/003
- `010_add_consultor_role.sql` - ✅ Integrada en scripts/002
- `011_add_ceco_to_vtas.sql` - ✅ Integrada en scripts/001 y 002

## Para Nuevas Instalaciones

**No ejecutar estas migraciones.** En su lugar, usar:
```bash
# Opción 1: Scripts modulares (recomendado)
scripts/000_create_database.sql
scripts/001_create_tables.sql
scripts/002_create_constraints_relationships.sql
scripts/003_create_indexes.sql

# Opción 2: Archivo consolidado único
migrations/001_initial_schema.sql
```

## Propósito de este Directorio

Este directorio se mantiene como:
1. **Referencia histórica** - Documentación de cómo evolucionó la estructura
2. **Control de versiones** - Trazabilidad de cambios
3. **Documentación** - Explicación de decisiones de diseño

## Para Desarrolladores

Si necesitas entender cómo se construyó la estructura actual, lee las migraciones en orden:
1. `001_initial_schema.sql` - Base inicial
2. `002_*.sql` a `011_*.sql` - Cambios incrementales

Ver también: `../ANALISIS_INTEGRACION_MIGRACIONES.md` para detalles de la consolidación.
