import ExcelJS from 'exceljs';
import { withTransaction } from '../../config/database.js';
import {
  movimientoFiltersSchema,
  movimientoSchema,
  movimientoUpdateSchema,
  propietarioQuerySchema,
  tarifaQuerySchema
} from '../../domain/movimientos/movimientoSchemas.js';
import { movimientosRepository } from '../../repositories/movimientos/movimientosRepository.js';
import { AppError } from '../../utils/AppError.js';
import { buildCacheKey, getOrSetJsonCache } from '../../utils/redisCache.js';
import { formatDateOnly, isAllowedMovimientoDate, isSameMonthAndYear } from '../../utils/dateUtils.js';

function emptyToUndefined(value) {
  return value === '' || value === null ? undefined : value;
}

function compactObject(value) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));
}

function normalizeObservaciones(value) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeMovimientoPayload(payload = {}) {
  return compactObject({
    fecha: emptyToUndefined(payload.fecha),
    decada: emptyToUndefined(payload.decada),
    propietarioId:
      emptyToUndefined(payload.propietarioId) ??
      emptyToUndefined(payload.propietario) ??
      emptyToUndefined(payload.propietario_id),
    vtaId:
      emptyToUndefined(payload.vtaId) ??
      emptyToUndefined(payload.vta) ??
      emptyToUndefined(payload.vta_id),
    cantidad: emptyToUndefined(payload.cantidad),
    observaciones: Object.prototype.hasOwnProperty.call(payload, 'observaciones')
      ? normalizeObservaciones(payload.observaciones)
      : undefined,
    tipovta: emptyToUndefined(payload.tipovta)
  });
}

function normalizeMovimientoFilters(query = {}) {
  return compactObject({
    fechaDesde: emptyToUndefined(query.fechaDesde),
    fechaHasta: emptyToUndefined(query.fechaHasta),
    propietarioId:
      emptyToUndefined(query.propietarioId) ??
      emptyToUndefined(query.propietario) ??
      emptyToUndefined(query.propietario_id),
    vtaId: emptyToUndefined(query.vtaId) ?? emptyToUndefined(query.vta) ?? emptyToUndefined(query.vta_id),
    cantidad: emptyToUndefined(query.cantidad),
    cantidadMin: emptyToUndefined(query.cantidadMin),
    cantidadMax: emptyToUndefined(query.cantidadMax),
    usuario: emptyToUndefined(query.usuario) ?? emptyToUndefined(query.usuarioCreacion),
    observaciones: emptyToUndefined(query.observaciones),
    sortBy: emptyToUndefined(query.sortBy),
    sortDir: emptyToUndefined(query.sortDir),
    limit: emptyToUndefined(query.limit),
    offset: emptyToUndefined(query.offset)
  });
}

function normalizeLookupQuery(query = {}) {
  return compactObject({
    propietarioId:
      emptyToUndefined(query.propietarioId) ??
      emptyToUndefined(query.propietario) ??
      emptyToUndefined(query.propietario_id),
    vtaId: emptyToUndefined(query.vtaId) ?? emptyToUndefined(query.vta) ?? emptyToUndefined(query.vta_id)
  });
}

function mapMovimiento(record) {
  return {
    id: record.id,
    fecha: formatDateOnly(record.fecha),
    decada: formatDateOnly(record.decada),
    propietarioId: record.propietario_id,
    propietario: record.propietario ?? record.propietario_nombre,
    vtaId: record.vta_id,
    vtaCodigo: record.vta_codigo,
    vtaNombre: record.vta_nombre,
    udmvta: record.udmvta ?? null,
    tipovta: record.tipovta ?? null,
    cantidad: Number(record.cantidad),
    tarifa: record.tarifa != null ? Number(record.tarifa) : null,
    total: record.total != null ? Number(record.total) : null,
    observaciones: record.observaciones,
    usuario: record.usuario ?? record.usuario_creacion,
    usuarioCreacion: record.usuario ?? record.usuario_creacion,
    usuarioModificacion: record.usuario_modificacion,
    fechaCreacion: record.fecha_creacion,
    fechaModificacion: record.fecha_modificacion,
    version: record.version ?? 1
  };
}

function mapHistorialItem(item) {
  return {
    id: item.id,
    movimientoId: item.movimiento_id,
    campo: item.campo,
    valorAnterior: item.valor_anterior,
    valorNuevo: item.valor_nuevo,
    usuario: item.usuario,
    fecha: item.fecha
  };
}

