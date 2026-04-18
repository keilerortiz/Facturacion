import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * Servidor MSW para tests.
 * Intercepta todas las llamadas HTTP y las maneja con handlers predefinidos.
 */
export const server = setupServer(...handlers);
