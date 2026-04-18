import { useQuery } from '@tanstack/react-query';
import { movimientosService } from '../../services/movimientosService';
import { canonicalParams } from '../../utils/normalizeParams';

/**
 * Lista de movimientos con filtros, paginación y ordenamiento.
 *
 * Problemas que resuelve respecto a la versión anterior:
 *
 * 1. PARÁMETROS VACÍOS
 *    Antes: GET /movimientos?fechaDesde=X&cantidadMin=&usuario=&observaciones=
 *    Ahora: GET /movimientos?fechaDesde=X
 *    → canonicalParams elimina strings vacíos, null y undefined.
 *
 * 2. QUERYKEYS INCONSISTENTES
 *    Antes: { cantidadMin: '' } y {} generaban caches distintos (miss innecesario).
 *    Ahora: ambos normalizan al mismo objeto → mismo queryKey → mismo cache.
 *
 * 3. ORDEN DE CLAVES
 *    Antes: { vtaId:'3', propietarioId:'1' } ≠ { propietarioId:'1', vtaId:'3' }
 *    Ahora: canonicalParams ordena las claves alfabéticamente → siempre igual.
 *
 * 4. CANCELACIÓN AUTOMÁTICA
 *    AbortController delegado a React Query vía `signal` → sin race conditions.
 *
 * 5. DATOS PREVIOS VISIBLES
 *    placeholderData: (prev) => prev → la tabla no se vacía al cambiar filtros.
 */
export function useMovimientosListQuery({
  filters = {},
  page = 0,
  rowsPerPage = 10,
  sortBy = 'fecha',
  sortDir = 'desc',
} = {}, options = {}) {
  // Normalizar antes de construir el queryKey:
  // garantiza que dos filters semánticamente iguales produzcan el mismo queryKey.
  const normalizedFilters = canonicalParams(filters);

  return useQuery({
    queryKey: ['movimientos', 'list', normalizedFilters, page, rowsPerPage, sortBy, sortDir],

    queryFn: async ({ signal }) => {
      return await movimientosService.list(
        {
          ...normalizedFilters,   // sin campos vacíos
          sortBy,
          sortDir,
          limit: rowsPerPage,
          offset: page * rowsPerPage,
        },
        { signal }
      );
    },

    staleTime: 1000 * 60 * 1,      // 1 min: datos de negocio cambian frecuentemente
    gcTime:    1000 * 60 * 5,      // 5 min en caché después de no usarse
    placeholderData: (prev) => prev, // mantiene datos visibles al cambiar página/filtros
    ...options,
  });
}
