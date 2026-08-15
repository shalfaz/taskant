import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('taskant_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('taskant_token');
      localStorage.removeItem('taskant_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export const authApi = {
  register: (data: Record<string, string>) => api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const usersApi = {
  get: (id: string) => api.get(`/users/${id}`),
  getReviews: (id: string) => api.get(`/users/${id}/reviews`),
  updateProfile: (data: Record<string, unknown>) => api.put('/users/profile', data),
  getRecommendations: (taskId: string) => api.get(`/users/recommendations/${taskId}`),
};

export const tasksApi = {
  list: (params?: Record<string, string>) => api.get('/tasks', { params }),
  featured: () => api.get('/tasks/featured'),
  get: (id: string) => api.get(`/tasks/${id}`),
  create: (data: Record<string, unknown>) => api.post('/tasks', data),
  updateStatus: (id: string, data: { status: string; note?: string }) =>
    api.patch(`/tasks/${id}/status`, data),
  confirmCompletion: (id: string) => api.post(`/tasks/${id}/confirm-completion`),
};

export const bidsApi = {
  getByTask: (taskId: string) => api.get(`/bids/task/${taskId}`),
  getMyPending: () => api.get('/bids/my/pending'),
  create: (data: Record<string, unknown>) => api.post('/bids', data),
  accept: (id: string) => api.post(`/bids/${id}/accept`),
};

export const messagesApi = {
  getConversations: () => api.get('/messages/conversations'),
  getByTask: (taskId: string) => api.get(`/messages/task/${taskId}`),
  send: (data: { taskId: string; content: string }) => api.post('/messages', data),
};

export const notificationsApi = {
  list: () => api.get('/notifications'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

export const paymentsApi = {
  list: () => api.get('/payments'),
  create: (data: { taskId: string; method: string }) => api.post('/payments', data),
};

export const reviewsApi = {
  create: (data: Record<string, unknown>) => api.post('/reviews', data),
  getByUser: (userId: string) => api.get(`/reviews/user/${userId}`),
};

export const verificationApi = {
  submit: (data: Record<string, string>) => api.post('/verification', data),
  status: () => api.get('/verification/status'),
};

export const reportsApi = {
  create: (data: Record<string, unknown>) => api.post('/reports', data),
  my: () => api.get('/reports/my'),
};

export const dashboardApi = {
  get: () => api.get('/dashboard'),
};

export const adminApi = {
  stats: () => api.get('/admin/stats'),
  users: () => api.get('/admin/users'),
  suspendUser: (id: string, suspended: boolean) =>
    api.patch(`/admin/users/${id}/suspend`, { suspended }),
  tasks: () => api.get('/admin/tasks'),
  verifications: () => api.get('/admin/verifications'),
  updateVerification: (id: string, data: Record<string, string>) =>
    api.patch(`/admin/verifications/${id}`, data),
  reports: () => api.get('/admin/reports'),
  updateReport: (id: string, data: Record<string, string>) =>
    api.patch(`/admin/reports/${id}`, data),
};
