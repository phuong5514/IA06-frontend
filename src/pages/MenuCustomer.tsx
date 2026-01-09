import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { apiClient } from '../config/api';
import { useTableSession } from '../context/TableSessionContext';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { useQuery } from '@tanstack/react-query';
import QRScannerModal from '../components/QRScannerModal';
import menuBackground from '../assets/menu_background.png';
import { Check, QrCode, Heart, Clock, Search, Star, Settings, Info } from 'lucide-react';

interface MenuCategory {
  id: number;
  name: string;
  description?: string;
}

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
}

type ViewSection = 'preferences' | 'past-orders' | 'explore';

export default function MenuCustomer() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'none' | 'popularity'>('none');
  const [showChefRecommendation, setShowChefRecommendation] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const navigate = useNavigate();
  const { addItem, setTableId } = useCart();
  const { session, isSessionActive } = useTableSession();
  const { user } = useAuth();
  const { onOrderStatusChange, onOrderAccepted, onOrderRejected, isConnected } = useWebSocket();
  
  // Set default section based on user login status
  const [activeSection, setActiveSection] = useState<ViewSection>(user ? 'preferences' : 'explore');

  // Update active section when user login status changes
  useEffect(() => {
    if (!user) {
      setActiveSection('explore');
    }
  }, [user]);

  // WebSocket event listeners for real-time order updates
  useEffect(() => {
    if (!user) return; // Only listen if user is logged in

    console.log('[MenuCustomer] Setting up WebSocket listeners for user:', user.id);
    console.log('[MenuCustomer] WebSocket connected:', isConnected);

    const unsubscribeStatusChange = onOrderStatusChange((order, previousStatus) => {
      console.log('[MenuCustomer] Order status changed:', order, 'previous:', previousStatus, 'user.id:', user.id);
      console.log('[MenuCustomer] Comparing order.user_id:', order.user_id, 'with user.id:', user.id, 'match:', order.user_id === String(user.id));
      
      // Show toast notification based on status for user's orders
      if (order.user_id === String(user.id)) {
        switch (order.status) {
          case 'accepted':
            toast.success(`✅ Order #${order.id} has been accepted!`, {
              duration: 5000,
              icon: '🎉',
            });
            break;          case 'rejected':
            toast.error(`❌ Order #${order.id} has been rejected${order.rejection_reason ? `: ${order.rejection_reason}` : ''}`, {
              duration: 7000,
              icon: '😔',
            });
            break;          case 'preparing':
            toast.success(`👨‍🍳 Order #${order.id} is being prepared!`, {
              duration: 5000,
              icon: '🍳',
            });
            break;
          case 'ready':
            toast.success(`🎊 Order #${order.id} is ready!`, {
              duration: 6000,
              icon: '✨',
              style: {
                background: '#10b981',
                color: '#fff',
              },
            });
            break;
          case 'served':
            toast.success(`🍽️ Order #${order.id} has been served!`, {
              duration: 4000,
            });
            break;
          case 'completed':
            toast.success(`✓ Order #${order.id} completed. Thank you!`, {
              duration: 3000,
            });
            break;
          case 'cancelled':
            toast.error(`Order #${order.id} has been cancelled`, {
              duration: 5000,
            });
            break;
        }
      }
    });

    const unsubscribeAccepted = onOrderAccepted((order) => {
      console.log('[MenuCustomer] Order accepted:', order, 'user.id:', user.id);
      console.log('[MenuCustomer] Comparing order.user_id:', order.user_id, 'with user.id:', user.id, 'match:', order.user_id === String(user.id));
      // Note: We don't show toast here because orderStatusChange will handle it
      // This prevents duplicate notifications
    });

    const unsubscribeRejected = onOrderRejected((order) => {
      console.log('[MenuCustomer] Order rejected:', order, 'user.id:', user.id);
      console.log('[MenuCustomer] Comparing order.user_id:', order.user_id, 'with user.id:', user.id, 'match:', order.user_id === String(user.id));
      // Note: We don't show toast here because orderStatusChange will handle it
      // This prevents duplicate notifications
    });

    return () => {
      console.log('[MenuCustomer] Cleaning up WebSocket listeners');
      unsubscribeStatusChange();
      unsubscribeAccepted();
      unsubscribeRejected();
    };
  }, [user, onOrderStatusChange, onOrderAccepted, onOrderRejected]);

  // Fetch user preferences
  const { data: preferencesData } = useQuery({
    queryKey: ['user', 'preferences'],
    queryFn: async () => {
      const response = await apiClient.get('/user/preferences');
      return response.data;
    },
    enabled: !!user, // Only fetch if user is logged in
  });

  // Fetch user order history
  const { data: ordersData } = useQuery({
    queryKey: ['user', 'orders'],
    queryFn: async () => {
      const response = await apiClient.get('/user/orders');
      return response.data;
    },
    enabled: !!user, // Only fetch if user is logged in
  });

  // Helper functions to check item status
  const isPreferenceMatch = (item: MenuItem) => {
    const userTags = preferencesData?.preferences?.dietary_tags || [];
    return userTags.length > 0 && item.dietary_tags?.some(tag => userTags.includes(tag));
  };

  const isPastOrdered = (item: MenuItem) => {
    const orders = ordersData?.orders || [];
    const orderedItemIds = new Set<number>();
    orders.forEach((order: any) => {
      order.items?.forEach((orderItem: any) => {
        if (orderItem.menu_item_id) {
          orderedItemIds.add(orderItem.menu_item_id);
        }
      });
    });
    return orderedItemIds.has(item.id);
  };

  const handleQuickAdd = (item: MenuItem) => {
    addItem({
      menuItemId: item.id,
      name: item.name,
      price: parseFloat(item.price),
      quantity: 1,
      image_url: item.image_url,
      modifiers: [],
      specialInstructions: undefined,
    });
    alert('Item added to cart!');
  };

  const handleQRScanSuccess = () => {
    // Sync table ID from session to cart when QR scan is successful
    if (session) {
      setTableId(session.tableId);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching menu from API:', import.meta.env.VITE_API_URL);
      
      const [categoriesResponse, itemsResponse] = await Promise.all([
        apiClient.get('/menu/categories'),
        apiClient.get('/menu/items?available_only=true'),
      ]);

      console.log('Menu fetched successfully:', { 
        categories: categoriesResponse.data.categories.length,
        items: itemsResponse.data.items.length 
      });

      setCategories(categoriesResponse.data.categories);
      setItems(itemsResponse.data.items);
    } catch (err: any) {
      console.error('Menu fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch menu');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredItems = () => {
    let filtered = items;

    if (selectedCategory) {
      filtered = filtered.filter(item => item.category_id === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (showChefRecommendation) {
      filtered = filtered.filter(item => item.chef_recommendation === true);
    }

    // Sort by popularity if selected
    if (sortBy === 'popularity') {
      // Items with higher display_order are considered more popular
      filtered = [...filtered].sort((a, b) => (b.display_order || 0) - (a.display_order || 0));
    }

    return filtered;
  };

  // Get items matching user preferences
  const getPreferenceMatchedItems = () => {
    const userTags = preferencesData?.preferences?.dietary_tags || [];
    if (userTags.length === 0) return [];

    return getFilteredItems().filter(item => {
      // Check if item has at least one matching dietary tag
      return item.dietary_tags?.some(tag => userTags.includes(tag)) || false;
    });
  };

  // Get past ordered items
  const getPastOrderedItems = () => {
    const orders = ordersData?.orders || [];
    if (orders.length === 0) return [];

    // Get unique menu item IDs from all orders
    const orderedItemIds = new Set<number>();
    orders.forEach((order: any) => {
      order.items?.forEach((item: any) => {
        if (item.menu_item_id) {
          orderedItemIds.add(item.menu_item_id);
        }
      });
    });

    // Filter menu items that have been ordered before
    return getFilteredItems().filter(item => orderedItemIds.has(item.id));
  };

  // Determine which items to display based on active section
  const getDisplayItems = () => {
    switch (activeSection) {
      case 'preferences':
        return getPreferenceMatchedItems();
      case 'past-orders':
        return getPastOrderedItems();
      case 'explore':
      default:
        return getFilteredItems();
    }
  };

  const displayItems = getDisplayItems();
  const preferenceMatchCount = getPreferenceMatchedItems().length;
  const pastOrdersCount = getPastOrderedItems().length;

  if (loading) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-no-repeat pt-16" style={{ backgroundImage: `url(${menuBackground})` }}>
        <div className="min-h-screen bg-black/40 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center py-12">
              <div className="text-lg text-white font-semibold">Loading menu...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-no-repeat pt-16" style={{ backgroundImage: `url(${menuBackground})` }}>
        <div className="min-h-screen bg-black/40 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center py-12">
              <div className="text-red-600 bg-white px-6 py-4 rounded-lg shadow-lg">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat pt-16" style={{ backgroundImage: `url(${menuBackground})` }}>
      <div className="min-h-screen bg-gradient-to-b from-black/50 via-black/40 to-black/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header with Profile Link */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white drop-shadow-lg">Our Menu</h1>
            <div className="flex items-center gap-3">  
              {/* Table Session Indicator */}
              {isSessionActive && session && (
                <div className="bg-green-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg border border-white/20 flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Table {session.tableNumber}</span>
                </div>
              )}
              
              {/* Scan QR Button */}
              <button
                onClick={() => setShowQRScanner(true)}
                className="bg-indigo-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg hover:bg-indigo-700/90 transition-colors border border-white/20 flex items-center gap-2"
              >
                <QrCode className="w-5 h-5" />
                <span className="font-medium">Scan QR</span>
              </button>
            </div>
          </div>

          {/* QR Scanner Modal */}
          <QRScannerModal
            isOpen={showQRScanner}
            onClose={() => setShowQRScanner(false)}
            onSuccess={handleQRScanSuccess}
          />

          {/* Frosted Glass Container */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-6 border border-white/20">
        
        {/* Section Tabs - Only show if user is logged in */}
        {user && (
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveSection('preferences')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  activeSection === 'preferences'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Heart className="w-5 h-5" />
                <span>For You</span>
                {preferenceMatchCount > 0 && (
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">
                    {preferenceMatchCount}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => setActiveSection('past-orders')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  activeSection === 'past-orders'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Clock className="w-5 h-5" />
                <span>Order Again</span>
                {pastOrdersCount > 0 && (
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">
                    {pastOrdersCount}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => setActiveSection('explore')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  activeSection === 'explore'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Search className="w-5 h-5" />
                <span>Explore All</span>
              </button>
            </div>

            {/* Section Description */}
            <div className="mt-4 text-sm text-gray-600">
              {activeSection === 'preferences' && (
                <p className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-indigo-600" />
                  Items matching your dietary preferences
                  {preferenceMatchCount === 0 && preferencesData?.preferences?.dietary_tags?.length === 0 && (
                    <span className="text-orange-600 ml-1">(Set your preferences in profile to see personalized recommendations)</span>
                  )}
                </p>
              )}
              {activeSection === 'past-orders' && (
                <p className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-indigo-600" />
                  Items you've ordered before - reorder your favorites!
                </p>
              )}
              {activeSection === 'explore' && (
                <p className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-indigo-600" />
                  Browse our complete menu
                </p>
              )}
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Menu
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search dishes..."
                  className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Search
                  className="absolute left-3 top-3.5 w-5 h-5 text-gray-400"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Category
              </label>
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sort and Additional Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'none' | 'popularity')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="none">Default Order</option>
                <option value="popularity">Popularity</option>
              </select>
            </div>

            {/* Chef Recommendation Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Filters
              </label>
              <button
                onClick={() => setShowChefRecommendation(!showChefRecommendation)}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  showChefRecommendation
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                }`}
              >
                <Star className="w-5 h-5" fill={showChefRecommendation ? "currentColor" : "none"} />
                <span>{showChefRecommendation ? "Chef's Picks Only" : "Show Chef's Picks"}</span>
              </button>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !selectedCategory
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayItems.map(item => (
            <div key={item.id} className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl overflow-hidden border border-white/30 relative">
              {/* Badges for preference match and past orders */}
              {user && (
                <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                  {isPreferenceMatch(item) && (
                    <span className="px-2 py-1 bg-indigo-600 text-white text-xs rounded-full shadow-md flex items-center gap-1">
                      <Heart className="w-3 h-3" fill="currentColor" />
                      For You
                    </span>
                  )}
                  {isPastOrdered(item) && (
                    <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full shadow-md flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Ordered Before
                    </span>
                  )}
                </div>
              )}
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2">{item.name}</h3>
                {item.description && (
                  <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                )}
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-bold text-green-600">
                    ${parseFloat(item.price).toFixed(2)}
                  </span>
                </div>
                {item.dietary_tags && item.dietary_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {item.dietary_tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize"
                      >
                        {tag.replace('-', ' ')}
                      </span>
                    ))}
                  </div>
                )}
                {/* Preparation Time and Chef Recommendation */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {item.preparation_time && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                      {item.preparation_time} min prep
                    </span>
                  )}
                  {item.chef_recommendation && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      Chef's Choice
                    </span>
                  )}
                </div>
                <div className="flex flex-col space-y-2">
                  <button 
                    onClick={() => handleQuickAdd(item)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Quick Add
                  </button>
                  <button
                    onClick={() => navigate(`/menu/item/${item.id}`)}
                    className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {displayItems.length === 0 && (
          <div className="col-span-full text-center text-white bg-white/10 backdrop-blur-sm px-6 py-8 rounded-lg">
            {activeSection === 'preferences' && preferencesData?.preferences?.dietary_tags?.length === 0 ? (
              <div className="space-y-3">
                <Heart className="w-16 h-16 mx-auto text-white/60" />
                <p className="text-white/60 text-lg font-medium">Set your food preferences to get personalized recommendations!</p>
                <button
                  onClick={() => navigate('/profile')}
                  className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
                >
                  <Settings className="w-5 h-5" />
                  Go to Profile Settings
                </button>
              </div>
            ) : activeSection === 'past-orders' && ordersData?.orders?.length === 0 ? (
              <div className="space-y-3">
                <Clock className="w-16 h-16 mx-auto text-white/60" />
                <p className="text-lg font-medium text-white/80">You haven't placed any orders yet!</p>
                <p className="text-white/80">Start exploring our menu and place your first order.</p>
                <button
                  onClick={() => setActiveSection('explore')}
                  className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Explore Menu
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Search className="w-16 h-16 mx-auto text-white/60" />
                <p className="text-lg font-medium">No items found matching your criteria.</p>
                <p className="text-white/80">Try adjusting your filters or search query.</p>
              </div>
            )}
          </div>
        )}
          </div>
          {/* End Frosted Glass Container */}
      </div>
    </div>
    </div>
  );
}