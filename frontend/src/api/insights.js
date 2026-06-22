import api from './client';

export const getSummary = () =>
  api.get('/insights/summary');

export const getMostSold = () =>
  api.get('/insights/most-sold');

export const getLeastSold = () =>
  api.get('/insights/least-sold');

export const getLowStock = () =>
  api.get('/insights/low-stock');

export const getDeadStock = () =>
  api.get('/insights/dead-stock');
