export const getMenuStatus = (menu) => {
  if (!menu) {
    return { disabled: true, label: 'Tidak tersedia', tone: 'slate', stock: null };
  }

  if (!menu.is_available) {
    return { disabled: true, label: 'Tidak tersedia', tone: 'slate', stock: null };
  }

  const stock = typeof menu.stock === 'number' ? menu.stock : null;

  if (stock !== null) {
    if (stock <= 0) {
      return { disabled: true, label: 'Stok habis', tone: 'rose', stock };
    }
    if (stock <= 5) {
      return { disabled: false, label: `Sisa ${stock}`, tone: 'amber', stock };
    }
    return { disabled: false, label: `Stok ${stock}`, tone: 'emerald', stock };
  }

  return { disabled: false, label: 'Tersedia', tone: 'emerald', stock: null };
};

export const STATUS_TONE_CLASSES = {
  emerald: 'bg-white/95 text-emerald-700 border-emerald-200',
  amber: 'bg-white/95 text-amber-700 border-amber-200',
  rose: 'bg-white/95 text-rose-700 border-rose-200',
  slate: 'bg-white/95 text-slate-600 border-slate-200',
};

export const STATUS_DOT_CLASSES = {
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  slate: 'bg-slate-400',
};

export const canAddMore = (menu, quantityInCart) => {
  const status = getMenuStatus(menu);
  if (status.disabled) return false;
  if (status.stock === null) return true;
  return quantityInCart < status.stock;
};
