import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('cafe_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('cafe_token'));
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/v1/auth/login', { email, password });
      if (response.data.success) {
        const { user: userData, token: userToken } = response.data.data;
        setUser(userData);
        setToken(userToken);
        localStorage.setItem('cafe_user', JSON.stringify(userData));
        localStorage.setItem('cafe_token', userToken);
        return { success: true, user: userData };
      }
    } catch (error) {
      // Demo / Offline fallback untuk keperluan presentasi jika DB MySQL belum dinyalakan di XAMPP/Laragon
      console.warn('Backend API uncontactable, using demo auth mode:', error);
      let demoRole = 'admin';
      let demoName = 'Demo Admin';
      if (email.includes('kasir')) {
        demoRole = 'cashier';
        demoName = 'Budi Kasir';
      } else if (email.includes('dapur')) {
        demoRole = 'kitchen';
        demoName = 'Chef Dapur';
      } else if (email.includes('pelayan')) {
        demoRole = 'waiter';
        demoName = 'Siti Pelayan';
      }

      const mockUser = {
        id: 99,
        name: demoName,
        email: email,
        role: demoRole,
      };
      const mockToken = 'mock_jwt_token_demo_mode';
      setUser(mockUser);
      setToken(mockToken);
      localStorage.setItem('cafe_user', JSON.stringify(mockUser));
      localStorage.setItem('cafe_token', mockToken);
      return { success: true, user: mockUser, isDemo: true };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token && token !== 'mock_jwt_token_demo_mode') {
        await api.post('/v1/auth/logout');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('cafe_user');
      localStorage.removeItem('cafe_token');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, role: user?.role, login, logout, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
