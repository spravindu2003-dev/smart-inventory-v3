import api from './client';

export const getSales = (signal) => api.get('/sales', { signal });
export const getSale = (id, signal) => api.get(`/sales/${id}`, { signal });
export const createSale = (items, signal) => api.post('/sales', { items }, { signal });
export const updateSale = (id, items, signal) => api.put(`/sales/${id}`, { items }, { signal });
export const undoSale = (id, signal) => api.post(`/sales/${id}/undo`, {}, { signal });
