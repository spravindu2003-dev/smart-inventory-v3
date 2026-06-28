import api from './client';

export const getMyProfile = (signal) =>
  api.get('/users/me', { signal });

export const updateMyProfile = (data, signal) =>
  api.put('/users/me', data, { signal });

export const getUsers = (params, signal) => {
  const q = new URLSearchParams();
  if (params.page) q.set('page', params.page);
  if (params.limit) q.set('limit', params.limit);
  if (params.search) q.set('search', params.search);
  if (params.role) q.set('role', params.role);
  return api.get(`/users?${q.toString()}`, { signal });
};

export const createUser = (data, signal) =>
  api.post('/users/create', data, { signal });

export const updateUser = (id, data, signal) =>
  api.put(`/users/${id}`, data, { signal });

export const toggleUserStatus = (id, signal) =>
  api.patch(`/users/${id}/status`, null, { signal });

export const deleteUser = (id, signal) =>
  api.delete(`/users/${id}`, { signal });
