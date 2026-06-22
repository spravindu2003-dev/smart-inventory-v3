import api from './client';

export const getSalesTrend = () =>
  api.get('/reports/sales-trend').then((r) => r.data);

export const getRevenueTrend = () =>
  api.get('/reports/revenue-trend').then((r) => r.data);

export const getTopProducts = () =>
  api.get('/reports/top-products').then((r) => r.data);

export const getStockDistribution = () =>
  api.get('/reports/stock-distribution').then((r) => r.data);

export const getActivityDistribution = () =>
  api.get('/reports/activity-distribution').then((r) => r.data);
