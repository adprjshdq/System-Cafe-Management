import React from 'react';
import {
  ShoppingBag,
  Minus,
  Plus,
  Trash2,
  Maximize2,
  Minimize2,
  X,
  UtensilsCrossed,
  Package,
  ReceiptText,
  Send,
} from 'lucide-react';
import MenuThumbnail from '../../components/MenuThumbnail';
import { formatCurrency } from '../../utils/formatters';

export default function CartPanel({
  cartItems,
  categories = [],
  subtotal,
  taxAmount,
  totalAmount,
  orderType,
  setOrderType,
  selectedTable,
  setSelectedTable,
  tables = [],
  customerName,
  setCustomerName,
  onUpdateQuantity,
  onUpdateNotes,
  onRemove,
  onClear,
  onCheckout,
  isExpanded = false,
  onToggleExpand,
  showExpandToggle = false,
  onClose,
  isWaiter = false,
}) {
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <img
              src="/icon_keranjang.png"
              alt="Keranjang Pesanan"
              className="h-6 w-6 object-contain"
            />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-slate-900">
              {isWaiter ? 'Pesanan Meja' : 'Keranjang Pesanan'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {isWaiter
                ? itemCount > 0
                  ? `${itemCount} item · kirim ke dapur`
                  : 'Pilih menu lalu tentukan meja'
                : itemCount > 0
                  ? `${itemCount} item dipilih`
                  : 'Belum ada item'}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {cartItems.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="rounded-lg px-2 py-1 text-[11px] font-semibold text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
            >
              Kosongkan
            </button>
          )}

          {showExpandToggle && (
            <button
              type="button"
              onClick={onToggleExpand}
              aria-label={isExpanded ? 'Ciutkan panel keranjang' : 'Perluas panel keranjang'}
              aria-pressed={isExpanded}
              title={isExpanded ? 'Ciutkan panel' : 'Perluas panel'}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup keranjang"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable content: order settings + items */}
      <div className="min-h-0 flex-1 overflow-y-auto py-3">
        <div className="space-y-2.5 border-b border-slate-100 pb-3">
          {isWaiter ? (
            <div className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-[11px] font-bold text-brand-800">
              <UtensilsCrossed className="h-4 w-4 shrink-0" />
              Pesanan Dine-In · wajib pilih meja
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOrderType('dine_in')}
                aria-pressed={orderType === 'dine_in'}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${orderType === 'dine_in'
                    ? 'bg-brand-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                <UtensilsCrossed className="h-3.5 w-3.5" />
                Dine-In
              </button>
              <button
                type="button"
                onClick={() => {
                  setOrderType('takeaway');
                  setSelectedTable(null);
                }}
                aria-pressed={orderType === 'takeaway'}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${orderType === 'takeaway'
                    ? 'bg-brand-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                <Package className="h-3.5 w-3.5" />
                Takeaway
              </button>
            </div>
          )}

          <div className="space-y-2">
            <input
              type="text"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="Nama pelanggan (opsional)"
              aria-label="Nama pelanggan"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs transition-colors focus:border-brand-600 focus:bg-white focus:outline-none"
            />

            {(isWaiter || orderType === 'dine_in') && (
              <select
                value={selectedTable?.id || ''}
                onChange={(event) => {
                  const table = tables.find((item) => String(item.id) === event.target.value);
                  setSelectedTable(table || null);
                }}
                aria-label="Pilih meja"
                className={`w-full rounded-xl border bg-slate-50 px-3 py-2 text-xs font-semibold transition-colors focus:bg-white focus:outline-none ${isWaiter && !selectedTable
                    ? 'border-brand-300 focus:border-brand-600'
                    : 'border-slate-200 focus:border-brand-600'
                  }`}
              >
                <option value="">{isWaiter ? 'Pilih meja (wajib)' : 'Pilih meja (opsional)'}</option>
                {tables.map((table) => (
                  <option
                    key={table.id}
                    value={table.id}
                    disabled={!isWaiter && table.status === 'occupied'}
                  >
                    {table.table_number}
                    {table.status === 'occupied'
                      ? isWaiter
                        ? ' (Terisi · pesanan tambahan)'
                        : ' (Terisi)'
                      : ''}
                  </option>
                ))}
              </select>
            )}

            {isWaiter && !selectedTable && (
              <p className="flex items-start gap-1 px-1 text-[10px] font-semibold text-brand-700">
                <UtensilsCrossed className="mt-0.5 h-3 w-3 shrink-0" />
                Pilih meja dulu agar pesanan bisa dikirim ke dapur.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2.5 pt-3">
          {cartItems.length === 0 ? (
            <div className="flex h-full min-h-48 flex-col items-center justify-center px-6 text-center text-slate-400">
              <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <ShoppingBag className="h-7 w-7 stroke-[1.5]" />
              </span>
              <p className="text-sm font-semibold text-slate-500">Keranjang masih kosong</p>
              <p className="mt-1 text-xs leading-relaxed">
                Klik menu di katalog atau tekan <kbd className="rounded border border-slate-200 bg-white px-1 font-sans">/</kbd> untuk mencari menu.
              </p>
            </div>
          ) : (
            cartItems.map((item) => {
              const maxReached = typeof item.stock === 'number' && item.quantity >= item.stock;
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-2.5"
                >
                  <div className="flex gap-2.5">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-200">
                      <MenuThumbnail
                        menu={item}
                        categories={categories}
                        iconClassName="h-4 w-4 text-slate-400"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h5 className="truncate text-xs font-bold text-slate-800">{item.name}</h5>
                          <span className="text-[11px] text-slate-500">
                            {formatCurrency(item.price)}
                          </span>
                        </div>
                        <span className="shrink-0 text-xs font-bold text-slate-900">
                          {formatCurrency(item.subtotal)}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex items-center rounded-xl border border-slate-200 bg-white">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            aria-label={
                              item.quantity <= 1
                                ? `Hapus ${item.name} dari keranjang`
                                : `Kurangi jumlah ${item.name}`
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-l-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-rose-600"
                          >
                            {item.quantity <= 1 ? (
                              <Trash2 className="h-4 w-4" />
                            ) : (
                              <Minus className="h-4 w-4" />
                            )}
                          </button>
                          <span
                            className="w-9 text-center text-sm font-bold tabular-nums text-slate-800"
                            aria-live="polite"
                          >
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            disabled={maxReached}
                            aria-label={`Tambah jumlah ${item.name}`}
                            title={maxReached ? 'Stok maksimum tercapai' : undefined}
                            className="flex h-9 w-9 items-center justify-center rounded-r-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        {typeof item.stock === 'number' && item.stock <= 5 && (
                          <span className="text-[10px] font-semibold text-brand-700">
                            Maks. {item.stock}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => onRemove(item.id)}
                          aria-label={`Hapus ${item.name} dari keranjang`}
                          className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={item.notes || ''}
                    onChange={(event) => onUpdateNotes(item.id, event.target.value)}
                    placeholder="Catatan (cth: Less Ice, tanpa gula)"
                    aria-label={`Catatan untuk ${item.name}`}
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] transition-colors focus:border-brand-600 focus:outline-none"
                  />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Sticky payment summary */}
      <div className="shrink-0 border-t border-slate-100 bg-white pt-3">
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Subtotal</span>
            <span className="font-medium text-slate-700">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>Pajak Restoran (10%)</span>
            <span className="font-medium text-slate-700">{formatCurrency(taxAmount)}</span>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-dashed border-slate-200 pt-2">
            <span className="text-sm font-bold text-slate-900">Total Tagihan</span>
            <span className="text-lg font-extrabold tracking-tight text-brand-700">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onCheckout}
          disabled={cartItems.length === 0}
          className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold shadow-md transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 ${isWaiter
              ? 'bg-emerald-600 text-white shadow-emerald-600/20 hover:bg-emerald-500'
              : 'bg-brand-700 text-white shadow-brand-900/20 hover:bg-brand-600'
            }`}
        >
          {isWaiter ? <Send className="h-4 w-4" /> : <ReceiptText className="h-4 w-4" />}
          {isWaiter ? 'Kirim Pesanan' : 'Bayar Sekarang'}
          {cartItems.length > 0 && (
            <span className="rounded-lg bg-white/20 px-2 py-0.5 text-xs font-extrabold">
              {formatCurrency(totalAmount)}
            </span>
          )}
        </button>
        {isWaiter && (
          <p className="mt-2 text-center text-[10px] font-semibold text-slate-400">
            Tanpa pembayaran · pelanggan membayar di kasir
          </p>
        )}
      </div>
    </div>
  );
}
