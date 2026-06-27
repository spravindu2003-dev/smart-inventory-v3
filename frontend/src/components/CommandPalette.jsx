import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const routes = [
  { to: '/dashboard', label: 'Go to Dashboard', icon: '\u2302', roles: ['owner', 'manager', 'cashier'] },
  { to: '/dashboard/products', label: 'View Products', icon: '\u2630', roles: ['owner', 'manager', 'cashier'] },
  { to: '/dashboard/sales', label: 'View Sales', icon: '\u2637', roles: ['owner', 'manager', 'cashier'] },
  { to: '/dashboard/insights', label: 'View Insights', icon: '\u2606', roles: ['owner', 'manager'] },
  { to: '/dashboard/activities', label: 'View Activity Log', icon: '\u2691', roles: ['owner', 'manager'] },
  { to: '/dashboard/reports', label: 'Open Reports', icon: '\u2261', roles: ['owner', 'manager', 'cashier'] },
  { to: '/dashboard/settings', label: 'Settings', icon: '\u2699', roles: ['owner', 'manager', 'cashier'] },
  { to: '/dashboard/users', label: 'User Management', icon: '\u263A', roles: ['owner'] },
];

const actions = [
  { id: 'add-product', label: 'Add Product', icon: '+', route: '/dashboard/products' },
  { id: 'create-sale', label: 'Create Sale', icon: '+', route: '/dashboard/sales' },
  { id: 'view-insights', label: 'View Insights', icon: '\u2606', route: '/dashboard/insights' },
  { id: 'open-reports', label: 'Open Reports', icon: '\u2261', route: '/dashboard/reports' },
];

export default function CommandPalette({ open, onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const filteredRoutes = routes.filter((r) => r.roles.includes(user?.role) && (!query || r.label.toLowerCase().includes(query.toLowerCase())));
  const filteredActions = actions.filter((a) => (!query || a.label.toLowerCase().includes(query.toLowerCase())));
  const allItems = [...filteredActions, ...filteredRoutes];
  const selected = allItems[selectedIndex];

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleKeyDown = useCallback((e) => {
    if (!open && (e.key === 'k' && (e.metaKey || e.ctrlKey))) {
      e.preventDefault();
      return;
    }
    if (!open) return;

    switch (e.key) {
      case 'ArrowDown':
      case 'Tab':
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, allItems.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (selected) {
          onClose();
          navigate(selected.route || selected.to);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [open, selected, navigate, onClose, allItems.length]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (open) onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <>
      <div className="cmd-overlay" onClick={onClose} />
      <div className="cmd-palette" onClick={(e) => e.stopPropagation()}>
        <div className="cmd-input-wrap">
          <span className="cmd-search-icon">&#128269;</span>
          <input
            ref={inputRef}
            className="cmd-input"
            type="text"
            placeholder="Search pages and actions..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
          />
          <kbd className="cmd-hint">ESC</kbd>
        </div>

        <div className="cmd-results">
          {allItems.length === 0 && (
            <div className="cmd-empty">No results found</div>
          )}

          {filteredActions.length > 0 && (
            <div className="cmd-group">
              <div className="cmd-group__label">Quick Actions</div>
              {filteredActions.map((a, i) => {
                const idx = allItems.indexOf(a);
                return (
                  <button
                    key={a.id}
                    className={`cmd-item${idx === selectedIndex ? ' cmd-item--selected' : ''}`}
                    onClick={() => { onClose(); navigate(a.route); }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <span className="cmd-item__icon cmd-item__icon--action">{a.icon}</span>
                    <span>{a.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {filteredRoutes.length > 0 && (
            <div className="cmd-group">
              <div className="cmd-group__label">Navigate to</div>
              {filteredRoutes.map((r, i) => {
                const idx = allItems.indexOf(r);
                return (
                  <button
                    key={r.to}
                    className={`cmd-item${idx === selectedIndex ? ' cmd-item--selected' : ''}`}
                    onClick={() => { onClose(); navigate(r.to); }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <span className="cmd-item__icon">{r.icon}</span>
                    <span>{r.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="cmd-footer">
          <span><kbd>&uarr;</kbd><kbd>&darr;</kbd> navigate</span>
          <span><kbd>&crarr;</kbd> select</span>
          <span><kbd>ESC</kbd> close</span>
        </div>
      </div>
    </>
  );
}
