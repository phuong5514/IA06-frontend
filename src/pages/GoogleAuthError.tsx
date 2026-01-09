import { Link, useSearchParams } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { X } from 'lucide-react';

export default function GoogleAuthError() {
  const [searchParams] = useSearchParams();
  const errorReason = searchParams.get('reason');

  const getErrorMessage = () => {
    switch (errorReason) {
      case 'invalid_client':
        return 'Invalid Google OAuth configuration. Please contact support.';
      case 'user_cancelled':
        return 'You cancelled the Google sign-in process.';
      case 'server_error':
        return 'A server error occurred during authentication.';
      case 'access_denied':
        return 'Access was denied. Please try again.';
      default:
        return 'Unable to sign in with Google. Please try again later.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <FcGoogle className="w-16 h-16" />
            <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-1">
              <X className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        {/* Error Title */}
        <h2 className="text-2xl font-bold text-center text-red-600 mb-3">
          Authentication Failed
        </h2>

        {/* Error Message */}
        <p className="text-center text-gray-700 mb-6">
          {getErrorMessage()}
        </p>

        {/* Additional Info */}
        {errorReason && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <p className="text-xs text-gray-500 text-center">
              Error Code: <span className="font-mono font-semibold">{errorReason}</span>
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            to="/"
            className="block w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-center"
          >
            Return to Home
          </Link>
          
          <button
            onClick={() => window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/google`}
            className="block w-full py-3 px-4 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            Try Again
          </button>
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Need help?{' '}
          <Link to="/help" className="text-blue-600 hover:underline">
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  );
}
