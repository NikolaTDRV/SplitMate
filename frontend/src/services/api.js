import axios from 'axios';

// L'URL de base de ton API. Utilise la variable d'environnement si elle existe, sinon localhost par défaut.
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Crée une instance d'axios avec une configuration par défaut.
// Toutes les requêtes faites avec `api` utiliseront cette URL de base.
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- INTERCEPTEUR DE REQUÊTE ---
// Cette fonction s'exécute AVANT chaque requête envoyée par `api`.
api.interceptors.request.use(
  (config) => {
    // 1. Récupère le token JWT depuis le localStorage.
    const token = localStorage.getItem('token');
    
    // 2. Si un token existe, on l'ajoute au header 'Authorization'.
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 3. Retourne la configuration modifiée pour que la requête puisse continuer.
    return config;
  },
  (error) => Promise.reject(error) // En cas d'erreur de configuration
);

// --- INTERCEPTEUR DE RÉPONSE ---
// Cette fonction s'exécute APRÈS chaque réponse reçue.
api.interceptors.response.use(
  (response) => response, // Si la réponse est un succès (status 2xx), on ne fait rien.
  (error) => {
    // Si on reçoit une erreur 401 (Non autorisé), cela signifie que le token est invalide ou expiré.
    if (error.response?.status === 401) {
      // On nettoie le localStorage et on redirige l'utilisateur vers la page de connexion.
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error); // On propage l'erreur pour qu'elle puisse être gérée dans les `catch`.
  }
);

// On exporte des objets contenant des fonctions claires pour chaque type de ressource.
// C'est beaucoup plus propre que de construire les URLs partout dans le code.

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

export const groupAPI = {
  create: (data) => api.post('/groups', data),
  getAll: () => api.get('/groups'),
  getById: (id) => api.get(`/groups/${id}`),
  addMember: (groupId, email) => api.post(`/groups/${groupId}/members`, { email }),
  removeMember: (groupId, memberId) => api.delete(`/groups/${groupId}/members/${memberId}`),
  delete: (id) => api.delete(`/groups/${id}`),
};

export const expenseAPI = {
  create: (data) => api.post('/expenses', data),
  getAll: (groupId) => api.get(`/expenses/group/${groupId}`),
  getBalances: (groupId) => api.get(`/expenses/balances/${groupId}`),
  delete: (id) => api.delete(`/expenses/${id}`),
};

export default api;
