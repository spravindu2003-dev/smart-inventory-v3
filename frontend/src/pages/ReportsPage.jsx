import { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import * as reportsApi from '../api/reports';

const COLORS = ['#4f46e5', '#f59e0b', '#dc2626'];
const PIE_COLORS = ['#16a34a', '#f59e0b', '#dc2626', '#4f46e5', '#ec4899', '#06b6d4', '#f97316', '#8b5cf6'];

const actionLabels = {
  LOGIN_SUCCESS: 'Login',
  LOGIN_FAILED: 'Failed Login',
  REGISTER_USER: 'Register',
  CREATE_PRODUCT: 'Created Product',
  UPDATE_PRODUCT: 'Updated Product',
  DELETE_PRODUCT: 'Deleted Product',
  REMOVE_PRODUCT: 'Removed Product',
  SALE_CREATED: 'Sale Created',
};

function formatDate(d) {
  const date = new Date(d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ReportsPage() {
  const [salesTrend, setSalesTrend] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [stockDist, setStockDist] = useState(null);
  const [activityDist, setActivityDist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [sales, revenue, products, stock, activity] = await Promise.all([
        reportsApi.getSalesTrend(),
        reportsApi.getRevenueTrend(),
        reportsApi.getTopProducts(),
        reportsApi.getStockDistribution(),
        reportsApi.getActivityDistribution(),
      ]);
      setSalesTrend(sales.trend || []);
      setRevenueTrend(revenue.trend || []);
      setTopProducts(products.products || []);
      setStockDist(stock);
      setActivityDist(activity.distribution || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) {
    return (
      <div>
        <h2 className="page-title">Reports</h2>
        <div className="page-center" style={{ minHeight: 300 }}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2 className="page-title">Reports</h2>
        <div className="alert alert--error">{error}</div>
      </div>
    );
  }

  const stockData = stockDist
    ? [
        { name: 'In Stock', value: stockDist.inStock },
        { name: 'Low Stock', value: stockDist.lowStock },
        { name: 'Out of Stock', value: stockDist.outOfStock },
      ].filter((d) => d.value > 0)
    : [];

  const activityData = (activityDist || []).map((d) => ({
    name: actionLabels[d.action] || d.action,
    value: d.count,
  }));

  return (
    <div>
      <h2 className="page-title">Reports</h2>

      <div className="reports-grid">
        <div className="report-card">
          <h3 className="report-card__title">Sales Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={salesTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="report-card">
          <h3 className="report-card__title">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v) => `$${Number(v).toFixed(2)}`} />
              <Area type="monotone" dataKey="revenue" stroke="#16a34a" fill="#16a34a" fillOpacity={0.15} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="report-card report-card--wide">
          <h3 className="report-card__title">Top Selling Products</h3>
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="totalSold" fill="#4f46e5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="report-card__empty">No products sold yet</p>
          )}
        </div>

        <div className="report-card">
          <h3 className="report-card__title">Stock Distribution</h3>
          {stockData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={stockData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {stockData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="report-card__empty">No products</p>
          )}
        </div>

        <div className="report-card">
          <h3 className="report-card__title">Activity Distribution</h3>
          {activityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={activityData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {activityData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="report-card__empty">No activities recorded</p>
          )}
        </div>
      </div>
    </div>
  );
}
