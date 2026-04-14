SET NOCOUNT ON;
GO

-- ============================================================
-- SEED 002 — Datos de prueba: Propietarios, VTAs, Tarifas
-- Idempotente: puede ejecutarse varias veces sin duplicados
-- ============================================================

-- ============================================================
-- FASE 1 — PROPIETARIOS
-- (Frigorifico Andino y Comercializadora Nevada ya existen)
-- ============================================================

IF NOT EXISTS (SELECT 1 FROM dbo.Propietarios WHERE nombre = N'Distribuidora Los Andes')
    INSERT INTO dbo.Propietarios (nombre) VALUES (N'Distribuidora Los Andes');

IF NOT EXISTS (SELECT 1 FROM dbo.Propietarios WHERE nombre = N'Transportes Cordillera')
    INSERT INTO dbo.Propietarios (nombre) VALUES (N'Transportes Cordillera');

IF NOT EXISTS (SELECT 1 FROM dbo.Propietarios WHERE nombre = N'Procesadora del Sur')
    INSERT INTO dbo.Propietarios (nombre) VALUES (N'Procesadora del Sur');
GO

-- ============================================================
-- FASE 2 — VTAs
-- MERGE: inserta nuevas, actualiza tipovta/udmvta en existentes
-- ============================================================

MERGE dbo.VTAs AS target
USING (
    -- ── Frigorifico Andino ──────────────────────────────────
    SELECT p.id AS propietario_id, N'VTA-AND-01' AS codigo,
           N'Camara Norte'       AS nombre, N'CARGUE'    AS tipovta, N'KG'       AS udmvta
    FROM dbo.Propietarios p WHERE p.nombre = N'Frigorifico Andino'
    UNION ALL
    SELECT p.id, N'VTA-AND-02', N'Camara Sur',         N'DESCARGUE', N'KG'
    FROM dbo.Propietarios p WHERE p.nombre = N'Frigorifico Andino'
    UNION ALL
    SELECT p.id, N'VTA-AND-03', N'Linea de Despiece',  NULL,         N'KG'
    FROM dbo.Propietarios p WHERE p.nombre = N'Frigorifico Andino'
    UNION ALL
    SELECT p.id, N'VTA-AND-04', N'Servicio de Frio',   NULL,         N'HORAS'
    FROM dbo.Propietarios p WHERE p.nombre = N'Frigorifico Andino'
    UNION ALL
    SELECT p.id, N'VTA-AND-05', N'Empaque Especial',   N'CARGUE',    N'CAJAS'
    FROM dbo.Propietarios p WHERE p.nombre = N'Frigorifico Andino'

    -- ── Comercializadora Nevada ─────────────────────────────
    UNION ALL
    SELECT p.id, N'VTA-NEV-01', N'Bodega Principal',        N'CARGUE',    N'CAJAS'
    FROM dbo.Propietarios p WHERE p.nombre = N'Comercializadora Nevada'
    UNION ALL
    SELECT p.id, N'VTA-NEV-02', N'Deposito Secundario',     N'DESCARGUE', N'CAJAS'
    FROM dbo.Propietarios p WHERE p.nombre = N'Comercializadora Nevada'
    UNION ALL
    SELECT p.id, N'VTA-NEV-03', N'Centro de Distribucion',  N'CARGUE',    N'UNIDADES'
    FROM dbo.Propietarios p WHERE p.nombre = N'Comercializadora Nevada'
    UNION ALL
    SELECT p.id, N'VTA-NEV-04', N'Despacho Express',        N'DESCARGUE', N'UNIDADES'
    FROM dbo.Propietarios p WHERE p.nombre = N'Comercializadora Nevada'
    UNION ALL
    SELECT p.id, N'VTA-NEV-05', N'Almacenamiento Temporal', NULL,         N'HORAS'
    FROM dbo.Propietarios p WHERE p.nombre = N'Comercializadora Nevada'

    -- ── Distribuidora Los Andes ─────────────────────────────
    UNION ALL
    SELECT p.id, N'VTA-DLA-01', N'Ruta Norte',         N'CARGUE',    N'KG'
    FROM dbo.Propietarios p WHERE p.nombre = N'Distribuidora Los Andes'
    UNION ALL
    SELECT p.id, N'VTA-DLA-02', N'Ruta Sur',           N'DESCARGUE', N'KG'
    FROM dbo.Propietarios p WHERE p.nombre = N'Distribuidora Los Andes'
    UNION ALL
    SELECT p.id, N'VTA-DLA-03', N'Ruta Centro',        N'CARGUE',    N'KG'
    FROM dbo.Propietarios p WHERE p.nombre = N'Distribuidora Los Andes'
    UNION ALL
    SELECT p.id, N'VTA-DLA-04', N'Servicio Logistico', NULL,         N'HORAS'
    FROM dbo.Propietarios p WHERE p.nombre = N'Distribuidora Los Andes'
    UNION ALL
    SELECT p.id, N'VTA-DLA-05', N'Carga Especial',     N'CARGUE',    N'CAJAS'
    FROM dbo.Propietarios p WHERE p.nombre = N'Distribuidora Los Andes'

    -- ── Transportes Cordillera ──────────────────────────────
    UNION ALL
    SELECT p.id, N'VTA-COR-01', N'Flota Refrigerada',    N'CARGUE',    N'KG'
    FROM dbo.Propietarios p WHERE p.nombre = N'Transportes Cordillera'
    UNION ALL
    SELECT p.id, N'VTA-COR-02', N'Flota Seca',           N'DESCARGUE', N'KG'
    FROM dbo.Propietarios p WHERE p.nombre = N'Transportes Cordillera'
    UNION ALL
    SELECT p.id, N'VTA-COR-03', N'Transporte Local',     N'CARGUE',    N'UNIDADES'
    FROM dbo.Propietarios p WHERE p.nombre = N'Transportes Cordillera'
    UNION ALL
    SELECT p.id, N'VTA-COR-04', N'Flete Interurbano',    NULL,         N'HORAS'
    FROM dbo.Propietarios p WHERE p.nombre = N'Transportes Cordillera'
    UNION ALL
    SELECT p.id, N'VTA-COR-05', N'Logistica Congelados', N'DESCARGUE', N'KG'
    FROM dbo.Propietarios p WHERE p.nombre = N'Transportes Cordillera'

    -- ── Procesadora del Sur ─────────────────────────────────
    UNION ALL
    SELECT p.id, N'VTA-SUR-01', N'Linea Produccion A', N'CARGUE',    N'KG'
    FROM dbo.Propietarios p WHERE p.nombre = N'Procesadora del Sur'
    UNION ALL
    SELECT p.id, N'VTA-SUR-02', N'Linea Produccion B', N'DESCARGUE', N'KG'
    FROM dbo.Propietarios p WHERE p.nombre = N'Procesadora del Sur'
    UNION ALL
    SELECT p.id, N'VTA-SUR-03', N'Linea Produccion C', N'CARGUE',    N'KG'
    FROM dbo.Propietarios p WHERE p.nombre = N'Procesadora del Sur'
    UNION ALL
    SELECT p.id, N'VTA-SUR-04', N'Control de Calidad', NULL,         N'HORAS'
    FROM dbo.Propietarios p WHERE p.nombre = N'Procesadora del Sur'
    UNION ALL
    SELECT p.id, N'VTA-SUR-05', N'Empaque y Sellado',  N'CARGUE',    N'CAJAS'
    FROM dbo.Propietarios p WHERE p.nombre = N'Procesadora del Sur'
) AS source
ON  target.propietario_id = source.propietario_id
AND target.codigo         = source.codigo
-- Insertar VTAs nuevas
WHEN NOT MATCHED THEN
    INSERT (propietario_id, codigo, nombre, tipovta, udmvta)
    VALUES (source.propietario_id, source.codigo, source.nombre, source.tipovta, source.udmvta)
