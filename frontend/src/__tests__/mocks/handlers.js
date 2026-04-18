import { http, HttpResponse } from 'msw';

const API_BASE = 'http://localhost:5000/api';

/**
 * Handlers MSW para mockear endpoints REST.
 * Proporciona datos realistas y comportamientos predecibles para tests.
 */

// Datos de prueba
export const mockOwners = [
  { id: 1, nombre: 'Propietario A', ruc: '20001234567' },
  { id: 2, nombre: 'Propietario B', ruc: '20007654321' },
  { id: 3, nombre: 'Propietario C', ruc: '20005555555' },
];

export const mockVtas = {
  1: [
    { id: 11, codigo: 'VTA-001', nombre: 'Venta Zona Norte', propietarioId: 1 },
    { id: 12, codigo: 'VTA-002', nombre: 'Venta Zona Sur', propietarioId: 1 },
  ],
  2: [
    { id: 21, codigo: 'VTA-003', nombre: 'Venta Este', propietarioId: 2 },
  ],
};

export const mockMovimientos = Array.from({ length: 250 }, (_, i) => ({
  id: i + 1,
  fecha: new Date(2026, 3, Math.floor(i / 10) + 1).toISOString().split('T')[0],
  propietarioId: Math.floor(Math.random() * 3) + 1,
  vtaId: [11, 12, 21][Math.floor(Math.random() * 3)],
  usuario: `user_${Math.floor(Math.random() * 5)}`,
  cantidad: Math.floor(Math.random() * 1000) + 1,
  cantidadMin: Math.floor(Math.random() * 100),
  cantidadMax: Math.floor(Math.random() * 2000),
  observaciones: Math.random() > 0.7 ? `Observación ${i}` : '',
  total: Math.random() * 50000,
}));

export const handlers = [
  // GET /api/propietarios
  http.get(`${API_BASE}/propietarios`, () => {
    return HttpResponse.json({
      items: mockOwners,
      pagination: { total: mockOwners.length, page: 0 },
    });
  }),

  // GET /api/propietarios/:id/vtas
  http.get(`${API_BASE}/propietarios/:propietarioId/vtas`, ({ params }) => {
    const { propietarioId } = params;
    const vtas = mockVtas[propietarioId] || [];
    return HttpResponse.json({
      items: vtas,
      pagination: { total: vtas.length },
    });
  }),

  // GET /api/movimientos (con filtros, paginación, ordenamiento)
  http.get(`${API_BASE}/movimientos`, ({ request }) => {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);

    // Simular filtrado
    let filtered = mockMovimientos;

    if (params.fechaDesde) {
      filtered = filtered.filter(m => m.fecha >= params.fechaDesde);
    }
    if (params.fechaHasta) {
      filtered = filtered.filter(m => m.fecha <= params.fechaHasta);
    }
    if (params.propietarioId) {
      filtered = filtered.filter(m => String(m.propietarioId) === String(params.propietarioId));
    }
    if (params.vtaId) {
      filtered = filtered.filter(m => String(m.vtaId) === String(params.vtaId));
    }
    if (params.usuario) {
      filtered = filtered.filter(m => m.usuario.includes(params.usuario));
    }
    if (params.cantidadMin) {
      filtered = filtered.filter(m => m.cantidadMin >= Number(params.cantidadMin));
    }
    if (params.cantidadMax) {
      filtered = filtered.filter(m => m.cantidadMax <= Number(params.cantidadMax));
    }
    if (params.observaciones) {
      filtered = filtered.filter(m =>
        m.observaciones.toLowerCase().includes(params.observaciones.toLowerCase())
      );
    }

    // Paginación
    const offset = Number(params.offset) || 0;
    const limit = Number(params.limit) || 10;
    const paginated = filtered.slice(offset, offset + limit);

    // Ordenamiento
    if (params.sortBy) {
      paginated.sort((a, b) => {
        const aVal = a[params.sortBy];
        const bVal = b[params.sortBy];
        const cmp = aVal > bVal ? 1 : -1;
        return params.sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return HttpResponse.json({
      items: paginated,
      pagination: {
        total: filtered.length,
        page: Math.floor(offset / limit),
        limit,
        offset,
      },
    });
  }),

  // GET /api/movimientos/:id
  http.get(`${API_BASE}/movimientos/:id`, ({ params }) => {
    const { id } = params;
    const movimiento = mockMovimientos.find(m => String(m.id) === String(id));
    if (!movimiento) {
      return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return HttpResponse.json(movimiento);
  }),

  // POST /api/movimientos
  http.post(`${API_BASE}/movimientos`, async ({ request }) => {
    const body = await request.json();
    const newMovimiento = {
      id: mockMovimientos.length + 1,
      ...body,
      fecha: new Date().toISOString().split('T')[0],
    };
    return HttpResponse.json(newMovimiento, { status: 201 });
  }),

  // PUT /api/movimientos/:id
  http.put(`${API_BASE}/movimientos/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = await request.json();
    const index = mockMovimientos.findIndex(m => String(m.id) === String(id));
    if (index === -1) {
      return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const updated = { ...mockMovimientos[index], ...body };
    return HttpResponse.json(updated);
  }),

  // DELETE /api/movimientos/:id
  http.delete(`${API_BASE}/movimientos/:id`, ({ params }) => {
    const { id } = params;
    const index = mockMovimientos.findIndex(m => String(m.id) === String(id));
    if (index === -1) {
      return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    }
    mockMovimientos.splice(index, 1);
    return HttpResponse.json({ success: true });
  }),
];
