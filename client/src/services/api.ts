import axios from "axios";

const API_URL = "http://localhost:3000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute = error.config?.url?.includes("/auth/");
    if (error.response?.status === 401 && !isAuthRoute) {
      // Expired/invalid token on a protected route — clear session and redirect
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/sign";
    }
    return Promise.reject(error);
  },
);

export default api;
