import axios from 'axios';
import config from '../config';

const api = axios.create({
    baseURL: config.API_BASE_URL,
    ...config.AXIOS_CONFIG
});

// Add request interceptor for authentication
api.interceptors.request.use(
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

export const getLearningPaths = async () => {
  try {
    const response = await api.get(config.API_ENDPOINTS.LEARNING_PATHS.LIST);
    return response.data;
  } catch (error) {
    console.error('Error fetching learning paths:', error);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw error;
  }
};

export const getLearningPathDetails = async (pathId) => {
  try {
    const response = await api.get(config.API_ENDPOINTS.LEARNING_PATHS.DETAIL.replace(':id', pathId));
    return response.data;
  } catch (error) {
    console.error('Error fetching learning path details:', error);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw error;
  }
}; 