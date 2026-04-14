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
    if (!items) {
      return { totalHoy: null, volumenTotal: 0, facturacionTotal: 0, conErrores: 0, scope: 0 };
    }

    let volumenTotal = 0;
    let facturacionTotal = 0;
    let conErrores = 0;

    for (const item of items) {
      if (typeof item.cantidad === 'number') volumenTotal += item.cantidad;
      if (typeof item.total === 'number') facturacionTotal += item.total;
      if (item.cantidad <= 0 || item.tarifa === null || item.tarifa <= 0) conErrores++;
    }

    return {
      totalHoy: pagination?.total ?? null,
      volumenTotal,
      facturacionTotal,
      conErrores,
      scope: items.length,
    };
  }, [items, pagination]);
}
