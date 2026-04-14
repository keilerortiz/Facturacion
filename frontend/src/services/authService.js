import httpClient from './httpClient';

export const authService = {
  async login(payload) {
    const { data } = await httpClient.post('/auth/login', payload, {
      skipAuthRedirect: true
    });
    return data;
  },
  async refresh(refreshToken) {
    const { data } = await httpClient.post(
      '/auth/refresh',
      { refreshToken },
      { skipAuthRedirect: true }
    );
    return data;
  },
  async logout(refreshToken) {
    try {
      await httpClient.post('/auth/logout', { refreshToken }, { skipAuthRedirect: true });
    } catch {
      // Best-effort — don't block local cleanup if backend is unreachable
    }
  },
  async validate() {
    const { data } = await httpClient.get('/auth/validate');
    return data;
  },
  async profile() {
    const { data } = await httpClient.get('/auth/perfil');
    return data;
  },
  async changePassword(payload) {
    const { data } = await httpClient.post('/auth/cambiar-contrasena', payload);
    return data;
  },
  async listUsers() {
    const { data } = await httpClient.get('/auth/usuarios');
    return data;
  },
  async register(payload) {
    const { data } = await httpClient.post('/auth/register', payload);
    return data;
  },
  async updateUserStatus(id, payload) {
    const { data } = await httpClient.patch(`/auth/usuarios/${id}/estado`, payload);
    return data;
  },
  async resetPassword(id) {
    const { data } = await httpClient.post(`/auth/usuarios/${id}/resetear-contrasena`);
    return data;
  }
};
