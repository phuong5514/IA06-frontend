import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../config/api';
import DashboardLayout from '../components/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import SystemStatsBoard from '../components/SystemStatsBoard';
import AuditLogsViewer from '../components/AuditLogsViewer';
import SystemConfiguration from '../components/SystemConfiguration';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<'overview' | 'audit-logs' | 'system-config'>('overview');

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
      <div className="max-w-7xl mx-auto">
        {/* Staff Dashboard - Show stats and audit logs */}
        {(user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'waiter' || user?.role === 'kitchen') && (
          <div className="mb-8">
            {/* View Selector */}
            <div className="bg-white rounded-lg shadow mb-6 p-4">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setActiveView('overview')}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    activeView === 'overview'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📊 System Overview
                </button>
                <button
                  onClick={() => setActiveView('audit-logs')}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    activeView === 'audit-logs'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📋 Audit Logs
                </button>
                {user?.role === 'super_admin' && (
                  <button
                    onClick={() => setActiveView('system-config')}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      activeView === 'system-config'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ⚙️ System Configuration
                  </button>
                )}
              </div>
            </div>

            {/* Content based on active view */}
            {activeView === 'overview' && <SystemStatsBoard />}
            {activeView === 'audit-logs' && <AuditLogsViewer />}
            {activeView === 'system-config' && user?.role === 'super_admin' && <SystemConfiguration />}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-xl p-8 mt-6">
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
                  <p className="text-gray-600">
                    <span className="font-medium">Role:</span>{' '}
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-semibold">
                      {user?.role}
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                ✓ Authentication Successful
              </h3>
              <p className="text-green-700">
                You are viewing a protected route. This page is only accessible to authenticated users.
              </p>
            </div> */}

            {(user?.role === 'admin' || user?.role === 'super_admin') && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-indigo-800 mb-4">
                  🛠️ Restaurant Management
                </h3>
                <p className="text-indigo-700 mb-4">
                  As an administrator, you can manage your restaurant's menu, categories, and operations.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => navigate('/admin/menu-items')}
                    className="bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    📋 Manage Menu Items
                  </button>
                  <button
                    onClick={() => navigate('/admin/menu-categories')}
                    className="bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    📂 Manage Categories
                  </button>
                  <button
                    onClick={() => navigate('/admin/menu-bulk-ops')}
                    className="bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    📊 Bulk Operations
                  </button>
                  <button
                    onClick={() => navigate('/admin/tables')}
                    className="bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    🪑 Manage Tables
                  </button>
                </div>
              </div>
            )}

            {(user?.role === 'waiter' || user?.role === 'admin' || user?.role === 'super_admin') && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-800 mb-4">
                  🍽️ Order & Bill Management
                </h3>
                <p className="text-green-700 mb-4">
                  View and manage customer orders, accept new orders, update order status, and process payments.
                </p>
                <div className="flex flex-col md:flex-row gap-3">
                  <button
                    onClick={() => navigate('/waiter/orders')}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex-1"
                  >
                    View Orders Dashboard
                  </button>
                  <button
                    onClick={() => navigate('/waiter/bills')}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex-1"
                  >
                    💵 Manage Bills & Payments
                  </button>
                </div>
              </div>
            )}

            {(user?.role === 'kitchen' || user?.role === 'admin' || user?.role === 'super_admin') && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-800 mb-4">
                  👨‍🍳 Kitchen Display System
                </h3>
                <p className="text-purple-700 mb-4">
                  View orders in preparation, mark them as ready, and manage the kitchen workflow.
                </p>
                <button
                  onClick={() => navigate('/kitchen/display')}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium w-full md:w-auto"
                >
                  Open Kitchen Display
                </button>
              </div>
            )}

            {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
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
            </div> */}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
