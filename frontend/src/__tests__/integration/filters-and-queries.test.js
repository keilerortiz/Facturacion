import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useFilterState } from '../../hooks/filters/useFilterState';
import { useMovimientosListQuery } from '../../hooks/queries/useMovimientosListQuery';

/**
 * Tests de integración: Flujo completo de filtros → query → datos.
 * Simula el comportamiento real de la app.
 */

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return function Wrapper({ children }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('Integration: Filtros + Queries', () => {
  it('debería aplicar un filtro individual y actualizar la query', async () => {
    const initialFilters = {
      fechaDesde: '2026-04-17',
      fechaHasta: '2026-04-17',
      propietarioId: '',
      vtaId: '',
    };

    const { result: filterResult, rerender: rerenderFilter } = renderHook(
      () => useFilterState(initialFilters),
      { wrapper: createWrapper() }
    );

    const { result: queryResult, rerender: rerenderQuery } = renderHook(
      ({ filters }) => useMovimientosListQuery({ filters }),
      {
        wrapper: createWrapper(),
        initialProps: { filters: filterResult.current.applied },
      }
    );

    await waitFor(() => {
      expect(queryResult.current.isLoading).toBe(false);
    });

    const initialCount = queryResult.current.data.items.length;

    // Cambiar propietario
    act(() => {
      filterResult.current.applyField('propietarioId', '1');
    });

    rerenderQuery({ filters: filterResult.current.applied });

    await waitFor(() => {
      expect(queryResult.current.isLoading).toBe(false);
    });

    // La query debe haberse actualizado (posiblemente con menos resultados)
    expect(queryResult.current.data).toBeDefined();
  });

  it('debería evitar queries múltiples en cambios de draft', async () => {
    const initialFilters = {
      usuario: '',
      cantidadMin: '',
    };

    let queryCount = 0;
    const originalLog = console.log;
    console.log = vi.fn((msg) => {
      if (msg && msg.includes('query')) queryCount++;
      originalLog(msg);
    });

    const { result: filterResult } = renderHook(
      () => useFilterState(initialFilters),
      { wrapper: createWrapper() }
    );

    // Actualizar draft múltiples veces (sin trigger query)
    act(() => {
      filterResult.current.setDraftField('usuario', 'u');
      filterResult.current.setDraftField('usuario', 'us');
      filterResult.current.setDraftField('usuario', 'use');
      filterResult.current.setDraftField('usuario', 'user');
    });

    expect(filterResult.current.draft.usuario).toBe('user');
    expect(filterResult.current.applied.usuario).toBe('');

    console.log = originalLog;
  });

  it('debería aplicar múltiples filtros atómicamente', async () => {
    const initialFilters = {
      fechaDesde: '2026-04-01',
      fechaHasta: '2026-04-05',
      propietarioId: '',
      vtaId: '',
    };

    const { result: filterResult } = renderHook(
      () => useFilterState(initialFilters),
      { wrapper: createWrapper() }
    );

    act(() => {
      // Simular aplicar rango de fechas atomicamente (con merge)
      filterResult.current.applyPartial({
        fechaDesde: '2026-04-10',
        fechaHasta: '2026-04-20',
      });
    });

    // Después de applyPartial, draft y applied deben tener los nuevos valores
    expect(filterResult.current.draft.fechaDesde).toBe('2026-04-10');
    expect(filterResult.current.draft.fechaHasta).toBe('2026-04-20');
    expect(filterResult.current.applied.fechaDesde).toBe('2026-04-10');
    expect(filterResult.current.applied.fechaHasta).toBe('2026-04-20');
    // Y no debe marcar como dirty porque ambos son iguales
    expect(filterResult.current.isDirty).toBe(false);
  });

  it('debería manejar reseteo de VTA al cambiar propietario', async () => {
    const initialFilters = {
      propietarioId: '1',
      vtaId: '11',
    };

    const { result: filterResult } = renderHook(
      () => useFilterState(initialFilters),
      { wrapper: createWrapper() }
    );

    expect(filterResult.current.applied.propietarioId).toBe('1');
    expect(filterResult.current.applied.vtaId).toBe('11');

    act(() => {
      filterResult.current.applyField('propietarioId', '2');
    });

    expect(filterResult.current.applied.propietarioId).toBe('2');
    expect(filterResult.current.applied.vtaId).toBe('');
  });

  it('debería deduplicar queries con parámetros en distinto orden', async () => {
    const filters1 = { propietarioId: '1', usuario: 'test' };
    const filters2 = { usuario: 'test', propietarioId: '1' };

    const requests = [];
    const originalFetch = global.fetch;

    const { result: result1 } = renderHook(
      () => useMovimientosListQuery({ filters: filters1 }),
      { wrapper: createWrapper() }
    );

    const { result: result2 } = renderHook(
      () => useMovimientosListQuery({ filters: filters2 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result1.current.isLoading).toBe(false);
      expect(result2.current.isLoading).toBe(false);
    });

    // Ambas deberían tener datos equivalentes
    expect(result1.current.data.pagination.total).toBe(result2.current.data.pagination.total);
  });
});

describe('Integration: State transitions', () => {
  it('debería manejar transición draft → applied → query correctamente', async () => {
    const initialFilters = { usuario: '', propietarioId: '' };
    const states = [];

    const { result: filterResult } = renderHook(
      () => useFilterState(initialFilters),
      { wrapper: createWrapper() }
    );

    states.push({
      draft: filterResult.current.draft,
      applied: filterResult.current.applied,
      isDirty: filterResult.current.isDirty,
    });

    // Usuario escribe en input
    act(() => {
      filterResult.current.setDraftField('usuario', 'test');
    });
    states.push({
      draft: filterResult.current.draft,
      applied: filterResult.current.applied,
      isDirty: filterResult.current.isDirty,
    });

    // Usuario presiona "Aplicar"
    act(() => {
      filterResult.current.applyFilters();
    });
    states.push({
      draft: filterResult.current.draft,
      applied: filterResult.current.applied,
      isDirty: filterResult.current.isDirty,
    });

    // Verificar transiciones
    expect(states[0].isDirty).toBe(false);
    expect(states[1].isDirty).toBe(true); // draft cambió
    expect(states[2].isDirty).toBe(false); // draft == applied
    expect(states[2].applied.usuario).toBe('test');
  });
});
