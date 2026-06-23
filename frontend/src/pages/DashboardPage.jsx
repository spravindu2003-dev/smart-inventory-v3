import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { safeArray } from '../api/safeResponse';
import { getSummary } from '../api/insights';
import { useFetch } from '../hooks/useFetch';
import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';

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
  const { loading, run } = useFetch();

  useEffect(() => {
    run(async (signal) => {
      const res = await getSummary(signal);
      setSummary(res.data);
    });
  }, [run]);

  if (loading) {
    return (
      <div>
        <h2 className="page-title">Dashboard</h2>
        <Card>
          <Skeleton width="180px" height={22} />
          <div style={{ marginTop: 8 }}><Skeleton width="280px" height={16} /></div>
        </Card>
        <div className="insights-grid" style={{ marginTop: '1.25rem' }}>
          {Array.from({ length: 7 }, (_, i) => (
            <Card key={i}>
              <Skeleton width="80px" height={28} />
              <div style={{ marginTop: 4 }}><Skeleton width="100px" height={14} /></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div>
        <h2 className="page-title">Dashboard</h2>
        <Card>
          <h3>Welcome, {user?.username}</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Role: <span className="badge badge--role">{user?.role}</span> | Email: {user?.email}
          </p>
        </Card>
        <EmptyState message="No data available" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="page-title">Dashboard</h2>

      <Card>
        <h3>Welcome, {user?.username}</h3>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          Role: <span className="badge badge--role">{user?.role}</span> | Email: {user?.email}
        </p>
      </Card>

      <div className="insights-grid" style={{ marginTop: '1.25rem' }}>
        <StatCard
          value={`$${Number(summary.totalRevenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          label="Revenue"
        />
        <StatCard value={summary.totalSales} label="Sales" />
        <StatCard value={summary.totalUnitsSold} label="Units Sold" />
        <StatCard value={summary.lowStockProducts} label="Low Stock Items" variant="warn" />
        <StatCard value={summary.lowStockItems} label="Low Stock (1-10)" variant="warn" />
        <StatCard value={summary.outOfStockItems} label="Out of Stock" variant="danger" />
        <StatCard value={summary.expiredProducts} label="Expired Products" variant="danger" />
      </div>

      <div className="dashboard-grid">
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Recent Sales</h3>
          {safeArray(summary?.recentSales).length > 0 ? (
            <div className="table-card">
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
                  {safeArray(summary.recentSales).map((s) => (
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
            <EmptyState message="No sales yet" />
          )}
        </div>

        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Top Products</h3>
          {safeArray(summary?.topSellingProducts).length > 0 ? (
            <div className="table-card">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Sold</th>
                  </tr>
                </thead>
                <tbody>
                  {safeArray(summary.topSellingProducts).map((p) => (
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
            <EmptyState message="No products sold yet" />
          )}
        </div>
      </div>
    </div>
  );
}
