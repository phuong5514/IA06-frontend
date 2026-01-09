import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tokenManager } from '../config/api';
import { Check, X } from 'lucide-react';

export default function GoogleAuthSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refetchUser } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const token = searchParams.get('token');
        
        if (!token) {
          setStatus('error');
          setError('No authentication token received');
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        // Store the access token
        tokenManager.setAccessToken(token);
        
        // Fetch user details to update auth context
        await refetchUser();
        
        setStatus('success');
        
        // Redirect to dashboard after short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
        
      } catch (err: any) {
        console.error('OAuth callback error:', err);
        setStatus('error');
        setError(err?.message || 'Failed to complete authentication');
        
        // Redirect to home after delay
        setTimeout(() => navigate('/'), 3000);
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, refetchUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {status === 'processing' && (
          <>
            <div className="mb-6">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Signing you in...
            </h2>
            <p className="text-gray-600">
              Please wait while we complete your authentication
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
                <Check className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Success!
            </h2>
            <p className="text-gray-600">
              You have been signed in successfully. Redirecting to dashboard...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              Authentication Failed
            </h2>
            <p className="text-gray-600 mb-4">
              {error || 'Unable to complete sign in with Google'}
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to home page...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
