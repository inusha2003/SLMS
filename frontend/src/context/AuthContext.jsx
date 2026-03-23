import { createContext, useState, useEffect, useCallback } from 'react';
import { decodeToken, getToken, removeToken, setToken, generateMockToken } from '../utils/tokenUtils';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(null);
  const [loading, setLoading] = useState(true);

  const initializeAuth = useCallback(() => {
    const storedToken = getToken();
    if (storedToken) {
      try {
        // For demo: decode our base64 payload
        const decoded = JSON.parse(atob(storedToken));
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp > now) {
          setUser(decoded);
          setTokenState(storedToken);
        } else {
          removeToken();
        }
      } catch {
        removeToken();
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const loginAs = (role) => {
    const mockToken = generateMockToken(role);
    setToken(mockToken);
    const decoded = JSON.parse(atob(mockToken));
    setUser(decoded);
    setTokenState(mockToken);
  };

  const logout = () => {
    removeToken();
    setUser(null);
    setTokenState(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, loginAs, logout }}>
      {children}
    </AuthContext.Provider>
  );
};