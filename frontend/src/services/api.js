import axios from "axios";
import { auth } from "../components/firebase";

const api = axios.create({
  baseURL: "http://localhost:5000"
});

// Add request interceptor to include Firebase auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
        console.log('API request with auth token:', config.url);
      } else {
        console.log('API request without auth (no user):', config.url);
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Unauthorized API request:', error.config?.url);
      // You might want to redirect to login or refresh the token here
    }
    return Promise.reject(error);
  }
);

export default api;