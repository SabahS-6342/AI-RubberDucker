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

// Add response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized access
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const getDashboardStats = async () => {
    try {
        const response = await api.get(config.API_ENDPOINTS.DASHBOARD.STATS);
        return response.data;
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        throw error;
    }
};

export const getRecentActivity = async () => {
    try {
        const response = await api.get(config.API_ENDPOINTS.DASHBOARD.RECENT_ACTIVITY);
        return response.data;
    } catch (error) {
        console.error('Error fetching recent activity:', error);
        throw error;
    }
};

export const getLearningPaths = async () => {
    try {
        const response = await api.get(config.API_ENDPOINTS.LEARNING_PATHS.LIST);
        return response.data;
    } catch (error) {
        console.error('Error fetching learning paths:', error);
        throw error;
    }
};

export const getStudyMaterials = async () => {
    try {
        const response = await api.get(config.API_ENDPOINTS.STUDY_MATERIALS.LIST);
        return response.data;
    } catch (error) {
        console.error('Error fetching study materials:', error);
        throw error;
    }
};

export const sendChatMessage = async (message, topic = null, difficulty_level = null) => {
    try {
        const response = await api.post(config.API_ENDPOINTS.CHAT, { 
            message,
            topic,
            difficulty_level
        });
        return response.data;
    } catch (error) {
        console.error('Error sending chat message:', error);
        throw error;
    }
};

export default api; 