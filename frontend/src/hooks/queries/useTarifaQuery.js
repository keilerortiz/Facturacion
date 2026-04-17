import { useQuery } from '@tanstack/react-query';
import { movimientosService } from '../../services/movimientosService';

/**
 * Tarifa para una combinación propietario + VTA.
 * - Solo fetch si ambos IDs existen.
 * - Caché por par → navegar entre VTAs no re-fetcha combinaciones ya vistas.
 */
export function useTarifaQuery({ propietarioId, vtaId }, options = {}) {
  return useQuery({
    queryKey: ['movimientos', 'tarifa', propietarioId, vtaId],
    queryFn: async () => {
      const response = await movimientosService.getRate(propietarioId, vtaId);
      return response.tarifa ?? null;
    },
    enabled: !!propietarioId && !!vtaId,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 20,
    ...options,
  });
}
