import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL;
export const authService = {
  register: async (name, email, password, role) => {
    const response = await axios.post(`${API_URL}/api/auth/register`, {
      name,
      email,
      password,
      role,
    });
    return response.data;
  },

  login: async (email, password) => {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email,
      password,
    });
    return response.data;
  },

  getMe: async (token) => {
    const response = await axios.get(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  googleLogin: () => {
    window.location.href = `${API_URL}/api/auth/google`;
  },
};
