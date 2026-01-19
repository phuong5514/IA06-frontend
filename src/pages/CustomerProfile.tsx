import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../config/api';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { 
  User, 
  Receipt, 
  Heart, 
  CreditCard, 
  Plus,
  Trash2,
  Check,
  X,
  Clock,
  CheckCircle,
  Loader2,
  Camera,
  Edit
} from 'lucide-react';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface Order {
  id: number;
  total_amount: string;
  status: string;
  created_at: string;
  isPaid: boolean;
  payment: any;
  items: Array<{
    id: number;
    quantity: number;
    unit_price: string;
    menuItem: {
      name: string;
      price: string;
    };
  }>;
}

interface PaymentMethod {
  id: number;
  card_brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

type TabType = 'profile' | 'orders' | 'preferences' | 'payments';

export default function CustomerProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAddCard, setShowAddCard] = useState(false);
  
  // Profile editing states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedPhone, setEditedPhone] = useState('');
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  
  // Change password states
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Order history pagination, search, and filter states
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [orderSortBy, setOrderSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Fetch user profile
  const { data: profileData, refetch: refetchProfile } = useQuery({
    queryKey: ['user', 'profile'],
    queryFn: async () => {
      const response = await apiClient.get('/user/me');
      return response.data;
    },
  });

  // Initialize edit form when profile data loads
  useEffect(() => {
    if (profileData?.user) {
      setEditedName(profileData.user.name || '');
      setEditedPhone(profileData.user.phone || '');
      setProfileImagePreview(profileData.user.profile_image_url || null);
    }
  }, [profileData]);

  // Fetch ordering history
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['user', 'orders'],
    queryFn: async () => {
      const response = await apiClient.get('/user/orders');
      return response.data;
    },
  });

  // Fetch food preferences
  const { data: preferencesData, isLoading: prefsLoading, refetch: refetchPreferences } = useQuery({
    queryKey: ['user', 'preferences'],
    queryFn: async () => {
      const response = await apiClient.get('/user/preferences');
      return response.data;
    },
  });

  // Sync preferences data to selectedTags when data loads or changes
  useEffect(() => {
    if (preferencesData?.preferences?.dietary_tags) {
      setSelectedTags(preferencesData.preferences.dietary_tags);
    }
  }, [preferencesData]);

  // Reset pagination to page 1 when order filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [orderSearchQuery, orderStatusFilter, orderSortBy, itemsPerPage]);

  // Fetch available dietary tags
  const { data: availableTagsData } = useQuery({
    queryKey: ['available-tags'],
    queryFn: async () => {
      const response = await apiClient.get('/user/available-tags');
      return response.data;
    },
  });

  // Fetch payment methods
  const { data: paymentMethodsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['user', 'payment-methods'],
    queryFn: async () => {
      const response = await apiClient.get('/user/payment-methods');
      return response.data;
    },
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (tags: string[]) => {
      const response = await apiClient.post('/user/preferences', {
        dietary_tags: tags,
      });
      return response.data;
    },
    onSuccess: async () => {
      await refetchPreferences();
      toast.success('Preferences updated successfully!');
    },
    onError: (error) => {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
    },
  });

  // Delete payment method mutation
  const deletePaymentMethodMutation = useMutation({
    mutationFn: async (methodId: number) => {
      const response = await apiClient.post(`/user/payment-methods/${methodId}/delete`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'payment-methods'] });
      toast.success('Payment method deleted successfully!');
    },
    onError: () => {
      toast.error('Failed to delete payment method');
    },
  });

  // Set default payment method mutation
  const setDefaultPaymentMethodMutation = useMutation({
    mutationFn: async (methodId: number) => {
      const response = await apiClient.post(`/user/payment-methods/${methodId}/set-default`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'payment-methods'] });
      toast.success('Default payment method updated!');
    },
    onError: () => {
      toast.error('Failed to set default payment method');
    },
  });

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: { name?: string; phone?: string; profile_image_url?: string }) => {
      const response = await apiClient.put('/user/profile', updates);
      return response.data;
    },
    onSuccess: async () => {
      await refetchProfile();
      setIsEditingProfile(false);
      toast.success('Profile updated successfully!');
    },
    onError: (error) => {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    },
  });

  const handleProfileImageUpload = async (file: File) => {
    setUploadingProfileImage(true);
    setUploadProgress('Getting upload URL...');

    try {
      // Step 1: Get signed upload URL from backend
      const uploadUrlResponse = await apiClient.post('/user/profile/image/upload-url', {
        fileName: file.name,
        contentType: file.type,
      });

      const { signedUrl, fileName: gcsFileName } = uploadUrlResponse.data;
      setUploadProgress('Uploading to Google Cloud...');

      // Step 2: Upload file directly to GCS
      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image to cloud storage');
      }

      setUploadProgress('Confirming upload...');

      // Step 3: Confirm upload and get processed URLs
      const confirmResponse = await apiClient.post('/user/profile/image/confirm', {
        gcsFileName,
      });

      setUploadProgress('Upload complete!');
      setTimeout(() => setUploadProgress(''), 2000);

      // Update preview with the new image URL
      setProfileImagePreview(confirmResponse.data.url);
      
      // Refresh profile data
      await refetchProfile();
      toast.success('Profile picture updated successfully!');

    } catch (error: any) {
      console.error('Error uploading profile image:', error);
      toast.error(error.response?.data?.message || 'Failed to upload profile image');
      setUploadProgress('');
    } finally {
      setUploadingProfileImage(false);
    }
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!acceptedTypes.includes(file.type)) {
        toast.error('Please select a valid image file (JPG, PNG, or WebP)');
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Start the upload process
      handleProfileImageUpload(file);
    }
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      name: editedName || undefined,
      phone: editedPhone || undefined,
    });
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setEditedName(profileData?.user?.name || '');
    setEditedPhone(profileData?.user?.phone || '');
    setProfileImagePreview(profileData?.user?.profile_image_url || null);
  };

  const handleChangePassword = async () => {
    setPasswordError('');

    // Validate inputs
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(newPassword)) {
      setPasswordError('Password must contain uppercase, lowercase, number, and special character');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setChangingPassword(true);

    try {
      const response = await apiClient.post('/user/change-password', {
        currentPassword,
        newPassword,
      });

      if (response.data.success) {
        toast.success('Password changed successfully!');
        setShowChangePassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setPasswordError(response.data.message || 'Failed to change password');
        toast.error(response.data.message || 'Failed to change password');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to change password';
      setPasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setChangingPassword(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-6 mb-6">
              {/* Profile Picture */}
              <div className="relative">
                {profileImagePreview ? (
                  <img
                    src={profileImagePreview}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-lg">
                    {user?.email?.charAt(0).toUpperCase()}
                  </div>
                )}
                <label
                  htmlFor="profile-image-input"
                  className="absolute bottom-0 right-0 bg-indigo-600 text-white rounded-full p-2 cursor-pointer hover:bg-indigo-700 transition-colors shadow-lg"
                  title="Change profile picture"
                >
                  <Camera className="w-4 h-4" />
                </label>
                <input
                  id="profile-image-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleProfileImageChange}
                  disabled={uploadingProfileImage}
                  className="hidden"
                />
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                {isEditingProfile ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      placeholder="Your name"
                      className="w-full text-2xl font-bold text-gray-800 border-b-2 border-indigo-300 focus:border-indigo-600 outline-none bg-transparent"
                    />
                    <input
                      type="tel"
                      value={editedPhone}
                      onChange={(e) => setEditedPhone(e.target.value)}
                      placeholder="Phone number"
                      className="w-full text-gray-600 border-b-2 border-indigo-300 focus:border-indigo-600 outline-none bg-transparent"
                    />
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {profileData?.user?.name || 'Guest User'}
                    </h2>
                    <p className="text-gray-600">{user?.email}</p>
                    {profileData?.user?.phone && (
                      <p className="text-gray-500 text-sm mt-1">{profileData.user.phone}</p>
                    )}
                  </>
                )}
              </div>

              {/* Edit Button */}
              {!isEditingProfile ? (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveProfile}
                    disabled={updateProfileMutation.isPending}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={updateProfileMutation.isPending}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {uploadProgress && (
              <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-3 rounded-lg">
                {uploadProgress}
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div>
                <span className="font-medium text-gray-700">Email:</span>
                <span className="ml-2 text-gray-900">{user?.email}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Member Since:</span>
                <span className="ml-2 text-gray-900">
                  {profileData?.user?.created_at
                    ? new Date(profileData.user.created_at).toLocaleDateString()
                    : 'N/A'}
                </span>
              </div>
            </div>

            {/* Change Password Section */}
            <div className="mt-6 border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Security</h3>
                {!showChangePassword && (
                  <button
                    onClick={() => setShowChangePassword(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                  >
                    Change Password
                  </button>
                )}
              </div>

              {showChangePassword && (
                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      placeholder="Enter current password"
                    />
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      placeholder="Enter new password"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Must be at least 8 characters with uppercase, lowercase, number, and special character
                    </p>
                  </div>

                  <div>
                    <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      id="confirmNewPassword"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      placeholder="Confirm new password"
                    />
                  </div>

                  {passwordError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {passwordError}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleChangePassword}
                      disabled={changingPassword}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {changingPassword ? 'Changing...' : 'Update Password'}
                    </button>
                    <button
                      onClick={() => {
                        setShowChangePassword(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmNewPassword('');
                        setPasswordError('');
                      }}
                      disabled={changingPassword}
                      className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'orders':
        if (ordersLoading) {
          return <div className="text-center py-8">Loading orders...</div>;
        }

        const allOrders = ordersData?.orders || [];
        const paidOrders = ordersData?.paidOrders || [];
        const unpaidOrders = ordersData?.unpaidOrders || [];
        
        // Filter orders based on status filter
        let filteredOrders = orderStatusFilter === 'paid' ? paidOrders : 
                            orderStatusFilter === 'unpaid' ? unpaidOrders : 
                            allOrders;
        
        // Search functionality
        if (orderSearchQuery.trim()) {
          const query = orderSearchQuery.toLowerCase();
          filteredOrders = filteredOrders.filter((order: Order) => {
            // Search by order ID
            if (order.id.toString().includes(query)) return true;
            
            // Search by item names
            const hasMatchingItem = order.items.some((item: any) => 
              item.menuItem.name.toLowerCase().includes(query)
            );
            if (hasMatchingItem) return true;
            
            // Search by payment method
            if (order.payment?.payment_method?.toLowerCase().includes(query)) return true;
            
            // Search by amount
            if (order.total_amount.toString().includes(query)) return true;
            
            return false;
          });
        }
        
        // Sort orders
        const sortedOrders = [...filteredOrders].sort((a: Order, b: Order) => {
          switch (orderSortBy) {
            case 'date-desc':
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            case 'date-asc':
              return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            case 'amount-desc':
              return parseFloat(b.total_amount) - parseFloat(a.total_amount);
            case 'amount-asc':
              return parseFloat(a.total_amount) - parseFloat(b.total_amount);
            default:
              return 0;
          }
        });
        
        // Pagination
        const totalItems = sortedOrders.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedOrders = sortedOrders.slice(startIndex, endIndex);
        
        // Aggregate all unpaid orders into one combined bill
        const aggregatedUnpaidTotal = unpaidOrders.reduce((sum: number, order: Order) => 
          sum + parseFloat(order.total_amount), 0
        );
        const allUnpaidItems = unpaidOrders.flatMap((order: Order) => 
          order.items.map(item => ({
            ...item,
            orderId: order.id,
            orderDate: order.created_at
          }))
        );

        return (
          <div className="space-y-6">
            {/* Search, Filter, and Sort Controls */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Order Management</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Orders
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      placeholder="Search by order #, item name, amount..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <svg
                      className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Orders</option>
                    <option value="paid">Paid Only</option>
                    <option value="unpaid">Unpaid Only</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={orderSortBy}
                    onChange={(e) => setOrderSortBy(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="date-desc">Newest First</option>
                    <option value="date-asc">Oldest First</option>
                    <option value="amount-desc">Highest Amount</option>
                    <option value="amount-asc">Lowest Amount</option>
                  </select>
                </div>
              </div>

              {/* Results Summary */}
              <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                <span>
                  Showing {totalItems === 0 ? 0 : startIndex + 1} - {Math.min(endIndex, totalItems)} of {totalItems} orders
                </span>
                <div className="flex items-center gap-2">
                  <span>Per page:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Unpaid Orders - Aggregated */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-orange-600" />
                <h3 className="text-xl font-bold text-gray-800">Unpaid Bill</h3>
                {unpaidOrders.length > 0 && (
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">
                    {unpaidOrders.length} {unpaidOrders.length === 1 ? 'order' : 'orders'}
                  </span>
                )}
              </div>
              {unpaidOrders.length === 0 ? (
                <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">No unpaid orders</p>
              ) : (
                <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-bold text-2xl text-gray-800">Combined Bill</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {unpaidOrders.length} unpaid {unpaidOrders.length === 1 ? 'order' : 'orders'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Orders: {unpaidOrders.map((o: Order) => `#${o.id}`).join(', ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-orange-600">
                        ${aggregatedUnpaidTotal.toFixed(2)}
                      </p>
                      <span className="inline-block mt-2 px-3 py-1 bg-orange-200 text-orange-800 text-xs rounded-full font-medium">
                        Pending Payment
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 border-t-2 border-orange-300 pt-4 mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">All Items:</p>
                    {allUnpaidItems.map((item: any, index: number) => (
                      <div key={`${item.orderId}-${item.id}-${index}`} className="flex justify-between text-sm">
                        <span className="text-gray-700">
                          {item.quantity}x {item.menuItem.name}
                          <span className="text-xs text-gray-500 ml-2">(Order #{item.orderId})</span>
                        </span>
                        <span className="font-medium text-gray-900">
                          ${parseFloat(item.unit_price).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => navigate('/billing')}
                    className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 transition-colors font-bold text-lg shadow-md"
                  >
                    Pay ${aggregatedUnpaidTotal.toFixed(2)} Now →
                  </button>
                </div>
              )}
            </div>

            {/* All Orders (Filtered, Sorted, and Paginated) */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                {orderStatusFilter === 'paid' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : orderStatusFilter === 'unpaid' ? (
                  <Clock className="w-5 h-5 text-orange-600" />
                ) : (
                  <Receipt className="w-5 h-5 text-indigo-600" />
                )}
                <h3 className="text-xl font-bold text-gray-800">
                  {orderStatusFilter === 'paid' ? 'Paid Orders' : 
                   orderStatusFilter === 'unpaid' ? 'Unpaid Orders' : 
                   'All Orders'}
                </h3>
                <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full">
                  {totalItems}
                </span>
              </div>
              
              {paginatedOrders.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Receipt className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 text-lg font-medium mb-2">
                    {orderSearchQuery ? 'No orders found' : 'No orders yet'}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {orderSearchQuery ? 'Try adjusting your search or filters' : 'Your order history will appear here'}
                  </p>
                  {orderSearchQuery && (
                    <button
                      onClick={() => {
                        setOrderSearchQuery('');
                        setOrderStatusFilter('all');
                      }}
                      className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {paginatedOrders.map((order: Order) => (
                      <div
                        key={order.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-bold text-lg text-gray-800">Order #{order.id}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(order.created_at).toLocaleString()}
                            </p>
                            {order.payment && (
                              <p className="text-xs text-green-600 mt-1">
                                Paid via {order.payment.payment_method}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-800">
                              ${parseFloat(order.total_amount).toFixed(2)}
                            </p>
                            <span className={`inline-block px-3 py-1 text-xs rounded-full font-medium ${
                              order.isPaid 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              {order.isPaid ? 'Paid' : 'Unpaid'}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2 border-t border-gray-200 pt-3">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span className="text-gray-700">
                                {item.quantity}x {item.menuItem.name}
                              </span>
                              <span className="font-medium text-gray-900">
                                ${parseFloat(item.unit_price).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-center gap-2">
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="First page"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                      </button>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page => {
                            // Show first page, last page, current page, and pages around current
                            return page === 1 || 
                                   page === totalPages || 
                                   Math.abs(page - currentPage) <= 1;
                          })
                          .map((page, index, array) => (
                            <div key={page} className="flex items-center">
                              {index > 0 && array[index - 1] !== page - 1 && (
                                <span className="px-2 text-gray-400">...</span>
                              )}
                              <button
                                onClick={() => setCurrentPage(page)}
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                  currentPage === page
                                    ? 'bg-indigo-600 text-white font-bold'
                                    : 'border border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            </div>
                          ))}
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                      
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Last page"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-red-500" />
              <h3 className="text-xl font-bold text-gray-800">Food Preferences</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Select your dietary preferences to help us recommend dishes you'll love.
            </p>

            {prefsLoading ? (
              <div className="text-center py-8">Loading preferences...</div>
            ) : (
              <>
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-medium text-gray-700 mb-3">Available Tags:</h4>
                  <div className="flex flex-wrap gap-2">
                    {availableTagsData?.tags?.length > 0 ? (
                      availableTagsData.tags.map((tag: string) => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            selectedTags.includes(tag)
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'bg-white text-gray-700 border border-gray-300 hover:border-indigo-400'
                          }`}
                        >
                          {selectedTags.includes(tag) && <Check className="w-4 h-4 inline mr-1" />}
                          {tag}
                        </button>
                      ))
                    ) : (
                      <p className="text-gray-500">No dietary tags available yet.</p>
                    )}
                  </div>
                </div>

                <div className="bg-indigo-50 rounded-lg p-6">
                  <h4 className="font-medium text-gray-700 mb-3">Your Selected Preferences:</h4>
                  {selectedTags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedTags.map((tag) => (
                        <span
                          key={tag}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium flex items-center gap-2"
                        >
                          {tag}
                          <button
                            onClick={() => toggleTag(tag)}
                            className="hover:bg-indigo-700 rounded-full p-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No preferences selected yet.</p>
                  )}
                </div>

                <button
                  onClick={() => updatePreferencesMutation.mutate(selectedTags)}
                  disabled={updatePreferencesMutation.isPending}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatePreferencesMutation.isPending ? 'Saving...' : 'Save Preferences'}
                </button>
              </>
            )}
          </div>
        );

      case 'payments':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-800">Saved Payment Methods</h3>
              </div>
              <button
                onClick={() => setShowAddCard(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Card
              </button>
            </div>

            {paymentsLoading ? (
              <div className="text-center py-8">Loading payment methods...</div>
            ) : paymentMethodsData?.paymentMethods?.length > 0 ? (
              <div className="space-y-3">
                {paymentMethodsData.paymentMethods.map((method: PaymentMethod) => (
                  <div
                    key={method.id}
                    className={`border rounded-lg p-4 ${
                      method.is_default
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center text-white font-bold text-xs">
                          {method.card_brand.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            •••• •••• •••• {method.last4}
                          </p>
                          <p className="text-sm text-gray-600">
                            Expires {method.exp_month}/{method.exp_year}
                          </p>
                          {method.is_default && (
                            <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                              Default
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!method.is_default && (
                          <button
                            onClick={() => setDefaultPaymentMethodMutation.mutate(method.id)}
                            disabled={setDefaultPaymentMethodMutation.isPending}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          onClick={() => deletePaymentMethodMutation.mutate(method.id)}
                          disabled={deletePaymentMethodMutation.isPending}
                          className="text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No saved payment methods yet.</p>
                <p className="text-sm text-gray-500">
                  Payment methods will be saved automatically when you make your first payment.
                </p>
              </div>
            )}

            {showAddCard && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-6 max-w-md w-full">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Add Payment Method</h3>
                  <Elements stripe={stripePromise}>
                    <AddCardForm 
                      onSuccess={() => {
                        setShowAddCard(false);
                        queryClient.invalidateQueries({ queryKey: ['user', 'payment-methods'] });
                      }}
                      onCancel={() => setShowAddCard(false)}
                    />
                  </Elements>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 pt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">My Profile</h1>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'profile'
                    ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <User className="w-5 h-5" />
                Profile
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'orders'
                    ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Receipt className="w-5 h-5" />
                Orders
              </button>
              <button
                onClick={() => setActiveTab('preferences')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'preferences'
                    ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Heart className="w-5 h-5" />
                Preferences
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'payments'
                    ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                Payment Methods
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">{renderTabContent()}</div>
        </div>
      </div>
    </div>
  );
}

// Add Card Form Component using Stripe Elements
function AddCardForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Create payment method with Stripe
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (!paymentMethod) {
        throw new Error('Failed to create payment method');
      }

      // Save payment method to backend
      await apiClient.post('/user/payment-methods', {
        stripe_payment_method_id: paymentMethod.id,
        card_brand: paymentMethod.card?.brand || 'unknown',
        last4: paymentMethod.card?.last4 || '0000',
        exp_month: paymentMethod.card?.exp_month || 1,
        exp_year: paymentMethod.card?.exp_year || 2024,
        is_default: false,
      });

      toast.success('Payment method added successfully!');
      onSuccess();
    } catch (err: any) {
      console.error('Error adding card:', err);
      console.error('Response data:', err.response?.data);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to add payment method';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border border-gray-300 rounded-lg p-3">
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!stripe || processing}
          className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Adding...
            </>
          ) : (
            'Add Card'
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}