import React, { useEffect } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Info,
  Loader2,
  Send,
  Users,
  UtensilsCrossed,
  Wallet,
  X,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export default function SendOrderDialog({
  open,
  onClose,
  items = [],
  subtotal,
  taxAmount,
  totalAmount,
  selectedTable,
  customerName,
  onConfirm,
  processing = false,
  errorMessage = '',
}) {
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !processing) onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, processing, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !processing) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-order-title"
        className="animate-dialog-pop flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Send className="h-5 w-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 id="send-order-title" className="text-base font-bold text-slate-900">
                  Kirim Pesanan ke Dapur
                </h3>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  Mode Pelayan
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {itemCount} item · {selectedTable?.table_number || 'Meja belum dipilih'}
                {customerName ? ` · ${customerName}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            aria-label="Tutup dialog kirim pesanan"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="border-b border-slate-100 bg-slate-50/70 p-5 md:border-b-0 md:border-r sm:p-6">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
              Ringkasan Pesanan
            </h4>

            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-800">{item.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {item.quantity} × {formatCurrency(item.price)}
                      {item.notes ? ` · ${item.notes}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-slate-900">
                    {formatCurrency(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-1.5 rounded-xl border border-slate-200/80 bg-white p-3">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Subtotal</span>
                <span className="font-medium text-slate-700">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Pajak (10%)</span>
                <span className="font-medium text-slate-700">{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-2">
                <span className="text-xs font-bold text-slate-900">Total Tagihan</span>
                <span className="text-base font-extrabold text-amber-600">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3 p-5 sm:p-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Meja Tujuan
              </p>
              <p className="mt-1 flex items-center gap-2 text-lg font-extrabold text-slate-900">
                <UtensilsCrossed className="h-4 w-4 text-amber-500" />
                {selectedTable?.table_number || 'Belum dipilih'}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                <Users className="h-3.5 w-3.5" />
                Kapasitas {selectedTable?.capacity || '-'} kursi
                {selectedTable?.area
                  ? ` · Area ${selectedTable.area === 'outdoor' ? 'Outdoor' : 'Indoor'}`
                  : ''}
              </p>
              <p className="mt-2 border-t border-slate-200 pt-2 text-[11px] text-slate-500">
                Pelanggan: <span className="font-semibold text-slate-700">{customerName || 'Walk-In'}</span>
              </p>
            </div>

            {!selectedTable && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[11px] font-semibold text-rose-700"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                Pilih meja terlebih dahulu sebelum mengirim pesanan.
              </div>
            )}

            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
              <p className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800">
                <Wallet className="h-3.5 w-3.5" />
                Tanpa pembayaran
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-amber-700">
                Pesanan langsung masuk ke antrian dapur. Pembayaran dilakukan pelanggan di kasir.
              </p>
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-[10px] leading-relaxed text-slate-500">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Pastikan meja dan item sudah benar. Pesanan yang sudah dikirim akan tampil di
              Kitchen Display.
            </div>

            {errorMessage && (
              <p
                role="alert"
                className="flex items-start gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-600"
              >
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {errorMessage}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 bg-white px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-center text-[11px] text-slate-400 sm:text-left">
            Pelayan tidak memproses pembayaran · tagihan dibayar di kasir
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={processing}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40 sm:flex-none"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={processing || !selectedTable}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-all hover:bg-emerald-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
            >
              {processing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Mengirim...
                </>
              ) : (
                <>
                  Kirim Pesanan
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
