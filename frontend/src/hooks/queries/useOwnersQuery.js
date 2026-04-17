import { useQuery } from '@tanstack/react-query';
import { movimientosService } from '../../services/movimientosService';

/**
 * Lista de propietarios.
 * - Caché compartida automáticamente entre MovimientosPage y DashboardPage.
 * - StrictMode + doble ejecución de efectos → sigue siendo 1 sola request.
 */
export function useOwnersQuery(options = {}) {
  return useQuery({
    queryKey: ['movimientos', 'owners'],
    queryFn: async () => {
      const response = await movimientosService.listOwners();
      return response.items || [];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    ...options,
  });
}
