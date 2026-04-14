SET NOCOUNT ON;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE usuario = N'admin.facturacion')
BEGIN
    INSERT INTO dbo.Usuarios (
        usuario,
        nombre,
        password_hash,
        rol,
        activo,
        fecha_creacion
    )
    VALUES (
        N'admin.facturacion',
        N'Administrador Facturacion',
        N'$2b$10$VX4lp7HKeuKCLyMoPIyxyudgNm6Rc8iIOTNSWUTF7EAh/Mk/WbX8u',
        N'admin',
        1,
        SYSUTCDATETIME()
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Propietarios WHERE nombre = N'Frigorifico Andino')
BEGIN
    INSERT INTO dbo.Propietarios (nombre)
    VALUES (N'Frigorifico Andino');
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Propietarios WHERE nombre = N'Comercializadora Nevada')
BEGIN
    INSERT INTO dbo.Propietarios (nombre)
    VALUES (N'Comercializadora Nevada');
END;
GO

DECLARE @PropietarioAndinoId INT = (
    SELECT TOP (1) id
    FROM dbo.Propietarios
    WHERE nombre = N'Frigorifico Andino'
);
DECLARE @PropietarioNevadaId INT = (
    SELECT TOP (1) id
    FROM dbo.Propietarios
    WHERE nombre = N'Comercializadora Nevada'
);
GO

MERGE dbo.VTAs AS target
USING (
    SELECT p.id AS propietario_id, N'VTA-AND-01' AS codigo, N'Camara Norte' AS nombre
    FROM dbo.Propietarios p
    WHERE p.nombre = N'Frigorifico Andino'
    UNION ALL
    SELECT p.id AS propietario_id, N'VTA-AND-02' AS codigo, N'Camara Sur' AS nombre
    FROM dbo.Propietarios p
    WHERE p.nombre = N'Frigorifico Andino'
    UNION ALL
    SELECT p.id AS propietario_id, N'VTA-NEV-01' AS codigo, N'Bodega Principal' AS nombre
    FROM dbo.Propietarios p
    WHERE p.nombre = N'Comercializadora Nevada'
) AS source
ON target.propietario_id = source.propietario_id
   AND target.codigo = source.codigo
WHEN NOT MATCHED THEN
    INSERT (propietario_id, codigo, nombre)
    VALUES (source.propietario_id, source.codigo, source.nombre);
GO

MERGE dbo.Tarifas AS target
USING (
    SELECT
        p.id AS propietario_id,
        v.id AS vta_id,
        CAST(12500.00 AS DECIMAL(18, 2)) AS valor,
        N'COP' AS moneda
    FROM dbo.Propietarios p
    INNER JOIN dbo.VTAs v
        ON v.propietario_id = p.id
       AND v.codigo = N'VTA-AND-01'
    WHERE p.nombre = N'Frigorifico Andino'

    UNION ALL

    SELECT
        p.id AS propietario_id,
        v.id AS vta_id,
        CAST(14250.00 AS DECIMAL(18, 2)) AS valor,
        N'COP' AS moneda
    FROM dbo.Propietarios p
    INNER JOIN dbo.VTAs v
        ON v.propietario_id = p.id
       AND v.codigo = N'VTA-AND-02'
    WHERE p.nombre = N'Frigorifico Andino'

    UNION ALL

    SELECT
        p.id AS propietario_id,
        v.id AS vta_id,
        CAST(15600.00 AS DECIMAL(18, 2)) AS valor,
        N'COP' AS moneda
    FROM dbo.Propietarios p
    INNER JOIN dbo.VTAs v
        ON v.propietario_id = p.id
       AND v.codigo = N'VTA-NEV-01'
    WHERE p.nombre = N'Comercializadora Nevada'
) AS source
ON target.propietario_id = source.propietario_id
   AND target.vta_id = source.vta_id
   AND target.vigente_desde = CAST(SYSUTCDATETIME() AS DATE)
WHEN NOT MATCHED THEN
    INSERT (
        propietario_id,
        vta_id,
        valor,
        moneda,
        activa,
        vigente_desde,
        vigente_hasta,
        fecha_creacion
    )
    VALUES (
        source.propietario_id,
        source.vta_id,
        source.valor,
        source.moneda,
        1,
        CAST(SYSUTCDATETIME() AS DATE),
        NULL,
        SYSUTCDATETIME()
    );
GO
