import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { User } from '../context/AuthContext';
import { BookOpen, ClipboardList, Settings } from 'lucide-react';

type HomeProps = {
  onOpenSignIn: () => void;
  onOpenSignUp: () => void;
};

function Home({ onOpenSignIn, onOpenSignUp }: HomeProps) {
  const { user } = useAuth() as { user: User | null };
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] pt-16 text-center px-4">
      <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
        Welcome to Smart Restaurant
      </h1>
      {user ? (
        <div className="space-y-4">
          <p className="text-2xl text-white/90 mb-8">
            Welcome back, <span className="font-semibold">{user.email}</span>!
          </p>
          <p className="text-xl text-white/80 mb-6">
            You are now logged in and can access all features.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-8 py-3 bg-white text-indigo-600 font-semibold rounded-lg shadow-lg hover:bg-gray-100 transition duration-300 transform hover:scale-105"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate('/menu')}
              className="px-8 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-lg hover:bg-purple-700 transition duration-300 transform hover:scale-105"
            >
              View Menu
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-xl text-white/90 mb-8">
            Discover delicious dishes and manage your restaurant with ease
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <button
              onClick={onOpenSignIn}
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition duration-300 transform hover:scale-105"
            >
              Sign In
            </button>
            <button
              onClick={onOpenSignUp}
              className="px-8 py-3 bg-gray-700 text-white font-semibold rounded-lg shadow-lg hover:bg-gray-800 transition duration-300 transform hover:scale-105"
            >
              Sign Up
            </button>
            <button
              onClick={() => navigate('/menu')}
              className="px-8 py-3 bg-white text-indigo-600 font-semibold rounded-lg shadow-lg hover:bg-gray-100 transition duration-300 transform hover:scale-105"
            >
              Browse Menu
            </button>
            {user && ((user as User).role === 'admin' || (user as User).role === 'super_admin') && (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-8 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-lg hover:bg-purple-700 transition duration-300 transform hover:scale-105"
              >
                Admin Panel
              </button>
            )}
          </div>
          
          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-5xl">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
              <BookOpen className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Digital Menu</h3>
              <p className="text-sm text-white/80">Browse our full menu online with detailed descriptions</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
              <ClipboardList className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Easy Ordering</h3>
              <p className="text-sm text-white/80">Quick and simple ordering process for guests</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
              <Settings className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Admin Dashboard</h3>
              <p className="text-sm text-white/80">Powerful tools for restaurant management</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Home;
