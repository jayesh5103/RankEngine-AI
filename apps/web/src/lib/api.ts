import axios from 'axios';

export const API_BASE = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE,
});

// Attach JWT from localStorage to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('re_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear stale token so ProtectedRoute redirects to /login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('re_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
