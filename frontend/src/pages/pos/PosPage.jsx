import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Printer,
  X,
  CheckCircle2,
  AlertCircle,
  ChevronUp,
  Search,
  Send,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import ProductCard from './ProductCard';
import SearchBox from './SearchBox';
import CartPanel from './CartPanel';
import CheckoutDialog from './CheckoutDialog';
import SendOrderDialog from './SendOrderDialog';
import { getMenuStatus, STATUS_DOT_CLASSES } from './posUtils';
import DataStateNotice from '../../components/DataStateNotice';

export default function PosPage() {
  const [menus, setMenus] = useState([]);
  const [categories, setCategories] = useState([{ id: 'all', name: 'Semua Kategori' }]);
  const [tables, setTables] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Layout
  const [isCartExpanded, setIsCartExpanded] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Modals
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSendOrderOpen, setIsSendOrderOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [sendOrderError, setSendOrderError] = useState('');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');

  // Feedback
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const searchInputRef = useRef(null);

  const {
    cartItems,
    selectedTable,
    orderType,
    customerName,
    subtotal,
    taxAmount,
    totalAmount,
    setSelectedTable,
    setOrderType,
    setCustomerName,
    addToCart,
    updateQuantity,
    updateItemNotes,
    removeFromCart,
    clearCart,
    syncWithCatalog,
  } = useCart();

  const { role } = useAuth();
  // Pelayan membuat pesanan dari meja dan tidak pernah memproses pembayaran.
  const isWaiter = role === 'waiter';
  const effectiveOrderType = isWaiter ? 'dine_in' : orderType;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [menuRes, catRes, tableRes] = await Promise.all([
        api.get('/v1/menus'),
        api.get('/v1/categories'),
        api.get('/v1/tables'),
      ]);

      const menuList = Array.isArray(menuRes.data?.data) ? menuRes.data.data : [];
      const categoryList = Array.isArray(catRes.data?.data) ? catRes.data.data : [];
      const tableList = Array.isArray(tableRes.data?.data) ? tableRes.data.data : [];

      setMenus(menuList);
      setCategories([{ id: 'all', name: 'Semua Kategori' }, ...categoryList]);
      setTables(tableList);
      // Draft dari refresh bisa berisi harga/stok lama; samakan dengan katalog.
      syncWithCatalog({ menus: menuList, tables: tableList });
      setLoadError('');
    } catch (e) {
      console.error('Gagal memuat data katalog POS:', e);
      setMenus([]);
      setCategories([{ id: 'all', name: 'Semua Kategori' }]);
      setTables([]);
      setLoadError(
        e.response?.data?.message ||
          'Server tidak dapat dihubungi. Katalog menu dan daftar meja dikosongkan sampai data berhasil dimuat.'
      );
    } finally {
      setLoading(false);
    }
  }, [syncWithCatalog]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    []
  );

  // Shortcut "/" atau Ctrl/Cmd+K untuk fokus ke pencarian.
  useEffect(() => {
    const handleShortcut = (event) => {
      const activeElement = document.activeElement;
      const isTyping =
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElement?.tagName) ||
        activeElement?.isContentEditable;

      const isSlash = event.key === '/' && !isTyping;
      const isCommandK = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';

      if (isSlash || isCommandK) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  useEffect(() => {
    if (!isMobileCartOpen) return undefined;
    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsMobileCartOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isMobileCartOpen]);

  const showToast = useCallback((message, tone = 'success') => {
    setToast({ message, tone });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  const cartQuantityById = useMemo(() => {
    const map = {};
    cartItems.forEach((item) => {
      map[item.id] = item.quantity;
    });
    return map;
  }, [cartItems]);

  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const filteredMenus = useMemo(
    () =>
      menus.filter((menu) => {
        const matchCategory =
          activeCategory === 'all' || String(menu.category_id) === String(activeCategory);
        const term = searchQuery.trim().toLowerCase();
        const categoryName =
          menu.category?.name ||
          categories.find((cat) => String(cat.id) === String(menu.category_id))?.name ||
          '';
        const matchSearch =
          !term ||
          menu.name.toLowerCase().includes(term) ||
          (menu.description || '').toLowerCase().includes(term) ||
          categoryName.toLowerCase().includes(term);
        const matchAvailability = !showAvailableOnly || !getMenuStatus(menu).disabled;

        return matchCategory && matchSearch && matchAvailability;
      }),
    [menus, categories, activeCategory, searchQuery, showAvailableOnly]
  );

  const handleAddToCart = useCallback(
    (menu) => {
      const status = getMenuStatus(menu);

      if (status.disabled) {
        showToast(
          status.stock === 0 ? `Stok ${menu.name} habis` : `${menu.name} sedang tidak tersedia`,
          'warning'
        );
        return;
      }

      const quantityInCart = cartQuantityById[menu.id] || 0;
      if (status.stock !== null && quantityInCart >= status.stock) {
        showToast(`Stok ${menu.name} tersisa ${status.stock}`, 'warning');
        return;
      }

      addToCart(menu);
      showToast(`${menu.name} ditambahkan ke keranjang`);
    },
    [addToCart, cartQuantityById, showToast]
  );

  const handleUpdateQuantity = useCallback(
    (menuId, quantity) => {
      if (quantity <= 0) {
        updateQuantity(menuId, 0);
        return;
      }

      const menu = menus.find((item) => item.id === menuId);
      const stock = typeof menu?.stock === 'number' ? menu.stock : null;

      if (stock !== null && quantity > stock) {
        showToast(`Stok ${menu?.name || 'menu'} tersisa ${stock}`, 'warning');
        return;
      }

      updateQuantity(menuId, quantity);
    },
    [menus, showToast, updateQuantity]
  );

  const handleSelectCategory = useCallback((category) => {
    setActiveCategory(category.id);
    setSearchQuery('');
  }, []);

  const handleResetFilters = () => {
    setActiveCategory('all');
    setSearchQuery('');
    setShowAvailableOnly(false);
  };

  const handleOpenCheckout = () => {
    if (cartItems.length === 0) return;

    if (isWaiter) {
      if (!selectedTable) {
        showToast('Pilih meja terlebih dahulu sebelum mengirim pesanan.', 'warning');
        return;
      }
      setSendOrderError('');
      setIsSendOrderOpen(true);
      return;
    }

    setPaymentMethod('cash');
    setAmountPaid(String(totalAmount));
    setCheckoutError('');
    setIsCheckoutOpen(true);
  };

  const handleSendOrder = async () => {
    if (processing) return;

    if (!selectedTable) {
      setSendOrderError('Pilih meja terlebih dahulu sebelum mengirim pesanan.');
      return;
    }

    // Tanpa field payment: pelayan tidak boleh memproses pembayaran.
    const payload = {
      order_type: 'dine_in',
      table_id: selectedTable.id,
      customer_name: customerName || 'Tamu Meja',
      items: cartItems.map((item) => ({
        menu_id: item.id,
        quantity: item.quantity,
        notes: item.notes || null,
      })),
    };

    setProcessing(true);
    setSendOrderError('');

    try {
      const res = await api.post('/v1/orders', payload);
      if (res.data?.success) {
        setCompletedOrder(res.data.data);
        setIsSendOrderOpen(false);
        setIsReceiptOpen(true);
        clearCart();
        fetchData();
      }
    } catch (err) {
      setSendOrderError(
        err.response?.data?.message ||
          'Server tidak dapat dihubungi. Pesanan belum terkirim, silakan coba lagi.'
      );
      if (err.response) fetchData();
    } finally {
      setProcessing(false);
    }
  };

  const handleProcessPayment = async () => {
    if (processing) return;

    const paidNum = paymentMethod === 'cash' ? Number(amountPaid) || 0 : totalAmount;

    if (paymentMethod === 'cash' && paidNum < totalAmount) {
      setCheckoutError('Nominal uang diterima kurang dari total tagihan.');
      return;
    }

    const payload = {
      order_type: orderType,
      table_id: orderType === 'dine_in' ? selectedTable?.id : null,
      customer_name: customerName || 'Pelanggan Walk-In',
      items: cartItems.map((item) => ({
        menu_id: item.id,
        quantity: item.quantity,
        notes: item.notes || null,
      })),
      payment: {
        method: paymentMethod,
        amount_paid: paidNum,
      },
    };

    setProcessing(true);
    setCheckoutError('');

    try {
      const res = await api.post('/v1/orders', payload);
      if (res.data?.success) {
        setCompletedOrder(res.data.data);
        setIsCheckoutOpen(false);
        setIsReceiptOpen(true);
        clearCart();
        fetchData();
      }
    } catch (err) {
      setCheckoutError(
        err.response?.data?.message ||
          'Server tidak dapat dihubungi. Pembayaran belum diproses, silakan coba lagi.'
      );
      // Segarkan stok/ketersediaan menu agar badge di katalog ikut terbarui.
      if (err.response) fetchData();
    } finally {
      setProcessing(false);
    }
  };

  const hasActiveFilter =
    activeCategory !== 'all' || searchQuery.trim().length > 0 || showAvailableOnly;

  return (
    <div className="flex h-[calc(100dvh-6rem)] flex-col gap-4 lg:h-[calc(100dvh-7rem)] lg:flex-row lg:gap-6">
      {/* Kiri: Katalog Menu & Filter */}
      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="shrink-0 space-y-3 border-b border-slate-100 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
                  <img
                    src="/menu.png"
                    alt="Icon Menu"
                    className="h-7 w-7 object-contain"
                  />
                  <span>Katalog Menu</span>
                </h2>
                {isWaiter && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700"
                    title="Pesanan langsung dikirim ke dapur tanpa pembayaran"
                  >
                    <Send className="h-3 w-3" />
                    Mode Pelayan
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-slate-400">
                {isWaiter
                  ? 'Pilih menu, tentukan meja, lalu kirim pesanan ke dapur.'
                  : `${filteredMenus.length} menu ditampilkan` +
                  (searchQuery.trim() ? ` untuk “${searchQuery.trim()}”` : '')}
              </p>
            </div>

            <div className="hidden items-center gap-2 text-[10px] font-semibold text-slate-400 sm:flex">
              <span className="inline-flex items-center gap-1">
                <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT_CLASSES.emerald}`} />
                Tersedia
              </span>
              <span className="inline-flex items-center gap-1">
                <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT_CLASSES.amber}`} />
                Stok menipis
              </span>
              <span className="inline-flex items-center gap-1">
                <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT_CLASSES.rose}`} />
                Habis
              </span>
            </div>
          </div>

          {loadError && (
            <DataStateNotice
              title="Katalog POS gagal dimuat"
              message={loadError}
              onRetry={fetchData}
              retrying={loading}
            />
          )}

          <SearchBox
            query={searchQuery}
            onQueryChange={setSearchQuery}
            menus={menus}
            categories={categories}
            onSelectMenu={handleAddToCart}
            onSelectCategory={handleSelectCategory}
            inputRef={searchInputRef}
          />

          <div className="flex items-center gap-2">
            <div className="scrollbar-none flex flex-1 gap-2 overflow-x-auto pb-1">
              {categories.map((cat) => {
                const count =
                  cat.id === 'all'
                    ? menus.length
                    : menus.filter((menu) => String(menu.category_id) === String(cat.id)).length;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    aria-pressed={String(activeCategory) === String(cat.id)}
                    className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${String(activeCategory) === String(cat.id)
                      ? 'bg-brand-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    {cat.name}
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${String(activeCategory) === String(cat.id)
                        ? 'bg-white/20 text-white'
                        : 'bg-white text-slate-400'
                        }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Menu Cards Grid */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-28 sm:p-5 lg:pb-5">
          {filteredMenus.length === 0 ? (
            <div className="flex h-full min-h-64 flex-col items-center justify-center px-6 text-center">
              <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Search className="h-7 w-7" />
              </span>
              <h3 className="text-sm font-bold text-slate-700">
                {menus.length === 0 ? 'Belum ada menu tersedia' : 'Menu tidak ditemukan'}
              </h3>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-400">
                {menus.length === 0
                  ? 'Katalog menu akan tampil setelah data berhasil dimuat dari server.'
                  : 'Coba kata kunci lain atau reset filter untuk melihat semua menu.'}
              </p>
              {menus.length === 0 && !loadError ? (
                <button
                  type="button"
                  onClick={fetchData}
                  disabled={loading}
                  className="mt-4 rounded-xl bg-brand-700 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-600 disabled:cursor-wait disabled:opacity-60"
                >
                  {loading ? 'Memuat...' : 'Muat ulang katalog'}
                </button>
              ) : hasActiveFilter && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-4 rounded-xl bg-brand-700 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-600"
                >
                  Reset filter
                </button>
              )}
            </div>
          ) : (
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))' }}
            >
              {filteredMenus.map((menu) => (
                <ProductCard
                  key={menu.id}
                  menu={menu}
                  categories={categories}
                  quantityInCart={cartQuantityById[menu.id] || 0}
                  onAdd={handleAddToCart}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Kanan: Keranjang & Panel Transaksi (desktop) */}
      <aside
        className={`hidden shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-[width] duration-200 lg:flex lg:flex-col xl:p-5 ${isCartExpanded ? 'lg:w-[30rem] xl:w-[33rem]' : 'lg:w-[23rem] xl:w-[25rem]'
          }`}
      >
        <CartPanel
          cartItems={cartItems}
          categories={categories}
          subtotal={subtotal}
          taxAmount={taxAmount}
          totalAmount={totalAmount}
          orderType={effectiveOrderType}
          setOrderType={setOrderType}
          selectedTable={selectedTable}
          setSelectedTable={setSelectedTable}
          tables={tables}
          customerName={customerName}
          setCustomerName={setCustomerName}
          onUpdateQuantity={handleUpdateQuantity}
          onUpdateNotes={updateItemNotes}
          onRemove={removeFromCart}
          onClear={clearCart}
          onCheckout={handleOpenCheckout}
          isExpanded={isCartExpanded}
          onToggleExpand={() => setIsCartExpanded((previous) => !previous)}
          showExpandToggle
          isWaiter={isWaiter}
        />
      </aside>

      {/* Mobile: bar ringkasan + bottom sheet keranjang */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-3 py-2.5 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50">
            <img
              src="/icon_keranjang.png"
              alt="Keranjang Pesanan"
              className="h-6 w-6 object-contain"
            />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {itemCount > 0 ? `${itemCount} item` : 'Keranjang kosong'} · Total
            </p>
            <p className="truncate text-sm font-extrabold text-slate-900">
              {formatCurrency(totalAmount)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileCartOpen(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-slate-800"
          >
            Lihat Keranjang
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {isMobileCartOpen && (
        <>
          <div
            className="animate-pos-fade fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileCartOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Keranjang pesanan"
            className="animate-pos-sheet fixed inset-x-0 bottom-0 z-50 flex h-[88dvh] flex-col rounded-t-3xl bg-white p-4 shadow-2xl lg:hidden"
          >
            <div className="mx-auto mb-2 h-1.5 w-10 shrink-0 rounded-full bg-slate-200" />
            <CartPanel
              cartItems={cartItems}
              categories={categories}
              subtotal={subtotal}
              taxAmount={taxAmount}
              totalAmount={totalAmount}
              orderType={effectiveOrderType}
              setOrderType={setOrderType}
              selectedTable={selectedTable}
              setSelectedTable={setSelectedTable}
              tables={tables}
              customerName={customerName}
              setCustomerName={setCustomerName}
              onUpdateQuantity={handleUpdateQuantity}
              onUpdateNotes={updateItemNotes}
              onRemove={removeFromCart}
              onClear={clearCart}
              onCheckout={() => {
                setIsMobileCartOpen(false);
                handleOpenCheckout();
              }}
              onClose={() => setIsMobileCartOpen(false)}
              isWaiter={isWaiter}
            />
          </div>
        </>
      )}

      <CheckoutDialog
        open={isCheckoutOpen}
        onClose={() => {
          if (!processing) {
            setIsCheckoutOpen(false);
            setCheckoutError('');
          }
        }}
        items={cartItems}
        subtotal={subtotal}
        taxAmount={taxAmount}
        totalAmount={totalAmount}
        orderType={orderType}
        selectedTable={selectedTable}
        customerName={customerName}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        amountPaid={amountPaid}
        setAmountPaid={setAmountPaid}
        onConfirm={handleProcessPayment}
        processing={processing}
        errorMessage={checkoutError}
      />

      <SendOrderDialog
        open={isSendOrderOpen}
        onClose={() => {
          if (!processing) {
            setIsSendOrderOpen(false);
            setSendOrderError('');
          }
        }}
        items={cartItems}
        subtotal={subtotal}
        taxAmount={taxAmount}
        totalAmount={totalAmount}
        selectedTable={selectedTable}
        customerName={customerName}
        onConfirm={handleSendOrder}
        processing={processing}
        errorMessage={sendOrderError}
      />

      {/* Modal Preview Struk Pembayaran */}
      {isReceiptOpen && completedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={isWaiter ? 'Konfirmasi pesanan terkirim' : 'Struk pembayaran'}
            className="max-h-[92vh] w-full max-w-sm overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 font-mono text-xs shadow-2xl"
          >
            {isWaiter && (
              <div className="mb-4 flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 font-sans text-[11px] font-bold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Pesanan Terkirim ke Dapur
              </div>
            )}

            <div className="border-b border-dashed border-slate-300 pb-4 text-center">
              <h3 className="text-base font-bold text-slate-900">AROMA KOPI &amp; CAFE</h3>
              <p className="text-[10px] text-slate-500">Jl. Grafika No. 1, Yogyakarta</p>
              <p className="text-[10px] text-slate-500">Telp: 0812-3456-7890</p>
            </div>

            <div className="space-y-1 border-b border-dashed border-slate-300 py-3 text-[11px] text-slate-600">
              <div className="flex justify-between">
                <span>No: {completedOrder.order_number}</span>
                <span>{completedOrder.order_type === 'dine_in' ? 'DINE-IN' : 'TAKEAWAY'}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu: {formatDateTime(completedOrder.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span>Pelanggan: {completedOrder.customer_name}</span>
                {completedOrder.table && <span>{completedOrder.table.table_number}</span>}
              </div>
            </div>

            <div className="space-y-2 border-b border-dashed border-slate-300 py-3">
              {completedOrder.items?.map((item, index) => (
                <div key={index} className="flex justify-between text-[11px]">
                  <div>
                    <p className="font-semibold">{item.name || item.menu?.name}</p>
                    <span className="text-[10px] text-slate-500">
                      {item.quantity} x {formatCurrency(item.unit_price || item.price)}
                    </span>
                    {item.notes && <p className="text-[9px] italic text-brand-700">*{item.notes}</p>}
                  </div>
                  <span className="font-semibold">{formatCurrency(item.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 border-b border-dashed border-slate-300 py-3 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(completedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Pajak (10%):</span>
                <span>{formatCurrency(completedOrder.tax_amount)}</span>
              </div>
              <div className="flex justify-between pt-1 text-sm font-bold text-slate-900">
                <span>TOTAL:</span>
                <span>{formatCurrency(completedOrder.total_amount)}</span>
              </div>

              {completedOrder.payment ? (
                <>
                  <div className="flex justify-between pt-1">
                    <span>Metode:</span>
                    <span className="uppercase">{completedOrder.payment?.payment_method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bayar:</span>
                    <span>{formatCurrency(completedOrder.payment?.amount_paid)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kembali:</span>
                    <span>{formatCurrency(completedOrder.payment?.change_amount)}</span>
                  </div>
                </>
              ) : (
                <div className="mt-2 rounded-lg border border-brand-300 bg-brand-50 px-2 py-1.5 text-center font-sans text-[10px] font-bold uppercase tracking-wide text-brand-800">
                  Belum dibayar · Bayar di kasir
                </div>
              )}
            </div>

            <div className="pt-4 text-center text-[10px] text-slate-500">
              <p>Terima kasih atas kunjungan Anda!</p>
              <p>Wi-Fi: AromaCafe / Pass: kopienak123</p>
            </div>

            <div className="mt-5 flex gap-2 font-sans">
              {!isWaiter && (
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Cetak Struk</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsReceiptOpen(false)}
                className={`rounded-xl px-4 py-2.5 text-xs font-bold ${isWaiter
                  ? 'flex-1 bg-slate-900 text-white hover:bg-slate-800'
                  : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
              >
                {isWaiter ? 'Buat Pesanan Baru' : 'Tutup'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast feedback */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`animate-pos-toast fixed right-4 top-20 z-[60] flex max-w-xs items-start gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold shadow-lg ${toast.tone === 'warning'
            ? 'border-brand-200 bg-brand-50 text-brand-800'
            : 'border-emerald-200 bg-emerald-50 text-emerald-800'
            }`}
        >
          {toast.tone === 'warning' ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Tutup notifikasi"
            className="ml-1 rounded p-0.5 opacity-60 hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
