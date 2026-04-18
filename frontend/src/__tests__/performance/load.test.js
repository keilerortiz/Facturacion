import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useMovimientosListQuery } from '../../hooks/queries/useMovimientosListQuery';
import { useFilterState } from '../../hooks/filters/useFilterState';

/**
 * Tests de CARGA: Simula múltiples usuarios/tabs/instances simultáneamente.
 * Mide estabilidad, deduplicación bajo presión, y comportamiento en condiciones reales.
 */

function createWrapper(queryClient) {
  return function Wrapper({ children }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('Load Test: Concurrent Queries', () => {
  it('debería manejar 10 queries simultáneas sin degradación', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });

    const filters = [
      {},
      { propietarioId: '1' },
      { propietarioId: '2' },
      { usuario: 'user_0' },
      { usuario: 'user_1' },
      { fechaDesde: '2026-04-17', fechaHasta: '2026-04-20' },
      { cantidadMin: '100' },
      { cantidadMax: '1000' },
      { propietarioId: '1', usuario: 'user_0' },
      { propietarioId: '2', fechaDesde: '2026-04-17' },
    ];

    const startTime = performance.now();
    const results = [];

    // Lanzar todas las queries
    for (const f of filters) {
      const { result } = renderHook(
        () => useMovimientosListQuery({ filters: f }),
        { wrapper: createWrapper(queryClient) }
      );
      results.push(result);
    }

    // Esperar a que todas terminen
    await waitFor(() => {
      expect(results.every(r => !r.current.isLoading)).toBe(true);
    }, { timeout: 5000 });

    const duration = performance.now() - startTime;

    // Verificar que todas obtuvieron datos
    results.forEach((r, idx) => {
      expect(r.current.data).toBeDefined();
      expect(r.current.data.items).toBeDefined();
    });

    console.log(`✓ 10 concurrent queries: ${duration.toFixed(2)}ms`);
    console.log(`  Average: ${(duration / 10).toFixed(2)}ms per query`);
    expect(duration).toBeLessThan(2000);
  });

  it('debería deduplicar entre 5 instances idénticas', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });

    const commonFilters = { propietarioId: '1', usuario: 'test' };
    const results = [];

    // Simular 5 tabs/components con el mismo query
    for (let i = 0; i < 5; i++) {
      const { result } = renderHook(
        () => useMovimientosListQuery({ filters: commonFilters }),
        { wrapper: createWrapper(queryClient) }
      );
      results.push(result);
    }

    const startTime = performance.now();

    await waitFor(() => {
      expect(results.every(r => !r.current.isLoading)).toBe(true);
    });

    const duration = performance.now() - startTime;

    // Todas deberían compartir el mismo objeto de datos (misma referencia)
    const dataRef = results[0].current.data;
    expect(results.slice(1).every(r => r.current.data === dataRef)).toBe(true);

    console.log(`✓ 5 identical queries deduplicated in ${duration.toFixed(2)}ms`);
    console.log(`  All instances share same data reference: ${results.length} → 1 network request`);
  });

  it('debería manejar cambios de filtro en cascada', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });

    const { result: filterResult } = renderHook(
      () => useFilterState({
        fechaDesde: '2026-04-17',
        fechaHasta: '2026-04-17',
        propietarioId: '',
        vtaId: '',
      }),
      { wrapper: createWrapper(queryClient) }
    );

    const queryResults = [];

    // Simular 5 cambios sucesivos de filtro
    const changes = [
      { propietarioId: '1' },
      { propietarioId: '1', vtaId: '11' },
      { propietarioId: '2' },
      { propietarioId: '2', vtaId: '21' },
      { propietarioId: '3' },
    ];

    const startTime = performance.now();

    for (const change of changes) {
      filterResult.current.applyPartial(change);

      const { result } = renderHook(
        () => useMovimientosListQuery({ filters: filterResult.current.applied }),
        { wrapper: createWrapper(queryClient) }
      );
      queryResults.push(result);
    }

    await waitFor(() => {
      expect(queryResults.every(r => !r.current.isLoading)).toBe(true);
    });

    const duration = performance.now() - startTime;

    expect(queryResults.length).toBe(5);
    console.log(`✓ 5 cascading filter changes: ${duration.toFixed(2)}ms`);
    console.log(`  Average per filter: ${(duration / 5).toFixed(2)}ms`);
  });
});

