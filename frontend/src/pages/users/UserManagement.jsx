import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShoppingBag,
  ChefHat,
  Utensils,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  AlertCircle,
  KeyRound,
  Mail,
  User,
  Shield,
  ToggleLeft,
  ToggleRight,
  Filter
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const sampleUsers = [
  {
    id: 1,
    name: 'Manager Admin',
    email: 'admin@cafe.com',
    role: 'admin',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Budi Kasir',
    email: 'kasir@cafe.com',
    role: 'cashier',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'Chef Barista',
    email: 'dapur@cafe.com',
    role: 'kitchen',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 4,
    name: 'Siti Waiter',
    email: 'pelayan@cafe.com',
    role: 'waiter',
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

const roleDetails = {
  admin: {
    label: 'Admin / Manager',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
    avatarBg: 'bg-purple-600 text-white',
    icon: ShieldCheck,
    description: 'Akses penuh ke semua menu: Dashboard, POS, Dapur, Menu, Meja, Riwayat & Pengguna',
  },
  cashier: {
    label: 'Kasir',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    avatarBg: 'bg-blue-600 text-white',
    icon: ShoppingBag,
    description: 'Akses ke Kasir / POS, kelola denah meja, dan riwayat transaksi pesanan',
  },
  kitchen: {
    label: 'Dapur & Barista',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    avatarBg: 'bg-amber-600 text-white',
    icon: ChefHat,
    description: 'Akses ke Kitchen Display System (KDS) untuk memantau & memproses pesanan',
  },
  waiter: {
    label: 'Pelayan / Waiter',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    avatarBg: 'bg-emerald-600 text-white',
    icon: Utensils,
    description: 'Akses ke Kasir / POS untuk input pesanan langsung dari meja pelanggan',
  },
};

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState(sampleUsers);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'cashier',
    is_active: true,
  });

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast('');
    }, 3500);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/v1/users');
      if (res.data?.success && res.data.data) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.warn('Gagal memuat pengguna via API, menggunakan data lokal:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'cashier',
      is_active: true,
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (targetUser) => {
    setEditingUser(targetUser);
    setFormData({
      name: targetUser.name,
      email: targetUser.email,
      password: '',
      role: targetUser.role,
      is_active: Boolean(targetUser.is_active),
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim() || !formData.email.trim()) {
      setErrorMsg('Nama dan email wajib diisi.');
      return;
    }

    if (!editingUser && (!formData.password || formData.password.length < 6)) {
      setErrorMsg('Password akun baru minimal 6 karakter.');
      return;
    }

    if (editingUser && formData.password && formData.password.length < 6) {
      setErrorMsg('Password baru minimal 6 karakter.');
      return;
    }

    try {
      if (editingUser) {
        const payload = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          is_active: formData.is_active,
        };
        if (formData.password) {
          payload.password = formData.password;
        }

        const res = await api.put(`/v1/users/${editingUser.id}`, payload);
        if (res.data?.success) {
          showToast(`Akun ${formData.name} berhasil diperbarui!`);
          fetchUsers();
        }
      } else {
        const res = await api.post('/v1/users', formData);
        if (res.data?.success) {
          showToast(`Akun ${formData.name} berhasil ditambahkan!`);
          fetchUsers();
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      const respMsg = err.response?.data?.message || err.response?.data?.errors
        ? Object.values(err.response?.data?.errors || {}).flat().join(', ')
        : 'Terjadi kesalahan saat menyimpan data.';
      setErrorMsg(respMsg);
    }
  };

  const handleToggleStatus = async (targetUser) => {
    if (currentUser?.id === targetUser.id) {
      showToast('Anda tidak dapat menonaktifkan akun sendiri yang sedang dipakai.');
      return;
    }

    try {
      await api.patch(`/v1/users/${targetUser.id}/toggle-status`);
      showToast(`Status ${targetUser.name} berhasil diubah.`);
      fetchUsers();
    } catch (err) {
      // Local fallback toggle
      setUsers(users.map(u => u.id === targetUser.id ? { ...u, is_active: !u.is_active } : u));
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmUser) return;
    try {
      const res = await api.delete(`/v1/users/${deleteConfirmUser.id}`);
      if (res.data?.success) {
        showToast(`Akun ${deleteConfirmUser.name} berhasil dihapus.`);
        fetchUsers();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal menghapus pengguna.';
      alert(msg);
    } finally {
      setDeleteConfirmUser(null);
    }
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = selectedRole === 'all' || u.role === selectedRole;
      const matchStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'active' && u.is_active) ||
        (selectedStatus === 'inactive' && !u.is_active);

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, selectedRole, selectedStatus]);

  // Summary counts
  const stats = useMemo(() => {
    return {
      total: users.length,
      admin: users.filter((u) => u.role === 'admin').length,
      cashier: users.filter((u) => u.role === 'cashier').length,
      kitchen: users.filter((u) => u.role === 'kitchen').length,
      waiter: users.filter((u) => u.role === 'waiter').length,
    };
  }, [users]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-20 right-6 z-50 flex items-center space-x-2 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl animate-fade-in text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Manajemen Pengguna & Hak Akses</h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Kelola akun staf cafe, hak akses role (Admin, Kasir, Dapur, Waiter), dan status keaktifan.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Staf</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.total}</div>
          <span className="text-[11px] text-slate-400">Terdaftar di sistem</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Admin</span>
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-900 mt-2">{stats.admin}</div>
          <span className="text-[11px] text-purple-600 font-medium">Akses Penuh</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Kasir</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-900 mt-2">{stats.cashier}</div>
          <span className="text-[11px] text-blue-600 font-medium">POS & Struk</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Dapur / Barista</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <ChefHat className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-900 mt-2">{stats.kitchen}</div>
          <span className="text-[11px] text-amber-600 font-medium">Display KDS</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Waiter</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-900 mt-2">{stats.waiter}</div>
          <span className="text-[11px] text-emerald-600 font-medium">Input Meja</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari berdasarkan nama atau email pengguna..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-slate-50/50"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
              <Filter className="w-3.5 h-3.5" />
              Status:
            </span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif Saja</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>
        </div>

        {/* Role Pills Filter */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          <span className="text-xs font-medium text-slate-400 mr-2">Role:</span>
          {[
            { id: 'all', label: 'Semua Role' },
            { id: 'admin', label: 'Admin' },
            { id: 'cashier', label: 'Kasir' },
            { id: 'kitchen', label: 'Dapur' },
            { id: 'waiter', label: 'Waiter' },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRole(r.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedRole === r.id
                  ? 'bg-slate-900 text-white shadow-sm font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-6">Pengguna</th>
                <th className="py-3.5 px-6">Role & Hak Tampilan</th>
                <th className="py-3.5 px-6">Status Akun</th>
                <th className="py-3.5 px-6">Tanggal Dibuat</th>
                <th className="py-3.5 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-600">Tidak ada data pengguna yang cocok</p>
                    <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau filter role.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((item) => {
                  const roleCfg = roleDetails[item.role] || roleDetails.cashier;
                  const RoleIcon = roleCfg.icon;
                  const isCurrent = currentUser?.id === item.id;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Name & Email */}
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${roleCfg.avatarBg}`}
                          >
                            {item.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-slate-900">{item.name}</span>
                              {isCurrent && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                                  Anda
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {item.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${roleCfg.badge}`}
                          >
                            <RoleIcon className="w-3.5 h-3.5" />
                            <span>{roleCfg.label}</span>
                          </span>
                          <p className="text-[11px] text-slate-400 max-w-xs line-clamp-1">
                            {roleCfg.description}
                          </p>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleToggleStatus(item)}
                          title="Klik untuk ubah status aktif/non-aktif"
                          className="inline-flex items-center space-x-1.5 group/btn"
                        >
                          {item.is_active ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 group-hover/btn:bg-emerald-200 transition-colors">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 group-hover/btn:bg-slate-200 transition-colors">
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              Non-aktif
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Created At */}
                      <td className="py-4 px-6 text-xs text-slate-500">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '-'}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Edit data pengguna"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmUser(item)}
                            disabled={isCurrent}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isCurrent
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                            }`}
                            title={isCurrent ? 'Tidak bisa menghapus akun sendiri' : 'Hapus pengguna'}
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Role Permission Guide Card */}
      <div className="bg-linear-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-md">
        <h3 className="font-bold text-base flex items-center gap-2 mb-3">
          <Shield className="w-5 h-5 text-amber-400" />
          Panduan Hak Akses Tampilan Berdasarkan Role
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
            <div className="flex items-center space-x-2 text-purple-300 font-bold mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Admin / Manager</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Melihat seluruh halaman: <strong>Dashboard</strong>, <strong>Kasir (POS)</strong>, <strong>Display Dapur</strong>, <strong>Katalog Menu</strong>, <strong>Kelola Meja</strong>, <strong>Riwayat Transaksi</strong>, dan <strong>Kelola Pengguna</strong>.
            </p>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
            <div className="flex items-center space-x-2 text-blue-300 font-bold mb-1">
              <ShoppingBag className="w-4 h-4" />
              <span>Kasir (Cashier)</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Hanya melihat <strong>Kasir / POS</strong>, <strong>Kelola Meja</strong> (cek meja kosong/terisi), dan <strong>Riwayat Pesanan</strong> (cetak struk).
            </p>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
            <div className="flex items-center space-x-2 text-amber-300 font-bold mb-1">
              <ChefHat className="w-4 h-4" />
              <span>Dapur (Kitchen)</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Fokus hanya melihat <strong>Kitchen Display System (KDS)</strong> antrian pesanan yang harus dimasak dan diracik tanpa melihat keuangan/harga.
            </p>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
            <div className="flex items-center space-x-2 text-emerald-300 font-bold mb-1">
              <Utensils className="w-4 h-4" />
              <span>Pelayan (Waiter)</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Hanya melihat antarmuka <strong>Kasir / POS</strong> untuk mencatat pesanan pelanggan dari meja secara langsung.
            </p>
          </div>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  {editingUser ? <Edit2 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    {editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingUser
                      ? `Perbarui informasi akun untuk ${editingUser.name}`
                      : 'Lengkapi formulir untuk membuat akun staf baru'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Rian Barista"
                    className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Alamat Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Contoh: rian@cafe.com"
                    className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password {editingUser ? '(Opsional)' : <span className="text-rose-500">*</span>}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={
                      editingUser
                        ? 'Kosongkan jika tidak ingin mengubah password'
                        : 'Minimal 6 karakter'
                    }
                    className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Peran / Hak Akses Tampilan <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'admin', label: 'Admin / Manager', icon: ShieldCheck, color: 'text-purple-600' },
                    { id: 'cashier', label: 'Kasir', icon: ShoppingBag, color: 'text-blue-600' },
                    { id: 'kitchen', label: 'Dapur & Barista', icon: ChefHat, color: 'text-amber-600' },
                    { id: 'waiter', label: 'Pelayan / Waiter', icon: Utensils, color: 'text-emerald-600' },
                  ].map((r) => {
                    const RIcon = r.icon;
                    const isSelected = formData.role === r.id;
                    return (
                      <button
                        type="button"
                        key={r.id}
                        onClick={() => setFormData({ ...formData, role: r.id })}
                        className={`flex items-center space-x-2.5 p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <RIcon className={`w-4 h-4 shrink-0 ${r.color}`} />
                        <div>
                          <p className="text-xs font-bold text-slate-900">{r.label}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {formData.role && (
                  <p className="text-[11px] text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                    ℹ️ <strong>Tampilan yang dapat dibuka:</strong> {roleDetails[formData.role]?.description}
                  </p>
                )}
              </div>

              {/* Status Toggle */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <div>
                  <span className="text-xs font-bold text-slate-800">Status Akun Aktif</span>
                  <p className="text-[11px] text-slate-400">Pengguna hanya dapat login jika akun berstatus aktif</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  className="text-slate-600 hover:text-slate-900 transition-colors"
                >
                  {formData.is_active ? (
                    <ToggleRight className="w-8 h-8 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-300" />
                  )}
                </button>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02]"
                >
                  {editingUser ? 'Simpan Perubahan' : 'Buat Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">Konfirmasi Hapus Pengguna</h3>
              <p className="text-xs text-slate-500 mt-1">
                Apakah Anda yakin ingin menghapus akun{' '}
                <strong className="text-slate-900">{deleteConfirmUser.name}</strong> ({deleteConfirmUser.email})?
              </p>
              <p className="text-[11px] text-rose-500 mt-2 bg-rose-50 p-2 rounded-lg">
                ⚠️ Tindakan ini permanen. Pengguna tidak akan dapat login lagi ke sistem cafe.
              </p>
            </div>
            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20"
              >
                Ya, Hapus Akun
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
