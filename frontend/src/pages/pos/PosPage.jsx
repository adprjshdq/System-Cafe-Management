import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ShoppingBag,
  Printer,
  X,
  CheckCircle2,
  AlertCircle,
  ChevronUp,
  LayoutGrid,
  Search,
  Send,
  SlidersHorizontal,
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

// Fallback initial menus if server is initializing
const fallbackMenus = [
  { id: 1, name: 'Espresso Single', category_id: 1, price: 18000, stock: 40, is_available: true, description: 'Arabika single shot' },
  { id: 2, name: 'Iced Americano', category_id: 1, price: 22000, stock: 35, is_available: true, description: 'Espresso & es segar' },
  { id: 3, name: 'Caramel Macchiato', category_id: 1, price: 28000, stock: 25, is_available: true, description: 'Espresso, susu, saus karamel' },
  { id: 4, name: 'Kopi Susu Aren', category_id: 1, price: 24000, stock: 30, is_available: true, description: 'Aren organik creamy' },
  { id: 5, name: 'Matcha Latte', category_id: 2, price: 27000, stock: 18, is_available: true, description: 'Matcha murni Uji Jepang' },
  { id: 6, name: 'Signature Chocolate', category_id: 2, price: 26000, stock: 22, is_available: true, description: 'Cokelat Belgia pekat' },
  { id: 7, name: 'Nasi Goreng Kampung', category_id: 3, price: 32000, stock: 15, is_available: true, description: 'Telur ceplok & ayam' },
  { id: 8, name: 'Spaghetti Carbonara', category_id: 3, price: 38000, stock: 10, is_available: true, description: 'Smoked beef & parmesan' },
  { id: 9, name: 'Crispy French Fries', category_id: 4, price: 20000, stock: 20, is_available: true, description: 'Kentang renyah + saus' },
  { id: 10, name: 'Butter Croissant', category_id: 4, price: 22000, stock: 4, is_available: true, description: 'Flaky butter pastry' },
];

const fallbackTables = [
  { id: 1, table_number: 'Meja 01', status: 'available' },
  { id: 2, table_number: 'Meja 02', status: 'available' },
  { id: 3, table_number: 'Meja 03', status: 'occupied' },
  { id: 4, table_number: 'Meja 04', status: 'available' },
  { id: 5, table_number: 'Meja 05', status: 'available' },
  { id: 6, table_number: 'Outdoor 01', status: 'available' },
];

