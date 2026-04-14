import { Router } from 'express';
import { pingDatabase } from '../config/database.js';
import { logger } from '../utils/logger.js';

const router = Router();

const startedAt = new Date().toISOString();

/**
 * GET /health/live
 * Liveness probe — el proceso responde.
 * Kubernetes / ALB usan esto para saber si la instancia está viva.
 * No valida dependencias; solo que el event loop funciona.
 */
router.get('/live', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    startedAt
  });
});

/**
 * GET /health/ready
 * Readiness probe — el proceso puede atender tráfico.
 * Valida conexión a BD (y Redis en el futuro).
 * Si falla → load balancer no envía tráfico a esta instancia.
 */
router.get('/ready', async (req, res) => {
  const checks = {};
  let healthy = true;

  try {
    const dbResult = await pingDatabase();
    checks.database = {
      status: dbResult.ok ? 'ok' : 'error',
      latencyMs: dbResult.latencyMs
    };
    if (!dbResult.ok) healthy = false;
  } catch (error) {
    checks.database = { status: 'error', message: error.message };
    healthy = false;
    logger.error('health:ready:db_failed', {
      requestId: req.id,
      error: error.message
    });
  }

  const statusCode = healthy ? 200 : 503;

  res.status(statusCode).json({
    status: healthy ? 'ok' : 'degraded',
    uptime: process.uptime(),
    startedAt,
    checks
  });
});

export const healthRouter = router;
