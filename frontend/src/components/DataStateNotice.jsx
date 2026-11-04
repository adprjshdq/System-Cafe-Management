import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function DataStateNotice({
  title = 'Gagal memuat data',
  message = 'Server tidak dapat dihubungi. Periksa koneksi lalu coba lagi.',
  onRetry,
  retrying = false,
  className = '',
}) {
  return (
    <div
      role="alert"
      className={`flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
          <AlertCircle className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-rose-900">{title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-rose-700">{message}</p>
        </div>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-xl border border-rose-300 bg-white px-3.5 py-2 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-wait disabled:opacity-60 sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${retrying ? 'animate-spin' : ''}`} />
          {retrying ? 'Memuat...' : 'Coba lagi'}
        </button>
      )}
    </div>
  );
}
