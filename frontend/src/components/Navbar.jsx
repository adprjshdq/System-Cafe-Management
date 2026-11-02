import React, { useState, useEffect } from 'react';
import { Clock, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ title, onOpenSidebar }) {
  const { user } = useAuth();
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Buka menu navigasi"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>

        <h2 className="truncate text-base font-bold text-slate-800 sm:text-xl">{title}</h2>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:gap-6">
        <div className="hidden items-center space-x-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500 sm:flex">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{timeStr} WIB</span>
        </div>

        <div className="hidden items-center space-x-2 sm:flex">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-medium text-slate-600">Sistem Aktif</span>
        </div>

        <div className="hidden h-6 w-px bg-slate-200 sm:block"></div>

        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div className="hidden md:block text-left text-xs">
            <p className="font-semibold text-slate-800">{user?.name}</p>
            <p className="text-slate-400 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
