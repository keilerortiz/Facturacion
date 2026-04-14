/**
 * Deduplicator de requests concurrentes.
 *
 * Si se lanza la misma clave (key) mientras ya hay un request en vuelo,
 * en lugar de enviar un segundo request se reutiliza la Promise existente.
 * Una vez resuelta o rechazada, la entrada se elimina automáticamente.
 *
 * Uso:
 *   const result = await deduplicatedFetch('vtas:owner:5', () => api.getVtas(5));
 */
const pending = new Map();

export function deduplicatedFetch(key, fetchFn) {
  if (pending.has(key)) {
    return pending.get(key);
  }

  const promise = fetchFn().finally(() => pending.delete(key));
  pending.set(key, promise);
  return promise;
}
