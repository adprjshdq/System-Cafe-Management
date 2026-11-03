import React from 'react';
import { Plus, ShoppingBag } from 'lucide-react';
import MenuThumbnail from '../../components/MenuThumbnail';
import { formatCurrency } from '../../utils/formatters';
import { getMenuStatus, STATUS_TONE_CLASSES } from './posUtils';

export default function ProductCard({ menu, categories = [], quantityInCart = 0, onAdd }) {
  const status = getMenuStatus(menu);
  const categoryName =
    menu.category?.name ||
    categories.find((cat) => String(cat.id) === String(menu.category_id))?.name ||
    'Menu';

  return (
    <button
      type="button"
      onClick={() => {
        if (!status.disabled) onAdd(menu);
      }}
      aria-disabled={status.disabled}
      aria-label={`${menu.name}, ${formatCurrency(menu.price)}. ${status.label}.${
        status.disabled ? '' : ' Tekan Enter untuk menambah ke keranjang.'
      }`}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 ${
        status.disabled
          ? 'cursor-not-allowed border-slate-200 opacity-70'
          : 'cursor-pointer border-slate-200 hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-lg hover:shadow-brand-500/5'
      }`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <MenuThumbnail
          menu={menu}
          categories={categories}
          iconClassName="w-10 h-10 text-slate-300"
        />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-bold shadow-xs backdrop-blur ${
              STATUS_TONE_CLASSES[status.tone]
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {status.label}
          </span>

          {quantityInCart > 0 && !status.disabled && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-700 px-2 py-1 text-[10px] font-bold text-white shadow-xs">
              <ShoppingBag className="h-3 w-3" />
              {quantityInCart}
            </span>
          )}
        </div>

        {status.disabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
            <span className="rounded-full bg-slate-900/90 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
              {status.stock === 0 ? 'Stok Habis' : 'Tidak Tersedia'}
            </span>
          </div>
        )}

        {!status.disabled && (
          <span className="absolute bottom-2.5 right-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-white shadow-md transition-transform group-hover:scale-105 group-active:scale-95">
            <Plus className="h-4 w-4" />
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <div className="flex items-start justify-between gap-2">
          <span className="block text-[15px] font-bold leading-snug text-slate-800 line-clamp-1 group-hover:text-brand-700">
            {menu.name}
          </span>
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
            {categoryName}
          </span>
        </div>

        <p className="mt-1 text-xs leading-relaxed text-slate-400 line-clamp-2">
          {menu.description || 'Pilihan menu lezat'}
        </p>

        <div className="mt-auto flex items-end justify-between pt-3">
          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            {formatCurrency(menu.price)}
          </span>
          {status.stock !== null && status.stock > 0 && status.stock <= 5 && (
            <span className="text-[11px] font-semibold text-brand-700">
              Tinggal {status.stock} lagi
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