export default function PosPage() {
  const [menus, setMenus] = useState(fallbackMenus);
  const [categories, setCategories] = useState([
    { id: 'all', name: 'Semua Kategori' },
    { id: 1, name: 'Coffee Series', slug: 'coffee' },
    { id: 2, name: 'Non-Coffee', slug: 'non-coffee' },
    { id: 3, name: 'Main Course', slug: 'main-course' },
    { id: 4, name: 'Snacks & Pastry', slug: 'snacks' },
  ]);
  const [tables, setTables] = useState(fallbackTables);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

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
  } = useCart();

  const { role } = useAuth();
  // Pelayan membuat pesanan dari meja dan tidak pernah memproses pembayaran.
  const isWaiter = role === 'waiter';
  const effectiveOrderType = isWaiter ? 'dine_in' : orderType;

  const fetchData = useCallback(async () => {
    try {
      const [menuRes, catRes, tableRes] = await Promise.all([
        api.get('/v1/menus'),
        api.get('/v1/categories'),
        api.get('/v1/tables'),
      ]);

      if (menuRes.data?.data?.length) setMenus(menuRes.data.data);
      if (catRes.data?.data?.length) {
        setCategories([{ id: 'all', name: 'Semua Kategori' }, ...catRes.data.data]);
      }
      if (tableRes.data?.data?.length) setTables(tableRes.data.data);
    } catch (e) {
      console.warn('API error, using demo menus:', e);
    }
  }, []);

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

    const orderSnapshot = {
      items: [...cartItems],
      subtotal,
      taxAmount,
      totalAmount,
    };

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
      if (err.response) {
        setSendOrderError(
          err.response.data?.message || 'Pesanan gagal dikirim. Silakan coba lagi.'
        );
        fetchData();
        return;
      }

      // Fallback preview jika server tidak dapat dijangkau.
      const mockInvoice =
        'INV-' +
        new Date().toISOString().slice(0, 10).replace(/-/g, '') +
        '-' +
        Math.floor(1000 + Math.random() * 9000);
      setCompletedOrder({
        order_number: mockInvoice,
        customer_name: customerName || 'Tamu Meja',
        order_type: 'dine_in',
        created_at: new Date().toISOString(),
        table: selectedTable,
        items: orderSnapshot.items,
        subtotal: orderSnapshot.subtotal,
        tax_amount: orderSnapshot.taxAmount,
        total_amount: orderSnapshot.totalAmount,
        payment: null,
      });
      setIsSendOrderOpen(false);
      setIsReceiptOpen(true);
      clearCart();
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

    // Simpan snapshot untuk fallback struk saat offline.
    const orderSnapshot = {
      items: [...cartItems],
      subtotal,
      taxAmount,
      totalAmount,
      paidNum,
    };

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
      if (err.response) {
        setCheckoutError(
          err.response.data?.message || 'Pembayaran gagal diproses. Silakan coba lagi.'
        );
        // Segarkan stok/ketersediaan menu agar badge di katalog ikut terbarui.
        fetchData();
        return;
      }

      // Fallback preview receipt jika server tidak dapat dijangkau.
      const mockInvoice =
        'INV-' +
        new Date().toISOString().slice(0, 10).replace(/-/g, '') +
        '-' +
        Math.floor(1000 + Math.random() * 9000);
      const mockResult = {
        order_number: mockInvoice,
        customer_name: customerName || 'Pelanggan Walk-In',
        order_type: orderType,
        created_at: new Date().toISOString(),
        table: selectedTable,
        items: orderSnapshot.items,
        subtotal: orderSnapshot.subtotal,
        tax_amount: orderSnapshot.taxAmount,
        total_amount: orderSnapshot.totalAmount,
        payment: {
          payment_method: paymentMethod,
          amount_paid: orderSnapshot.paidNum,
          change_amount: Math.max(0, orderSnapshot.paidNum - orderSnapshot.totalAmount),
        },
      };
      setCompletedOrder(mockResult);
      setIsCheckoutOpen(false);
      setIsReceiptOpen(true);
      clearCart();
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
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <LayoutGrid className="h-4.5 w-4.5 text-amber-500" />
                  Katalog Menu
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
                    className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                      String(activeCategory) === String(cat.id)
                        ? 'bg-brand-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.name}
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        String(activeCategory) === String(cat.id)
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

            <button
              type="button"
              onClick={() => setShowAvailableOnly((previous) => !previous)}
              aria-pressed={showAvailableOnly}
              aria-label={showAvailableOnly ? 'Tampilkan semua menu' : 'Tampilkan hanya menu tersedia'}
              title={showAvailableOnly ? 'Tampilkan semua menu' : 'Tampilkan hanya menu tersedia'}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                showAvailableOnly
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Hanya tersedia</span>
            </button>
          </div>
        </div>

        {/* Menu Cards Grid */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-28 sm:p-5 lg:pb-5">
          {filteredMenus.length === 0 ? (
            <div className="flex h-full min-h-64 flex-col items-center justify-center px-6 text-center">
              <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Search className="h-7 w-7" />
              </span>
              <h3 className="text-sm font-bold text-slate-700">Menu tidak ditemukan</h3>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-400">
                Coba kata kunci lain atau reset filter untuk melihat semua menu.
              </p>
              {hasActiveFilter && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-4 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 transition-colors hover:bg-amber-400"
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
        className={`hidden shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition-[width] duration-200 lg:flex lg:flex-col xl:p-5 ${
          isCartExpanded ? 'lg:w-[30rem] xl:w-[33rem]' : 'lg:w-[23rem] xl:w-[25rem]'
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
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <ShoppingBag className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-extrabold text-slate-950">
                {itemCount}
              </span>
            )}
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
                    {item.notes && <p className="text-[9px] italic text-amber-700">*{item.notes}</p>}
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
                <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1.5 text-center font-sans text-[10px] font-bold uppercase tracking-wide text-amber-800">
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
                className={`rounded-xl px-4 py-2.5 text-xs font-bold ${
                  isWaiter
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
          className={`animate-pos-toast fixed right-4 top-20 z-[60] flex max-w-xs items-start gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold shadow-lg ${
            toast.tone === 'warning'
              ? 'border-amber-200 bg-amber-50 text-amber-800'
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
