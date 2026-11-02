import React from 'react';
import {
  Armchair,
  CalendarClock,
  CheckCircle2,
  Clock,
  Loader2,
  Receipt,
  Users,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';
import {
  AREA_META,
  ORDER_STATUS,
  TABLE_STATUS,
  formatDuration,
  getActiveOrders,
  getElapsedSeconds,
  getOccupiedSince,
  getTableArea,
  humanizeDuration,
} from './tableUtils';

const STATUS_ACTIONS = [
  { value: 'available', label: 'Kosong', icon: CheckCircle2 },
  { value: 'occupied', label: 'Terisi', icon: Users },
  { value: 'reserved', label: 'Booking', icon: CalendarClock },
];

function formatClock(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export default function TableDetailPanel({
  table,
  order,
  loadingOrder = false,
  now,
  updatingStatus = null,
  onStatusChange,
  onClose,
  className = '',
}) {
  const meta = TABLE_STATUS[table.status] || TABLE_STATUS.available;
  const area = AREA_META[getTableArea(table)];
  const activeOrders = getActiveOrders(table);
  const elapsed = getElapsedSeconds(getOccupiedSince(table), now);
  const capacity = Number(table.capacity) || 0;
  const orderStatus = ORDER_STATUS[order?.status] || ORDER_STATUS.pending;

  const timerCaption =
    table.status === 'occupied'
      ? elapsed !== null
        ? `Durasi pemakaian · ${humanizeDuration(elapsed)}`
        : 'Durasi belum tersedia karena tidak ada pesanan aktif'
      : table.status === 'reserved'
        ? 'Menunggu tamu reservasi'
        : 'Meja siap digunakan';

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs ${className}`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-4">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-slate-500">
            <Armchair className="h-2.5 w-2.5" />
            Area {area.label}
          </span>
          <h3 className="mt-1.5 truncate text-lg font-extrabold text-slate-900">
            {table.table_number}
          </h3>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
            <Users className="h-3 w-3" />
            Kapasitas {capacity} kursi
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail meja"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div
        className={`mx-4 mt-4 rounded-2xl bg-gradient-to-br p-4 ${meta.hero} ${meta.heroText}`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider">
            <span className={`h-1.5 w-1.5 rounded-full ${table.status === 'occupied' ? 'animate-pulse bg-white' : 'bg-current'}`} />
            {meta.label}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
            <Users className="h-3 w-3" />
            {capacity} kursi
          </span>
        </div>

        <p className="mt-3 font-mono text-3xl font-extrabold tabular-nums">
          {table.status === 'occupied' ? formatDuration(elapsed) : '--:--'}
        </p>
        <p className={`text-[10px] font-semibold leading-relaxed ${meta.heroMuted}`}>
          {timerCaption}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
          <span className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-0.5">
            <Receipt className="h-3 w-3" />
            {activeOrders.length} pesanan aktif
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-0.5">
            <Clock className="h-3 w-3" />
            {table.status === 'occupied' ? 'Live timer' : 'Belum berjalan'}
          </span>
        </div>
      </div>

      <div className="mx-4 mt-3 grid grid-cols-3 gap-1.5">
        {STATUS_ACTIONS.map(({ value, label, icon: Icon }) => {
          const isActive = table.status === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onStatusChange(table, value)}
              disabled={isActive || Boolean(updatingStatus)}
              aria-pressed={isActive}
              className={`inline-flex items-center justify-center gap-1 rounded-xl border px-2 py-2 text-[10px] font-extrabold transition-colors disabled:cursor-default ${
                isActive
                  ? TABLE_STATUS[value].activeButton
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-60'
              }`}
            >
              {updatingStatus === value ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Icon className="h-3.5 w-3.5" />
              )}
              {label}
            </button>
          );
        })}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Detail Pesanan
          </h4>
          {loadingOrder && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
          {!loadingOrder && activeOrders.length > 1 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500">
              +{activeOrders.length - 1} pesanan lain
            </span>
          )}
        </div>

        {loadingOrder ? (
          <div className="mt-2.5 space-y-2 rounded-xl border border-slate-200 p-3">
            <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
            <div className="h-10 w-full animate-pulse rounded bg-slate-100" />
          </div>
        ) : order ? (
          <div className="mt-2.5 overflow-hidden rounded-xl border border-slate-200">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2">
              <span className="truncate font-mono text-[10px] font-bold text-slate-600">
                {order.order_number}
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-extrabold ${orderStatus.className}`}
              >
                {orderStatus.label}
              </span>
            </div>

            <div className="px-3 py-2.5">
              <p className="text-xs font-bold text-slate-900">
                {order.customer_name || 'Pelanggan Walk-In'}
              </p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Masuk {formatClock(order.created_at)}
                </span>
                <span>·</span>
                <span>{order.order_type === 'takeaway' ? 'Takeaway' : 'Dine-In'}</span>
              </p>

              {Array.isArray(order.items) && order.items.length > 0 && (
                <div className="mt-2.5 space-y-1 border-t border-slate-100 pt-2">
                  {order.items.map((item, index) => (
                    <div key={item.id || index} className="flex items-start gap-2 text-[11px]">
                      <span className="shrink-0 rounded bg-amber-100 px-1 py-0.5 text-[9px] font-extrabold text-amber-800">
                        {item.quantity}x
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-700">
                          {item.menu?.name || item.name || 'Menu'}
                        </p>
                        {item.notes && (
                          <p className="text-[9px] font-medium text-rose-600">
                            Catatan: {item.notes}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-[10px] font-semibold text-slate-500">
                        {formatCurrency(item.subtotal || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Total
                </span>
                <span className="text-sm font-extrabold text-slate-900">
                  {formatCurrency(order.total_amount || 0)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-2.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-3 py-5 text-center">
            <Receipt className="mx-auto h-5 w-5 text-slate-300" />
            <p className="mt-1.5 text-[11px] font-semibold text-slate-600">
              {table.status === 'occupied'
                ? 'Tidak ada pesanan aktif tercatat'
                : table.status === 'reserved'
                  ? 'Meja menunggu tamu reservasi'
                  : 'Meja kosong dan siap digunakan'}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-400">
              Pesanan baru dari kasir akan tampil di sini.
            </p>
            <Link
              to="/pos"
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-[10px] font-bold text-white transition-colors hover:bg-slate-800"
            >
              <Receipt className="h-3 w-3" />
              Buka Kasir POS
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
