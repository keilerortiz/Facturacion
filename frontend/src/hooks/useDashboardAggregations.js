import { useMemo } from 'react';

/**
 * Calcula las agregaciones de análisis operativo a partir de los movimientos del store.
 *
 * @param {Array} items - Movimientos recibidos del store.
 * @returns {{
 *   topPropietarios: Array<{ propietario: string, total: number, count: number }>,
 *   topVtas:         Array<{ vta: string, nombre: string, volumen: number, count: number }>
 * }}
 */
export function useDashboardAggregations(items) {
  return useMemo(() => {
    if (!items || items.length === 0) {
      return { topPropietarios: [], topVtas: [] };
    }

    const propietariosMap = new Map();
    const vtasMap = new Map();

    for (const item of items) {
      // Agregar por propietario
      const pEntry = propietariosMap.get(item.propietarioId) ?? {
        propietario: item.propietario,
        total: 0,
        count: 0,
      };
      pEntry.total += typeof item.total === 'number' ? item.total : 0;
      pEntry.count++;
      propietariosMap.set(item.propietarioId, pEntry);

      // Agregar por VTA
      const vEntry = vtasMap.get(item.vtaId) ?? {
        vta: item.vtaCodigo,
        nombre: item.vtaNombre ?? '',
        volumen: 0,
        count: 0,
        udmvta: item.udmvta ?? 'uds',
      };
      vEntry.volumen += typeof item.cantidad === 'number' ? item.cantidad : 0;
      vEntry.count++;
      vtasMap.set(item.vtaId, vEntry);
    }

    const topPropietarios = [...propietariosMap.values()]
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const topVtas = [...vtasMap.values()]
      .sort((a, b) => b.volumen - a.volumen)
      .slice(0, 5);

    return { topPropietarios, topVtas };
  }, [items]);
}
