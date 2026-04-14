import crypto from 'crypto';
import { jobsRepository } from '../../repositories/jobs/jobsRepository.js';
import { enqueue, getQueueStats } from '../../jobs/jobQueue.js';
import { AppError } from '../../utils/AppError.js';

export const jobsService = {
  async createExportJob(query, auth) {
    const jobId = crypto.randomUUID();

    await jobsRepository.createJob({
      id: jobId,
      tipo: 'export-movimientos',
      usuarioId: auth.userId,
      usuario: auth.usuario,
      parametros: query || {}
    });

    enqueue({
      id: jobId,
      tipo: 'export-movimientos',
      usuario: auth.usuario,
      parametros: query || {}
    });

    return {
      status: 202,
      data: {
        message: 'Exportación en proceso',
        jobId
      }
    };
  },

  async getJobStatus(id, auth) {
    const job = await jobsRepository.findJobById(id);

    if (!job) {
      throw new AppError(404, 'Job no encontrado');
    }

    if (job.usuario_id !== auth.userId) {
      throw new AppError(403, 'No tiene permisos para consultar este job');
    }

    const result = {
      id: job.id,
      tipo: job.tipo,
      estado: job.estado,
      progreso: job.progreso,
      error: job.error,
      fechaCreacion: job.fecha_creacion,
      fechaInicio: job.fecha_inicio,
      fechaFin: job.fecha_fin
    };

    if (job.estado === 'completed' && job.archivo) {
      result.archivo = job.archivo;
      result.downloadUrl = `/api/jobs/${job.id}/download`;
    }

    if (job.resultado) {
      try {
        result.resultado = JSON.parse(job.resultado);
      } catch {
        result.resultado = job.resultado;
      }
    }

    return { data: result };
  },

  async getJobFile(id, auth) {
    const job = await jobsRepository.findJobById(id);

    if (!job) {
      throw new AppError(404, 'Job no encontrado');
    }

    if (job.usuario_id !== auth.userId) {
      throw new AppError(403, 'No tiene permisos para descargar este archivo');
    }

    if (job.estado !== 'completed' || !job.archivo) {
      throw new AppError(400, 'El job no tiene un archivo disponible para descargar');
    }

    return { filename: job.archivo };
  },

  async listUserJobs(auth) {
    const jobs = await jobsRepository.listJobsByUser(auth.userId);

    return {
      data: {
        items: jobs.map((job) => ({
          id: job.id,
          tipo: job.tipo,
          estado: job.estado,
          progreso: job.progreso,
          error: job.error,
          archivo: job.archivo,
          fechaCreacion: job.fecha_creacion,
          fechaInicio: job.fecha_inicio,
          fechaFin: job.fecha_fin
        }))
      }
    };
  }
};
