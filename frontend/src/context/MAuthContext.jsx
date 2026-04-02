import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('lms_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      // Add timeout using Promise.race
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      );
      
      const { data } = await Promise.race([
        api.get('/profile/me'),
        timeoutPromise
      ]);
      setUser(data.user);
      if (data.user) localStorage.setItem('lms_user', JSON.stringify(data.user));
      else localStorage.removeItem('lms_user');
    } catch (error) {
      console.log('Fetch user failed:', error?.message || error);
      localStorage.removeItem('lms_token');
      localStorage.removeItem('lms_user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('lms_token', data.token);
    if (data.user) localStorage.setItem('lms_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    localStorage.setItem('lms_token', data.token);
    if (data.user) localStorage.setItem('lms_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('lms_token');
    localStorage.removeItem('lms_user');
    setUser(null);
  };

  const updateUser = (u) => {
    setUser(u);
    if (u) localStorage.setItem('lms_user', JSON.stringify(u));
    else localStorage.removeItem('lms_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};