import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

export default function MainLayout() {
  const location = useLocation();

  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/':
        return 'Dashboard & Ringkasan';
      case '/pos':
        return 'Point of Sale (POS) Kasir';
      case '/kitchen':
        return 'Kitchen Display System (KDS)';
      case '/menus':
        return 'Manajemen Katalog Menu';
      case '/tables':
        return 'Manajemen Denah & Meja';
      case '/orders':
        return 'Riwayat Transaksi & Struk';
      default:
        return 'Cafe Management System';
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title={getPageTitle(location.pathname)} />
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
