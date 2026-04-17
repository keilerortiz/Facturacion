# Análisis: Integración de Migraciones en Scripts

**Fecha:** 2026-04-17  
**Estado:** ANÁLISIS (sin ejecución)

---

## 1. Estado Actual

### Estructura Existente

**Scripts** (`backend/database/scripts/`):
- `000_create_database.sql` - Creación de BD (5 líneas)
- `001_create_tables.sql` - Definición de tablas base (108 líneas)
- `002_create_constraints_relationships.sql` - Constraints y FKs (133 líneas)
- `003_create_indexes.sql` - Índices iniciales (36 líneas)
- `004_verify_integrity.sql` - Verificación (17 líneas)

**Migraciones** (`backend/database/migrations/`):
- `001_initial_schema.sql` - Consolidado (277 líneas, copia de 001+002+003)
- `002_add_tipovta_udmvta_tarifa_total.sql` - Agregar columnas (55 líneas)
- `003_add_performance_indexes.sql` - Índices (38 líneas)
- `004_add_requiere_tipo_tipovta.sql` - Lógica nuevo tipo (58 líneas)
- `005_add_nit_to_propietarios.sql` - Agregar NIT (16 líneas)
- `006_refresh_token_indexes_familia.sql` - Índices JWT (50 líneas)
- `007_add_version_optimistic_locking.sql` - Versionado (23 líneas)
- `008_create_jobs_table.sql` - Nueva tabla (49 líneas)
- `009_add_scalability_indexes.sql` - Índices escalabilidad (79 líneas)
- `010_add_consultor_role.sql` - Nuevo rol (38 líneas)
- `011_add_ceco_to_vtas.sql` - CECO (40 líneas)

**Total:** 1022 líneas distribuidas en 16 archivos

---

## 2. Análisis de Viabilidad

### Opción A: Integración Completa (Recomendada)

**Objetivo:** Consolidar todas las migraciones (002-011) en los scripts de setup.

#### Ventajas:
- ✅ **Setup más simple:** Un usuario nuevo solo ejecuta scripts/, no necesita migraciones
- ✅ **Coherencia:** Sistema tiene única fuente de verdad para estructura base
- ✅ **Desempeño:** Setup inicial más eficiente (menos transacciones separadas)
- ✅ **Mantenibilidad:** Migraciones 002-011 quedan como historial documentado

#### Desventajas:
- ⚠️ **Historial perdido:** Las migraciones 002-011 pasan de ser "cambios aplicados" a "historial"
- ⚠️ **Control de versiones:** Se pierde trazabilidad de cuándo se introdujo cada cambio
- ⚠️ **Rollback:** No hay forma de "deshacer" migraciones si se necesitara

#### Cómo hacerlo:

1. **Actualizar `scripts/001_create_tables.sql`:**
   - Agregar columnas de todas las migraciones (tipovta, udmvta, nit, ceco, version, etc.)
   - Usar `ALTER TABLE ... ADD ... IF NOT EXISTS` para seguridad

2. **Actualizar `scripts/002_create_constraints_relationships.sql`:**
   - Agregar constraints nuevas de todas las migraciones
   - Agregar cualquier ALTER TABLE de constraints

3. **Actualizar `scripts/003_create_indexes.sql`:**
   - Consolidar todos los índices (003, 006, 009)
   - Eliminar duplicados

4. **Crear nueva tabla `scripts/004_create_jobs_table.sql`:**
   - Mover contenido de migración 008

5. **Mover `scripts/004_verify_integrity.sql` → `scripts/005_verify_integrity.sql`**

6. **Mantener migraciones como referencia:**
   - Renombrar directorio a `migrations_archive/`
   - O mantener solo `001_initial_schema.sql` como documentación

---

### Opción B: Integración Parcial

**Objetivo:** Consolidar solo migraciones "estructurales" (002-008), mantener 009-011 como migraciones vivas.

#### Ventajas:
- ✅ Mejor que actual, menos complejidad inicial
- ✅ Preserva migraciones recientes
- ✅ Punto de equilibrio

#### Desventajas:
- ⚠️ Sistema de dos velocidades (scripts + migraciones)
- ⚠️ Confuso para nuevos desarrolladores

---

### Opción C: No Integrar

**Objetivo:** Mantener status quo (scripts para setup inicial, migraciones para cambios posteriores).

#### Ventajas:
- ✅ Historial completo preservado
- ✅ No requiere refactor
- ✅ Seguro, bajo riesgo

#### Desventajas:
- ❌ Usuario nuevo debe entender dos sistemas
- ❌ Redund ancia (001_initial_schema.sql vs scripts/001-003)
- ❌ Mantenimiento: cambios en dos lugares

---

## 3. Análisis Técnico de Factibilidad

### Cambios que se pueden integrar fácilmente:

✅ **Columnas nuevas:**
- tipovta, udmvta, tarifa, total (002)
- nit (005)
- ceco (011)
- version (007)

✅ **Constraints:**
- Todos los CHECK, DEFAULT, UNIQUE

✅ **Índices:**
- Todos pueden consolidarse (solo son CREATE INDEX)

✅ **Tablas nuevas:**
- Jobs (008)

### Cambios que requieren cuidado:

