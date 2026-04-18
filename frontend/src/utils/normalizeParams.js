/**
 * Elimina de un objeto todos los valores vacíos (string vacío, null, undefined).
 *
 * Problema que resuelve:
 *   { fechaDesde: '2026-04-17', cantidadMin: '', usuario: '' }
 *   → GET /movimientos?fechaDesde=2026-04-17&cantidadMin=&usuario=
 *
 * Con normalizeParams:
 *   → GET /movimientos?fechaDesde=2026-04-17
 *
 * Beneficios adicionales:
 * - React Query produce queryKeys idénticos para estados semánticamente iguales,
 *   lo que evita requests duplicados y maximiza los cache hits.
 * - El backend no recibe parámetros que no necesita procesar.
 */
export function normalizeParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );
}

/**
 * Versión ordenada (canonical) para garantizar que dos objetos con las mismas
 * claves en distinto orden produzcan el mismo queryKey.
 *
 * Ejemplo:
 *   { vtaId: '3', propietarioId: '1' }  ≠ (por referencia)
 *   { propietarioId: '1', vtaId: '3' }
 *
 *   canonicalParams los hace iguales: { propietarioId: '1', vtaId: '3' }
 */
export function canonicalParams(params = {}) {
  const clean = normalizeParams(params);
  return Object.fromEntries(Object.entries(clean).sort(([a], [b]) => a.localeCompare(b)));
}
