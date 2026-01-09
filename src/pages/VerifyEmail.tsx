import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { apiClient as api } from '../config/api';
import { CheckCircle, XCircle } from 'lucide-react';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await api.post('/user/verify-email', { token });
      setStatus('success');
      setMessage(response.data.message || 'Email verified successfully!');
      
      // Redirect to home after 2 seconds where user can login
      setTimeout(() => {
        navigate('/?login=true');
      }, 2000);
    } catch (error: any) {
      setStatus('error');
      setMessage(
        error.response?.data?.message ||
          'Email verification failed. Please try again.'
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="mx-auto h-12 w-12 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Verifying Email...
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Please wait while we verify your email address.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Email Verified!
              </h2>
              <p className="mt-2 text-sm text-gray-600">{message}</p>
              <p className="mt-4 text-sm text-gray-500">
                Redirecting to home...
              </p>
              <Link
                to="/?login=true"
                className="mt-4 inline-block text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Click here if not redirected
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto flex items-center justify-center">
                <XCircle className="w-12 h-12 text-red-500" />
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Verification Failed
              </h2>
              <p className="mt-2 text-sm text-red-600">{message}</p>
              <div className="mt-6 space-y-4">
                <Link
                  to="/resend-verification"
                  className="inline-block text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  Resend verification email
                </Link>
                <br />
                <Link
                  to="/"
                  className="inline-block text-gray-600 hover:text-gray-500"
                >
                  Back to home
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
