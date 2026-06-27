import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: '\u2302', roles: ['owner', 'manager', 'cashier'] },
  { to: '/dashboard/products', label: 'Products', icon: '\u2630', roles: ['owner', 'manager', 'cashier'] },
  { to: '/dashboard/sales', label: 'Sales', icon: '\u2637', roles: ['owner', 'manager', 'cashier'] },
  { to: '/dashboard/insights', label: 'Insights', icon: '\u2606', roles: ['owner', 'manager'] },
  { to: '/dashboard/activities', label: 'Activity Log', icon: '\u2691', roles: ['owner', 'manager'] },
  { to: '/dashboard/reports', label: 'Reports', icon: '\u2261', roles: ['owner', 'manager', 'cashier'] },
  { to: '/dashboard/users', label: 'Users', icon: '\u263A', roles: ['owner'] },
];

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();

  const visible = links.filter((l) => l.roles.includes(user?.role));

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
        <div className="sidebar__header">
          <span className="sidebar__logo">{'\u25C8'}</span>
          <span className="sidebar__title">Inventory</span>
        </div>
        <nav className="sidebar__nav">
          {visible.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/dashboard'}
              className={({ isActive }) =>
                `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
              }
              onClick={onClose}
            >
              <span className="sidebar__icon">{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
