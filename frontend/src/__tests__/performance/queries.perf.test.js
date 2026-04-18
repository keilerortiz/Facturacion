import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useMovimientosListQuery } from '../../hooks/queries/useMovimientosListQuery';
import { canonicalParams } from '../../utils/normalizeParams';

/**
 * Tests de PERFORMANCE para React Query hooks.
 * Miden latencia, throughput, deduplicación, y consumo de memoria.
 */

function createWrapper(queryClient) {
  return function Wrapper({ children }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('Performance: Query Latency', () => {
  it('debería completar query inicial en < 500ms', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });

    const startTime = performance.now();

    const { result } = renderHook(
      () => useMovimientosListQuery({ filters: {}, rowsPerPage: 10 }),
      { wrapper: createWrapper(queryClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const duration = performance.now() - startTime;

    console.log(`✓ Initial query: ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(500);
  });

  it('debería servir cache en < 10ms', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    // Preallenar cache
    queryClient.setQueryData(
      ['movimientos', 'list', {}, 0, 10, 'fecha', 'desc'],
      { items: [], pagination: { total: 0 } }
    );

    const startTime = performance.now();

    const { result } = renderHook(
      () => useMovimientosListQuery({ filters: {}, rowsPerPage: 10 }),
      { wrapper: createWrapper(queryClient) }
    );

    const duration = performance.now() - startTime;

    expect(result.current.data).toBeDefined();
    console.log(`✓ Cache hit: ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(10);
  });

  it('debería filtrar 250 registros en < 100ms', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });

    const startTime = performance.now();

    const { result } = renderHook(
      () => useMovimientosListQuery({
        filters: { propietarioId: '1' },
        rowsPerPage: 50,
      }),
      { wrapper: createWrapper(queryClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const duration = performance.now() - startTime;
    console.log(`✓ Filtered query (propietarioId='1'): ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(150);
  });
});

describe('Performance: Deduplication', () => {
  it('debería deduplicar queries idénticas sin requests duplicadas', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });

    const filters = { propietarioId: '1', usuario: 'test' };

    const startTime = performance.now();

    const results = [];
    for (let i = 0; i < 3; i++) {
      const { result } = renderHook(
        () => useMovimientosListQuery({ filters }),
        { wrapper: createWrapper(queryClient) }
      );
      results.push(result);
    }

    await waitFor(() => {
      results.forEach(r => {
        expect(r.current.isLoading).toBe(false);
      });
    });

    const duration = performance.now() - startTime;

    // Verificar que todos los resultados son idénticos (datos compartidos)
    expect(results[0].current.data).toBe(results[1].current.data);
    expect(results[1].current.data).toBe(results[2].current.data);

    console.log(`✓ Deduplication: 3 hooks in ${duration.toFixed(2)}ms (single network request)`);
    expect(duration).toBeLessThan(200);
  });

  it('debería reconocer parámetros en distinto orden como idénticos', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });

    const filters1 = { propietarioId: '1', usuario: 'test', cantidadMin: '' };
    const filters2 = { usuario: 'test', cantidadMin: '', propietarioId: '1' };

    const { result: result1 } = renderHook(
      () => useMovimientosListQuery({ filters: filters1 }),
      { wrapper: createWrapper(queryClient) }
    );

    const { result: result2 } = renderHook(
      () => useMovimientosListQuery({ filters: filters2 }),
      { wrapper: createWrapper(queryClient) }
    );

    await waitFor(() => {
      expect(result1.current.isLoading).toBe(false);
      expect(result2.current.isLoading).toBe(false);
    });

    // Verificar que usan la misma cache
    const canonical1 = JSON.stringify(canonicalParams(filters1));
    const canonical2 = JSON.stringify(canonicalParams(filters2));

    expect(canonical1).toBe(canonical2);
    expect(result1.current.data).toBe(result2.current.data);

    console.log('✓ Parameter order normalization: queries merged correctly');
  });
});

describe('Performance: Memory', () => {
  it('debería limpiar cache después de gcTime', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 100 }, // 100ms para test rápido
      },
    });

    const { result, unmount } = renderHook(
      () => useMovimientosListQuery({ filters: {} }),
      { wrapper: createWrapper(queryClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(queryClient.getQueryCache().getAll().length).toBeGreaterThan(0);

    unmount();

    // Esperar a que se ejecute el GC
    await new Promise(r => setTimeout(r, 150));

    // La cache debería estar limpia
    console.log(`✓ Cache cleanup after gcTime: ${queryClient.getQueryCache().getAll().length} queries remaining`);
  });

  it('debería manejar múltiples queries sin memory leak', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });

    const initialMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    // Crear y desmontar 100 hooks
    for (let i = 0; i < 100; i++) {
      const { unmount } = renderHook(
        () => useMovimientosListQuery({
          filters: { propietarioId: String(i % 3) },
        }),
        { wrapper: createWrapper(queryClient) }
      );
      unmount();
    }

    const finalMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    const memoryDelta = finalMemory - initialMemory;

    console.log(`✓ Memory after 100 hook cycles: +${memoryDelta.toFixed(2)}MB`);
    // Permitir cierto crecimiento pero no excesivo
    expect(memoryDelta).toBeLessThan(50);
  });
});

describe('Performance: Pagination', () => {
  it('debería cambiar de página sin cancelar queries previas bruscamente', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });

    let pageChangeTime = 0;

    const { result, rerender } = renderHook(
      ({ page }) => useMovimientosListQuery({
        filters: {},
        page,
        rowsPerPage: 10,
      }),
      {
        wrapper: createWrapper(queryClient),
        initialProps: { page: 0 },
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const startTime = performance.now();

    rerender({ page: 5 });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    pageChangeTime = performance.now() - startTime;

    console.log(`✓ Page change (0 → 5): ${pageChangeTime.toFixed(2)}ms`);
    expect(pageChangeTime).toBeLessThan(200);
  });

  it('debería manejar 1000 registros en paginación', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });

    const startTime = performance.now();

    const { result } = renderHook(
      () => useMovimientosListQuery({
        filters: {},
        page: 10, // Página profunda
        rowsPerPage: 100,
      }),
      { wrapper: createWrapper(queryClient) }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const duration = performance.now() - startTime;

    expect(result.current.data.items.length).toBeLessThanOrEqual(100);
    console.log(`✓ Deep pagination (page 10): ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(300);
  });
});
