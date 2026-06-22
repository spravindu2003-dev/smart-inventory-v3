import api from './client';

export const getSales = () => api.get('/sales');
export const getSale = (id) => api.get(`/sales/${id}`);
export const createSale = (items) => api.post('/sales', { items });
