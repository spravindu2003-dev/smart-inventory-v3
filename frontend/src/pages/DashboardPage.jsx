import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOnboarding } from '../context/OnboardingContext';
import { safeArray } from '../api/safeResponse';
import { getSummary } from '../api/insights';
import { useFetch } from '../hooks/useFetch';
import { Events, on } from '../utils/eventBus';
import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';
import OnboardingTour from '../components/OnboardingTour';

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

function GuidedEmptyState({ name, onStartOnboarding }) {
  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Welcome to Your Dashboard</h2>
        <p className="page-subtitle">Let&rsquo;s get you started with your inventory system.</p>
      </div>

      <Card className="welcome-card">
        <div className="welcome-card__content">
          <h3>Hello, {name}</h3>
          <p className="welcome-card__meta">
            Your dashboard is empty because you haven&rsquo;t added any data yet.
          </p>
        </div>
      </Card>

      <div className="guided-empty">
        <div className="guided-empty__card">
          <span className="guided-empty__icon">&#9733;</span>
          <h3>Complete Onboarding</h3>
          <p>Set up your business, create your first product, and process a sale.</p>
          <button className="btn btn--primary" onClick={onStartOnboarding}>
            Start Onboarding
          </button>
        </div>

        <div className="guided-empty__card">
          <span className="guided-empty__icon">&#9632;</span>
          <h3>Add Products</h3>
          <p>Start building your inventory one product at a time.</p>
          <button className="btn btn--ghost" onClick={() => window.location.href = '/dashboard/products'}>
            Go to Products
          </button>
        </div>
      </div>
    </div>
  );
}

function SmartSuggestions({ summary }) {
  const suggestions = [];

  if (summary.lowStockItems > 0) {
    suggestions.push({
      icon: '\u26A0\uFE0F',
      title: 'Low Stock Alert',
      desc: `${summary.lowStockItems} item${summary.lowStockItems > 1 ? 's are' : ' is'} running low on stock.`,
      cta: 'View Products',
      link: '/dashboard/products',
    });
  }

  if (summary.outOfStockItems > 0) {
    suggestions.push({
      icon: '\u274C',
      title: 'Out of Stock',
      desc: `${summary.outOfStockItems} product${summary.outOfStockItems > 1 ? 's are' : ' is'} out of stock.`,
      cta: 'Restock Now',
      link: '/dashboard/products',
    });
  }

  if (summary.totalSales > 0 && safeArray(summary?.topSellingProducts).length > 0) {
    const top = summary.topSellingProducts[0];
    suggestions.push({
      icon: '\uD83D\uDCC8',
      title: 'Top Selling Product',
      desc: `&ldquo;${top.name}&rdquo; — ${top.totalSold} unit${top.totalSold > 1 ? 's' : ''} sold.`,
      cta: 'View Insights',
      link: '/dashboard/insights',
    });
  }

  if (summary.expiredProducts > 0) {
    suggestions.push({
      icon: '\u26A0\uFE0F',
      title: 'Expired Products',
      desc: `${summary.expiredProducts} product${summary.expiredProducts > 1 ? 's have' : ' has'} expired.`,
      cta: 'Review',
      link: '/dashboard/products',
    });
  }

  if (suggestions.length === 0) return null;

  return (
    <section className="dashboard-section">
      <h3 className="section-title">Suggestions</h3>
      <div className="suggestions-grid">
        {suggestions.map((s, i) => (
          <a key={i} href={s.link} className="suggestion-card">
            <span className="suggestion-card__icon">{s.icon}</span>
            <div className="suggestion-card__body">
              <h4 className="suggestion-card__title">{s.title}</h4>
              <p className="suggestion-card__desc" dangerouslySetInnerHTML={{ __html: s.desc }} />
            </div>
            <span className="suggestion-card__cta">{s.cta} &rarr;</span>
          </a>
        ))}
      </div>
    </section>
  );
}

