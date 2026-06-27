import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error("[API] ERROR: VITE_API_URL is not set. API calls will fail.");
}

const mode = API_URL && API_URL.includes("localhost")
  ? "LOCAL"
  : "CLOUD";

if (API_URL && API_URL.includes("localhost") && import.meta.env.PROD) {
  console.warn("[API] WARNING: Production build targeting localhost API");
}

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
