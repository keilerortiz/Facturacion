import { movimientosService } from '../../services/movimientos/movimientosService.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { logger } from '../../utils/logger.js';

export const movimientosController = {
  listOwners: asyncHandler(async (_req, res) => {
    const result = await movimientosService.listOwners();
    res.status(result.status || 200).json(result.data);
  }),
  init: asyncHandler(async (req, res) => {
    const result = await movimientosService.init(req.query);
    res.status(result.status || 200).json(result.data);
  }),
  listVtasByOwner: asyncHandler(async (req, res) => {
    const result = await movimientosService.listVtasByOwner(req.query);
    res.status(result.status || 200).json(result.data);
  }),
  getRate: asyncHandler(async (req, res) => {
    const result = await movimientosService.getRate(req.query);
    res.status(result.status || 200).json(result.data);
  }),
  create: asyncHandler(async (req, res) => {
    const result = await movimientosService.create(req.body, req.auth);
    res.status(result.status || 201).json(result.data);
  }),
  list: asyncHandler(async (req, res) => {
    const result = await movimientosService.list(req.query);
    res.status(result.status || 200).json(result.data);
  }),
  detail: asyncHandler(async (req, res) => {
    const result = await movimientosService.detail(req.params.id);
    res.status(result.status || 200).json(result.data);
  }),
  history: asyncHandler(async (req, res) => {
    const result = await movimientosService.history(req.params.id);
    res.status(result.status || 200).json(result.data);
  }),
  update: asyncHandler(async (req, res) => {
    const result = await movimientosService.update(req.params.id, req.body, req.auth);
    res.status(result.status || 200).json(result.data);
  }),
  exportExcel: asyncHandler(async (req, res) => {
    let result;

    try {
      result = await movimientosService.exportToExcel(req.query);
    } catch (error) {
      // Phase 8 — re-throw AppErrors (limit exceeded / validation), wrap unexpected ones
      if (error.name === 'AppError') {
        throw error;
      }
      logger.error('export:failed', { requestId: req.id, error: error.message, usuario: req.auth?.usuario });
      res.status(500).json({ message: 'Error generando el archivo Excel' });
      return;
    }

    // Phase 4 — log every successful export
    logger.info('export:success', {
      requestId: req.id,
      usuario: req.auth?.usuario,
      filtros: req.query,
      cantidad_registros: result.count
    });

    // Phase 2 — dynamic filename, Phase 3 — auth already enforced by authMiddleware on the router
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.filename}"`
    );
    result.stream.pipe(res);
  })
};
