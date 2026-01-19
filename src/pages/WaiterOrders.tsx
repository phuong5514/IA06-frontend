import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiClient } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import DashboardLayout from '../components/DashboardLayout';
import RejectionModal from '../components/RejectionModal';
import { Bell, CheckCircle, Check, Circle, List, Utensils, ScrollText, Package } from 'lucide-react';

interface OrderItem {
  id: number;
  menu_item_name: string;
  quantity: number;
  price: string;
}

interface WaiterOrder {
  id: number;
  user_id: string;
  table_id: number | null;
  user: {
    id: string;
    email: string;
    name?: string;
  };
  table?: {
    id: number;
    table_number: string;
  } | null;
  status: 'pending' | 'accepted' | 'rejected' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  total_amount: string;
  special_instructions?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
  items_count: number;
  items: OrderItem[];
}

export default function WaiterOrders() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { onNewOrder, onOrderStatusChange, onOrderAccepted, onOrderRejected, isConnected } = useWebSocket();
  const [orders, setOrders] = useState<WaiterOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [processingOrders, setProcessingOrders] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'table' | 'history'>('list');
  const [rejectionModal, setRejectionModal] = useState<{ isOpen: boolean; orderId: number | null; orderDetails?: any }>({
    isOpen: false,
    orderId: null,
  });
  const [orderCounts, setOrderCounts] = useState<{ pending: number; ready: number }>({ pending: 0, ready: 0 });

  const fetchOrders = useCallback(async () => {
    try {
      setError(null);
      const response = await apiClient.get('/orders/waiter/all', {
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

  const fetchOrderCounts = useCallback(async () => {
    try {
      const [pendingResponse, readyResponse] = await Promise.all([
        apiClient.get('/orders/waiter/all', { params: { status: 'pending' } }),
        apiClient.get('/orders/waiter/all', { params: { status: 'ready' } }),
      ]);
      setOrderCounts({
        pending: pendingResponse.data.orders?.length || 0,
        ready: readyResponse.data.orders?.length || 0,
      });
    } catch (err: any) {
      console.error('Failed to fetch order counts:', err);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    // Check if user has waiter role
    if (user?.role !== 'waiter' && user?.role !== 'admin' && user?.role !== 'super_admin') {
      navigate('/');
      return;
    }

    fetchOrders();
    fetchOrderCounts();
  }, [isAuthenticated, user, statusFilter, fetchOrders, fetchOrderCounts, navigate]);

  // WebSocket event listeners
  useEffect(() => {
    const unsubscribeNewOrder = onNewOrder((order) => {
      console.log('New order received:', order);
      toast.success(`New Order #${order.id}`, {
        duration: 5000,
        icon: <Bell className="w-5 h-5" />,
      });
      // Refresh orders list and counts
      fetchOrders();
      fetchOrderCounts();
    });

    const unsubscribeStatusChange = onOrderStatusChange((order) => {
      console.log('Order status changed:', order);
      
      // Show toast for ready status
      if (order.status === 'ready') {
        toast.success(`Order #${order.id} is ready!`, {
          duration: 5000,
          icon: <CheckCircle className="w-5 h-5" />,
        });
      }
      
      // Update the order in the list and counts
      fetchOrders();
      fetchOrderCounts();
    });

    const unsubscribeAccepted = onOrderAccepted((order) => {
      console.log('Order accepted:', order);
      toast.success(`Order #${order.id} accepted`, {
        duration: 3000,
        icon: <Check className="w-5 h-5" />,
      });
      fetchOrders();
      fetchOrderCounts();
    });

    const unsubscribeRejected = onOrderRejected((order) => {
      console.log('Order rejected:', order);
      fetchOrders();
      fetchOrderCounts();
    });

    return () => {
      unsubscribeNewOrder();
      unsubscribeStatusChange();
      unsubscribeAccepted();
      unsubscribeRejected();
    };
  }, [onNewOrder, onOrderStatusChange, onOrderAccepted, onOrderRejected, fetchOrders]);

  const handleAcceptOrder = async (orderId: number) => {
    try {
      setProcessingOrders(prev => new Set(prev).add(orderId));
      await apiClient.post(`/orders/${orderId}/accept`);
      await fetchOrders();
    } catch (err: any) {
      console.error('Failed to accept order:', err);
      alert(err.response?.data?.message || 'Failed to accept order');
    } finally {
      setProcessingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const openRejectionModal = (orderId: number) => {
    const order = orders.find(o => o.id === orderId);
    setRejectionModal({
      isOpen: true,
      orderId,
      orderDetails: {
        tableNumber: order?.table?.table_number,
        itemsCount: order?.items_count,
      },
    });
  };

  const handleRejectOrder = async (reason: string) => {
    if (!rejectionModal.orderId) return;

    const orderId = rejectionModal.orderId;
    try {
      setProcessingOrders(prev => new Set(prev).add(orderId));
      await apiClient.post(`/orders/${orderId}/reject`, { reason });
      toast.success(`Order #${orderId} rejected`);
      await fetchOrders();
    } catch (err: any) {
      console.error('Failed to reject order:', err);
      toast.error(err.response?.data?.message || 'Failed to reject order');
      throw err;
    } finally {
      setProcessingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

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
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'accepted':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'preparing':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'served':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return date.toLocaleDateString();
  };

  const getWaitTime = (dateString: string): number => {
    const date = new Date(dateString);
    const now = new Date();
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60)); // minutes
  };

  const getPriorityLevel = (order: WaiterOrder): { level: 'high' | 'medium' | 'low'; color: string; icon: React.ReactElement } => {
    const waitTime = getWaitTime(order.created_at);
    
    if (order.status === 'pending' && waitTime > 10) {
      return { level: 'high', color: 'text-red-600', icon: <Circle className="w-3 h-3 fill-red-600 text-red-600" /> };
    } else if (order.status === 'pending' && waitTime > 5) {
      return { level: 'medium', color: 'text-orange-600', icon: <Circle className="w-3 h-3 fill-orange-600 text-orange-600" /> };
    } else if (order.status === 'ready' && waitTime > 15) {
      return { level: 'high', color: 'text-red-600', icon: <Circle className="w-3 h-3 fill-red-600 text-red-600" /> };
    } else if (order.status === 'ready' && waitTime > 10) {
      return { level: 'medium', color: 'text-orange-600', icon: <Circle className="w-3 h-3 fill-orange-600 text-orange-600" /> };
    }
    
    return { level: 'low', color: 'text-green-600', icon: <Circle className="w-3 h-3 fill-green-600 text-green-600" /> };
  };

  const groupOrdersByTable = () => {
    const grouped: { [key: string]: WaiterOrder[] } = {};
    
    orders.forEach(order => {
      const tableKey = order.table ? `Table ${order.table.table_number}` : 'No Table';
      if (!grouped[tableKey]) {
        grouped[tableKey] = [];
      }
      grouped[tableKey].push(order);
    });
    
    return grouped;
  };

  if (loading && orders.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-lg">Loading orders...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">{/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Management</h1>
                <p className="text-gray-600">View and manage customer orders</p>
              </div>
              {/* Notification Badge */}
              {(orderCounts.pending > 0 || orderCounts.ready > 0) && (
                <div className="flex items-center gap-3">
                  {orderCounts.pending > 0 && (
                    <div className="relative">
                      <div className="flex items-center gap-2 bg-yellow-100 border-2 border-yellow-400 text-yellow-800 px-4 py-2 rounded-full shadow-md">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-bold text-lg">{orderCounts.pending}</span>
                        <span className="text-sm font-medium">Pending</span>
                      </div>
                    </div>
                  )}
                  {orderCounts.ready > 0 && (
                    <div className="relative">
                      <div className="flex items-center gap-2 bg-green-100 border-2 border-green-400 text-green-800 px-4 py-2 rounded-full shadow-md">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-bold text-lg">{orderCounts.ready}</span>
                        <span className="text-sm font-medium">Ready</span>
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

        {/* Status Filter */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Status Filters */}
            <div className="flex flex-wrap gap-2">
              {['pending', 'accepted', 'rejected', 'preparing', 'ready', 'served', 'completed', 'cancelled', 'all'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                    statusFilter === status
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2 border border-gray-300 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title="List View"
              >
                <List className="inline w-4 h-4 mr-1" />
                List
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title="Table View"
              >
                <Utensils className="inline w-4 h-4 mr-1" />
                Tables
              </button>
              <button
                onClick={() => {
                  setViewMode('history');
                  setStatusFilter('completed');
                }}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  viewMode === 'history'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title="History View"
              >
                <ScrollText className="inline w-4 h-4 mr-1" />
                History
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Orders Display */}
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
              {statusFilter === 'pending'
                ? 'No pending orders at the moment'
                : `No ${statusFilter} orders found`}
            </p>
          </div>
        ) : viewMode === 'table' ? (
          // Table View - Orders grouped by table
          <div className="space-y-6">
            {Object.entries(groupOrdersByTable()).map(([tableName, tableOrders]) => (
              <div key={tableName} className="bg-white rounded-xl shadow-md border-2 border-gray-200">
                <div className="bg-indigo-600 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Utensils className="w-6 h-6" />
                    <div>
                      <h3 className="text-xl font-bold">{tableName}</h3>
                      <p className="text-indigo-100 text-sm">{tableOrders.length} order(s)</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tableOrders.map((order) => {
                    const priority = getPriorityLevel(order);
                    return (
                      <div
                        key={order.id}
                        className={`bg-gray-50 rounded-lg p-4 border-2 ${
                          priority.level === 'high'
                            ? 'border-red-300 ring-2 ring-red-100'
                            : priority.level === 'medium'
                            ? 'border-orange-300 ring-2 ring-orange-100'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-bold text-gray-900">Order #{order.id}</h4>
                            <p className="text-xs text-gray-600">{getTimeAgo(order.created_at)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-lg ${priority.color}`} title={`${priority.level} priority`}>
                              {priority.icon}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold border capitalize ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-2">
                          {order.items_count} items · ${parseFloat(order.total_amount).toFixed(2)}
                        </div>

                        <div className="space-y-1">
                          {order.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAcceptOrder(order.id)}
                                disabled={processingOrders.has(order.id)}
                                className="flex-1 bg-green-600 text-white py-1.5 px-3 rounded text-xs font-medium hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                Accept
                              </button>
                              <button
                                onClick={() => openRejectionModal(order.id)}
                                disabled={processingOrders.has(order.id)}
                                className="flex-1 bg-red-600 text-white py-1.5 px-3 rounded text-xs font-medium hover:bg-red-700 disabled:bg-gray-400 flex items-center justify-center gap-1"
                              >
                                <Circle className="w-3 h-3" />
                                Reject
                              </button>
                            </div>
                          )}
                          {order.status === 'ready' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'served')}
                              disabled={processingOrders.has(order.id)}
                              className="w-full bg-indigo-600 text-white py-1.5 px-3 rounded text-xs font-medium hover:bg-indigo-700 disabled:bg-gray-400 flex items-center justify-center gap-1"
                            >
                              <Package className="w-3 h-3" />
                              Mark as Served
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/orders/${order.id}`)}
                            className="w-full bg-gray-200 text-gray-700 py-1.5 px-3 rounded text-xs font-medium hover:bg-gray-300"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : viewMode === 'history' ? (
          // History View - Completed orders for the day
          <div className="bg-white rounded-xl shadow-md">
            <div className="bg-gray-800 text-white px-6 py-4 rounded-t-xl">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <ScrollText className="w-5 h-5" />
                Order History - {new Date().toLocaleDateString()}
              </h3>
              <p className="text-gray-300 text-sm">Completed orders for today</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">#{order.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{order.table?.table_number || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{order.items_count} items</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">${parseFloat(order.total_amount).toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{getTimeAgo(order.created_at)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => navigate(`/orders/${order.id}`)}
                          className="text-indigo-600 hover:text-indigo-900 font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          // List View - Standard grid layout with priority indicators
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => {
              const priority = getPriorityLevel(order);
              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border-2 ${
                    priority.level === 'high'
                      ? 'border-red-400 ring-2 ring-red-100'
                      : priority.level === 'medium'
                      ? 'border-orange-400 ring-2 ring-orange-100'
                      : order.status === 'pending'
                      ? 'border-yellow-300 ring-2 ring-yellow-100'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="p-6">
                    {/* Order Header with Priority */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold text-gray-900">Order #{order.id}</h3>
                          <span className={`text-xl ${priority.color}`} title={`${priority.level} priority`}>
                            {priority.icon}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{getTimeAgo(order.created_at)}</p>
                        <p className="text-xs text-gray-500">Wait: {getWaitTime(order.created_at)} min</p>
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
                      <p className="text-sm text-gray-900">
                        {order.user ? (
                          order.user.name || order.user.email
                        ) : (
                          <span className="flex items-center gap-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Guest
                            </span>
                            {order.session_id && (
                              <span className="text-xs text-gray-500">
                                Session: {order.session_id.slice(-8)}
                              </span>
                            )}
                          </span>
                        )}
                      </p>
                      {order.table && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-indigo-100 text-indigo-800 text-xs font-medium">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                            </svg>
                            Table {order.table.table_number}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Order Items Summary */}
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Items ({order.items_count}):
                      </p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="text-sm flex justify-between text-gray-600"
                          >
                            <span>
                              {item.quantity}x {item.menu_item_name}
                            </span>
                            <span className="font-medium">${parseFloat(item.price).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Total */}
                    <div className="mb-4 pt-3 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-900">Total:</span>
                        <span className="text-xl font-bold text-green-600">
                          ${parseFloat(order.total_amount).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      {order.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAcceptOrder(order.id)}
                            disabled={processingOrders.has(order.id)}
                            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                          >
                            {processingOrders.has(order.id) ? (
                              'Processing...'
                            ) : (
                              <>
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Accept Order
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => openRejectionModal(order.id)}
                            disabled={processingOrders.has(order.id)}
                            className="w-full bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                          >
                            Reject Order
                          </button>
                        </>
                      )}

                      {order.status === 'ready' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'served')}
                          disabled={processingOrders.has(order.id)}
                          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
                        >
                          {processingOrders.has(order.id) ? 'Processing...' : (
                            <>
                              <Package className="w-4 h-4" />
                              Mark as Served
                            </>
                          )}
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
          Orders update automatically in real-time
        </div>
      </div>

      {/* Rejection Modal */}
      <RejectionModal
        isOpen={rejectionModal.isOpen}
        onClose={() => setRejectionModal({ isOpen: false, orderId: null })}
        onConfirm={handleRejectOrder}
        orderId={rejectionModal.orderId || 0}
        orderDetails={rejectionModal.orderDetails}
      />
    </DashboardLayout>
  );
}
