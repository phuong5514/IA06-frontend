import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../config/api';

export default function SystemStatsBoard() {
  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['system-stats-dashboard'],
    queryFn: async () => {
      const response = await apiClient.get('/system-stats/dashboard');
      return response.data;
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">System Overview</h2>
            <p className="text-indigo-100">Real-time restaurant operations dashboard</p>
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Customers */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <span className="text-2xl">👥</span>
            </div>
            <span className="text-xs text-gray-500">Live</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Active Customers</h3>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900">{stats?.customers?.active || 0}</p>
            <span className="text-sm text-gray-500">/ {stats?.customers?.today || 0} today</span>
          </div>
        </div>

        {/* Available Tables */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <span className="text-2xl">🪑</span>
            </div>
            <span className="text-xs text-gray-500">Live</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Available Tables</h3>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-green-600">{stats?.tables?.available || 0}</p>
            <span className="text-sm text-gray-500">/ {stats?.tables?.total || 0} total</span>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {stats?.tables?.occupied || 0} occupied
          </div>
        </div>

        {/* Active Staff */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <span className="text-2xl">👔</span>
            </div>
            <span className="text-xs text-gray-500">Today</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Staff Logged In</h3>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-purple-600">{stats?.staff?.activeToday || 0}</p>
            <span className="text-sm text-gray-500">/ {stats?.staff?.total || 0} total</span>
          </div>
          {stats?.staff?.byRole && stats.staff.byRole.length > 0 && (
            <div className="mt-2 flex gap-2 flex-wrap">
              {stats.staff.byRole.map((role: any) => (
                <span
                  key={role.role}
                  className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded"
                >
                  {role.role}: {role.count}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Items Ordered */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <span className="text-2xl">🍽️</span>
            </div>
            <span className="text-xs text-gray-500">Active</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Items Ordered</h3>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-orange-600">
              {stats?.orders?.totalItemsOrdered || 0}
            </p>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {stats?.orders?.itemsPreparing || 0} in preparation
          </div>
        </div>
      </div>

      {/* Order Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Orders by Status */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>📊</span> Orders by Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">⏳ Pending</span>
              <span className="text-lg font-bold text-yellow-600">
                {stats?.orders?.pending || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">👨‍🍳 Preparing</span>
              <span className="text-lg font-bold text-blue-600">
                {stats?.orders?.preparing || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">✅ Ready</span>
              <span className="text-lg font-bold text-green-600">
                {stats?.orders?.ready || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">🎉 Completed Today</span>
              <span className="text-lg font-bold text-gray-700">
                {stats?.orders?.completedToday || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>🕐</span> Recent Orders
          </h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {stats?.recentActivity?.recentOrders?.length > 0 ? (
              stats.recentActivity.recentOrders.map((order: any) => (
                <div
                  key={order.id}
                  className="p-3 bg-gray-50 rounded-lg flex items-center justify-between hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        Order #{order.id}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          order.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : order.status === 'preparing'
                            ? 'bg-blue-100 text-blue-800'
                            : order.status === 'ready'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {order.tableNumber ? `Table ${order.tableNumber}` : 'Takeout'} •{' '}
                      {new Date(order.updatedAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    ${parseFloat(order.totalAmount).toFixed(2)}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">No recent orders</p>
            )}
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {stats?.timestamp ? new Date(stats.timestamp).toLocaleString() : 'N/A'}
      </div>
    </div>
  );
}
