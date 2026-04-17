import { getDbPool, sql } from '../../config/database.js';

async function resolveRequest(executor) {
  if (executor) {
    return executor.request();
  }

  const pool = await getDbPool();
  return pool.request();
}

function buildMovementFilters(filters, request) {
  const clauses = [];

  if (filters.fechaDesde) {
    request.input('fechaDesde', sql.Date, filters.fechaDesde);
    clauses.push('m.fecha >= @fechaDesde');
  }

  if (filters.fechaHasta) {
    request.input('fechaHasta', sql.Date, filters.fechaHasta);
    clauses.push('m.fecha <= @fechaHasta');
  }

  if (filters.propietarioId) {
    request.input('propietarioId', sql.Int, filters.propietarioId);
    clauses.push('m.propietario_id = @propietarioId');
  }

  if (filters.vtaId) {
    request.input('vtaId', sql.Int, filters.vtaId);
    clauses.push('m.vta_id = @vtaId');
  }

  if (filters.cantidad !== undefined) {
    request.input('cantidad', sql.Decimal(18, 2), filters.cantidad);
    clauses.push('m.cantidad = @cantidad');
  }

  if (filters.cantidadMin !== undefined) {
    request.input('cantidadMin', sql.Decimal(18, 2), filters.cantidadMin);
    clauses.push('m.cantidad >= @cantidadMin');
  }

  if (filters.cantidadMax !== undefined) {
    request.input('cantidadMax', sql.Decimal(18, 2), filters.cantidadMax);
    clauses.push('m.cantidad <= @cantidadMax');
  }

  if (filters.usuario) {
    request.input('usuario', sql.NVarChar(100), `%${filters.usuario}%`);
    clauses.push('uc.usuario LIKE @usuario');
  }

  if (filters.observaciones) {
    request.input('observaciones', sql.NVarChar(sql.MAX), `%${filters.observaciones}%`);
    clauses.push('ISNULL(m.observaciones, \'\') LIKE @observaciones');
  }

  return clauses.length > 0 ? ` WHERE ${clauses.join(' AND ')}` : '';
}

function buildMovementOrderClause(filters) {
  const sortColumns = {
    fecha: 'm.fecha',
    decada: 'm.decada',
    propietario: 'p.nombre',
    vtaCodigo: 'v.codigo',
    cantidad: 'm.cantidad',
    usuario: 'uc.usuario',
    fechaCreacion: 'm.fecha_creacion'
  };

  const sortColumn = sortColumns[filters.sortBy] || sortColumns.fecha;
  const sortDirection = filters.sortDir === 'asc' ? 'ASC' : 'DESC';
  const tieBreakerDirection = sortDirection;

  return `ORDER BY ${sortColumn} ${sortDirection}, m.id ${tieBreakerDirection}`;
}