function assertMovimientoBusinessRules(data) {
  if (!isAllowedMovimientoDate(data.fecha)) {
    throw new AppError(400, 'La fecha solo puede ser hoy, ayer o hace dos dias');
  }

  if (!isSameMonthAndYear(data.fecha, data.decada)) {
    throw new AppError(400, 'La decada debe corresponder al mismo mes y anio de la fecha');
  }

  if (Number(data.cantidad) <= 0) {
    throw new AppError(400, 'La cantidad debe ser mayor a cero');
  }
}

async function resolveOwnerAndVta(propietarioId, vtaId, executor) {
  const owner = await movimientosRepository.findOwnerById(propietarioId, executor);
  const vta = await movimientosRepository.findVtaById(vtaId, executor);

  if (!owner) {
    throw new AppError(400, 'El propietario indicado no existe');
  }

  if (!vta) {
    throw new AppError(400, 'La VTA indicada no existe');
  }

  if (vta.propietario_id !== owner.id) {
    throw new AppError(400, 'La VTA seleccionada no pertenece al propietario indicado');
  }

  return { owner, vta };
}

function assertTipovtaForVta(vta, tipovta) {
  if (vta.requiere_tipo) {
    if (!tipovta) {
      throw new AppError(400, 'Esta VTA requiere especificar el tipo de movimiento: CARGUE o DESCARGUE');
    }
    return tipovta;
  }
  return null;
}

