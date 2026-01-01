import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../config/api';
import { API_ENDPOINTS } from '../config/api';
import { useCart } from '../context/CartContext';
import type { CartModifier } from '../context/CartContext';

interface MenuItem {
  id: number;
  category_id: number;
  name: string;
  description?: string;
  price: string;
  image_url?: string;
  dietary_tags: string[];
  status: 'available' | 'unavailable' | 'sold_out';
  display_order: number;
  preparation_time?: number;
  chef_recommendation?: boolean;
  images?: Array<{
    id: number;
    original_url: string;
    thumbnail_url: string;
    display_url: string;
  }>;
  modifiers?: Array<{
    id: number;
    name: string;
    type: 'single' | 'multiple';
    is_required: boolean;
    display_order: number;
    options: Array<{
      id: number;
      name: string;
      price_adjustment: string;
      display_order: number;
      is_available: boolean;
    }>;
  }>;
}

interface SelectedModifiers {
  [groupId: number]: number[]; // groupId -> optionIds
}

export default function MenuItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem, items, removeItem, updateItem } = useCart();
  const [item, setItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifiers>({});
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  
  // Get edit mode from URL params
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const editCartItemId = searchParams.get('edit');
  const isEditMode = !!editCartItemId;
  const cartItemToEdit = isEditMode ? items.find(item => item.id === editCartItemId) : null;

  useEffect(() => {
    if (id) {
      fetchItem(parseInt(id));
    }
  }, [id]);

  // Load cart item data when in edit mode
  useEffect(() => {
    if (cartItemToEdit && item) {
      // Set quantity
      setQuantity(cartItemToEdit.quantity);
      
      // Set special instructions
      setSpecialInstructions(cartItemToEdit.specialInstructions || '');
      
      // Set selected modifiers
      const modifiers: SelectedModifiers = {};
      cartItemToEdit.modifiers.forEach(mod => {
        if (!modifiers[mod.groupId]) {
          modifiers[mod.groupId] = [];
        }
        modifiers[mod.groupId].push(mod.optionId);
      });
      setSelectedModifiers(modifiers);
    }
  }, [cartItemToEdit, item]);

  const fetchItem = async (itemId: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(API_ENDPOINTS.MENU_ITEM(itemId));
      setItem(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch menu item');
    } finally {
      setLoading(false);
    }
  };

  const handleModifierChange = (groupId: number, optionId: number, checked: boolean) => {
    setSelectedModifiers(prev => {
      const current = prev[groupId] || [];
      if (checked) {
        // For single type, replace; for multiple, add
        const group = item?.modifiers?.find(g => g.id === groupId);
        if (group?.type === 'single') {
          return { ...prev, [groupId]: [optionId] };
        } else {
          return { ...prev, [groupId]: [...current, optionId] };
        }
      } else {
        return { ...prev, [groupId]: current.filter(id => id !== optionId) };
      }
    });
  };

  const calculateTotalPrice = () => {
    if (!item) return 0;
    let basePrice = parseFloat(item.price);
    let modifierPrice = 0;

    item.modifiers?.forEach(group => {
      const selectedOptions = selectedModifiers[group.id] || [];
      group.options.forEach(option => {
        if (selectedOptions.includes(option.id)) {
          modifierPrice += parseFloat(option.price_adjustment);
        }
      });
    });

    return (basePrice + modifierPrice) * quantity;
  };

  const handleOrder = () => {
    if (!item) return;

    // Check if all required modifiers are selected
    const missingRequired = item.modifiers?.find(
      group => group.is_required && (!selectedModifiers[group.id] || selectedModifiers[group.id].length === 0)
    );

    if (missingRequired) {
      alert(`Please select an option for ${missingRequired.name}`);
      return;
    }

    // Build cart modifiers array
    const cartModifiers: CartModifier[] = [];
    item.modifiers?.forEach(group => {
      const selectedOptions = selectedModifiers[group.id] || [];
      selectedOptions.forEach(optionId => {
        const option = group.options.find(opt => opt.id === optionId);
        if (option) {
          cartModifiers.push({
            groupId: group.id,
            groupName: group.name,
            optionId: option.id,
            optionName: option.name,
            priceAdjustment: parseFloat(option.price_adjustment),
          });
        }
      });
    });

    const itemData = {
      menuItemId: item.id,
      name: item.name,
      price: parseFloat(item.price),
      quantity,
      image_url: item.image_url,
      modifiers: cartModifiers,
      specialInstructions: specialInstructions.trim() || undefined,
    };

    if (isEditMode && editCartItemId) {
      // Update existing item
      updateItem(editCartItemId, itemData);
      alert('Order updated successfully!');
    } else {
      // Add new item to cart
      addItem(itemData);
      alert('Item added to cart!');
    }

    // Redirect to cart
    navigate('/cart');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-lg">Loading menu item...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-red-600">{error || 'Item not found'}</div>
            <button
              onClick={() => navigate('/menu/customer')}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
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
        {/* Back Button */}
        <button
          onClick={() => navigate('/menu/customer')}
          className="mb-6 flex items-center text-indigo-600 hover:text-indigo-800"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Menu
        </button>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Image */}
          {item.image_url && (
            <div className="relative h-96">
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-full object-cover"
              />
              {item.status !== 'available' && (
                <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {item.status === 'sold_out' ? 'Sold Out' : 'Unavailable'}
                </div>
              )}
            </div>
          )}

          <div className="p-8">
            {/* Basic Info */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{item.name}</h1>
              {item.description && (
                <p className="text-gray-600 text-lg mb-4">{item.description}</p>
              )}
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-bold text-green-600">
                  ${parseFloat(item.price).toFixed(2)}
                </span>
                <div className="flex items-center space-x-2">
                  {item.preparation_time && (
                    <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">
                      {item.preparation_time} min prep
                    </span>
                  )}
                  {item.chef_recommendation && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                      Chef's Choice
                    </span>
                  )}
                </div>
              </div>

              {/* Dietary Tags */}
              {item.dietary_tags && item.dietary_tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {item.dietary_tags.map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full capitalize"
                    >
                      {tag.replace('-', ' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Modifiers */}
            {item.modifiers && item.modifiers.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Customize Your Order</h2>
                {item.modifiers.map(group => (
                  <div key={group.id} className="mb-6 p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-medium mb-3">
                      {group.name}
                      {group.is_required && <span className="text-red-500 ml-1">*</span>}
                    </h3>
                    <div className="space-y-2">
                      {group.options.map(option => (
                        <label key={option.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-md hover:bg-gray-50">
                          <div className="flex items-center">
                            <input
                              type={group.type === 'single' ? 'radio' : 'checkbox'}
                              name={`modifier-${group.id}`}
                              value={option.id}
                              checked={(selectedModifiers[group.id] || []).includes(option.id)}
                              onChange={(e) => handleModifierChange(group.id, option.id, e.target.checked)}
                              className="mr-3"
                              disabled={!option.is_available}
                            />
                            <span className={option.is_available ? 'text-gray-900' : 'text-gray-400'}>
                              {option.name}
                            </span>
                          </div>
                          {parseFloat(option.price_adjustment) !== 0 && (
                            <span className="text-green-600 font-medium">
                              {parseFloat(option.price_adjustment) > 0 ? '+' : ''}
                              ${parseFloat(option.price_adjustment).toFixed(2)}
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Special Instructions */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Special Instructions</h2>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Any special requests? (e.g., no onions, extra sauce)"
                rows={3}
              />
            </div>

            {/* Quantity and Order */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <label className="font-medium">Quantity:</label>
                  <div className="flex items-center border border-gray-300 rounded-md">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 text-gray-600 hover:text-gray-800"
                    >
                      -
                    </button>
                    <span className="px-4 py-2 border-x border-gray-300">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-2 text-gray-600 hover:text-gray-800"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Total Price</div>
                  <div className="text-2xl font-bold text-green-600">
                    ${calculateTotalPrice().toFixed(2)}
                  </div>
                </div>
              </div>

              <button
                onClick={handleOrder}
                disabled={item.status !== 'available'}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {item.status === 'available' 
                  ? (isEditMode ? 'Update Order' : 'Add to Order')
                  : 'Currently Unavailable'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}