import React from 'react';
import { Armchair, Clock, Receipt, Users } from 'lucide-react';
import {
  TABLE_STATUS,
  formatDuration,
  getActiveOrders,
  getElapsedSeconds,
  getOccupiedSince,
} from './tableUtils';

function ChairRow({ count, tone }) {
  if (count <= 0) return null;

  return (
    <span className="flex items-end justify-center gap-1.5 py-1" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <span key={index} className={`h-1.5 w-5 rounded-full ${tone}`} />
      ))}
    </span>
  );
}

export default function TableTile({ table, selected, now, onSelect, className = '' }) {
  const meta = TABLE_STATUS[table.status] || TABLE_STATUS.available;
  const activeOrders = getActiveOrders(table);
  const elapsed = getElapsedSeconds(getOccupiedSince(table), now);
  const capacity = Math.max(0, Number(table.capacity) || 0);
  const seatCount = Math.min(capacity, 8);

  const durationLabel =
    table.status === 'occupied'
      ? elapsed !== null
        ? formatDuration(elapsed)
        : 'Tanpa pesanan'
      : table.status === 'reserved'
        ? 'Menunggu tamu'
        : 'Siap dipakai';

  const detailLabel =
    activeOrders.length > 0
      ? `${activeOrders.length} pesanan`
      : 'Klik detail';

  return (
    <button
      type="button"
      onClick={() => onSelect(table)}
      aria-pressed={selected}
      aria-label={`${table.table_number}, ${meta.label}, kapasitas ${capacity} kursi, ${durationLabel}. Buka detail meja.`}
      className={`group block w-full rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${meta.focus} ${className}`}
    >
      <ChairRow count={Math.ceil(seatCount / 2)} tone={meta.chair} />

      <span
        className={`relative block rounded-2xl border-2 p-3 transition-all ${meta.tile} ${
          selected
            ? 'ring-2 ring-brand-700 ring-offset-2 ring-offset-white'
            : 'hover:-translate-y-0.5 hover:shadow-md'
        }`}
      >
        <span className="flex items-start justify-between gap-2">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-lg bg-white/80 shadow-sm ${meta.text}`}
          >
            <Armchair className="h-4 w-4" />
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${meta.badge}`}
          >
            {table.status === 'occupied' && (
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            )}
            {meta.label}
          </span>
        </span>

        <span className="mt-2 block truncate text-sm font-extrabold text-slate-900">
          {table.table_number}
        </span>
        <span
          className={`mt-0.5 flex items-center gap-1 text-[10px] font-semibold ${meta.text}`}
        >
          <Users className="h-3 w-3" />
          {capacity} kursi
        </span>

        <span className="mt-2.5 flex items-center justify-between gap-2 border-t border-black/5 pt-2">
          <span className="inline-flex min-w-0 items-center gap-1 font-mono text-[11px] font-bold text-slate-700">
            <Clock className="h-3 w-3 shrink-0" />
            <span className="truncate">{durationLabel}</span>
          </span>
          <span className={`inline-flex shrink-0 items-center gap-1 text-[9px] font-bold ${meta.text}`}>
            {activeOrders.length > 0 && <Receipt className="h-3 w-3" />}
            {detailLabel}
          </span>
        </span>
      </span>

      <ChairRow count={Math.floor(seatCount / 2)} tone={meta.chair} />
    </button>
  );
}
