import { jwtDecode } from "jwt-decode";
import api from "./api";
import storage from "./storage";

const AUTH_KEYS = ["accessToken", "name", "email", "roles"];

let sessionCache = {
  accessToken: null,
  name: null,
  email: null,
  roles: null,
};

const syncCacheFromStorage = async () => {
  const [accessToken, name, email, roles] = await Promise.all(
    AUTH_KEYS.map((key) => storage.getItem(key)),
  );
  sessionCache = { accessToken, name, email, roles };
};

const persistSession = async (data) => {
  sessionCache = {
    accessToken: data.accessToken,
    name: data.name,
    email: data.email,
    roles: data.roles,
  };
  await Promise.all([
    storage.setItem("accessToken", data.accessToken),
    storage.setItem("name", data.name || ""),
    storage.setItem("email", data.email || ""),
    storage.setItem("roles", data.roles || ""),
  ]);
};

const sendOtp = async (email) => {
  try {
    return await api.post("/auth/send-otp", { email });
  } catch (error) {
    throw new Error(error.message || "Failed to send OTP. Please try again.");
  }
};

const loginWithOtp = async (email, otp) => {
  try {
    const response = await api.post("/auth/login", { email, otp });

    if (response.data?.accessToken) {
      await persistSession({
        accessToken: response.data.accessToken,
        name: response.data.name,
        email: response.data.email,
        roles: response.data.roles,
      });
    }

    return response;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Login failed. Please check your OTP and try again.";
    throw new Error(message);
  }
};

const isAuthenticated = () => {
  const token = sessionCache.accessToken;
  if (!token) return false;

  try {
    const decoded = jwtDecode(token);
    if (decoded.exp < Date.now() / 1000) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

const getUserEmail = () => sessionCache.email;
const getUserName = () => sessionCache.name;
const getUserRoles = () => sessionCache.roles || "";
const isAdmin = () => getUserRoles().includes("ROLE_ADMIN");

const logout = async () => {
  sessionCache = { accessToken: null, name: null, email: null, roles: null };
  await storage.multiRemove(AUTH_KEYS);
};

const initAuth = syncCacheFromStorage;

const authService = {
  sendOtp,
  loginWithOtp,
  isAuthenticated,
  logout,
  getUserEmail,
  getUserName,
  getUserRoles,
  isAdmin,
  initAuth,
};

export default authService;
