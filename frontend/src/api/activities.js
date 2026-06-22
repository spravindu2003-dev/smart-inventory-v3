import api from './client';

export const getActivities = (page = 1, limit = 50) =>
  api.get(`/activities?page=${page}&limit=${limit}`).then((r) => r.data);
