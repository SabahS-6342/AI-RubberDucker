// Configuration object for API endpoints and settings
export default {
    API_BASE_URL: 'http://localhost:8000',
    API_ENDPOINTS: {
        AUTH: {
            LOGIN: '/api/auth/login',
            REGISTER: '/api/auth/register',
            GOOGLE: '/api/auth/google',
            REFRESH: '/token/refresh'
        },
        DASHBOARD: {
            STATS: '/api/dashboard/stats',
            RECENT_ACTIVITY: '/api/dashboard/recent-activity'
        },
        CHAT: '/api/chat',
        STUDY_MATERIALS: {
            LIST: '/api/study-materials',
            DETAIL: '/api/study-materials/:id'
        },
        LEARNING_PATHS: {
            LIST: '/api/learning-paths',
            DETAIL: '/api/learning-paths/:id'
        },
        SUBSCRIPTION: {
            PLANS: '/api/subscription/plans',
            CURRENT_USER: '/api/subscription/user/current'
        }
    },
    AXIOS_CONFIG: {
        timeout: 10000,
        headers: {
            'Content-Type': 'application/json'
        }
    }
}; 