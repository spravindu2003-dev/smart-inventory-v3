import { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { getData, safeArray } from '../api/safeResponse';
import * as reportsApi from '../api/reports';
import { useFetch } from '../hooks/useFetch';

const STOCK_COLORS = ['#16a34a', '#f59e0b', '#dc2626', '#9ca3af'];
const CAT_COLORS = ['#4f46e5', '#ec4899', '#06b6d4', '#f97316', '#8b5cf6', '#14b8a6', '#e11d48', '#a855f7'];

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

function toDollar(v) {
  return `$${Number(v).toFixed(2)}`;
}

export default function ReportsPage() {
  const [chartData, setChartData] = useState({
    revenueTrend: [],
    salesTrend: [],
    topProducts: [],
    categoryDist: [],
    stockDist: null,
    insights: null,
    activityDist: [],
  });
  const { loading, error, run } = useFetch();

  useEffect(() => {
    run(async (signal) => {
      const [revenue, sales, products, stock, categories, insights, activity] =
        await Promise.all([
          reportsApi.getRevenueTrend(7, signal),
          reportsApi.getSalesTrend(7, signal),
          reportsApi.getTopProducts(signal),
          reportsApi.getStockDistribution(signal),
          reportsApi.getCategoryDistribution(signal),
          reportsApi.getQuickInsights(signal),
          reportsApi.getActivityDistribution(signal),
        ]);
      setChartData({
        revenueTrend: revenue.data?.trend || [],
        salesTrend: sales.data?.trend || [],
        topProducts: getData(products),
        categoryDist: categories.data?.distribution || [],
        stockDist: stock.data,
        insights: insights.data,
        activityDist: activity.data?.distribution || [],
      });
    });
  }, [run]);

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

  const {
    revenueTrend, salesTrend, topProducts, categoryDist,
    stockDist, insights, activityDist,
  } = chartData;

  const stockPie = stockDist
    ? [
        { name: 'In Stock', value: stockDist.inStock },
        { name: 'Low Stock', value: stockDist.lowStock },
        { name: 'Out of Stock', value: stockDist.outOfStock },
        { name: 'Expired', value: stockDist.expired },
      ].filter((d) => d.value > 0)
    : [];

  const categoryPie = safeArray(categoryDist).map((d) => ({
    name: d.category,
    value: d.count,
  }));

  const activityPie = safeArray(activityDist).map((d) => ({
    name: actionLabels[d.action] || d.action,
    value: d.count,
  }));

  const safeTopProducts = safeArray(topProducts);

  const safeRevenueTrend = safeArray(revenueTrend);
  const safeSalesTrend = safeArray(salesTrend);

  return (
    <div>
      <h2 className="page-title">Reports</h2>

      <div className="rpt-grid">
        {/* 1. Revenue Trend */}
        <div className="rpt-card">
          <h3 className="rpt-card__title">Revenue Trend (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={safeRevenueTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v) => toDollar(v)} />
              <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          {safeRevenueTrend.length === 0 && <p className="rpt-card__empty">No revenue data</p>}
        </div>

        {/* 2. Sales Count */}
        <div className="rpt-card">
          <h3 className="rpt-card__title">Sales Count (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={safeSalesTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          {safeSalesTrend.length === 0 && <p className="rpt-card__empty">No sales data</p>}
        </div>

        {/* 3. Top Products */}
        <div className="rpt-card rpt-card--wide">
          <h3 className="rpt-card__title">Top Selling Products</h3>
          {safeTopProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={safeTopProducts} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="totalSold" fill="#4f46e5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="rpt-card__empty">No products sold yet</p>
          )}
        </div>

        {/* 4. Category Distribution */}
        <div className="rpt-card">
          <h3 className="rpt-card__title">Product Category Distribution</h3>
          {categoryPie.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={categoryPie}
                  cx="50%" cy="50%"
                  innerRadius={50}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {categoryPie.map((_, i) => (
                    <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="rpt-card__empty">No categories found</p>
          )}
        </div>

        {/* 5. Stock Status + Expired */}
        <div className="rpt-card">
          <h3 className="rpt-card__title">Stock Status Distribution</h3>
          {stockPie.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={stockPie}
                  cx="50%" cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {stockPie.map((_, i) => (
                    <Cell key={i} fill={STOCK_COLORS[i % STOCK_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="rpt-card__empty">No products</p>
          )}
        </div>

        {/* 6. Quick Insights */}
        <div className="rpt-card rpt-card--wide">
          <h3 className="rpt-card__title">Quick Insights</h3>
          {insights ? (
            <div className="rpt-insights">
              <div className="rpt-insight">
                <span className="rpt-insight__label">Best Selling Product</span>
                <span className="rpt-insight__value">
                  {insights.bestSellingProduct
                    ? `${insights.bestSellingProduct.name} (${insights.bestSellingProduct.totalSold} sold)`
                    : 'No sales yet'}
                </span>
              </div>
              <div className="rpt-insight">
                <span className="rpt-insight__label">Low Stock Alerts</span>
                <span className="rpt-insight__value">
                  {safeArray(insights?.lowStockAlerts).length > 0
                    ? safeArray(insights.lowStockAlerts).map((p) => `${p.name} (${p.stock} left)`).join(', ')
                    : 'All products well-stocked'}
                </span>
              </div>
              <div className="rpt-insight">
                <span className="rpt-insight__label">Expired Products</span>
                <span className="rpt-insight__value">
                  {insights.expiredProductCount > 0
                    ? `${insights.expiredProductCount} product(s) past expiry date`
                    : 'No expired products'}
                </span>
              </div>
              <div className="rpt-insight">
                <span className="rpt-insight__label">Average Sale Value</span>
                <span className="rpt-insight__value">${insights.averageSaleValue}</span>
              </div>
              <div className="rpt-insight">
                <span className="rpt-insight__label">Revenue Trend</span>
                <span className="rpt-insight__value">{insights.revenueTrend}</span>
              </div>
            </div>
          ) : (
            <p className="rpt-card__empty">No insights available</p>
          )}
        </div>
      </div>

      {/* Activity Distribution - kept as supplemental section */}
      {activityPie.length > 0 && (
        <div className="rpt-card rpt-card--activity">
          <h3 className="rpt-card__title">Activity Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={activityPie}
                cx="50%" cy="50%"
                outerRadius={90}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {activityPie.map((_, i) => (
                  <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
