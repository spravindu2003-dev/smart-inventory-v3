import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const primaryTabs = [
  { to: '/dashboard', label: 'Dashboard', icon: '\u2302' },
  { to: '/dashboard/products', label: 'Products', icon: '\u2630' },
  { to: '/dashboard/sales', label: 'Sales', icon: '\u2637' },
];

const moreItems = [
  { to: '/dashboard/requests', label: 'Requests', icon: '\u2709', roles: ['owner', 'manager'] },
  { to: '/dashboard/insights', label: 'Insights', icon: '\u2606', roles: ['owner', 'manager'] },
  { to: '/dashboard/activities', label: 'Activity Log', icon: '\u2691', roles: ['owner', 'manager'] },
  { to: '/dashboard/reports', label: 'Reports', icon: '\u2261', roles: ['owner', 'manager', 'cashier'] },
  { to: '/dashboard/users', label: 'Users', icon: '\u263A', roles: ['owner'] },
  { to: '/dashboard/settings', label: 'Settings', icon: '\u2699', roles: ['owner', 'manager', 'cashier'] },
];

export default function BottomNav({ onCmdOpen }) {
  const { user } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setMoreOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const visibleMore = moreItems.filter((m) => m.roles.includes(user?.role));

  return (
    <nav className="bottom-nav">
      {primaryTabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/dashboard'}
          className={({ isActive }) =>
            `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`
          }
        >
          <span className="bottom-nav__icon">{tab.icon}</span>
          <span className="bottom-nav__label">{tab.label}</span>
        </NavLink>
      ))}

      <div className="bottom-nav__more" ref={ref}>
        <button
          className={`bottom-nav__item ${moreOpen ? 'bottom-nav__item--active' : ''}`}
          onClick={() => setMoreOpen((p) => !p)}
        >
          <span className="bottom-nav__icon">{'\u22EE'}</span>
          <span className="bottom-nav__label">More</span>
        </button>

        {moreOpen && (
          <>
            <div className="bottom-nav__overlay" onClick={() => setMoreOpen(false)} />
            <div className="bottom-nav__menu">
              <button
                className="bottom-nav__menu-item"
                onClick={() => { setMoreOpen(false); onCmdOpen?.(); }}
              >
                <span className="bottom-nav__menu-icon">&#128269;</span>
                Search
              </button>
              <div className="bottom-nav__menu-divider" />
              {visibleMore.map((m) => (
                <NavLink
                  key={m.to}
                  to={m.to}
                  className={({ isActive }) =>
                    `bottom-nav__menu-item${isActive ? ' bottom-nav__menu-item--active' : ''}`
                  }
                  onClick={() => setMoreOpen(false)}
                >
                  <span className="bottom-nav__menu-icon">{m.icon}</span>
                  {m.label}
                </NavLink>
              ))}
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
