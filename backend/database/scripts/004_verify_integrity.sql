SET NOCOUNT ON;
GO

SELECT name
FROM sys.tables
WHERE name IN (N'Usuarios', N'Propietarios', N'VTAs', N'Tarifas', N'RefreshTokens', N'Movimientos', N'Logs')
ORDER BY name;
GO

SELECT
    fk.name AS foreign_key_name,
    OBJECT_NAME(fk.parent_object_id) AS parent_table,
    OBJECT_NAME(fk.referenced_object_id) AS referenced_table
FROM sys.foreign_keys fk
WHERE OBJECT_NAME(fk.parent_object_id) IN (N'VTAs', N'Tarifas', N'RefreshTokens', N'Movimientos', N'Logs')
ORDER BY parent_table, foreign_key_name;
GO
