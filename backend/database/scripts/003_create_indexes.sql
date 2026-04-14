SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_VTAs_PropietarioCodigo' AND object_id = OBJECT_ID(N'dbo.VTAs'))
    CREATE NONCLUSTERED INDEX IX_VTAs_PropietarioCodigo ON dbo.VTAs (propietario_id ASC, codigo ASC) INCLUDE (nombre);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Tarifas_PropietarioVtaActiva' AND object_id = OBJECT_ID(N'dbo.Tarifas'))
    CREATE NONCLUSTERED INDEX IX_Tarifas_PropietarioVtaActiva ON dbo.Tarifas (propietario_id ASC, vta_id ASC, activa ASC, vigente_desde DESC) INCLUDE (valor, moneda, vigente_hasta);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_RefreshTokens_UsuarioRevocado' AND object_id = OBJECT_ID(N'dbo.RefreshTokens'))
    CREATE NONCLUSTERED INDEX IX_RefreshTokens_UsuarioRevocado ON dbo.RefreshTokens (usuario_id ASC, revocado_en ASC, expira_en ASC);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Movimientos_Fecha' AND object_id = OBJECT_ID(N'dbo.Movimientos'))
    CREATE NONCLUSTERED INDEX IX_Movimientos_Fecha ON dbo.Movimientos (fecha DESC) INCLUDE (propietario_id, vta_id, cantidad, usuario_creacion_id, fecha_creacion);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Movimientos_PropietarioId' AND object_id = OBJECT_ID(N'dbo.Movimientos'))
    CREATE NONCLUSTERED INDEX IX_Movimientos_PropietarioId ON dbo.Movimientos (propietario_id ASC, fecha DESC) INCLUDE (vta_id, cantidad, usuario_creacion_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Movimientos_VtaId' AND object_id = OBJECT_ID(N'dbo.Movimientos'))
    CREATE NONCLUSTERED INDEX IX_Movimientos_VtaId ON dbo.Movimientos (vta_id ASC, fecha DESC) INCLUDE (propietario_id, cantidad, usuario_creacion_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Movimientos_UsuarioCreacion' AND object_id = OBJECT_ID(N'dbo.Movimientos'))
    CREATE NONCLUSTERED INDEX IX_Movimientos_UsuarioCreacion ON dbo.Movimientos (usuario_creacion_id ASC, fecha_creacion DESC) INCLUDE (fecha, propietario_id, vta_id, cantidad);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Logs_MovimientoFecha' AND object_id = OBJECT_ID(N'dbo.Logs'))
    CREATE NONCLUSTERED INDEX IX_Logs_MovimientoFecha ON dbo.Logs (movimiento_id ASC, fecha DESC) INCLUDE (campo, usuario);
GO
