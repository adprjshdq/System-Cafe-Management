import React, { createContext, useContext, useState, useMemo } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [orderType, setOrderType] = useState('dine_in');
  const [customerName, setCustomerName] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  const addToCart = (menu) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === menu.id);
      if (existing) {
        return prev.map((item) =>
          item.id === menu.id
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * Number(item.price) }
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
    setCartItems([]);
    setSelectedTable(null);
    setCustomerName('');
    setOrderNotes('');
  };

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
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
