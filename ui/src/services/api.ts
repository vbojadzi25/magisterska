import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// In-memory only — no persistence (bank-app behaviour: login every session)
let authToken: string | null = null;

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const authAPI = {
  checkUsername: (username: string) =>
    api.get<{ available: boolean; reason?: string }>(`/auth/check-username?username=${encodeURIComponent(username)}`),

  register: (userData: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    dateOfBirth: string;
    nationality?: string;
  }) => api.post('/auth/register', userData),

  login: (credentials: { username: string; password: string }) =>
    api.post('/auth/login', credentials),

  verifyLogin: (data: { userId: string; code: string }) =>
    api.post('/auth/verify-login', data),

  resendLoginCode: (userId: string) =>
    api.post('/auth/resend-login-code', { userId }),

  me: () => api.get('/auth/me'),

  logout: () => api.post('/auth/logout'),

  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
};

export const banksAPI = {
  getAll: () => api.get('/banks'),
  getUserAccounts: () => api.get('/banks/accounts'),
  initiatePayment: (paymentData: any) => api.post('/banks/payments/initiate', paymentData),
};

export const bankAccountsAPI = {
  add: (data: {
    bankId: string;
    accountNumber: string;
    accountName: string;
    accountType?: string;
    currency?: string;
  }) => api.post('/banks/accounts', data),
  remove: (accountId: string) => api.delete(`/banks/accounts/${accountId}`),
};

export const usersAPI = {
  updateProfile: (data: { firstName?: string; lastName?: string; email?: string; bio?: string }) =>
    api.patch('/users/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/users/change-password', data),
  registerPushToken: (token: string) =>
    api.post('/users/push-token', { token }),
  clearPushToken: () =>
    api.post('/users/push-token', { token: null }),
};

export const contactsAPI = {
  sync: (contacts: { name: string; phoneNumber: string }[]) =>
    api.post('/contacts/sync', { contacts }),
  getAll: () => api.get('/contacts'),
  search: (query: string) =>
    api.get(`/contacts/search?query=${encodeURIComponent(query)}`),
  invite: (contactId: string) => api.post(`/contacts/${contactId}/invite`, {}),
};

export const friendsAPI = {
  getAll: () => api.get('/friends'),
  getRequests: () => api.get('/friends/requests'),
  sendRequest: (friendUserId: string) =>
    api.post('/friends/request', { friendUserId }),
  accept: (requestId: string) => api.post(`/friends/accept/${requestId}`, {}),
  decline: (requestId: string) => api.post(`/friends/decline/${requestId}`, {}),
  remove: (friendId: string) => api.delete(`/friends/${friendId}`),
  searchByUsername: (username: string) =>
    api.get('/friends/search', { params: { username } }),
};

export const transactionsAPI = {
  send: (data: { toUserId: string; fromBankAccountId: string; amount: string; description?: string; emoji?: string; privacy?: string }) =>
    api.post('/transactions/send', data),
  request: (data: { payerUserId: string; amount: string; description?: string; emoji?: string; privacy?: string }) =>
    api.post('/transactions/request', data),
  pay: (transactionId: string, fromBankAccountId: string) =>
    api.post(`/transactions/${transactionId}/pay`, { fromBankAccountId }),
  getHistory: (limit = 20, offset = 0) =>
    api.get('/transactions', { params: { limit, offset } }),
  getPendingRequests: () =>
    api.get('/transactions/pending-requests'),
};

export const testAPI = {
  health: () => axios.get('http://localhost:3000/health'),
};

export const getErrorMessage = (error: any, fallback = 'Something went wrong. Please try again.'): string => {
  const data = error?.response?.data;
  if (typeof data === 'string') return data;
  if (typeof data?.message === 'string') return data.message;
  if (typeof data?.error === 'string') return data.error;
  if (typeof data?.error?.message === 'string') return data.error.message;
  return fallback;
};

export default api;
