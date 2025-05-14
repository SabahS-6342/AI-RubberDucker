// Configuration object for API endpoints and settings
export default {
    API_BASE_URL: 'http://localhost:8000',
    API_ENDPOINTS: {
        AUTH: {
            LOGIN: '/api/auth/login',
            REGISTER: '/api/auth/register',
            GOOGLE: '/api/auth/google',
            REFRESH: '/api/auth/refresh'
        },
        DASHBOARD: {
            STATS: '/api/dashboard/stats',
            RECENT_ACTIVITY: '/api/dashboard/recent-activity'
        },
        CHAT: {
            BASE: '/api/chat',
            PDF_SUMMARY: '/api/chat/pdf-summary'
        },
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
        timeout: 30000,
        headers: {
            'Content-Type': 'application/json'
        },
        retry: 3,
        retryDelay: 1000
    }
}; 