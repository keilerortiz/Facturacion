-- Migration 009: Additional indexes for catalog/frequent lookup performance

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
SET XACT_ABORT ON;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_Propietarios_Nombre'
      AND object_id = OBJECT_ID(N'dbo.Propietarios')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Propietarios_Nombre
    ON dbo.Propietarios (nombre ASC);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_VTAs_Propietario_Codigo_Nombre'
      AND object_id = OBJECT_ID(N'dbo.VTAs')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_VTAs_Propietario_Codigo_Nombre
    ON dbo.VTAs (propietario_id ASC, codigo ASC, nombre ASC)
    INCLUDE (tipovta, udmvta, requiere_tipo);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_Tarifas_ActivaLookup_Vigencia'
      AND object_id = OBJECT_ID(N'dbo.Tarifas')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Tarifas_ActivaLookup_Vigencia
    ON dbo.Tarifas (propietario_id ASC, vta_id ASC, vigente_desde DESC, id DESC)
    INCLUDE (valor, moneda, vigente_hasta)
    WHERE activa = 1;
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_Movimientos_Fecha_Id'
      AND object_id = OBJECT_ID(N'dbo.Movimientos')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Movimientos_Fecha_Id
    ON dbo.Movimientos (fecha DESC, id DESC)
    INCLUDE (
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
END;
GO

COMMIT TRANSACTION;
GO
