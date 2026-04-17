SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
SET XACT_ABORT ON;
GO

BEGIN TRANSACTION;
GO

-- ============================================================
-- Migration 011 — Add CECO (Centro de Costo) to Tarifas
-- ============================================================

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.Tarifas') AND name = N'ceco'
)
BEGIN
    ALTER TABLE dbo.Tarifas ADD ceco NVARCHAR(100) NULL;
    PRINT 'Added column ceco to Tarifas table';
END;
GO

COMMIT TRANSACTION;
GO

PRINT 'Migration 011 completed successfully — CECO column added to Tarifas';
