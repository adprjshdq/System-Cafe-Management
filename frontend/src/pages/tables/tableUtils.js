export const AREA_META = {
  indoor: {
    label: 'Indoor',
    description: 'Ruang dalam ber-AC',
  },
  outdoor: {
    label: 'Outdoor',
    description: 'Teras & area terbuka',
  },
};

export const TABLE_STATUS = {
  available: {
    label: 'Tersedia',
    short: 'Kosong',
    badge: 'bg-emerald-600 text-white',
    tile: 'border-emerald-300 bg-emerald-50/80 hover:bg-emerald-50',
    chair: 'bg-emerald-300',
    text: 'text-emerald-800',
    dot: 'bg-emerald-500',
    soft: 'bg-emerald-100 text-emerald-700',
    hero: 'from-emerald-500 to-emerald-600',
    heroText: 'text-white',
    heroMuted: 'text-white/80',
    focus: 'focus-visible:ring-emerald-400',
    activeButton: 'border-emerald-600 bg-emerald-600 text-white',
  },
  occupied: {
    label: 'Terisi',
    short: 'Terisi',
    badge: 'bg-rose-600 text-white',
    tile: 'border-rose-300 bg-rose-50/80 hover:bg-rose-50',
    chair: 'bg-rose-300',
    text: 'text-rose-800',
    dot: 'bg-rose-500',
    soft: 'bg-rose-100 text-rose-700',
    hero: 'from-rose-500 to-rose-600',
    heroText: 'text-white',
    heroMuted: 'text-white/80',
    focus: 'focus-visible:ring-rose-400',
    activeButton: 'border-rose-600 bg-rose-600 text-white',
  },
  reserved: {
    label: 'Reservasi',
    short: 'Booking',
    badge: 'bg-amber-500 text-slate-950',
    tile: 'border-amber-300 bg-amber-50/80 hover:bg-amber-50',
    chair: 'bg-amber-300',
    text: 'text-amber-800',
    dot: 'bg-amber-500',
    soft: 'bg-amber-100 text-amber-800',
    hero: 'from-amber-400 to-amber-500',
    heroText: 'text-slate-950',
    heroMuted: 'text-slate-900/70',
    focus: 'focus-visible:ring-amber-400',
    activeButton: 'border-amber-500 bg-amber-500 text-slate-950',
  },
};

export const ORDER_STATUS = {
  pending: { label: 'Menunggu', className: 'bg-rose-100 text-rose-700' },
  processing: { label: 'Diproses', className: 'bg-amber-100 text-amber-800' },
  ready: { label: 'Siap Saji', className: 'bg-emerald-100 text-emerald-700' },
  completed: { label: 'Selesai', className: 'bg-slate-100 text-slate-600' },
  cancelled: { label: 'Dibatalkan', className: 'bg-slate-100 text-slate-500' },
};

export function getTableArea(table) {
  if (table?.area === 'outdoor' || table?.area === 'indoor') return table.area;
  return /outdoor|teras|taman/i.test(table?.table_number || '') ? 'outdoor' : 'indoor';
}

export function getActiveOrders(table) {
  if (!Array.isArray(table?.orders)) return [];
  return table.orders.filter((order) =>
    ['pending', 'processing', 'ready'].includes(order.status)
  );
}

export function getOccupiedSince(table) {
  const orders = getActiveOrders(table);
  if (orders.length === 0) return null;

  return orders.reduce((earliest, order) => {
    if (!order.created_at) return earliest;
    if (!earliest) return order.created_at;
    return new Date(order.created_at) < new Date(earliest) ? order.created_at : earliest;
  }, null);
}

export function getElapsedSeconds(since, now) {
  if (!since) return null;
  const start = new Date(since).getTime();
  if (Number.isNaN(start)) return null;
  return Math.max(0, Math.floor((now - start) / 1000));
}

export function formatDuration(totalSeconds) {
  if (totalSeconds === null || totalSeconds === undefined) return '--:--';

  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  const pad = (value) => String(value).padStart(2, '0');

  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(rest)}`;
  return `${pad(minutes)}:${pad(rest)}`;
}

export function humanizeDuration(totalSeconds) {
  if (totalSeconds === null || totalSeconds === undefined) return 'Belum ada data';

  const minutes = Math.floor(Math.max(0, totalSeconds) / 60);
  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} menit`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours} jam ${rest} menit` : `${hours} jam`;
}
