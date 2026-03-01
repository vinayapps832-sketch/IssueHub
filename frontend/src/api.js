import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// attach token from localStorage on every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
});

// on 401 response, clear token and redirect to login page
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401 && !window.location.pathname.includes('/login')) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

export default api;
