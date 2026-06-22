import api from './client';

export const getSalesTrend = (days) =>
  api.get('/reports/sales-trend', { params: { days } });

export const getRevenueTrend = (days) =>
  api.get('/reports/revenue-trend', { params: { days } });

export const getTopProducts = () =>
  api.get('/reports/top-products');

export const getStockDistribution = () =>
  api.get('/reports/stock-distribution');

export const getCategoryDistribution = () =>
  api.get('/reports/category-distribution');

export const getQuickInsights = () =>
  api.get('/reports/quick-insights');

export const getActivityDistribution = () =>
  api.get('/reports/activity-distribution');
