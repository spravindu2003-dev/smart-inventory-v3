import api from './client';

export const loginUser = (email, password, signal) =>
  api.post('/auth/login', { email, password }, { signal });

export const getMe = (signal) =>
  api.get('/auth/me', { signal });
