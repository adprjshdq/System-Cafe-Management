import React, { useCallback, useEffect, useState } from 'react';
import { ShoppingBag, Coffee, Receipt } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import DataStateNotice from '../../components/DataStateNotice';

const EMPTY_STATS = {
  summary: {
    revenue_today: 0,
    revenue_month: 0,
    orders_today: 0,
    active_orders: 0,
    total_tables: 0,
    occupied_tables: 0,
  },
  top_menus: [],
};

export default function Dashboard() {
  const [stats, setStats] = useState(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/v1/dashboard/stats');
      if (res.data?.success && res.data.data?.summary) {
        setStats({
          summary: res.data.data.summary,
          top_menus: Array.isArray(res.data.data.top_menus) ? res.data.data.top_menus : [],
        });
        setError('');
      } else {
        setStats(EMPTY_STATS);
        setError('Respons server tidak berisi data ringkasan.');
      }
    } catch (err) {
      console.error('Gagal memuat statistik dashboard:', err);
      setStats(EMPTY_STATS);
      setError(
        err.response?.data?.message ||
          'Server tidak dapat dihubungi. Angka ditampilkan 0 sampai data berhasil dimuat.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const { summary, top_menus } = stats;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#783F24] text-white uppercase tracking-wider">
            Operasional Hari Ini
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">Selamat Datang di Aroma Cafe</h1>
          <p className="text-slate-500 text-sm mt-1">
            Pantau arus kas, status antrean barista, dan keterisian meja secara langsung.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/pos"
            className="px-4 py-2.5 bg-brand-700 hover:bg-brand-600 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-brand-900/20 flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Buka Kasir POS</span>
          </Link>
          <Link
            to="/kitchen"
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-medium border border-slate-200 rounded-xl text-sm transition-all flex items-center gap-2"
          >
            <Coffee className="w-4 h-4 text-brand-700" />
            <span>Monitor Dapur</span>
          </Link>
        </div>
      </div>

      {error && (
        <DataStateNotice
          title="Statistik dashboard gagal dimuat"
          message={error}
          onRetry={fetchStats}
          retrying={loading}
        />
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Omzet Hari Ini</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl">
              <img
                src="/icon_omzet.png"
                alt="Icon Omzet"
                className="h-7 w-7 object-contain"
              />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            {formatCurrency(summary.revenue_today)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Akumulasi pembayaran lunas hari ini
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Pesanan Hari Ini</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl">
              <img
                src="/pesanan.png"
                alt="Icon Pesanan"
                className="h-7 w-7 object-contain"
              />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            {summary.orders_today} <span className="text-sm font-normal text-slate-500">transaksi</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Total pesanan masuk kasir
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Antrean Dapur</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl">
              <img
                src="/antrean_kopi.png"
                alt="Icon antrean dapur"
                className="h-7 w-7 object-contain"
              />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            {summary.active_orders} <span className="text-sm font-normal text-slate-500">antrean</span>
          </p>
          <p className="text-xs text-rose-600 font-medium mt-1">
            Sedang disiapkan barista/koki
          </p>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Keterisian Meja</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl">
              <img
                src="/denah_meja.png"
                alt="Icon ketesediaan meja"
                className="h-7 w-7 object-contain"
              />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            {summary.occupied_tables} / {summary.total_tables} <span className="text-sm font-normal text-slate-500">meja</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {Math.round((summary.occupied_tables / (summary.total_tables || 1)) * 100)}% kapasitas terpakai
          </p>
        </div>
      </div>

      {/* Grid Content: Best Sellers & Quick Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 5 Best Sellers */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg flex items-center justify-center">
                <img
                  src="/api_top.png"
                  alt="Menu Terlaris"
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Menu Terlaris (Top 5)</h3>
                <p className="text-xs text-slate-500">Berdasarkan volume penjualan kumulatif</p>
              </div>
            </div>
            <Link to="/menus" className="text-xs font-semibold text-[#8B4513] hover:text-[#654321]">
              Lihat Semua Menu &rarr;
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {top_menus.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 px-6 py-10 text-center">
                <p className="text-sm font-bold text-slate-700">Belum ada penjualan</p>
                <p className="max-w-xs text-xs text-slate-500">
                  Menu terlaris akan muncul setelah ada transaksi yang tercatat.
                </p>
              </div>
            ) : (
              top_menus.map((item, idx) => (
              <div key={item.menu_id || idx} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{item.menu?.name || 'Item Menu'}</p>
                    <p className="text-xs text-slate-400">{formatCurrency(item.menu?.price)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-[#8B4513]">{item.total_sold} terjual</span>
                </div>
              </div>
            ))
            )}
          </div>
        </div>

        {/* Quick Operations Info */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 mb-1">Status Shift Kasir</h3>
            <p className="text-xs text-slate-500 mb-4">Informasi operasional toko saat ini</p>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">Metode Pembayaran</span>
                <span className="text-xs font-bold text-slate-800">Tunai, QRIS, Bank</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">Pajak Restoran</span>
                <span className="text-xs font-bold text-slate-800">PPN 10% Aktif</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">Omzet Bulan Berjalan</span>
                <span className="text-xs font-bold text-emerald-600">{formatCurrency(summary.revenue_month)}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link
              to="/orders"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Receipt className="w-4 h-4" />
              <span>Cek Laporan & Riwayat Struk</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
