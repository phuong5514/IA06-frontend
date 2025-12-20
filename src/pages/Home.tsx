import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { User } from '../context/AuthContext';

type HomeProps = {
  onOpenSignIn: () => void;
  onOpenSignUp: () => void;
};

function Home({ onOpenSignIn, onOpenSignUp }: HomeProps) {
  const { user } = useAuth() as { user: User | null };
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] text-center px-4">
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
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="text-xl font-bold mb-2">Digital Menu</h3>
              <p className="text-sm text-white/80">Browse our full menu online with detailed descriptions</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <h3 className="text-xl font-bold mb-2">Easy Ordering</h3>
              <p className="text-sm text-white/80">Quick and simple ordering process for guests</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
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