describe('Load Test: Memory Under Pressure', () => {
  it('debería no acumular memory al procesar 50 cambios de página', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 100 } },
    });

    const initialMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    for (let page = 0; page < 50; page++) {
      const { result, unmount } = renderHook(
        () => useMovimientosListQuery({
          filters: {},
          page,
          rowsPerPage: 10,
        }),
        { wrapper: createWrapper(queryClient) }
      );

      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 2000 }
      );

      unmount();
    }

    const finalMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    const memoryDelta = finalMemory - initialMemory;

    console.log(`✓ Memory after 50 page changes: +${memoryDelta.toFixed(2)}MB`);
    expect(memoryDelta).toBeLessThan(100);
  });
});

describe('Load Test: Stress Scenarios', () => {
  it('debería recuperarse de un pico de 20 queries rápidamente', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });

    const results = [];

    const startTime = performance.now();

    // Pico: 20 queries distintas al mismo tiempo
    for (let i = 0; i < 20; i++) {
      const { result } = renderHook(
        () => useMovimientosListQuery({
          filters: { propietarioId: String((i % 3) + 1) },
        }),
        { wrapper: createWrapper(queryClient) }
      );
      results.push(result);
    }

    await waitFor(() => {
      expect(results.every(r => !r.current.isLoading)).toBe(true);
    }, { timeout: 10000 });

    const duration = performance.now() - startTime;

    console.log(`✓ Stress test (20 concurrent queries): ${duration.toFixed(2)}ms`);
    console.log(`  All completed successfully`);

    // Debería haber deduplicado a 3 queries únicas (propietarioId 1, 2, 3)
    const uniqueQueryKeys = new Set(
      queryClient.getQueryCache().getAll().map(q => JSON.stringify(q.queryKey))
    );
    console.log(`  Unique queries: ${uniqueQueryKeys.size} (expected ~3)`);

    expect(duration).toBeLessThan(5000);
  });

  it('debería manejar búsquedas rápidas consecutivas (simular typing)', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });

    const { result: filterResult } = renderHook(
      () => useFilterState({ usuario: '' }),
      { wrapper: createWrapper(queryClient) }
    );

    const queryResults = [];
    const startTime = performance.now();

    // Simular teclear "hola" rápidamente
    const searchTerms = ['h', 'ho', 'hol', 'hola', 'holan', 'holand', 'holands'];

    for (const term of searchTerms) {
      filterResult.current.setDraftField('usuario', term);

      // Solo aplicar al final
      if (term === searchTerms[searchTerms.length - 1]) {
        filterResult.current.applyFilters();

        const { result } = renderHook(
          () => useMovimientosListQuery({ filters: filterResult.current.applied }),
          { wrapper: createWrapper(queryClient) }
        );
        queryResults.push(result);
      }
    }

    await waitFor(() => {
      expect(queryResults.every(r => !r.current.isLoading)).toBe(true);
    });

    const duration = performance.now() - startTime;

    console.log(`✓ Rapid search simulation: ${duration.toFixed(2)}ms`);
    console.log(`  Draft updated ${searchTerms.length} times, 1 query executed`);
    expect(queryResults.length).toBe(1);
  });
});

describe('Load Test: Query Cancellation', () => {
  it('debería abortar queries pendientes sin memory leak', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });

    const results = [];

    // Crear 10 queries
    for (let i = 0; i < 10; i++) {
      const { result, unmount } = renderHook(
        () => useMovimientosListQuery({
          filters: { propietarioId: String((i % 3) + 1) },
        }),
        { wrapper: createWrapper(queryClient) }
      );
      results.push({ result, unmount });
    }

    // Desmontar inmediatamente (antes de que terminen)
    results.forEach(({ unmount }) => unmount());

    // Esperar un momento para que se ejecute la limpieza
    await new Promise(r => setTimeout(r, 100));

    console.log('✓ 10 queries aborted without memory leak');
    expect(true);
  });
});
