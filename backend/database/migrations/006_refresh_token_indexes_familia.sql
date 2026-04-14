-- Migration 006: Add index and family tracking to RefreshTokens
-- Supports efficient token lookup, rotation detection, and cleanup

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
SET XACT_ABORT ON;
GO

BEGIN TRANSACTION;
GO

-- Add familia column for token rotation detection (reuse = compromise)
-- MUST be added before indexes can reference it
IF COL_LENGTH(N'dbo.RefreshTokens', N'familia') IS NULL
BEGIN
    ALTER TABLE dbo.RefreshTokens
    ADD familia NVARCHAR(64) NULL;
END;
GO

-- Index for fast token lookup by hash (used on every /auth/refresh call)
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_RefreshTokens_TokenHash'
      AND object_id = OBJECT_ID(N'dbo.RefreshTokens')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_RefreshTokens_TokenHash
    ON dbo.RefreshTokens (token_hash)
    INCLUDE (usuario_id, expira_en, revocado_en, familia);
END;
GO

-- Index for fast cleanup of expired/revoked tokens per user
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_RefreshTokens_UsuarioId_ExpiraEn'
      AND object_id = OBJECT_ID(N'dbo.RefreshTokens')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_RefreshTokens_UsuarioId_ExpiraEn
    ON dbo.RefreshTokens (usuario_id, expira_en)
    INCLUDE (revocado_en);
END;
GO

COMMIT TRANSACTION;
GO
