import { logger } from '../utils/logger.js';

/**
 * Middleware de logging automático por request.
 * Loggea inicio, fin y duración de cada request con contexto estructurado.
 *
 * Depende de requestId middleware (req.id debe existir).
 * Captura userId si authMiddleware ya corrió (req.auth).
 *
 * Reemplaza requestTimer + morgan para producción.
 * En dev se puede mantener morgan en paralelo sin conflicto.
 */
export function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();

  const context = {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  };

  logger.info('request:start', context);

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;

    const finishContext = {
      ...context,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs * 10) / 10,
      userId: req.auth?.userId || undefined,
      contentLength: res.getHeader('content-length') || undefined
    };

    if (res.statusCode >= 500) {
      logger.error('request:finish', finishContext);
    } else if (res.statusCode >= 400) {
      logger.warn('request:finish', finishContext);
    } else if (durationMs > 1000) {
      logger.warn('request:slow', finishContext);
    } else {
      logger.info('request:finish', finishContext);
    }
  });

  next();
}
