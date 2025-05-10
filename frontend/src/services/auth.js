import axios from 'axios';
import config from '../config';

const API_URL = config.API_BASE_URL;

console.log("API URL:", API_URL);

export const login = async (email, password) => {
  try {
    console.log("Attempting login for:", email);
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email,
      password
    });
    
    console.log("Login response:", response.data);
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    throw error;
  }
};

export const googleLogin = async (googleToken) => {
  console.log("Google login triggered with token:", googleToken);
  try {
    console.log("Sending request to:", `${API_URL}/api/auth/google`);
    console.log("With token:", googleToken ? "Token present" : "No token");
    
    const response = await axios.post(`${API_URL}/api/auth/google?token=${googleToken}`);

    
    console.log("Response received:", response.data);
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  } catch (error) {
    console.error('Google login error:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
}; 