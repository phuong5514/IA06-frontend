import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { API_ENDPOINTS, apiClient, tokenManager } from '../config/api';
import { tabSyncManager } from '../utils/tabSync';
import { transferGuestSession } from '../utils/guestSessionTransfer';
import toast from 'react-hot-toast';

interface User {
  email: string;
  id?: number;
  role?: string;
}

export type { User };

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  // Fetch user profile when authenticated
  const { data: userData, isLoading: isUserLoading, refetch: refetchUser } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.ME);
      return response.data.user;
    },
    enabled: !!tokenManager.getAccessToken(),
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Update user state when userData changes
  useEffect(() => {
    if (userData) {
      setUser(userData);
    }
  }, [userData]);

  // Watch for token changes and refetch user profile
  // This is needed when a guest token is set after the component mounts
  useEffect(() => {
    const token = tokenManager.getAccessToken();
    if (token && !user) {
      // Token exists but no user data - refetch
      refetchUser();
    }
  }, [user, refetchUser]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await apiClient.post(API_ENDPOINTS.LOGIN, { email, password });
      return response.data;
    },
    onSuccess: async (data) => {
      if (data.success && data.accessToken) {
        // Store access token in memory
        tokenManager.setAccessToken(data.accessToken);
        
        // Fetch user profile immediately to get role information
        try {
          const userResponse = await apiClient.get(API_ENDPOINTS.ME);
          const userData = userResponse.data.user;
          setUser(userData);
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          // Fallback to basic user data
          setUser({ email: data.email });
        }
        
        // Transfer guest session data if it exists
        const transferResult = await transferGuestSession();
        if (transferResult && transferResult.ordersTransferred > 0) {
          toast.success(`Welcome back! ${transferResult.ordersTransferred} order(s) from your guest session have been transferred.`);
        }
        
        // Invalidate queries to ensure fresh data
        queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
        queryClient.invalidateQueries({ queryKey: ['user', 'orders'] });
        
        // Broadcast login to other tabs
        tabSyncManager.broadcast({ type: 'login', timestamp: Date.now() });
      } else {
        // Handle unsuccessful login (backend returned success: false)
        throw new Error(data.message || 'Login failed');
      }
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await apiClient.post(API_ENDPOINTS.REGISTER, { email, password });
      return response.data;
    },
    onSuccess: async (data) => {
      if (!data.success) {
        // Handle unsuccessful registration (backend returned success: false)
        throw new Error(data.message || 'Registration failed');
      }
      
      // Note: Guest session will be transferred when user logs in after email verification
      // We store a flag to show a message about session transfer after verification
      const guestSessionStr = localStorage.getItem('guestSession');
      if (guestSessionStr) {
        localStorage.setItem('pendingGuestTransfer', 'true');
      }
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Perform logout request
      const response = await apiClient.post(API_ENDPOINTS.LOGOUT, {});
      return response.data;
    },
    onSettled: () => {
      // Clear access token from memory
      tokenManager.clearAccessToken();
      
      // Clear user state
      setUser(null);
      
      // Clear session data (guest sessions are in sessionStorage, not localStorage)
      sessionStorage.removeItem('tableSession');
      sessionStorage.removeItem('cart');
      sessionStorage.removeItem('guestOrders');
      
      // Clear all queries
      queryClient.clear();
      
      // Broadcast logout to other tabs
      tabSyncManager.broadcast({ type: 'logout', timestamp: Date.now() });
    },
  });

  // Listen for auth events from other tabs using BroadcastChannel/localStorage
  useEffect(() => {
    const unsubscribe = tabSyncManager.subscribe((event) => {
      if (event.type === 'logout') {
        // Another tab logged out
        tokenManager.clearAccessToken();
        setUser(null);
        queryClient.clear();
      } else if (event.type === 'login' || event.type === 'token_refresh') {
        // Another tab logged in or refreshed token - try to sync
        const trySync = async () => {
          try {
            const response = await apiClient.post(API_ENDPOINTS.REFRESH, {});
            if (response.data.success && response.data.accessToken) {
              tokenManager.setAccessToken(response.data.accessToken);
              refetchUser();
            }
          } catch (error) {
            // Failed to sync, ignore
            console.warn('Failed to sync auth state:', error);
          }
        };
        trySync();
      }
    });

    return unsubscribe;
  }, [queryClient, refetchUser]);

  // Detect when tab becomes visible and check auth state
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        // Tab became visible, check if we need to refresh auth
        if (!tokenManager.getAccessToken()) {
          try {
            const response = await apiClient.post(API_ENDPOINTS.REFRESH, {});
            if (response.data.success && response.data.accessToken) {
              tokenManager.setAccessToken(response.data.accessToken);
              refetchUser();
            }
          } catch (error) {
            // No valid session
          }
        } else {
          // Just refetch user data to ensure it's up to date
          refetchUser();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refetchUser]);

  // Try to refresh token on mount
  useEffect(() => {
    const tryRefresh = async () => {
      try {
        const response = await apiClient.post(API_ENDPOINTS.REFRESH, {});
        if (response.data.success && response.data.accessToken) {
          tokenManager.setAccessToken(response.data.accessToken);
          refetchUser();
        }
      } catch (error) {
        // No valid refresh token, user needs to login
        tokenManager.clearAccessToken();
      }
    };

    if (!tokenManager.getAccessToken()) {
      tryRefresh();
    }
  }, [refetchUser]);

  const login = useCallback(async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  }, [loginMutation]);

  const register = useCallback(async (email: string, password: string) => {
    await registerMutation.mutateAsync({ email, password });
  }, [registerMutation]);

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated: !!user, 
        isLoading: isUserLoading,
        login, 
        register,
        logout,
        refetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
