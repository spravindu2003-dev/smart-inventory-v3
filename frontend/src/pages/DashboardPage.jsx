import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSummary } from '../api/insights';

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const data = await getSummary();
      setSummary(data);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

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

      {loading ? (
        <div className="page-center" style={{ minHeight: 200 }}>
          <div className="spinner" />
        </div>
      ) : summary ? (
        <>
          <div className="insights-grid">
            <div className="insight-card">
              <span className="insight-card__value">{summary.totalProducts}</span>
              <span className="insight-card__label">Total Products</span>
            </div>
            <div className="insight-card">
              <span className="insight-card__value">{summary.totalStock}</span>
              <span className="insight-card__label">Units in Stock</span>
            </div>
            <div className="insight-card insight-card--warn">
              <span className="insight-card__value">{summary.lowStockProducts}</span>
              <span className="insight-card__label">Low Stock</span>
            </div>
            <div className="insight-card insight-card--danger">
              <span className="insight-card__value">{summary.deadStockProducts}</span>
              <span className="insight-card__label">Dead Stock</span>
            </div>
          </div>

          <div className="insight-card insight-card--full">
            <span className="insight-card__value">{summary.activitiesToday}</span>
            <span className="insight-card__label">Activities recorded today</span>
          </div>
        </>
      ) : null}
    </div>
  );
}
