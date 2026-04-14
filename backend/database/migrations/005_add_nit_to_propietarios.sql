SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

-- ============================================================
-- MIGRACIÓN 005 — Columna NIT en Propietarios
-- ============================================================

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.Propietarios') AND name = N'nit'
)
    ALTER TABLE dbo.Propietarios
        ADD nit NVARCHAR(50) NULL;
GO
