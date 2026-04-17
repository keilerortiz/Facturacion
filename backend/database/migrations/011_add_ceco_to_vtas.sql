SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
SET XACT_ABORT ON;
GO

BEGIN TRANSACTION;
GO

-- Agregar columna CECO (Centro de Costos) a tabla VTAs
IF OBJECT_ID(N'dbo.VTAs', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'VTAs' AND COLUMN_NAME = 'ceco'
    )
    BEGIN
        ALTER TABLE dbo.VTAs ADD ceco NVARCHAR(50) NULL;
        PRINT 'Columna ceco agregada a tabla VTAs';
    END
    ELSE
    BEGIN
        PRINT 'La columna ceco ya existe en tabla VTAs';
    END
END
GO

-- Agregar constraint para validar CECO (no vacío si está presente)
IF OBJECT_ID(N'CK_VTAs_CECO_NotBlank', N'C') IS NULL
    ALTER TABLE dbo.VTAs ADD CONSTRAINT CK_VTAs_CECO_NotBlank CHECK (ceco IS NULL OR LEN(LTRIM(RTRIM(ceco))) > 0);
GO

-- Crear índice para búsquedas por CECO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_VTAs_CECO' AND object_id = OBJECT_ID(N'dbo.VTAs'))
    CREATE NONCLUSTERED INDEX IX_VTAs_CECO ON dbo.VTAs (ceco ASC) INCLUDE (id, propietario_id, codigo, nombre);
GO

COMMIT TRANSACTION;
GO
