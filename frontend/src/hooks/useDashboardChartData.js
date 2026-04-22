import { useMemo } from 'react';

/**
 * Hook para transformar datos de movimientos en formato de gráficos
 * Calcula:
 * - Ingresos por tipo de movimiento (donut)
 * - Ingresos por CECO (donut)
 * - Ingresos por día (combo chart)
 * - Sparkline data para KPIs
 */
export function useDashboardChartData(items = []) {
  return useMemo(() => {
    if (!items || items.length === 0) {
      return {
        ingresosPorTipo: [],
        ingresosPorCeco: [],
        ingresosPorDia: [],
        sparklineData: [],
      };
    }

    // ─────────────────────────────────────────────────────────────────────
    // 1. Ingresos por unidad de medida
    // ─────────────────────────────────────────────────────────────────────
    const tipoMap = new Map();
    for (const item of items) {
      const tipo = item.udmvta || "OTHER'S";
      const valor = typeof item.total === 'number' ? item.total : 0;

      if (!tipoMap.has(tipo)) {
        tipoMap.set(tipo, { name: tipo, value: 0 });
      }
      tipoMap.get(tipo).value += valor;
    }
    const ingresosPorTipo = [...tipoMap.values()].sort((a, b) => b.value - a.value);

    // ─────────────────────────────────────────────────────────────────────
    // 2. Ingresos por CECO
    // ─────────────────────────────────────────────────────────────────────
    const cecoMap = new Map();
    for (const item of items) {
      const ceco = item.ceco || 'SIN_ASIGNACIÓN';
      const valor = typeof item.total === 'number' ? item.total : 0;

      if (!cecoMap.has(ceco)) {
        cecoMap.set(ceco, { name: ceco, value: 0 });
      }
      cecoMap.get(ceco).value += valor;
    }
    const ingresosPorCeco = [...cecoMap.values()].sort((a, b) => b.value - a.value);

    // ─────────────────────────────────────────────────────────────────────
    // 3. Ingresos × Día (para combo chart)
    // ─────────────────────────────────────────────────────────────────────
    const diaMap = new Map();
    for (const item of items) {
      // Extraer fecha (formato YYYY-MM-DD)
      const fecha = item.fecha ? item.fecha.substring(0, 10) : new Date().toISOString().substring(0, 10);
      const ingresos = typeof item.total === 'number' ? item.total : 0;
      const cantidad = typeof item.cantidad === 'number' ? item.cantidad : 0;

      if (!diaMap.has(fecha)) {
        diaMap.set(fecha, {
          date: fecha,
          ingresos: 0,
          cantidad: 0,
          count: 0,
        });
      }
      const entry = diaMap.get(fecha);
      entry.ingresos += ingresos;
      entry.cantidad += cantidad;
      entry.count++;
    }

    const ingresosPorDia = [...diaMap.values()]
      .sort((a, b) => a.date.localeCompare(b.date)) // Ordenar por fecha
      .map((d) => ({
        date: d.date,
        ingresos: Math.round(d.ingresos),
        cantidad: Math.round(d.cantidad),
      }));

    // ─────────────────────────────────────────────────────────────────────
    // 4. Sparkline data (últimos 7 puntos de ingresos por día)
    // ─────────────────────────────────────────────────────────────────────
    const sparklineData = ingresosPorDia
      .slice(-7)
      .map((d) => ({
        value: d.ingresos,
      }));

    return {
      ingresosPorTipo,
      ingresosPorCeco,
      ingresosPorDia,
      sparklineData,
    };
  }, [items]);
}
