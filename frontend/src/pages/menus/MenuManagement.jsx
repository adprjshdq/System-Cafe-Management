import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Edit2,
  LayoutGrid,
  List,
  Loader2,
  Plus,
  Search,
  SearchX,
  Trash2,
  UtensilsCrossed,
  X,
  XCircle,
} from 'lucide-react';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import MenuThumbnail from '../../components/MenuThumbnail';
import MenuCard from './MenuCard';
import MenuFormDialog from './MenuFormDialog';
import ConfirmDialog from './ConfirmDialog';
import { getMargin, getStockState } from './menuUtils';

const sampleMenus = [
  { id: 1, name: 'Espresso Single', category: { name: 'Coffee' }, category_id: 1, price: 18000, cost_price: 7000, stock: 40, is_available: true, description: 'Arabika single shot' },
  { id: 2, name: 'Iced Americano', category: { name: 'Coffee' }, category_id: 1, price: 22000, cost_price: 8000, stock: 35, is_available: true, description: 'Espresso & es segar' },
  { id: 3, name: 'Caramel Macchiato', category: { name: 'Coffee' }, category_id: 1, price: 28000, cost_price: 12000, stock: 25, is_available: true, description: 'Espresso, susu, saus karamel' },
  { id: 4, name: 'Kopi Susu Gula Aren', category: { name: 'Coffee' }, category_id: 1, price: 24000, cost_price: 9000, stock: 30, is_available: true, description: 'Aren organik creamy' },
  { id: 5, name: 'Matcha Latte', category: { name: 'Non-Coffee' }, category_id: 2, price: 27000, cost_price: 11000, stock: 18, is_available: true, description: 'Matcha murni Uji Jepang' },
  { id: 6, name: 'Nasi Goreng Kampung', category: { name: 'Main Course' }, category_id: 3, price: 32000, cost_price: 14000, stock: 15, is_available: true, description: 'Telur ceplok & ayam' },
];

const defaultCategories = [
  { id: 1, name: 'Coffee' },
  { id: 2, name: 'Non-Coffee' },
  { id: 3, name: 'Main Course' },
  { id: 4, name: 'Snacks' },
];

const STOCK_TEXT_TONE = {
  success: 'text-emerald-600',
  warning: 'text-amber-600',
  danger: 'text-rose-600',
  neutral: 'text-slate-400',
};

