import { apiClient, API_ENDPOINTS } from '../config/api';

/**
 * Login user
 */
export const login = async (email: string, password: string) => {
  const response = await apiClient.post(API_ENDPOINTS.LOGIN, { email, password });
  return response.data;
};

/**
 * Signup/Register user
 */
export const signup = async (email: string, password: string, username: string) => {
  const response = await apiClient.post(API_ENDPOINTS.REGISTER, { email, password, username });
  return response.data;
};

/**
 * Logout user
 */
export const logout = async () => {
  const response = await apiClient.post(API_ENDPOINTS.LOGOUT);
  return response.data;
};

/**
 * Example: Fetch current user profile
 * The access token is automatically included via the axios interceptor
 */
export const fetchUserProfile = async () => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.ME);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    throw error;
  }
};

/**
 * Example: Make any authenticated GET request
 */
export const authenticatedGet = async (endpoint: string) => {
  try {
    const response = await apiClient.get(endpoint);
    return response.data;
  } catch (error) {
    console.error(`Failed to GET ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Example: Make any authenticated POST request
 */
export const authenticatedPost = async (endpoint: string, data: any) => {
  try {
    const response = await apiClient.post(endpoint, data);
    return response.data;
  } catch (error) {
    console.error(`Failed to POST ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Example: Make any authenticated PUT request
 */
export const authenticatedPut = async (endpoint: string, data: any) => {
  try {
    const response = await apiClient.put(endpoint, data);
    return response.data;
  } catch (error) {
    console.error(`Failed to PUT ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Example: Make any authenticated DELETE request
 */
export const authenticatedDelete = async (endpoint: string) => {
  try {
    const response = await apiClient.delete(endpoint);
    return response.data;
  } catch (error) {
    console.error(`Failed to DELETE ${endpoint}:`, error);
    throw error;
  }
};
