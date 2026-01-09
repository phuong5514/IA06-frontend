import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useTableSession } from '../context/TableSessionContext';
import { apiClient } from '../config/api';
import { CheckCircle, ShoppingCart, Trash2, Edit, ChevronRight } from 'lucide-react';

export default function Cart() {
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice, getItemPrice, tableId } = useCart();
  const { isAuthenticated } = useAuth();
  const { session, endSession } = useTableSession();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [specialInstructions, setSpecialInstructions] = useState<{ [key: string]: string }>({});

  const handleUpdateSpecialInstructions = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      const instructions = specialInstructions[itemId] || item.specialInstructions || '';
      // Update the item with new instructions
      const updatedItems = items.map(i => 
        i.id === itemId ? { ...i, specialInstructions: instructions } : i
      );
      localStorage.setItem('cart', JSON.stringify(updatedItems));
      setEditingItem(null);
    }
  };

  const handleConfirmOrder = async () => {
    if (!isAuthenticated) {
      alert('Please sign in to place an order');
      navigate('/');
      return;
    }

    if (items.length === 0) {
      alert('Your cart is empty');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Get the table ID from either the cart context or the table session
      const orderTableId = tableId || session?.tableId;

      // Create the order with all items and table information
      const orderData = {
        items: items.map(item => ({
          menu_item_id: item.menuItemId,
          quantity: item.quantity,
          special_instructions: item.specialInstructions || '',
          modifiers: item.modifiers.map(mod => ({
            modifier_group_id: mod.groupId,
            modifier_option_id: mod.optionId,
          })),
        })),
        ...(orderTableId && { table_id: orderTableId }), // Include table_id if available
      };

      // Submit the order to the backend
      const response = await apiClient.post('/orders', orderData);

      setSuccess(true);
      clearCart();
      
      // End the table session after successful order
      if (session) {
        endSession();
      }

      // Redirect to order tracking page after a short delay
      setTimeout(() => {
        navigate(`/orders/${response.data.id}`);
      }, 2000);
    } catch (err: any) {
      console.error('Order submission error:', err);
      setError(err.response?.data?.message || 'Failed to submit order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="mb-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h2>
            <p className="text-gray-600">
              Your order has been successfully placed. Redirecting to order tracking...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Cart</h1>
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <ShoppingCart className="w-24 h-24 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some delicious items to get started!</p>
            <button
              onClick={() => navigate('/menu/customer')}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Browse Menu
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
          <h1 className="text-3xl font-bold text-gray-900">Your Cart</h1>
          <button
            onClick={() => navigate('/menu/customer')}
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Continue Ordering
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => (
              <div key={item.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  {/* Item Image */}
                  {item.image_url && (
                    <div className="sm:w-32 sm:h-32 w-full h-48 flex-shrink-0">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Item Details */}
                  <div className="flex-1 p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-5 h-5" />
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>

                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm text-gray-600">
                        Base Price: ${item.price.toFixed(2)}
                      </div>
                      <button
                        onClick={() => navigate(`/menu/item/${item.menuItemId}?edit=${item.id}`)}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                      >
                        <Edit className="w-4 h-4" />
                        Edit Order
                      </button>
                    </div>

                    {/* Modifiers */}
                    {item.modifiers.length > 0 && (
                      <div className="mb-3">
                        <div className="text-sm font-medium text-gray-700 mb-1">
                          Customizations:
                        </div>
                        <div className="space-y-1">
                          {item.modifiers.map((mod, idx) => (
                            <div key={idx} className="text-sm text-gray-600 flex justify-between">
                              <span>• {mod.optionName}</span>
                              {mod.priceAdjustment !== 0 && (
                                <span className="text-green-600">
                                  {mod.priceAdjustment > 0 ? '+' : ''}
                                  ${mod.priceAdjustment.toFixed(2)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Special Instructions */}
                    <div className="mb-3">
                      {editingItem === item.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={specialInstructions[item.id] ?? item.specialInstructions ?? ''}
                            onChange={(e) =>
                              setSpecialInstructions(prev => ({
                                ...prev,
                                [item.id]: e.target.value,
                              }))
                            }
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Add special instructions..."
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateSpecialInstructions(item.id)}
                              className="text-sm bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingItem(null)}
                              className="text-sm bg-gray-300 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-400"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          {item.specialInstructions ? (
                            <div className="text-sm text-gray-600 italic mb-1">
                              "{item.specialInstructions}"
                            </div>
                          ) : null}
                          <button
                            onClick={() => {
                              setEditingItem(item.id);
                              setSpecialInstructions(prev => ({
                                ...prev,
                                [item.id]: item.specialInstructions || '',
                              }));
                            }}
                            className="text-sm text-indigo-600 hover:text-indigo-800"
                          >
                            {item.specialInstructions ? 'Edit' : 'Add'} special instructions
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Quantity and Price */}
                    <div className="flex justify-between items-center gap-4">
                      <div className="flex items-center space-x-3">
                        <label className="text-sm font-medium text-gray-700">Qty:</label>
                        <div className="flex items-center border border-gray-300 rounded-md h-8">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-2 h-full text-gray-600 hover:text-gray-800 hover:bg-gray-50 flex items-center justify-center"
                          >
                            -
                          </button>
                          <div className="px-2 h-full border-x border-gray-300 min-w-[2.5rem] flex items-center justify-center text-sm">
                            {item.quantity}
                          </div>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-2 h-full text-gray-600 hover:text-gray-800 hover:bg-gray-50 flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-green-600 whitespace-nowrap">
                        ${getItemPrice(item).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Items ({items.reduce((sum, item) => sum + item.quantity, 0)})</span>
                  <span>${getTotalPrice().toFixed(2)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span className="text-green-600">${getTotalPrice().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleConfirmOrder}
                disabled={isSubmitting}
                className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors mb-3"
              >
                {isSubmitting ? 'Placing Order...' : 'Confirm Order'}
              </button>

              <button
                onClick={clearCart}
                disabled={isSubmitting}
                className="w-full bg-red-100 text-red-700 py-2 px-6 rounded-lg font-medium hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Clear Cart
              </button>

              <div className="mt-6 text-xs text-gray-500 text-center">
                <p>Your order will be prepared fresh</p>
                <p>Estimated time will be shown after confirmation</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
