import React, { useEffect } from 'react';
import {
  X,
  DollarSign,
  QrCode,
  CreditCard,
  Delete,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ReceiptText,
  UtensilsCrossed,
  Package,
  Loader2,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Tunai', hint: 'Uang fisik', icon: DollarSign, iconClass: 'text-emerald-600' },
  { id: 'qris', label: 'QRIS', hint: 'Scan & bayar', icon: QrCode, iconClass: 'text-slate-800' },
  { id: 'transfer', label: 'Transfer', hint: 'Bank transfer', icon: CreditCard, iconClass: 'text-blue-600' },
];

export default function CheckoutDialog({
  open,
  onClose,
  items = [],
  subtotal,
  taxAmount,
  totalAmount,
  orderType,
  selectedTable,
  customerName,
  paymentMethod,
  setPaymentMethod,
  amountPaid,
  setAmountPaid,
  onConfirm,
  processing = false,
  errorMessage = '',
}) {
  const paid = Number(amountPaid) || 0;
  const isCash = paymentMethod === 'cash';
  const isEnough = paid >= totalAmount;
  const change = paid - totalAmount;
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

  const appendDigits = (digits) => {
    setAmountPaid((previous) => {
      const base = String(previous ?? '').replace(/\D/g, '');
      const next = `${base}${digits}`.replace(/^0+(?=\d)/, '').slice(0, 12);
      return next;
    });
  };

  const removeLastDigit = () => {
    setAmountPaid((previous) => String(previous ?? '').replace(/\D/g, '').slice(0, -1));
  };

  const quickAmounts = Array.from(
    new Set([
      totalAmount,
      Math.ceil(totalAmount / 5000) * 5000,
      Math.ceil(totalAmount / 10000) * 10000,
      Math.ceil(totalAmount / 50000) * 50000,
    ])
  )
    .filter((amount) => amount >= totalAmount)
    .slice(0, 4);

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
        aria-labelledby="checkout-title"
        className="flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-4xl sm:rounded-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <ReceiptText className="h-5 w-5" />
            </span>
            <div>
              <h3 id="checkout-title" className="text-base font-bold text-slate-900">
                Proses Pembayaran
              </h3>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {itemCount} item ·{' '}
                {orderType === 'dine_in'
                  ? selectedTable?.table_number || 'Dine-In'
                  : 'Takeaway'}
                {customerName ? ` · ${customerName}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            aria-label="Tutup dialog pembayaran"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          {/* Left: order summary */}
          <div className="border-b border-slate-100 bg-slate-50/70 p-5 md:border-b-0 md:border-r sm:p-6">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Ringkasan Pesanan
              </h4>
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-slate-500 shadow-xs">
                {orderType === 'dine_in' ? (
                  <UtensilsCrossed className="h-3 w-3" />
                ) : (
                  <Package className="h-3 w-3" />
                )}
                {orderType === 'dine_in' ? 'Dine-In' : 'Takeaway'}
              </span>
            </div>

            <div className="max-h-56 space-y-2 overflow-y-auto pr-1 md:max-h-64">
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
                <span className="text-xs font-bold text-slate-900">Total</span>
                <span className="text-base font-extrabold text-amber-600">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Right: payment */}
          <div className="p-5 sm:p-6">
            <div className="mb-4 rounded-2xl bg-slate-900 px-4 py-3 text-white">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Total yang harus dibayar
              </p>
              <p className="mt-0.5 text-2xl font-extrabold tracking-tight">
                {formatCurrency(totalAmount)}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-slate-600">Metode Pembayaran</p>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  const isActive = paymentMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      aria-pressed={isActive}
                      className={`rounded-xl border p-2.5 text-left transition-all ${
                        isActive
                          ? 'border-brand-600 bg-brand-50/60 ring-1 ring-brand-600'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`mb-1.5 h-4.5 w-4.5 ${method.iconClass}`} />
                      <span className="block text-xs font-bold text-slate-800">{method.label}</span>
                      <span className="block text-[10px] text-slate-400">{method.hint}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {isCash && (
              <div className="mt-4">
                <label
                  htmlFor="cash-amount"
                  className="mb-1.5 block text-xs font-semibold text-slate-600"
                >
                  Uang Diterima
                </label>
                <div
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors ${
                    paid > 0 && !isEnough
                      ? 'border-rose-300 bg-rose-50/50'
                      : 'border-slate-200 bg-slate-50 focus-within:border-amber-500 focus-within:bg-white'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-400">Rp</span>
                  <input
                    id="cash-amount"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    autoFocus
                    value={amountPaid}
                    onChange={(event) =>
                      setAmountPaid(event.target.value.replace(/\D/g, '').slice(0, 12))
                    }
                    placeholder="0"
                    className="w-full bg-transparent text-lg font-extrabold tabular-nums text-slate-900 placeholder:text-slate-300 focus:outline-none"
                  />
                  {amountPaid && (
                    <button
                      type="button"
                      onClick={() => setAmountPaid('')}
                      className="rounded-md px-1.5 py-0.5 text-[10px] font-bold text-slate-400 hover:bg-slate-200"
                    >
                      Hapus
                    </button>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  {paid > 0 ? formatCurrency(paid) : 'Masukkan nominal uang tunai'}
                </p>

                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {quickAmounts.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setAmountPaid(String(amount))}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition-colors hover:border-amber-400 hover:bg-amber-50 hover:text-amber-800"
                    >
                      {amount === totalAmount ? 'Uang Pas' : formatCurrency(amount)}
                    </button>
                  ))}
                </div>

                <div className="mt-2.5 grid grid-cols-3 gap-1.5">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0'].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => appendDigits(digit)}
                      className="rounded-lg border border-slate-200 bg-white py-2 text-sm font-bold text-slate-700 transition-colors hover:border-amber-400 hover:bg-amber-50 active:scale-[0.98]"
                    >
                      {digit}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={removeLastDigit}
                    aria-label="Hapus digit terakhir"
                    className="flex items-center justify-center rounded-lg border border-slate-200 bg-white py-2 text-slate-600 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 active:scale-[0.98]"
                  >
                    <Delete className="h-4 w-4" />
                  </button>
                </div>

                <div
                  className={`mt-2.5 flex items-center justify-between rounded-xl px-3 py-2 text-xs ${
                    isEnough
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-rose-50 text-rose-600'
                  }`}
                >
                  {isEnough ? (
                    <>
                      <span className="flex items-center gap-1.5 font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Kembalian
                      </span>
                      <span className="text-sm font-extrabold">{formatCurrency(change)}</span>
                    </>
                  ) : (
                    <>
                      <span className="flex items-center gap-1.5 font-semibold">
                        <AlertCircle className="h-3.5 w-3.5" /> Kurang
                      </span>
                      <span className="text-sm font-extrabold">
                        {formatCurrency(Math.max(0, totalAmount - paid))}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {paymentMethod === 'qris' && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-xl border border-slate-300 bg-white p-2">
                  <QrCode className="h-28 w-28 text-slate-900" />
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-700">
                  Scan QRIS untuk membayar
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  GoPay, OVO, DANA, BCA Mobile, dan e-wallet lainnya
                </p>
              </div>
            )}

            {paymentMethod === 'transfer' && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-700">Transfer ke rekening</p>
                <div className="mt-2 rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    BCA
                  </p>
                  <p className="mt-0.5 text-sm font-extrabold tracking-wide text-slate-900">
                    1234 5678 90
                  </p>
                  <p className="text-[11px] text-slate-500">a.n. Aroma Kopi &amp; Cafe</p>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                  Konfirmasi pembayaran setelah transfer diterima. Nominal:{' '}
                  <span className="font-bold text-slate-700">{formatCurrency(totalAmount)}</span>
                </p>
              </div>
            )}

            {errorMessage && (
              <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-600">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {errorMessage}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 bg-white px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-center text-[11px] text-slate-400 sm:text-left">
            {isCash
              ? 'Pembayaran tunai · struk dicetak setelah konfirmasi'
              : 'Pastikan pembayaran diterima sebelum konfirmasi'}
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
              disabled={processing || (isCash && !isEnough)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 transition-all hover:bg-amber-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
            >
              {processing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Memproses...
                </>
              ) : (
                <>
                  Konfirmasi &amp; Cetak Struk
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
