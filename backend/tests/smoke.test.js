/**
 * Smoke Tests — API Production Readiness
 *
 * Scope: integration tests against a real running DB (uses .env).
 * Purpose: catch critical regressions before deploy.
 *          These WILL create real rows in the DB (observaciones: 'smoke-test').
 *
 * Run: npm test
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app/createApp.js';
import { closeDbPool } from '../src/config/database.js';
import { closeRedisClient } from '../src/config/redis.js';

const app = createApp();

// Credentials are read from .env — set TEST_ADMIN_USER / TEST_ADMIN_PASSWORD
const ADMIN_USER = process.env.TEST_ADMIN_USER || 'admin.facturacion';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  throw new Error(
    'TEST_ADMIN_PASSWORD is required to run smoke tests. Add it to your .env file.'
  );
}

// Shared state across tests (set in login test, used in subsequent ones)
let accessToken;
let refreshToken;

afterAll(async () => {
  await closeDbPool().catch(() => {});
  await closeRedisClient().catch(() => {});
});

// ─── 1. HEALTH ─────────────────────────────────────────────────────────────

describe('Health', () => {
  it('GET /health/live → 200 ok', async () => {
    const res = await request(app).get('/health/live');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.uptime).toBe('number');
  });

  it('GET /health/ready → 200 ok (DB reachable)', async () => {
    const res = await request(app).get('/health/ready');

    expect(res.status).toBe(200);
    expect(res.body.checks.database.status).toBe('ok');
  });
});

// ─── 2. AUTH ───────────────────────────────────────────────────────────────

describe('Auth', () => {
  it('POST /api/auth/login → 200 con tokens', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ usuario: ADMIN_USER, password: ADMIN_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user.usuario).toBe(ADMIN_USER);

    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it('POST /api/auth/login → 401 con password incorrecto', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ usuario: ADMIN_USER, password: 'wrong-password-intentional' });

    expect(res.status).toBe(401);
  });

  it('POST /api/auth/refresh → 200 rotacion de token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    // El refreshToken siempre es distinto (hex aleatorio); el accessToken puede
    // ser idéntico si ambos se emiten en el mismo segundo (mismo iat en el JWT)
    expect(res.body.refreshToken).not.toBe(refreshToken);

    // Actualizar tokens para tests siguientes
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it('POST /api/auth/refresh → 401 con token ya usado (theft detection)', async () => {
    // refreshToken fue rotado en el test anterior →  guardamos el actual y lo usamos
    const validToken = refreshToken;

    // Primer uso legítimo: obtener nuevos tokens
    const rotateRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: validToken });

    expect(rotateRes.status).toBe(200);
    accessToken = rotateRes.body.accessToken;
    refreshToken = rotateRes.body.refreshToken;

    // Segundo uso del mismo token: debe detectarse como reutilización
    const reuseRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: validToken });

    expect(reuseRes.status).toBe(401);
  });
});

// ─── 3. MOVIMIENTOS ────────────────────────────────────────────────────────

describe('Movimientos', () => {
  it('GET /api/movimientos → 200 con paginación', async () => {
    const res = await request(app)
      .get('/api/movimientos?limit=10&offset=0')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(typeof res.body.pagination.total).toBe('number');
  });

  it('GET /api/movimientos → 401 sin token', async () => {
    const res = await request(app).get('/api/movimientos');

    expect(res.status).toBe(401);
  });

  it('POST /api/movimientos → 201 crea movimiento', async () => {
    // Obtener un propietario y VTA válidos
    const ownersRes = await request(app)
      .get('/api/movimientos/propietarios/lista')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(ownersRes.status).toBe(200);
    const propietario = ownersRes.body.items[0];
    expect(propietario).toBeDefined();

    const vtasRes = await request(app)
      .get(`/api/movimientos/vtas/por-propietario?propietarioId=${propietario.id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(vtasRes.status).toBe(200);
    const vta = vtasRes.body.items[0];
    expect(vta).toBeDefined();

    const today = new Date().toISOString().slice(0, 10);

    const res = await request(app)
      .post('/api/movimientos')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        fecha: today,
        decada: today,
        propietarioId: propietario.id,
        vtaId: vta.id,
        cantidad: 1,
        observaciones: 'smoke-test — puede eliminarse'
      });

    expect(res.status).toBe(201);
    expect(res.body.movimiento).toBeDefined();
    expect(typeof res.body.movimiento.id).toBe('number');
    expect(res.body.movimiento.version).toBe(1);
  });

  it('POST /api/movimientos → 400 con payload inválido', async () => {
    const res = await request(app)
      .post('/api/movimientos')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ cantidad: -1 }); // fecha/propietarioId/vtaId faltantes

    expect(res.status).toBe(400);
  });
});