-- Actualizar datos faltantes en VTAs existentes (tipovta/udmvta eran NULL)
WHEN MATCHED AND (target.tipovta IS NULL OR target.udmvta IS NULL) THEN
    UPDATE SET
        target.tipovta = source.tipovta,
        target.udmvta  = source.udmvta,
        target.nombre  = source.nombre;
GO

-- ============================================================
-- FASE 3 — TARIFAS
-- Una tarifa activa por VTA, vigente desde hoy
-- MERGE: inserta solo si no existe ya una tarifa para (propietario, vta, hoy)
-- ============================================================

MERGE dbo.Tarifas AS target
USING (
    -- ── Frigorifico Andino ──────────────────────────────────
    SELECT p.id AS propietario_id, v.id AS vta_id, CAST(12500.00 AS DECIMAL(18,2)) AS valor
    FROM dbo.Propietarios p INNER JOIN dbo.VTAs v ON v.propietario_id = p.id AND v.codigo = N'VTA-AND-01'
    WHERE p.nombre = N'Frigorifico Andino'
    UNION ALL
    SELECT p.id, v.id, CAST(14250.00 AS DECIMAL(18,2))
    FROM dbo.Propietarios p INNER JOIN dbo.VTAs v ON v.propietario_id = p.id AND v.codigo = N'VTA-AND-02'
    WHERE p.nombre = N'Frigorifico Andino'
    UNION ALL
    SELECT p.id, v.id, CAST(8750.00 AS DECIMAL(18,2))
    FROM dbo.Propietarios p INNER JOIN dbo.VTAs v ON v.propietario_id = p.id AND v.codigo = N'VTA-AND-03'
    WHERE p.nombre = N'Frigorifico Andino'
    UNION ALL
    SELECT p.id, v.id, CAST(65000.00 AS DECIMAL(18,2))
    FROM dbo.Propietarios p INNER JOIN dbo.VTAs v ON v.propietario_id = p.id AND v.codigo = N'VTA-AND-04'
    WHERE p.nombre = N'Frigorifico Andino'
    UNION ALL
    SELECT p.id, v.id, CAST(18500.00 AS DECIMAL(18,2))
    FROM dbo.Propietarios p INNER JOIN dbo.VTAs v ON v.propietario_id = p.id AND v.codigo = N'VTA-AND-05'
    WHERE p.nombre = N'Frigorifico Andino'

    -- ── Comercializadora Nevada ─────────────────────────────
    UNION ALL
    SELECT p.id, v.id, CAST(15600.00 AS DECIMAL(18,2))
    FROM dbo.Propietarios p INNER JOIN dbo.VTAs v ON v.propietario_id = p.id AND v.codigo = N'VTA-NEV-01'
    WHERE p.nombre = N'Comercializadora Nevada'
    UNION ALL
    SELECT p.id, v.id, CAST(14800.00 AS DECIMAL(18,2))
    FROM dbo.Propietarios p INNER JOIN dbo.VTAs v ON v.propietario_id = p.id AND v.codigo = N'VTA-NEV-02'
    WHERE p.nombre = N'Comercializadora Nevada'
    UNION ALL
    SELECT p.id, v.id, CAST(9200.00 AS DECIMAL(18,2))
    FROM dbo.Propietarios p INNER JOIN dbo.VTAs v ON v.propietario_id = p.id AND v.codigo = N'VTA-NEV-03'
    WHERE p.nombre = N'Comercializadora Nevada'
    UNION ALL
    SELECT p.id, v.id, CAST(11500.00 AS DECIMAL(18,2))
    FROM dbo.Propietarios p INNER JOIN dbo.VTAs v ON v.propietario_id = p.id AND v.codigo = N'VTA-NEV-04'
    WHERE p.nombre = N'Comercializadora Nevada'
    UNION ALL
    SELECT p.id, v.id, CAST(72000.00 AS DECIMAL(18,2))
    FROM dbo.Propietarios p INNER JOIN dbo.VTAs v ON v.propietario_id = p.id AND v.codigo = N'VTA-NEV-05'
    WHERE p.nombre = N'Comercializadora Nevada'

    -- ── Distribuidora Los Andes ─────────────────────────────
    UNION ALL
    SELECT p.id, v.id, CAST(6800.00 AS DECIMAL(18,2))
    FROM dbo.Propietarios p INNER JOIN dbo.VTAs v ON v.propietario_id = p.id AND v.codigo = N'VTA-DLA-01'
    WHERE p.nombre = N'Distribuidora Los Andes'
    UNION ALL
    SELECT p.id, v.id, CAST(7200.00 AS DECIMAL(18,2))
    FROM dbo.Propietarios p INNER JOIN dbo.VTAs v ON v.propietario_id = p.id AND v.codigo = N'VTA-DLA-02'
    WHERE p.nombre = N'Distribuidora Los Andes'
    UNION ALL
    SELECT p.id, v.id, CAST(5900.00 AS DECIMAL(18,2))
    FROM dbo.Propietarios p INNER JOIN dbo.VTAs v ON v.propietario_id = p.id AND v.codigo = N'VTA-DLA-03'
    WHERE p.nombre = N'Distribuidora Los Andes'
    UNION ALL
    SELECT p.id, v.id, CAST(58000.00 AS DECIMAL(18,2))
    FROM dbo.Propietarios p INNER JOIN dbo.VTAs v ON v.propietario_id = p.id AND v.codigo = N'VTA-DLA-04'
    WHERE p.nombre = N'Distribuidora Los Andes'
    UNION ALL
    SELECT p.id, v.id, CAST(21000.00 AS DECIMAL(18,2))
    FROM dbo.Propietarios p INNER JOIN dbo.VTAs v ON v.propietario_id = p.id AND v.codigo = N'VTA-DLA-05'
    WHERE p.nombre = N'Distribuidora Los Andes'

    -- ── Transportes Cordillera ──────────────────────────────
    UNION ALL
    SELECT p.id, v.id, CAST(9500.00 AS DECIMAL(18,2))
    FROM dbo.Propietarios p INNER JOIN dbo.VTAs v ON v.propietario_id = p.id AND v.codigo = N'VTA-COR-01'
    WHERE p.nombre = N'Transportes Cordillera'
    UNION ALL
    SELECT p.id, v.id, CAST(8200.00 AS DECIMAL(18,2))
    FROM dbo.Propietarios p INNER JOIN dbo.VTAs v ON v.propietario_id = p.id AND v.codigo = N'VTA-COR-02'
    WHERE p.nombre = N'Transportes Cordillera'
    UNION ALL
    SELECT p.id, v.id, CAST(4500.00 AS DECIMAL(18,2))
    FROM dbo.Propietarios p INNER JOIN dbo.VTAs v ON v.propietario_id = p.id AND v.codigo = N'VTA-COR-03'
    WHERE p.nombre = N'Transportes Cordillera'
    UNION ALL
    SELECT p.id, v.id, CAST(95000.00 AS DECIMAL(18,2))
    FROM dbo.Propietarios p INNER JOIN dbo.VTAs v ON v.propietario_id = p.id AND v.codigo = N'VTA-COR-04'
    WHERE p.nombre = N'Transportes Cordillera'
    UNION ALL
    SELECT p.id, v.id, CAST(10800.00 AS DECIMAL(18,2))
    FROM dbo.Propietarios p INNER JOIN dbo.VTAs v ON v.propietario_id = p.id AND v.codigo = N'VTA-COR-05'
    WHERE p.nombre = N'Transportes Cordillera'

    -- ── Procesadora del Sur ─────────────────────────────────
    UNION ALL
    SELECT p.id, v.id, CAST(5200.00 AS DECIMAL(18,2))
    FROM dbo.Propietarios p INNER JOIN dbo.VTAs v ON v.propietario_id = p.id AND v.codigo = N'VTA-SUR-01'
    WHERE p.nombre = N'Procesadora del Sur'
    UNION ALL
    SELECT p.id, v.id, CAST(4800.00 AS DECIMAL(18,2))
    FROM dbo.Propietarios p INNER JOIN dbo.VTAs v ON v.propietario_id = p.id AND v.codigo = N'VTA-SUR-02'
    WHERE p.nombre = N'Procesadora del Sur'
    UNION ALL
    SELECT p.id, v.id, CAST(6100.00 AS DECIMAL(18,2))
    FROM dbo.Propietarios p INNER JOIN dbo.VTAs v ON v.propietario_id = p.id AND v.codigo = N'VTA-SUR-03'
    WHERE p.nombre = N'Procesadora del Sur'
    UNION ALL
    SELECT p.id, v.id, CAST(48000.00 AS DECIMAL(18,2))
    FROM dbo.Propietarios p INNER JOIN dbo.VTAs v ON v.propietario_id = p.id AND v.codigo = N'VTA-SUR-04'
    WHERE p.nombre = N'Procesadora del Sur'
    UNION ALL
    SELECT p.id, v.id, CAST(16500.00 AS DECIMAL(18,2))
    FROM dbo.Propietarios p INNER JOIN dbo.VTAs v ON v.propietario_id = p.id AND v.codigo = N'VTA-SUR-05'
    WHERE p.nombre = N'Procesadora del Sur'
) AS source
ON  target.propietario_id = source.propietario_id
AND target.vta_id         = source.vta_id
AND target.vigente_desde  = CAST(SYSUTCDATETIME() AS DATE)
WHEN NOT MATCHED THEN
    INSERT (propietario_id, vta_id, valor, moneda, activa, vigente_hasta, vigente_desde, fecha_creacion)
    VALUES (source.propietario_id, source.vta_id, source.valor, N'COP', 1, NULL,
            CAST(SYSUTCDATETIME() AS DATE), SYSUTCDATETIME());
