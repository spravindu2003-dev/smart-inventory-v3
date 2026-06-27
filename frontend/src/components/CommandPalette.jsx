import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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

  const filtered = actions.filter((a) => {
    if (!query) return true;
    return a.label.toLowerCase().includes(query.toLowerCase());
  });

  const selected = filtered[selectedIndex];

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleKeyDown = useCallback((e) => {
    if (!open) return;

    switch (e.key) {
      case 'ArrowDown':
      case 'Tab':
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (selected) {
          onClose();
          navigate(selected.route);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [open, selected, navigate, onClose, filtered.length]);

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
            placeholder="Search quick actions..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
          />
          <kbd className="cmd-hint">ESC</kbd>
        </div>

        <div className="cmd-results">
          {filtered.length === 0 && (
            <div className="cmd-empty">No actions found</div>
          )}

          {filtered.length > 0 && (
            <div className="cmd-group">
              <div className="cmd-group__label">Quick Actions</div>
              {filtered.map((a, i) => (
                <button
                  key={a.id}
                  className={`cmd-item${i === selectedIndex ? ' cmd-item--selected' : ''}`}
                  onClick={() => { onClose(); navigate(a.route); }}
                  onMouseEnter={() => setSelectedIndex(i)}
                >
                  <span className="cmd-item__icon cmd-item__icon--action">{a.icon}</span>
                  <span>{a.label}</span>
                </button>
              ))}
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