⚠️ **Roles SQL Server:**
- Migración 010 modifica CHECK constraint en Usuarios
- **Acción:** Actualizar constraint CHECK en scripts/002

⚠️ **Índices con duplicados:**
- Algunas migraciones crean índices idénticos/similares
- **Acción:** Deduplicar antes de consolidar

⚠️ **Orden de ejecución:**
- Migraciones tienen dependencias (ej: 002 antes que 003)
- **Acción:** Respetar orden en scripts consolidados

---

## 4. Plan de Integración Propuesto (Opción A)

### Paso 1: Actualizar Scripts

```
scripts/001_create_tables.sql:
  - Agregar todas las columnas nuevas (tipovta, udmvta, nit, ceco, version)
  - Usar IF NOT EXISTS para cada columna
  - Consolidar tablas de todas las migraciones (Jobs de 008)

scripts/002_create_constraints_relationships.sql:
  - Agregar constraints nuevas (roles 'consultor', etc)
  - Actualizar CHECK constraints (Usuarios.rol)
  - Mantener mismo patrón de IF NOT EXISTS

scripts/003_create_indexes.sql:
  - Consolidar índices (003, 006, 009)
  - Eliminar duplicados
  - Mantener mismo patrón

scripts/004_create_jobs_table.sql: (NUEVO)
  - Mover CREATE TABLE Jobs (de migración 008)

scripts/005_verify_integrity.sql:
  - Renombrado de 004
```

### Paso 2: Documentación

```
README.md (ACTUALIZAR):
  - Explicar que scripts/ = setup inicial completo
  - Migración histórica documentada en migrations/
  - Hacer referencia a migrations/001_initial_schema.sql como comparación
```

### Paso 3: Gestión de Migraciones

**Opción A1:** Archivar migraciones
```
migrations_archive/
  - 002_add_tipovta_udmvta_tarifa_total.sql
  - ...
  - 011_add_ceco_to_vtas.sql
  
migrations/
  - 001_initial_schema.sql (referencia)
```

**Opción A2:** Mantener migraciones en su lugar
```
- Documentar en README que 002-011 están integradas en scripts/
- Migraciones sirven como histórico y documentación
```

---

## 5. Impacto en Flujos Actuales

### Setup de nueva BD:
```
ACTUAL:
  1. scripts/000,001,002,003,004
  2. O alternativamente: migrations/001_initial_schema.sql
  3. Luego: migrations/002-011 manualmente

DESPUÉS:
  1. scripts/000,001,002,003,004,005
  2. ¡Listo! (estructura completa)
  3. Migraciones sirven solo como referencia histórica
```

### Desarrollo local:
```
ACTUAL:
  - Ejecutar setupDatabase.js que corre migraciones

DESPUÉS:
  - Ejecutar setupDatabase.js que corre scripts/ (o solo 001_initial_schema)
  - No cambia para el desarrollador
```

### CI/CD (si existe):
```
- No requiere cambios si ya usa migrations/001_initial_schema.sql
- O se actualiza para usar scripts/
```

---

## 6. Riesgos y Mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|--------|-----------|
| Introducir BUG en consolidación | Media | Alto | Revisar línea por línea, usar diff visual |
| Perder historial de cambios | Baja | Bajo | Mantener migración 001 como comparación |
| Inconsistencia en orden | Media | Medio | Documentar orden explícitamente |
| Duplicar índices | Alta | Bajo | Validar índices antes/después |
| Romper scripts existentes | Baja | Alto | Usar IF NOT EXISTS extensivamente |

---

## 7. Recomendación Final

### **RECOMENDACIÓN: Implementar Opción A (Integración Completa)**

**Razones:**
1. Sistema más limpio para usuarios nuevos
2. Reduce complejidad (un lugar para estructura de BD)
3. Migraciones siguen documentadas como historial
4. Bajo riesgo técnico (cambios simples, estructurales)
5. Mejora mantenibilidad a largo plazo

**Timing:**
- ✅ Buen momento ahora (después de v2.4, línea base stablecida)
- ✅ Antes de que haya más migraciones

**Esfuerzo estimado:**
- 2-3 horas de trabajo manual
- 1 hora de testing

**Pasos a ejecutar (cuando se apruebe):**
1. Crear rama `refactor/consolidate-migrations`
2. Actualizar scripts/001,002,003
3. Crear scripts/004 (jobs table)
4. Actualizar README
5. Prueba en BD limpia
6. PR y review

---

## 8. Archivos a Modificar

```
backend/database/scripts/
  ├── 001_create_tables.sql          [MODIFICAR - consolidar columnas]
  ├── 002_create_constraints_relationships.sql [MODIFICAR - consolidar constraints]
  ├── 003_create_indexes.sql         [MODIFICAR - consolidar índices]
  ├── 004_create_jobs_table.sql      [CREAR - nuevo archivo]
  ├── 005_verify_integrity.sql       [RENOMBRAR de 004]
  └── README.md                       [ACTUALIZAR - explicar consolidación]

backend/database/migrations/
  ├── 001_initial_schema.sql         [MANTENER - referencia]
  ├── 002-011_*.sql                  [OPCIONAL: mover a migrations_archive/]
  └── README.md                       [ACTUALIZAR - mencionar consolidación]
```

---

**Estado:** ANÁLISIS COMPLETADO - Listo para implementar si se aprueba.
