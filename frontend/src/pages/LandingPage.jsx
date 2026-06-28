import { Link } from 'react-router-dom';

const features = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    ),
    title: 'Real-Time Inventory',
    desc: 'Track stock levels, manage products, and get instant updates across all devices.',
    delay: '0s',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="19" x2="20" y2="19"/>
        <polyline points="4 15 8 11 12 15 20 5"/>
      </svg>
    ),
    title: 'Sales Analytics',
    desc: 'Visualize revenue trends, top products, and sales performance with interactive charts.',
    delay: '0.1s',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Role-Based Access',
    desc: 'Define permissions for Owner, Manager, and Cashier roles. Keep your data secure.',
    delay: '0.2s',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    title: 'Low-Stock Alerts',
    desc: 'Get notified when products run low. Never miss a restock with real-time warnings.',
    delay: '0.3s',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    ),
    title: 'Activity Monitoring',
    desc: 'Track every action across your business. Full audit log with user and timestamp.',
    delay: '0.4s',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/>
      </svg>
    ),
    title: 'Reports & Insights',
    desc: 'Generate detailed reports on sales, inventory, and business performance in one click.',
    delay: '0.5s',
  },
];

const securityItems = [
  { icon: '\uD83D\uDD11', title: 'JWT Authentication', desc: 'Secure token-based authentication for all API requests.' },
  { icon: '\uD83D\uDEE1\uFE0F', title: 'Role-Based Access', desc: 'Granular permissions for Owner, Manager, and Cashier roles.' },
  { icon: '\uD83D\uDD12', title: 'Secure Backend API', desc: 'CORS-protected endpoints with request validation and rate limiting.' },
  { icon: '\uD83D\uDCCB', title: 'Audit Logging', desc: 'Complete activity trail with user attribution and timestamps.' },
];

export default function LandingPage() {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="landing-nav__inner">
          <div className="landing-nav__brand">
            <span className="landing-nav__icon">{'\u25C8'}</span>
            <span className="landing-nav__title">Smart Inventory</span>
          </div>
          <div className="landing-nav__links">
            <Link to="/login" className="btn btn--ghost landing-nav__btn">Sign In</Link>
            <Link to="/signup" className="btn btn--primary landing-nav__btn">Get Started</Link>
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="hero__bg">
          <div className="hero__bg-glow hero__bg-glow--1" />
          <div className="hero__bg-glow hero__bg-glow--2" />
        </div>
        <div className="hero__content">
          <h1 className="hero__title">Smart Inventory System</h1>
          <p className="hero__subtitle">Manage stock, sales, users, and insights in real time</p>
          <div className="hero__actions">
            <Link to="/login" className="btn btn--primary hero__btn">Sign In</Link>
            <Link to="/signup" className="btn btn--ghost hero__btn hero__btn--ghost">Join as Owner</Link>
          </div>
        </div>
      </section>

      <section className="features" id="features">
        <div className="features__inner">
          <div className="features__header">
            <h2 className="features__title">Everything you need to run your business</h2>
            <p className="features__subtitle">Powerful tools designed for modern inventory management</p>
          </div>
          <div className="features__grid">
            {features.map((f) => (
              <div key={f.title} className="feature-card" style={{ animationDelay: f.delay }}>
                <div className="feature-card__icon">{f.icon}</div>
                <h3 className="feature-card__title">{f.title}</h3>
                <p className="feature-card__desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="security" id="security">
        <div className="security__inner">
          <div className="security__header">
            <h2 className="security__title">Enterprise-Grade Security</h2>
            <p className="security__subtitle">Your data is protected with industry-standard security measures</p>
          </div>
          <div className="security__grid">
            {securityItems.map((s, i) => (
              <div key={s.title} className="security-card" style={{ animationDelay: `${i * 0.1}s` }}>
                <span className="security-card__icon">{s.icon}</span>
                <div>
                  <h3 className="security-card__title">{s.title}</h3>
                  <p className="security-card__desc">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer__inner">
          <p>&copy; {new Date().getFullYear()} Smart Inventory System. All rights reserved.</p>
        </div>
      </footer>

      {/* Mobile sticky bottom CTA bar */}
      <div className="landing-sticky-cta">
        <Link to="/login" className="btn btn--primary landing-sticky-cta__btn">Sign In</Link>
        <Link to="/signup" className="btn btn--ghost landing-sticky-cta__btn">Join as Owner</Link>
      </div>
    </div>
  );
}
