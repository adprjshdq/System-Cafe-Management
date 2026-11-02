const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '');

const STOCK_IMAGE_DIR = '/menu-images';

// Daftar file yang benar-benar tersedia di `frontend/public/menu-images`.
// Tambahkan nama file di sini setiap kali menambah gambar stok baru.
const STOCK_IMAGES = new Set([
  'butter-croissant',
  'caramel-macchiato',
  'coffee-default',
  'crispy-french-fries',
  'espresso-single',
  'iced-americano',
  'kopi-susu-gula-aren',
  'matcha-latte',
  'nasi-goreng-kampung-spesial',
  'signature-chocolate',
  'spaghetti-carbonara',
]);

const IMAGE_ALIASES = {
  'kopi-susu-aren': 'kopi-susu-gula-aren',
  'nasi-goreng-kampung': 'nasi-goreng-kampung-spesial',
};

// Gambar cadangan ketika menu tidak punya foto upload dan tidak ada gambar stok
// yang cocok dengan namanya.
const CATEGORY_DEFAULT_IMAGES = {
  coffee: 'coffee-default',
  kopi: 'coffee-default',
  'non-coffee': 'matcha-latte',
  noncoffee: 'matcha-latte',
  tea: 'matcha-latte',
  'main-course': 'nasi-goreng-kampung-spesial',
  maincourse: 'nasi-goreng-kampung-spesial',
  food: 'nasi-goreng-kampung-spesial',
  makanan: 'nasi-goreng-kampung-spesial',
  snacks: 'butter-croissant',
  snack: 'butter-croissant',
  pastry: 'butter-croissant',
  dessert: 'butter-croissant',
};

const DEFAULT_MENU_IMAGE = 'coffee-default';

export const toSlug = (value = '') =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const resolveImageUrl = (path) => {
  if (!path) return null;
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return `${API_ORIGIN}${path}`;
};

const getStockImage = (name) => {
  if (!name || !STOCK_IMAGES.has(name)) return null;
  return `${STOCK_IMAGE_DIR}/${name}.jpg`;
};

const findCategory = (menu, categories = []) =>
  menu.category ||
  categories.find((cat) => String(cat.id) === String(menu.category_id)) ||
  null;

// Tingkat 2: gambar stok berdasarkan nama menu (mis. "Espresso Single").
export const getStockImageByName = (menu) => {
  const slug = toSlug(menu?.name);
  return getStockImage(IMAGE_ALIASES[slug] || slug);
};

// Tingkat 3: gambar default berdasarkan kategori menu.
export const getCategoryImage = (menu, categories = []) => {
  const category = findCategory(menu, categories);
  const key = toSlug(category?.slug || category?.name || '');

  if (key && CATEGORY_DEFAULT_IMAGES[key]) {
    return getStockImage(CATEGORY_DEFAULT_IMAGES[key]);
  }

  if (key.includes('coffee') || key.includes('kopi')) {
    return getStockImage('coffee-default');
  }

  if (key.includes('main') || key.includes('course') || key.includes('food') || key.includes('makan')) {
    return getStockImage('nasi-goreng-kampung-spesial');
  }

  if (
    key.includes('snack') ||
    key.includes('pastry') ||
    key.includes('dessert') ||
    key.includes('cake')
  ) {
    return getStockImage('butter-croissant');
  }

  return getStockImage(DEFAULT_MENU_IMAGE);
};

/**
 * Daftar URL gambar menu berurutan sesuai prioritas:
 * 1. Foto hasil upload (image_path)
 * 2. Gambar stok berdasarkan nama/slug menu
 * 3. Gambar default berdasarkan kategori
 * 4. (kosong) -> pemanggil menampilkan ikon
 */
export const getMenuImageCandidates = (menu, categories = []) => {
  if (!menu) return [];

  const candidates = [];
  const push = (url) => {
    if (url && !candidates.includes(url)) candidates.push(url);
  };

  // Tingkat 1: foto upload.
  push(resolveImageUrl(menu.image_path));

  // Tingkat 2: gambar stok sesuai nama menu.
  push(getStockImageByName(menu));

  // Tingkat 3: gambar default per kategori.
  push(getCategoryImage(menu, categories));

  return candidates;
};

export const getMenuImage = (menu, categories = []) =>
  getMenuImageCandidates(menu, categories)[0] || null;
