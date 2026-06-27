import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Topbar({ onCmdOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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
      <span className="topbar__brand">
        <span className="topbar__brand-icon">{'\u25C8'}</span>
        <span className="topbar__brand-title">Smart Inventory</span>
      </span>
      <button className="topbar__cmd-btn" onClick={onCmdOpen} title="Quick Actions (Ctrl+K)">
        <span className="topbar__cmd-icon">&#128269;</span>
        <span className="topbar__cmd-text">Actions</span>
        <kbd className="topbar__cmd-kbd">Ctrl+K</kbd>
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
            <button className="topbar__dropdown-item" onClick={() => { setMenuOpen(false); navigate('/dashboard/settings'); }}>
              {'\u2699'} Settings
            </button>
            <hr />
            <button className="topbar__dropdown-item topbar__dropdown-item--danger" onClick={logout}>
              {'\uD83D\uDEAA'} Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
