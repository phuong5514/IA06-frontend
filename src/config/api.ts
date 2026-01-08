import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// In-memory token storage
let accessToken: string | null = null;

export const tokenManager = {
  getAccessToken: () => accessToken,
  setAccessToken: (token: string | null) => {
    accessToken = token;
  },
  clearAccessToken: () => {
    accessToken = null;
  },
};

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies
});

// Add request interceptor to attach access token
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: unknown) => void }> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Add response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the token using cookie
        const response = await axios.post(
          `${API_BASE_URL}/user/refresh`,
          {},
          { withCredentials: true }
        );

        if (response.data.success) {
          const { accessToken: newAccessToken } = response.data;
          
          // Store new access token in memory
          tokenManager.setAccessToken(newAccessToken);

          // Update the authorization header
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          processQueue(null, newAccessToken);
          
          // Retry the original request
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens
        processQueue(refreshError as Error, null);
        tokenManager.clearAccessToken();
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const API_ENDPOINTS = {
  REGISTER: '/user/register',
  LOGIN: '/user/login',
  REFRESH: '/user/refresh',
  LOGOUT: '/user/logout',
  ME: '/user/me',
  MENU_ITEM: (id: number) => `/menu/items/${id}`,
  REVIEWS: '/reviews',
  REVIEW_AVERAGE: (menuItemId: number) => `/reviews/average/${menuItemId}`,
  REVIEW_RESPOND: (reviewId: number) => `/reviews/${reviewId}/respond`,
  REVIEW_BY_ID: (reviewId: number) => `/reviews/${reviewId}`,
};

export default API_BASE_URL;
