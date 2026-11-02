import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  Flame,
  AlertTriangle,
  RefreshCw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Bell,
  ArrowRight,
  UtensilsCrossed,
  X,
  Timer,
} from 'lucide-react';
import api from '../../services/api';

const THRESHOLDS = {
  pending: { warning: 8 * 60, late: 15 * 60 },
  processing: { warning: 8 * 60, late: 15 * 60 },
  ready: { warning: 4 * 60, late: 8 * 60 },
};

const STATUS_META = {
  pending: {
    title: 'Pesanan Masuk',
    hint: 'Belum dikerjakan',
    header: 'bg-rose-600',
    headerText: 'text-white',
    count: 'bg-white/20 text-white',
  },
  processing: {
    title: 'Sedang Dimasak / Diseduh',
    hint: 'Dalam pengerjaan',
    header: 'bg-amber-500',
    headerText: 'text-slate-950',
    count: 'bg-slate-950/20 text-slate-950',
  },
  ready: {
    title: 'Siap Disajikan',
    hint: 'Menunggu diambil pelayan',
    header: 'bg-emerald-600',
    headerText: 'text-white',
    count: 'bg-white/20 text-white',
  },
};

const URGENCY = {
  ontime: {
    border: 'border-l-emerald-500',
    badge: null,
    label: 'Normal',
  },
  warning: {
    border: 'border-l-amber-500',
    badge: 'Perhatian',
    label: 'Perhatian',
  },
  late: {
    border: 'border-l-rose-600',
    badge: 'Prioritas Tinggi',
    label: 'Terlambat',
  },
};

const initialSampleOrders = [
  {
    id: 101,
    order_number: 'INV-20261009-8812',
    customer_name: 'Bpk. Dimas',
    order_type: 'dine_in',
    status: 'pending',
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
    table: { table_number: 'Meja 03' },
    items: [
      { id: 1, name: 'Caramel Macchiato', quantity: 2, notes: 'Less sugar, Extra hot' },
      { id: 2, name: 'Crispy French Fries', quantity: 1, notes: 'Saus terpisah' },
    ],
  },
  {
    id: 102,
    order_number: 'INV-20261009-9134',
    customer_name: 'Ibu Sarah',
    order_type: 'takeaway',
    status: 'processing',
    created_at: new Date(Date.now() - 12 * 60000).toISOString(),
    table: null,
    items: [
      { id: 3, name: 'Matcha Latte', quantity: 1, notes: 'Oat milk' },
      { id: 4, name: 'Butter Croissant', quantity: 2, notes: 'Hangatkan' },
    ],
  },
  {
    id: 103,
    order_number: 'INV-20261009-7741',
    customer_name: 'Andi',
    order_type: 'dine_in',
    status: 'ready',
    created_at: new Date(Date.now() - 20 * 60000).toISOString(),
    table: { table_number: 'Meja 01' },
    items: [
      { id: 5, name: 'Iced Americano', quantity: 1, notes: null },
      { id: 6, name: 'Nasi Goreng Kampung', quantity: 1, notes: 'Pedas sedang' },
    ],
  },
];

