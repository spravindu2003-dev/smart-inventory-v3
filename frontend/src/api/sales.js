import api from './client';

export const getSales = () => api.get('/sales').then((r) => r.data);
export const getSale = (id) => api.get(`/sales/${id}`).then((r) => r.data);
export const createSale = (items) => api.post('/sales', { items }).then((r) => r.data);