export default function MenuManagement() {
  const [menus, setMenus] = useState(sampleMenus);
  const [categories, setCategories] = useState(defaultCategories);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [availability, setAvailability] = useState('all');
  const [view, setView] = useState(() =>
    localStorage.getItem('menu_view') === 'table' ? 'table' : 'grid'
  );
  const [formOpen, setFormOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchMenus = async () => {
    try {
      const res = await api.get('/v1/menus');
      if (Array.isArray(res.data?.data)) setMenus(res.data.data);
    } catch (error) {
      console.warn('API menu tidak tersedia, menggunakan data contoh:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/v1/categories');
      if (Array.isArray(res.data?.data) && res.data.data.length > 0) {
        setCategories(res.data.data);
      }
    } catch (error) {
      console.warn('API kategori tidak tersedia, menggunakan data contoh:', error);
    }
  };

  useEffect(() => {
    fetchMenus();
    fetchCategories();
  }, []);

  useEffect(() => {
    localStorage.setItem('menu_view', view);
  }, [view]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (type, message) => setToast({ id: Date.now(), type, message });

  const categoryCounts = useMemo(() => {
    const counts = {};
    menus.forEach((menu) => {
      const key = String(menu.category_id ?? '');
      if (!key) return;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [menus]);

  const normalizedSearch = search.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      menus.filter((menu) => {
        const matchesSearch =
          !normalizedSearch ||
          [menu.name, menu.description].some((value) =>
            String(value || '').toLowerCase().includes(normalizedSearch)
          );

        const matchesCategory =
          activeCategory === 'all' || String(menu.category_id) === activeCategory;

        const matchesAvailability =
          availability === 'all' ||
          (availability === 'available' ? menu.is_available : !menu.is_available);

        return matchesSearch && matchesCategory && matchesAvailability;
      }),
    [menus, normalizedSearch, activeCategory, availability]
  );

  const hasActiveFilters = Boolean(search) || activeCategory !== 'all' || availability !== 'all';

  const resetFilters = () => {
    setSearch('');
    setActiveCategory('all');
    setAvailability('all');
  };

  const handleOpenAdd = () => {
    setEditingMenu(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (menu) => {
    setEditingMenu(menu);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingMenu(null);
  };

  const handleSaveMenu = async (payload, meta = {}) => {
    try {
      if (editingMenu) {
        await api.post(`/v1/menus/${editingMenu.id}`, payload);
      } else {
        await api.post('/v1/menus', payload);
      }
      await fetchMenus();
      showToast(
        'success',
        editingMenu ? 'Menu berhasil diperbarui.' : 'Menu baru berhasil ditambahkan.'
      );
    } catch (error) {
      // Error dari server diteruskan ke form agar dialog tetap terbuka.
      if (error.response) throw error;

      // Fallback lokal saat backend tidak terjangkau (mode demo).
      const category = categories.find(
        (item) => String(item.id) === String(payload.category_id)
      );
      const localMenu = {
        ...payload,
        is_available: Boolean(payload.is_available),
        image_path: meta.preview || editingMenu?.image_path || null,
        category: category
          ? { id: category.id, name: category.name }
          : { name: 'Umum' },
      };

      if (editingMenu) {
        setMenus((previous) =>
          previous.map((menu) =>
            menu.id === editingMenu.id ? { ...menu, ...localMenu } : menu
          )
        );
      } else {
        setMenus((previous) => [{ id: Date.now(), ...localMenu }, ...previous]);
      }
      showToast('success', 'Perubahan disimpan secara lokal (mode demo).');
    }
  };

  const handleToggle = async (menu) => {
    setTogglingId(menu.id);
    try {
      const response = await api.patch(`/v1/menus/${menu.id}/toggle-availability`);
      const updated = response.data?.data;
      setMenus((previous) =>
        previous.map((item) =>
          item.id === menu.id
            ? { ...item, ...(updated || { is_available: !item.is_available }) }
            : item
        )
      );
      showToast('success', `Status "${menu.name}" diperbarui.`);
    } catch (error) {
      if (error.response) {
        showToast(
          'error',
          error.response.data?.message || 'Gagal mengubah status ketersediaan menu.'
        );
      } else {
        setMenus((previous) =>
          previous.map((item) =>
            item.id === menu.id ? { ...item, is_available: !item.is_available } : item
          )
        );
        showToast('success', 'Status diperbarui secara lokal (mode demo).');
      }
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleting(true);

    try {
      await api.delete(`/v1/menus/${target.id}`);
      setMenus((previous) => previous.filter((menu) => menu.id !== target.id));
      showToast('success', `"${target.name}" berhasil dihapus.`);
    } catch (error) {
      if (error.response) {
        showToast(
          'error',
          error.response.data?.message || 'Gagal menghapus menu. Silakan coba lagi.'
        );
      } else {
        setMenus((previous) => previous.filter((menu) => menu.id !== target.id));
        showToast('success', 'Menu dihapus secara lokal (mode demo).');
      }
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <img
              src="/menu.png"
              alt="Icon Katalog Menu"
              className="h-7 w-7 object-contain"
            />
            <span>Katalog Menu</span>
          </h2>
          <p className="text-xs text-slate-500">
            Kelola foto, harga, stok, dan ketersediaan menu kafe.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-brand-700 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition-colors hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Menu</span>
        </button>
      </div>

      {/* Toolbar: pencarian, kategori, status, tampilan */}
      <section
        aria-label="Filter katalog menu"
        className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs sm:p-4"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 lg:max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama atau deskripsi menu..."
              aria-label="Cari menu"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-9 text-xs text-slate-900 placeholder:text-slate-400 transition-colors focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/10 [&::-webkit-search-cancel-button]:hidden"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Hapus pencarian"
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={availability}
              onChange={(event) => setAvailability(event.target.value)}
              aria-label="Filter ketersediaan"
              className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition-colors focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/10"
            >
              <option value="all">Semua status</option>
              <option value="available">Tersedia</option>
              <option value="unavailable">Habis</option>
            </select>

            <div
              className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5"
              role="group"
              aria-label="Pilih tampilan"
            >
              <button
                type="button"
                onClick={() => setView('grid')}
                aria-pressed={view === 'grid'}
                aria-label="Tampilan kartu"
                title="Tampilan kartu"
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${view === 'grid'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setView('table')}
                aria-pressed={view === 'table'}
                aria-label="Tampilan tabel"
                title="Tampilan tabel"
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${view === 'table'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Kategori
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400">
                Menampilkan <strong className="text-slate-700">{filtered.length}</strong> dari{' '}
                {menus.length} menu
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-[10px] font-bold text-amber-600 transition-colors hover:text-amber-700 hover:underline"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              aria-pressed={activeCategory === 'all'}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors ${activeCategory === 'all'
                  ? 'border-brand-700 bg-brand-700 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
            >
              Semua
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${activeCategory === 'all'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-500'
                  }`}
              >
                {menus.length}
              </span>
            </button>

            {categories.map((category) => {
              const count = categoryCounts[String(category.id)] || 0;
              const active = activeCategory === String(category.id);
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(String(category.id))}
                  aria-pressed={active}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors ${active
                      ? 'border-brand-700 bg-brand-700 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                >
                  {category.name}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Daftar menu */}
      {view === 'grid' ? (
        filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((menu) => (
              <MenuCard
                key={menu.id}
                menu={menu}
                categories={categories}
                onEdit={handleOpenEdit}
                onDelete={setDeleteTarget}
                onToggle={handleToggle}
                toggling={togglingId === menu.id}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <SearchX className="h-6 w-6" />
            </span>
            <p className="text-sm font-bold text-slate-800">Menu tidak ditemukan</p>
            <p className="max-w-sm text-xs text-slate-500">
              Coba kata kunci lain atau ubah filter kategori dan status ketersediaan.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Reset filter
            </button>
          </div>
        )
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3.5 font-bold">Menu</th>
                  <th className="px-4 py-3.5 font-bold">Kategori</th>
                  <th className="px-4 py-3.5 font-bold">HPP</th>
                  <th className="px-4 py-3.5 font-bold">Harga Jual</th>
                  <th className="px-4 py-3.5 font-bold">Margin</th>
                  <th className="px-4 py-3.5 font-bold">Stok</th>
                  <th className="px-4 py-3.5 font-bold">Status</th>
                  <th className="px-4 py-3.5 text-right font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <p className="text-sm font-semibold text-slate-600">
                        Tidak ada menu yang cocok dengan filter.
                      </p>
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="mt-2 text-xs font-bold text-amber-600 hover:underline"
                      >
                        Reset filter
                      </button>
                    </td>
                  </tr>
                ) : (
                  filtered.map((menu) => {
                    const margin = getMargin(menu);
                    const stock = getStockState(menu);
                    return (
                      <tr key={menu.id} className="transition-colors hover:bg-slate-50/70">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                              <MenuThumbnail
                                menu={menu}
                                categories={categories}
                                iconClassName="h-4 w-4 text-slate-400"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900">{menu.name}</p>
                              <p className="line-clamp-1 text-[11px] text-slate-400">
                                {menu.description || '-'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                            {menu.category?.name || 'Umum'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {formatCurrency(menu.cost_price || 0)}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {formatCurrency(menu.price)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-emerald-700">
                            +{formatCurrency(margin.margin)}
                          </span>
                          <span className="ml-1 text-[10px] text-slate-400">
                            ({margin.percent}%)
                          </span>
                        </td>
                        <td className={`px-4 py-3 font-semibold ${STOCK_TEXT_TONE[stock.tone]}`}>
                          {stock.label}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleToggle(menu)}
                            disabled={togglingId === menu.id}
                            aria-pressed={Boolean(menu.is_available)}
                            aria-label={`Ubah ketersediaan ${menu.name}`}
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold transition-colors disabled:cursor-wait disabled:opacity-60 ${menu.is_available
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                              }`}
                          >
                            {togglingId === menu.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : menu.is_available ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            {menu.is_available ? 'Tersedia' : 'Habis'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(menu)}
                              aria-label={`Edit ${menu.name}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(menu)}
                              aria-label={`Hapus ${menu.name}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-rose-600 transition-colors hover:border-rose-200 hover:bg-rose-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {formOpen && (
        <MenuFormDialog
          key={editingMenu?.id ?? 'new'}
          menu={editingMenu}
          categories={categories}
          onClose={handleCloseForm}
          onSave={handleSaveMenu}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Hapus menu ini?"
          description={
            <>
              Menu{' '}
              <strong className="font-bold text-slate-700">“{deleteTarget.name}”</strong>{' '}
              akan dihapus permanen beserta fotonya. Tindakan ini tidak dapat dibatalkan.
            </>
          }
          confirmLabel="Ya, hapus menu"
          loading={deleting}
          onCancel={() => {
            if (!deleting) setDeleteTarget(null);
          }}
          onConfirm={confirmDelete}
        />
      )}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="animate-pos-toast fixed bottom-4 right-4 z-[80] w-[min(22rem,calc(100vw-2rem))]"
        >
          <div
            className={`flex items-start gap-3 rounded-2xl border bg-white px-4 py-3 shadow-xl ${toast.type === 'error' ? 'border-rose-200' : 'border-emerald-200'
              }`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${toast.type === 'error'
                  ? 'bg-rose-100 text-rose-600'
                  : 'bg-emerald-100 text-emerald-600'
                }`}
            >
              {toast.type === 'error' ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
            </span>
            <p className="flex-1 text-xs font-semibold leading-relaxed text-slate-700">
              {toast.message}
            </p>
            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="Tutup notifikasi"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
