import { useMutation, useQueryClient } from '@tanstack/react-query';
import { movimientosService } from '../../services/movimientosService';

/**
 * Actualiza un movimiento e invalida la lista y el detalle.
 */
export function useUpdateMovimientoMutation(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => movimientosService.update(id, payload),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['movimientos', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['movimientos', 'detail', id] });
      options.onSuccess?.(data);
    },
    onError: (error) => {
      options.onError?.(error);
    },
  });
}
