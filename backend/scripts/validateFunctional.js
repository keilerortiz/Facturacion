import { createServer } from 'http';
import { createApp } from '../src/app/createApp.js';
import { closeDbPool } from '../src/config/database.js';

function assertResponse(response, body, label) {
  if (!response.ok) {
    throw new Error(`${label} fallo con HTTP ${response.status}: ${JSON.stringify(body)}`);
  }
}

async function requestJson(baseUrl, path, options = {}) {
  const startedAt = Date.now();
  const response = await fetch(`${baseUrl}${path}`, options);
  const body = await response.json();

  return {
    response,
    body,
    latencyMs: Date.now() - startedAt
  };
}

function getTodayUtcDate() {
  return new Date().toISOString().slice(0, 10);
}

async function main() {
  const app = createApp();
  const server = createServer(app);

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const health = await requestJson(baseUrl, '/api/health/db');
    assertResponse(health.response, health.body, 'Health DB');

    const login = await requestJson(baseUrl, '/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        usuario: 'admin.facturacion',
        password: 'Admin123!'
      })
    });
    assertResponse(login.response, login.body, 'Login');

    const token = login.body.accessToken;
    const authHeaders = {
      Authorization: `Bearer ${token}`
    };

    const propietarios = await requestJson(baseUrl, '/api/movimientos/propietarios/lista', {
      headers: authHeaders
    });
    assertResponse(propietarios.response, propietarios.body, 'Propietarios');

    const propietario = propietarios.body.items[0];

    if (!propietario) {
      throw new Error('No se encontraron propietarios para la prueba funcional');
    }

    const vtas = await requestJson(
      baseUrl,
      `/api/movimientos/vtas/por-propietario?propietarioId=${propietario.id}`,
      {
        headers: authHeaders
      }
    );
    assertResponse(vtas.response, vtas.body, 'VTAs por propietario');

    const vta = vtas.body.items[0];

    if (!vta) {
      throw new Error('No se encontraron VTAs para la prueba funcional');
    }

    const movementPayload = {
      fecha: getTodayUtcDate(),
      decada: getTodayUtcDate(),
      propietarioId: propietario.id,
      vtaId: vta.id,
      cantidad: 123.45,
      observaciones: `Prueba funcional ${new Date().toISOString()}`
    };

    const createMovement = await requestJson(baseUrl, '/api/movimientos', {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(movementPayload)
    });
    assertResponse(createMovement.response, createMovement.body, 'Crear movimiento');

    const listMovements = await requestJson(baseUrl, '/api/movimientos?limit=10&offset=0', {
      headers: authHeaders
    });
    assertResponse(listMovements.response, listMovements.body, 'Listar movimientos');

    console.log(
      JSON.stringify(
        {
          health,
          login: {
            latencyMs: login.latencyMs,
            user: login.body.user?.usuario
          },
          propietarios: {
            latencyMs: propietarios.latencyMs,
            total: propietarios.body.items?.length || 0
          },
          vtas: {
            latencyMs: vtas.latencyMs,
            total: vtas.body.items?.length || 0
          },
          movimientoCreado: {
            latencyMs: createMovement.latencyMs,
            id: createMovement.body.movimiento?.id
          },
          movimientos: {
            latencyMs: listMovements.latencyMs,
            total: listMovements.body.pagination?.total || 0
          }
        },
        null,
        2
      )
    );
  } finally {
    await new Promise((resolve) => {
      server.close(resolve);
    });
    await closeDbPool().catch(() => undefined);
  }
}

main().catch((error) => {
  console.error('[validate-functional] Error fatal', error);
  process.exitCode = 1;
});
