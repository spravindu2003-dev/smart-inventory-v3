import { useState, useEffect } from 'react';
import { getData, safeArray } from '../api/safeResponse';
import * as insightsApi from '../api/insights';
import { useFetch } from '../hooks/useFetch';
import { Events, on } from '../utils/eventBus';
import Skeleton from '../components/ui/Skeleton';

export default function InsightsPage() {
  const [summary, setSummary] = useState(null);
  const [mostSold, setMostSold] = useState([]);
  const [leastSold, setLeastSold] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [deadStock, setDeadStock] = useState([]);
  const { loading, error, run } = useFetch();

  function fetchAll() {
    run(async (signal) => {
      const [s, ms, ls, ls2, ds] = await Promise.all([
        insightsApi.getSummary(signal),
        insightsApi.getMostSold(signal).catch(() => ({ data: { data: [] } })),
        insightsApi.getLeastSold(signal).catch(() => ({ data: { data: [] } })),
        insightsApi.getLowStock(signal),
        insightsApi.getDeadStock(signal).catch(() => ({ data: { data: [] } })),
      ]);
      setSummary(s.data);
      setMostSold(getData(ms));
      setLeastSold(getData(ls));
      setLowStock(getData(ls2));
      setDeadStock(getData(ds));
    });
  }

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    const unsub1 = on(Events.SALE_UPDATED, fetchAll);
    const unsub2 = on(Events.PRODUCT_UPDATED, fetchAll);
    return () => { unsub1(); unsub2(); };
  }, []);

  if (loading) {
    return (
      <div>
        <h2 className="page-title">Insights</h2>
        <div className="insights-grid">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="insight-card">
              <Skeleton width="60px" height={28} />
              <div style={{ marginTop: 4 }}><Skeleton width="80px" height={14} /></div>
            </div>
          ))}
        </div>
        <section className="insight-section">
          <Skeleton width="180px" height={20} />
          <div style={{ marginTop: 12 }}><Skeleton width="100%" height={16} count={3} /></div>
        </section>
      </div>
    );
  }

  return (
    <div>
      <h2 className="page-title">Insights</h2>

      {error && <div className="alert alert--error">{error}</div>}

      <div className="insights-grid">
        <div className="insight-card">
          <span className="insight-card__value">{summary?.totalProducts ?? 0}</span>
          <span className="insight-card__label">Total Products</span>
        </div>
        <div className="insight-card insight-card--warn">
          <span className="insight-card__value">{summary?.lowStockProducts ?? 0}</span>
          <span className="insight-card__label">Low Stock Alerts</span>
        </div>
        <div className="insight-card insight-card--danger">
          <span className="insight-card__value">{summary?.deadStockProducts ?? 0}</span>
          <span className="insight-card__label">Dead Stock</span>
        </div>
        <div className="insight-card">
          <span className="insight-card__value">{summary?.activitiesToday ?? 0}</span>
          <span className="insight-card__label">Activities Today</span>
        </div>
      </div>

      <section className="insight-section">
        <h3>Most Sold Products</h3>
        {safeArray(mostSold).length === 0 ? (
          <p className="insight-empty">No sales data yet</p>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Total Sold</th>
                </tr>
              </thead>
              <tbody>
                {safeArray(mostSold).map((p, i) => (
                  <tr key={p.id}>
                    <td>{i + 1}</td>
                    <td>{p.name}</td>
                    <td className="table__sku">{p.sku}</td>
                    <td><strong>{p.totalSold}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="insight-section">
        <h3>Least Sold Products</h3>
        {safeArray(leastSold).length === 0 ? (
          <p className="insight-empty">No sales data yet</p>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Total Sold</th>
                </tr>
              </thead>
              <tbody>
                {safeArray(leastSold).map((p, i) => (
                  <tr key={p.id}>
                    <td>{i + 1}</td>
                    <td>{p.name}</td>
                    <td className="table__sku">{p.sku}</td>
                    <td>{p.totalSold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="insight-section">
        <h3>Low Stock Alerts (&le;10)</h3>
        {safeArray(lowStock).length === 0 ? (
          <p className="insight-empty">All products are well stocked</p>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {safeArray(lowStock).map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td className="table__sku">{p.sku}</td>
                    <td>{p.stock}</td>
                    <td>
                      <span className={`badge badge--${p.stock === 0 ? 'danger' : 'warn'}`}>
                        {p.stock === 0 ? 'Out of Stock' : 'Low Stock'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="insight-section">
        <h3>Dead Stock (never sold)</h3>
        {safeArray(deadStock).length === 0 ? (
          <p className="insight-empty">No dead stock detected</p>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Stock</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {safeArray(deadStock).map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td className="table__sku">{p.sku}</td>
                    <td>{p.stock}</td>
                    <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
