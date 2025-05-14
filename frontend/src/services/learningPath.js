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
  // Placeholder data for learning paths
  const placeholderPaths = [
    { id: 1, title: 'Web Development', description: 'A comprehensive path to becoming a web developer.', difficulty_level: 'Beginner', estimated_duration: '3 months', topics: ['HTML', 'CSS', 'JavaScript', 'React'] },
    { id: 2, title: 'Data Science', description: 'Learn data science and machine learning from scratch.', difficulty_level: 'Intermediate', estimated_duration: '6 months', topics: ['Python', 'Statistics', 'Machine Learning', 'Data Visualization'] },
    { id: 3, title: 'Mobile App Development', description: 'Build mobile applications for iOS and Android.', difficulty_level: 'Advanced', estimated_duration: '4 months', topics: ['Swift', 'Kotlin', 'React Native', 'Firebase'] },
  ];

  return placeholderPaths;
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

export const getStudyMaterials = async () => {
  // Placeholder data for study materials
  const placeholderMaterials = [
    { id: 1, title: 'Introduction to React', description: 'Learn the basics of React and its core concepts.' },
    { id: 2, title: 'Advanced JavaScript', description: 'Deep dive into advanced JavaScript topics and best practices.' },
    { id: 3, title: 'CSS and Styling', description: 'Master CSS and styling techniques for modern web applications.' },
  ];

  return placeholderMaterials;
}; 