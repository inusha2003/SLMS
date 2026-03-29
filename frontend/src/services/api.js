import axios from 'axios';
import { API_BASE } from '../lib/api.js';

// Match `lib/api.js`: when VITE_API_URL is unset, call backend directly on :5000 (avoids relying on Vite proxy).
const baseURL =
  !API_BASE || API_BASE === ''
    ? '/api'
    : `${String(API_BASE).replace(/\/+$/, '')}/api`;

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('lms_token');
      if (
        window.location.pathname !== '/login' &&
        window.location.pathname !== '/' &&
        window.location.pathname !== '/register'
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;