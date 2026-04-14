# SQL Scripts

Orden sugerido de ejecucion:

1. `001_create_tables.sql`
2. `002_create_constraints_relationships.sql`
3. `003_create_indexes.sql`

Alternativa:

- `..\migrations\001_initial_schema.sql` contiene la version consolidada en un solo archivo.

Cobertura:

- tablas del sistema
- relaciones y claves foraneas nombradas
- constraints `CHECK`, `DEFAULT` y `UNIQUE`
- indices para autenticacion, filtros, consulta principal e historial
- integridad extra para asegurar que la `VTA` pertenezca al `Propietario`
