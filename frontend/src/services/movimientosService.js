import httpClient from './httpClient';

export const movimientosService = {
  async init(params) {
    const { data } = await httpClient.get('/movimientos/init', { params });
    return data;
  },
  async listOwners() {
    const { data } = await httpClient.get('/movimientos/propietarios/lista');
    return data;
  },
  async listVtasByOwner(propietarioId) {
    const { data } = await httpClient.get('/movimientos/vtas/por-propietario', {
      params: { propietarioId }
    });
    return data;
  },
  async getRate(propietarioId, vtaId) {
    const { data } = await httpClient.get('/movimientos/tarifa', {
      params: { propietarioId, vtaId }
    });
    return data;
  },
  async create(payload) {
    const { data } = await httpClient.post('/movimientos', payload);
    return data;
  },
  async list(params, config) {
    const { data } = await httpClient.get('/movimientos', { params, ...config });
    return data;
  },
  async detail(id) {
    const { data } = await httpClient.get(`/movimientos/${id}`);
    return data;
  },
  async history(id) {
    const { data } = await httpClient.get(`/movimientos/${id}/historial`);
    return data;
  },
  async update(id, payload) {
    const { data } = await httpClient.put(`/movimientos/${id}`, payload);
    return data;
  },
  async exportExcel(params) {
    let response;
    try {
      response = await httpClient.get('/movimientos/export', {
        params,
        responseType: 'blob'
      });
    } catch (error) {
      // When the server returns a non-2xx with responseType:'blob', Axios gives us a blob error.
      // Parse it back to JSON to get the human-readable message.
      if (error.response?.data instanceof Blob) {
        const text = await error.response.data.text();
        try {
          const parsed = JSON.parse(text);
          const msg = parsed.message || parsed.error || 'Error al exportar';
          throw new Error(msg);
        } catch {
          throw new Error('Error al exportar el archivo Excel');
        }
      }
      throw error;
    }

    // Extract filename from Content-Disposition if present
    const disposition = response.headers['content-disposition'] || '';
    const nameMatch = disposition.match(/filename="?([^";\s]+)"?/);
    const filename = nameMatch ? nameMatch[1] : 'movimientos.xlsx';

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};
