import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../config/api';
import { useNavigate } from 'react-router-dom';

export default function CustomerProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch user profile data including ordering history, preferences, payment options
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['user', 'profile'],
    queryFn: async () => {
      const response = await apiClient.get('/user/me');
      return response.data;
    },
  });

  // Fetch ordering history
  const { data: orderHistory, isLoading: ordersLoading } = useQuery({
    queryKey: ['user', 'orders'],
    queryFn: async () => {
      const response = await apiClient.get('/user/orders');
      return response.data;
    },
  });

  // Fetch food preferences
  const { data: preferences, isLoading: prefsLoading } = useQuery({
    queryKey: ['user', 'preferences'],
    queryFn: async () => {
      const response = await apiClient.get('/user/preferences');
      return response.data;
    },
  });

  // Fetch payment options
  const { data: paymentOptions, isLoading: paymentLoading } = useQuery({
    queryKey: ['user', 'payment-options'],
    queryFn: async () => {
      const response = await apiClient.get('/user/payment-options');
      return response.data;
    },
  });

  const handleViewMenu = () => {
    navigate('/menu/customer');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">My Profile</h1>

          <div className="space-y-6">
            {/* Profile Information */}
            <div className="border-b pb-4">
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Profile Information</h2>
              {isLoading ? (
                <p className="text-gray-600">Loading...</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-gray-600">
                    <span className="font-medium">Email:</span> {user?.email || profileData?.user?.email}
                  </p>
                  {profileData?.user?.id && (
                    <p className="text-gray-600">
                      <span className="font-medium">User ID:</span> {profileData.user.id}
                    </p>
                  )}
                  {profileData?.user?.name && (
                    <p className="text-gray-600">
                      <span className="font-medium">Name:</span> {profileData.user.name}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Ordering History */}
            <div className="border-b pb-4">
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Ordering History</h2>
              {ordersLoading ? (
                <p className="text-gray-600">Loading...</p>
              ) : orderHistory?.orders?.length > 0 ? (
                <div className="space-y-2">
                  {orderHistory.orders.map((order: any) => (
                    <div key={order.id} className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-medium">Order #{order.id}</p>
                      <p className="text-sm text-gray-600">Date: {new Date(order.created_at).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-600">Total: ${order.total}</p>
                      <p className="text-sm text-gray-600">Status: {order.status}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No orders yet.</p>
              )}
            </div>

            {/* Food Preferences */}
            <div className="border-b pb-4">
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Food Preferences</h2>
              {prefsLoading ? (
                <p className="text-gray-600">Loading...</p>
              ) : preferences?.preferences ? (
                <div className="space-y-2">
                  {preferences.preferences.map((pref: string) => (
                    <span key={pref} className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full mr-2 mb-2">
                      {pref}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No preferences set.</p>
              )}
            </div>

            {/* Payment Options */}
            <div className="border-b pb-4">
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Payment Options</h2>
              {paymentLoading ? (
                <p className="text-gray-600">Loading...</p>
              ) : paymentOptions?.paymentOptions?.length > 0 ? (
                <div className="space-y-2">
                  {paymentOptions.paymentOptions.map((option: any) => (
                    <div key={option.id} className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-medium">{option.type}</p>
                      <p className="text-sm text-gray-600">**** **** **** {option.last4}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No payment options saved.</p>
              )}
            </div>

            {/* Actions */}
            <div className="pt-4">
              <button
                onClick={handleViewMenu}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Browse Menu
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}