import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { env } from '../config/env.js';
import { getRedisClient } from '../config/redis.js';

function extractBearerToken(headerValue) {
  if (!headerValue || !headerValue.startsWith('Bearer ')) {
    return null;
  }

  return headerValue.slice('Bearer '.length).trim();
}

function resolveApiKey(req) {
  const token = extractBearerToken(req.headers.authorization);

  if (token) {
    try {
      const payload = jwt.verify(token, env.jwt.accessSecret, {
        issuer: env.jwt.issuer
      });
      return `user:${payload.sub}`;
    } catch {
      return `ip:${req.ip}`;
    }
  }

  return `ip:${req.ip}`;
}

function resolveLoginKey(req) {
  const username = String(req.body?.usuario ?? req.body?.username ?? '')
    .trim()
    .toLowerCase();

  return username ? `login:${username}` : `ip:${req.ip}`;
}

function buildRedisStore(prefix) {
  if (!env.redis.enabled) {
    return undefined;
  }

  return new RedisStore({
    prefix,
    sendCommand: async (...args) => {
      const client = await getRedisClient();

      if (!client) {
        throw new Error('Redis no disponible');
      }

      return client.sendCommand(args);
    }
  });
}

export const loginRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  keyGenerator: resolveLoginKey,
  store: buildRedisStore(`${env.redis.keyPrefix}ratelimit:login:`),
  passOnStoreError: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Demasiados intentos de inicio de sesion. Intente nuevamente en un minuto.'
  }
});

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  keyGenerator: resolveApiKey,
  store: buildRedisStore(`${env.redis.keyPrefix}ratelimit:api:`),
  passOnStoreError: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Demasiadas solicitudes. Intente nuevamente en un minuto.'
  }
});
