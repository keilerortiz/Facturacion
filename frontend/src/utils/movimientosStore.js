/**
 * @deprecated Reemplazado por React Query (QueryClientProvider).
 * La caché compartida entre páginas ahora la gestiona automáticamente
 * @tanstack/react-query a través de los hooks en hooks/queries/.
 *
 * Este archivo se mantiene solo por compatibilidad en caso de que algún
 * import externo no haya sido migrado. Puede eliminarse de forma segura
 * una vez confirmado que ningún componente lo importa.
 */

let _data = null;
const _listeners = new Set();

export const movimientosStore = {
  /** Lee el estado actual sincrónicamente. null = aún no inicializado. */
  get() {
    return _data;
  },

  /** Escribe y notifica a todos los suscriptores activos. */
  set(value) {
    _data = value;
    _listeners.forEach((fn) => fn(value));
  },

  /**
   * Suscribe un callback. Devuelve la función de unsuscripción.
   * Llama al callback inmediatamente con el valor actual si ya existe.
   */
  subscribe(fn) {
    _listeners.add(fn);
    if (_data !== null) fn(_data);
    return () => _listeners.delete(fn);
  }
};
