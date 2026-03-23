import { createContext, useState, useEffect, useCallback } from 'react';
import {
  decodeToken,
  getToken,
  removeToken,
  setToken,
  generateMockToken,
  isTokenValid,
} from '../utils/tokenUtils';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(null);
  const [loading, setLoading] = useState(true);

  const initializeAuth = useCallback(() => {
    try {
      const storedToken = getToken();
      if (storedToken && isTokenValid(storedToken)) {
        const decoded = decodeToken(storedToken);
        if (decoded && decoded.userId && decoded.role) {
          setUser(decoded);
          setTokenState(storedToken);
        } else {
          removeToken();
        }
      } else {
        removeToken();
      }
    } catch (err) {
      removeToken();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const loginAs = useCallback((role) => {
    const mockToken = generateMockToken(role);
    setToken(mockToken);
    const decoded = decodeToken(mockToken);
    setUser(decoded);
    setTokenState(mockToken);
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
    setTokenState(null);
  }, []);

  const value = {
    user,
    token,
    loading,
    loginAs,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};