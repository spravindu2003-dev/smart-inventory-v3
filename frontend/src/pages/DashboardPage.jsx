import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSummary } from '../api/insights';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSummary();
      setSummary(data);
    } catch {
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) {
    return (
      <div>
        <h2 className="page-title">Dashboard</h2>
        <div className="page-center" style={{ minHeight: 200 }}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div>
        <h2 className="page-title">Dashboard</h2>
        <div className="welcome-card">
          <h3>Welcome, {user?.username}</h3>
          <p>
            Role: <span className="badge badge--role">{user?.role}</span>
            {' | '}
            Email: {user?.email}
          </p>
        </div>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: '1.5rem', textAlign: 'center' }}>
          No data available
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="page-title">Dashboard</h2>

      <div className="welcome-card">
        <h3>Welcome, {user?.username}</h3>
        <p>
          Role: <span className="badge badge--role">{user?.role}</span>
          {' | '}
          Email: {user?.email}
        </p>
      </div>

      <div className="insights-grid" style={{ marginTop: '1.25rem' }}>
        <div className="insight-card">
          <span className="insight-card__value">
            ${Number(summary.totalRevenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="insight-card__label">Revenue</span>
        </div>
        <div className="insight-card">
          <span className="insight-card__value">{summary.totalSales}</span>
          <span className="insight-card__label">Sales</span>
        </div>
        <div className="insight-card">
          <span className="insight-card__value">{summary.totalUnitsSold}</span>
          <span className="insight-card__label">Units Sold</span>
        </div>
        <div className="insight-card insight-card--warn">
          <span className="insight-card__value">{summary.lowStockProducts}</span>
          <span className="insight-card__label">Low Stock Items</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Recent Sales</h3>
          {summary.recentSales && summary.recentSales.length > 0 ? (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Total</th>
                    <th>Time</th>
                    <th>User</th>
                    <th>Items</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.recentSales.map((s) => (
                    <tr key={s.id}>
                      <td><strong>#{s.id}</strong></td>
                      <td>${Number(s.total).toFixed(2)}</td>
                      <td className="table__date">{timeAgo(s.createdAt)}</td>
                      <td>{s.user?.username || '\u2014'}</td>
                      <td>{s.items?.length || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>No sales yet</p>
          )}
        </div>

        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Top Products</h3>
          {summary.topSellingProducts && summary.topSellingProducts.length > 0 ? (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Sold</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.topSellingProducts.map((p) => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td className="table__sku">{p.sku}</td>
                      <td><strong>{p.totalSold}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>No products sold yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
