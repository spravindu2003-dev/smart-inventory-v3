import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMediaQuery } from '../hooks/useMediaQuery';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import BottomNav from './BottomNav';
import CommandPalette from './CommandPalette';

/*
 * ARCHITECTURE RULE: Navigation system per device
 *   Desktop (≥769px): Sidebar + Topbar only — BottomNav is NOT rendered
 *   Mobile  (<769px): BottomNav only      — Sidebar is NOT rendered
 *
 * This is enforced via conditional rendering (useMediaQuery)
 * NOT via CSS display:none, so unused DOM nodes don't affect
 * layout, memory, or re-render cycles.
 *
 * An always-mounted Ctrl+K listener opens the CommandPalette
 * (quick actions only — never navigation routes).
 */
export default function DashboardLayout() {
  const { user } = useAuth();
  const isDesktop = useMediaQuery('(min-width: 769px)');
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCmdOpen((p) => !p);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="dashboard">
      {isDesktop && <Sidebar />}

      <div className="dashboard__main">
        <Topbar onCmdOpen={() => setCmdOpen(true)} />
        <main className="dashboard__content">
          <Outlet context={{ user }} />
        </main>
        {!isDesktop && <BottomNav onCmdOpen={() => setCmdOpen(true)} />}
      </div>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
}
