import { useQuery } from '@tanstack/react-query';
import { movimientosService } from '../../services/movimientosService';

/**
 * VTAs de un propietario.
 * - Solo hace fetch si propietarioId está presente (enabled).
 * - Caché por propietario → cambiar selección no dispara un nuevo request si ya fue cargada.
 */
export function useVtasByOwnerQuery(propietarioId, options = {}) {
  return useQuery({
    queryKey: ['movimientos', 'vtas', propietarioId],
    queryFn: async () => {
      const response = await movimientosService.listVtasByOwner(propietarioId);
      return response.items || [];
    },
    enabled: !!propietarioId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    ...options,
  });
}
