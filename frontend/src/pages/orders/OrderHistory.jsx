import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Eye,
  Printer,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import DataStateNotice from '../../components/DataStateNotice';
import ConfirmDialog from '../menus/ConfirmDialog';

export default function OrderHistory() {
  const { role } = useAuth();
  const canDelete = role === 'admin';

  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/v1/orders');
      const list = res.data?.data?.data;
      setOrders(Array.isArray(list) ? list : []);
      setLoadError('');
    } catch (e) {
      console.error('Gagal memuat riwayat transaksi:', e);
      setOrders([]);
      setLoadError(
        e.response?.data?.message ||
          'Server tidak dapat dihubungi. Riwayat transaksi dikosongkan sampai data berhasil dimuat.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (type, message) => setToast({ type, message });

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;

    setDeleting(true);
    try {
      await api.delete(`/v1/orders/${deleteTarget.id}`);
      setOrders((prev) => prev.filter((order) => order.id !== deleteTarget.id));
      if (selectedOrder?.id === deleteTarget.id) setSelectedOrder(null);
      showToast('success', `Pesanan ${deleteTarget.order_number} berhasil dihapus.`);
      setDeleteTarget(null);
    } catch (e) {
      console.error('Gagal menghapus pesanan:', e);
      showToast(
        'error',
        e.response?.data?.message ||
          'Server tidak dapat dihubungi. Pesanan belum dihapus, silakan coba lagi.'
      );
    } finally {
      setDeleting(false);
    }
  };

  const filtered = orders.filter(
    (o) =>
      (o.order_number || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.customer_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <img
              src="/icon_riwayat.png"
              alt="Icon Riwayat Transaksi"
              className="h-7 w-7 object-contain"
            />
            <span>Riwayat Transaksi & Struk</span>
          </h2>
          <p className="text-xs text-slate-500">Daftar rekaman pesanan, detail transaksi, dan cetak ulang struk kasir.</p>
        </div>
      </div>

      {loadError && (
        <DataStateNotice
          title="Riwayat transaksi gagal dimuat"
          message={loadError}
          onRetry={fetchOrders}
          retrying={loading}
        />
      )}

      {toast && (
        <div
          role={toast.type === 'error' ? 'alert' : 'status'}
          className={`fixed top-20 right-6 z-[80] flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-xl animate-fade-in ${
            toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="h-5 w-5 shrink-0" />
          ) : (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari invoice atau nama pelanggan..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-amber-500"
          />
        </div>
        <div className="text-xs text-slate-500">
          Total: <strong className="text-slate-800">{filtered.length}</strong> transaksi
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="p-4">No. Invoice</th>
                <th className="p-4">Waktu</th>
                <th className="p-4">Pelanggan</th>
                <th className="p-4">Tipe / Meja</th>
                <th className="p-4">Total</th>
                <th className="p-4">Pembayaran</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center">
                    <ClipboardList className="mx-auto mb-2 h-9 w-9 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-600">
                      {orders.length === 0
                        ? 'Belum ada transaksi tercatat'
                        : 'Tidak ada transaksi yang cocok'}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {orders.length === 0
                        ? 'Riwayat akan muncul setelah ada pesanan yang dibuat.'
                        : 'Coba kata kunci lain atau kosongkan pencarian.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4 font-mono font-bold text-slate-900">{order.order_number}</td>
                  <td className="p-4 text-slate-500">{formatDateTime(order.created_at)}</td>
                  <td className="p-4 font-semibold text-slate-800">{order.customer_name}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-[11px] text-slate-700">
                      {order.order_type === 'dine_in' ? order.table?.table_number || 'Dine-In' : 'Takeaway'}
                    </span>
                  </td>
                  <td className="p-4 font-extrabold text-slate-900">{formatCurrency(order.total_amount)}</td>
                  <td className="p-4 uppercase font-semibold text-slate-600 text-[11px]">
                    {order.payment?.payment_method || 'Belum Lunas'}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${order.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : order.status === 'processing'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                        }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detail & Struk</span>
                      </button>

                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(order)}
                          aria-label={`Hapus pesanan ${order.order_number}`}
                          title="Hapus pesanan"
                          className="px-2.5 py-1.5 border border-rose-200 hover:bg-rose-50 rounded-lg text-rose-600 text-xs font-semibold inline-flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail / Struk */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl font-mono text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-dashed border-slate-300 font-sans">
              <h3 className="font-bold text-slate-800 text-sm">Rincian Struk Transaksi</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-3 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <p>Invoice: {selectedOrder.order_number}</p>
              <p>Waktu: {formatDateTime(selectedOrder.created_at)}</p>
              <p>Pelanggan: {selectedOrder.customer_name}</p>
              <p>Tipe: {selectedOrder.order_type === 'dine_in' ? 'DINE-IN' : 'TAKEAWAY'}</p>
            </div>

            <div className="py-3 border-b border-dashed border-slate-300 space-y-2">
              {selectedOrder.items?.map((it, idx) => (
                <div key={idx} className="flex justify-between text-[11px]">
                  <span>
                    {it.name || it.menu?.name} x{it.quantity}
                  </span>
                  <span>{formatCurrency(it.subtotal || it.price * it.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="py-3 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(selectedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Pajak (10%):</span>
                <span>{formatCurrency(selectedOrder.tax_amount)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 text-sm pt-1">
                <span>TOTAL:</span>
                <span>{formatCurrency(selectedOrder.total_amount)}</span>
              </div>
            </div>

            <div className="mt-4 flex gap-2 font-sans">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-800"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak</span>
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Hapus pesanan ini?"
          description={
            ['pending', 'processing', 'ready'].includes(deleteTarget.status)
              ? `Pesanan ${deleteTarget.order_number} akan dihapus permanen. Stok menu dikembalikan dan meja dibebaskan bila tidak ada pesanan aktif lain. Tindakan ini tidak dapat dibatalkan.`
              : `Pesanan ${deleteTarget.order_number} akan dihapus permanen beserta rincian item dan pembayarannya. Tindakan ini tidak dapat dibatalkan.`
          }
          confirmLabel="Hapus Pesanan"
          loading={deleting}
          onCancel={() => {
            if (!deleting) setDeleteTarget(null);
          }}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