GO

-- ============================================================
-- FASE 6 — VALIDACIÓN
-- ============================================================

SELECT
    p.nombre             AS propietario,
    COUNT(DISTINCT v.id) AS total_vtas,
    COUNT(DISTINCT t.id) AS total_tarifas,
    SUM(CASE WHEN v.tipovta = N'CARGUE'    THEN 1 ELSE 0 END) AS vtas_cargue,
    SUM(CASE WHEN v.tipovta = N'DESCARGUE' THEN 1 ELSE 0 END) AS vtas_descargue,
    SUM(CASE WHEN v.tipovta IS NULL        THEN 1 ELSE 0 END) AS vtas_sin_tipo,
    SUM(CASE WHEN v.udmvta  = N'KG'        THEN 1 ELSE 0 END) AS udm_kg,
    SUM(CASE WHEN v.udmvta  = N'HORAS'     THEN 1 ELSE 0 END) AS udm_horas,
    SUM(CASE WHEN v.udmvta  = N'CAJAS'     THEN 1 ELSE 0 END) AS udm_cajas,
    SUM(CASE WHEN v.udmvta  = N'UNIDADES'  THEN 1 ELSE 0 END) AS udm_unidades
FROM dbo.Propietarios p
LEFT JOIN dbo.VTAs    v ON v.propietario_id = p.id
LEFT JOIN dbo.Tarifas t ON t.vta_id = v.id AND t.activa = 1
GROUP BY p.nombre
ORDER BY p.nombre;
GO
