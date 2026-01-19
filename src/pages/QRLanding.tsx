import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient, tokenManager } from '../config/api';
import { X, Check } from 'lucide-react';

interface TableInfo {
  table_id: number;
  table_number: string;
  menu_url: string;
}

interface GuestSessionResponse {
  success: boolean;
  message: string;
  guestUser: {
    id: string;
    email: string;
    name: string;
    role: string;
    isGuest: boolean;
  };
  accessToken: string;
  sessionId: string;
}

export default function QRLanding() {
  const { qr_token } = useParams<{ qr_token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tableInfo, setTableInfo] = useState<TableInfo | null>(null);

  useEffect(() => {
    const verifyQRToken = async () => {
      // Get QR token from URL params or search params
      const token = qr_token || searchParams.get('token') || searchParams.get('qr');

      if (!token) {
        setError('No QR token provided. Please scan a valid QR code.');
        setLoading(false);
        return;
      }

      try {
        // Step 1: Verify QR token
        const verifyResponse = await apiClient.get<TableInfo>(
          `/tables/verify/${token}`
        );

        setTableInfo(verifyResponse.data);

        // Step 2: Initialize guest session
        const guestSessionResponse = await apiClient.post<GuestSessionResponse>(
          '/guest-session/initialize',
          {
            tableId: verifyResponse.data.table_id,
          }
        );

        // Step 3: Store guest access token
        tokenManager.setAccessToken(guestSessionResponse.data.accessToken);
        
        // Step 4: Store session info in localStorage for table session context
        const sessionData = {
          tableId: verifyResponse.data.table_id,
          tableNumber: verifyResponse.data.table_number,
          sessionId: guestSessionResponse.data.sessionId,
          guestUserId: guestSessionResponse.data.guestUser.id,
          isGuest: true,
          startedAt: new Date().toISOString(),
        };
        
        // Store in both keys for compatibility
        localStorage.setItem('guestSession', JSON.stringify(sessionData));
        localStorage.setItem('tableSession', JSON.stringify(sessionData));

        // Step 5: Ensure everything is ready before redirecting
        // First, wait for user profile query to refetch
        await queryClient.refetchQueries({ 
          queryKey: ['user', 'me'],
          exact: true 
        });

        // Poll until user data is actually available in the cache
        let attempts = 0;
        const maxAttempts = 100; 
        while (attempts < maxAttempts) {
          const userData = queryClient.getQueryData(['user', 'me']);
          const storedSession = localStorage.getItem('tableSession');
          
          if (userData && storedSession) {
            console.log('✅ Guest user authenticated:', userData);
            console.log('✅ Table session stored:', JSON.parse(storedSession));
            break;
          }
          
          // Wait 100ms before checking again
          await new Promise(resolve => setTimeout(resolve, 500));
          attempts++;
        }

        // Final verification
        const finalUserData = queryClient.getQueryData(['user', 'me']);
        const finalStoredSession = localStorage.getItem('tableSession');
        
        if (!finalUserData || !finalStoredSession) {
          throw new Error('Timeout: Failed to initialize guest session properly. Please try again.');
        }

        setLoading(false);

        // Small delay to show success message, then redirect
        setTimeout(() => {
          navigate(`/menu?table=${verifyResponse.data.table_id}&session=${guestSessionResponse.data.sessionId}`);
        }, 500);
      } catch (err: any) {
        setLoading(false);
        if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else if (err.message) {
          setError(err.message);
        } else {
          setError('Failed to verify QR code. Please try again.');
        }
      }
    };

    verifyQRToken();
  }, [qr_token, searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-20">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        {loading && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Verifying QR Code</h2>
            <p className="text-gray-600">Please wait while we verify your table...</p>
          </div>
        )}

        {!loading && error && (
          <div className="text-center">
            <div className="bg-red-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
              <X className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Verification Failed</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Go to Home
            </button>
          </div>
        )}

        {!loading && tableInfo && !error && (
          <div className="text-center">
            <div className="bg-green-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome!</h2>
            <p className="text-gray-600 mb-2">
              You're seated at <span className="font-semibold">Table {tableInfo.table_number}</span>
            </p>
            <p className="text-sm text-gray-500 mb-4">Redirecting to menu...</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-indigo-600 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
