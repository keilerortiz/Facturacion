import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

function mapSqlError(err) {
  const sqlNumber = err.number || err.originalError?.info?.number;
  const connectionCodes = new Set([
    'ESOCKET',
    'ETIMEOUT',
    'ELOGIN',
    'EINSTLOOKUP',
    'EALREADYCONNECTED',
    'ECONNCLOSED',
    'ENOTOPEN'
  ]);

  if ([2601, 2627].includes(sqlNumber)) {
    return {
      status: 409,
      message: 'La operacion viola una restriccion unica en SQL Server'
    };
  }

  if (sqlNumber === 547) {
    return {
      status: 409,
      message: 'La operacion fue rechazada por una relacion o constraint de SQL Server'
    };
  }

  if ([241, 242, 245, 515, 8114].includes(sqlNumber)) {
    return {
      status: 400,
      message: 'Los datos enviados no cumplen con el formato esperado por SQL Server'
    };
  }

  if (
    err.name === 'ConnectionError' ||
    err.name === 'ConnectionPoolError' ||
    connectionCodes.has(err.code)
  ) {
    return {
      status: 503,
      message: 'No fue posible conectarse a la base de datos'
    };
  }

  if (err.name === 'RequestError' || err.code?.startsWith?.('EREQUEST')) {
    return {
      status: 500,
      message: 'SQL Server devolvio un error al ejecutar la operacion'
    };
  }

  return null;
}

export function errorHandler(err, _req, res, _next) {
  void _next;
  const sqlError = mapSqlError(err);

  logger.error('request:error', {
    requestId: _req.id,
    message: err.message,
    status: err.status,
    name: err.name,
    code: err.code,
    number: err.number,
    stack: env.nodeEnv !== 'production' ? err.stack : undefined
  });

  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Datos de entrada invalidos',
      errors: err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message
      }))
    });
  }

  if (sqlError) {
    return res.status(sqlError.status).json({
      message: sqlError.message
    });
  }

  const status = err.status || 500;
  const response = {
    message: err.message || 'Error interno del servidor'
  };

  if (env.nodeEnv !== 'production' && err.details) {
    response.details = err.details;
  }

  return res.status(status).json(response);
}