function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  const pad = (value) => String(value).padStart(2, '0');

  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(rest)}`;
  return `${pad(minutes)}:${pad(rest)}`;
}

function formatClock(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export default function KitchenDisplay() {
  const [orders, setOrders] = useState(initialSampleOrders);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem('kds_sound') !== 'off');
  const [kiosk, setKiosk] = useState(false);
  const [newOrders, setNewOrders] = useState([]);

  const knownIdsRef = useRef(null);
  const soundOnRef = useRef(soundOn);
  const audioRef = useRef(null);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    soundOnRef.current = soundOn;
    localStorage.setItem('kds_sound', soundOn ? 'on' : 'off');
  }, [soundOn]);

  // Jam & timer berjalan setiap detik
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Mode monitor: kunci scroll halaman & keluar dengan Esc
  useEffect(() => {
    if (!kiosk) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKey = (event) => {
      if (event.key === 'Escape') setKiosk(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [kiosk]);

  useEffect(
    () => () => {
      clearTimeout(toastTimerRef.current);
      if (audioRef.current) audioRef.current.close();
    },
    []
  );

  const playChime = useCallback(() => {
    if (!soundOnRef.current) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      if (!audioRef.current) audioRef.current = new AudioContextClass();
      const ctx = audioRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const start = ctx.currentTime;
      [880, 1174.66].forEach((frequency, index) => {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        const at = start + index * 0.18;
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, at);
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(0.22, at + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.34);
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start(at);
        oscillator.stop(at + 0.36);
      });
    } catch (error) {
      console.warn('Notifikasi suara tidak dapat diputar:', error);
    }
  }, []);

  const announceNewOrders = useCallback(
    (freshOrders) => {
      playChime();
      clearTimeout(toastTimerRef.current);
      setNewOrders(freshOrders);
      toastTimerRef.current = setTimeout(() => setNewOrders([]), 12000);
    },
    [playChime]
  );

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/v1/orders', { params: { per_page: 50 } });
      const list = res.data?.data?.data;
      if (Array.isArray(list)) {
        const active = list
          .filter((order) => ['pending', 'processing', 'ready'].includes(order.status))
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        const ids = new Set(active.map((order) => order.id));
        if (knownIdsRef.current) {
          const fresh = active.filter((order) => !knownIdsRef.current.has(order.id));
          if (fresh.length > 0) announceNewOrders(fresh);
        }
        knownIdsRef.current = ids;
        setOrders(active);
      }
    } catch (error) {
      console.warn('API tidak tersedia, menampilkan contoh pesanan dapur:', error);
    } finally {
      setLoading(false);
    }
  }, [announceNewOrders]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000); // Polling antrean setiap 15 detik
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/v1/orders/${orderId}/status`, { status: newStatus });
    } catch (error) {
      console.warn('Backend tidak tersedia, status diperbarui secara lokal:', error);
    }
    setOrders((prev) =>
      prev
        .map((order) => (order.id === orderId ? { ...order, status: newStatus } : order))
        .filter((order) => !['completed', 'cancelled'].includes(order.status))
    );
  };

  const elapsedOf = useCallback(
    (order) => Math.max(0, Math.floor((now - new Date(order.created_at).getTime()) / 1000)),
    [now]
  );

  const urgencyOf = useCallback(
    (order) => {
      const threshold = THRESHOLDS[order.status] || THRESHOLDS.pending;
      const elapsed = elapsedOf(order);
      if (elapsed >= threshold.late) return 'late';
      if (elapsed >= threshold.warning) return 'warning';
      return 'ontime';
    },
    [elapsedOf]
  );

  const sortedOrders = useMemo(
    () => [...orders].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
    [orders]
  );

  const pendingOrders = useMemo(
    () => sortedOrders.filter((order) => order.status === 'pending'),
    [sortedOrders]
  );
  const processingOrders = useMemo(
    () => sortedOrders.filter((order) => order.status === 'processing'),
    [sortedOrders]
  );
  const readyOrders = useMemo(
    () => sortedOrders.filter((order) => order.status === 'ready'),
    [sortedOrders]
  );

  const lateCount = orders.filter((order) => urgencyOf(order) === 'late').length;
  const warningCount = orders.filter((order) => urgencyOf(order) === 'warning').length;
  const averageWait = orders.length
    ? Math.round(orders.reduce((total, order) => total + elapsedOf(order), 0) / orders.length)
    : 0;

  const clock = new Date(now).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const today = new Date(now).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const renderCard = (order) => {
    const urgency = urgencyOf(order);
    const elapsed = elapsedOf(order);
    const urgencyMeta = URGENCY[urgency];

    const cardClass = 'border-slate-200 bg-white shadow-xs';
    const glowClass =
      urgency === 'late'
        ? 'animate-kds-urgent ring-2 ring-rose-500/60'
        : urgency === 'warning'
          ? 'ring-1 ring-amber-400/50'
          : '';
    const timerColor = {
      ontime: 'text-slate-900',
      warning: 'text-amber-600',
      late: 'text-rose-600',
    }[urgency];
    const mutedText = 'text-slate-500';
    const strongText = 'text-slate-900';
    const divider = 'border-slate-100';
    const itemBox = 'bg-slate-50';
    const qtyBox = 'bg-amber-100 text-amber-800';
    const notesBox = 'bg-rose-50 text-rose-600';
    const typeBadge = 'bg-slate-100 text-slate-700';

    return (
      <article
        key={order.id}
        className={`rounded-xl border border-l-4 ${cardClass} ${urgencyMeta.border} ${glowClass} p-3.5 xl:p-4`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`font-mono font-bold tracking-tight ${strongText} ${kiosk ? 'text-sm xl:text-base' : 'text-xs'
                  }`}
              >
                {order.order_number}
              </span>
              {urgencyMeta.badge && (
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${urgency === 'late'
                      ? 'bg-rose-600 text-white'
                      : 'bg-amber-400 text-slate-950'
                    }`}
                >
                  <AlertTriangle className="h-3 w-3" />
                  {urgencyMeta.badge}
                </span>
              )}
            </div>
            <p className={`mt-1 truncate font-bold ${strongText} ${kiosk ? 'text-lg xl:text-2xl' : 'text-sm'}`}>
              {order.customer_name || 'Tanpa Nama'}
            </p>
            <div className={`mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] ${mutedText}`}>
              <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-semibold ${typeBadge}`}>
                <UtensilsCrossed className="h-3 w-3" />
                {order.order_type === 'dine_in'
                  ? order.table?.table_number || 'Dine-In'
                  : 'Takeaway'}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Masuk {formatClock(order.created_at)}
              </span>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <p
              className={`font-mono font-extrabold tabular-nums ${timerColor} ${kiosk ? 'text-3xl xl:text-5xl' : 'text-2xl'
                }`}
              aria-label={`Durasi ${urgencyMeta.label}: ${formatDuration(elapsed)}`}
            >
              {formatDuration(elapsed)}
            </p>
            <p className={`mt-0.5 text-[10px] font-semibold uppercase tracking-wider ${mutedText}`}>
              {order.status === 'pending'
                ? 'Menunggu'
                : order.status === 'processing'
                  ? 'Diproses'
                  : 'Siap'}
            </p>
          </div>
        </div>

        <div className={`mt-3 space-y-1.5 border-t pt-3 ${divider}`}>
          {order.items?.map((item, index) => (
            <div
              key={item.id || index}
              className={`flex items-start gap-2.5 rounded-lg p-2 ${itemBox}`}
            >
              <span
                className={`shrink-0 rounded-md px-1.5 py-0.5 font-extrabold tabular-nums ${qtyBox} ${kiosk ? 'text-base xl:text-lg' : 'text-xs'
                  }`}
              >
                {item.quantity}x
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={`font-bold leading-snug ${strongText} ${kiosk ? 'text-sm xl:text-lg' : 'text-xs'
                    }`}
                >
                  {item.name || item.menu?.name || 'Item Menu'}
                </p>
                {item.notes && (
                  <p
                    className={`mt-1 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold leading-snug xl:text-xs ${notesBox}`}
                  >
                    Catatan: {item.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3">
          {order.status === 'pending' && (
            <button
              type="button"
              onClick={() => updateOrderStatus(order.id, 'processing')}
              className={`flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 font-extrabold text-white transition-colors hover:bg-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 active:scale-[0.99] ${kiosk ? 'py-3 text-sm xl:py-4 xl:text-lg' : 'py-2.5 text-xs'
                }`}
            >
              <Flame className={kiosk ? 'h-5 w-5' : 'h-4 w-4'} />
              <span>Mulai Kerjakan</span>
              <ArrowRight className={kiosk ? 'h-5 w-5' : 'h-4 w-4'} />
            </button>
          )}
          {order.status === 'processing' && (
            <button
              type="button"
              onClick={() => updateOrderStatus(order.id, 'ready')}
              className={`flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 font-extrabold text-slate-950 transition-colors hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 active:scale-[0.99] ${kiosk ? 'py-3 text-sm xl:py-4 xl:text-lg' : 'py-2.5 text-xs'
                }`}
            >
              <CheckCircle2 className={kiosk ? 'h-5 w-5' : 'h-4 w-4'} />
              <span>Siap Disajikan</span>
            </button>
          )}
          {order.status === 'ready' && (
            <button
              type="button"
              onClick={() => updateOrderStatus(order.id, 'completed')}
              className={`flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 font-extrabold text-white transition-colors hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 active:scale-[0.99] ${kiosk ? 'py-3 text-sm xl:py-4 xl:text-lg' : 'py-2.5 text-xs'
                }`}
            >
              <CheckCircle2 className={kiosk ? 'h-5 w-5' : 'h-4 w-4'} />
              <span>Selesaikan Pesanan</span>
            </button>
          )}
        </div>
      </article>
    );
  };

  const renderColumn = (status, list) => {
    const meta = STATUS_META[status];
    return (
      <section
        key={status}
        className={`flex flex-col overflow-hidden rounded-2xl border ${'border-slate-200 bg-slate-100/80'
          }`}
      >
        <header className={`flex items-center justify-between gap-2 px-3.5 py-2.5 xl:px-4 xl:py-3 ${meta.header}`}>
          <div className="min-w-0">
            <h3
              className={`truncate font-extrabold ${meta.headerText} ${kiosk ? 'text-base xl:text-xl' : 'text-sm'
                }`}
            >
              {meta.title}
            </h3>
            <p className={`truncate text-[10px] font-medium opacity-80 ${meta.headerText} xl:text-xs`}>
              {meta.hint}
            </p>
          </div>
          <span
            className={`flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full px-2 font-extrabold tabular-nums ${meta.count} ${kiosk ? 'text-base xl:h-9 xl:min-w-9 xl:text-lg' : 'text-xs'
              }`}
          >
            {list.length}
          </span>
        </header>

        <div
          className={`space-y-2.5 p-2.5 xl:p-3 ${kiosk ? 'max-h-[calc(100dvh-14rem)] overflow-y-auto' : ''
            }`}
        >
          {list.length === 0 ? (
            <div
              className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed px-3 py-8 text-center ${'border-slate-300 text-slate-400'
                }`}
            >
              <CheckCircle2 className={kiosk ? 'h-7 w-7' : 'h-6 w-6'} />
              <p className={`font-semibold ${kiosk ? 'text-sm' : 'text-xs'}`}>
                {status === 'pending'
                  ? 'Tidak ada pesanan baru'
                  : status === 'processing'
                    ? 'Tidak ada proses memasak'
                    : 'Belum ada item siap saji'}
              </p>
            </div>
          ) : (
            list.map(renderCard)
          )}
        </div>
      </section>
    );
  };

  const soundButton = (
    <button
      type="button"
      onClick={() => {
        const nextSoundOn = !soundOn;
        setSoundOn(nextSoundOn);
        soundOnRef.current = nextSoundOn;
        if (nextSoundOn) playChime();
      }}
      aria-pressed={soundOn}
      aria-label={soundOn ? 'Matikan suara notifikasi' : 'Aktifkan suara notifikasi'}
      className={
        `flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition-colors ${soundOn
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
        }`
      }
    >
      {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      <span className="hidden sm:inline">{soundOn ? 'Suara Aktif' : 'Suara Mati'}</span>
    </button>
  );

  const refreshButton = (
    <button
      type="button"
      onClick={fetchOrders}
      aria-label="Segarkan antrean"
      className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50"
    >
      <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      <span className="hidden sm:inline">Segarkan</span>
    </button>
  );

  const board = (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 md:grid-cols-3 xl:gap-4">
      {renderColumn('pending', pendingOrders)}
      {renderColumn('processing', processingOrders)}
      {renderColumn('ready', readyOrders)}
    </div>
  );

  return (
    <>
      {newOrders.length > 0 && (
        <div
          role="status"
          aria-live="assertive"
          className="animate-kds-toast fixed right-3 top-3 z-[60] w-[min(23rem,calc(100vw-1.5rem))] sm:right-4 sm:top-4"
        >
          <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-white p-3.5 shadow-2xl shadow-slate-900/20">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-slate-950">
              <Bell className="animate-kds-bell h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-slate-900">
                {newOrders.length} pesanan baru masuk!
              </p>
              <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">
                {newOrders
                  .slice(0, 3)
                  .map((order) => order.order_number)
                  .join(' · ')}
                {newOrders.length > 3 ? ` · +${newOrders.length - 3} lainnya` : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setNewOrders([])}
              aria-label="Tutup notifikasi"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {kiosk ? (
        <div className="fixed inset-0 z-50 flex min-h-0 flex-col gap-3 overflow-hidden bg-white p-3 sm:p-4 xl:gap-4 xl:p-6">
          <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20">
                <ChefHat className="h-6 w-6" />
              </span>
              <div>
                <p className="text-lg font-extrabold leading-tight text-slate-900 xl:text-2xl">
                  Kitchen Display
                </p>
                <p className="text-[11px] font-medium text-slate-500 xl:text-sm">
                  Aroma Cafe · Layar Dapur
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 xl:gap-3">
              <span className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 xl:text-sm">
                <Timer className="h-4 w-4 text-slate-400" />
                {orders.length} aktif
              </span>
              <span
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold xl:text-sm ${lateCount > 0
                    ? 'border-rose-300 bg-rose-50 text-rose-600'
                    : 'border-slate-200 bg-slate-50 text-slate-400'
                  }`}
              >
                <AlertTriangle className="h-4 w-4" />
                {lateCount} terlambat
              </span>
              <span
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold xl:text-sm ${warningCount > 0
                    ? 'border-amber-300 bg-amber-50 text-amber-600'
                    : 'border-slate-200 bg-slate-50 text-slate-400'
                  }`}
              >
                <Clock className="h-4 w-4" />
                {warningCount} perhatian
              </span>

              <div className="hidden text-right lg:block">
                <p className="font-mono text-2xl font-extrabold tabular-nums text-slate-900 xl:text-3xl">
                  {clock}
                </p>
                <p className="text-[11px] font-medium capitalize text-slate-500">{today}</p>
              </div>

              {soundButton}
              {refreshButton}
              <button
                type="button"
                onClick={() => setKiosk(false)}
                className="flex h-10 items-center gap-2 rounded-xl bg-amber-500 px-3 text-xs font-extrabold text-slate-950 transition-colors hover:bg-amber-400"
              >
                <Minimize2 className="h-4 w-4" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          </header>

          {board}

          <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] font-semibold text-slate-500 xl:text-xs">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Normal
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> Perhatian &ge; 8 mnt (siap saji 4 mnt)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-600" /> Terlambat &ge; 15 mnt (siap saji 8 mnt)
            </span>
            <span className="text-slate-600">Tekan Esc untuk keluar</span>
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
                <img
                  src="./public/kitchen.png"
                  alt="Icon kitchen"
                  className="h-7 w-7 object-contain"
                />
                <span>Kitchen Display</span>
              </h2>
              <p className="text-xs text-slate-500">
                Pantau antrean, durasi tunggu, dan prioritas pesanan dapur secara real-time.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {soundButton}
              {refreshButton}
              <button
                type="button"
                onClick={() => setKiosk(true)}
                className="flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-3.5 text-xs font-extrabold text-white transition-colors hover:bg-slate-800"
              >
                <Maximize2 className="h-4 w-4" />
                <span>Mode Monitor</span>
              </button>
            </div>
          </div>

          {/* Ringkasan durasi & prioritas */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <Timer className="h-3.5 w-3.5" /> Antrean Aktif
              </p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums text-slate-900">
                {orders.length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <Clock className="h-3.5 w-3.5" /> Rata-rata Tunggu
              </p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums text-slate-900">
                {formatDuration(averageWait)}
              </p>
            </div>
            <div
              className={`rounded-2xl border p-3.5 shadow-xs ${warningCount > 0 ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'
                }`}
            >
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <AlertTriangle className="h-3.5 w-3.5" /> Perhatian
              </p>
              <p
                className={`mt-1 text-2xl font-extrabold tabular-nums ${warningCount > 0 ? 'text-amber-600' : 'text-slate-900'
                  }`}
              >
                {warningCount}
              </p>
            </div>
            <div
              className={`rounded-2xl border p-3.5 shadow-xs ${lateCount > 0 ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white'
                }`}
            >
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <Flame className="h-3.5 w-3.5" /> Terlambat
              </p>
              <p
                className={`mt-1 text-2xl font-extrabold tabular-nums ${lateCount > 0 ? 'text-rose-600' : 'text-slate-900'
                  }`}
              >
                {lateCount}
              </p>
            </div>
          </div>

          {board}

          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-[10px] font-semibold text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Normal
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> Perhatian (8+ mnt, siap saji 4+ mnt)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-600" /> Terlambat (15+ mnt, siap saji 8+ mnt)
            </span>
          </p>
        </div>
      )}
    </>
  );
}
