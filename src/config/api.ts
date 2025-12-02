const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const API_ENDPOINTS = {
  REGISTER: `${API_BASE_URL}/user/register`,
  LOGIN: `${API_BASE_URL}/user/login`,
};

export default API_BASE_URL;
