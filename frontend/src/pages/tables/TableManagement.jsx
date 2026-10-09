import React, { useState, useEffect } from 'react';
import { Grid, Users, Plus, CheckCircle2, AlertCircle, Clock, X } from 'lucide-react';
import api from '../../services/api';

const sampleTables = [
  { id: 1, table_number: 'Meja 01', capacity: 2, status: 'available' },
  { id: 2, table_number: 'Meja 02', capacity: 2, status: 'available' },
  { id: 3, table_number: 'Meja 03', capacity: 4, status: 'occupied' },
  { id: 4, table_number: 'Meja 04', capacity: 4, status: 'available' },
  { id: 5, table_number: 'Meja 05', capacity: 6, status: 'reserved' },
  { id: 6, table_number: 'Meja 06', capacity: 6, status: 'available' },
  { id: 7, table_number: 'Meja VIP 1', capacity: 8, status: 'occupied' },
  { id: 8, table_number: 'Outdoor 01', capacity: 4, status: 'available' },
];

export default function TableManagement() {
  const [tables, setTables] = useState(sampleTables);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newCapacity, setNewCapacity] = useState('4');

  const fetchTables = async () => {
    try {
      const res = await api.get('/v1/tables');
      if (res.data?.data?.length) setTables(res.data.data);
    } catch (e) {
      console.warn('API error, using sample table layout:', e);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleUpdateStatus = async (tableId, nextStatus) => {
    try {
      await api.patch(`/v1/tables/${tableId}/status`, { status: nextStatus });
    } catch (e) {
      console.warn('API table status update failed:', e);
    }
    setTables(tables.map(t => t.id === tableId ? { ...t, status: nextStatus } : t));
  };

  const handleAddTable = async (e) => {
    e.preventDefault();
    try {
      await api.post('/v1/tables', {
        table_number: newTableNumber,
        capacity: Number(newCapacity),
        status: 'available',
      });
      fetchTables();
    } catch (err) {
      setTables([...tables, { id: Date.now(), table_number: newTableNumber, capacity: Number(newCapacity), status: 'available' }]);
    }
    setIsModalOpen(false);
    setNewTableNumber('');
  };

  const statusColorMap = {
    available: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      badge: 'bg-emerald-100 text-emerald-800',
      label: 'Tersedia',
    },
    occupied: {
      bg: 'bg-rose-50 border-rose-200 text-rose-900',
      badge: 'bg-rose-100 text-rose-800',
      label: 'Terisi',
    },
    reserved: {
      bg: 'bg-amber-50 border-amber-200 text-amber-900',
      badge: 'bg-amber-100 text-amber-800',
      label: 'Reservasi',
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Grid className="w-5 h-5 text-amber-500" />
            <span>Manajemen Meja & Keterisian</span>
          </h2>
          <p className="text-xs text-slate-500">Visualisasi denah meja cafe dan kontrol status ketersediaan.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition-colors self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Meja Baru</span>
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs font-medium text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
        <span className="text-slate-400 font-normal">Keterangan:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
          <span>Tersedia</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-rose-500"></span>
          <span>Terisi (Occupied)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500"></span>
          <span>Dipesan (Reserved)</span>
        </div>
      </div>

      {/* Table Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {tables.map((table) => {
          const config = statusColorMap[table.status] || statusColorMap.available;
          return (
            <div
              key={table.id}
              className={`rounded-2xl border p-5 flex flex-col justify-between transition-all shadow-xs ${config.bg}`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-extrabold text-base">{table.table_number}</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${config.badge}`}>
                    {config.label}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs opacity-80 mb-4">
                  <Users className="w-4 h-4" />
                  <span>Kapasitas {table.capacity} Kursi</span>
                </div>
              </div>

              {/* Status Switcher Actions */}
              <div className="pt-3 border-t border-black/5 flex gap-1.5 text-[11px]">
                <button
                  onClick={() => handleUpdateStatus(table.id, 'available')}
                  className={`flex-1 py-1 rounded-lg font-semibold transition-colors ${
                    table.status === 'available'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white/80 hover:bg-white text-slate-700'
                  }`}
                >
                  Kosong
                </button>
                <button
                  onClick={() => handleUpdateStatus(table.id, 'occupied')}
                  className={`flex-1 py-1 rounded-lg font-semibold transition-colors ${
                    table.status === 'occupied'
                      ? 'bg-rose-600 text-white'
                      : 'bg-white/80 hover:bg-white text-slate-700'
                  }`}
                >
                  Terisi
                </button>
                <button
                  onClick={() => handleUpdateStatus(table.id, 'reserved')}
                  className={`flex-1 py-1 rounded-lg font-semibold transition-colors ${
                    table.status === 'reserved'
                      ? 'bg-amber-600 text-white'
                      : 'bg-white/80 hover:bg-white text-slate-700'
                  }`}
                >
                  Booking
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Tambah Meja */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">Tambah Meja Baru</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTable} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor / Nama Meja</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Meja 09 atau VIP 02"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kapasitas (Kursi)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors mt-2"
              >
                Simpan Meja
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
