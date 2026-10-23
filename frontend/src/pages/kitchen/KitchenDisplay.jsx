import React, { useState, useEffect } from 'react';
import { ChefHat, Clock, CheckCircle, Flame, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { formatDateTime } from '../../utils/formatters';

const initialSampleOrders = [
  {
    id: 101,
    order_number: 'INV-20261009-8812',
    customer_name: 'Bpk. Dimas',
    order_type: 'dine_in',
    status: 'pending',
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
    table: { table_number: 'Meja 03' },
    items: [
      { id: 1, name: 'Caramel Macchiato', quantity: 2, notes: 'Less sugar, Extra hot' },
      { id: 2, name: 'Crispy French Fries', quantity: 1, notes: 'Saus terpisah' },
    ],
  },
  {
    id: 102,
    order_number: 'INV-20261009-9134',
    customer_name: 'Ibu Sarah',
    order_type: 'takeaway',
    status: 'processing',
    created_at: new Date(Date.now() - 12 * 60000).toISOString(),
    table: null,
    items: [
      { id: 3, name: 'Matcha Latte', quantity: 1, notes: 'Oat milk' },
      { id: 4, name: 'Butter Croissant', quantity: 2, notes: 'Hangatkan' },
    ],
  },
  {
    id: 103,
    order_number: 'INV-20261009-7741',
    customer_name: 'Andi',
    order_type: 'dine_in',
    status: 'ready',
    created_at: new Date(Date.now() - 20 * 60000).toISOString(),
    table: { table_number: 'Meja 01' },
    items: [
      { id: 5, name: 'Iced Americano', quantity: 1, notes: null },
      { id: 6, name: 'Nasi Goreng Kampung', quantity: 1, notes: 'Pedas sedang' },
    ],
  },
];

export default function KitchenDisplay() {
  const [orders, setOrders] = useState(initialSampleOrders);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/v1/orders');
      if (res.data?.data?.data) {
        const active = res.data.data.data.filter((o) =>
          ['pending', 'processing', 'ready'].includes(o.status)
        );
        if (active.length > 0) {
          setOrders(active);
        }
      }
    } catch (e) {
      console.warn('API error, using sample kitchen orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000); // Polling antrean setiap 15 detik
    return () => clearInterval(interval);
  }, []);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/v1/orders/${orderId}/status`, { status: newStatus });
    } catch (e) {
      console.warn('Backend unavailable, updating local state:', e);
    }
    setOrders((prev) =>
      prev
        .map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        .filter((o) => (newStatus === 'completed' ? o.id !== orderId : true))
    );
  };

  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const processingOrders = orders.filter((o) => o.status === 'processing');
  const readyOrders = orders.filter((o) => o.status === 'ready');

  const renderCard = (order) => (
    <div
      key={order.id}
      className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3 transition-all hover:shadow-md"
    >
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div>
          <span className="text-[11px] font-mono font-bold text-slate-500">
            {order.order_number}
          </span>
          <h4 className="font-bold text-sm text-slate-800">{order.customer_name}</h4>
        </div>
        <div className="text-right">
          <span
            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${order.order_type === 'dine_in'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-blue-100 text-blue-800'
              }`}
          >
            {order.order_type === 'dine_in' ? order.table?.table_number || 'Dine-In' : 'Takeaway'}
          </span>
          <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-end gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatDateTime(order.created_at).slice(12)}</span>
          </p>
        </div>
      </div>

      {/* Item List */}
      <div className="space-y-2 py-1">
        {order.items?.map((it, idx) => (
          <div key={idx} className="bg-slate-50 p-2 rounded-xl text-xs">
            <div className="flex justify-between font-bold text-slate-800">
              <span>{it.name || it.menu?.name}</span>
              <span className="text-amber-600 font-extrabold text-sm">x{it.quantity}</span>
            </div>
            {it.notes && (
              <p className="text-[11px] text-rose-600 font-medium mt-1 bg-rose-50 px-2 py-0.5 rounded-md inline-block">
                Catatan: {it.notes}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="pt-2">
        {order.status === 'pending' && (
          <button
            onClick={() => updateOrderStatus(order.id, 'processing')}
            className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Flame className="w-4 h-4" />
            <span>Mulai Masak / Seduh</span>
          </button>
        )}
        {order.status === 'processing' && (
          <button
            onClick={() => updateOrderStatus(order.id, 'ready')}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Siap Disajikan</span>
          </button>
        )}
        {order.status === 'ready' && (
          <button
            onClick={() => updateOrderStatus(order.id, 'completed')}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Selesaikan Pesanan</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-amber-500" />
            <span>Kitchen Display System (KDS)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Layar interaktif antrean pesanan untuk barista kopi dan koki dapur.
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-2 self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Segarkan Antrean</span>
        </button>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Kolom 1: Pending */}
        <div className="bg-slate-100/80 rounded-2xl p-4 border border-slate-200">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span>
              <h3 className="font-bold text-sm text-slate-800">Pesanan Masuk</h3>
            </div>
            <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center">
              {pendingOrders.length}
            </span>
          </div>
          <div className="space-y-3">
            {pendingOrders.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">Tidak ada pesanan baru</p>
            ) : (
              pendingOrders.map(renderCard)
            )}
          </div>
        </div>

        {/* Kolom 2: Processing */}
        <div className="bg-slate-100/80 rounded-2xl p-4 border border-slate-200">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <h3 className="font-bold text-sm text-slate-800">Sedang Dimasak / Diseduh</h3>
            </div>
            <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center">
              {processingOrders.length}
            </span>
          </div>
          <div className="space-y-3">
            {processingOrders.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">Tidak ada proses memasak</p>
            ) : (
              processingOrders.map(renderCard)
            )}
          </div>
        </div>

        {/* Kolom 3: Ready to Serve */}
        <div className="bg-slate-100/80 rounded-2xl p-4 border border-slate-200">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <h3 className="font-bold text-sm text-slate-800">Siap Disajikan</h3>
            </div>
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
              {readyOrders.length}
            </span>
          </div>
          <div className="space-y-3">
            {readyOrders.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">Belum ada item siap saji</p>
            ) : (
              readyOrders.map(renderCard)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