function toDisplayDate(value) {
  const iso = formatDateOnly(value);
  if (!iso) return '';
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

function buildAuditEntries(previousMovement, nextMovement, authUser) {
  const previousValues = {
    fecha: formatDateOnly(previousMovement.fecha),
    decada: formatDateOnly(previousMovement.decada),
    propietario: previousMovement.propietario_nombre,
    vta: `${previousMovement.vta_codigo} - ${previousMovement.vta_nombre}`,
    cantidad: Number(previousMovement.cantidad).toFixed(2),
    tipovta: previousMovement.tipovta ?? null,
    observaciones: previousMovement.observaciones || null
  };

  const nextValues = {
    fecha: nextMovement.fecha,
    decada: nextMovement.decada,
    propietario: nextMovement.propietarioNombre,
    vta: `${nextMovement.vtaCodigo} - ${nextMovement.vtaNombre}`,
    cantidad: Number(nextMovement.cantidad).toFixed(2),
    tipovta: nextMovement.tipovta ?? null,
    observaciones: nextMovement.observaciones || null
  };

  return Object.keys(previousValues)
    .filter((field) => previousValues[field] !== nextValues[field])
    .map((field) => ({
      campo: field,
      valorAnterior: previousValues[field],
      valorNuevo: nextValues[field],
      usuario: authUser.usuario
    }));
}

export const movimientosService = {
  async listOwners() {
    const owners = await getOrSetJsonCache(
      buildCacheKey('catalog:owners', ['v1']),
      600,
      () => movimientosRepository.listOwners()
    );

    return {
      data: {
        items: owners
      }
    };
  },

  async listVtasByOwner(query) {
    const data = propietarioQuerySchema.parse({
      propietarioId: normalizeLookupQuery(query).propietarioId
    });
    const owner = await movimientosRepository.findOwnerById(data.propietarioId);

    if (!owner) {
      throw new AppError(404, 'Propietario no encontrado');
    }

    const vtas = await getOrSetJsonCache(
      buildCacheKey('catalog:vtas-by-owner', { propietarioId: data.propietarioId }),
      600,
      () => movimientosRepository.listVtasByOwner(data.propietarioId)
    );

    return {
      data: {
        items: vtas.map((item) => ({
          id: item.id,
          propietarioId: item.propietario_id,
          codigo: item.codigo,
          nombre: item.nombre,
          tipovta: item.tipovta ?? null,
          udmvta: item.udmvta ?? null,
          requiereTipo: item.requiere_tipo === true || item.requiere_tipo === 1
        }))
      }
    };
  },

  async getRate(query) {
    const normalized = normalizeLookupQuery(query);
    const data = tarifaQuerySchema.parse(normalized);

    await resolveOwnerAndVta(data.propietarioId, data.vtaId);

    const tarifa = await getOrSetJsonCache(
      buildCacheKey('catalog:rate', {
        propietarioId: data.propietarioId,
        vtaId: data.vtaId
      }),
      300,
      () => movimientosRepository.findTarifaByOwnerAndVta(data.propietarioId, data.vtaId)
    );

    return {
      data: {
        tarifa: tarifa
          ? {
              id: tarifa.id,
              propietarioId: tarifa.propietario_id,
              vtaId: tarifa.vta_id,
              valor: Number(tarifa.valor),
              moneda: tarifa.moneda,
              vigenteDesde: tarifa.vigente_desde,
              vigenteHasta: tarifa.vigente_hasta
            }
          : null
      }
    };
  },

  async create(payload, auth) {
    const movement = movimientoSchema.parse(normalizeMovimientoPayload(payload));
    assertMovimientoBusinessRules(movement);

    const { vta } = await resolveOwnerAndVta(movement.propietarioId, movement.vtaId);
    const tipovtaFinal = assertTipovtaForVta(vta, movement.tipovta);

    const tarifaRecord = await movimientosRepository.findTarifaByOwnerAndVta(
      movement.propietarioId,
      movement.vtaId
    );
    const tarifaValor = tarifaRecord ? Number(tarifaRecord.valor) : null;
    const total = tarifaValor !== null ? Number(movement.cantidad) * tarifaValor : null;

    const createdId = await withTransaction(async (transaction) => {
      return movimientosRepository.createMovement(
        {
          ...movement,
          tipovta: tipovtaFinal,
          observaciones: normalizeObservaciones(movement.observaciones) ?? null,
          tarifa: tarifaValor,
          total,
          usuarioCreacionId: auth.userId
        },
        transaction
      );
    });

    const createdMovement = await movimientosRepository.findMovementById(createdId);

    return {
      status: 201,
      data: {
        message: 'Movimiento creado correctamente',
        movimiento: mapMovimiento(createdMovement)
      }
    };
  },

  async list(query) {
    const filters = movimientoFiltersSchema.parse(normalizeMovimientoFilters(query));
    const result = await movimientosRepository.listMovements(filters);

    return {
      data: {
        items: result.items.map(mapMovimiento),
        pagination: {
          total: result.total,
          limit: filters.limit,
          offset: filters.offset
        }
      }
    };
  },

  async init(query) {
    const [ownersResult, movimientosResult] = await Promise.all([
      movimientosService.listOwners(),
      movimientosService.list(query)
    ]);

    return {
      data: {
        propietarios: ownersResult.data.items,
        movimientos: movimientosResult.data
      }
    };
  },

  async detail(id) {
    const movimientoId = Number(id);

    if (!Number.isInteger(movimientoId) || movimientoId <= 0) {
      throw new AppError(400, 'Identificador de movimiento invalido');
    }

    const movement = await movimientosRepository.findMovementById(movimientoId);

    if (!movement) {
      throw new AppError(404, 'Movimiento no encontrado');
    }

    return {
      data: {
        movimiento: mapMovimiento(movement)
      }
    };
  },

  async history(id) {
    const movimientoId = Number(id);

    if (!Number.isInteger(movimientoId) || movimientoId <= 0) {
      throw new AppError(400, 'Identificador de movimiento invalido');
    }

    const movement = await movimientosRepository.findMovementById(movimientoId);

    if (!movement) {
      throw new AppError(404, 'Movimiento no encontrado');
    }

    const history = await movimientosRepository.listHistoryByMovementId(movimientoId);

    return {
      data: {
        items: history.map(mapHistorialItem)
      }
    };
  },

  async update(id, payload, auth) {
    const movimientoId = Number(id);

    if (!Number.isInteger(movimientoId) || movimientoId <= 0) {
      throw new AppError(400, 'Identificador de movimiento invalido');
    }

    const incomingChanges = movimientoUpdateSchema.parse(normalizeMovimientoPayload(payload));

    // Optimistic locking: capture version from payload (optional for backward compat)
    const expectedVersion = payload?.version != null ? Number(payload.version) : null;

    const updatedMovement = await withTransaction(async (transaction) => {
      const currentMovement = await movimientosRepository.findMovementById(movimientoId, transaction, {
        forUpdate: true
      });

      if (!currentMovement) {
        throw new AppError(404, 'Movimiento no encontrado');
      }

      const finalState = {
        fecha: incomingChanges.fecha ?? formatDateOnly(currentMovement.fecha),
        decada: incomingChanges.decada ?? formatDateOnly(currentMovement.decada),
        propietarioId: incomingChanges.propietarioId ?? currentMovement.propietario_id,
        vtaId: incomingChanges.vtaId ?? currentMovement.vta_id,
        cantidad: incomingChanges.cantidad ?? Number(currentMovement.cantidad),
        tipovta: Object.prototype.hasOwnProperty.call(incomingChanges, 'tipovta')
          ? (incomingChanges.tipovta ?? null)
          : (currentMovement.tipovta ?? null),
        observaciones:
          Object.prototype.hasOwnProperty.call(incomingChanges, 'observaciones')
            ? normalizeObservaciones(incomingChanges.observaciones)
            : currentMovement.observaciones
      };

      assertMovimientoBusinessRules(finalState);
      const { owner, vta } = await resolveOwnerAndVta(finalState.propietarioId, finalState.vtaId, transaction);
      finalState.tipovta = assertTipovtaForVta(vta, finalState.tipovta);

      const auditEntries = buildAuditEntries(
        currentMovement,
        {
          ...finalState,
          propietarioNombre: owner.nombre,
          vtaCodigo: vta.codigo,
          vtaNombre: vta.nombre
        },
        auth
      );

      if (auditEntries.length === 0) {
        return {
          changed: false,
          movement: currentMovement
        };
      }

      const dbChanges = {};

      if (formatDateOnly(currentMovement.fecha) !== finalState.fecha) {
        dbChanges.fecha = finalState.fecha;
      }

      if (formatDateOnly(currentMovement.decada) !== finalState.decada) {
        dbChanges.decada = finalState.decada;
      }

      if (currentMovement.propietario_id !== finalState.propietarioId) {
        dbChanges.propietarioId = finalState.propietarioId;
      }

      if (currentMovement.vta_id !== finalState.vtaId) {
        dbChanges.vtaId = finalState.vtaId;
      }

      if (Number(currentMovement.cantidad) !== Number(finalState.cantidad)) {
        dbChanges.cantidad = finalState.cantidad;
      }

      if ((currentMovement.observaciones || null) !== (finalState.observaciones || null)) {
        dbChanges.observaciones = finalState.observaciones || null;
      }

      if ((currentMovement.tipovta ?? null) !== finalState.tipovta) {
        dbChanges.tipovta = finalState.tipovta;
      }

      // Recalculate tarifa/total when cantidad, propietario or VTA changed
      const economicFieldsChanged =
        dbChanges.cantidad !== undefined ||
        dbChanges.propietarioId !== undefined ||
        dbChanges.vtaId !== undefined;

      if (economicFieldsChanged) {
        const tarifaRecord = await movimientosRepository.findTarifaByOwnerAndVta(
          finalState.propietarioId,
          finalState.vtaId,
          transaction
        );
        const tarifaValor = tarifaRecord ? Number(tarifaRecord.valor) : null;
        dbChanges.tarifa = tarifaValor;
        dbChanges.total = tarifaValor !== null ? Number(finalState.cantidad) * tarifaValor : null;
      }

      // Pass expectedVersion for optimistic locking when provided
      if (expectedVersion != null) {
        dbChanges.expectedVersion = expectedVersion;
      }

      const affectedRows = await movimientosRepository.updateMovement(movimientoId, dbChanges, auth.userId, transaction);

      if (affectedRows === 0) {
        throw new AppError(
          409,
          'El movimiento fue modificado por otro usuario. Recargue los datos e intente nuevamente.'
        );
      }

      await movimientosRepository.insertAuditLogs(movimientoId, auditEntries, transaction);

      const freshMovement = await movimientosRepository.findMovementById(movimientoId, transaction);

      return {
        changed: true,
        movement: freshMovement
      };
    });

    return {
      data: {
        message: updatedMovement.changed
          ? 'Movimiento actualizado correctamente'
          : 'No se detectaron cambios reales para auditar',
        movimiento: mapMovimiento(updatedMovement.movement)
      }
    };
  },

  async exportToExcel(query) {
    const EXPORT_MAX_ROWS = 10000;

    const filters = movimientoFiltersSchema.parse(normalizeMovimientoFilters(query));

    // Phase 1 — volume check: count before fetching rows
    const count = await movimientosRepository.countExportMovements(filters);
    if (count > EXPORT_MAX_ROWS) {
      throw new AppError(
        422,
        `El filtro actual retorna ${count.toLocaleString('es-AR')} registros. El límite de exportación es ${EXPORT_MAX_ROWS.toLocaleString('es-AR')}. Refiná los filtros antes de exportar.`
      );
    }

    // Phase 5 — only fetch the columns needed for the report
    const records = await movimientosRepository.exportMovements(filters);

    // Phase 2 — dynamic filename timestamp  (returned to caller)
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
    const filename = `movimientos_${timestamp}.xlsx`;

    // Phase 6 — header style constants
    const HEADER_FILL = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    const HEADER_FONT = { bold: true };
    const THIN_BORDER = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };

    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ useStyles: true });

    const sheet = workbook.addWorksheet('Movimientos');

    sheet.columns = [
      { header: 'Fecha', key: 'fecha', width: 14 },
      { header: 'Decada', key: 'decada', width: 14 },
      { header: 'Propietario', key: 'propietario', width: 26 },
      { header: 'NIT', key: 'propietarioNit', width: 16 },
      { header: 'VTA Codigo', key: 'vtaCodigo', width: 14 },
      { header: 'VTA Nombre', key: 'vtaNombre', width: 26 },
      { header: 'Tipo', key: 'tipovta', width: 14 },
      { header: 'Unidad Medida', key: 'udmvta', width: 16 },
      { header: 'CECO', key: 'ceco', width: 16 },
      { header: 'Cantidad', key: 'cantidad', width: 14 },
      { header: 'Tarifa', key: 'tarifa', width: 14 },
      { header: 'Total', key: 'total', width: 16 },
      { header: 'Usuario', key: 'usuario', width: 20 },
      { header: 'Fecha creacion', key: 'fechaCreacion', width: 18 },
      { header: 'Observaciones', key: 'observaciones', width: 36 }
    ];

    // Apply header styles
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = HEADER_FONT;
      cell.fill = HEADER_FILL;
      cell.border = THIN_BORDER;
    });
    headerRow.commit();

    // Phase 5 — single pass, no redundant iterations
    let totalCantidad = 0;
    let totalImporte = 0;
    for (const record of records) {
      const cantidad = Number(record.cantidad);
      const tarifa = record.tarifa != null ? Number(record.tarifa) : null;
      const total = record.total != null ? Number(record.total) : null;
      totalCantidad += cantidad;
      if (total !== null) totalImporte += total;

      const row = sheet.addRow({
        fecha: toDisplayDate(record.fecha),
        decada: toDisplayDate(record.decada),
        propietario: record.propietario,
        propietarioNit: record.propietario_nit ?? '',
        vtaCodigo: record.vta_codigo,
        vtaNombre: record.vta_nombre,
        tipovta: record.tipovta ?? '',
        udmvta: record.udmvta ?? '',
        ceco: record.ceco ?? '',
        cantidad,
        tarifa,
        total,
        usuario: record.usuario,
        fechaCreacion: toDisplayDate(record.fecha_creacion),
        observaciones: record.observaciones ?? ''
      });

      // Apply number format and borders to data rows
      row.getCell('cantidad').numFmt = '#,##0.00';
      if (tarifa !== null) row.getCell('tarifa').numFmt = '#,##0.00';
      if (total !== null) row.getCell('total').numFmt = '#,##0.00';
      row.eachCell((cell) => {
        cell.border = THIN_BORDER;
      });
      row.commit();
    }

    // Phase 7 — totals row
    if (records.length > 0) {
      const totalRow = sheet.addRow({
        fecha: '',
        decada: '',
        propietario: '',
        propietarioNit: '',
        vtaCodigo: '',
        vtaNombre: 'TOTAL',
        tipovta: '',
        udmvta: '',
        ceco: '',
        cantidad: totalCantidad,
        tarifa: null,
        total: totalImporte,
        usuario: '',
        fechaCreacion: '',
        observaciones: ''
      });
      totalRow.getCell('vtaNombre').font = HEADER_FONT;
      totalRow.getCell('cantidad').numFmt = '#,##0.00';
      totalRow.getCell('cantidad').font = HEADER_FONT;
      totalRow.getCell('total').numFmt = '#,##0.00';
      totalRow.getCell('total').font = HEADER_FONT;
      totalRow.eachCell((cell) => {
        cell.border = THIN_BORDER;
      });
      totalRow.commit();
    }

    sheet.commit();
    await workbook.commit();
    return { stream: workbook.stream, filename, count: records.length };
  }
};
