import api from './client';

export const getSummary = () =>
  api.get('/insights/summary').then((r) => r.data);

export const getMostSold = () =>
  api.get('/insights/most-sold').then((r) => r.data);

export const getLeastSold = () =>
  api.get('/insights/least-sold').then((r) => r.data);

export const getLowStock = () =>
  api.get('/insights/low-stock').then((r) => r.data);

export const getDeadStock = () =>
  api.get('/insights/dead-stock').then((r) => r.data);
