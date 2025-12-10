import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type HeaderProps = {
  onOpenSignIn: () => void;
  onOpenSignUp: () => void;
}


function Header({ onOpenSignIn, onOpenSignUp }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      setIsMenuOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const goToDashboard = () => {
    navigate('/dashboard');
    setIsMenuOpen(false);
  };

  const goToHome = () => {
    navigate('/');
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-md z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 
              onClick={goToHome}
              className="text-2xl font-bold text-indigo-600 cursor-pointer"
            >
              MyApp
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            {!isAuthenticated ? (
              <>
                <button
                  onClick={onOpenSignIn}
                  className="px-4 py-2 text-gray-700 hover:text-indigo-600 font-medium transition"
                >
                  Sign In
                </button>
                <button
                  onClick={onOpenSignUp}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={goToDashboard}
                  className="px-4 py-2 text-gray-700 hover:text-indigo-600 font-medium transition"
                >
                  Dashboard
                </button>
                <span className="text-gray-700">Welcome, {user?.email}</span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition"
                >
                  Sign Out
                </button>
              </>
            )}
          </nav>

          {/* Mobile Burger Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-indigo-600 focus:outline-none"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 space-y-2">
            {!isAuthenticated ? (
              <>
                <button
                  onClick={() => {
                    onOpenSignIn();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    onOpenSignUp();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={goToDashboard}
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition"
                >
                  Dashboard
                </button>
                <div className="px-4 py-2 text-gray-600">
                  {user?.email}
                </div>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded transition"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
