import axios from 'axios';
import config from '../config';

const api = axios.create({
    baseURL: config.API_BASE_URL,
    ...config.AXIOS_CONFIG
});

// Add retry logic
api.interceptors.response.use(null, async (error) => {
    const { config } = error;
    if (!config || !config.retry) {
        return Promise.reject(error);
    }

    config.retryCount = config.retryCount || 0;

    if (config.retryCount >= config.retry) {
        return Promise.reject(error);
    }

    config.retryCount += 1;
    const delay = config.retryDelay || 1000;
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return api(config);
});

// Add request interceptor for authentication
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('Adding token to request:', config.url);
        } else {
            console.warn('No token found for request:', config.url);
        }
        return config;
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor for error handling
api.interceptors.response.use(
    (response) => {
        console.log('API Response:', response.config.url, response.status);
        return response;
    },
    (error) => {
        console.error('API Error:', error.config?.url, error.response?.status, error.response?.data);
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
        console.log('Fetching dashboard stats...');
        const response = await api.get(config.API_ENDPOINTS.DASHBOARD.STATS);
        console.log('Dashboard stats response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        console.error('Error details:', error.response?.data);
        throw error;
    }
};

export const getRecentActivity = async () => {
    try {
        console.log('Fetching recent activity...');
        const response = await api.get(config.API_ENDPOINTS.DASHBOARD.RECENT_ACTIVITY);
        console.log('Recent activity response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching recent activity:', error);
        console.error('Error details:', error.response?.data);
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