import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Coffee,
  KeyRound,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Loader2,
  ShieldCheck,
  ShoppingBag,
  ChefHat,
  Package,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_HOME } from '../../config/access';

const CURRENT_YEAR = new Date().getFullYear();

const FEATURES = [
  {
    icon: ShoppingBag,
    title: 'Kasir & pembayaran cepat',
    description: 'Proses pesanan, cetak struk, dan tutup transaksi tanpa hambatan.',
  },
  {
    icon: ChefHat,
    title: 'Pesanan langsung ke dapur',
    description: 'Tiket masuk ke Kitchen Display secara real-time.',
  },
  {
    icon: Package,
    title: 'Stok menu terkontrol',
    description: 'Ketersediaan bahan dan menu terpantau otomatis.',
  },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const year = CURRENT_YEAR;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const res = await login(email.trim(), password);
      if (res?.success) {
        // Semua role memakai satu sumber tujuan yang sama dengan guard route.
        navigate(ROLE_HOME[res.user.role] || '/');
      }
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message ||
        err.message ||
        'Login gagal. Periksa kembali email dan kata sandi Anda.'
      );
    }
  };

  return (
    <div className="min-h-dvh bg-slate-100 lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* Panel brand (desktop) */}
      <section className="relative hidden overflow-hidden bg-slate-950 lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14">
        <div className="absolute inset-0" aria-hidden="true">
          <img
            src="/menu-images/caramel-macchiato.jpg"
            alt=""
            className="h-full w-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-950/50" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(192,135,97,0.22),transparent_48%)]" />
          <div className="absolute -bottom-32 -right-28 h-[26rem] w-[26rem] rounded-full border border-brand-400/15" />
          <div className="absolute -bottom-24 -right-20 h-80 w-80 rounded-full border border-brand-400/10" />
        </div>

        <div className="animate-auth-rise relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center">
            <img
              src="/aroma_cafe.png"
              alt="SIMCAFE Logo"
              className="h-11 w-11 object-contain"
            />
          </div>
          <div>
            <p className="text-sm font-bold tracking-wide text-white">Aroma Cafe</p>
            <p className="text-[11px] text-slate-400">Management System</p>
          </div>
        </div>

        <div className="animate-auth-rise relative z-10 max-w-md">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-400/30 bg-brand-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-300 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
            SIMCAFE
          </span>

          <h1 className="mt-5 text-3xl font-bold leading-[1.15] tracking-tight text-white xl:text-[2.6rem]">
            Sistem Informasi Management Cafe{' '}
            <span>Berbasis Web App</span>.
          </h1>

          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-300">
            Dari pesanan di meja hingga laporan harian — kasir, dapur, meja, dan stok
            terhubung dalam satu alur sistem kerja yang rapi.
          </p>

          <ul className="mt-8 space-y-3.5">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex items-start gap-3.5">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-brand-400/25 bg-brand-500/10 text-brand-300">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-white">{title}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 flex items-center justify-between gap-4 border-t border-white/10 pt-6 text-[11px] text-slate-400">
          <span>&copy; {year} Aroma Cafe</span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            Akses khusus staf
          </span>
        </div>
      </section>

      {/* Panel form */}
      <section className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10 sm:px-8">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-slate-200/70 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative w-full max-w-md">
          <div className="animate-auth-rise rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-9">
            {/* Brand ringkas (mobile) */}
            <div className="mb-7 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-700 text-white shadow-md shadow-brand-900/25">
                <Coffee className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Aroma Cafe</p>
                <p className="text-[11px] text-slate-400">Management System</p>
              </div>
            </div>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
              Masuk ke akun Anda
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
              Gunakan email dan kata sandi staf untuk melanjutkan ke dashboard operasional.
            </p>

            {errorMsg && (
              <div
                id="login-error"
                role="alert"
                aria-live="polite"
                className="mt-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs font-semibold leading-relaxed text-rose-700"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    inputMode="email"
                    autoCapitalize="none"
                    spellCheck="false"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    aria-invalid={errorMsg ? 'true' : undefined}
                    aria-describedby={errorMsg ? 'login-error' : undefined}
                    placeholder="nama@cafe.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-brand-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-600/10 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Kata sandi
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    aria-invalid={errorMsg ? 'true' : undefined}
                    aria-describedby={errorMsg ? 'login-error' : undefined}
                    placeholder="Masukkan kata sandi"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-12 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-brand-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-600/10 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    aria-pressed={showPassword}
                    className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#7B432D] py-3 text-sm font-bold text-white shadow-md shadow-[#7B432D]/25 transition-all hover:bg-[#653522] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B432D] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  <>
                    Masuk ke Dashboard
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-5 flex items-center justify-center gap-1.5 border-t border-slate-100 pt-4 text-[11px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              Sesi aman &amp; akses menyesuaikan peran pengguna
            </p>
          </div>

          <p className="mt-5 text-center text-[11px] text-slate-400 lg:hidden">
            &copy; {year} Aroma Cafe &middot; Sistem internal
          </p>
        </div>
      </section>
    </div>
  );
}
