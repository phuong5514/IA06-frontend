import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../config/api';
import DashboardLayout from '../components/DashboardLayout';
import toast from 'react-hot-toast';
import { XCircle, RefreshCw, Users, Clock, ShoppingCart, AlertCircle } from 'lucide-react';

interface Session {
  sessionId: string;
  tableId: number;
  tableNumber: string;
  userId: string;
  userName: string;
  isGuest: boolean;
  startedAt: string;
  incompleteOrderCount: number;
  totalOrderValue: string;
}

export default function SessionManagement() {
  const queryClient = useQueryClient();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  // Fetch all active sessions
  const { data: sessionsData, isLoading, error, refetch } = useQuery({
    queryKey: ['sessions', 'active'],
    queryFn: async () => {
      const response = await apiClient.get('/guest-session/active-sessions');
      return response.data;
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // End session mutation
  const endSessionMutation = useMutation({
    mutationFn: async ({ sessionId, tableId }: { sessionId: string; tableId: number }) => {
      const response = await apiClient.post('/guest-session/end', {
        sessionId,
        tableId,
      });
      return response.data;
    },
    onSuccess: (data) => {
      const { ordersCancelled } = data;
      toast.success(
        `Session ended successfully. ${ordersCancelled} incomplete order${ordersCancelled !== 1 ? 's' : ''} cancelled.`
      );
      queryClient.invalidateQueries({ queryKey: ['sessions', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setSelectedSession(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to end session');
    },
  });

  const handleEndSession = (session: Session) => {
    const confirmed = window.confirm(
      `Are you sure you want to end the session for Table ${session.tableNumber}?\n\n` +
      `User: ${session.userName} ${session.isGuest ? '(Guest)' : ''}\n` +
      `${session.incompleteOrderCount} incomplete order(s) will be cancelled.`
    );

    if (confirmed) {
      endSessionMutation.mutate({
        sessionId: session.sessionId,
        tableId: session.tableId,
      });
    }
  };

  const sessions: Session[] = sessionsData?.sessions || [];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getSessionDuration = (startedAt: string) => {
    const start = new Date(startedAt);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''}`;
    }
    
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Session Management</h1>
            <p className="text-gray-600 mt-1">View and manage active table sessions</p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p>Error loading sessions. Please try again.</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-lg text-gray-600">Loading sessions...</div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 text-lg">No active sessions</p>
            <p className="text-gray-500 text-sm mt-1">Sessions will appear here when customers scan QR codes</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <div
                key={session.sessionId}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Table {session.tableNumber}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {session.userName}
                      {session.isGuest && (
                        <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                          Guest
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    {getSessionDuration(session.startedAt)}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Started:</span>
                    <span className="text-gray-900 font-medium">
                      {formatDate(session.startedAt)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-1">
                      <ShoppingCart className="w-4 h-4" />
                      Incomplete Orders:
                    </span>
                    <span className={`font-bold ${session.incompleteOrderCount > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
                      {session.incompleteOrderCount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Value:</span>
                    <span className="text-gray-900 font-bold">
                      ${parseFloat(session.totalOrderValue).toFixed(2)}
                    </span>
                  </div>
                </div>

                {session.incompleteOrderCount > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mb-4 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-orange-700">
                      This session has {session.incompleteOrderCount} incomplete order{session.incompleteOrderCount !== 1 ? 's' : ''} that will be cancelled when ending the session.
                    </p>
                  </div>
                )}

                <button
                  onClick={() => handleEndSession(session)}
                  disabled={endSessionMutation.isPending && selectedSession === session.sessionId}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onMouseEnter={() => setSelectedSession(session.sessionId)}
                >
                  <XCircle className="w-5 h-5" />
                  {endSessionMutation.isPending && selectedSession === session.sessionId
                    ? 'Ending Session...'
                    : 'End Session'}
                </button>

                <p className="text-xs text-gray-500 text-center mt-2">
                  Session ID: {session.sessionId.substring(0, 8)}...
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
