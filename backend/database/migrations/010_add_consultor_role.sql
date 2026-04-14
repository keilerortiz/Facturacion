-- ============================================================================
-- Migración 010: Agregar rol 'consultor' a los usuarios
-- ============================================================================
-- Describe: Actualiza el CHECK constraint de la tabla Usuarios para permitir
--           el nuevo rol 'consultor' además de 'admin' y 'operador'
-- ============================================================================

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- Verificar que la tabla Usuarios existe
IF OBJECT_ID(N'dbo.Usuarios', N'U') IS NULL
BEGIN
    PRINT '⚠ ERROR: La tabla dbo.Usuarios no existe.';
    PRINT '⚠ Ejecuta primero: backend/database/scripts/001_create_tables.sql';
    THROW 50000, 'dbo.Usuarios table does not exist', 1;
END
GO

-- Eliminar el constraint antiguo si existe
IF OBJECT_ID(N'CK_Usuarios_Rol', N'C') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Usuarios DROP CONSTRAINT CK_Usuarios_Rol;
    PRINT 'Constraint CK_Usuarios_Rol eliminado correctamente.';
END
GO

-- Crear el nuevo constraint que incluye 'consultor'
IF OBJECT_ID(N'CK_Usuarios_Rol', N'C') IS NULL
BEGIN
    ALTER TABLE dbo.Usuarios ADD CONSTRAINT CK_Usuarios_Rol 
        CHECK (rol IN (N'admin', N'operador', N'consultor'));
    PRINT 'Constraint CK_Usuarios_Rol creado correctamente con rol ''consultor''.';
END
GO

PRINT '✓ Migración 010 completada: Rol ''consultor'' agregado a Usuarios.';
