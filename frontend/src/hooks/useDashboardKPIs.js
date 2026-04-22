import { useMemo } from 'react';

/**
 * Calcula los KPIs principales del dashboard a partir de los datos del store.
 *
 * @param {Array}  items      - Movimientos recibidos del store (página actual).
 * @param {object} pagination - Objeto { total, limit, offset } del store.
 * @returns {{ totalHoy, volumenTotal, facturacionTotal, conErrores, scope }}
 */
export function useDashboardKPIs(items, pagination) {
  return useMemo(() => {
    if (!items || items.length === 0) {
      return { totalHoy: null, facturacionTotal: 0, ticketPromedio: 0, scope: 0 };
    }

    let facturacionTotal = 0;

    for (const item of items) {
      if (typeof item.total === 'number') facturacionTotal += item.total;
    }

    const ticketPromedio = items.length > 0 ? facturacionTotal / items.length : 0;

    return {
      totalHoy: pagination?.total ?? null,
      facturacionTotal,
      ticketPromedio,
      scope: items.length,
    };
  }, [items, pagination]);
}
