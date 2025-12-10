// Example: Making authenticated API requests with axios

import { apiClient, API_ENDPOINTS } from '../config/api';

// ============================================
// 1. LOGIN (stores tokens automatically)
// ============================================
export async function loginExample(email: string, password: string) {
  try {
    const response = await apiClient.post(API_ENDPOINTS.LOGIN, {
      email,
      password,
    });

    const { accessToken, refreshToken } = response.data;
    
    // Store tokens (done in component)
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    return response.data;
  } catch (error: any) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
}

// ============================================
// 2. REGISTER
// ============================================
export async function registerExample(email: string, password: string) {
  try {
    const response = await apiClient.post(API_ENDPOINTS.REGISTER, {
      email,
      password,
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Registration failed:', error.response?.data || error.message);
    throw error;
  }
}

// ============================================
// 3. PROTECTED REQUEST (uses stored access token automatically)
// ============================================
export async function getCurrentUser() {
  try {
    // The access token is automatically attached by the interceptor
    const response = await apiClient.get(API_ENDPOINTS.ME);
    return response.data;
  } catch (error: any) {
    console.error('Failed to get user:', error.response?.data || error.message);
    throw error;
  }
}

// ============================================
// 4. LOGOUT (revokes refresh token)
// ============================================
export async function logoutExample() {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (refreshToken) {
      await apiClient.post(API_ENDPOINTS.LOGOUT, { refreshToken });
    }
    
    // Clear tokens
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  } catch (error: any) {
    console.error('Logout failed:', error.response?.data || error.message);
    // Clear tokens anyway
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
}

// ============================================
// 5. MANUAL TOKEN REFRESH (usually automatic via interceptor)
// ============================================
export async function refreshTokenExample() {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await apiClient.post(API_ENDPOINTS.REFRESH, {
      refreshToken,
    });
    
    const { accessToken, refreshToken: newRefreshToken } = response.data;
    
    // Update tokens
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', newRefreshToken);
    
    return response.data;
  } catch (error: any) {
    console.error('Token refresh failed:', error.response?.data || error.message);
    // Clear tokens if refresh fails
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    throw error;
  }
}

// ============================================
// USAGE IN COMPONENTS
// ============================================

/*
// In a React component:

import { apiClient, API_ENDPOINTS } from '../config/api';

function MyComponent() {
  const fetchProtectedData = async () => {
    try {
      // Automatically includes Authorization header with access token
      const response = await apiClient.get('/user/me');
      console.log('User data:', response.data);
      
      // If token is expired, interceptor will:
      // 1. Catch 401 error
      // 2. Use refresh token to get new access token
      // 3. Retry the original request automatically
    } catch (error) {
      console.error('Request failed:', error);
      // If refresh token is also expired, user is redirected to signin
    }
  };

  return <button onClick={fetchProtectedData}>Get My Data</button>;
}
*/
