import api from './client';

export const getActivities = (params = {}, signal) => {
  const q = new URLSearchParams();
  if (params.page) q.set('page', params.page);
  if (params.limit) q.set('limit', params.limit);
  if (params.action) q.set('action', params.action);
  if (params.user) q.set('user', params.user);
  if (params.search) q.set('search', params.search);
  if (params.startDate) q.set('startDate', params.startDate);
  if (params.endDate) q.set('endDate', params.endDate);
  return api.get(`/activities?${q.toString()}`, { signal });
};

export const getActivitySummary = (signal) =>
  api.get('/activities/summary', { signal });
