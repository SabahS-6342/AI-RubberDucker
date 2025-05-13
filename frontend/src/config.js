// Configuration object for API endpoints and settings
export default {
    API_BASE_URL: 'http://localhost:8000',
    API_ENDPOINTS: {
        AUTH: {
            LOGIN: '/api/auth/login',
            REGISTER: '/api/auth/register',
            GOOGLE: '/api/auth/google',
            REFRESH: '/token/refresh',
            EMAIL_LOGIN: '/api/auth/email-login'
        },
        DASHBOARD: {
            STATS: '/api/dashboard/stats',
            RECENT_ACTIVITY: '/api/dashboard/recent-activity'
        },
        CHAT: {
            BASE: '/api/chat',
            PDF_SUMMARY: '/api/chat/pdf-summary',
            SESSIONS: '/api/chat/sessions'
        },
        STUDY_MATERIALS: {
            LIST: '/api/study-materials',
            DETAIL: '/api/study-materials/:id',
            ADMIN: '/api/admin/study-materials'
        },
        LEARNING_PATHS: {
            LIST: '/api/learning-paths',
            DETAIL: '/api/learning-paths/:id'
        },
        SUBSCRIPTION: {
            PLANS: '/api/subscription/plans',
            CURRENT_USER: '/api/subscription/user/current',
            UPGRADE: '/api/subscription/upgrade'
        },
        USER: {
            PROFILE: '/api/user/profile',
            SETTINGS: '/api/user/settings',
            PREFERENCES: '/api/user/preferences'
        }
    },
    AXIOS_CONFIG: {
        timeout: 30000, // 30 seconds
        headers: {
            'Content-Type': 'application/json'
        }
    },
    AUTH_CONFIG: {
        TOKEN_KEY: 'auth_token',
        REFRESH_TOKEN_KEY: 'refresh_token',
        TOKEN_EXPIRY: 3600 // 1 hour in seconds
    }
}; 