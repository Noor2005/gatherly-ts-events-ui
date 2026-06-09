import axios from "axios";
import storage from "./storage";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.REACT_APP_API_BASE_URL;

let onUnauthorized = null;

export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(
  async (config) => {
    const token = await storage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      const url = error.config?.url || "";
      const isPublicEndpoint = url.includes("/public/") || url.includes("/auth/");

      if (!isPublicEndpoint) {
        await storage.multiRemove(["accessToken", "name", "email", "roles"]);
        onUnauthorized?.();
        return Promise.reject(new Error("Session expired or unauthorized."));
      }
    }
    return Promise.reject(error);
  },
);

export default api;
