import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { authRepository } from '../repositories/auth/authRepository.js';
import { AppError } from '../utils/AppError.js';
import { buildCacheKey, getOrSetJsonCache } from '../utils/redisCache.js';

// TTL corto (2 min) — equilibrio entre rendimiento y reactividad ante desactivación de usuario
const USER_AUTH_CACHE_TTL = 120;

function extractBearerToken(headerValue) {
  if (!headerValue || !headerValue.startsWith('Bearer ')) {
    return null;
  }

  return headerValue.slice('Bearer '.length).trim();
}

export async function authMiddleware(req, _res, next) {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      throw new AppError(401, 'Token de acceso requerido');
    }

    const payload = jwt.verify(token, env.jwt.accessSecret, {
      issuer: env.jwt.issuer
    });

    if (payload.type !== 'access') {
      throw new AppError(401, 'Token de acceso invalido');
    }

    const cacheKey = buildCacheKey('user:auth', { id: payload.sub });
    const user = await getOrSetJsonCache(
      cacheKey,
      USER_AUTH_CACHE_TTL,
      () => authRepository.findUserById(payload.sub)
    );

    if (!user || !user.activo) {
      throw new AppError(401, 'Usuario no autorizado o inactivo');
    }

    req.auth = {
      userId: user.id,
      usuario: user.usuario,
      nombre: user.nombre,
      role: user.rol
    };
    req.user = req.auth;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new AppError(401, 'Token invalido o expirado'));
    }

    return next(error);
  }
}
