import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { FileText, ChevronRight } from 'lucide-react';

interface OrderSummary {
  id: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  total_amount: string;
  created_at: string;
  items_count: number;
}

export default function Orders() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    fetchOrders();
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/orders');
      setOrders(response.data.orders || []);
    } catch (err: any) {
      console.error('Failed to fetch orders:', err);
      setError(err.response?.data?.message || 'Failed to load orders');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 pt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-lg">Loading orders...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 pt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-red-600 mb-4">{error}</div>
            <button
              onClick={fetchOrders}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 pt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/billing')}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              View Bill & Pay
            </button>
            <button
              onClick={() => navigate('/menu/customer')}
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Back to Menu
            </button>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <FileText className="w-24 h-24 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-600 mb-6">Start browsing our menu to place your first order!</p>
            <button
              onClick={() => navigate('/menu/customer')}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div
                key={order.id}
                onClick={() => navigate(`/orders/${order.id}`)}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Order #{order.id}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          {new Date(order.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        <p>{order.items_count} item(s)</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3">
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Total</div>
                        <div className="text-2xl font-bold text-green-600">
                          ${parseFloat(order.total_amount).toFixed(2)}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/orders/${order.id}`);
                        }}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
                      >
                        View Details
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
