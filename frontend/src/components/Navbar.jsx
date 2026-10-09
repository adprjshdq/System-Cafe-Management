import React, { useState, useEffect } from 'react';
import { Clock, Store, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ title }) {
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
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
      </div>

      <div className="flex items-center space-x-6">
        <div className="hidden sm:flex items-center space-x-2 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{timeStr} WIB</span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-medium text-slate-600">Sistem Aktif</span>
        </div>

        <div className="h-6 w-px bg-slate-200"></div>

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
