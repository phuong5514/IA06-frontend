import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { API_ENDPOINTS, apiClient, tokenManager } from '../config/api';

interface User {
  email: string;
  id?: number;
}

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

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await apiClient.post(API_ENDPOINTS.LOGIN, { email, password });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success && data.accessToken) {
        // Store access token in memory
        tokenManager.setAccessToken(data.accessToken);
        
        // Set user data
        setUser({ email: data.email });
        
        // Refetch user profile
        queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
        
        // Broadcast login to other tabs
        localStorage.setItem('auth_event', JSON.stringify({ type: 'login', timestamp: Date.now() }));
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
    onSuccess: (data) => {
      if (!data.success) {
        // Handle unsuccessful registration (backend returned success: false)
        throw new Error(data.message || 'Registration failed');
      }
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(API_ENDPOINTS.LOGOUT, {});
      return response.data;
    },
    onSettled: () => {
      // Clear access token from memory
      tokenManager.clearAccessToken();
      
      // Clear user state
      setUser(null);
      
      // Clear all queries
      queryClient.clear();
      
      // Broadcast logout to other tabs
      localStorage.setItem('auth_event', JSON.stringify({ type: 'logout', timestamp: Date.now() }));
    },
  });

  // Listen for auth events from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_event') {
        const event = JSON.parse(e.newValue || '{}');
        
        if (event.type === 'logout') {
          // Another tab logged out
          tokenManager.clearAccessToken();
          setUser(null);
          queryClient.clear();
        } else if (event.type === 'login') {
          // Another tab logged in - try to refetch user
          refetchUser();
        }
      } else if (e.key === 'token_event') {
        const event = JSON.parse(e.newValue || '{}');
        
        if (event.type === 'token_cleared') {
          // Token was cleared in another tab
          setUser(null);
          queryClient.clear();
        } else if (event.type === 'token_set') {
          // Token was set in another tab - try to refetch user
          refetchUser();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [queryClient, refetchUser]);

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
