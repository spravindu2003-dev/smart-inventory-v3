import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dashboard">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="dashboard__main">
        <Topbar onMenuClick={() => setSidebarOpen((p) => !p)} />
        <main className="dashboard__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
