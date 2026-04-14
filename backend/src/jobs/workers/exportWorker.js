import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ExcelJS from 'exceljs';
import {
  movimientoFiltersSchema
} from '../../domain/movimientos/movimientoSchemas.js';
import { movimientosRepository } from '../../repositories/movimientos/movimientosRepository.js';
import { jobsRepository } from '../../repositories/jobs/jobsRepository.js';
import { logger } from '../../utils/logger.js';
import { formatDateOnly } from '../../utils/dateUtils.js';
import { registerWorker } from '../jobQueue.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXPORTS_DIR = path.resolve(__dirname, '../../../exports');

const EXPORT_MAX_ROWS = 10000;

function toDisplayDate(value) {
  const iso = formatDateOnly(value);
  if (!iso) return '';
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

async function processExportJob(job) {
  const jobId = job.id;
  const startTime = Date.now();

  logger.info('exportWorker:start', { jobId, usuario: job.usuario });

  try {
    await jobsRepository.updateJobStatus(jobId, {
      estado: 'processing',
      progreso: 0,
      fechaInicio: true
    });

    const filters = movimientoFiltersSchema.parse(job.parametros || {});

    // Volume check
    const count = await movimientosRepository.countExportMovements(filters);
    if (count > EXPORT_MAX_ROWS) {
      throw new Error(
        `El filtro retorna ${count.toLocaleString('es-AR')} registros. Límite: ${EXPORT_MAX_ROWS.toLocaleString('es-AR')}.`
      );
    }

    await jobsRepository.updateJobStatus(jobId, { progreso: 10 });

    const records = await movimientosRepository.exportMovements(filters);

    await jobsRepository.updateJobStatus(jobId, { progreso: 50 });

    // Build filename
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
    const filename = `movimientos_${timestamp}_${jobId.slice(0, 8)}.xlsx`;
    const filePath = path.join(EXPORTS_DIR, filename);

    // Write Excel to disk
    const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
    const HEADER_FONT = { bold: true };
    const THIN_BORDER = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' }
    };

    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
      filename: filePath,
      useStyles: true
    });

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
      { header: 'Cantidad', key: 'cantidad', width: 14 },
      { header: 'Tarifa', key: 'tarifa', width: 14 },
      { header: 'Total', key: 'total', width: 16 },
      { header: 'Usuario', key: 'usuario', width: 20 },
      { header: 'Fecha creacion', key: 'fechaCreacion', width: 18 },
      { header: 'Observaciones', key: 'observaciones', width: 36 }
    ];

    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = HEADER_FONT;
      cell.fill = HEADER_FILL;
      cell.border = THIN_BORDER;
    });
    headerRow.commit();

    let totalCantidad = 0;
    let totalImporte = 0;

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
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
        cantidad,
        tarifa,
        total,
        usuario: record.usuario,
        fechaCreacion: toDisplayDate(record.fecha_creacion),
        observaciones: record.observaciones ?? ''
      });

      row.getCell('cantidad').numFmt = '#,##0.00';
      if (tarifa !== null) row.getCell('tarifa').numFmt = '#,##0.00';
      if (total !== null) row.getCell('total').numFmt = '#,##0.00';
      row.eachCell((cell) => { cell.border = THIN_BORDER; });
      row.commit();

      // Update progress every 500 rows
      if (i > 0 && i % 500 === 0) {
        const pct = 50 + Math.floor((i / records.length) * 40);
        await jobsRepository.updateJobStatus(jobId, { progreso: pct });
      }
    }

    if (records.length > 0) {
      const totalRow = sheet.addRow({
        fecha: '', decada: '', propietario: '', propietarioNit: '',
        vtaCodigo: '', vtaNombre: 'TOTAL', tipovta: '', udmvta: '',
        cantidad: totalCantidad, tarifa: null, total: totalImporte,
        usuario: '', fechaCreacion: '', observaciones: ''
      });
      totalRow.getCell('vtaNombre').font = HEADER_FONT;
      totalRow.getCell('cantidad').numFmt = '#,##0.00';
      totalRow.getCell('cantidad').font = HEADER_FONT;
      totalRow.getCell('total').numFmt = '#,##0.00';
      totalRow.getCell('total').font = HEADER_FONT;
      totalRow.eachCell((cell) => { cell.border = THIN_BORDER; });
      totalRow.commit();
    }

    sheet.commit();
    await workbook.commit();

    await jobsRepository.updateJobStatus(jobId, {
      estado: 'completed',
      progreso: 100,
      archivo: filename,
      resultado: JSON.stringify({ rows: records.length, filename }),
      fechaFin: true
    });

    const durationMs = Date.now() - startTime;
    logger.info('exportWorker:completed', {
      jobId,
      rows: records.length,
      filename,
      durationMs
    });
  } catch (error) {
    logger.error('exportWorker:failed', {
      jobId,
      error: error.message
    });

    await jobsRepository.updateJobStatus(jobId, {
      estado: 'failed',
      error: error.message,
      fechaFin: true
    }).catch(() => {});
  }
}

export function registerExportWorker() {
  registerWorker('export-movimientos', processExportJob);
}
