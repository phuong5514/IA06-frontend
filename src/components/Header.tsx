import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import logo from '../assets/logo.png';


type HeaderProps = {
  onOpenSignIn?: () => void;
  onOpenSignUp?: () => void;
  showAuthButtons?: boolean;
}


function Header({ onOpenSignIn, onOpenSignUp, showAuthButtons = true }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { getTotalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

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

  const goToProfile = () => {
    navigate('/profile');
    setIsMenuOpen(false);
  };

  const goToMenu = () => {
    navigate('/menu/customer');
    setIsMenuOpen(false);
  };

  const goToCart = () => {
    navigate('/cart');
    setIsMenuOpen(false);
  };

  const goToOrders = () => {
    navigate('/orders');
    setIsMenuOpen(false);
  };

  // Don't show header on dashboard pages (they have their own layout), home page, or for staff roles
  if (
    location.pathname.startsWith('/dashboard') || 
    location.pathname.startsWith('/admin/') || 
    location.pathname.startsWith('/waiter/') ||
    location.pathname.startsWith('/kitchen/') ||
    location.pathname === '/'
  ) {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-md z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16"
            >
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <img
              src={logo}
              alt="Smart Restaurant Logo"
              className="h-10 w-10 cursor-pointer"
              onClick={goToHome}
            />
            <h1
              onClick={goToHome}
              className="text-2xl font-bold text-indigo-600 cursor-pointer"
            >
              Smart Restaurant
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            <button
              onClick={goToMenu}
              className="px-4 py-2 text-gray-700 hover:text-indigo-600 font-medium transition"
            >
              Menu
            </button>
            {isAuthenticated && (
              <button
                onClick={goToCart}
                className="relative px-4 py-2 text-gray-700 hover:text-indigo-600 font-medium transition"
                title="View Cart"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {getTotalItems()}
                  </span>
                )}
              </button>
            )}
            {isAuthenticated && (
              <button
                onClick={goToOrders}
                className="px-4 py-2 text-gray-700 hover:text-indigo-600 font-medium transition"
              >
                My Orders
              </button>
            )}
            {!isAuthenticated && showAuthButtons ? (
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
            ) : isAuthenticated ? (
              <>
                <button
                  onClick={goToProfile}
                  className="px-4 py-2 text-gray-700 hover:text-indigo-600 font-medium transition"
                >
                  Welcome, {user?.email}
                </button>
                {(user?.role === 'admin' || user?.role === 'super_admin') && (
                  <button
                    onClick={goToDashboard}
                    className="px-4 py-2 text-gray-700 hover:text-indigo-600 font-medium transition"
                  >
                    Dashboard
                  </button>
                )}
                {(user?.role === 'waiter' || user?.role === 'admin' || user?.role === 'super_admin') && (
                  <button
                    onClick={() => { navigate('/waiter/orders'); setIsMenuOpen(false); }}
                    className="px-4 py-2 text-gray-700 hover:text-indigo-600 font-medium transition"
                  >
                    🍽️ Orders
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition"
                >
                  Sign Out
                </button>
              </>
            ) : null}
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
            <button
              onClick={goToMenu}
              className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition"
            >
              Menu
            </button>
            {isAuthenticated && (
              <button
                onClick={goToCart}
                className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition flex items-center justify-between"
              >
                <span>Cart</span>
                {getTotalItems() > 0 && (
                  <span className="bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {getTotalItems()}
                  </span>
                )}
              </button>
            )}
            {isAuthenticated && (
              <button
                onClick={goToOrders}
                className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition"
              >
                My Orders
              </button>
            )}
            {!isAuthenticated && showAuthButtons ? (
              <>
                <button
                  onClick={() => {
                    onOpenSignIn?.();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    onOpenSignUp?.();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition"
                >
                  Sign Up
                </button>
              </>
            ) : isAuthenticated ? (
              <>
                <button
                  onClick={goToMenu}
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition"
                >
                  Menu
                </button>
                <button
                  onClick={goToProfile}
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition"
                >
                  Profile
                </button>
                {(user?.role === 'admin' || user?.role === 'super_admin') && (
                  <button
                    onClick={goToDashboard}
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition"
                  >
                    Dashboard
                  </button>
                )}
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
            ) : null}
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
