import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ImagePlus,
  Loader2,
  RotateCcw,
  UploadCloud,
  X,
} from 'lucide-react';
import MenuThumbnail from '../../components/MenuThumbnail';
import { formatCurrency } from '../../utils/formatters';
import { getMargin } from './menuUtils';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 2 * 1024 * 1024;

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#77422D] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#77422D]/10 disabled:opacity-60';

const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-700';

export default function MenuFormDialog({ menu, categories, onClose, onSave }) {
  const isEditing = Boolean(menu);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState(() => ({
    name: menu?.name || '',
    category_id: String(menu?.category_id || categories[0]?.id || ''),
    price: menu?.price ?? '',
    cost_price: menu?.cost_price ?? '',
    stock: menu?.stock ?? '',
    description: menu?.description || '',
    is_available: menu ? Boolean(menu.is_available) : true,
  }));
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(menu?.image_path || null);
  const [imageError, setImageError] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);

  const margin = getMargin(formData);
  const hasPrice = Number(formData.price) > 0;

  const previewMenu = useMemo(
    () => ({
      id: menu?.id || 'new',
      name: formData.name || menu?.name || '',
      category_id: formData.category_id,
      image_path: imagePreview,
    }),
    [menu, formData.name, formData.category_id, imagePreview]
  );

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

  const updateField = (field) => (event) =>
    setFormData((previous) => ({ ...previous, [field]: event.target.value }));

  const applyFile = (file) => {
    setImageError('');
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setImageError('Format foto harus JPG, PNG, atau WEBP.');
      return;
    }

    if (file.size > MAX_SIZE) {
      setImageError('Ukuran foto maksimal 2MB.');
      return;
    }

    setImageFile(file);
    readFileAsDataUrl(file)
      .then((dataUrl) => setImagePreview(dataUrl))
      .catch(() => {
        setImageFile(null);
        setImageError('Gagal membaca file foto. Silakan pilih ulang.');
      });
  };

  const handleFileChange = (event) => {
    applyFile(event.target.files?.[0]);
    event.target.value = '';
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    applyFile(event.dataTransfer.files?.[0]);
  };

  const resetImage = () => {
    setImageFile(null);
    setImagePreview(menu?.image_path || null);
    setImageError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    setSaving(true);

    try {
      const payload = {
        name: formData.name.trim(),
        category_id: formData.category_id,
        price: Number(formData.price),
        cost_price: formData.cost_price === '' ? 0 : Number(formData.cost_price),
        stock: formData.stock === '' ? null : Number(formData.stock),
        description: formData.description.trim(),
        is_available: formData.is_available ? 1 : 0,
      };

      if (imageFile) {
        payload.image_base64 = await readFileAsDataUrl(imageFile);
      }

      await onSave(payload, { preview: imagePreview });
      onClose();
    } catch (error) {
      const responseData = error.response?.data;
      const firstFieldError = responseData?.errors
        ? Object.values(responseData.errors).flat()?.[0]
        : null;
      setFormError(
        firstFieldError ||
        responseData?.message ||
        'Gagal menyimpan menu. Periksa kembali data Anda.'
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
        aria-labelledby="menu-form-title"
        className="animate-dialog-pop flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
      >
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#77422D] bg-[#F5EDE8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#77422D]">
                Katalog Menu
              </span>
              <h2 id="menu-form-title" className="mt-2 text-lg font-bold text-slate-900">
                {isEditing ? 'Edit Menu' : 'Tambah Menu Baru'}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {isEditing
                  ? 'Perbarui informasi menu, harga, stok, dan foto produk.'
                  : 'Lengkapi detail menu yang akan dijual di kasir.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              aria-label="Tutup form menu"
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

            <div className="grid gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
              {/* Kolom kiri: foto & ketersediaan */}
              <div className="space-y-4">
                <div>
                  <span className={labelClass}>Foto Menu</span>
                  <div
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    className={`relative aspect-[4/3] overflow-hidden rounded-2xl border-2 border-dashed transition-colors ${dragging
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-slate-200 bg-slate-100'
                      }`}
                  >
                    <MenuThumbnail
                      menu={previewMenu}
                      categories={categories}
                      iconClassName="h-10 w-10 text-slate-300"
                    />

                    <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-slate-950/75 via-slate-950/35 to-transparent p-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1.5 text-[11px] font-bold text-slate-800 shadow-sm transition-colors hover:bg-white"
                      >
                        <ImagePlus className="h-3.5 w-3.5" />
                        {imageFile || imagePreview ? 'Ganti foto' : 'Pilih foto'}
                      </button>
                      {imageFile && (
                        <button
                          type="button"
                          onClick={resetImage}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950/50 px-2.5 py-1.5 text-[11px] font-bold text-white backdrop-blur transition-colors hover:bg-slate-950/70"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Batalkan
                        </button>
                      )}
                    </div>

                    {dragging && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-amber-50/95 text-amber-700">
                        <UploadCloud className="h-6 w-6" />
                        <span className="text-xs font-bold">Lepaskan foto di sini</span>
                      </div>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="sr-only"
                  />

                  <p className="mt-1.5 text-[10px] leading-relaxed text-slate-400">
                    {imageFile
                      ? `Dipilih: ${imageFile.name}`
                      : 'JPG, PNG, atau WEBP · maksimal 2MB · rasio 4:3 disarankan.'}
                  </p>
                  {imageError && (
                    <p role="alert" className="mt-1 text-[10px] font-semibold text-rose-600">
                      {imageError}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.is_available}
                  onClick={() =>
                    setFormData((previous) => ({
                      ...previous,
                      is_available: !previous.is_available,
                    }))
                  }
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-left transition-colors hover:bg-slate-50"
                >
                  <span>
                    <span className="block text-xs font-bold text-slate-800">
                      Tersedia untuk dijual
                    </span>
                    <span className="mt-0.5 block text-[10px] leading-relaxed text-slate-500">
                      Nonaktifkan sementara jika bahan habis.
                    </span>
                  </span>
                  <span
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${formData.is_available ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${formData.is_available ? 'left-[1.375rem]' : 'left-0.5'
                        }`}
                    />
                  </span>
                </button>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Margin keuntungan
                    </span>
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold ${hasPrice && margin.margin >= 0
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700'
                        }`}
                    >
                      {hasPrice ? `${margin.percent}%` : '—'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-extrabold text-slate-900">
                    {hasPrice ? formatCurrency(margin.margin) : 'Isi harga jual'}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    Harga jual dikurangi HPP per porsi.
                  </p>
                </div>
              </div>

              {/* Kolom kanan: detail menu */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="menu-name" className={labelClass}>
                    Nama Menu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="menu-name"
                    type="text"
                    required
                    maxLength={150}
                    value={formData.name}
                    onChange={updateField('name')}
                    placeholder="Contoh: Vanilla Latte"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="menu-category" className={labelClass}>
                    Kategori <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="menu-category"
                    required
                    value={formData.category_id}
                    onChange={updateField('category_id')}
                    className={inputClass}
                  >
                    <option value="" disabled>
                      Pilih kategori
                    </option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="menu-price" className={labelClass}>
                      Harga Jual (Rp) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="menu-price"
                      type="number"
                      required
                      min="0"
                      step="500"
                      value={formData.price}
                      onChange={updateField('price')}
                      placeholder="25000"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="menu-cost" className={labelClass}>
                      HPP (Rp)
                    </label>
                    <input
                      id="menu-cost"
                      type="number"
                      min="0"
                      step="500"
                      value={formData.cost_price}
                      onChange={updateField('cost_price')}
                      placeholder="10000"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="menu-stock" className={labelClass}>
                    Stok Tersedia
                  </label>
                  <input
                    id="menu-stock"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.stock}
                    onChange={updateField('stock')}
                    placeholder="Kosongkan untuk stok tidak terbatas"
                    className={inputClass}
                  />
                  <p className="mt-1.5 text-[10px] leading-relaxed text-slate-400">
                    Kosongkan jika tidak dibatasi. Stok berkurang otomatis setiap ada pesanan.
                  </p>
                </div>

                <div>
                  <label htmlFor="menu-description" className={labelClass}>
                    Deskripsi Singkat
                  </label>
                  <textarea
                    id="menu-description"
                    rows="3"
                    value={formData.description}
                    onChange={updateField('description')}
                    placeholder="Rincian rasa, topping, atau takaran..."
                    className={`${inputClass} resize-none`}
                  />
                </div>

                {hasPrice && (
                  <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[11px] font-semibold leading-relaxed text-emerald-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      Margin {formatCurrency(margin.margin)} ({margin.percent}%) per porsi
                      {margin.margin < 0 ? ' — harga jual di bawah HPP.' : '.'}
                    </span>
                  </div>
                )}
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
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#77422D] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition-colors hover:bg-[#653724] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#77422D] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving
                ? 'Menyimpan...'
                : isEditing
                  ? 'Simpan Perubahan'
                  : 'Tambah Menu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
