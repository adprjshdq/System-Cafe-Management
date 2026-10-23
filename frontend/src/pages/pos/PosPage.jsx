import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Utensils,
  DollarSign,
  QrCode,
  CreditCard,
  CheckCircle2,
  Printer,
  X,
  Sparkles
} from 'lucide-react';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import MenuThumbnail from '../../components/MenuThumbnail';

// Fallback initial menus if server is initializing
const fallbackMenus = [
  { id: 1, name: 'Espresso Single', category_id: 1, price: 18000, is_available: true, description: 'Arabika single shot' },
  { id: 2, name: 'Iced Americano', category_id: 1, price: 22000, is_available: true, description: 'Espresso & es segar' },
  { id: 3, name: 'Caramel Macchiato', category_id: 1, price: 28000, is_available: true, description: 'Espresso, susu, saus karamel' },
  { id: 4, name: 'Kopi Susu Aren', category_id: 1, price: 24000, is_available: true, description: 'Aren organik creamy' },
  { id: 5, name: 'Matcha Latte', category_id: 2, price: 27000, is_available: true, description: 'Matcha murni Uji Jepang' },
  { id: 6, name: 'Signature Chocolate', category_id: 2, price: 26000, is_available: true, description: 'Cokelat Belgia pekat' },
  { id: 7, name: 'Nasi Goreng Kampung', category_id: 3, price: 32000, is_available: true, description: 'Telur ceplok & ayam' },
  { id: 8, name: 'Spaghetti Carbonara', category_id: 3, price: 38000, is_available: true, description: 'Smoked beef & parmesan' },
  { id: 9, name: 'Crispy French Fries', category_id: 4, price: 20000, is_available: true, description: 'Kentang renyah + saus' },
  { id: 10, name: 'Butter Croissant', category_id: 4, price: 22000, is_available: true, description: 'Flaky butter pastry' },
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
    { id: 1, name: 'Coffee' },
    { id: 2, name: 'Non-Coffee' },
    { id: 3, name: 'Main Course' },
    { id: 4, name: 'Snacks' },
  ]);
  const [tables, setTables] = useState(fallbackTables);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');

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

  useEffect(() => {
    // Fetch live data from backend
    const fetchData = async () => {
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
    };
    fetchData();
  }, []);

  const filteredMenus = menus.filter((menu) => {
    const matchCategory =
      activeCategory === 'all' || String(menu.category_id) === String(activeCategory);
    const matchSearch =
      menu.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (menu.description && menu.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchSearch;
  });

  const handleOpenCheckout = () => {
    if (cartItems.length === 0) return;
    setAmountPaid(totalAmount);
    setIsCheckoutOpen(true);
  };

  const handleProcessPayment = async () => {
    const paidNum = Number(amountPaid) || totalAmount;
    if (paidNum < totalAmount) {
      alert('Nominal uang diterima kurang dari total tagihan!');
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

    try {
      const res = await api.post('/v1/orders', payload);
      if (res.data?.success) {
        setCompletedOrder(res.data.data);
        setIsCheckoutOpen(false);
        setIsReceiptOpen(true);
        clearCart();
      }
    } catch (err) {
      // Fallback preview receipt jika offline
      const mockInvoice = 'INV-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);
      const mockResult = {
        order_number: mockInvoice,
        customer_name: customerName || 'Pelanggan Walk-In',
        order_type: orderType,
        created_at: new Date().toISOString(),
        table: selectedTable,
        items: [...cartItems],
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        payment: {
          payment_method: paymentMethod,
          amount_paid: paidNum,
          change_amount: Math.max(0, paidNum - totalAmount),
        },
      };
      setCompletedOrder(mockResult);
      setIsCheckoutOpen(false);
      setIsReceiptOpen(true);
      clearCart();
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-7rem)]">
      {/* Kiri: Katalog Menu & Filter */}
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-2xl border border-slate-200 p-5 overflow-hidden">
        {/* Search & Category Tabs */}
        <div className="space-y-4 mb-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kopi, makanan, cemilan..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${String(activeCategory) === String(cat.id)
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Cards Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredMenus.map((menu) => (
              <div
                key={menu.id}
                onClick={() => addToCart(menu)}
                className="group cursor-pointer bg-slate-50 hover:bg-amber-50/40 border border-slate-200 hover:border-amber-400 rounded-xl p-3.5 flex flex-col justify-between transition-all duration-150 shadow-2xs hover:shadow-sm"
              >
                <div>
                  <div className="w-full h-24 bg-slate-200 rounded-lg mb-2.5 overflow-hidden flex items-center justify-center text-slate-400">
                    <MenuThumbnail
                      menu={menu}
                      categories={categories}
                      iconClassName="w-8 h-8 text-slate-400 group-hover:scale-110 transition-transform"
                    />
                  </div>
                  <h4 className="font-semibold text-slate-800 text-xs line-clamp-1 group-hover:text-amber-800">
                    {menu.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {menu.description || 'Pilihan menu lezat'}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200/60">
                  <span className="font-bold text-xs text-slate-900">
                    {formatCurrency(menu.price)}
                  </span>
                  <div className="w-6 h-6 rounded-lg bg-amber-500 group-hover:bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-xs shadow-xs">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Kanan: Keranjang & Panel Transaksi */}
      <div className="w-full lg:w-96 bg-white rounded-2xl border border-slate-200 flex flex-col p-5 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900 text-base">Keranjang Pesanan</h3>
          </div>
          {cartItems.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-rose-500 hover:text-rose-600 font-semibold"
            >
              Kosongkan
            </button>
          )}
        </div>

        {/* Setting Pesanan: Tipe & Meja */}
        <div className="py-3 border-b border-slate-100 space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setOrderType('dine_in')}
              className={`py-1.5 rounded-xl text-xs font-bold transition-all ${orderType === 'dine_in'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              Dine-In (Makan di Tempat)
            </button>
            <button
              onClick={() => {
                setOrderType('takeaway');
                setSelectedTable(null);
              }}
              className={`py-1.5 rounded-xl text-xs font-bold transition-all ${orderType === 'takeaway'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              Takeaway (Bungkus)
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nama Pelanggan (opsional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500"
            />

            {orderType === 'dine_in' && (
              <select
                value={selectedTable?.id || ''}
                onChange={(e) => {
                  const tbl = tables.find((t) => String(t.id) === e.target.value);
                  setSelectedTable(tbl || null);
                }}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-semibold focus:outline-none focus:border-amber-500"
              >
                <option value="">Pilih Meja</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id} disabled={t.status === 'occupied'}>
                    {t.table_number} {t.status === 'occupied' ? '(Terisi)' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* List Keranjang Item */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-8">
              <ShoppingBag className="w-10 h-10 mb-2 stroke-[1.5]" />
              <p className="text-xs">Belum ada item dipilih.</p>
              <p className="text-[11px] text-slate-400">Klik menu di sebelah kiri untuk menambah.</p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-semibold text-xs text-slate-800">{item.name}</h5>
                    <span className="text-[11px] text-slate-500">{formatCurrency(item.price)}</span>
                  </div>
                  <span className="font-bold text-xs text-slate-900">{formatCurrency(item.subtotal)}</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <input
                    type="text"
                    value={item.notes || ''}
                    onChange={(e) => updateItemNotes(item.id, e.target.value)}
                    placeholder="Catatan (cth: Less Ice)"
                    className="flex-1 mr-2 text-[11px] bg-white border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-amber-400"
                  />

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold w-5 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Ringkasan Biaya & Checkout */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>Pajak Restoran (10%)</span>
            <span>{formatCurrency(taxAmount)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-100">
            <span>Total Tagihan</span>
            <span className="text-amber-600 text-base">{formatCurrency(totalAmount)}</span>
          </div>

          <button
            onClick={handleOpenCheckout}
            disabled={cartItems.length === 0}
            className="w-full mt-2 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm shadow-md transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <span>Bayar Sekarang</span>
          </button>
        </div>
      </div>

      {/* Modal Checkout Pembayaran */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">Proses Pembayaran</h3>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-5 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total yang Harus Dibayar</p>
              <p className="text-3xl font-extrabold text-amber-600 mt-1">{formatCurrency(totalAmount)}</p>
            </div>

            {/* Metode Pembayaran */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Pilih Metode</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-3 rounded-xl border text-center text-xs font-bold transition-all ${paymentMethod === 'cash'
                      ? 'border-amber-500 bg-amber-50/50 text-amber-800'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                  >
                    <DollarSign className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                    Tunai
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('qris')}
                    className={`p-3 rounded-xl border text-center text-xs font-bold transition-all ${paymentMethod === 'qris'
                      ? 'border-amber-500 bg-amber-50/50 text-amber-800'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                  >
                    <QrCode className="w-5 h-5 mx-auto mb-1 text-slate-800" />
                    QRIS
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transfer')}
                    className={`p-3 rounded-xl border text-center text-xs font-bold transition-all ${paymentMethod === 'transfer'
                      ? 'border-amber-500 bg-amber-50/50 text-amber-800'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                  >
                    <CreditCard className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                    Transfer
                  </button>
                </div>
              </div>

              {paymentMethod === 'cash' && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-600">Nominal Uang Diterima</label>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder="Contoh: 50000"
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setAmountPaid(totalAmount)}
                      className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700"
                    >
                      Uang Pas
                    </button>
                    <button
                      type="button"
                      onClick={() => setAmountPaid(50000)}
                      className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700"
                    >
                      50.000
                    </button>
                    <button
                      type="button"
                      onClick={() => setAmountPaid(100000)}
                      className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700"
                    >
                      100.000
                    </button>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl flex justify-between text-xs mt-2">
                    <span className="text-slate-500">Kembalian:</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {formatCurrency(Math.max(0, (Number(amountPaid) || 0) - totalAmount))}
                    </span>
                  </div>
                </div>
              )}

              {paymentMethod === 'qris' && (
                <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="w-36 h-36 bg-white mx-auto p-2 border border-slate-300 rounded-lg flex items-center justify-center">
                    <QrCode className="w-28 h-28 text-slate-900" />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Scan QRIS Nasional dengan GoPay/OVO/BCA</p>
                </div>
              )}

              <button
                type="button"
                onClick={handleProcessPayment}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm shadow-md transition-all mt-4"
              >
                Konfirmasi & Cetak Struk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Preview Struk Pembayaran */}
      {isReceiptOpen && completedOrder && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 font-mono text-xs">
            <div className="text-center pb-4 border-b border-dashed border-slate-300">
              <h3 className="font-bold text-base text-slate-900">AROMA KOPI & CAFE</h3>
              <p className="text-slate-500 text-[10px]">Jl. Grafika No. 1, Yogyakarta</p>
              <p className="text-slate-500 text-[10px]">Telp: 0812-3456-7890</p>
            </div>

            <div className="py-3 border-b border-dashed border-slate-300 space-y-1 text-[11px] text-slate-600">
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

            <div className="py-3 border-b border-dashed border-slate-300 space-y-2">
              {completedOrder.items?.map((it, idx) => (
                <div key={idx} className="flex justify-between text-[11px]">
                  <div>
                    <p className="font-semibold">{it.name || it.menu?.name}</p>
                    <span className="text-[10px] text-slate-500">
                      {it.quantity} x {formatCurrency(it.unit_price || it.price)}
                    </span>
                    {it.notes && <p className="text-[9px] text-amber-700 italic">*{it.notes}</p>}
                  </div>
                  <span className="font-semibold">{formatCurrency(it.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="py-3 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(completedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Pajak (10%):</span>
                <span>{formatCurrency(completedOrder.tax_amount)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-slate-900 pt-1">
                <span>TOTAL:</span>
                <span>{formatCurrency(completedOrder.total_amount)}</span>
              </div>
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
            </div>

            <div className="text-center pt-4 text-[10px] text-slate-500">
              <p>Terima kasih atas kunjungan Anda!</p>
              <p>Wi-Fi: AromaCafe / Pass: kopienak123</p>
            </div>

            <div className="mt-5 flex gap-2 font-sans">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-800"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Struk</span>
              </button>
              <button
                onClick={() => setIsReceiptOpen(false)}
                className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
