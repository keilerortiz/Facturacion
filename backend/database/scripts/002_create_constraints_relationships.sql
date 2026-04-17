SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID(N'DF_Usuarios_Activo', N'D') IS NULL
    ALTER TABLE dbo.Usuarios ADD CONSTRAINT DF_Usuarios_Activo DEFAULT (1) FOR activo;
GO
IF OBJECT_ID(N'DF_Usuarios_FechaCreacion', N'D') IS NULL
    ALTER TABLE dbo.Usuarios ADD CONSTRAINT DF_Usuarios_FechaCreacion DEFAULT (SYSUTCDATETIME()) FOR fecha_creacion;
GO
IF OBJECT_ID(N'UQ_Usuarios_Usuario', N'UQ') IS NULL
    ALTER TABLE dbo.Usuarios ADD CONSTRAINT UQ_Usuarios_Usuario UNIQUE (usuario);
GO
IF OBJECT_ID(N'CK_Usuarios_Rol', N'C') IS NULL
    ALTER TABLE dbo.Usuarios ADD CONSTRAINT CK_Usuarios_Rol CHECK (rol IN (N'admin', N'operador', N'consultor'));
GO
IF OBJECT_ID(N'CK_Usuarios_Usuario_NotBlank', N'C') IS NULL
    ALTER TABLE dbo.Usuarios ADD CONSTRAINT CK_Usuarios_Usuario_NotBlank CHECK (LEN(LTRIM(RTRIM(usuario))) > 0);
GO
IF OBJECT_ID(N'CK_Usuarios_Nombre_NotBlank', N'C') IS NULL
    ALTER TABLE dbo.Usuarios ADD CONSTRAINT CK_Usuarios_Nombre_NotBlank CHECK (LEN(LTRIM(RTRIM(nombre))) > 0);
GO

IF OBJECT_ID(N'CK_Propietarios_Nombre_NotBlank', N'C') IS NULL
    ALTER TABLE dbo.Propietarios ADD CONSTRAINT CK_Propietarios_Nombre_NotBlank CHECK (LEN(LTRIM(RTRIM(nombre))) > 0);
GO

IF OBJECT_ID(N'UQ_VTAs_PropietarioCodigo', N'UQ') IS NULL
    ALTER TABLE dbo.VTAs ADD CONSTRAINT UQ_VTAs_PropietarioCodigo UNIQUE (propietario_id, codigo);
GO
IF OBJECT_ID(N'UQ_VTAs_IdPropietario', N'UQ') IS NULL
    ALTER TABLE dbo.VTAs ADD CONSTRAINT UQ_VTAs_IdPropietario UNIQUE (id, propietario_id);
GO
IF OBJECT_ID(N'CK_VTAs_Codigo_NotBlank', N'C') IS NULL
    ALTER TABLE dbo.VTAs ADD CONSTRAINT CK_VTAs_Codigo_NotBlank CHECK (LEN(LTRIM(RTRIM(codigo))) > 0);
GO
IF OBJECT_ID(N'CK_VTAs_Nombre_NotBlank', N'C') IS NULL
    ALTER TABLE dbo.VTAs ADD CONSTRAINT CK_VTAs_Nombre_NotBlank CHECK (LEN(LTRIM(RTRIM(nombre))) > 0);
GO

IF OBJECT_ID(N'DF_Tarifas_Moneda', N'D') IS NULL
    ALTER TABLE dbo.Tarifas ADD CONSTRAINT DF_Tarifas_Moneda DEFAULT (N'COP') FOR moneda;
GO
IF OBJECT_ID(N'DF_Tarifas_Activa', N'D') IS NULL
    ALTER TABLE dbo.Tarifas ADD CONSTRAINT DF_Tarifas_Activa DEFAULT (1) FOR activa;
GO
IF OBJECT_ID(N'DF_Tarifas_VigenteDesde', N'D') IS NULL
    ALTER TABLE dbo.Tarifas ADD CONSTRAINT DF_Tarifas_VigenteDesde DEFAULT (CONVERT(DATE, SYSUTCDATETIME())) FOR vigente_desde;
GO
IF OBJECT_ID(N'DF_Tarifas_FechaCreacion', N'D') IS NULL
    ALTER TABLE dbo.Tarifas ADD CONSTRAINT DF_Tarifas_FechaCreacion DEFAULT (SYSUTCDATETIME()) FOR fecha_creacion;
