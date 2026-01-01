import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../config/api';
import { useAuth } from '../context/AuthContext';

interface OrderItem {
  id: number;
  menu_item_id: number;
  menu_item_name: string;
  quantity: number;
  base_price: string;
  unit_price: string;
  price: string;
  special_instructions?: string;
  modifiers?: Array<{
    modifier_group_name: string;
    modifier_option_name: string;
    price_adjustment: string;
  }>;
}

interface Order {
  id: number;
  user_id: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  total_amount: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export default function OrderTracking() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    if (orderId) {
      fetchOrder(orderId);
      // Poll for updates every 10 seconds
      const interval = setInterval(() => fetchOrder(orderId), 10000);
      return () => clearInterval(interval);
    }
  }, [orderId, isAuthenticated]);

  const fetchOrder = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/orders/${id}`);
      console.log('Order data received:', response.data);
      setOrder(response.data);
    } catch (err: any) {
      console.error('Failed to fetch order:', err);
      setError(err.response?.data?.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-purple-100 text-purple-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusSteps = () => {
    const steps: Array<{
      key: string;
      label: string;
      completed?: boolean;
      active?: boolean;
    }> = [
      { key: 'pending', label: 'Order Placed' },
      { key: 'confirmed', label: 'Confirmed' },
      { key: 'preparing', label: 'Preparing' },
      { key: 'ready', label: 'Ready' },
      { key: 'delivered', label: 'Delivered' },
    ];

    if (!order) return steps;

    const currentIndex = steps.findIndex(s => s.key === order.status);
    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex && order.status !== 'cancelled',
      active: step.key === order.status,
    }));
  };

  if (loading && !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-lg">Loading order details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-red-600 mb-4">{error || 'Order not found'}</div>
            <button
              onClick={() => navigate('/menu/customer')}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700"
            >
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/menu/customer')}
            className="mb-4 flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Menu
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Order #{order.id}</h1>
          <p className="text-gray-600 mt-2">
            Placed on {new Date(order.created_at).toLocaleString()}
          </p>
        </div>

        {/* Status Badge */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Order Status</h2>
            <span
              className={`px-4 py-2 rounded-full font-medium capitalize ${getStatusColor(
                order.status
              )}`}
            >
              {order.status}
            </span>
          </div>

          {/* Status Timeline */}
          {order.status !== 'cancelled' && (
            <div className="relative">
              <div className="flex justify-between items-center">
                {getStatusSteps().map((step, index) => (
                  <div key={step.key} className="flex-1 relative">
                    <div className="flex flex-col items-center">
                      {/* Circle */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                          step.completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : step.active
                            ? 'bg-blue-500 border-blue-500 text-white animate-pulse'
                            : 'bg-gray-200 border-gray-300 text-gray-500'
                        }`}
                      >
                        {step.completed ? (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <span className="text-sm">{index + 1}</span>
                        )}
                      </div>
                      {/* Label */}
                      <div className="mt-2 text-xs font-medium text-center text-gray-700">
                        {step.label}
                      </div>
                    </div>
                    {/* Line */}
                    {index < getStatusSteps().length - 1 && (
                      <div
                        className={`absolute top-5 left-1/2 w-full h-0.5 ${
                          step.completed ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                        style={{ transform: 'translateY(-50%)' }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {order.status === 'cancelled' && (
            <div className="text-center text-red-600 font-medium">
              This order has been cancelled
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Order Items</h2>
          <div className="space-y-4">
            {order.items.map(item => (
              <div key={item.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {item.quantity}x {item.menu_item_name}
                    </h3>
                    
                    {/* Price Breakdown */}
                    <div className="mt-2 text-sm space-y-1">
                      <div className="flex justify-between text-gray-600">
                        <span>Base price:</span>
                        <span>${parseFloat(item.base_price).toFixed(2)}</span>
                      </div>
                      
                      {item.modifiers && item.modifiers.length > 0 && (
                        <div className="space-y-1">
                          {item.modifiers.map((mod, idx) => (
                            <div key={idx} className="flex justify-between text-gray-600">
                              <span className="pl-2">+ {mod.modifier_option_name}:</span>
                              <span className={parseFloat(mod.price_adjustment) >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {parseFloat(mod.price_adjustment) > 0 ? '+' : ''}
                                ${parseFloat(mod.price_adjustment).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex justify-between font-medium text-gray-700 pt-1 border-t border-gray-200">
                        <span>Subtotal per item:</span>
                        <span>${parseFloat(item.unit_price).toFixed(2)}</span>
                      </div>
                      
                      {item.quantity > 1 && (
                        <div className="flex justify-between text-gray-600">
                          <span>Quantity: {item.quantity}</span>
                        </div>
                      )}
                    </div>
                    
                    {item.special_instructions && (
                      <div className="mt-2 text-sm text-gray-600 italic bg-gray-50 p-2 rounded">
                        <span className="font-medium">Note:</span> {item.special_instructions}
                      </div>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-lg font-bold text-green-600">
                      ${parseFloat(item.price).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Total
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total</span>
              <span className="text-green-600">${parseFloat(order.total_amount).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Auto-refresh notice */}
        <div className="text-center text-sm text-gray-500">
          Order status updates automatically every 10 seconds
        </div>
      </div>
    </div>
  );
}
