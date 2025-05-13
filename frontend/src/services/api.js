import axios from 'axios';
import config from '../config';

const api = axios.create({
    baseURL: 'http://localhost:8000',
    timeout: 60000, // 60 seconds
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add request interceptor for authentication
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
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
    async (error) => {
        const originalRequest = error.config;

        // If the error is 401 and we haven't tried to refresh the token yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                const response = await axios.post('http://localhost:8000/api/auth/refresh', {
                    refresh_token: refreshToken
                });

                const { access_token } = response.data;
                localStorage.setItem('access_token', access_token);

                // Retry the original request with the new token
                originalRequest.headers.Authorization = `Bearer ${access_token}`;
                return api(originalRequest);
            } catch (refreshError) {
                // If refresh token fails, redirect to login
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
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
        const response = await api.post('/api/chat', { 
            message,
            topic,
            difficulty_level
        });
        return response.data;
    } catch (error) {
        console.error('Error sending chat message:', error);
        throw new Error(error.response?.data?.detail || 'Failed to send chat message');
    }
};

// Coding Exercise API calls
export const saveCodingExercise = async (exerciseData) => {
    try {
        const response = await api.post(config.API_ENDPOINTS.CODING_EXERCISES.SAVE, exerciseData);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to save coding exercise');
    }
};

export const getCodingExercises = async () => {
    try {
        const response = await api.get(config.API_ENDPOINTS.CODING_EXERCISES.LIST);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch coding exercises');
    }
};

export const uploadCodingExerciseFile = async (file) => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post(config.API_ENDPOINTS.CODING_EXERCISES.UPLOAD, formData);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to upload coding exercise file');
    }
};

export default api; 