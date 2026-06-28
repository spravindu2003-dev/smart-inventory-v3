import api from './client';

export const getRequests = (params, signal) =>
  api.get('/requests', { params, signal });

export const getRequestCount = (signal) =>
  api.get('/requests/count', { signal });

export const createRequest = (data, signal) =>
  api.post('/requests', data, { signal });

export const approveRequest = (id, signal) =>
  api.patch(`/requests/${id}/approve`, {}, { signal });

export const rejectRequest = (id, message, signal) =>
  api.patch(`/requests/${id}/reject`, { message }, { signal });
