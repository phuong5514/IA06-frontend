import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { API_ENDPOINTS, apiClient } from '../config/api';
import { useAuth } from '../context/AuthContext';

type SignInFormData = {
  email: string;
  password: string;
};

function SignInSection() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    reset 
  } = useForm<SignInFormData>();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const onSubmit = async (data: SignInFormData) => {
    setMessage('');
    setLoading(true);

    try {
      const response = await apiClient.post(API_ENDPOINTS.LOGIN, {
        email: data.email,
        password: data.password,
      });

      const responseData = response.data;
      
      if (responseData.success) {
        setMessage('Login successful! Redirecting...');
        
        // Store tokens
        if (responseData.accessToken) {
          localStorage.setItem('accessToken', responseData.accessToken);
        }
        if (responseData.refreshToken) {
          localStorage.setItem('refreshToken', responseData.refreshToken);
        }
        
        login(data.email);
        reset();
        setTimeout(() => {
          scrollToSection('home');
        }, 1500);
      } else {
        setMessage(responseData.message);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      setMessage(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="signin" className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Sign In</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="signin-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="signin-email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              placeholder="Enter your email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="signin-password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="signin-password"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
              placeholder="Enter your password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-300 transform hover:scale-[1.02]"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        {message && (
          <p className={`mt-4 p-3 rounded-lg text-center text-sm ${
            message.includes('successful') 
              ? 'bg-green-100 text-green-800 border border-green-300' 
              : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            {message}
          </p>
        )}
        <p className="text-center mt-6 text-gray-600">
          Don't have an account?{' '}
          <button 
            onClick={() => scrollToSection('signup')}
            className="text-blue-600 hover:underline font-medium"
          >
            Sign Up
          </button>
        </p>
      </div>
    </section>
  );
}

export default SignInSection;
