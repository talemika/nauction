import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  changePassword: (passwordData) => api.post('/auth/change-password', passwordData),
  verifyToken: () => api.post('/auth/verify-token'),
};

// Auctions API
export const auctionsAPI = {
  getAuctions: (params) => api.get('/auctions', { params }),
  getAuction: (id) => api.get(`/auctions/${id}`),
  createAuction: (auctionData) => api.post('/auctions', auctionData),
  updateAuction: (id, auctionData) => api.put(`/auctions/${id}`, auctionData),
  deleteAuction: (id) => api.delete(`/auctions/${id}`),
  watchAuction: (id) => api.post(`/auctions/${id}/watch`),
  buyNow: (id) => api.post(`/auctions/${id}/buy-now`),
  getFeatured: (limit) => api.get('/auctions/featured/list', { params: { limit } }),
  getEndingSoon: (hours, limit) => api.get('/auctions/ending-soon/list', { params: { hours, limit } }),
  getCategories: () => api.get('/auctions/categories/list'),
};

// Bids API
export const bidsAPI = {
  placeBid: (bidData) => api.post('/bids', bidData),
  getBidHistory: (auctionId, params) => api.get(`/bids/auction/${auctionId}`, { params }),
  getMyBids: (params) => api.get('/bids/user/my-bids', { params }),
  getWinningBids: () => api.get('/bids/user/winning'),
  cancelAutoBid: (bidId) => api.post(`/bids/${bidId}/cancel-auto`),
  updateMaxBid: (bidId, maxBidAmount) => api.put(`/bids/${bidId}/update-max`, { maxBidAmount }),
  getBiddingStats: () => api.get('/bids/stats/user'),
};

// Users API (Admin)
export const usersAPI = {
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  updateUserRole: (id, role) => api.put(`/users/${id}/role`, { role }),
  updateUserBalance: (id, balance, operation) => api.put(`/users/${id}/balance`, { balance, operation }),
  updateUserStatus: (id, isActive) => api.put(`/users/${id}/status`, { isActive }),
  searchUsers: (term, params) => api.get(`/users/search/${term}`, { params }),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getUserStats: () => api.get('/users/stats/overview'),
};

// Upload API
export const uploadAPI = {
  uploadImages: (formData) => api.post('/upload/images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadVideos: (formData) => api.post('/upload/videos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadAuctionMedia: (auctionId, formData) => api.post(`/upload/auction/${auctionId}/media`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  removeAuctionMedia: (auctionId, mediaType, filename) => 
    api.delete(`/upload/auction/${auctionId}/media/${mediaType}/${filename}`),
  setMainImage: (auctionId, filename) => 
    api.put(`/upload/auction/${auctionId}/main-image`, { filename }),
  getMediaInfo: (filename) => api.get(`/upload/media-info/${filename}`),
  cleanupUnused: () => api.get('/upload/cleanup-unused'),
};

// Search API
export const searchAPI = {
  searchAuctions: (query, params) => api.get('/search/auctions', { params: { q: query, ...params } }),
  searchUsers: (query, params) => api.get('/search/users', { params: { q: query, ...params } }),
  getSuggestions: (query, limit) => api.get('/search/suggestions', { params: { q: query, limit } }),
  getPopularSearches: (limit) => api.get('/search/popular', { params: { limit } }),
  getFilterOptions: () => api.get('/search/filters/options'),
};

// Currency API
export const currencyAPI = {
  getRates: () => api.get('/search/currency/rates'),
  convert: (amount, fromCurrency, toCurrency) => 
    api.post('/search/currency/convert', { amount, fromCurrency, toCurrency }),
  getDualDisplay: (amount) => api.get(`/search/currency/dual/${amount}`),
  updateRates: () => api.put('/search/currency/update-rates'),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;

