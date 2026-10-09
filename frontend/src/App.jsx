import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

import MainLayout from './layouts/MainLayout';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import PosPage from './pages/pos/PosPage';
import KitchenDisplay from './pages/kitchen/KitchenDisplay';
import MenuManagement from './pages/menus/MenuManagement';
import TableManagement from './pages/tables/TableManagement';
import OrderHistory from './pages/orders/OrderHistory';

// Protected Route Guard
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Jika tidak memiliki akses ke halaman tertentu, alihkan ke role default
    if (role === 'kitchen') return <Navigate to="/kitchen" replace />;
    if (role === 'cashier') return <Navigate to="/pos" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            {/* Route Login */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes didalam MainLayout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="pos" element={<PosPage />} />
              <Route path="kitchen" element={<KitchenDisplay />} />
              <Route path="menus" element={<MenuManagement />} />
              <Route path="tables" element={<TableManagement />} />
              <Route path="orders" element={<OrderHistory />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
