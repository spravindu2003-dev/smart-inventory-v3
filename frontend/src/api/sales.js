import api from './client';

export const getSales = (signal) => api.get('/sales', { signal });
export const getSale = (id, signal) => api.get(`/sales/${id}`, { signal });
export const createSale = (items, signal) => api.post('/sales', { items }, { signal });
