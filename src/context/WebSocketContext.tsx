import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { tokenManager } from '../config/api';
import { useAuth } from './AuthContext';

interface Order {
  id: number;
  table_number: number;
  status: string;
  total_amount: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  rejection_reason?: string;
}

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onNewOrder: (callback: (order: Order) => void) => () => void;
  onOrderStatusChange: (callback: (order: Order, previousStatus: string) => void) => () => void;
  onOrderAccepted: (callback: (order: Order) => void) => () => void;
  onOrderRejected: (callback: (order: Order) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

const WEBSOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated } = useAuth();
  const reconnectTimeoutRef = useRef<number | undefined>(undefined);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (!isAuthenticated) {
      // Disconnect socket if user logs out
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const token = tokenManager.getAccessToken();
    if (!token) {
      return;
    }

    // Create socket connection with authentication
    const newSocket = io(WEBSOCKET_URL, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: maxReconnectAttempts,
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
    });

    newSocket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setIsConnected(false);
      
      // Handle reconnection for certain disconnect reasons
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect manually
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            console.log(`Reconnection attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);
            newSocket.connect();
          }, 2000);
        }
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    newSocket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    setSocket(newSocket);

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      newSocket.disconnect();
    };
  }, [isAuthenticated]);

  const onNewOrder = useCallback((callback: (order: Order) => void) => {
    if (!socket) return () => {};

    socket.on('newOrder', callback);
    return () => {
      socket.off('newOrder', callback);
    };
  }, [socket]);

  const onOrderStatusChange = useCallback((callback: (order: Order, previousStatus: string) => void) => {
    if (!socket) {
      console.warn('[WebSocketContext] onOrderStatusChange called but socket is null');
      return () => {};
    }

    console.log('[WebSocketContext] Registering orderStatusChange listener');
    socket.on('orderStatusChange', (order: Order, previousStatus: string) => {
      console.log('[WebSocketContext] orderStatusChange event received:', { order, previousStatus });
      callback(order, previousStatus);
    });
    return () => {
      console.log('[WebSocketContext] Unregistering orderStatusChange listener');
      socket.off('orderStatusChange', callback);
    };
  }, [socket]);

  const onOrderAccepted = useCallback((callback: (order: Order) => void) => {
    if (!socket) {
      console.warn('[WebSocketContext] onOrderAccepted called but socket is null');
      return () => {};
    }

    console.log('[WebSocketContext] Registering orderAccepted listener');
    socket.on('orderAccepted', (order: Order) => {
      console.log('[WebSocketContext] orderAccepted event received:', order);
      callback(order);
    });
    return () => {
      console.log('[WebSocketContext] Unregistering orderAccepted listener');
      socket.off('orderAccepted', callback);
    };
  }, [socket]);

  const onOrderRejected = useCallback((callback: (order: Order) => void) => {
    if (!socket) {
      console.warn('[WebSocketContext] onOrderRejected called but socket is null');
      return () => {};
    }

    console.log('[WebSocketContext] Registering orderRejected listener');
    socket.on('orderRejected', (order: Order) => {
      console.log('[WebSocketContext] orderRejected event received:', order);
      callback(order);
    });
    return () => {
      console.log('[WebSocketContext] Unregistering orderRejected listener');
      socket.off('orderRejected', callback);
    };
  }, [socket]);

  const value = {
    socket,
    isConnected,
    onNewOrder,
    onOrderStatusChange,
    onOrderAccepted,
    onOrderRejected,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
