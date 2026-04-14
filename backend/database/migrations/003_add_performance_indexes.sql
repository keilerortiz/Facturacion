-- Migration 003: Performance indexes for common query patterns
-- Date: 2025-01-01
-- Description: Add compound indexes to optimize filtered queries and lookups

USE MovimientosDB;
GO

-- Index for filtered listing by propietario + fecha (most common query pattern)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Movimientos_propietario_fecha' AND object_id = OBJECT_ID('Movimientos'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Movimientos_propietario_fecha
    ON Movimientos (propietario_id, fecha DESC)
    INCLUDE (cantidad, tarifa, total);
    PRINT 'Created IX_Movimientos_propietario_fecha';
END
GO

-- Index for VTA lookup within propietario context
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Movimientos_propietario_vta' AND object_id = OBJECT_ID('Movimientos'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Movimientos_propietario_vta
    ON Movimientos (propietario_id, vta_id)
    INCLUDE (fecha, cantidad, tarifa, total);
    PRINT 'Created IX_Movimientos_propietario_vta';
END
GO

-- Index for active tarifa lookups (used in every movimiento creation/update)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Tarifas_lookup' AND object_id = OBJECT_ID('Tarifas'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Tarifas_lookup
    ON Tarifas (propietario_id, vta_id, activa)
    INCLUDE (valor);
    PRINT 'Created IX_Tarifas_lookup';
END
GO

PRINT 'Migration 003 completed successfully';
