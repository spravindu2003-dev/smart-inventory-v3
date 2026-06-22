import api from './client';

export const getSalesTrend = (days, signal) =>
  api.get('/reports/sales-trend', { params: { days }, signal });

export const getRevenueTrend = (days, signal) =>
  api.get('/reports/revenue-trend', { params: { days }, signal });

export const getTopProducts = (signal) =>
  api.get('/reports/top-products', { signal });

export const getStockDistribution = (signal) =>
  api.get('/reports/stock-distribution', { signal });

export const getCategoryDistribution = (signal) =>
  api.get('/reports/category-distribution', { signal });

export const getQuickInsights = (signal) =>
  api.get('/reports/quick-insights', { signal });

export const getActivityDistribution = (signal) =>
  api.get('/reports/activity-distribution', { signal });
