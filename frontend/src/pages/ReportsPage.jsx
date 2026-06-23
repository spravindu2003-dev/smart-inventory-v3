import { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { getData, safeArray } from '../api/safeResponse';
import * as reportsApi from '../api/reports';
import { useFetch } from '../hooks/useFetch';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';

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

const chartSkeleton = (
  <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Skeleton width="80%" height={200} />
  </div>
);

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
        <Card>
          <Skeleton width="200px" height={20} />
          <div style={{ marginTop: 12 }}>{chartSkeleton}</div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2 className="page-title">Reports</h2>
        <Card>
          <EmptyState icon={'\u26A0\uFE0F'} message={error} />
        </Card>
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
        <div className="rpt-card">
          <h3 className="rpt-card__title">Revenue Trend (Last 7 Days)</h3>
          {safeRevenueTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={safeRevenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v) => toDollar(v)} />
                <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No revenue data" />
          )}
        </div>

        <div className="rpt-card">
          <h3 className="rpt-card__title">Sales Count (Last 7 Days)</h3>
          {safeSalesTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={safeSalesTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No sales data" />
          )}
        </div>

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
            <EmptyState message="No products sold yet" />
          )}
        </div>

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
            <EmptyState message="No categories found" />
          )}
        </div>

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
            <EmptyState message="No products" />
          )}
        </div>

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
            <EmptyState message="No insights available" />
          )}
        </div>
      </div>

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
