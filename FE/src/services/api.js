import axios from 'axios';

// Update baseURL to match your Express Backend's running port
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  headers: {
    // Let axios/the browser set Content-Type automatically (especially for FormData)
  },
});

// Interceptor hook to inject JWT token into all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('safecode_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
