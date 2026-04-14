import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

function parseDurationToDate(duration) {
  const now = new Date();
  const match = /^(\d+)([dh])$/i.exec(duration);

  if (!match) {
    now.setDate(now.getDate() + 7);
    return now;
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  if (unit === 'd') {
    now.setDate(now.getDate() + amount);
    return now;
  }

  now.setHours(now.getHours() + amount);
  return now;
}

export function buildAuthPayload(user) {
  return {
    sub: String(user.id),
    usuario: user.usuario,
    nombre: user.nombre,
    role: user.rol
  };
}

export function createAccessToken(user) {
  return jwt.sign(
    {
      ...buildAuthPayload(user),
      type: 'access'
    },
    env.jwt.accessSecret,
    {
      expiresIn: env.jwt.accessExpiresIn,
      issuer: env.jwt.issuer
    }
  );
}

export function createRefreshToken() {
  return crypto.randomBytes(48).toString('hex');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function getRefreshTokenExpiryDate() {
  return parseDurationToDate(env.jwt.refreshExpiresIn);
}

export function createTokenFamily() {
  return crypto.randomBytes(32).toString('hex');
}
