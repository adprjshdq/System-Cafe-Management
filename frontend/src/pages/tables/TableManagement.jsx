import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Armchair,
  CheckCircle2,
  Clock,
  LayoutGrid,
  Plus,
  RefreshCw,
  Users,
  X,
} from 'lucide-react';
import api from '../../services/api';
import TableTile from './TableTile';
import TableDetailPanel from './TableDetailPanel';
import AddTableDialog from './AddTableDialog';
import {
  AREA_IMAGE,
  AREA_META,
  TABLE_STATUS,
  getActiveOrders,
  getTableArea,
} from './tableUtils';

const minutesAgo = (minutes) =>
  new Date(Date.now() - minutes * 60 * 1000).toISOString();

const sampleOrders = {
  2: [
    {
      id: 9101,
      order_number: 'ORD-DEMO-02',
      status: 'processing',
      customer_name: 'Rani',
      order_type: 'dine-in',
      total_amount: 76000,
      created_at: minutesAgo(18),
    },
  ],
  3: [
    {
      id: 9102,
      order_number: 'ORD-DEMO-03',
      status: 'pending',
      customer_name: 'Bagas',
      order_type: 'dine-in',
      total_amount: 54000,
      created_at: minutesAgo(7),
    },
  ],
  7: [
    {
      id: 9103,
      order_number: 'ORD-DEMO-07',
      status: 'ready',
      customer_name: 'Keluarga Sari',
      order_type: 'dine-in',
      total_amount: 248000,
      created_at: minutesAgo(41),
    },
  ],
};

const sampleTables = [
  { id: 1, table_number: 'Meja 01', capacity: 2, area: 'indoor', status: 'available', orders: [] },
  { id: 2, table_number: 'Meja 02', capacity: 2, area: 'indoor', status: 'occupied', orders: sampleOrders[2] },
  { id: 3, table_number: 'Meja 03', capacity: 4, area: 'indoor', status: 'occupied', orders: sampleOrders[3] },
  { id: 4, table_number: 'Meja 04', capacity: 4, area: 'indoor', status: 'available', orders: [] },
  { id: 5, table_number: 'Meja 05', capacity: 6, area: 'indoor', status: 'reserved', orders: [] },
  { id: 6, table_number: 'Meja 06', capacity: 6, area: 'indoor', status: 'available', orders: [] },
  { id: 7, table_number: 'Meja VIP 1', capacity: 8, area: 'indoor', status: 'occupied', orders: sampleOrders[7] },
  { id: 8, table_number: 'Outdoor 01', capacity: 4, area: 'outdoor', status: 'available', orders: [] },
  { id: 9, table_number: 'Outdoor 02', capacity: 2, area: 'outdoor', status: 'reserved', orders: [] },
];

