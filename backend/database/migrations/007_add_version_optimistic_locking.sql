-- Migration 007: Add version column to Movimientos for optimistic locking
-- Prevents concurrent overwrites by requiring version match on UPDATE

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
SET XACT_ABORT ON;
GO

BEGIN TRANSACTION;
GO

-- Add version column with default 1 for all existing rows
IF COL_LENGTH(N'dbo.Movimientos', N'version') IS NULL
BEGIN
    ALTER TABLE dbo.Movimientos
    ADD version INT NOT NULL CONSTRAINT DF_Movimientos_Version DEFAULT 1;
END;
GO

COMMIT TRANSACTION;
GO
