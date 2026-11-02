import React from 'react';
import {
  CheckCircle2,
  Edit2,
  Loader2,
  Package,
  Trash2,
  XCircle,
} from 'lucide-react';
import MenuThumbnail from '../../components/MenuThumbnail';
import { formatCurrency } from '../../utils/formatters';
import { getMargin, getStockState } from './menuUtils';

const STOCK_TONE = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-rose-200 bg-rose-50 text-rose-700',
  neutral: 'border-slate-200 bg-white/95 text-slate-600',
};

export default function MenuCard({ menu, categories, onEdit, onDelete, onToggle, toggling }) {
  const available = Boolean(menu.is_available);
  const stock = getStockState(menu);
  const margin = getMargin(menu);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <MenuThumbnail
          menu={menu}
          categories={categories}
          iconClassName="h-10 w-10 text-slate-300"
        />
        <div
          className={`absolute inset-0 ${
            available
              ? 'bg-gradient-to-t from-slate-950/50 via-slate-950/5 to-transparent'
              : 'bg-slate-950/55'
          }`}
          aria-hidden="true"
        />

        <span
          className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide shadow-sm ${
            available ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
          }`}
        >
          {available ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          {available ? 'Tersedia' : 'Habis'}
        </span>

        <span
          className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold shadow-sm backdrop-blur ${STOCK_TONE[stock.tone]}`}
        >
          <Package className="h-3 w-3" />
          {stock.label}
        </span>

        <span className="absolute bottom-3 left-3 inline-flex items-center rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">
          {menu.category?.name || 'Umum'}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 text-sm font-bold text-slate-900" title={menu.name}>
            {menu.name}
          </h3>
          <span
            className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-extrabold ${
              margin.percent >= 50
                ? 'bg-emerald-50 text-emerald-700'
                : margin.percent >= 25
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-rose-50 text-rose-700'
            }`}
            title={`Margin ${margin.percent}%`}
          >
            +{margin.percent}%
          </span>
        </div>

        <p className="mt-1 line-clamp-2 min-h-10 text-xs leading-relaxed text-slate-500">
          {menu.description || 'Belum ada deskripsi menu.'}
        </p>

        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            <p className="text-lg font-extrabold leading-none text-slate-900">
              {formatCurrency(menu.price)}
            </p>
            <p className="mt-1 text-[10px] text-slate-400">
              HPP {formatCurrency(menu.cost_price || 0)}
            </p>
          </div>
          <p className="text-right text-[11px] font-bold text-emerald-700">
            +{formatCurrency(margin.margin)}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => onToggle(menu)}
            disabled={Boolean(toggling)}
            aria-pressed={available}
            aria-label={`Ubah ketersediaan ${menu.name}`}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-bold transition-colors disabled:cursor-wait disabled:opacity-70 ${
              available
                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            {toggling ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : available ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <XCircle className="h-3.5 w-3.5" />
            )}
            {available ? 'Tersedia' : 'Habis'}
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onEdit(menu)}
              aria-label={`Edit ${menu.name}`}
              title="Edit menu"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(menu)}
              aria-label={`Hapus ${menu.name}`}
              title="Hapus menu"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-rose-600 transition-colors hover:border-rose-200 hover:bg-rose-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
