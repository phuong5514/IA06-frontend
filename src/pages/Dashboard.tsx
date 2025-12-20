import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../config/api';
import DashboardLayout from '../components/DashboardLayout';

export default function Dashboard() {
  const { user } = useAuth();

  // Example protected data query
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['user', 'profile'],
    queryFn: async () => {
      const response = await apiClient.get('/user/me');
      return response.data;
    },
  });

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>

          <div className="space-y-6">
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
                </div>
              )}
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                ✓ Authentication Successful
              </h3>
              <p className="text-green-700">
                You are viewing a protected route. This page is only accessible to authenticated users.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">
                Token Management
              </h3>
              <ul className="list-disc list-inside text-blue-700 space-y-1">
                <li>Access tokens are stored in memory (not localStorage)</li>
                <li>Refresh tokens are stored in secure HTTP-only cookies</li>
                <li>Tokens automatically refresh when expired</li>
                <li>Multi-tab synchronization is enabled</li>
              </ul>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-purple-800 mb-2">
                React Query Features
              </h3>
              <ul className="list-disc list-inside text-purple-700 space-y-1">
                <li>Authentication mutations for login/logout</li>
                <li>Query invalidation on auth state changes</li>
                <li>Automatic query refetching</li>
                <li>Optimistic updates and caching</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
