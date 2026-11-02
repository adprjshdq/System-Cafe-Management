export function getMargin(menu) {
  const price = Number(menu?.price) || 0;
  const cost = Number(menu?.cost_price) || 0;
  const margin = price - cost;
  const percent = price > 0 ? Math.round((margin / price) * 100) : 0;
  return { margin, percent };
}

export function getStockState(menu) {
  const isUnlimited =
    menu?.stock === null || menu?.stock === undefined || menu?.stock === '';

  if (isUnlimited) {
    return { label: 'Stok bebas', tone: 'neutral', value: null };
  }

  const stock = Number(menu.stock);

  if (!menu?.is_available || stock <= 0) {
    return { label: 'Stok habis', tone: 'danger', value: stock };
  }

  if (stock <= 5) {
    return { label: `Sisa ${stock}`, tone: 'warning', value: stock };
  }

  return { label: `Stok ${stock}`, tone: 'success', value: stock };
}
