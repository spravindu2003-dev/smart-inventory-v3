import api from './client';

export const getProducts = (signal) =>
  api.get('/products', { signal });

export const getProduct = (id, signal) =>
  api.get(`/products/${id}`, { signal });

export const createProduct = (data, signal) =>
  api.post('/products', data, { signal });

export const updateProduct = (id, data, signal) =>
  api.put(`/products/${id}`, data, { signal });

export const deleteProduct = (id, signal) =>
  api.delete(`/products/${id}`, { signal });

export const removeProduct = (id, reason, signal) =>
  api.patch(`/products/${id}/remove`, { removalReason: reason }, { signal });
