import React, { useState, useEffect } from 'react';
import { ClipboardList, Search, Printer, Eye, X, CheckCircle, Clock } from 'lucide-react';
import api from '../../services/api';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const sampleOrders = [
  {
    id: 1,
    order_number: 'INV-20261009-1001',
    customer_name: 'Bpk. Hendra',
    order_type: 'dine_in',
    status: 'completed',
    subtotal: 50000,
    tax_amount: 5000,
    total_amount: 55000,
    created_at: new Date(Date.now() - 45 * 60000).toISOString(),
    table: { table_number: 'Meja 02' },
    payment: { payment_method: 'qris', amount_paid: 55000, change_amount: 0 },
    items: [
      { name: 'Kopi Susu Gula Aren', quantity: 1, price: 24000, subtotal: 24000 },
      { name: 'Signature Chocolate', quantity: 1, price: 26000, subtotal: 26000 },
    ],
  },
  {
    id: 2,
    order_number: 'INV-20261009-1002',
    customer_name: 'Alisa Putri',
    order_type: 'takeaway',
    status: 'completed',
    subtotal: 44000,
    tax_amount: 4400,
    total_amount: 48400,
    created_at: new Date(Date.now() - 30 * 60000).toISOString(),
    table: null,
    payment: { payment_method: 'cash', amount_paid: 50000, change_amount: 1600 },
    items: [
      { name: 'Iced Americano', quantity: 2, price: 22000, subtotal: 44000 },
    ],
  },
  {
    id: 3,
    order_number: 'INV-20261009-1003',
    customer_name: 'Reza Fauzi',
    order_type: 'dine_in',
    status: 'processing',
    subtotal: 60000,
    tax_amount: 6000,
    total_amount: 66000,
    created_at: new Date(Date.now() - 15 * 60000).toISOString(),
    table: { table_number: 'Meja 05' },
    payment: { payment_method: 'transfer', amount_paid: 66000, change_amount: 0 },
    items: [
      { name: 'Spaghetti Carbonara', quantity: 1, price: 38000, subtotal: 38000 },
      { name: 'Caramel Macchiato', quantity: 1, price: 28000, subtotal: 28000 },
    ],
  },
];

export default function OrderHistory() {
  const [orders, setOrders] = useState(sampleOrders);
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/v1/orders');
        if (res.data?.data?.data?.length) {
          setOrders(res.data.data.data);
        }
      } catch (e) {
        console.warn('API error, using sample orders:', e);
      }
    };
    fetchOrders();
  }, []);

  const filtered = orders.filter(
    (o) =>
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-amber-500" />
            <span>Riwayat Transaksi & Struk</span>
          </h2>
          <p className="text-xs text-slate-500">Daftar rekaman pesanan, detail transaksi, dan cetak ulang struk kasir.</p>
        </div>
      </div>

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
              {filtered.map((order) => (
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
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Detail & Struk</span>
                    </button>
                  </td>
                </tr>
              ))}
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
    </div>
  );
}
