import { useAuth } from '../context/AuthContext';
// import { useQuery } from '@tanstack/react-query';
// import { apiClient } from '../config/api';
import DashboardLayout from '../components/DashboardLayout';
// import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import SystemStatsBoard from '../components/SystemStatsBoard';
import AuditLogsViewer from '../components/AuditLogsViewer';
import SystemConfiguration from '../components/SystemConfiguration';
import { BarChart3, FileText, Settings, Wrench, Clipboard, FolderOpen, BarChart2, Armchair, TrendingUp, UtensilsCrossed, DollarSign, ChefHat } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  // const navigate = useNavigate();
  const [activeView, setActiveView] = useState<'overview' | 'audit-logs' | 'system-config'>('overview');

  // Example protected data query
  // const { data: profileData, isLoading } = useQuery({
  //   queryKey: ['user', 'profile'],
  //   queryFn: async () => {
  //     const response = await apiClient.get('/user/me');
  //     return response.data;
  //   },
  // });

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
                  <BarChart3 className="inline w-5 h-5 mr-2" />
                  System Overview
                </button>
                <button
                  onClick={() => setActiveView('audit-logs')}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    activeView === 'audit-logs'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FileText className="inline w-5 h-5 mr-2" />
                  Audit Logs
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
                    <Settings className="inline w-5 h-5 mr-2" />
                    System Configuration
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
{/* 
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
          </div>
        </div> */}
      </div>
    </DashboardLayout>
  );
}
