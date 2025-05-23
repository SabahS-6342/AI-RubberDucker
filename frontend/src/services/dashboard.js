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

export const getDashboardStats = async () => {
    try {
        const response = await api.get(config.API_ENDPOINTS.DASHBOARD.STATS);
        return response.data;
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        throw error;
    }
};

export const getRecentActivity = async () => {
    try {
        const response = await api.get(config.API_ENDPOINTS.DASHBOARD.RECENT_ACTIVITY);
        return response.data;
    } catch (error) {
        console.error('Error fetching recent activity:', error);
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        throw error;
    }
}; 