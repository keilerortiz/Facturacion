SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
SET XACT_ABORT ON;
GO

BEGIN TRANSACTION;
GO

-- ============================================================
-- Migration 002 — Add tipovta / udmvta to VTAs
--                 Add tarifa / total  to Movimientos
-- ============================================================

-- VTAs: tipo de venta y unidad de medida
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.VTAs') AND name = N'tipovta'
)
BEGIN
    ALTER TABLE dbo.VTAs ADD tipovta NVARCHAR(50) NULL;
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.VTAs') AND name = N'udmvta'
)
BEGIN
    ALTER TABLE dbo.VTAs ADD udmvta NVARCHAR(50) NULL;
END;
GO

-- Movimientos: tarifa aplicada en el momento de la carga y total calculado
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.Movimientos') AND name = N'tarifa'
)
BEGIN
    ALTER TABLE dbo.Movimientos ADD tarifa DECIMAL(18,2) NULL;
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.Movimientos') AND name = N'total'
)
BEGIN
    ALTER TABLE dbo.Movimientos ADD total DECIMAL(18,2) NULL;
END;
GO

COMMIT TRANSACTION;
GO
