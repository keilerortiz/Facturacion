import { useMemo } from 'react';

/**
 * Deriva las alertas operativas a partir de los movimientos del store.
 *
 * Cada alerta tiene: { id, severity ('error'|'warning'), label, count }
 *
 * Reglas:
 *  - cantidad <= 0  → error
 *  - tarifa null o <= 0 → error
 *  - tipovta ausente    → warning
 *
 * @param {Array} items - Movimientos recibidos del store.
 * @returns {Array}
 */
export function useDashboardAlerts(items) {
  return useMemo(() => {
    if (!items || items.length === 0) return [];

    const cantidadInvalida = items.filter(
      (i) => typeof i.cantidad !== 'number' || i.cantidad <= 0
    ).length;

    const tarifaInvalida = items.filter(
      (i) => i.tarifa === null || i.tarifa === undefined || i.tarifa <= 0
    ).length;

    const sinTipovta = items.filter((i) => !i.tipovta).length;

    const alerts = [];

    if (cantidadInvalida > 0) {
      alerts.push({
        id: 'cantidad',
        severity: 'error',
        label: `${cantidadInvalida} movimiento${cantidadInvalida > 1 ? 's' : ''} con cantidad ≤ 0`,
        count: cantidadInvalida,
      });
    }

    if (tarifaInvalida > 0) {
      alerts.push({
        id: 'tarifa',
        severity: 'error',
        label: `${tarifaInvalida} movimiento${tarifaInvalida > 1 ? 's' : ''} con tarifa inválida`,
        count: tarifaInvalida,
      });
    }

    return alerts;
  }, [items]);
}
