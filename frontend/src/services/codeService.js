import api from './api';

export const submitCode = async (codeData) => {
    try {
        // Validate required fields
        if (!codeData.code || !codeData.language_id) {
            throw new Error('Code and language are required');
        }

        const response = await api.post('/api/code/submit', {
            code: codeData.code,
            language_id: codeData.language_id,
            stdin: codeData.stdin || ''
        });

        return response.data;
    } catch (error) {
        console.error('Code submission error:', error);
        throw new Error(error.response?.data?.detail || 'Failed to submit code');
    }
};

export const getSubmissionHistory = async (exerciseId = null) => {
    try {
        const params = exerciseId ? { exercise_id: exerciseId } : {};
        const response = await api.get('/api/code/submissions', { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching submission history:', error);
        
        // Handle timeout
        if (error.code === 'ECONNABORTED') {
            throw new Error('Request timed out while fetching submission history');
        }

        // Handle network errors
        if (!error.response) {
            throw new Error('Network error while fetching submission history');
        }

        throw new Error(error.response?.data?.detail || 'Failed to fetch submission history');
    }
}; 