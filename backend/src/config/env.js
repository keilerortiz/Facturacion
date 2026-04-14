import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_JWT_SECRET = 'change_this_shared_jwt_secret';
const sharedJwtSecret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
const dbInstance = process.env.DB_INSTANCE || '';
const dbPort = Number(process.env.DB_PORT || 1433);

if (sharedJwtSecret === DEFAULT_JWT_SECRET) {
  const isProduction = (process.env.NODE_ENV || 'development') === 'production';
  const level = isProduction ? 'error' : 'warn';
  console[level](
    `[security] JWT_SECRET no esta configurado. ${isProduction ? 'Abortando inicio.' : 'Usando secreto por defecto (solo desarrollo).'}`
  );
  if (isProduction) {
    process.exit(1);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS || 10),
  db: {
    server: process.env.DB_SERVER || 'localhost',
    port: dbInstance ? undefined : dbPort,
    database: process.env.DB_NAME || 'MovimientosDB',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '',
    connectionTimeout: Number(process.env.DB_CONNECTION_TIMEOUT || 15000),
    requestTimeout: Number(process.env.DB_REQUEST_TIMEOUT || 15000),
    pool: {
      max: Number(process.env.DB_POOL_MAX || 20),
      min: Number(process.env.DB_POOL_MIN || 2),
      idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_TIMEOUT_MS || 60000)
    },
    options: {
      encrypt: process.env.DB_ENCRYPT === 'true',
      trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
      enableArithAbort: true,
      ...(dbInstance ? { instanceName: dbInstance } : {})
    },
    retry: {
      maxAttempts: Number(process.env.DB_RETRY_ATTEMPTS || 3),
      backoffMs: Number(process.env.DB_RETRY_BACKOFF_MS || 1500)
    }
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || sharedJwtSecret,
    refreshSecret: process.env.JWT_REFRESH_SECRET || sharedJwtSecret,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'facturacion-api'
  },
  redis: {
    enabled:
      process.env.REDIS_ENABLED === 'true' ||
      Boolean(process.env.REDIS_URL || process.env.REDIS_HOST),
    url: process.env.REDIS_URL || undefined,
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    database: Number(process.env.REDIS_DB || 0),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'facturacion:',
    cacheTtlSeconds: Number(process.env.REDIS_CACHE_TTL_SECONDS || 300),
    connectTimeoutMs: Number(process.env.REDIS_CONNECT_TIMEOUT_MS || 3000),
    retryDelayMs: Number(process.env.REDIS_RETRY_DELAY_MS || 15000)
  }
};
