const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '');

const IMAGE_ALIASES = {
  'kopi-susu-aren': 'kopi-susu-gula-aren',
  'nasi-goreng-kampung': 'nasi-goreng-kampung-spesial',
};

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

export const getMenuImage = (menu, categories = []) => {
  if (menu.image_path) return resolveImageUrl(menu.image_path);

  const slug = toSlug(menu.name);
  if (slug) {
    return `/menu-images/${IMAGE_ALIASES[slug] || slug}.jpg`;
  }

  const categoryName =
    menu.category?.name ||
    categories.find((cat) => String(cat.id) === String(menu.category_id))?.name ||
    '';
  const normalized = categoryName.toLowerCase();

  if (normalized.includes('coffee') && !normalized.includes('non')) {
    return '/menu-images/coffee-default.jpg';
  }

  return null;
};
