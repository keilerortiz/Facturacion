import sql from 'mssql';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let poolPromise;
let activePool;

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function connectWithRetry(attempt = 1) {
  const pool = new sql.ConnectionPool(env.db);

  pool.on('error', (error) => {
    logger.error('db:pool_error', {
      message: error.message,
      code: error.code,
      number: error.number
    });

    if (activePool === pool) {
      activePool = undefined;
      poolPromise = undefined;
    }
  });

  try {
    const connectedPool = await pool.connect();
    activePool = connectedPool;
    logger.info('db:connected', { server: env.db.server, database: env.db.database });
    return connectedPool;
  } catch (error) {
    await pool.close().catch(() => undefined);

    if (attempt >= env.db.retry.maxAttempts) {
      throw error;
    }

    const waitTime = env.db.retry.backoffMs * attempt;
    logger.warn('db:retry', { attempt, waitMs: waitTime, error: error.message });
    await delay(waitTime);
    return connectWithRetry(attempt + 1);
  }
}

export function getDbPool() {
  if (!poolPromise) {
    poolPromise = connectWithRetry().catch((error) => {
      poolPromise = undefined;
      activePool = undefined;
      throw error;
    });
  }

  return poolPromise;
}

export async function closeDbPool() {
  if (activePool) {
    await activePool.close().catch(() => undefined);
  }

  activePool = undefined;
  poolPromise = undefined;
}

export async function pingDatabase() {
  const startedAt = Date.now();
  const pool = await getDbPool();
  const result = await pool.request().query('SELECT 1 AS ok');

  return {
    ok: result.recordset[0]?.ok === 1,
    latencyMs: Date.now() - startedAt
  };
}

export async function withTransaction(callback) {
  const pool = await getDbPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    const result = await callback(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback().catch(() => undefined);

    throw error;
  }
}

export { sql };