export const movimientosRepository = {
  async listOwners(executor) {
    const request = await resolveRequest(executor);

    const result = await request.query(`
      SELECT id, nombre
      FROM Propietarios
      ORDER BY nombre ASC
    `);

    return result.recordset;
  },

  async findOwnerById(id, executor) {
    const request = await resolveRequest(executor);

    const result = await request.input('id', sql.Int, Number(id)).query(`
      SELECT id, nombre
      FROM Propietarios
      WHERE id = @id
    `);

    return result.recordset[0] || null;
  },

  async listVtasByOwner(propietarioId, executor) {
    const request = await resolveRequest(executor);

    const result = await request.input('propietarioId', sql.Int, Number(propietarioId)).query(`
      SELECT id, propietario_id, codigo, nombre, tipovta, udmvta, requiere_tipo, ceco
      FROM VTAs
      WHERE propietario_id = @propietarioId
      ORDER BY codigo ASC, nombre ASC
    `);

    return result.recordset;
  },

  async findVtaById(id, executor) {
    const request = await resolveRequest(executor);

    const result = await request.input('id', sql.Int, Number(id)).query(`
      SELECT id, propietario_id, codigo, nombre, tipovta, udmvta, requiere_tipo, ceco
      FROM VTAs
      WHERE id = @id
    `);

    return result.recordset[0] || null;
  },

  async findTarifaByOwnerAndVta(propietarioId, vtaId, executor) {
    const request = await resolveRequest(executor);

    const result = await request
      .input('propietarioId', sql.Int, Number(propietarioId))
      .input('vtaId', sql.Int, Number(vtaId))
      .query(`
        SELECT TOP (1)
          id,
          propietario_id,
          vta_id,
          valor,
          moneda,
          vigente_desde,
          vigente_hasta
        FROM Tarifas
        WHERE propietario_id = @propietarioId
          AND vta_id = @vtaId
          AND activa = 1
          AND (vigente_hasta IS NULL OR vigente_hasta >= CAST(SYSUTCDATETIME() AS DATE))
        ORDER BY vigente_desde DESC, id DESC
      `);

    return result.recordset[0] || null;
  },

  async createMovement(movimiento, executor) {
    const request = await resolveRequest(executor);

    const result = await request
      .input('fecha', sql.Date, movimiento.fecha)
      .input('decada', sql.Date, movimiento.decada)
      .input('propietarioId', sql.Int, movimiento.propietarioId)
      .input('vtaId', sql.Int, movimiento.vtaId)
      .input('cantidad', sql.Decimal(18, 2), movimiento.cantidad)
      .input('observaciones', sql.NVarChar(sql.MAX), movimiento.observaciones)
      .input('tipovta', sql.NVarChar(20), movimiento.tipovta ?? null)
      .input('tarifa', sql.Decimal(18, 2), movimiento.tarifa ?? null)
      .input('total', sql.Decimal(18, 2), movimiento.total ?? null)
      .input('usuarioCreacionId', sql.Int, movimiento.usuarioCreacionId)
      .query(`
        INSERT INTO Movimientos (
          fecha,
          decada,
          propietario_id,
          vta_id,
          cantidad,
          observaciones,
          tipovta,
          tarifa,
          total,
          usuario_creacion_id,
          fecha_creacion
        )
        OUTPUT inserted.id
        VALUES (
          @fecha,
          @decada,
          @propietarioId,
          @vtaId,
          @cantidad,
          @observaciones,
          @tipovta,
          @tarifa,
          @total,
          @usuarioCreacionId,
          SYSUTCDATETIME()
        )
      `);

    return result.recordset[0]?.id || null;
  },

  async findMovementById(id, executor, options = {}) {
    const request = await resolveRequest(executor);
    const lockHint = options.forUpdate ? ' WITH (UPDLOCK, ROWLOCK)' : '';

    const result = await request.input('id', sql.Int, Number(id)).query(`
      SELECT
        m.id,
        m.fecha,
        m.decada,
        m.propietario_id,
        p.nombre AS propietario_nombre,
        m.vta_id,
        v.codigo AS vta_codigo,
        v.nombre AS vta_nombre,
        v.ceco,
        v.udmvta,
        m.tipovta,
        m.cantidad,
        m.tarifa,
        m.total,
        m.observaciones,
        m.usuario_creacion_id,
        uc.usuario AS usuario_creacion,
        m.fecha_creacion,
        m.usuario_modificacion_id,
        um.usuario AS usuario_modificacion,
        m.fecha_modificacion,
        m.version
      FROM Movimientos m${lockHint}
      INNER JOIN Propietarios p ON m.propietario_id = p.id
      INNER JOIN VTAs v ON m.vta_id = v.id
      INNER JOIN Usuarios uc ON m.usuario_creacion_id = uc.id
      LEFT JOIN Usuarios um ON m.usuario_modificacion_id = um.id
      WHERE m.id = @id
    `);

    return result.recordset[0] || null;
  },

  async listMovements(filters, executor) {
    const request = await resolveRequest(executor);
    const whereClause = buildMovementFilters(filters, request);
    const orderClause = buildMovementOrderClause(filters);

    request.input('offset', sql.Int, filters.offset);
    request.input('limit', sql.Int, filters.limit);

    const query = `
      SELECT
        m.id,
        m.fecha,
        m.decada,
        m.propietario_id,
        p.nombre AS propietario,
        m.vta_id,
        v.codigo AS vta_codigo,
        v.nombre AS vta_nombre,
        v.ceco,
        v.udmvta,
        m.tipovta,
        m.cantidad,
        m.tarifa,
        m.total,
        m.observaciones,
        uc.usuario AS usuario,
        m.fecha_creacion,
        um.usuario AS usuario_modificacion,
        m.fecha_modificacion,
        m.version,
        COUNT(*) OVER() AS _total
      FROM Movimientos m
      INNER JOIN Propietarios p ON m.propietario_id = p.id
      INNER JOIN VTAs v ON m.vta_id = v.id
      INNER JOIN Usuarios uc ON m.usuario_creacion_id = uc.id
      LEFT JOIN Usuarios um ON m.usuario_modificacion_id = um.id
      ${whereClause}
      ${orderClause}
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `;

    const result = await request.query(query);

    return {
      items: result.recordset,
      total: result.recordset[0]?._total || 0
    };
  },

  async updateMovement(id, changes, usuarioModificacionId, executor) {
    const request = await resolveRequest(executor);
    const assignments = [];

    request.input('id', sql.Int, Number(id));
    request.input('usuarioModificacionId', sql.Int, Number(usuarioModificacionId));

    if (Object.prototype.hasOwnProperty.call(changes, 'fecha')) {
      request.input('fecha', sql.Date, changes.fecha);
      assignments.push('fecha = @fecha');
    }

    if (Object.prototype.hasOwnProperty.call(changes, 'decada')) {
      request.input('decada', sql.Date, changes.decada);
      assignments.push('decada = @decada');
    }

    if (Object.prototype.hasOwnProperty.call(changes, 'propietarioId')) {
      request.input('propietarioId', sql.Int, changes.propietarioId);
      assignments.push('propietario_id = @propietarioId');
    }

    if (Object.prototype.hasOwnProperty.call(changes, 'vtaId')) {
      request.input('vtaId', sql.Int, changes.vtaId);
      assignments.push('vta_id = @vtaId');
    }

    if (Object.prototype.hasOwnProperty.call(changes, 'cantidad')) {
      request.input('cantidad', sql.Decimal(18, 2), changes.cantidad);
      assignments.push('cantidad = @cantidad');
    }

    if (Object.prototype.hasOwnProperty.call(changes, 'observaciones')) {
      request.input('observaciones', sql.NVarChar(sql.MAX), changes.observaciones);
      assignments.push('observaciones = @observaciones');
    }

    if (Object.prototype.hasOwnProperty.call(changes, 'tipovta')) {
      request.input('tipovta', sql.NVarChar(20), changes.tipovta ?? null);
      assignments.push('tipovta = @tipovta');
    }

    if (Object.prototype.hasOwnProperty.call(changes, 'tarifa')) {
      request.input('tarifa', sql.Decimal(18, 2), changes.tarifa ?? null);
      assignments.push('tarifa = @tarifa');
    }

    if (Object.prototype.hasOwnProperty.call(changes, 'total')) {
      request.input('total', sql.Decimal(18, 2), changes.total ?? null);
      assignments.push('total = @total');
    }

    assignments.push('usuario_modificacion_id = @usuarioModificacionId');
    assignments.push('fecha_modificacion = SYSUTCDATETIME()');
    assignments.push('version = version + 1');

    if (changes.expectedVersion != null) {
      request.input('expectedVersion', sql.Int, Number(changes.expectedVersion));
    }

    const versionClause = changes.expectedVersion != null
      ? ' AND version = @expectedVersion'
      : '';

    const result = await request.query(`
      UPDATE Movimientos
      SET ${assignments.join(', ')}
      WHERE id = @id${versionClause};
      SELECT @@ROWCOUNT AS affectedRows;
    `);

    return result.recordset[0]?.affectedRows ?? 0;
  },

  async insertAuditLogs(movimientoId, logs, executor) {
    if (!logs.length) return;

    const request = await resolveRequest(executor);
    request.input('movimientoId', sql.Int, Number(movimientoId));

    const valueRows = logs.map((log, i) => {
      request.input(`campo${i}`, sql.NVarChar(100), log.campo);
      request.input(`valorAnterior${i}`, sql.NVarChar(sql.MAX), log.valorAnterior);
      request.input(`valorNuevo${i}`, sql.NVarChar(sql.MAX), log.valorNuevo);
      request.input(`usuario${i}`, sql.NVarChar(150), log.usuario);
      return `(@movimientoId, @campo${i}, @valorAnterior${i}, @valorNuevo${i}, @usuario${i}, SYSUTCDATETIME())`;
    });

    await request.query(`
      INSERT INTO Logs (
        movimiento_id,
        campo,
        valor_anterior,
        valor_nuevo,
        usuario,
        fecha
      )
      VALUES ${valueRows.join(',\n             ')}
    `);
  },

  async listHistoryByMovementId(movimientoId, executor) {
    const request = await resolveRequest(executor);

    const result = await request.input('movimientoId', sql.Int, Number(movimientoId)).query(`
      SELECT
        id,
        movimiento_id,
        campo,
        valor_anterior,
        valor_nuevo,
        usuario,
        fecha
      FROM Logs
      WHERE movimiento_id = @movimientoId
      ORDER BY fecha DESC, id DESC
    `);

    return result.recordset;
  },

  async countExportMovements(filters, executor) {
    const request = await resolveRequest(executor);
    const whereClause = buildMovementFilters(filters, request);

    const result = await request.query(`
      SELECT COUNT(*) AS total
      FROM Movimientos m
      INNER JOIN Propietarios p ON m.propietario_id = p.id
      INNER JOIN VTAs v ON m.vta_id = v.id
      INNER JOIN Usuarios uc ON m.usuario_creacion_id = uc.id
      ${whereClause}
    `);

    return result.recordset[0]?.total ?? 0;
  },

  async exportMovements(filters, executor) {
    const request = await resolveRequest(executor);
    const whereClause = buildMovementFilters(filters, request);
    const orderClause = buildMovementOrderClause(filters);

    const query = `
      SELECT
        m.fecha,
        m.decada,
        p.nombre AS propietario,
        p.nit AS propietario_nit,
        v.codigo AS vta_codigo,
        v.nombre AS vta_nombre,
        v.ceco,
        v.udmvta,
        m.tipovta,
        m.cantidad,
        m.tarifa,
        m.total,
        uc.usuario AS usuario,
        m.fecha_creacion,
        m.observaciones
      FROM Movimientos m
      INNER JOIN Propietarios p ON m.propietario_id = p.id
      INNER JOIN VTAs v ON m.vta_id = v.id
      INNER JOIN Usuarios uc ON m.usuario_creacion_id = uc.id
      ${whereClause}
      ${orderClause}
    `;

    const result = await request.query(query);
    return result.recordset;
  }
};
