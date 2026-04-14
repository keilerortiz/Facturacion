import { createClient } from 'redis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let activeClient;
let clientPromise;
let nextRetryAt = 0;

function buildRedisOptions() {
  if (env.redis.url) {
    return {
      url: env.redis.url,
      socket: {
        connectTimeout: env.redis.connectTimeoutMs,
        reconnectStrategy: false
      }
    };
  }

  return {
    socket: {
      host: env.redis.host,
      port: env.redis.port,
      connectTimeout: env.redis.connectTimeoutMs,
      reconnectStrategy: false
    },
    password: env.redis.password,
    database: env.redis.database
  };
}

async function connectRedis() {
  const client = createClient(buildRedisOptions());

  client.on('error', (error) => {
    logger.warn('redis:error', { error: error.message });
  });

  client.on('end', () => {
    if (activeClient === client) {
      activeClient = undefined;
    }
  });

  try {
    await client.connect();
    activeClient = client;
    nextRetryAt = 0;
    logger.info('redis:connected', {
      host: env.redis.url ? 'url' : env.redis.host,
      database: env.redis.database
    });
    return client;
  } catch (error) {
    nextRetryAt = Date.now() + env.redis.retryDelayMs;
    await client.quit().catch(() => client.disconnect?.());
    logger.warn('redis:unavailable', {
      error: error.message,
      retryDelayMs: env.redis.retryDelayMs
    });
    return null;
  }
}

export async function getRedisClient() {
  if (!env.redis.enabled) {
    return null;
  }

  if (activeClient?.isReady) {
    return activeClient;
  }

  if (Date.now() < nextRetryAt) {
    return null;
  }

  if (!clientPromise) {
    clientPromise = connectRedis().finally(() => {
      clientPromise = undefined;
    });
  }

  return clientPromise;
}

export async function closeRedisClient() {
  if (activeClient?.isOpen) {
    await activeClient.quit().catch(() => activeClient.disconnect?.());
  }

  activeClient = undefined;
  clientPromise = undefined;
}
