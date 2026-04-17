SET NOCOUNT ON;
GO

-- Verificar que todas las tablas fueron creadas
PRINT '=== VERIFICACIÓN DE TABLAS ===';
SELECT name
FROM sys.tables
WHERE name IN (N'Usuarios', N'Propietarios', N'VTAs', N'Tarifas', N'RefreshTokens', N'Movimientos', N'Logs', N'Jobs')
ORDER BY name;
GO

-- Verificar foreign keys
PRINT '=== VERIFICACIÓN DE FOREIGN KEYS ===';
SELECT
    fk.name AS foreign_key_name,
    OBJECT_NAME(fk.parent_object_id) AS parent_table,
    OBJECT_NAME(fk.referenced_object_id) AS referenced_table
FROM sys.foreign_keys fk
WHERE OBJECT_NAME(fk.parent_object_id) IN (N'VTAs', N'Tarifas', N'RefreshTokens', N'Movimientos', N'Logs', N'Jobs')
ORDER BY parent_table, foreign_key_name;
GO

-- Verificar índices principales
PRINT '=== VERIFICACIÓN DE ÍNDICES ===';
SELECT
    OBJECT_NAME(i.object_id) AS table_name,
    i.name AS index_name,
    i.type_desc AS index_type
FROM sys.indexes i
WHERE OBJECT_NAME(i.object_id) IN (N'Usuarios', N'Propietarios', N'VTAs', N'Tarifas', N'RefreshTokens', N'Movimientos', N'Logs', N'Jobs')
  AND i.name IS NOT NULL
ORDER BY table_name, index_name;
GO

-- Verificar columnas críticas
PRINT '=== VERIFICACIÓN DE COLUMNAS ===';
SELECT
    OBJECT_NAME(c.object_id) AS table_name,
    c.name AS column_name,
    TYPE_NAME(c.user_type_id) AS data_type
FROM sys.columns c
WHERE OBJECT_NAME(c.object_id) IN (N'VTAs', N'Movimientos', N'RefreshTokens', N'Tarifas')
  AND c.name IN (N'ceco', N'version', N'familia', N'tipovta', N'udmvta', N'tarifa', N'total', N'nit')
ORDER BY table_name, column_name;
GO
