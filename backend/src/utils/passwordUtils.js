import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { promisify } from 'util';
import { env } from '../config/env.js';

const scryptAsync = promisify(crypto.scrypt);

export function validatePasswordStrength(password) {
  if (typeof password !== 'string') {
    return false;
  }

  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password)
  );
}

export async function hashPassword(password) {
  return bcrypt.hash(password, env.bcryptRounds);
}

export async function verifyPassword(password, storedHash) {
  if (typeof storedHash !== 'string') {
    return false;
  }

  if (storedHash.startsWith('$2')) {
    return bcrypt.compare(password, storedHash);
  }

  if (!storedHash.startsWith('scrypt$')) {
    return false;
  }

  const [, salt, key] = storedHash.split('$');
  const derivedKey = await scryptAsync(password, salt, 64);
  const storedKeyBuffer = Buffer.from(key, 'hex');
  const derivedKeyBuffer = Buffer.from(derivedKey);

  if (storedKeyBuffer.length !== derivedKeyBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(storedKeyBuffer, derivedKeyBuffer);
}

export function generateTemporaryPassword(length = 12) {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%&*';
  const allChars = `${upper}${lower}${numbers}${special}`;

  const required = [
    upper[crypto.randomInt(upper.length)],
    lower[crypto.randomInt(lower.length)],
    numbers[crypto.randomInt(numbers.length)],
    special[crypto.randomInt(special.length)]
  ];

  while (required.length < length) {
    required.push(allChars[crypto.randomInt(allChars.length)]);
  }

  return required
    .map((char) => ({ char, order: crypto.randomInt(0, 10_000) }))
    .sort((a, b) => a.order - b.order)
    .map((item) => item.char)
    .join('');
}