GO
IF OBJECT_ID(N'UQ_Tarifas_PropietarioVtaVigencia', N'UQ') IS NULL
    ALTER TABLE dbo.Tarifas ADD CONSTRAINT UQ_Tarifas_PropietarioVtaVigencia UNIQUE (propietario_id, vta_id, vigente_desde);
GO
IF OBJECT_ID(N'CK_Tarifas_Valor_Positive', N'C') IS NULL
    ALTER TABLE dbo.Tarifas ADD CONSTRAINT CK_Tarifas_Valor_Positive CHECK (valor > 0);
GO
IF OBJECT_ID(N'CK_Tarifas_Moneda_NotBlank', N'C') IS NULL
    ALTER TABLE dbo.Tarifas ADD CONSTRAINT CK_Tarifas_Moneda_NotBlank CHECK (LEN(LTRIM(RTRIM(moneda))) > 0);
GO
IF OBJECT_ID(N'CK_Tarifas_Vigencia', N'C') IS NULL
    ALTER TABLE dbo.Tarifas ADD CONSTRAINT CK_Tarifas_Vigencia CHECK (vigente_hasta IS NULL OR vigente_hasta >= vigente_desde);
GO

IF OBJECT_ID(N'UQ_RefreshTokens_TokenHash', N'UQ') IS NULL
    ALTER TABLE dbo.RefreshTokens ADD CONSTRAINT UQ_RefreshTokens_TokenHash UNIQUE (token_hash);
GO
IF OBJECT_ID(N'DF_RefreshTokens_FechaCreacion', N'D') IS NULL
    ALTER TABLE dbo.RefreshTokens ADD CONSTRAINT DF_RefreshTokens_FechaCreacion DEFAULT (SYSUTCDATETIME()) FOR fecha_creacion;
GO
IF OBJECT_ID(N'CK_RefreshTokens_Expiry', N'C') IS NULL
    ALTER TABLE dbo.RefreshTokens ADD CONSTRAINT CK_RefreshTokens_Expiry CHECK (expira_en > fecha_creacion);
GO

IF OBJECT_ID(N'DF_Movimientos_FechaCreacion', N'D') IS NULL
    ALTER TABLE dbo.Movimientos ADD CONSTRAINT DF_Movimientos_FechaCreacion DEFAULT (SYSUTCDATETIME()) FOR fecha_creacion;
GO
IF OBJECT_ID(N'CK_Movimientos_Cantidad_Positive', N'C') IS NULL
    ALTER TABLE dbo.Movimientos ADD CONSTRAINT CK_Movimientos_Cantidad_Positive CHECK (cantidad > 0);
GO
IF OBJECT_ID(N'CK_Movimientos_MismoMesAnio', N'C') IS NULL
    ALTER TABLE dbo.Movimientos ADD CONSTRAINT CK_Movimientos_MismoMesAnio CHECK (YEAR(fecha) = YEAR(decada) AND MONTH(fecha) = MONTH(decada));
GO

IF OBJECT_ID(N'DF_Logs_Fecha', N'D') IS NULL
    ALTER TABLE dbo.Logs ADD CONSTRAINT DF_Logs_Fecha DEFAULT (SYSUTCDATETIME()) FOR fecha;
GO
IF OBJECT_ID(N'CK_Logs_Campo_NotBlank', N'C') IS NULL
    ALTER TABLE dbo.Logs ADD CONSTRAINT CK_Logs_Campo_NotBlank CHECK (LEN(LTRIM(RTRIM(campo))) > 0);
GO
IF OBJECT_ID(N'CK_Logs_Usuario_NotBlank', N'C') IS NULL
    ALTER TABLE dbo.Logs ADD CONSTRAINT CK_Logs_Usuario_NotBlank CHECK (LEN(LTRIM(RTRIM(usuario))) > 0);
GO

-- Constraints para nuevas columnas (migraciones 002-011)
IF OBJECT_ID(N'CK_VTAs_CECO_NotBlank', N'C') IS NULL
    ALTER TABLE dbo.VTAs ADD CONSTRAINT CK_VTAs_CECO_NotBlank CHECK (ceco IS NULL OR LEN(LTRIM(RTRIM(ceco))) > 0);
GO

IF OBJECT_ID(N'DF_Movimientos_FechaCreacion', N'D') IS NULL
    ALTER TABLE dbo.Movimientos ADD CONSTRAINT DF_Movimientos_Default_Version DEFAULT (1) FOR version;
