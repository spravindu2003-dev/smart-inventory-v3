import api from './client';

export const loginUser = (email, password, signal) =>
  api.post('/auth/login', { email, password }, { signal });

export const getMe = (signal) =>
  api.get('/auth/me', { signal });

export const changePassword = (currentPassword, newPassword, signal) =>
  api.put('/auth/change-password', { currentPassword, newPassword }, { signal });

export const forgotPassword = (email, signal) =>
  api.post('/auth/forgot-password', { email }, { signal });

export const resetPassword = (token, password, signal) =>
  api.post(`/auth/reset-password/${token}`, { password }, { signal });

export const registerUser = (username, email, password, signal) =>
  api.post('/auth/register', { username, email, password }, { signal });
