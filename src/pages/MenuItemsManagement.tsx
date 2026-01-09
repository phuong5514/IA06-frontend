import React, { useState, useEffect } from 'react';
import { apiClient } from '../config/api';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Home, ChevronRight, ChevronLeft, ChevronDown } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import StarRating from '../components/StarRating';
import ReviewManagementModal from '../components/ReviewManagementModal';

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
  average_rating?: number;
  review_count?: number;
  created_at?: string;
  updated_at?: string;
}

interface ApiResponse {
  items: MenuItem[];
  total: number;
  page: number;
  limit: number;
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
  const [sortBy, setSortBy] = useState<string>('display_order');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalItems, setTotalItems] = useState(0);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedItemForReview, setSelectedItemForReview] = useState<MenuItem | null>(null);

  useEffect(() => {
    fetchData();
  }, [selectedCategory, showUnavailable, searchQuery, sortBy, sortOrder, currentPage, pageSize]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        available_only: (!showUnavailable).toString(),
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      if (selectedCategory) {
        params.append('category_id', selectedCategory.toString());
      }

      if (searchQuery.trim()) {
        params.append('name', searchQuery.trim());
      }

      const [categoriesResponse, itemsResponse] = await Promise.all([
        apiClient.get('/menu/categories'),
        apiClient.get(`/menu/items?${params.toString()}`),
      ]);

      setCategories(categoriesResponse.data.categories || []);
      const responseData = itemsResponse.data as ApiResponse;
      setItems(responseData.items || []);
      setTotalItems(responseData.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch menu items');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (itemId: number, newStatus: 'available' | 'unavailable' | 'sold_out') => {
    try {
      await apiClient.put(`/menu/items/${itemId}`, {
        status: newStatus,
      });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update item');
    }
  };

  const handleDelete = async (itemId: number) => {
    // if (!confirm('Are you sure you want to delete this menu item?')) {
    //   return;
    // }

    try {
      await apiClient.delete(`/menu/items/${itemId}`);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete item');
    }
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when page size changes
  };

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
                  <Home className="w-3 h-3 mr-2.5" />
                  Dashboard
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <ChevronRight className="w-3 h-3 text-gray-400 mx-1" />
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
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Add Menu Item
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={showUnavailable ? 'all' : 'available'}
                onChange={(e) => setShowUnavailable(e.target.value === 'all')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="available">Available Only</option>
                <option value="all">All Status</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="display_order">Display Order</option>
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="created_at">Creation Time</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Items Grid */}
        {items.length === 0 ? (
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
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white rounded-lg shadow hover:shadow-lg transition-shadow ${
                    item.status !== 'available' ? 'opacity-60' : ''
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
                    {/* Category Badge and Chef Recommendation */}
                    <div className="flex justify-between items-start mb-2">
                      <span className="inline-block px-2 py-1 text-xs font-semibold text-indigo-600 bg-indigo-100 rounded">
                        {getCategoryName(item.category_id)}
                      </span>
                      {item.chef_recommendation && (
                        <span className="inline-block px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded">
                          Chef's Choice
                        </span>
                      )}
                    </div>

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
                      ${parseFloat(item.price).toFixed(2)}
                    </p>

                    {/* Rating */}
                    {item.review_count && item.review_count > 0 ? (
                      <div className="mb-3">
                        <div className="flex items-center space-x-2">
                          <StarRating rating={item.average_rating || 0} size="sm" />
                          <span className="text-sm text-gray-600">
                            ({item.review_count} {item.review_count === 1 ? 'review' : 'reviews'})
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-3">
                        <span className="text-sm text-gray-500">No reviews yet</span>
                      </div>
                    )}

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

                    {/* Preparation Time */}
                    {item.preparation_time && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          {item.preparation_time} min prep
                        </span>
                      </div>
                    )}

                    {/* Status */}
                    <div className="flex items-center mb-4">
                      <span
                        className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                          item.status === 'available'
                            ? 'bg-green-100 text-green-800'
                            : item.status === 'sold_out'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {item.status === 'available'
                          ? 'Available'
                          : item.status === 'sold_out'
                          ? 'Sold Out'
                          : 'Unavailable'}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`/admin/menu-editor?id=${item.id}`)}
                          className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded hover:bg-indigo-700 transition-colors text-sm"
                        >
                          Edit
                        </button>
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.id, e.target.value as 'available' | 'unavailable' | 'sold_out')}
                          className="flex-1 px-3 py-2 rounded transition-colors text-sm bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="available">Available</option>
                          <option value="unavailable">Unavailable</option>
                          <option value="sold_out">Sold Out</option>
                        </select>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedItemForReview(item);
                            setReviewModalOpen(true);
                          }}
                          className="flex-1 px-3 py-2 bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors text-sm"
                        >
                          Reviews
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="flex-1 px-3 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6 rounded-lg shadow">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === Math.ceil(totalItems / pageSize)}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">
                      {Math.min((currentPage - 1) * pageSize + 1, totalItems)}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * pageSize, totalItems)}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium">{totalItems}</span>{' '}
                    results
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <label htmlFor="pageSize" className="text-sm text-gray-700">
                      Show:
                    </label>
                    <select
                      id="pageSize"
                      value={pageSize}
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                      className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value={6}>6</option>
                      <option value={12}>12</option>
                      <option value={24}>24</option>
                      <option value={48}>48</option>
                    </select>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      {Array.from({ length: Math.ceil(totalItems / pageSize) }, (_, i) => i + 1)
                        .filter(page => {
                          const totalPages = Math.ceil(totalItems / pageSize);
                          if (totalPages <= 7) return true;
                          if (page === 1 || page === totalPages) return true;
                          if (Math.abs(page - currentPage) <= 1) return true;
                          return false;
                        })
                        .map((page, index, array) => (
                          <React.Fragment key={page}>
                            {index > 0 && array[index - 1] !== page - 1 && (
                              <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                ...
                              </span>
                            )}
                            <button
                              onClick={() => handlePageChange(page)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                page === currentPage
                                  ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        ))}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === Math.ceil(totalItems / pageSize)}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Review Management Modal */}
        {selectedItemForReview && (
          <ReviewManagementModal
            menuItemId={selectedItemForReview.id}
            menuItemName={selectedItemForReview.name}
            isOpen={reviewModalOpen}
            onClose={() => {
              setReviewModalOpen(false);
              setSelectedItemForReview(null);
              fetchData(); // Refresh data to get updated review counts
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
