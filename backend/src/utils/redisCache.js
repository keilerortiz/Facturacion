import { env } from '../config/env.js';
import { getRedisClient } from '../config/redis.js';

function stableSerialize(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}

export function buildCacheKey(namespace, payload) {
  return `${env.redis.keyPrefix}${namespace}:${stableSerialize(payload)}`;
}

export async function getOrSetJsonCache(key, ttlSeconds, loader) {
  const client = await getRedisClient();

  if (!client) {
    return loader();
  }

  try {
    const cachedValue = await client.get(key);

    if (cachedValue) {
      return JSON.parse(cachedValue);
    }
  } catch {
    return loader();
  }

  const freshValue = await loader();

  try {
    await client.set(key, JSON.stringify(freshValue), {
      EX: ttlSeconds
    });
  } catch {
    return freshValue;
  }

  return freshValue;
}
