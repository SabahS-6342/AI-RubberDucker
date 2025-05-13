import axios from 'axios';
import config from '../config';

const API_URL = config.apiUrl;

// Set up axios defaults
axios.defaults.baseURL = API_URL;

// Add a request interceptor to add the token to all requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('authStateChanged'));
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const register = async (userData) => {
  try {
    const response = await axios.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Registration failed');
  }
};

export const login = async (email, password) => {
  try {
    const response = await axios.post('/auth/login', { email, password });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Login failed');
  }
};

export const googleLogin = async () => {
  try {
    const response = await axios.get('/auth/google/login');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Google login failed');
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  window.dispatchEvent(new Event('authStateChanged'));
};

export const getUserProfile = async () => {
  try {
    const response = await axios.get('/auth/profile');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch profile');
  }
};

export const updateUserProfile = async (profileData) => {
  try {
    const response = await axios.put('/auth/profile', profileData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update profile');
  }
};

export const updateUserPreferences = async (preferences) => {
  try {
    const response = await axios.put('/auth/preferences', preferences);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update preferences');
  }
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
}; 