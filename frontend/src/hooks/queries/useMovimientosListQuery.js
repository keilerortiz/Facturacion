import { useQuery } from '@tanstack/react-query';
import { movimientosService } from '../../services/movimientosService';

/**
 * Lista de movimientos con filtros, paginación y ordenamiento.
 * - queryKey incluye todos los parámetros: cada combinación tiene su propio caché.
 * - AbortController manejado automáticamente por React Query vía `signal`.
 * - keepPreviousData: mantiene datos visibles al cambiar página (mejor UX).
 */
export function useMovimientosListQuery({
  filters = {},
  page = 0,
  rowsPerPage = 10,
  sortBy = 'fecha',
  sortDir = 'desc',
} = {}, options = {}) {
  return useQuery({
    queryKey: ['movimientos', 'list', filters, page, rowsPerPage, sortBy, sortDir],
    queryFn: async ({ signal }) => {
      return await movimientosService.list(
        {
          ...filters,
          sortBy,
          sortDir,
          limit: rowsPerPage,
          offset: page * rowsPerPage,
        },
        { signal }
      );
    },
    staleTime: 1000 * 60 * 1,
    gcTime: 1000 * 60 * 5,
    placeholderData: (prev) => prev, // mantiene datos anteriores mientras carga
    ...options,
  });
}
