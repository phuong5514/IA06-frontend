import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Receipt, CheckCircle, Loader2, User, Clock, DollarSign, CreditCard, Banknote } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface OrderItem {
  id: number;
  menu_item_id: number;
  quantity: number;
  unit_price: string;
  total_price: string;
  menuItem: {
    id: number;
    name: string;
    price: string;
  };
}

interface Order {
  id: number;
  total_amount: string;
  created_at: string;
  items: OrderItem[];
}

interface Payment {
  payment: {
    id: number;
    payment_method: string;
    payment_status: string;
    total_amount: string;
    created_at: string;
    notes?: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
  orders: Order[];
}

const WaiterBillManagement = () => {
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchPendingPayments();
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchPendingPayments, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/payments/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingPayments(response.data);
    } catch (error: any) {
      console.error('Error fetching pending payments:', error);
      if (loading) {
        toast.error(error.response?.data?.message || 'Failed to fetch pending payments');
      }
    } finally {
      setLoading(false);
    }
  };

  const processCashPayment = async (paymentId: number) => {
    try {
      setProcessingId(paymentId);
      const token = localStorage.getItem('token');
      
      await axios.post(
        `${API_BASE_URL}/api/payments/cash/process`,
        {
          paymentId,
          notes,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success('Cash payment processed successfully');
      setSelectedPayment(null);
      setNotes('');
      fetchPendingPayments();
    } catch (error: any) {
      console.error('Error processing cash payment:', error);
      toast.error(error.response?.data?.message || 'Failed to process payment');
    } finally {
      setProcessingId(null);
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <Banknote className="w-5 h-5" />;
      case 'stripe':
      case 'card':
        return <CreditCard className="w-5 h-5" />;
      default:
        return <DollarSign className="w-5 h-5" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash':
        return 'Cash Payment';
      case 'stripe':
        return 'Card Payment (Stripe)';
      case 'card':
        return 'Card Payment';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                <Receipt className="w-8 h-8 mr-3 text-blue-600" />
                Bill Management
              </h1>
              <p className="text-gray-600 mt-1">Process customer payments and manage bills</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Pending Payments</p>
              <p className="text-3xl font-bold text-blue-600">{pendingPayments.length}</p>
            </div>
          </div>
        </div>

        {/* Pending Payments List */}
        {pendingPayments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">All Clear!</h2>
            <p className="text-gray-600">There are no pending payments to process at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {pendingPayments.map((payment) => (
              <div
                key={payment.payment.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Payment Header */}
                <div className={`p-4 ${
                  payment.payment.payment_method === 'cash' 
                    ? 'bg-green-50' 
                    : 'bg-blue-50'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      Payment #{payment.payment.id}
                    </span>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                      payment.payment.payment_method === 'cash'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {getPaymentMethodIcon(payment.payment.payment_method)}
                      {getPaymentMethodLabel(payment.payment.payment_method)}
                    </div>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <User className="w-4 h-4 mr-2" />
                    <span className="font-medium">{payment.user.name || payment.user.email}</span>
                  </div>
                  <div className="flex items-center text-gray-600 text-sm mt-1">
                    <Clock className="w-4 h-4 mr-2" />
                    {new Date(payment.payment.created_at).toLocaleString()}
                  </div>
                </div>

                {/* Order Details */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">
                    Orders ({payment.orders.length})
                  </h3>
                  
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {payment.orders.map((order) => (
                      <div key={order.id} className="border-b pb-3 last:border-b-0">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Order #{order.id}
                          </span>
                          <span className="text-sm font-bold text-gray-900">
                            ${order.total_amount}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                {item.menuItem.name} × {item.quantity}
                              </span>
                              <span className="text-gray-700">${item.total_price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total Amount */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-800">Total Amount</span>
                      <span className="text-2xl font-bold text-blue-600">
                        ${payment.payment.total_amount}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  {payment.payment.payment_method === 'cash' ? (
                    <button
                      onClick={() => setSelectedPayment(payment)}
                      disabled={processingId === payment.payment.id}
                      className="w-full mt-4 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {processingId === payment.payment.id ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Process Cash Payment
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg text-center">
                      <p className="text-sm text-blue-700 font-medium">
                        Awaiting online payment confirmation
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cash Payment Confirmation Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Confirm Cash Payment
            </h2>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">Payment ID:</span>
                <span className="font-semibold">#{selectedPayment.payment.id}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">Customer:</span>
                <span className="font-semibold">{selectedPayment.user.name || selectedPayment.user.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Amount:</span>
                <span className="text-2xl font-bold text-green-600">
                  ${selectedPayment.payment.total_amount}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedPayment(null);
                  setNotes('');
                }}
                disabled={processingId === selectedPayment.payment.id}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={() => processCashPayment(selectedPayment.payment.id)}
                disabled={processingId === selectedPayment.payment.id}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {processingId === selectedPayment.payment.id ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Confirm Payment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaiterBillManagement;
