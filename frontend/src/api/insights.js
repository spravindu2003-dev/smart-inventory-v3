import api from './client';

export const getSummary = (signal) =>
  api.get('/insights/summary', { signal });

export const getMostSold = (signal) =>
  api.get('/insights/most-sold', { signal });

export const getLeastSold = (signal) =>
  api.get('/insights/least-sold', { signal });

export const getLowStock = (signal) =>
  api.get('/insights/low-stock', { signal });

export const getDeadStock = (signal) =>
  api.get('/insights/dead-stock', { signal });
