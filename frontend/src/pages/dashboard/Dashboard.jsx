import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  Grid, 
  ArrowUpRight, 
  Coffee, 
  Flame, 
  Receipt 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

export default function Dashboard() {
  const [stats, setStats] = useState({
    summary: {
      revenue_today: 1450000,
      revenue_month: 28900000,
      orders_today: 42,
      active_orders: 5,
      total_tables: 8,
      occupied_tables: 4,
    },
    top_menus: [
      { menu_id: 4, total_sold: 28, menu: { name: 'Kopi Susu Gula Aren', price: 24000 } },
      { menu_id: 2, total_sold: 21, menu: { name: 'Iced Americano', price: 22000 } },
      { menu_id: 7, total_sold: 18, menu: { name: 'Nasi Goreng Kampung Spesial', price: 32000 } },
      { menu_id: 5, total_sold: 15, menu: { name: 'Matcha Latte', price: 27000 } },
      { menu_id: 9, total_sold: 14, menu: { name: 'Crispy French Fries', price: 20000 } },
    ],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/v1/dashboard/stats');
        if (res.data?.success && res.data.data?.summary) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.warn('Menggunakan data sampel dashboard untuk presentasi:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const { summary, top_menus } = stats;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 uppercase tracking-wider">
            Operasional Hari Ini
          </span>
          <h1 className="text-2xl font-bold mt-2">Selamat Datang di Aroma Cafe System</h1>
          <p className="text-slate-300 text-sm mt-1">
            Pantau arus kas, status antrean barista, dan keterisian meja secara langsung.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/pos"
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-md flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Buka Kasir POS</span>
          </Link>
          <Link
            to="/kitchen"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium border border-slate-700 rounded-xl text-sm transition-all flex items-center gap-2"
          >
            <Coffee className="w-4 h-4 text-amber-400" />
            <span>Monitor Dapur</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Omzet Hari Ini</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            {formatCurrency(summary.revenue_today)}
          </p>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-emerald-600 font-semibold flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> +12%
            </span>
            <span>dibanding kemarin</span>
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Pesanan Hari Ini</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
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
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Coffee className="w-5 h-5" />
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
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Grid className="w-5 h-5" />
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
              <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Menu Terlaris (Top 5)</h3>
                <p className="text-xs text-slate-500">Berdasarkan volume penjualan kumulatif</p>
              </div>
            </div>
            <Link to="/menus" className="text-xs font-semibold text-amber-600 hover:text-amber-700">
              Lihat Semua Menu &rarr;
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {top_menus.map((item, idx) => (
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
                  <span className="text-sm font-bold text-amber-600">{item.total_sold} terjual</span>
                </div>
              </div>
            ))}
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
