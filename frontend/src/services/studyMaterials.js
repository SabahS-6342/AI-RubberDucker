import axios from 'axios';
import config from '../config';

const API_URL = config.API_BASE_URL;

export const getStudyMaterials = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/study-materials`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching study materials:', error);
    throw error;
  }
};

export const getStudyMaterialDetails = async (materialId) => {
  try {
    const response = await axios.get(`${API_URL}/api/study-materials/${materialId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching study material details:', error);
    throw error;
  }
}; 