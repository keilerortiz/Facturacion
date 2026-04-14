import { getDbPool, sql } from '../../config/database.js';

async function resolveRequest(executor) {
  if (executor) {
    return executor.request();
  }

  const pool = await getDbPool();
  return pool.request();
}

export const jobsRepository = {
  async createJob(job, executor) {
    const request = await resolveRequest(executor);

    await request
      .input('id', sql.NVarChar(64), job.id)
      .input('tipo', sql.NVarChar(50), job.tipo)
      .input('usuarioId', sql.Int, Number(job.usuarioId))
      .input('usuario', sql.NVarChar(100), job.usuario)
      .input('parametros', sql.NVarChar(sql.MAX), job.parametros ? JSON.stringify(job.parametros) : null)
      .query(`
        INSERT INTO Jobs (id, tipo, estado, progreso, usuario_id, usuario, parametros, fecha_creacion)
        VALUES (@id, @tipo, 'pending', 0, @usuarioId, @usuario, @parametros, SYSUTCDATETIME())
      `);
  },

  async findJobById(id, executor) {
    const request = await resolveRequest(executor);

    const result = await request
      .input('id', sql.NVarChar(64), id)
      .query(`
        SELECT id, tipo, estado, progreso, resultado, error,
               usuario_id, usuario, parametros, archivo,
               fecha_creacion, fecha_inicio, fecha_fin
        FROM Jobs
        WHERE id = @id
      `);

    return result.recordset[0] || null;
  },

  async updateJobStatus(id, updates, executor) {
    const request = await resolveRequest(executor);
    const assignments = [];

    request.input('id', sql.NVarChar(64), id);

    if (updates.estado !== undefined) {
      request.input('estado', sql.NVarChar(20), updates.estado);
      assignments.push('estado = @estado');
    }

    if (updates.progreso !== undefined) {
      request.input('progreso', sql.Int, updates.progreso);
      assignments.push('progreso = @progreso');
    }

    if (updates.resultado !== undefined) {
      request.input('resultado', sql.NVarChar(sql.MAX), updates.resultado);
      assignments.push('resultado = @resultado');
    }

    if (updates.error !== undefined) {
      request.input('error', sql.NVarChar(1000), String(updates.error).slice(0, 1000));
      assignments.push('error = @error');
    }

    if (updates.archivo !== undefined) {
      request.input('archivo', sql.NVarChar(500), updates.archivo);
      assignments.push('archivo = @archivo');
    }

    if (updates.fechaInicio) {
      assignments.push('fecha_inicio = SYSUTCDATETIME()');
    }

    if (updates.fechaFin) {
      assignments.push('fecha_fin = SYSUTCDATETIME()');
    }

    if (assignments.length === 0) return;

    await request.query(`
      UPDATE Jobs
      SET ${assignments.join(', ')}
      WHERE id = @id
    `);
  },

  async listJobsByUser(usuarioId, limit = 20, executor) {
    const request = await resolveRequest(executor);

    const result = await request
      .input('usuarioId', sql.Int, Number(usuarioId))
      .input('limit', sql.Int, limit)
      .query(`
        SELECT TOP (@limit)
          id, tipo, estado, progreso, resultado, error,
          usuario, archivo, fecha_creacion, fecha_inicio, fecha_fin
        FROM Jobs
        WHERE usuario_id = @usuarioId
        ORDER BY fecha_creacion DESC
      `);

    return result.recordset;
  },

  async cleanupOldJobs(daysOld = 7, executor) {
    const request = await resolveRequest(executor);

    const result = await request
      .input('daysOld', sql.Int, daysOld)
      .query(`
        DELETE FROM Jobs
        WHERE fecha_creacion < DATEADD(DAY, -@daysOld, SYSUTCDATETIME());
        SELECT @@ROWCOUNT AS deleted;
      `);

    return result.recordset[0]?.deleted ?? 0;
  },

  async markZombiesAsFailed(executor) {
    const request = await resolveRequest(executor);

    const result = await request.query(`
      UPDATE Jobs
      SET estado = 'failed',
          error = 'Interrupted by server restart',
          fecha_fin = SYSUTCDATETIME()
      WHERE estado = 'processing';
      SELECT @@ROWCOUNT AS updated;
    `);

    return result.recordset[0]?.updated ?? 0;
  }
};
