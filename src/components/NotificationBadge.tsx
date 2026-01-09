import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { apiClient } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';

interface OrderCounts {
  pending: number;
  ready: number;
  preparing: number;
}

interface NotificationBadgeProps {
  onClick?: () => void;
}

export default function NotificationBadge({ onClick }: NotificationBadgeProps) {
  const [counts, setCounts] = useState<OrderCounts>({ pending: 0, ready: 0, preparing: 0 });
  const { user } = useAuth();
  const { onNewOrder, onOrderStatusChange } = useWebSocket();

  const fetchCounts = async () => {
    try {
      if (!user) return;
      
      // For waiter or admin, fetch pending orders count
      if (user.role === 'waiter' || user.role === 'admin' || user.role === 'super_admin') {
        const pendingResponse = await apiClient.get('/orders/waiter/all', {
          params: { status: 'pending' },
        });
        const readyResponse = await apiClient.get('/orders/waiter/all', {
          params: { status: 'ready' },
        });
        
        setCounts({
          pending: pendingResponse.data.orders?.length || 0,
          ready: readyResponse.data.orders?.length || 0,
          preparing: 0,
        });
      } 
      // For kitchen staff, fetch preparing orders count
      else if (user.role === 'kitchen') {
        const preparingResponse = await apiClient.get('/orders/kitchen/all', {
          params: { status: 'preparing' },
        });
        const readyResponse = await apiClient.get('/orders/kitchen/all', {
          params: { status: 'ready' },
        });
        
        setCounts({
          pending: 0,
          ready: readyResponse.data.orders?.length || 0,
          preparing: preparingResponse.data.orders?.length || 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch order counts:', error);
    }
  };

  useEffect(() => {
    fetchCounts();
    // Refresh counts every 30 seconds
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Listen to WebSocket events to update counts in real-time
  useEffect(() => {
    const unsubscribeNew = onNewOrder(() => {
      fetchCounts();
    });

    const unsubscribeStatus = onOrderStatusChange(() => {
      fetchCounts();
    });

    return () => {
      unsubscribeNew();
      unsubscribeStatus();
    };
  }, [onNewOrder, onOrderStatusChange]);

  const totalCount = counts.pending + counts.ready + counts.preparing;

  if (totalCount === 0) return null;

  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      title="View Orders"
    >
      {/* Bell Icon */}
      <Bell className="w-6 h-6 text-gray-700" />

      {/* Badge */}
      <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white bg-red-600 rounded-full animate-pulse">
        {totalCount > 99 ? '99+' : totalCount}
      </span>

      {/* Detailed tooltip on hover */}
      <div className="absolute right-0 top-full mt-2 bg-gray-900 text-white text-xs rounded-lg p-2 whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none z-50">
        {counts.pending > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
            <span>{counts.pending} Pending</span>
          </div>
        )}
        {counts.ready > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
            <span>{counts.ready} Ready</span>
          </div>
        )}
        {counts.preparing > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
            <span>{counts.preparing} Preparing</span>
          </div>
        )}
      </div>
    </button>
  );
}
