import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============== AUTH ==============
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

// ============== GROUPS ==============
export const groupAPI = {
  create: (data) => api.post('/groups', data),
  getAll: () => api.get('/groups'),
  getById: (id) => api.get(`/groups/${id}`),
  addMember: (groupId, email) => api.post(`/groups/${groupId}/members`, { email }),
};

// ============== EXPENSES ==============
export const expenseAPI = {
  create: (data) => api.post('/expenses', data),
  getAll: (groupId) => api.get(`/expenses/group/${groupId}`),
  getBalances: (groupId) => api.get(`/expenses/balances/${groupId}`),
  delete: (id) => api.delete(`/expenses/${id}`),
  settle: (data) => api.post('/expenses/settle', data),
};

export default api;
