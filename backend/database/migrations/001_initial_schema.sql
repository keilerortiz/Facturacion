SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
SET XACT_ABORT ON;
GO

BEGIN TRANSACTION;
GO

IF OBJECT_ID(N'dbo.Usuarios', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Usuarios (
        id INT IDENTITY(1,1) NOT NULL,
        usuario NVARCHAR(100) NOT NULL,
        nombre NVARCHAR(150) NOT NULL,
        password_hash NVARCHAR(255) NOT NULL,
        rol NVARCHAR(50) NOT NULL,
        activo BIT NOT NULL,
        fecha_creacion DATETIME2(0) NOT NULL,
        fecha_modificacion DATETIME2(0) NULL,
        fecha_ultimo_acceso DATETIME2(0) NULL,
        CONSTRAINT PK_Usuarios PRIMARY KEY CLUSTERED (id)
    );
END;
GO

IF OBJECT_ID(N'dbo.Propietarios', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Propietarios (
        id INT IDENTITY(1,1) NOT NULL,
        nombre NVARCHAR(150) NOT NULL,
        CONSTRAINT PK_Propietarios PRIMARY KEY CLUSTERED (id)
    );
END;
GO

IF OBJECT_ID(N'dbo.VTAs', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.VTAs (
        id INT IDENTITY(1,1) NOT NULL,
        propietario_id INT NOT NULL,
        codigo NVARCHAR(50) NOT NULL,
        nombre NVARCHAR(150) NOT NULL,
        CONSTRAINT PK_VTAs PRIMARY KEY CLUSTERED (id)
    );
END;
GO

IF OBJECT_ID(N'dbo.Tarifas', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Tarifas (
        id INT IDENTITY(1,1) NOT NULL,
        propietario_id INT NOT NULL,
        vta_id INT NOT NULL,
        valor DECIMAL(18,2) NOT NULL,
        moneda NVARCHAR(10) NOT NULL,
        activa BIT NOT NULL,
        vigente_desde DATE NOT NULL,
        vigente_hasta DATE NULL,
        fecha_creacion DATETIME2(0) NOT NULL,
        CONSTRAINT PK_Tarifas PRIMARY KEY CLUSTERED (id)
    );
END;
GO

IF OBJECT_ID(N'dbo.RefreshTokens', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RefreshTokens (
        id INT IDENTITY(1,1) NOT NULL,
        usuario_id INT NOT NULL,
        token_hash NVARCHAR(255) NOT NULL,
        expira_en DATETIME2(0) NOT NULL,
        revocado_en DATETIME2(0) NULL,
        fecha_creacion DATETIME2(0) NOT NULL,
        CONSTRAINT PK_RefreshTokens PRIMARY KEY CLUSTERED (id)
    );
END;
GO

IF OBJECT_ID(N'dbo.Movimientos', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Movimientos (
        id INT IDENTITY(1,1) NOT NULL,
        fecha DATE NOT NULL,
        decada DATE NOT NULL,
        propietario_id INT NOT NULL,
        vta_id INT NOT NULL,
        cantidad DECIMAL(18,2) NOT NULL,
        observaciones NVARCHAR(MAX) NULL,
        usuario_creacion_id INT NOT NULL,
        fecha_creacion DATETIME2(0) NOT NULL,
        usuario_modificacion_id INT NULL,
        fecha_modificacion DATETIME2(0) NULL,
        CONSTRAINT PK_Movimientos PRIMARY KEY CLUSTERED (id)
    );
END;
GO

IF OBJECT_ID(N'dbo.Logs', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Logs (
        id INT IDENTITY(1,1) NOT NULL,
        movimiento_id INT NOT NULL,
        campo NVARCHAR(100) NOT NULL,
        valor_anterior NVARCHAR(MAX) NULL,
        valor_nuevo NVARCHAR(MAX) NULL,
        usuario NVARCHAR(150) NOT NULL,
        fecha DATETIME2(0) NOT NULL,
        CONSTRAINT PK_Logs PRIMARY KEY CLUSTERED (id)
    );
END;
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
    ALTER TABLE dbo.Usuarios ADD CONSTRAINT CK_Usuarios_Rol CHECK (rol IN (N'admin', N'operador'));
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

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_VTAs_PropietarioCodigo' AND object_id = OBJECT_ID(N'dbo.VTAs'))
    CREATE NONCLUSTERED INDEX IX_VTAs_PropietarioCodigo ON dbo.VTAs (propietario_id ASC, codigo ASC) INCLUDE (nombre);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Tarifas_PropietarioVtaActiva' AND object_id = OBJECT_ID(N'dbo.Tarifas'))
    CREATE NONCLUSTERED INDEX IX_Tarifas_PropietarioVtaActiva ON dbo.Tarifas (propietario_id ASC, vta_id ASC, activa ASC, vigente_desde DESC) INCLUDE (valor, moneda, vigente_hasta);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_RefreshTokens_UsuarioRevocado' AND object_id = OBJECT_ID(N'dbo.RefreshTokens'))
    CREATE NONCLUSTERED INDEX IX_RefreshTokens_UsuarioRevocado ON dbo.RefreshTokens (usuario_id ASC, revocado_en ASC, expira_en ASC);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Movimientos_Fecha' AND object_id = OBJECT_ID(N'dbo.Movimientos'))
    CREATE NONCLUSTERED INDEX IX_Movimientos_Fecha ON dbo.Movimientos (fecha DESC) INCLUDE (propietario_id, vta_id, cantidad, usuario_creacion_id, fecha_creacion);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Movimientos_PropietarioId' AND object_id = OBJECT_ID(N'dbo.Movimientos'))
    CREATE NONCLUSTERED INDEX IX_Movimientos_PropietarioId ON dbo.Movimientos (propietario_id ASC, fecha DESC) INCLUDE (vta_id, cantidad, usuario_creacion_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Movimientos_VtaId' AND object_id = OBJECT_ID(N'dbo.Movimientos'))
    CREATE NONCLUSTERED INDEX IX_Movimientos_VtaId ON dbo.Movimientos (vta_id ASC, fecha DESC) INCLUDE (propietario_id, cantidad, usuario_creacion_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Movimientos_UsuarioCreacion' AND object_id = OBJECT_ID(N'dbo.Movimientos'))
    CREATE NONCLUSTERED INDEX IX_Movimientos_UsuarioCreacion ON dbo.Movimientos (usuario_creacion_id ASC, fecha_creacion DESC) INCLUDE (fecha, propietario_id, vta_id, cantidad);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Logs_MovimientoFecha' AND object_id = OBJECT_ID(N'dbo.Logs'))
    CREATE NONCLUSTERED INDEX IX_Logs_MovimientoFecha ON dbo.Logs (movimiento_id ASC, fecha DESC) INCLUDE (campo, usuario);
GO

COMMIT TRANSACTION;
GO
