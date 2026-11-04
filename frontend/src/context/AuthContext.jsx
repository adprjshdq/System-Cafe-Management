import React, { createContext, useContext, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('cafe_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      // Data sesi rusak: mulai dari kondisi belum login.
      return null;
    }
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

      // Server merespons tetapi login tidak berhasil (misal akun nonaktif)
      throw new Error(response.data.message || 'Login gagal. Silakan coba lagi.');
    } catch (error) {
      // Error dari server (kredensial salah, akun nonaktif, dll) harus
      // diteruskan ke halaman login agar pesannya bisa ditampilkan.
      if (error.response) {
        const data = error.response.data;
        const message =
          data?.message ||
          data?.errors?.email?.[0] ||
          data?.errors?.password?.[0] ||
          'Login gagal. Periksa kembali email dan kata sandi Anda.';
        const authError = new Error(message);
        authError.response = {
          ...error.response,
          data: { ...data, message },
        };
        throw authError;
      }

      if (error.message && !error.isAxiosError && !error.request) {
        // Error yang kita lempar sendiri di atas (respons sukses tanpa data)
        throw error;
      }

      // Backend tidak terjangkau: jangan membuat sesi demo palsu. Pengguna harus
      // tahu bahwa login gagal karena server/DB belum siap.
      console.error('Backend API tidak dapat dihubungi saat login:', error);
      throw new Error(
        'Tidak dapat terhubung ke server. Pastikan backend Laravel dan database MySQL sudah berjalan, lalu coba lagi.'
      );
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
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
    <AuthContext.Provider value={{ user, token, role: user?.role, login, logout, loading, isAuthenticated: !!user && !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
