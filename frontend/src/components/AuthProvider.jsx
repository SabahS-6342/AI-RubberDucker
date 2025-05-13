import React, { useEffect } from 'react';
import axios from 'axios';

const AuthProvider = ({ children }) => {
  useEffect(() => {
    // Set up axios default headers on app load
    const token = localStorage.getItem('access_token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    // Listen for auth state changes
    const handleAuthChange = () => {
      const newToken = localStorage.getItem('access_token');
      if (newToken) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      } else {
        delete axios.defaults.headers.common['Authorization'];
      }
    };

    window.addEventListener('authStateChanged', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  return children;
};

export default AuthProvider; 