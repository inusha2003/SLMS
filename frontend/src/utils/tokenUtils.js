import { jwtDecode } from 'jwt-decode';

export const getToken = () => localStorage.getItem('lms_token');

export const setToken = (token) => localStorage.setItem('lms_token', token);

export const removeToken = () => localStorage.removeItem('lms_token');

export const decodeToken = (token) => {
  try {
    return jwtDecode(token);
  } catch {
    return null;
  }
};

export const isTokenValid = (token) => {
  if (!token) return false;
  const decoded = decodeToken(token);
  if (!decoded) return false;
  const now = Date.now() / 1000;
  return decoded.exp > now;
};

// For demo: generate a mock JWT token
export const generateMockToken = (role) => {
  // In production this comes from external auth
  // For demo purposes, we create a simple token structure
  const payload = {
    userId: role === 'Admin' ? 'admin-user-id-001' : 'student-user-id-001',
    name: role === 'Admin' ? 'Admin User' : 'John Student',
    email: role === 'Admin' ? 'admin@lms.com' : 'student@lms.com',
    role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24h
  };
  // Note: In real system, this is signed by server
  // For demo we just store the payload info alongside a fake token
  return btoa(JSON.stringify(payload));
};