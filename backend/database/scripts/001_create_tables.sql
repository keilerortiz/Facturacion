SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
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
