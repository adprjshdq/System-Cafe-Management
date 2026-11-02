import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Armchair,
  Loader2,
  Sun,
  Trees,
  Users,
  X,
} from 'lucide-react';
import { AREA_META } from './tableUtils';

const CAPACITY_PRESETS = [2, 4, 6, 8];

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/10';

const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-700';

const AREA_ICON = {
  indoor: Sun,
  outdoor: Trees,
};

export default function AddTableDialog({ onClose, onSave }) {
  const [form, setForm] = useState({
    table_number: '',
    area: 'indoor',
    capacity: '4',
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Kunci scroll halaman & tutup dengan Esc
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKey = (event) => {
      if (event.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [saving, onClose]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const name = form.table_number.trim();
    const capacity = Number(form.capacity);

    if (!name) {
      setFormError('Nama meja wajib diisi.');
      return;
    }

    if (!Number.isInteger(capacity) || capacity < 1) {
      setFormError('Kapasitas minimal 1 kursi.');
      return;
    }

    setFormError('');
    setSaving(true);

    try {
      await onSave({ table_number: name, area: form.area, capacity });
      onClose();
    } catch (error) {
      const responseData = error?.response?.data;
      const firstFieldError = responseData?.errors
        ? Object.values(responseData.errors).flat()?.[0]
        : null;

      setFormError(
        firstFieldError ||
          responseData?.message ||
          'Gagal menambahkan meja. Periksa kembali data Anda.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-table-title"
        className="animate-dialog-pop flex max-h-[94dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
      >
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                Denah Meja
              </span>
              <h2 id="add-table-title" className="mt-2 text-lg font-bold text-slate-900">
                Tambah Meja Baru
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Meja baru langsung muncul di denah sesuai area yang dipilih.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              aria-label="Tutup form meja"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            {formError && (
              <div
                role="alert"
                className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs font-semibold leading-relaxed text-rose-700"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="table-number" className={labelClass}>
                  Nama / Nomor Meja <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Armchair className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="table-number"
                    type="text"
                    required
                    autoFocus
                    maxLength={20}
                    value={form.table_number}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        table_number: event.target.value,
                      }))
                    }
                    placeholder="Contoh: Meja 07 atau Outdoor 02"
                    className={`${inputClass} pl-9`}
                  />
                </div>
                <p className="mt-1.5 text-[10px] text-slate-400">
                  Nama meja harus unik dan mudah dikenali pelayan.
                </p>
              </div>

              <div>
                <span className={labelClass}>Area Meja</span>
                <div className="grid grid-cols-2 gap-2" role="group" aria-label="Pilih area meja">
                  {Object.entries(AREA_META).map(([value, meta]) => {
                    const Icon = AREA_ICON[value] || Armchair;
                    const active = form.area === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setForm((previous) => ({ ...previous, area: value }))
                        }
                        aria-pressed={active}
                        className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition-colors ${
                          active
                            ? 'border-brand-600 bg-brand-50 ring-1 ring-brand-600/30'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            active
                              ? 'bg-brand-700 text-white'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-xs font-bold text-slate-900">
                            {meta.label}
                          </span>
                          <span className="mt-0.5 block text-[10px] leading-snug text-slate-500">
                            {meta.description}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className={labelClass}>Kapasitas Kursi</span>
                <div className="flex flex-wrap items-center gap-2">
                  {CAPACITY_PRESETS.map((value) => {
                    const active = Number(form.capacity) === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setForm((previous) => ({
                            ...previous,
                            capacity: String(value),
                          }))
                        }
                        aria-pressed={active}
                        className={`inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                          active
                            ? 'border-brand-700 bg-brand-700 text-white'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <Users className="h-3.5 w-3.5" />
                        {value}
                      </button>
                    );
                  })}

                  <div className="relative ml-auto w-28">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      aria-label="Kapasitas kursi khusus"
                      value={form.capacity}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          capacity: event.target.value,
                        }))
                      }
                      className={`${inputClass} pr-12`}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                      kursi
                    </span>
                  </div>
                </div>
                <p className="mt-1.5 text-[10px] text-slate-400">
                  Pilih preset atau isi jumlah kursi sendiri (maksimal 8 kursi ditampilkan di denah).
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Pratinjau
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-emerald-300 bg-emerald-50 text-emerald-800">
                    <Armchair className="h-5 w-5" />
                    <span className="absolute -right-1 -top-1 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[8px] font-extrabold text-white">
                      {form.capacity || 0}
                    </span>
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-slate-900">
                      {form.table_number.trim() || 'Nama meja baru'}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {AREA_META[form.area].label} · {form.capacity || 0} kursi · status
                      awal Tersedia
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-sm transition-colors hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Menyimpan...' : 'Simpan Meja'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
