import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ROUTE_ACCESS, ROLE_HOME } from './config/access';

import MainLayout from './layouts/MainLayout';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import PosPage from './pages/pos/PosPage';
import KitchenDisplay from './pages/kitchen/KitchenDisplay';
import MenuManagement from './pages/menus/MenuManagement';
import TableManagement from './pages/tables/TableManagement';
import OrderHistory from './pages/orders/OrderHistory';
import UserManagement from './pages/users/UserManagement';

// Protected Route Guard
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Kembalikan ke halaman utama sesuai role agar tidak terjadi redirect loop.
    return <Navigate to={ROLE_HOME[role] || '/login'} replace />;
  }

  return children;
}

function RoleRoute({ path, children }) {
  return (
    <ProtectedRoute allowedRoles={ROUTE_ACCESS[path]}>
      {children}
    </ProtectedRoute>
  );
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
              <Route
                index
                element={
                  <RoleRoute path="/">
                    <Dashboard />
                  </RoleRoute>
                }
              />
              <Route
                path="pos"
                element={
                  <RoleRoute path="/pos">
                    <PosPage />
                  </RoleRoute>
                }
              />
              <Route
                path="kitchen"
                element={
                  <RoleRoute path="/kitchen">
                    <KitchenDisplay />
                  </RoleRoute>
                }
              />
              <Route
                path="menus"
                element={
                  <RoleRoute path="/menus">
                    <MenuManagement />
                  </RoleRoute>
                }
              />
              <Route
                path="tables"
                element={
                  <RoleRoute path="/tables">
                    <TableManagement />
                  </RoleRoute>
                }
              />
              <Route
                path="orders"
                element={
                  <RoleRoute path="/orders">
                    <OrderHistory />
                  </RoleRoute>
                }
              />
              <Route
                path="users"
                element={
                  <RoleRoute path="/users">
                    <UserManagement />
                  </RoleRoute>
                }
              />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
