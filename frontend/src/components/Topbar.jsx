import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="topbar">
      <button className="topbar__hamburger" onClick={onMenuClick}>
        {'\u2630'}
      </button>
      <div className="topbar__spacer" />
      <div className="topbar__user" ref={ref}>
        <button
          className="topbar__avatar"
          onClick={() => setMenuOpen((p) => !p)}
        >
          {user?.username?.charAt(0).toUpperCase()}
        </button>
        {menuOpen && (
          <div className="topbar__dropdown">
            <div className="topbar__dropdown-info">
              <strong>{user?.username}</strong>
              <span>{user?.email}</span>
              <span className="topbar__role">{user?.role}</span>
            </div>
            <hr />
            <button className="topbar__logout" onClick={logout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
