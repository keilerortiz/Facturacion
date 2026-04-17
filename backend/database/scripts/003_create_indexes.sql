SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

-- ── Indices consolidados de migraciones 003, 006, 009 ───────────────────────────

-- Catálogos (Propietarios, VTAs)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Propietarios_Nombre' AND object_id = OBJECT_ID(N'dbo.Propietarios'))
    CREATE NONCLUSTERED INDEX IX_Propietarios_Nombre ON dbo.Propietarios (nombre ASC);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_VTAs_Propietario_Codigo_Nombre' AND object_id = OBJECT_ID(N'dbo.VTAs'))
    CREATE NONCLUSTERED INDEX IX_VTAs_Propietario_Codigo_Nombre ON dbo.VTAs (propietario_id ASC, codigo ASC, nombre ASC) INCLUDE (tipovta, udmvta, requiere_tipo);
GO

-- Tarifas (búsquedas activas por vigencia)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Tarifas_PropietarioVtaActiva' AND object_id = OBJECT_ID(N'dbo.Tarifas'))
    CREATE NONCLUSTERED INDEX IX_Tarifas_PropietarioVtaActiva ON dbo.Tarifas (propietario_id ASC, vta_id ASC, activa ASC, vigente_desde DESC) INCLUDE (valor, moneda, vigente_hasta);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Tarifas_ActivaLookup_Vigencia' AND object_id = OBJECT_ID(N'dbo.Tarifas'))
    CREATE NONCLUSTERED INDEX IX_Tarifas_ActivaLookup_Vigencia ON dbo.Tarifas (propietario_id ASC, vta_id ASC, vigente_desde DESC, id DESC) INCLUDE (valor, moneda, vigente_hasta) WHERE activa = 1;
GO

-- RefreshTokens (autenticación, token lookup, rotación, limpieza)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_RefreshTokens_TokenHash' AND object_id = OBJECT_ID(N'dbo.RefreshTokens'))
    CREATE NONCLUSTERED INDEX IX_RefreshTokens_TokenHash ON dbo.RefreshTokens (token_hash) INCLUDE (usuario_id, expira_en, revocado_en, familia);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_RefreshTokens_UsuarioId_ExpiraEn' AND object_id = OBJECT_ID(N'dbo.RefreshTokens'))
    CREATE NONCLUSTERED INDEX IX_RefreshTokens_UsuarioId_ExpiraEn ON dbo.RefreshTokens (usuario_id, expira_en) INCLUDE (revocado_en);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_RefreshTokens_UsuarioRevocado' AND object_id = OBJECT_ID(N'dbo.RefreshTokens'))
    CREATE NONCLUSTERED INDEX IX_RefreshTokens_UsuarioRevocado ON dbo.RefreshTokens (usuario_id ASC, revocado_en ASC, expira_en ASC);
GO

-- Movimientos (búsquedas por fecha, propietario, VTA, usuario creación)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Movimientos_Fecha_Id' AND object_id = OBJECT_ID(N'dbo.Movimientos'))
    CREATE NONCLUSTERED INDEX IX_Movimientos_Fecha_Id ON dbo.Movimientos (fecha DESC, id DESC) INCLUDE (
        decada,
        propietario_id,
        vta_id,
        cantidad,
        tarifa,
        total,
        tipovta,
        usuario_creacion_id,
        usuario_modificacion_id,
        fecha_creacion,
        fecha_modificacion,
        version
    );
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

-- Logs (auditoría)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Logs_MovimientoFecha' AND object_id = OBJECT_ID(N'dbo.Logs'))
    CREATE NONCLUSTERED INDEX IX_Logs_MovimientoFecha ON dbo.Logs (movimiento_id ASC, fecha DESC) INCLUDE (campo, usuario);
GO
