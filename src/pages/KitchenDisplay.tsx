import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import DashboardLayout from '../components/DashboardLayout';

interface OrderItem {
  id: number;
  menu_item_name: string;
  quantity: number;
  price: string;
  special_instructions?: string;
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
}

export default function KitchenDisplay() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { onNewOrder, onOrderStatusChange, onOrderAccepted, isConnected } = useWebSocket();
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('preparing');
  const [processingOrders, setProcessingOrders] = useState<Set<number>>(new Set());

  const fetchOrders = useCallback(async () => {
    try {
      setError(null);
      const response = await apiClient.get('/orders/kitchen/all', {
        params: { status: statusFilter },
      });
      setOrders(response.data.orders || []);
    } catch (err: any) {
      console.error('Failed to fetch orders:', err);
      setError(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

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
  }, [isAuthenticated, user, statusFilter, fetchOrders, navigate]);

  // WebSocket event listeners
  useEffect(() => {
    const unsubscribeNewOrder = onNewOrder((order) => {
      console.log('New order received in kitchen:', order);
      fetchOrders();
    });

    const unsubscribeStatusChange = onOrderStatusChange((order) => {
      console.log('Order status changed in kitchen:', order);
      fetchOrders();
    });

    const unsubscribeAccepted = onOrderAccepted((order) => {
      console.log('Order accepted (kitchen view):', order);
      fetchOrders();
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

  const getTimeSinceOrder = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const minutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (minutes < 1) return 'Just now';
    return `${minutes} min`;
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
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Kitchen Display System</h1>
              <p className="text-gray-600">View and manage orders in preparation</p>
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
            { value: 'accepted', label: 'New Orders', icon: '🆕' },
            { value: 'preparing', label: 'Preparing', icon: '🔥' },
            { value: 'ready', label: 'Ready', icon: '✅' },
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
              const timeSinceOrder = getTimeSinceOrder(order.created_at);
              const isUrgent = parseInt(timeSinceOrder) > 15;

              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border-2 ${
                    order.status === 'preparing' && isUrgent
                      ? 'border-red-400 ring-2 ring-red-100'
                      : order.status === 'preparing'
                      ? 'border-purple-300 ring-2 ring-purple-100'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="p-6">
                    {/* Order Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">
                          Order #{order.id}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {order.table_id ? `Table ${order.table_id}` : 'No table'}
                        </p>
                        <p className={`text-lg font-bold mt-1 ${isUrgent ? 'text-red-600' : 'text-purple-600'}`}>
                          ⏱️ {timeSinceOrder}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border-2 capitalize ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>

                    {/* Customer Info */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">Customer:</p>
                      <p className="text-sm text-gray-900">{order.user.name || order.user.email}</p>
                    </div>

                    {/* Order Items */}
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Items ({order.items_count}):
                      </p>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-bold text-lg text-gray-900">
                                {item.quantity}x {item.menu_item_name}
                              </span>
                            </div>
                            
                            {/* Modifiers */}
                            {item.modifiers && item.modifiers.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {item.modifiers.map((modifier, idx) => {
                                  return (
                                    <div key={idx} className="text-sm text-gray-600 pl-2 border-l-2 border-blue-300">
                                        + {modifier.modifier_option_name}
                                        {modifier.modifier_group_name && (
                                            <span className="text-gray-500 ml-1">
                                            - {modifier.modifier_group_name}
                                            </span>
                                        )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Special Instructions */}
                            {item.special_instructions && (
                              <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                                <p className="text-xs font-medium text-yellow-800">📝 Note:</p>
                                <p className="text-sm text-yellow-900">{item.special_instructions}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      {order.status === 'accepted' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'preparing')}
                          disabled={processingOrders.has(order.id)}
                          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-bold text-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          {processingOrders.has(order.id) ? 'Processing...' : '🔥 Start Preparing'}
                        </button>
                      )}

                      {order.status === 'preparing' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'ready')}
                          disabled={processingOrders.has(order.id)}
                          className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-bold text-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          {processingOrders.has(order.id) ? 'Processing...' : '✅ Mark as Ready'}
                        </button>
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
