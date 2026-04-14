/**
 * Store compartido de módulo para datos de movimientos.
 *
 * Patrón: single source of truth entre páginas.
 * - MovimientosPage lo escribe después de resolver /init.
 * - DashboardPage lo lee sin hacer llamadas propias a la API.
 *
 * Al ser un módulo (singleton), todos los imports comparten la misma instancia
 * durante la sesión del browser. Se resetea en recarga de página (intencional).
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
