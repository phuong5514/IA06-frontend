import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiClient } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { useSettings } from '../context/SettingsContext';
import DashboardLayout from '../components/DashboardLayout';
import { Sparkles, ClipboardList, ChefHat, CheckCircle, Flame, Utensils, Clock, AlertTriangle, Lightbulb, AlertCircle, FileEdit } from 'lucide-react';

interface OrderItem {
  id: number;
  menu_item_name: string;
  quantity: number;
  price: string;
  special_instructions?: string;
  preparation_time?: number;
  item_status?: 'pending' | 'preparing' | 'ready';
  modifiers?: Array<{
    modifier_group_name: string;
    modifier_option_name: string;
    price_adjustment: string;
  }>;
}

interface KitchenOrder {
  id: number;
  user: {
    id: string;
    email: string;
    name?: string;
  };
  table_id?: number;
  status: 'accepted' | 'preparing' | 'ready' | 'served';
  total_amount: string;
  created_at: string;
  updated_at: string;
  items_count: number;
  items: OrderItem[];
  preparation_started_at?: string;
}

interface ItemStatus {
  orderId: number;
  itemId: number;
  status: 'pending' | 'preparing' | 'ready';
}

export default function KitchenDisplay() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { onNewOrder, onOrderStatusChange, onOrderAccepted, isConnected } = useWebSocket();
  const { workflow } = useSettings();
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('preparing');
  const [processingOrders, setProcessingOrders] = useState<Set<number>>(new Set());
  const [itemStatuses, setItemStatuses] = useState<Map<string, ItemStatus>>(new Map());
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousOrderCountRef = useRef<number>(0);
  const [orderCounts, setOrderCounts] = useState<{ accepted: number; preparing: number }>({ accepted: 0, preparing: 0 });

  const fetchOrders = useCallback(async () => {
    try {
      setError(null);
      const response = await apiClient.get('/orders/kitchen/all', {
        params: { status: statusFilter },
      });
      const fetchedOrders = response.data.orders || [];
      
      // Initialize item statuses for new orders
      setItemStatuses(prev => {
        const newStatuses = new Map(prev);
        fetchedOrders.forEach((order: KitchenOrder) => {
          order.items.forEach(item => {
            const key = `${order.id}-${item.id}`;
            if (!newStatuses.has(key)) {
              newStatuses.set(key, {
                orderId: order.id,
                itemId: item.id,
                status: order.status === 'accepted' ? 'pending' : 'preparing'
              });
            }
          });
        });
        return newStatuses;
      });
      
      setOrders(fetchedOrders);
    } catch (err: any) {
      console.error('Failed to fetch orders:', err);
      setError(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const fetchOrderCounts = useCallback(async () => {
    try {
      const [acceptedResponse, preparingResponse] = await Promise.all([
        apiClient.get('/orders/kitchen/all', { params: { status: 'accepted' } }),
        apiClient.get('/orders/kitchen/all', { params: { status: 'preparing' } }),
      ]);
      setOrderCounts({
        accepted: acceptedResponse.data.orders?.length || 0,
        preparing: preparingResponse.data.orders?.length || 0,
      });
    } catch (err: any) {
      console.error('Failed to fetch order counts:', err);
    }
  }, []);

  // Timer update effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Setup audio notification
  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBg==');
  }, []);

  // Audio/visual notification for new orders
  useEffect(() => {
    if (orders.length > previousOrderCountRef.current && previousOrderCountRef.current > 0) {
      // Play audio notification
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.log('Audio play failed:', e));
      }
      // Flash notification
      document.title = 'NEW ORDER - Kitchen Display';
      setTimeout(() => {
        document.title = 'Kitchen Display System';
      }, 3000);
    }
    previousOrderCountRef.current = orders.length;
  }, [orders.length]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    // Check if user has kitchen role
    if (user?.role !== 'kitchen' && user?.role !== 'admin' && user?.role !== 'super_admin') {
      navigate('/');
      return;
    }

    fetchOrders();
    fetchOrderCounts();
  }, [isAuthenticated, user, statusFilter, fetchOrders, fetchOrderCounts, navigate]);

  // WebSocket event listeners
  useEffect(() => {
    const unsubscribeNewOrder = onNewOrder((order) => {
      console.log('[KitchenDisplay] newOrder event received:', order);
      
      // Only show "new order" toast for pending orders (not yet accepted)
      if (order.status === 'pending') {
        toast.success(`New Order #${order.id} - Waiting for waiter`, {
          duration: 5000,
          icon: <ClipboardList className="w-5 h-5" />,
        });
      }
      
      fetchOrders();
      fetchOrderCounts();
    });

    const unsubscribeStatusChange = onOrderStatusChange((order) => {
      console.log('[KitchenDisplay] orderStatusChange event received:', order);
      
      // Show toast for ready status
      if (order.status === 'ready') {
        toast.success(`Order #${order.id} marked as ready!`, {
          duration: 3000,
          icon: <CheckCircle className="w-5 h-5" />,
        });
      }
      
      fetchOrders();
      fetchOrderCounts();
    });

    const unsubscribeAccepted = onOrderAccepted((order) => {
      console.log('[KitchenDisplay] orderAccepted event received:', order);
      // Play audio notification
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.log('Audio play failed:', e));
      }
      toast.success(`Order #${order.id} ready to prepare!`, {
        duration: 5000,
        icon: <ChefHat className="w-5 h-5" />,
        style: {
          background: '#10b981',
          color: '#fff',
        },
      });
      fetchOrders();
      fetchOrderCounts();
    });

    return () => {
      unsubscribeNewOrder();
      unsubscribeStatusChange();
      unsubscribeAccepted();
    };
  }, [onNewOrder, onOrderStatusChange, onOrderAccepted, fetchOrders]);

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      setProcessingOrders(prev => new Set(prev).add(orderId));
      await apiClient.patch(`/orders/${orderId}/status`, { status: newStatus });
      await fetchOrders();
      await fetchOrderCounts();
    } catch (err: any) {
      console.error('Failed to update order status:', err);
      alert(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setProcessingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const toggleItemStatus = (orderId: number, itemId: number) => {
    const key = `${orderId}-${itemId}`;
    setItemStatuses(prev => {
      const newStatuses = new Map(prev);
      const currentStatus = prev.get(key)?.status || 'pending';
      const newStatus = currentStatus === 'pending' ? 'preparing' : 
                       currentStatus === 'preparing' ? 'ready' : 'pending';
      newStatuses.set(key, { orderId, itemId, status: newStatus });
      return newStatuses;
    });
  };

  const markAllItemsReady = (orderId: number, items: OrderItem[]) => {
    setItemStatuses(prev => {
      const newStatuses = new Map(prev);
      items.forEach(item => {
        const key = `${orderId}-${item.id}`;
        newStatuses.set(key, { orderId, itemId: item.id, status: 'ready' });
      });
      return newStatuses;
    });
    toast.success(`All items for Order #${orderId} marked as ready!`);
  };

  const getItemStatus = (orderId: number, itemId: number): 'pending' | 'preparing' | 'ready' => {
    const key = `${orderId}-${itemId}`;
    return itemStatuses.get(key)?.status || 'pending';
  };

  const areAllItemsReady = (orderId: number, items: OrderItem[]): boolean => {
    return items.every(item => getItemStatus(orderId, item.id) === 'ready');
  };

  const getOrderElapsedTime = (createdAt: string): number => {
    const created = new Date(createdAt);
    return Math.floor((currentTime.getTime() - created.getTime()) / 1000);
  };

  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getEstimatedPrepTime = (items: OrderItem[]): number => {
    if (!items.length) return 0;
    const defaultPrepTime = workflow.kitchenPreparationAlertTime || 15;
    const totalMinutes = items.reduce((sum, item) => sum + (item.preparation_time || defaultPrepTime), 0);
    return Math.ceil(totalMinutes / items.length); // Average prep time
  };

  const getOrderUrgencyLevel = (createdAt: string): 'normal' | 'warning' | 'urgent' => {
    const elapsed = getOrderElapsedTime(createdAt) / 60; // Convert to minutes
    const alertThreshold = workflow.kitchenPreparationAlertTime || 15;
    
    if (elapsed >= alertThreshold) {
      return 'urgent'; // Red - exceeded alert threshold
    } else if (elapsed >= alertThreshold * 0.75) {
      return 'warning'; // Yellow - approaching alert threshold (75%)
    }
    return 'normal'; // Blue - within acceptable time
  };

  const isRushOrder = (createdAt: string): boolean => {
    return getOrderUrgencyLevel(createdAt) === 'urgent';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'preparing':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'served':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };



  if (loading && orders.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Kitchen Display System</h1>
                <p className="text-gray-600">View and manage orders in preparation</p>
              </div>
              {/* Notification Badge */}
              {(orderCounts.accepted > 0 || orderCounts.preparing > 0) && (
                <div className="flex items-center gap-3">
                  {orderCounts.accepted > 0 && (
                    <div className="relative">
                      <div className="flex items-center gap-2 bg-blue-100 border-2 border-blue-400 text-blue-800 px-4 py-2 rounded-full shadow-md">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-bold text-lg">{orderCounts.accepted}</span>
                        <span className="text-sm font-medium">New</span>
                      </div>
                    </div>
                  )}
                  {orderCounts.preparing > 0 && (
                    <div className="relative">
                      <div className="flex items-center gap-2 bg-purple-100 border-2 border-purple-400 text-purple-800 px-4 py-2 rounded-full shadow-md">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                        </svg>
                        <span className="font-bold text-lg">{orderCounts.preparing}</span>
                        <span className="text-sm font-medium">Preparing</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Connection Status Indicator */}
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="mb-6 flex space-x-2 bg-white rounded-lg p-2 shadow-sm">
          {[
            { value: 'accepted', label: 'New Orders', icon: <Sparkles className="w-5 h-5 inline" /> },
            { value: 'preparing', label: 'Preparing', icon: <Flame className="w-5 h-5 inline" /> },
            { value: 'ready', label: 'Ready', icon: <CheckCircle className="w-5 h-5 inline" /> },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                statusFilter === tab.value
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Rush Orders Section */}
        {orders.filter(order => {
          return order.status === 'preparing' && isRushOrder(order.created_at);
        }).length > 0 && (
          <div className="mb-6">
            <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 mb-4">
              <h2 className="text-2xl font-bold text-red-800 mb-4 flex items-center gap-2">
                <AlertCircle className="w-6 h-6 animate-pulse text-red-600" />
                RUSH ORDERS - URGENT
                <AlertCircle className="w-6 h-6 animate-pulse text-red-600" />
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {orders
                  .filter(order => {
                    return order.status === 'preparing' && isRushOrder(order.created_at);
                  })
                  .map(order => {
                    const elapsedSeconds = getOrderElapsedTime(order.created_at);
                    const estimatedTime = getEstimatedPrepTime(order.items);
                    
                    return (
                      <div
                        key={order.id}
                        className="bg-white border-4 border-red-500 rounded-xl shadow-lg p-4 animate-pulse"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-3xl font-bold text-red-600">#{order.id}</span>
                            {order.table_id && (
                              <span className="px-3 py-1 bg-red-600 text-white rounded-full font-bold text-lg">
                                Table {order.table_id}
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-red-600">
                              {formatTimer(elapsedSeconds)}
                            </div>
                            <div className="text-xs text-red-500">Est: {estimatedTime}m</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'ready')}
                          disabled={processingOrders.has(order.id)}
                          className="w-full bg-red-600 text-white py-2 px-4 rounded-lg font-bold hover:bg-red-700"
                        >
                          COMPLETE NOW
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Orders Grid */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h2>
            <p className="text-gray-600">
              {statusFilter === 'preparing'
                ? 'No orders in preparation at the moment'
                : `No ${statusFilter} orders found`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => {
              const elapsedSeconds = getOrderElapsedTime(order.created_at);
              const urgencyLevel = getOrderUrgencyLevel(order.created_at);
              const isUrgent = urgencyLevel === 'urgent';
              const isWarning = urgencyLevel === 'warning';
              const allItemsReady = areAllItemsReady(order.id, order.items);

              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all border-2 ${
                    isUrgent && order.status === 'preparing'
                      ? 'border-red-400 ring-4 ring-red-100'
                      : isWarning && order.status === 'preparing'
                      ? 'border-yellow-400 ring-3 ring-yellow-100'
                      : order.status === 'preparing'
                      ? 'border-purple-300 ring-2 ring-purple-100'
                      : order.status === 'ready'
                      ? 'border-green-400 ring-2 ring-green-100'
                      : 'border-blue-200'
                  }`}
                >
                  <div className="p-6">
                    {/* Order Header with Timer */}
                    <div className="mb-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-2xl font-bold text-gray-900">
                            #{order.id}
                          </h3>
                          {order.table_id && (
                            <span className="px-3 py-1 bg-blue-600 text-white rounded-full font-bold text-lg">
                              <Utensils className="inline w-4 h-4 mr-1" />
                              Table {order.table_id}
                            </span>
                          )}
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border-2 capitalize ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      
                      {/* Preparation Timer */}
                      <div className={`p-3 rounded-lg mb-2 ${
                        isUrgent 
                          ? 'bg-red-100 border-2 border-red-400' 
                          : isWarning
                          ? 'bg-yellow-100 border-2 border-yellow-400'
                          : 'bg-blue-50 border-2 border-blue-200'
                      }`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <div className={`text-3xl font-bold ${
                              isUrgent 
                                ? 'text-red-600 animate-pulse' 
                                : isWarning
                                ? 'text-yellow-600'
                                : 'text-blue-600'
                            }`}>
                              {formatTimer(elapsedSeconds)}
                            </div>
                            <div className="text-xs text-gray-600">
                              Alert at: {workflow.kitchenPreparationAlertTime || 15} min 
                              {isUrgent && (
                                <>
                                  <AlertTriangle className="inline w-4 h-4 ml-2 mr-1" />
                                  OVERDUE
                                </>
                              )}
                              {isWarning && (
                                <>
                                  <Clock className="inline w-4 h-4 ml-2 mr-1" />
                                  WARNING
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-700">
                              {order.items_count} items
                            </div>
                            <div className="text-xs text-gray-500">
                              {order.items.filter(item => getItemStatus(order.id, item.id) === 'ready').length} ready
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <p className="text-xs font-medium text-gray-600">Customer:</p>
                        <p className="text-sm font-bold text-gray-900">
                          {order.user ? (
                            order.user.name || order.user.email
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Guest Order
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Order Items with Status Tracking */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-bold text-gray-700">
                          Items ({order.items_count}):
                        </p>
                        {order.status === 'preparing' && (
                          <button
                            onClick={() => markAllItemsReady(order.id, order.items)}
                            className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-1"
                          >
                            <CheckCircle className="w-3 h-3" />
                            All Ready
                          </button>
                        )}
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {order.items.map((item) => {
                          const itemStatus = getItemStatus(order.id, item.id);
                          return (
                            <div
                              key={item.id}
                              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                itemStatus === 'ready'
                                  ? 'bg-green-50 border-green-400'
                                  : itemStatus === 'preparing'
                                  ? 'bg-yellow-50 border-yellow-400'
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                              onClick={() => order.status === 'preparing' && toggleItemStatus(order.id, item.id)}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <div className="flex items-start gap-2 flex-1">
                                  <div className="flex-shrink-0 mt-1">
                                    {itemStatus === 'ready' ? (
                                      <CheckCircle className="w-5 h-5 text-green-600" />
                                    ) : itemStatus === 'preparing' ? (
                                      <Flame className="w-5 h-5 text-yellow-600" />
                                    ) : (
                                      <span className="text-gray-400 text-xl">○</span>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <span className={`font-bold text-base ${
                                      itemStatus === 'ready' ? 'text-green-800 line-through' : 'text-gray-900'
                                    }`}>
                                      {item.quantity}x {item.menu_item_name}
                                    </span>
                                    {item.preparation_time && (
                                      <div className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {item.preparation_time} min prep
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                  itemStatus === 'ready'
                                    ? 'bg-green-200 text-green-800'
                                    : itemStatus === 'preparing'
                                    ? 'bg-yellow-200 text-yellow-800'
                                    : 'bg-gray-200 text-gray-600'
                                }`}>
                                  {itemStatus}
                                </span>
                              </div>
                              
                              {/* Modifiers */}
                              {item.modifiers && item.modifiers.length > 0 && (
                                <div className="mt-2 ml-7 space-y-1">
                                  {item.modifiers.map((modifier, idx) => (
                                    <div key={idx} className="text-xs text-gray-600 pl-2 border-l-2 border-blue-300">
                                      + {modifier.modifier_option_name}
                                      {modifier.modifier_group_name && (
                                        <span className="text-gray-500 ml-1">
                                          - {modifier.modifier_group_name}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Special Instructions */}
                              {item.special_instructions && (
                                <div className="mt-2 ml-7 p-2 bg-yellow-100 rounded border border-yellow-300">
                                  <p className="text-xs font-bold text-yellow-900 flex items-center gap-1">
                                    <FileEdit className="w-3 h-3" />
                                    Special Note:
                                  </p>
                                  <p className="text-xs text-yellow-900">{item.special_instructions}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-xs text-gray-500 mt-2 italic flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" />
                        Click items to update status
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      {order.status === 'accepted' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'preparing')}
                          disabled={processingOrders.has(order.id)}
                          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-bold text-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          {processingOrders.has(order.id) ? 'Processing...' : (
                            <>
                              <Flame className="inline w-5 h-5 mr-1" />
                              Start Preparing
                            </>
                          )}
                        </button>
                      )}

                      {order.status === 'preparing' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'ready')}
                            disabled={processingOrders.has(order.id) || !allItemsReady}
                            className={`w-full py-3 px-4 rounded-lg font-bold text-lg transition-colors ${
                              allItemsReady
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            {processingOrders.has(order.id) ? 'Processing...' : 
                             allItemsReady ? (
                              <>
                                <CheckCircle className="inline w-4 h-4 mr-1" />
                                Mark Order Ready
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="inline w-4 h-4 mr-1" />
                                Complete All Items First
                              </>
                            )}
                          </button>
                          {!allItemsReady && (
                            <p className="text-xs text-center text-red-600">
                              Mark all items ready before completing order
                            </p>
                          )}
                        </>
                      )}

                      <button
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Auto-refresh notice */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Orders update automatically every 3 seconds
        </div>
      </div>
    </DashboardLayout>
  );
}
