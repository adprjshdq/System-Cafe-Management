import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

export default function MainLayout() {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/':
        return 'Dashboard';
      case '/pos':
        return 'Point of Sale Kasir';
      case '/kitchen':
        return 'Kitchen Display System';
      case '/menus':
        return 'Manajemen Katalog Menu';
      case '/tables':
        return 'Manajemen Denah & Meja';
      case '/orders':
        return 'Riwayat Transaksi & Struk';
      case '/users':
        return 'Manajemen Pengguna & Staf';
      default:
        return 'Cafe Management System';
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar open={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          title={getPageTitle(location.pathname)}
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />
        <main className="flex-1 p-4 overflow-y-auto sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
