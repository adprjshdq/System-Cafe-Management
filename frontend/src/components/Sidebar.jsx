import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  ChefHat, 
  UtensilsCrossed, 
  Grid, 
  ClipboardList, 
  LogOut, 
  Coffee 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin'] },
    { label: 'Kasir / POS', path: '/pos', icon: ShoppingBag, roles: ['admin', 'cashier', 'waiter'] },
    { label: 'Display Dapur', path: '/kitchen', icon: ChefHat, roles: ['admin', 'kitchen'] },
    { label: 'Katalog Menu', path: '/menus', icon: UtensilsCrossed, roles: ['admin'] },
    { label: 'Kelola Meja', path: '/tables', icon: Grid, roles: ['admin', 'cashier'] },
    { label: 'Riwayat Pesanan', path: '/orders', icon: ClipboardList, roles: ['admin', 'cashier'] },
  ];

  const allowedItems = navItems.filter(item => !item.roles || item.roles.includes(user?.role || 'admin'));

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col min-h-screen border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20">
          <Coffee className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-wide text-white">Aroma Cafe</h1>
          <p className="text-xs text-slate-400">Management System</p>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Menu Utama
        </div>
        {allowedItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 mb-3">
          <div className="overflow-hidden pr-2">
            <p className="text-sm font-medium text-white truncate">{user?.name || 'Karyawan'}</p>
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
              {user?.role || 'staff'}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar Sistem</span>
        </button>
      </div>
    </aside>
  );
}