function CashierDashboard({ summary, loading }) {
  if (loading && !summary) {
    return (
      <div>
        <div className="page-header">
          <h2 className="page-title">Sales Terminal</h2>
        </div>
        <Card className="welcome-card-skeleton">
          <Skeleton width="180px" height={22} />
          <div style={{ marginTop: 8 }}><Skeleton width="280px" height={16} /></div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Sales Terminal</h2>
        <p className="page-subtitle">Quick overview of today&rsquo;s activity</p>
      </div>

      {summary ? (
        <section className="dashboard-section">
          <h3 className="section-title">Today&rsquo;s Summary</h3>
          <div className="stats-grid">
            <StatCard value={`$${Number(summary.totalRevenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} label="Revenue" />
            <StatCard value={summary.totalSales} label="Sales" />
            <StatCard value={summary.totalUnitsSold} label="Units Sold" />
          </div>
        </section>
      ) : (
        <EmptyState icon={'\uD83D\uDCCA'} message="No data yet" />
      )}

      {safeArray(summary?.recentSales).length > 0 && (
        <section className="dashboard-section">
          <h3 className="section-title">Recent Sales</h3>
          <div className="table-card">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Total</th>
                  <th>Time</th>
                  <th>Items</th>
                </tr>
              </thead>
              <tbody>
                {safeArray(summary.recentSales).map((s) => (
                  <tr key={s.id}>
                    <td><strong>#{s.id}</strong></td>
                    <td>${Number(s.total).toFixed(2)}</td>
                    <td className="table__date">{timeAgo(s.createdAt)}</td>
                    <td>{s.items?.length || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const onboarding = useOnboarding();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const { loading, run } = useFetch();
  const [tourActive, setTourActive] = useState(false);

  const hasData = summary && (summary.totalSales > 0 || summary.totalProducts > 0);

  function fetchSummary() {
    run(async (signal) => {
      const res = await getSummary(signal);
      setSummary(res.data);
    });
  }

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    const unsub1 = on(Events.SALE_UPDATED, fetchSummary);
    const unsub2 = on(Events.PRODUCT_UPDATED, fetchSummary);
    const unsub3 = on(Events.DASHBOARD_REFRESH, fetchSummary);
    return () => { unsub1(); unsub2(); unsub3(); };
  }, []);

  useEffect(() => {
    if (summary && onboarding.status === 'in_progress' && onboarding.currentStep === 5) {
      setTourActive(true);
    }
  }, [summary, onboarding.status, onboarding.currentStep]);

  if (user?.role === 'cashier') {
    return <CashierDashboard summary={summary} loading={loading && !summary} />;
  }

  if (loading && !summary) {
    return (
      <div>
        <div className="page-header">
          <h2 className="page-title">Dashboard</h2>
        </div>
        <Card className="welcome-card-skeleton">
          <Skeleton width="180px" height={22} />
          <div style={{ marginTop: 8 }}><Skeleton width="280px" height={16} /></div>
        </Card>
        <div className="stats-grid" style={{ marginTop: '1.25rem' }}>
          {Array.from({ length: 7 }, (_, i) => (
            <div className="stat-card-skeleton" key={i}>
              <Skeleton width="80px" height={28} />
              <div style={{ marginTop: 4 }}><Skeleton width="100px" height={14} /></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div>
        <GuidedEmptyState
          name={user?.name}
          onStartOnboarding={() => onboarding.resumeOnboarding()}
        />
      </div>
    );
  }

  if (!hasData) {
    const ownerNotStarted = user?.role === 'owner' && (onboarding.status === 'not_started' || onboarding.status === 'skipped');
    return (
      <div>
        <GuidedEmptyState
          name={user?.name}
          onStartOnboarding={() => {
            if (ownerNotStarted) {
              onboarding.startOnboarding();
            } else {
              onboarding.resumeOnboarding();
            }
          }}
        />
      </div>
    );
  }

  return (
    <div>
      {tourActive && (
        <OnboardingTour onComplete={() => setTourActive(false)} />
      )}

      <div className="page-header">
        <h2 className="page-title">Dashboard</h2>
        <p className="page-subtitle">Overview of your business performance</p>
      </div>

      <Card className="welcome-card">
        <div className="welcome-card__content">
          <h3>Welcome, {user?.name}</h3>
          <p className="welcome-card__meta">
            <span className="badge badge--role">{user?.role}</span>
            <span>{user?.email}</span>
            {onboarding.businessName && (
              <span className="welcome-card__business">{onboarding.businessName}</span>
            )}
          </p>
        </div>
      </Card>

      <SmartSuggestions summary={summary} />

      <section className="dashboard-section">
        <h3 className="section-title">Quick Stats</h3>
        <div className="stats-grid">
          <StatCard
            value={`$${Number(summary.totalRevenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            label="Revenue"
          />
          <StatCard value={summary.totalSales} label="Sales" />
          <StatCard value={summary.totalUnitsSold} label="Units Sold" />
          {user?.role === 'owner' && (
            <>
              <StatCard value={summary.lowStockProducts} label="Low Stock Items" variant="warn" />
              <StatCard value={summary.lowStockItems} label="Low Stock (1-10)" variant="warn" />
              <StatCard value={summary.outOfStockItems} label="Out of Stock" variant="danger" />
              <StatCard value={summary.expiredProducts} label="Expired Products" variant="danger" />
            </>
          )}
          {user?.role === 'manager' && (
            <>
              <StatCard value={summary.lowStockItems} label="Low Stock (1-10)" variant="warn" />
              <StatCard value={summary.outOfStockItems} label="Out of Stock" variant="danger" />
              <StatCard value={summary.expiredProducts} label="Expired Products" variant="danger" />
            </>
          )}
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="dashboard-section" id="recent-sales-section">
          <h3 className="section-title">Recent Sales</h3>
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
                      <td>{s.user?.name || '\u2014'}</td>
                      <td>{s.items?.length || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={'\uD83D\uDED2'} message="No sales yet">
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Create your first sale to get started</p>
            </EmptyState>
          )}
        </section>

        <section className="dashboard-section" id="top-products-section">
          <h3 className="section-title">Top Products</h3>
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
            <EmptyState icon={'\uD83D\uDCE6'} message="No products sold yet">
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Products will appear here once sold</p>
            </EmptyState>
          )}
        </section>
      </div>
    </div>
  );
}
