import path from 'path';
import { fileURLToPath } from 'url';
import { jobsService } from '../../services/jobs/jobsService.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXPORTS_DIR = path.resolve(__dirname, '../../../exports');

export const jobsController = {
  createExportJob: asyncHandler(async (req, res) => {
    const result = await jobsService.createExportJob(req.query, req.auth);
    res.status(result.status || 202).json(result.data);
  }),

  getStatus: asyncHandler(async (req, res) => {
    const result = await jobsService.getJobStatus(req.params.id, req.auth);
    res.status(result.status || 200).json(result.data);
  }),

  download: asyncHandler(async (req, res) => {
    const result = await jobsService.getJobFile(req.params.id, req.auth);
    const filePath = path.join(EXPORTS_DIR, result.filename);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.filename}"`
    );
    res.sendFile(filePath);
  }),

  listUserJobs: asyncHandler(async (req, res) => {
    const result = await jobsService.listUserJobs(req.auth);
    res.status(result.status || 200).json(result.data);
  })
};