GO

-- Constraints para tabla Jobs
IF OBJECT_ID(N'DF_Jobs_FechaCreacion', N'D') IS NULL
    ALTER TABLE dbo.Jobs ADD CONSTRAINT DF_Jobs_FechaCreacion DEFAULT (SYSUTCDATETIME()) FOR fecha_creacion;
GO
IF OBJECT_ID(N'CK_Jobs_Status_Valid', N'C') IS NULL
    ALTER TABLE dbo.Jobs ADD CONSTRAINT CK_Jobs_Status_Valid CHECK (status IN (N'pending', N'processing', N'completed', N'failed'));
GO

IF OBJECT_ID(N'FK_VTAs_Propietarios', N'F') IS NULL
    ALTER TABLE dbo.VTAs ADD CONSTRAINT FK_VTAs_Propietarios FOREIGN KEY (propietario_id) REFERENCES dbo.Propietarios(id);
GO

IF OBJECT_ID(N'FK_Tarifas_Propietarios', N'F') IS NULL
    ALTER TABLE dbo.Tarifas ADD CONSTRAINT FK_Tarifas_Propietarios FOREIGN KEY (propietario_id) REFERENCES dbo.Propietarios(id);
GO
IF OBJECT_ID(N'FK_Tarifas_VTAs', N'F') IS NULL
    ALTER TABLE dbo.Tarifas ADD CONSTRAINT FK_Tarifas_VTAs FOREIGN KEY (vta_id) REFERENCES dbo.VTAs(id);
GO
IF OBJECT_ID(N'FK_Tarifas_VTAs_Propietario', N'F') IS NULL
    ALTER TABLE dbo.Tarifas ADD CONSTRAINT FK_Tarifas_VTAs_Propietario FOREIGN KEY (vta_id, propietario_id) REFERENCES dbo.VTAs(id, propietario_id);
GO

IF OBJECT_ID(N'FK_RefreshTokens_Usuarios', N'F') IS NULL
    ALTER TABLE dbo.RefreshTokens ADD CONSTRAINT FK_RefreshTokens_Usuarios FOREIGN KEY (usuario_id) REFERENCES dbo.Usuarios(id);
GO

IF OBJECT_ID(N'FK_Movimientos_Propietarios', N'F') IS NULL
    ALTER TABLE dbo.Movimientos ADD CONSTRAINT FK_Movimientos_Propietarios FOREIGN KEY (propietario_id) REFERENCES dbo.Propietarios(id);
GO
IF OBJECT_ID(N'FK_Movimientos_VTAs', N'F') IS NULL
    ALTER TABLE dbo.Movimientos ADD CONSTRAINT FK_Movimientos_VTAs FOREIGN KEY (vta_id) REFERENCES dbo.VTAs(id);
GO
IF OBJECT_ID(N'FK_Movimientos_VTAs_Propietario', N'F') IS NULL
    ALTER TABLE dbo.Movimientos ADD CONSTRAINT FK_Movimientos_VTAs_Propietario FOREIGN KEY (vta_id, propietario_id) REFERENCES dbo.VTAs(id, propietario_id);
GO
IF OBJECT_ID(N'FK_Movimientos_UsuariosCreacion', N'F') IS NULL
    ALTER TABLE dbo.Movimientos ADD CONSTRAINT FK_Movimientos_UsuariosCreacion FOREIGN KEY (usuario_creacion_id) REFERENCES dbo.Usuarios(id);
GO
IF OBJECT_ID(N'FK_Movimientos_UsuariosModificacion', N'F') IS NULL
    ALTER TABLE dbo.Movimientos ADD CONSTRAINT FK_Movimientos_UsuariosModificacion FOREIGN KEY (usuario_modificacion_id) REFERENCES dbo.Usuarios(id);
GO

IF OBJECT_ID(N'FK_Logs_Movimientos', N'F') IS NULL
    ALTER TABLE dbo.Logs ADD CONSTRAINT FK_Logs_Movimientos FOREIGN KEY (movimiento_id) REFERENCES dbo.Movimientos(id);
GO

IF OBJECT_ID(N'FK_Jobs_Usuarios', N'F') IS NULL
    ALTER TABLE dbo.Jobs ADD CONSTRAINT FK_Jobs_Usuarios FOREIGN KEY (usuario_id) REFERENCES dbo.Usuarios(id);
GO
