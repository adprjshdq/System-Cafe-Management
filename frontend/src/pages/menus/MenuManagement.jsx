import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, Search, Coffee, UtensilsCrossed, X } from 'lucide-react';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { getMenuImage } from '../../utils/menuImages';
import MenuThumbnail from '../../components/MenuThumbnail';

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const sampleMenus = [
  { id: 1, name: 'Espresso Single', category: { name: 'Coffee' }, category_id: 1, price: 18000, cost_price: 7000, is_available: true, description: 'Arabika single shot' },
  { id: 2, name: 'Iced Americano', category: { name: 'Coffee' }, category_id: 1, price: 22000, cost_price: 8000, is_available: true, description: 'Espresso & es segar' },
  { id: 3, name: 'Caramel Macchiato', category: { name: 'Coffee' }, category_id: 1, price: 28000, cost_price: 12000, is_available: true, description: 'Espresso, susu, saus karamel' },
  { id: 4, name: 'Kopi Susu Gula Aren', category: { name: 'Coffee' }, category_id: 1, price: 24000, cost_price: 9000, is_available: true, description: 'Aren organik creamy' },
  { id: 5, name: 'Matcha Latte', category: { name: 'Non-Coffee' }, category_id: 2, price: 27000, cost_price: 11000, is_available: true, description: 'Matcha murni Uji Jepang' },
  { id: 6, name: 'Nasi Goreng Kampung', category: { name: 'Main Course' }, category_id: 3, price: 32000, cost_price: 14000, is_available: true, description: 'Telur ceplok & ayam' },
];

export default function MenuManagement() {
  const [menus, setMenus] = useState(sampleMenus);
  const [categories, setCategories] = useState([
    { id: 1, name: 'Coffee' },
    { id: 2, name: 'Non-Coffee' },
    { id: 3, name: 'Main Course' },
    { id: 4, name: 'Snacks' },
  ]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category_id: '1',
    price: '',
    cost_price: '',
    description: '',
    is_available: true,
  });

  const fetchMenus = async () => {
    try {
      const res = await api.get('/v1/menus');
      if (res.data?.data?.length) setMenus(res.data.data);
      const catRes = await api.get('/v1/categories');
      if (catRes.data?.data?.length) setCategories(catRes.data.data);
    } catch (e) {
      console.warn('API error, using sample menu list:', e);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const resetImageState = (preview = null) => {
    setImageFile(null);
    setImagePreview(preview);
  };

  const handleOpenAdd = () => {
    setEditingMenu(null);
    resetImageState(null);
    setFormData({
      name: '',
      category_id: categories[0]?.id || '1',
      price: '',
      cost_price: '',
      description: '',
      is_available: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (menu) => {
    setEditingMenu(menu);
    resetImageState(getMenuImage(menu, categories));
    setFormData({
      name: menu.name,
      category_id: menu.category_id || '1',
      price: menu.price,
      cost_price: menu.cost_price || 0,
      description: menu.description || '',
      is_available: menu.is_available,
    });
    setIsModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Format foto harus JPG, PNG, atau WEBP.');
      e.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran foto maksimal 2MB.');
      e.target.value = '';
      return;
    }

    setImageFile(file);

    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSaveMenu = async (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      is_available: formData.is_available ? 1 : 0,
    };

    if (imageFile) {
      try {
        payload.image_base64 = await readFileAsDataUrl(imageFile);
      } catch {
        alert('Gagal membaca file foto. Silakan pilih ulang.');
        return;
      }
    }

    try {
      if (editingMenu) {
        await api.post(`/v1/menus/${editingMenu.id}`, payload);
      } else {
        await api.post('/v1/menus', payload);
      }
      await fetchMenus();
    } catch (err) {
      if (err.response) {
        alert(err.response.data?.message || 'Gagal menyimpan menu. Periksa kembali data Anda.');
        return;
      }

      // Local fallback saat API/offline
      const localData = { ...formData, image_path: imagePreview };
      if (editingMenu) {
        setMenus(menus.map(m => m.id === editingMenu.id ? { ...m, ...localData } : m));
      } else {
        const newId = Date.now();
        const cat = categories.find(c => String(c.id) === String(formData.category_id));
        setMenus([...menus, { id: newId, ...localData, category: { name: cat?.name || 'Umum' } }]);
      }
    }
    setIsModalOpen(false);
  };

  const handleToggle = async (menu) => {
    try {
      await api.patch(`/v1/menus/${menu.id}/toggle-availability`);
    } catch (e) {
      console.warn('API toggle failed:', e);
    }
    setMenus(menus.map(m => m.id === menu.id ? { ...m, is_available: !m.is_available } : m));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus menu ini?')) return;
    try {
      await api.delete(`/v1/menus/${id}`);
    } catch (e) {
      console.warn('API delete failed:', e);
    }
    setMenus(menus.filter(m => m.id !== id));
  };

  const filtered = menus.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-amber-500" />
            <span>Manajemen Menu & Harga</span>
          </h2>
          <p className="text-xs text-slate-500">Kelola daftar produk, harga modal, harga jual, dan status ketersediaan.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition-colors self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Menu Baru</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan nama menu..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-amber-500"
          />
        </div>
        <div className="text-xs text-slate-500">
          Total: <strong className="text-slate-800">{filtered.length}</strong> menu terdaftar
        </div>
      </div>

      {/* Menu Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="p-4">Nama Menu</th>
                <th className="p-4">Kategori</th>
                <th className="p-4">Harga Pokok (HPP)</th>
                <th className="p-4">Harga Jual</th>
                <th className="p-4">Estimasi Margin</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((menu) => {
                const margin = Number(menu.price) - Number(menu.cost_price || 0);
                const marginPercent = menu.price > 0 ? Math.round((margin / menu.price) * 100) : 0;
                return (
                  <tr key={menu.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                          <MenuThumbnail
                            menu={menu}
                            categories={categories}
                            iconClassName="w-4 h-4 text-slate-400"
                          />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{menu.name}</div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">{menu.description || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {menu.category?.name || 'Umum'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">{formatCurrency(menu.cost_price || 0)}</td>
                    <td className="p-4 font-bold text-slate-900">{formatCurrency(menu.price)}</td>
                    <td className="p-4">
                      <span className="text-emerald-700 font-semibold">
                        +{formatCurrency(margin)} ({marginPercent}%)
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggle(menu)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${menu.is_available
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                          }`}
                      >
                        {menu.is_available ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        <span>{menu.is_available ? 'Tersedia' : 'Habis'}</span>
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(menu)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(menu.id)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">
                {editingMenu ? 'Edit Menu Kafe' : 'Tambah Menu Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMenu} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Menu</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Vanilla Latte"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Foto Menu</label>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview menu" className="w-full h-full object-cover" />
                    ) : (
                      <Coffee className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageChange}
                      className="block w-full text-[11px] text-slate-500 file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-amber-100 file:text-amber-800 file:font-semibold hover:file:bg-amber-200 file:cursor-pointer cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      {imageFile ? imageFile.name : 'JPG, PNG, atau WEBP. Maksimal 2MB.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Harga Jual (Rp)</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="25000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Harga Pokok / HPP (Rp)</label>
                  <input
                    type="number"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    placeholder="10000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Rincian rasa, topping, atau takaran..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors"
                >
                  Simpan Data Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
