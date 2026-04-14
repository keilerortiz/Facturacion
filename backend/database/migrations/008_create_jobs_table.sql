-- Migration 008: Create Jobs table for async task processing
-- Tracks background jobs (exports, etc.) with status and results

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
SET XACT_ABORT ON;
GO

BEGIN TRANSACTION;
GO

IF OBJECT_ID(N'dbo.Jobs', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Jobs (
        id NVARCHAR(64) NOT NULL,
        tipo NVARCHAR(50) NOT NULL,
        estado NVARCHAR(20) NOT NULL
            CONSTRAINT DF_Jobs_Estado DEFAULT 'pending',
        progreso INT NOT NULL
            CONSTRAINT DF_Jobs_Progreso DEFAULT 0,
        resultado NVARCHAR(MAX) NULL,
        error NVARCHAR(1000) NULL,
        usuario_id INT NOT NULL,
        usuario NVARCHAR(100) NOT NULL,
        parametros NVARCHAR(MAX) NULL,
        archivo NVARCHAR(500) NULL,
        fecha_creacion DATETIME2 NOT NULL
            CONSTRAINT DF_Jobs_FechaCreacion DEFAULT SYSUTCDATETIME(),
        fecha_inicio DATETIME2 NULL,
        fecha_fin DATETIME2 NULL,
        CONSTRAINT PK_Jobs PRIMARY KEY (id),
        CONSTRAINT CK_Jobs_Estado CHECK (estado IN ('pending', 'processing', 'completed', 'failed')),
        CONSTRAINT FK_Jobs_Usuario FOREIGN KEY (usuario_id)
            REFERENCES dbo.Usuarios (id)
    );

    CREATE NONCLUSTERED INDEX IX_Jobs_UsuarioId_FechaCreacion
    ON dbo.Jobs (usuario_id, fecha_creacion DESC);

    CREATE NONCLUSTERED INDEX IX_Jobs_Estado
    ON dbo.Jobs (estado)
    INCLUDE (tipo, fecha_creacion);
END;
GO

COMMIT TRANSACTION;
GO
