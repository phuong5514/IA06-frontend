import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
  price: number;
  image_url?: string;
  dietary_tags: string[];
  is_available: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export default function MenuItemsManagement() {
  const navigate = useNavigate();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUnavailable, setShowUnavailable] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedCategory, showUnavailable]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [categoriesResponse, itemsResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/menu/categories`),
        axios.get(`${API_BASE_URL}/menu/items`, {
          params: {
            category_id: selectedCategory || undefined,
            available_only: !showUnavailable,
          },
        }),
      ]);

      setCategories(categoriesResponse.data.categories || []);
      setItems(itemsResponse.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch menu items');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (itemId: number, currentStatus: boolean) => {
    try {
      await axios.put(`${API_BASE_URL}/menu/items/${itemId}`, {
        is_available: !currentStatus,
      });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update item');
    }
  };

  const handleDelete = async (itemId: number) => {
    if (!confirm('Are you sure you want to delete this menu item?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/menu/items/${itemId}`);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete item');
    }
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  const filteredItems = items.filter((item) => {
    if (searchQuery) {
      return (
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  if (loading && items.length === 0) {
    return (
      <DashboardLayout>
        <div className="p-6">Loading menu items...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div>
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-indigo-600"
                >
                  <svg className="w-3 h-3 mr-2.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2A1 1 0 0 0 1 10h2v8a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-8h2a1 1 0 0 0 .707-1.707Z"/>
                  </svg>
                  Dashboard
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="w-3 h-3 text-gray-400 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m9 5 7 7-7 7"/>
                  </svg>
                  <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">Menu Items</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Menu Items</h1>
          <button
            onClick={() => navigate('/admin/menu-editor')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + Add Menu Item
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={selectedCategory || ''}
                onChange={(e) =>
                  setSelectedCategory(e.target.value ? Number(e.target.value) : null)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Availability Filter */}
            <div className="flex items-end">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showUnavailable}
                  onChange={(e) => setShowUnavailable(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Show unavailable items</span>
              </label>
            </div>
          </div>
        </div>

        {/* Items Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">No menu items found</p>
            <button
              onClick={() => navigate('/admin/menu-editor')}
              className="mt-4 text-indigo-600 hover:text-indigo-800"
            >
              Create your first menu item
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-lg shadow hover:shadow-lg transition-shadow ${
                  !item.is_available ? 'opacity-60' : ''
                }`}
              >
                {/* Image */}
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                )}

                <div className="p-4">
                  {/* Category Badge */}
                  <span className="inline-block px-2 py-1 text-xs font-semibold text-indigo-600 bg-indigo-100 rounded mb-2">
                    {getCategoryName(item.category_id)}
                  </span>

                  {/* Item Name */}
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {item.name}
                  </h3>

                  {/* Description */}
                  {item.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  {/* Price */}
                  <p className="text-xl font-bold text-indigo-600 mb-3">
                    ${item.price.toFixed(2)}
                  </p>

                  {/* Dietary Tags */}
                  {item.dietary_tags && item.dietary_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.dietary_tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Status */}
                  <div className="flex items-center mb-4">
                    <span
                      className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                        item.is_available
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.is_available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigate(`/admin/menu-editor?id=${item.id}`)}
                      className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded hover:bg-indigo-700 transition-colors text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleAvailability(item.id, item.is_available)}
                      className={`flex-1 px-3 py-2 rounded transition-colors text-sm ${
                        item.is_available
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {item.is_available ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="px-3 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