const AREA_ACCENT = {
  indoor: {
    icon: 'bg-amber-100 text-amber-700',
    ring: 'border-amber-200/70',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  outdoor: {
    icon: 'bg-emerald-100 text-emerald-700',
    ring: 'border-emerald-200/70',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
};

const tileSpan = (table) =>
  Number(table.capacity) >= 6 ? 'sm:col-span-2' : '';

function FloorZone({ area, tables, selectedId, now, onSelect }) {
  const meta = AREA_META[area];
  const accent = AREA_ACCENT[area];
  const seats = tables.reduce((total, table) => total + (Number(table.capacity) || 0), 0);
  const busy = tables.filter((table) => table.status !== 'available').length;

  return (
    <section
      aria-label={`Area ${meta.label}`}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent.icon}`}>
            <img
              src={AREA_IMAGE[area]}
              alt=""
              aria-hidden="true"
              className="h-6 w-6 object-contain"
            />
          </span>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Area {meta.label}</h3>
            <p className="text-[10px] text-slate-500">{meta.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${accent.badge}`}
          >
            {tables.length} meja · {seats} kursi
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
            {busy} terpakai
          </span>
        </div>
      </div>

      <div className={`floor-grid m-3 rounded-xl border bg-slate-50/70 p-3 ${accent.ring}`}>
        {tables.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {tables.map((table) => (
              <TableTile
                key={table.id}
                table={table}
                selected={selectedId === table.id}
                now={now}
                onSelect={onSelect}
                className={tileSpan(table)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-1.5 px-4 py-8 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-300 shadow-xs">
              <Armchair className="h-5 w-5" />
            </span>
            <p className="text-xs font-bold text-slate-700">Belum ada meja di area ini</p>
            <p className="max-w-xs text-[10px] leading-relaxed text-slate-500">
              Tambahkan meja baru dan pilih area {meta.label} agar tampil di denah.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function StatCard({ label, value, hint, icon: Icon, iconSrc, tone }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <p className="mt-1 text-2xl font-extrabold leading-none text-slate-900">{value}</p>
        </div>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}>
          {iconSrc && !imageFailed ? (
            <img
              src={iconSrc}
              alt=""
              aria-hidden="true"
              onError={() => setImageFailed(true)}
              className="h-6 w-6 object-contain"
            />
          ) : (
            <Icon className="h-4 w-4" />
          )}
        </span>
      </div>
      <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">{hint}</p>
    </div>
  );
}

export default function TableManagement() {
  const [tables, setTables] = useState(sampleTables);
  const [selectedId, setSelectedId] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  const fetchTables = useCallback(async () => {
    try {
      const response = await api.get('/v1/tables');
      if (Array.isArray(response.data?.data)) {
        setTables(response.data.data);
      }
    } catch (error) {
      console.warn('API meja tidak tersedia, menggunakan denah contoh:', error);
    }
  }, []);

  useEffect(() => {
    fetchTables();
    const timer = setInterval(fetchTables, 30000);
    return () => clearInterval(timer);
  }, [fetchTables]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!selectedId) return undefined;
    const handleKey = (event) => {
      if (event.key === 'Escape') setSelectedId(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedId]);

  const showToast = (type, message) => setToast({ id: Date.now(), type, message });

  const stats = useMemo(() => {
    const seats = tables.reduce((total, table) => total + (Number(table.capacity) || 0), 0);
    return {
      total: tables.length,
      seats,
      available: tables.filter((table) => table.status === 'available').length,
      occupied: tables.filter((table) => table.status === 'occupied').length,
      reserved: tables.filter((table) => table.status === 'reserved').length,
    };
  }, [tables]);

  const grouped = useMemo(
    () => ({
      indoor: tables.filter((table) => getTableArea(table) === 'indoor'),
      outdoor: tables.filter((table) => getTableArea(table) === 'outdoor'),
    }),
    [tables]
  );

  const selectedTable = useMemo(
    () => tables.find((table) => table.id === selectedId) || null,
    [tables, selectedId]
  );

  const selectedOrders = selectedTable ? getActiveOrders(selectedTable) : [];
  const firstOrderId = selectedOrders[0]?.id ?? null;

  useEffect(() => {
    if (!selectedTable || !firstOrderId) {
      setOrderDetail(null);
      setLoadingOrder(false);
      return undefined;
    }

    let active = true;
    setLoadingOrder(true);

    api
      .get(`/v1/orders/${firstOrderId}`)
      .then((response) => {
        if (active) setOrderDetail(response.data?.data || selectedOrders[0]);
      })
      .catch(() => {
        // Backend tidak menjangkau detail; tampilkan ringkasan dari daftar meja.
        if (active) setOrderDetail(selectedOrders[0]);
      })
      .finally(() => {
        if (active) setLoadingOrder(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstOrderId, selectedTable?.id]);

  const handleSelect = (table) => setSelectedId(table.id);

  const handleStatusChange = async (table, status) => {
    if (table.status === status) return;

    const previousStatus = table.status;
    setUpdatingStatus({ id: table.id, status });
    setTables((previous) =>
      previous.map((item) => (item.id === table.id ? { ...item, status } : item))
    );

    try {
      await api.patch(`/v1/tables/${table.id}/status`, { status });
      showToast(
        'success',
        `${table.table_number} diperbarui menjadi ${TABLE_STATUS[status].label}.`
      );
    } catch (error) {
      if (error.response) {
        setTables((previous) =>
          previous.map((item) =>
            item.id === table.id ? { ...item, status: previousStatus } : item
          )
        );
        showToast(
          'error',
          error.response.data?.message || 'Gagal memperbarui status meja.'
        );
      } else {
        showToast('success', 'Status diperbarui secara lokal (mode demo).');
      }
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTables();
    setRefreshing(false);
    showToast('success', 'Denah meja berhasil disegarkan.');
  };

  const handleAddTable = async (payload) => {
    try {
      const response = await api.post('/v1/tables', {
        ...payload,
        status: 'available',
      });
      await fetchTables();
      if (response.data?.data?.id) setSelectedId(response.data.data.id);
      showToast('success', `Meja ${payload.table_number} berhasil ditambahkan.`);
    } catch (error) {
      if (error.response) throw error;

      const localTable = {
        id: Date.now(),
        status: 'available',
        orders: [],
        ...payload,
      };
      setTables((previous) => [...previous, localTable]);
      setSelectedId(localTable.id);
      showToast('success', 'Meja ditambahkan secara lokal (mode demo).');
    }
  };

  const detailPanel = selectedTable && (
    <TableDetailPanel
      table={selectedTable}
      order={loadingOrder ? null : orderDetail}
      loadingOrder={loadingOrder}
      now={now}
      updatingStatus={updatingStatus?.id === selectedTable.id ? updatingStatus.status : null}
      onStatusChange={handleStatusChange}
      onClose={() => setSelectedId(null)}
    />
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <img
              src="/denah_meja.png"
              alt="Icon Denah Meja"
              className="h-7 w-7 object-contain"
            />
            <span>Denah Meja</span>
          </h2>
          <p className="text-xs text-slate-500">
            Denah visual area indoor & outdoor dengan status, kapasitas, dan durasi pemakaian.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Segarkan
          </button>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#77422D] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition-colors hover:bg-[#653724] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#77422D] focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            Tambah Meja
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total Meja"
          value={stats.total}
          hint={`${stats.seats} kursi di ${grouped.indoor.length > 0 && grouped.outdoor.length > 0 ? '2 area' : 'denah'}`}
          icon={Armchair}
          iconSrc="/denah_meja.png"
          tone="bg-slate-0 text-slate-600"
        />
        <StatCard
          label="Tersedia"
          value={stats.available}
          hint="Meja kosong siap dipakai"
          icon={CheckCircle2}
          iconSrc="/icon_ceklis.png"
          tone="bg-emerald-0 text-emerald-700"
        />
        <StatCard
          label="Terisi"
          value={stats.occupied}
          hint="Ada tamu / pesanan aktif"
          icon={Users}
          iconSrc="/icon_user.png"
          tone="bg-rose-0 text-rose-700"
        />
        <StatCard
          label="Reservasi"
          value={stats.reserved}
          hint="Menunggu tamu booking"
          icon={Clock}
          iconSrc="/icon_waktu.png"
          tone="bg-amber-0 text-amber-700"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <div className="space-y-4">
          {/* Legend */}
          <section
            aria-label="Keterangan status meja"
            className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs"
          >
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Keterangan
              </span>
              {Object.entries(TABLE_STATUS).map(([value, meta]) => (
                <span key={value} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                  <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                  {meta.label}
                  <span className="text-slate-400">
                    · {stats[value] ?? 0} meja
                  </span>
                </span>
              ))}
              <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-400 sm:ml-auto">
                <Clock className="h-3 w-3" />
                Durasi dihitung dari pesanan aktif pertama
              </span>
            </div>
          </section>

          <FloorZone
            area="indoor"
            tables={grouped.indoor}
            selectedId={selectedId}
            now={now}
            onSelect={handleSelect}
          />
          <FloorZone
            area="outdoor"
            tables={grouped.outdoor}
            selectedId={selectedId}
            now={now}
            onSelect={handleSelect}
          />
        </div>

        {/* Panel detail desktop */}
        <aside className="hidden xl:sticky xl:top-6 xl:block">
          {detailPanel || (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center shadow-xs">
              <span className="mx-auto flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                <img
                  src="/denah_meja.png"
                  alt="Kursi"
                  className="h-full w-full object-cover"
                />
              </span>
              <p className="mt-2 text-sm font-bold text-slate-800">Pilih meja pada denah</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Klik salah satu meja untuk melihat status, durasi pemakaian, dan detail
                pesanan aktif.
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* Bottom sheet mobile */}
      {selectedTable && (
        <div className="fixed inset-0 z-[60] xl:hidden">
          <div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={() => setSelectedId(null)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Detail ${selectedTable.table_number}`}
            className="animate-dialog-pop absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto rounded-t-3xl bg-slate-100 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl"
          >
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-slate-300" />
            {detailPanel}
          </div>
        </div>
      )}

      {addOpen && (
        <AddTableDialog onClose={() => setAddOpen(false)} onSave={handleAddTable} />
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
