// Generate a base64 encoded demo token (simulates external auth)
export const generateMockToken = (role) => {
  const payload = {
    userId: role === 'Admin' ? 'admin-user-id-001' : 'student-user-id-002',
    name: role === 'Admin' ? 'Admin User' : 'John Student',
    email: role === 'Admin' ? 'admin@lms.com' : 'student@lms.com',
    role: role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
  };
  // Base64 encode the payload (simulates external JWT)
  return btoa(JSON.stringify(payload));
};

export const getToken = () => {
  return localStorage.getItem('lms_token');
};

export const setToken = (token) => {
  localStorage.setItem('lms_token', token);
};

export const removeToken = () => {
  localStorage.removeItem('lms_token');
};

export const decodeToken = (token) => {
  if (!token) return null;
  try {
    // Try base64 decode (our demo format)
    const decoded = JSON.parse(atob(token));
    return decoded;
  } catch {
    return null;
  }
};

export const isTokenValid = (token) => {
  if (!token) return false;
  const decoded = decodeToken(token);
  if (!decoded || !decoded.userId || !decoded.role) return false;
  const now = Math.floor(Date.now() / 1000);
  return !decoded.exp || decoded.exp > now;
};