import { Router } from 'express';
import { movimientosController } from '../controllers/movimientos/movimientosController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/roleMiddleware.js';

export const movimientosRoutes = Router();

movimientosRoutes.use(authMiddleware);
movimientosRoutes.use(requireRoles('operador'));

movimientosRoutes.get('/init', movimientosController.init);
movimientosRoutes.get('/propietarios/lista', movimientosController.listOwners);
movimientosRoutes.get('/vtas/por-propietario', movimientosController.listVtasByOwner);
movimientosRoutes.get('/tarifa', movimientosController.getRate);
movimientosRoutes.post('/', movimientosController.create);
movimientosRoutes.get('/', movimientosController.list);
movimientosRoutes.get('/export', movimientosController.exportExcel);
movimientosRoutes.get('/:id', movimientosController.detail);
movimientosRoutes.get('/:id/historial', movimientosController.history);
movimientosRoutes.put('/:id', movimientosController.update);
