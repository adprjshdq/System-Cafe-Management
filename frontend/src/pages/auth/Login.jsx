import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, KeyRound, Mail, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('admin@cafe.com');
  const [password, setPassword] = useState('password123');
  const [errorMsg, setErrorMsg] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await login(email, password);
      if (res?.success) {
        if (res.user.role === 'kitchen') {
          navigate('/kitchen');
        } else if (res.user.role === 'cashier') {
          navigate('/pos');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Login gagal. Periksa kembali email dan password.');
    }
  };

  const handleQuickLogin = (roleEmail) => {
    setEmail(roleEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700/80 rounded-2xl shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20 text-slate-950">
            <Coffee className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Aroma Cafe Management</h1>
          <p className="text-sm text-slate-400 mt-1">Sistem Kasir & Operasional Terpadu</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-3 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Email Pengguna
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@cafe.com"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 text-sm flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Memverifikasi...' : 'Masuk ke Sistem'}</span>
          </button>
        </form>

        {/* Quick Demo Login Preset for Reviewer / Examiner */}
        <div className="mt-8 pt-6 border-t border-slate-700/60">
          <div className="flex items-center space-x-2 text-xs font-semibold text-amber-400 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Preset Uji Coba Cepat (Tugas / Portofolio):</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@cafe.com')}
              className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-left border border-slate-600/50 transition-colors"
            >
              <p className="font-semibold text-amber-300">Admin</p>
              <p className="text-[10px] text-slate-400 truncate">admin@cafe.com</p>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('kasir@cafe.com')}
              className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-left border border-slate-600/50 transition-colors"
            >
              <p className="font-semibold text-emerald-300">Kasir</p>
              <p className="text-[10px] text-slate-400 truncate">kasir@cafe.com</p>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('dapur@cafe.com')}
              className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-left border border-slate-600/50 transition-colors"
            >
              <p className="font-semibold text-sky-300">Dapur / Barista</p>
              <p className="text-[10px] text-slate-400 truncate">dapur@cafe.com</p>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('pelayan@cafe.com')}
              className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-left border border-slate-600/50 transition-colors"
            >
              <p className="font-semibold text-purple-300">Pelayan</p>
              <p className="text-[10px] text-slate-400 truncate">pelayan@cafe.com</p>
            </button>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 text-center">Password demo default: <code className="text-slate-400">password123</code></p>
        </div>
      </div>
    </div>
  );
}
