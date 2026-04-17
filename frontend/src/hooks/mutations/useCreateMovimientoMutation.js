import { useMutation, useQueryClient } from '@tanstack/react-query';
import { movimientosService } from '../../services/movimientosService';

/**
 * Crea un movimiento e invalida automáticamente la lista.
 */
export function useCreateMovimientoMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => movimientosService.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['movimientos', 'list'] });
      options.onSuccess?.(data);
    },
    onError: (error) => {
      options.onError?.(error);
    },
  });
}
