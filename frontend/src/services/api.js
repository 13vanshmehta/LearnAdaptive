import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API Endpoints
export const apiService = {
  // Auth
  register: (email, password, full_name) =>
    api.post('/api/auth/register', { email, password, full_name }),
  
  login: (email, password) =>
    api.post('/api/auth/login', { email, password }),
  
  verifyOtp: (email, otp_code) =>
    api.post('/api/auth/verify-otp', { email, otp_code }),
  
  forgotPassword: (email) =>
    api.post('/api/auth/forgot-password', { email }),
  
  resetPassword: (email, otp_code, new_password) =>
    api.post('/api/auth/reset-password', { email, otp_code, new_password }),
  
  getCurrentUser: () =>
    api.get('/api/users/me'),
  
  deleteAccount: () =>
    api.delete('/api/users/me'),
  
  // Topics & Courses
  getTopics: () =>
    api.get('/api/topics'),
  
  // User Progress
  getUserProgress: () =>
    api.get('/api/progress'),
  
  getUserStats: () =>
    api.get('/api/stats'),
  
  // Recommendations & Dashboard
  getRecommendations: () =>
    api.get('/api/recommendations'),
  
  getDashboardData: () =>
    api.get('/api/dashboard'),

  // Rapid MCQ
  createRapidMcqSession: (topic, level) =>
    api.post('/api/rapid-mcq/session', { topic, level }),

  submitRapidMcqSession: (session_id, answers, time_taken_seconds) =>
    api.post('/api/rapid-mcq/submit', { session_id, answers, time_taken_seconds }),
  
  // Chat & Learning
  chat: (topic, message, history, level, mode, session_id) =>
    api.post('/api/chat', { topic, message, history, level, mode, session_id }),

  // Chat History
  getChatHistoryList: () =>
    api.get('/api/chat/history'),

  getChatSession: (session_id) =>
    api.get(`/api/chat/history/${session_id}`),

  deleteChatSession: (session_id) =>
    api.delete(`/api/chat/history/${session_id}`),
};

export default api;
