import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import GoogleSignInButton from './GoogleSignInButton';
import { apiClient } from '../config/api';

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  mode: 'signin' | 'signup';
  onSwitchMode: () => void;
};

type SignInFormData = {
  email: string;
  password: string;
};

type SignUpFormData = {
  email: string;
  password: string;
  confirmPassword: string;
};

type ForgotPasswordFormData = {
  email: string;
};

function AuthModal({ isOpen, onClose, mode, onSwitchMode }: AuthModalProps) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { login, register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<SignUpFormData>();

  const password = watch('password');

  const handleClose = () => {
    reset();
    setMessage('');
    setShowForgotPassword(false);
    onClose();
  };

  const onSubmitSignIn = async (data: SignInFormData) => {
    setMessage('');
    setLoading(true);

    try {
      await login(data.email, data.password);
      setMessage('Login successful!');
      setTimeout(() => {
        handleClose();
        navigate('/dashboard');
      }, 500);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Login failed';
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onSubmitSignUp = async (data: SignUpFormData) => {
    setMessage('');
    setLoading(true);

    try {
      await registerUser(data.email, data.password);
      setMessage('Account created successfully!');
      setTimeout(() => {
        setMessage('Switching to sign in...');
        setTimeout(() => {
          onSwitchMode();
          reset();
          setMessage('');
        }, 1000);
      }, 1500);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Registration failed';
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onSubmitForgotPassword = async (data: ForgotPasswordFormData) => {
    setMessage('');
    setLoading(true);

    try {
      await apiClient.post('/auth/request-password-reset', { email: data.email });
      setMessage('Password reset email sent! Please check your inbox (and spam folder).');
      setTimeout(() => {
        setShowForgotPassword(false);
        setMessage('');
        reset();
      }, 3000);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to send reset email';
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          {showForgotPassword ? 'Reset Password' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
        </h2>

        {!showForgotPassword && (
          <>
            {/* Google Sign In Button */}
            <GoogleSignInButton disabled={loading} />

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with email</span>
              </div>
            </div>
          </>
        )}

        {showForgotPassword ? (
          <form onSubmit={handleSubmit(onSubmitForgotPassword)} className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                placeholder="Enter your email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-300 transform hover:scale-[1.02]"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(false);
                setMessage('');
                reset();
              }}
              className="w-full py-2 text-blue-600 hover:underline"
            >
              Back to Sign In
            </button>
          </form>
        ) : mode === 'signin' ? (
          <form onSubmit={handleSubmit(onSubmitSignIn)} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                placeholder="Enter your email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
                placeholder="Enter your password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(true);
                  setMessage('');
                  reset();
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-300 transform hover:scale-[1.02]"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit(onSubmitSignUp)} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                placeholder="Enter your email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
                placeholder="Enter your password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === password || 'Passwords do not match',
                })}
                placeholder="Confirm your password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-300 transform hover:scale-[1.02]"
            >
              {loading ? 'Signing Up...' : 'Sign Up'}
            </button>
          </form>
        )}

        {message && (
          <p
            className={`mt-4 p-3 rounded-lg text-center text-sm ${
              message.includes('successful') || message.includes('successfully')
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-red-100 text-red-800 border border-red-300'
            }`}
          >
            {message}
          </p>
        )}

        <p className="text-center mt-6 text-gray-600">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => {
              onSwitchMode();
              reset();
              setMessage('');
              setShowForgotPassword(false);
            }}
            className="text-blue-600 hover:underline font-medium"
          >
            {mode === 'signin' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default AuthModal;
