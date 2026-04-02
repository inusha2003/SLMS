import axios from 'axios';
import { getToken, removeToken } from '../utils/tokenUtils';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
});

// Request interceptor - attach token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Log outgoing requests in development
    if (import.meta.env.DEV) {
      console.log(`🌐 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
      if (config.data instanceof FormData) {
        console.log('   Sending FormData');
      }
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
axiosInstance.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`✅ ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    if (import.meta.env.DEV) {
      console.error(`❌ ${status} ${error.config?.url}:`, message);
      if (error.response?.data) {
        console.error('   Response data:', error.response.data);
      }
    }

    if (status === 401) {
      removeToken();
      window.location.href = '/';
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;