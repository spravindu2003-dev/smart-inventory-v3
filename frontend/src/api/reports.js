import api from './client';

export const getSalesTrend = (days) =>
  api.get('/reports/sales-trend', { params: { days } }).then((r) => r.data);

export const getRevenueTrend = (days) =>
  api.get('/reports/revenue-trend', { params: { days } }).then((r) => r.data);

export const getTopProducts = () =>
  api.get('/reports/top-products').then((r) => r.data);

export const getStockDistribution = () =>
  api.get('/reports/stock-distribution').then((r) => r.data);

export const getCategoryDistribution = () =>
  api.get('/reports/category-distribution').then((r) => r.data);

export const getQuickInsights = () =>
  api.get('/reports/quick-insights').then((r) => r.data);

export const getActivityDistribution = () =>
  api.get('/reports/activity-distribution').then((r) => r.data);
