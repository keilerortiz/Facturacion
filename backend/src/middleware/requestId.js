import { randomUUID } from 'node:crypto';

/**
 * Genera un requestId único por request y lo inyecta en:
 *   - req.id           (acceso interno)
 *   - res X-Request-ID (header de respuesta, trazabilidad cliente)
 *
 * Si el cliente envía X-Request-ID, se respeta (útil para tracing distribuido).
 */
export function requestId(req, res, next) {
  const id = req.headers['x-request-id'] || randomUUID();

  req.id = id;
  res.setHeader('X-Request-ID', id);

  next();
}
