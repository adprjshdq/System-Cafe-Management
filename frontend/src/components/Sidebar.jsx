import React, { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  ChefHat,
  UtensilsCrossed,
  Grid,
  ClipboardList,
  LogOut,
  Coffee,
  Users,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { canAccessPath } from '../config/access';

export default function Sidebar({ open = false, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: user?.role === 'waiter' ? 'Pesanan Meja' : 'Kasir / POS', path: '/pos', icon: ShoppingBag },
    { label: 'Display Dapur', path: '/kitchen', icon: ChefHat },
    { label: 'Katalog Menu', path: '/menus', icon: UtensilsCrossed },
    { label: 'Kelola Meja', path: '/tables', icon: Grid },
    { label: 'Riwayat Pesanan', path: '/orders', icon: ClipboardList },
    { label: 'Kelola Pengguna', path: '/users', icon: Users },
  ];

  const allowedItems = navItems.filter((item) => canAccessPath(user?.role, item.path));

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose?.();
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose]);

  return (
    <>
      {open && (
        <div
          className="animate-pos-fade fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex min-h-screen w-64 flex-col border-r border-slate-200 bg-white text-slate-900 transition-transform duration-200 ease-out lg:static lg:z-auto lg:translate-x-0 lg:transition-none ${open ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 p-4 lg:p-6">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center">
              <img
                src="/aroma_cafe.png"
                alt="Aroma Cafe"
                className="h-10 w-10 object-contain"
              />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-wide text-slate-900">Aroma Cafe</h1>
              <p className="text-xs text-slate-500">Management System</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup menu navigasi"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
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
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                    ? 'bg-brand-700 text-white shadow-md shadow-brand-900/20 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 mb-3">
            <div className="overflow-hidden pr-2">
              <p className="text-sm font-medium text-slate-900 truncate">{user?.name || 'Karyawan'}</p>
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">
                {user?.role || 'staff'}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </aside>
    </>
  );
}
