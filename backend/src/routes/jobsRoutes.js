import { Router } from 'express';
import { jobsController } from '../controllers/jobs/jobsController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

export const jobsRoutes = Router();

jobsRoutes.use(authMiddleware);

// Async export — returns jobId immediately
jobsRoutes.post('/export', jobsController.createExportJob);

// List current user's jobs
jobsRoutes.get('/', jobsController.listUserJobs);

// Job status by ID
jobsRoutes.get('/:id', jobsController.getStatus);

// Download completed job file
jobsRoutes.get('/:id/download', jobsController.download);
