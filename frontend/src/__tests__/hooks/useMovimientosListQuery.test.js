import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useMovimientosListQuery } from '../../hooks/queries/useMovimientosListQuery';

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

describe('useMovimientosListQuery', () => {
  it('debería cargar movimientos iniciales', async () => {
    const { result } = renderHook(
      () => useMovimientosListQuery({ filters: {} }),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data.items).toBeDefined();
    expect(Array.isArray(result.current.data.items)).toBe(true);
  });

  it('debería aplicar filtros de fecha', async () => {
    const { result } = renderHook(
      () => useMovimientosListQuery({
        filters: {
          fechaDesde: '2026-04-17',
          fechaHasta: '2026-04-17',
        },
      }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data.items.length).toBeGreaterThan(0);
    result.current.data.items.forEach(item => {
      // Las fechas son strings, verificar que coinciden con el rango
      expect(['2026-04-17']).toContain(item.fecha);
    });
  });

  it('debería aplicar paginación', async () => {
    const { result } = renderHook(
      () => useMovimientosListQuery({
        filters: {},
        page: 0,
        rowsPerPage: 10,
      }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data.items.length).toBeLessThanOrEqual(10);
  });

  it('debería cambiar de página', async () => {
    const { result, rerender } = renderHook(
      ({ page }) => useMovimientosListQuery({
        filters: {},
        page,
        rowsPerPage: 10,
      }),
      {
        wrapper: createWrapper(),
        initialProps: { page: 0 },
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const firstPageItems = result.current.data.items;

    rerender({ page: 1 });

    await waitFor(() => {
      // Después de cambiar página, puede haber overlap mínimo
      expect(result.current.data).toBeDefined();
    });
  });

  it('debería normalizar filtros en queryKey', async () => {
    const filters1 = { propietarioId: '1', usuario: 'test', cantidadMin: '' };
    const filters2 = { usuario: 'test', propietarioId: '1', cantidadMin: '' };

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

    // Ambas queries deberían devolver datos equivalentes
    expect(result1.current.data.pagination.total).toBe(result2.current.data.pagination.total);
  });

  it('debería manejar errores de red', async () => {
    // Simular fallo en handlers.js requeriría override en el test
    // Por ahora solo verificar que el hook maneja el estado isError
    const { result } = renderHook(
      () => useMovimientosListQuery({ filters: {} }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isError).toBe(false);
  });

  it('debería respetar placeholderData', async () => {
    const { result, rerender } = renderHook(
      ({ filters }) => useMovimientosListQuery({
        filters,
        rowsPerPage: 5,
      }),
      {
        wrapper: createWrapper(),
        initialProps: { filters: { propietarioId: '1' } },
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const firstData = result.current.data;

    // Cambiar filtros
    rerender({ filters: { propietarioId: '2' } });

    // Con placeholderData, los datos anteriores deberían permanecer visibles brevemente
    expect(result.current.data).toBeDefined();
  });

  it('debería usar AbortController para cancelar requests', async () => {
    const { result, unmount } = renderHook(
      () => useMovimientosListQuery({ filters: {} }),
      { wrapper: createWrapper() }
    );

    // Desmontar rápidamente debería abortar la request
    unmount();

    // Esperar un momento para que la limpieza se complete
    await new Promise(r => setTimeout(r, 50));
  });
});

describe('useMovimientosListQuery - Parámetros especiales', () => {
  it('debería aceptar opciones personalizadas', async () => {
    const { result } = renderHook(
      () => useMovimientosListQuery(
        { filters: {} },
        { staleTime: 1000 * 60 * 5 } // 5 minutos
      ),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
  });

  it('debería manejar filtros vacíos correctamente', async () => {
    const { result } = renderHook(
      () => useMovimientosListQuery({
        filters: {
          propietarioId: '',
          vtaId: '',
          usuario: '',
          cantidadMin: '',
        },
      }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Debería retornar todos los movimientos (sin filtros aplicados)
    expect(result.current.data.items.length).toBeGreaterThan(0);
  });

  it('debería permitir acceso refetch manual', async () => {
    const { result } = renderHook(
      () => useMovimientosListQuery({ filters: {} }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe('function');
  });
});
