SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

-- ============================================================
-- MIGRACIÓN 004 — requiere_tipo en VTAs + tipovta en Movimientos
--
-- OBJETIVO 1: Marcar qué VTAs necesitan que el usuario elija
--             CARGUE o DESCARGUE al registrar un movimiento.
--
-- OBJETIVO 2: Permitir que los movimientos almacenen el tipo
--             elegido por el usuario (solo para VTAs con
--             requiere_tipo = 1).
--
-- CONSTRAINT ya existente y CORRECTO — no se modifica:
--   UQ_VTAs_PropietarioCodigo UNIQUE (propietario_id, codigo)
--   → Mismo codigo puede existir para distintos propietarios.
--   → No se permite duplicado dentro del mismo propietario.
-- ============================================================

-- FASE 1: Agregar requiere_tipo a VTAs -------------------
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.VTAs') AND name = N'requiere_tipo'
)
    ALTER TABLE dbo.VTAs
        ADD requiere_tipo BIT NOT NULL CONSTRAINT DF_VTAs_RequiereTipo DEFAULT 0;
GO

-- FASE 2: Agregar tipovta a Movimientos -----------------
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.Movimientos') AND name = N'tipovta'
)
    ALTER TABLE dbo.Movimientos
        ADD tipovta NVARCHAR(20) NULL;
GO

-- CHECK constraint: solo valores válidos o NULL
IF OBJECT_ID(N'CK_Movimientos_Tipovta', N'C') IS NULL
    ALTER TABLE dbo.Movimientos
        ADD CONSTRAINT CK_Movimientos_Tipovta
            CHECK (tipovta IS NULL OR tipovta IN (N'CARGUE', N'DESCARGUE'));
GO

-- ============================================================
-- PASO MANUAL (ejecutar según necesidad de negocio):
-- Marcar las VTAs que requieren selección de tipo por movimiento.
--
-- Ejemplo para VTA con código 'VTA019':
--   UPDATE dbo.VTAs SET requiere_tipo = 1 WHERE codigo = N'VTA019';
--
-- Para buscar VTAs por nombre parcial:
--   UPDATE dbo.VTAs
--   SET requiere_tipo = 1
--   WHERE nombre LIKE N'%CARGUE%' AND nombre LIKE N'%DESCARGUE%';
-- ============================================================
