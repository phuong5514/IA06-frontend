import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, Banknote, Receipt, ArrowLeft, Loader2, Cross } from 'lucide-react';
import { apiClient } from '../config/api';
// import DashboardLayout from '../components/DashboardLayout';

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
  const [savedCards, setSavedCards] = useState<any[]>([]);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [useNewCard, setUseNewCard] = useState(false);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    fetchBillingInfo();
    fetchSavedCards();
  }, []);

  const fetchSavedCards = async () => {
    try {
      const response = await apiClient.get('/user/payment-methods');
      if (response.data.paymentMethods?.length > 0) {
        setSavedCards(response.data.paymentMethods);
        // Auto-select default card
        const defaultCard = response.data.paymentMethods.find((card: any) => card.is_default);
        if (defaultCard) {
          setSelectedCard(defaultCard.id);
          setPaymentMethod('stripe');
        }
      }
    } catch (error: any) {
      console.error('Error fetching saved cards:', error);
    }
  };

  const fetchBillingInfo = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/payments/billing');
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
      
      // If paying with cash
      if (paymentMethod === 'cash') {
        await apiClient.post(
          '/payments',
          {
            orderIds: billingInfo.unpaidOrders,
            paymentMethod,
          }
        );
        toast.success('Cash payment initiated. Please pay at the counter.');
        setTimeout(() => navigate('/orders'), 2000);
        return;
      }

      // If paying with saved card
      if (selectedCard) {
        const selectedCardData = savedCards.find(card => card.id === selectedCard);
        if (!selectedCardData) {
          toast.error('Selected card not found');
          return;
        }

        // Create payment and charge using saved payment method
        const response = await apiClient.post(
          '/payments',
          {
            orderIds: billingInfo.unpaidOrders,
            paymentMethod: 'stripe',
          }
        );

        const paymentId = response.data.payment.id;

        try {
          // Charge using saved payment method
          const chargeResponse = await apiClient.post(
            `/payments/${paymentId}/charge-saved-card`,
            {
              paymentMethodId: selectedCardData.stripe_payment_method_id,
            }
          );

          if (chargeResponse.data.success) {
            toast.success('Payment successful!');
            setPaymentError(null);
            setTimeout(() => navigate('/orders'), 2000);
          } else {
            setPaymentError('Payment was declined. Please try another payment method.');
            toast.error('Payment failed');
          }
        } catch (chargeError: any) {
          const errorMessage = chargeError.response?.data?.message || chargeError.message || 'Payment failed';
          
          // Categorize error types for saved cards
          if (errorMessage.includes('card was declined') || errorMessage.includes('declined')) {
            setPaymentError('Your card was declined. Please check your card details or try another card.');
            toast.error('Card declined');
          } else if (errorMessage.includes('insufficient funds')) {
            setPaymentError('Insufficient funds. Please use another payment method.');
            toast.error('Insufficient funds');
          } else if (errorMessage.includes('expired')) {
            setPaymentError('Your card has expired. Please update your card or use another payment method.');
            toast.error('Card expired');
          } else if (errorMessage.includes('cannot be reused') || errorMessage.includes('add your card again')) {
            setPaymentError('This saved card cannot be used. Please delete it and add your card again.');
            toast.error('Card needs to be re-added');
          } else {
            setPaymentError(errorMessage);
            toast.error(errorMessage);
          }
          return;
        }
        return;
      }

      // If paying with new card, create payment and show form
      const response = await apiClient.post(
        '/payments',
        {
          orderIds: billingInfo.unpaidOrders,
          paymentMethod: 'stripe',
        }
      );

      setCurrentPayment(response.data);
      setShowStripeForm(true);
    } catch (error: any) {
      console.error('Error initiating payment:', error);
      toast.error(error.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      // <DashboardLayout>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
      // </DashboardLayout>
    );
  }

  if (!billingInfo || billingInfo.orders.length === 0) {
    return (
      // <DashboardLayout>
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
      // </DashboardLayout>
    );
  }

  if (showStripeForm && currentPayment) {
    return (
      <Elements stripe={stripePromise}>
        <StripePaymentForm
          payment={currentPayment}
          onSuccess={() => {
            toast.success('Payment successful!');
            setPaymentError(null);
            navigate('/orders');
          }}
          onError={(error) => {
            setPaymentError(error);
            setShowStripeForm(false);
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
    <div>
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
          {/* Payment Error Alert */}
          {paymentError && (
            <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">Payment Failed</h3>
                  <p className="text-red-700 mb-4">{paymentError}</p>
                  <div className="flex flex-wrap gap-3">
                    {paymentError.includes('reused') || paymentError.includes('re-added') ? (
                      <button
                        onClick={() => {
                          setPaymentError(null);
                          navigate('/profile');
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                      >
                        Go to Profile to Manage Cards
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setPaymentError(null);
                            setUseNewCard(true);
                            setSelectedCard(null);
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                        >
                          Try Another Card
                        </button>
                        <button
                          onClick={() => {
                            setPaymentError(null);
                            setPaymentMethod('cash');
                          }}
                          className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
                        >
                          Pay with Cash Instead
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setPaymentError(null)}
                  className="flex-shrink-0 ml-3 text-red-500 hover:text-red-700"
                >
                  <Cross className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

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
              
              {/* Saved Cards Section */}
              {savedCards.length > 0 && !useNewCard && (
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-700 mb-3">Saved Cards</h4>
                  <div className="space-y-2">
                    {savedCards.map((card) => (
                      <button
                        key={card.id}
                        onClick={() => {
                          setSelectedCard(card.id);
                          setPaymentMethod('stripe');
                        }}
                        className={`w-full p-4 border-2 rounded-lg flex items-center justify-between transition-all ${
                          selectedCard === card.id && paymentMethod === 'stripe'
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center">
                          <CreditCard className={`w-6 h-6 mr-3 ${
                            selectedCard === card.id && paymentMethod === 'stripe' ? 'text-blue-600' : 'text-gray-400'
                          }`} />
                          <div className="text-left">
                            <p className="font-semibold text-gray-800">
                              {card.card_brand.toUpperCase()} •••• {card.last4}
                            </p>
                            <p className="text-sm text-gray-600">
                              Expires {card.exp_month}/{card.exp_year}
                              {card.is_default && (
                                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  Default
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        {selectedCard === card.id && paymentMethod === 'stripe' && (
                          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setShowAddCardModal(true);
                    }}
                    className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                  >
                    <Cross className="w-4 h-4 mr-1" />
                    Use a different card
                  </button>
                </div>
              )}

              {/* Payment Method Options */}
              {(savedCards.length === 0 || useNewCard) && (
                <>
                  {savedCards.length > 0 && (
                    <button
                      onClick={() => {
                        setUseNewCard(false);
                        const defaultCard = savedCards.find((card) => card.is_default);
                        if (defaultCard) {
                          setSelectedCard(defaultCard.id);
                          setPaymentMethod('stripe');
                        }
                      }}
                      className="mb-4 text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Back to saved cards
                    </button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => {
                        setPaymentMethod('cash');
                        setSelectedCard(null);
                      }}
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
                      onClick={() => {
                        setPaymentMethod('stripe');
                        setSelectedCard(null);
                      }}
                      className={`p-4 border-2 rounded-lg flex items-center justify-center transition-all ${
                        paymentMethod === 'stripe' && !selectedCard
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <CreditCard className={`w-6 h-6 mr-3 ${
                        paymentMethod === 'stripe' && !selectedCard ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                      <div className="text-left">
                        <p className="font-semibold text-gray-800">New Card</p>
                        <p className="text-sm text-gray-600">Pay online with Stripe</p>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
              <div
                className={`p-4 border-2 rounded-lg flex items-center justify-center transition-all ${
                  paymentMethod === 'stripe'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <button>
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

      {/* Add Card Modal */}
      {showAddCardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Add New Card</h3>
            <Elements stripe={stripePromise}>
              <AddCardForm
                onSuccess={async () => {
                  setShowAddCardModal(false);
                  await fetchSavedCards();
                  toast.success('Card added successfully!');
                }}
                onCancel={() => setShowAddCardModal(false)}
              />
            </Elements>
          </div>
        </div>
      )}
    </div>
  );
};

// Add Card Form Component
const AddCardForm = ({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardholderName, setCardholderName] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    try {
      const cardElement = elements.getElement(CardElement);
      
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Create payment method with Stripe
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: cardholderName ? { name: cardholderName } : undefined,
      });

      if (error) {
        toast.error(error.message || 'Failed to add card');
        return;
      }

      if (!paymentMethod) {
        toast.error('Failed to create payment method');
        return;
      }

      // Save payment method to backend
      await apiClient.post('/user/payment-methods', {
        stripe_payment_method_id: paymentMethod.id,
        card_brand: paymentMethod.card?.brand || 'unknown',
        last4: paymentMethod.card?.last4 || '0000',
        exp_month: paymentMethod.card?.exp_month || 12,
        exp_year: paymentMethod.card?.exp_year || 2099,
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error adding card:', error);
      toast.error(error.response?.data?.message || 'Failed to add card');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cardholder Name (Optional)
        </label>
        <input
          type="text"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          placeholder="John Doe"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

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
          disabled={processing}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
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
              Adding...
            </>
          ) : (
            'Add Card'
          )}
        </button>
      </div>
    </form>
  );
};

// Stripe Payment Form Component
const StripePaymentForm = ({
  payment,
  onSuccess,
  onError,
  onCancel,
}: {
  payment: Payment;
  onSuccess: () => void;
  onError: (error: string) => void;
  onCancel: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentIntent();
  }, []);

  const fetchPaymentIntent = async () => {
    try {
      const response = await apiClient.post(
        `/payments/${payment.payment.id}/stripe-intent`,
        {}
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
    setError(null);

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
        let errorMessage = error.message || 'Payment failed';
        
        // Categorize Stripe errors
        if (error.code === 'card_declined') {
          errorMessage = 'Your card was declined. Please check your card details or try another card.';
        } else if (error.code === 'insufficient_funds') {
          errorMessage = 'Insufficient funds. Please use another payment method.';
        } else if (error.code === 'expired_card') {
          errorMessage = 'Your card has expired. Please use another card.';
        } else if (error.code === 'incorrect_cvc') {
          errorMessage = 'Incorrect CVC code. Please check and try again.';
        } else if (error.code === 'processing_error') {
          errorMessage = 'An error occurred while processing your card. Please try again.';
        } else if (error.code === 'incorrect_number') {
          errorMessage = 'Incorrect card number. Please check and try again.';
        }
        
        setError(errorMessage);
        toast.error(errorMessage);
        onError(errorMessage);
      } else if (paymentIntent.status === 'succeeded') {
        // Confirm payment with backend
        await apiClient.post(
          '/payments/stripe/confirm',
          { paymentIntentId: paymentIntent.id }
        );
        onSuccess();
      } else {
        const statusError = 'Payment requires additional authentication or action.';
        setError(statusError);
        toast.error(statusError);
        onError(statusError);
      }
    } catch (error: any) {
      console.error('Error processing payment:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Payment processing failed';
      setError(errorMessage);
      toast.error(errorMessage);
      onError(errorMessage);
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

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

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
