import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const CART_STORAGE_KEY = 'cafe_cart_draft';
// Draft yang terlalu lama dibuang agar tidak muncul sebagai pesanan basi.
const CART_DRAFT_TTL_MS = 12 * 60 * 60 * 1000;

const EMPTY_DRAFT = {
  cartItems: [],
  selectedTable: null,
  orderType: 'dine_in',
  customerName: '',
  orderNotes: '',
};

function normalizeDraft(payload) {
  if (!payload || typeof payload !== 'object') return EMPTY_DRAFT;

  const cartItems = Array.isArray(payload.cartItems)
    ? payload.cartItems.filter(
        (item) => item && item.id != null && Number(item.quantity) > 0
      )
    : [];

  return {
    cartItems,
    selectedTable:
      payload.selectedTable && payload.selectedTable.id != null
        ? payload.selectedTable
        : null,
    orderType: payload.orderType === 'takeaway' ? 'takeaway' : 'dine_in',
    customerName: typeof payload.customerName === 'string' ? payload.customerName : '',
    orderNotes: typeof payload.orderNotes === 'string' ? payload.orderNotes : '',
  };
}

function loadDraft(userId) {
  if (!userId) return EMPTY_DRAFT;

  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return EMPTY_DRAFT;

    const payload = JSON.parse(raw);
    // Draft hanya dipulihkan untuk akun yang sama.
    if (String(payload?.ownerId) !== String(userId)) return EMPTY_DRAFT;

    const updatedAt = Number(payload?.updatedAt);
    if (!Number.isFinite(updatedAt) || Date.now() - updatedAt > CART_DRAFT_TTL_MS) {
      localStorage.removeItem(CART_STORAGE_KEY);
      return EMPTY_DRAFT;
    }

    return normalizeDraft(payload);
  } catch {
    return EMPTY_DRAFT;
  }
}

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [draft, setDraft] = useState(() => loadDraft(userId));
  const ownerRef = useRef(userId);

  const { cartItems, selectedTable, orderType, customerName, orderNotes } = draft;

  // Jangan bawa draft keranjang antar akun saat logout / ganti pengguna.
  useEffect(() => {
    if (ownerRef.current === userId) return undefined;

    ownerRef.current = userId;
    setDraft(loadDraft(userId));

    if (!userId) {
      try {
        localStorage.removeItem(CART_STORAGE_KEY);
      } catch {
        // localStorage bisa diblokir; abaikan.
      }
    }

    return undefined;
  }, [userId]);

  // Simpan draft agar tidak hilang saat halaman di-refresh.
  useEffect(() => {
    if (!userId) return;

    const hasDraftContent =
      draft.cartItems.length > 0 ||
      Boolean(draft.selectedTable) ||
      draft.orderType !== 'dine_in' ||
      draft.customerName.trim() !== '' ||
      draft.orderNotes.trim() !== '';

    try {
      if (!hasDraftContent) {
        localStorage.removeItem(CART_STORAGE_KEY);
        return;
      }

      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify({ ownerId: userId, updatedAt: Date.now(), ...draft })
      );
    } catch {
      // localStorage penuh/diblokir: transaksi tetap berjalan di memori.
    }
  }, [userId, draft]);

  const setCartItems = (updater) =>
    setDraft((prev) => ({
      ...prev,
      cartItems: typeof updater === 'function' ? updater(prev.cartItems) : updater,
    }));

  const setSelectedTable = (updater) =>
    setDraft((prev) => ({
      ...prev,
      selectedTable: typeof updater === 'function' ? updater(prev.selectedTable) : updater,
    }));

  const setOrderType = (updater) =>
    setDraft((prev) => ({
      ...prev,
      orderType: typeof updater === 'function' ? updater(prev.orderType) : updater,
    }));

  const setCustomerName = (updater) =>
    setDraft((prev) => ({
      ...prev,
      customerName: typeof updater === 'function' ? updater(prev.customerName) : updater,
    }));

  const setOrderNotes = (updater) =>
    setDraft((prev) => ({
      ...prev,
      orderNotes: typeof updater === 'function' ? updater(prev.orderNotes) : updater,
    }));

  const addToCart = (menu) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === menu.id);
      if (existing) {
        return prev.map((item) =>
          item.id === menu.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * Number(item.price),
              }
            : item
        );
      }
      return [
        ...prev,
        {
          ...menu,
          quantity: 1,
          notes: '',
          subtotal: Number(menu.price),
        },
      ];
    });
  };

  const updateQuantity = (menuId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(menuId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === menuId
          ? { ...item, quantity, subtotal: quantity * Number(item.price) }
          : item
      )
    );
  };

  const updateItemNotes = (menuId, notes) => {
    setCartItems((prev) =>
      prev.map((item) => (item.id === menuId ? { ...item, notes } : item))
    );
  };

  const removeFromCart = (menuId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== menuId));
  };

  const clearCart = () => {
    setDraft((prev) => ({
      ...prev,
      cartItems: [],
      selectedTable: null,
      customerName: '',
      orderNotes: '',
    }));
  };

  // Setelah refresh, harga/stok di draft bisa sudah berubah. Samakan dengan
  // katalog terbaru dan buang item yang sudah tidak tersedia.
  const syncWithCatalog = useCallback(({ menus = [], tables = [] } = {}) => {
    const menuById = new Map(menus.map((menu) => [String(menu.id), menu]));

    setDraft((prev) => {
      let changed = false;

      const nextItems = prev.cartItems.flatMap((item) => {
        const menu = menuById.get(String(item.id));
        if (!menu || menu.is_available === false) {
          changed = true;
          return [];
        }

        const stock = typeof menu.stock === 'number' ? menu.stock : null;
        if (stock !== null && stock <= 0) {
          changed = true;
          return [];
        }

        const quantity = stock !== null ? Math.min(item.quantity, stock) : item.quantity;
        const price = Number(menu.price);

        if (
          quantity !== item.quantity ||
          price !== Number(item.price) ||
          menu.name !== item.name
        ) {
          changed = true;
        }

        return [
          {
            ...menu,
            quantity,
            notes: item.notes || '',
            subtotal: quantity * price,
          },
        ];
      });

      const nextTable = prev.selectedTable
        ? tables.find((table) => String(table.id) === String(prev.selectedTable.id)) || null
        : null;
      if (nextTable?.id !== prev.selectedTable?.id) changed = true;

      return changed
        ? { ...prev, cartItems: nextItems, selectedTable: nextTable }
        : prev;
    });
  }, []);

  const { subtotal, taxAmount, totalAmount } = useMemo(() => {
    const sub = cartItems.reduce((acc, item) => acc + item.subtotal, 0);
    const tax = Math.round(sub * 0.1);
    const total = sub + tax;
    return { subtotal: sub, taxAmount: tax, totalAmount: total };
  }, [cartItems]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        selectedTable,
        orderType,
        customerName,
        orderNotes,
        subtotal,
        taxAmount,
        totalAmount,
        setSelectedTable,
        setOrderType,
        setCustomerName,
        setOrderNotes,
        addToCart,
        updateQuantity,
        updateItemNotes,
        removeFromCart,
        clearCart,
        syncWithCatalog,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
