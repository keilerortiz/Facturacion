import { Router } from 'express';
import { authRoutes } from './authRoutes.js';
import { jobsRoutes } from './jobsRoutes.js';
import { movimientosRoutes } from './movimientosRoutes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/movimientos', movimientosRoutes);
apiRouter.use('/jobs', jobsRoutes);
