import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, Banknote, Receipt, ArrowLeft, Loader2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

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

interface BillingInfo {
  orders: Order[];
  totalAmount: string;
  unpaidOrders: number[];
}

interface Payment {
  payment: {
    id: number;
    payment_method: string;
    payment_status: string;
    total_amount: string;
  };
  totalAmount: string;
  orderCount: number;
}

const CustomerBilling = () => {
  const navigate = useNavigate();
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'stripe'>('cash');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [currentPayment, setCurrentPayment] = useState<Payment | null>(null);
  const [showStripeForm, setShowStripeForm] = useState(false);

  useEffect(() => {
    fetchBillingInfo();
  }, []);

  const fetchBillingInfo = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/payments/billing`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBillingInfo(response.data);
    } catch (error: any) {
      console.error('Error fetching billing info:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch billing information');
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = async () => {
    if (!billingInfo || billingInfo.unpaidOrders.length === 0) {
      toast.error('No orders to pay');
      return;
    }

    try {
      setProcessingPayment(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API_BASE_URL}/api/payments`,
        {
          orderIds: billingInfo.unpaidOrders,
          paymentMethod,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setCurrentPayment(response.data);
      
      if (paymentMethod === 'cash') {
        toast.success('Cash payment initiated. Please pay at the counter.');
        setTimeout(() => navigate('/orders'), 2000);
      } else {
        // For Stripe payment, show the payment form
        setShowStripeForm(true);
      }
    } catch (error: any) {
      console.error('Error initiating payment:', error);
      toast.error(error.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!billingInfo || billingInfo.orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/orders')}
            className="mb-4 flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Orders
          </button>
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Receipt className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Bills to Pay</h2>
            <p className="text-gray-600">You don't have any delivered orders to pay for.</p>
          </div>
        </div>
      </div>
    );
  }

  if (showStripeForm && currentPayment) {
    return (
      <Elements stripe={stripePromise}>
        <StripePaymentForm
          payment={currentPayment}
          onSuccess={() => {
            toast.success('Payment successful!');
            navigate('/orders');
          }}
          onCancel={() => {
            setShowStripeForm(false);
            setCurrentPayment(null);
          }}
        />
      </Elements>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/orders')}
          className="mb-4 flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Orders
        </button>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold flex items-center">
                  <Receipt className="w-8 h-8 mr-3" />
                  Your Bill
                </h1>
                <p className="text-blue-100 mt-1">Review and pay for your orders</p>
              </div>
              <div className="text-right">
                <p className="text-blue-100">Total Amount</p>
                <p className="text-3xl font-bold">${billingInfo.totalAmount}</p>
              </div>
            </div>
          </div>

          {/* Orders List */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Order Details</h2>
            
            {billingInfo.orders.map((order) => (
              <div key={order.id} className="mb-6 border-b pb-4 last:border-b-0">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-gray-700">
                    Order #{order.id}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleString()}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <div className="flex-1">
                        <span className="text-gray-700">{item.menuItem.name}</span>
                        <span className="text-gray-500 ml-2">× {item.quantity}</span>
                      </div>
                      <span className="font-medium text-gray-800">
                        ${item.total_price}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-2 pt-2 border-t flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Order Total</span>
                  <span className="font-semibold text-gray-900">${order.total_amount}</span>
                </div>
              </div>
            ))}

            {/* Payment Method Selection */}
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Payment Method</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-4 border-2 rounded-lg flex items-center justify-center transition-all ${
                    paymentMethod === 'cash'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Banknote className={`w-6 h-6 mr-3 ${
                    paymentMethod === 'cash' ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <div className="text-left">
                    <p className="font-semibold text-gray-800">Cash Payment</p>
                    <p className="text-sm text-gray-600">Pay at the counter</p>
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod('stripe')}
                  className={`p-4 border-2 rounded-lg flex items-center justify-center transition-all ${
                    paymentMethod === 'stripe'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CreditCard className={`w-6 h-6 mr-3 ${
                    paymentMethod === 'stripe' ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <div className="text-left">
                    <p className="font-semibold text-gray-800">Card Payment</p>
                    <p className="text-sm text-gray-600">Pay online with Stripe</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Total and Pay Button */}
            <div className="mt-8 pt-6 border-t">
              <div className="flex justify-between items-center mb-6">
                <span className="text-xl font-bold text-gray-800">Total Amount</span>
                <span className="text-3xl font-bold text-blue-600">
                  ${billingInfo.totalAmount}
                </span>
              </div>

              <button
                onClick={initiatePayment}
                disabled={processingPayment}
                className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {processingPayment ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {paymentMethod === 'cash' ? (
                      <Banknote className="w-5 h-5 mr-2" />
                    ) : (
                      <CreditCard className="w-5 h-5 mr-2" />
                    )}
                    {paymentMethod === 'cash' ? 'Request Cash Payment' : 'Pay with Card'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Stripe Payment Form Component
const StripePaymentForm = ({
  payment,
  onSuccess,
  onCancel,
}: {
  payment: Payment;
  onSuccess: () => void;
  onCancel: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentIntent();
  }, []);

  const fetchPaymentIntent = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/payments/${payment.payment.id}/stripe-intent`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setClientSecret(response.data.clientSecret);
    } catch (error: any) {
      console.error('Error fetching payment intent:', error);
      toast.error('Failed to initialize payment');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setProcessing(true);

    try {
      const cardElement = elements.getElement(CardElement);
      
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        toast.error(error.message || 'Payment failed');
      } else if (paymentIntent.status === 'succeeded') {
        // Confirm payment with backend
        await axios.post(
          `${API_BASE_URL}/api/payments/stripe/confirm`,
          { paymentIntentId: paymentIntent.id },
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }
        );
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast.error('Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Complete Payment</h2>
        
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Total Amount:</span>
            <span className="text-2xl font-bold text-blue-600">
              ${payment.payment.total_amount}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Details
            </label>
            <div className="p-4 border border-gray-300 rounded-lg">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                    invalid: {
                      color: '#9e2146',
                    },
                  },
                }}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!stripe || processing}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay $${payment.payment.total_amount}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerBilling;
