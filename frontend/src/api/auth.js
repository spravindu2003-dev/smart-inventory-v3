import api from './client';

export const loginUser = (email, password) =>
  api.post('/auth/login', { email, password }).then((res) => res.data);

export const getMe = () =>
  api.get('/auth/me').then((res) => res.data);
