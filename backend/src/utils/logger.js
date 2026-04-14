import { env } from '../config/env.js';

const LOG_LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

const CONFIGURED_LEVEL =
  LOG_LEVELS[process.env.LOG_LEVEL || (env.nodeEnv === 'production' ? 'info' : 'debug')] || 20;

function shouldLog(level) {
  return (LOG_LEVELS[level] || 20) >= CONFIGURED_LEVEL;
}

function serialize(level, message, meta) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: 'facturacion-api',
    environment: env.nodeEnv
  };

  if (meta) {
    Object.assign(entry, meta);
  }

  return JSON.stringify(entry);
}

function write(level, message, meta) {
  if (!shouldLog(level)) return;

  const line = serialize(level, message, meta);

  if (level === 'error') {
    process.stderr.write(line + '\n');
  } else {
    process.stdout.write(line + '\n');
  }
}

export const logger = {
  debug: (message, meta) => write('debug', message, meta),
  info: (message, meta) => write('info', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  error: (message, meta) => write('error', message, meta),

  /**
   * Crea un child logger con contexto fijo (requestId, userId, etc.)
   * Cada log emitido hereda ese contexto automáticamente.
   */
  child(context) {
    return {
      debug: (msg, m) => write('debug', msg, { ...context, ...m }),
      info: (msg, m) => write('info', msg, { ...context, ...m }),
      warn: (msg, m) => write('warn', msg, { ...context, ...m }),
      error: (msg, m) => write('error', msg, { ...context, ...m })
    };
  }
};
