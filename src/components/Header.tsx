import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { apiClient } from '../config/api';
import { useQuery } from '@tanstack/react-query';
import logo from '../assets/logo.png';


type HeaderProps = {
  onOpenSignIn?: () => void;
  onOpenSignUp?: () => void;
  showAuthButtons?: boolean;
}


function Header({ onOpenSignIn, onOpenSignUp, showAuthButtons = true }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasUnpaidOrders, setHasUnpaidOrders] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { getTotalItems } = useCart();
  const { branding } = useSettings();
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

  const goToBilling = () => {
    navigate('/billing')
    setIsMenuOpen(false);
  }

  // Fetch user profile data
  const { data: profileData } = useQuery({
    queryKey: ['user', 'profile'],
    queryFn: async () => {
      const response = await apiClient.get('/user/me');
      return response.data;
    },
    enabled: isAuthenticated,
  });

  // Fetch unpaid orders status
  useEffect(() => {
    const fetchUnpaidOrders = async () => {
      if (!isAuthenticated) {
        setHasUnpaidOrders(false);
        return;
      }
      
      try {
        const response = await apiClient.get('/payments/billing');
        const hasUnpaid = response.data.orders && response.data.orders.length > 0;
        setHasUnpaidOrders(hasUnpaid);
      } catch (error) {
        console.error('Error fetching billing info:', error);
        setHasUnpaidOrders(false);
      }
    };

    fetchUnpaidOrders();
    // Refresh every 30 seconds to keep it updated
    const interval = setInterval(fetchUnpaidOrders, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

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
              src={branding.logoUrl || logo}
              alt={`${branding.restaurantName} Logo`}
              className="h-10 w-10 cursor-pointer object-contain"
              onClick={goToHome}
              onError={(e) => {
                // Fallback to default logo if custom logo fails to load
                e.currentTarget.src = logo;
              }}
            />
            <h1
              onClick={goToHome}
              className="text-2xl font-bold cursor-pointer"
              style={{ color: branding.primaryColor }}
            >
              {branding.restaurantName}
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            <button
              onClick={goToMenu}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-primary font-medium transition"
              style={{ '--hover-color': branding.primaryColor } as React.CSSProperties}
              onMouseEnter={(e) => e.currentTarget.style.color = branding.primaryColor}
              onMouseLeave={(e) => e.currentTarget.style.color = ''}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>Menu</span>
            </button>
            {isAuthenticated && (
              <button
                onClick={goToCart}
                className="relative flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-indigo-600 font-medium transition"
                title="View Cart"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span>Cart</span>
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {getTotalItems()}
                  </span>
                )}
              </button>
            )}

            {isAuthenticated && (
              <button
                onClick={goToBilling}
                className="relative flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-indigo-600 font-medium transition"
                title="View Billing"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>Billing</span>
                {hasUnpaidOrders && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    !
                  </span>
                )}
              </button>  
            )}

            {isAuthenticated && (
              <button
                onClick={goToOrders}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-indigo-600 font-medium transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <span>My Orders</span>
              </button>
            )}
            {!isAuthenticated && showAuthButtons ? (
              <>
                <button
                  onClick={onOpenSignIn}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 font-medium transition"
                  onMouseEnter={(e) => e.currentTarget.style.color = branding.primaryColor}
                  onMouseLeave={(e) => e.currentTarget.style.color = ''}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign In</span>
                </button>
                <button
                  onClick={onOpenSignUp}
                  className="flex items-center gap-2 px-4 py-2 text-white rounded-lg font-medium transition"
                  style={{ backgroundColor: branding.primaryColor }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span>Sign Up</span>
                </button>
              </>
            ) : isAuthenticated ? (
              <>
                <button
                  onClick={goToProfile}
                  className="flex items-center gap-2 px-2 py-2 text-gray-700 hover:text-indigo-600 font-medium transition"
                  title="View Profile"
                >
                  {profileData?.user?.profile_image_url ? (
                    <img
                      src={profileData.user.profile_image_url}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover border-2 border-gray-300 hover:border-indigo-600 transition-colors"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold border-2 border-gray-300 hover:border-indigo-600 transition-colors">
                      {user?.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>
                {(user?.role === 'admin' || user?.role === 'super_admin') && (
                  <button
                    onClick={goToDashboard}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-indigo-600 font-medium transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>Dashboard</span>
                  </button>
                )}
                {(user?.role === 'waiter' || user?.role === 'admin' || user?.role === 'super_admin') && (
                  <button
                    onClick={() => { navigate('/waiter/orders'); setIsMenuOpen(false); }}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-indigo-600 font-medium transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Orders</span>
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign Out</span>
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
              className="flex items-center gap-2 w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>Menu</span>
            </button>
            {isAuthenticated && (
              <button
                onClick={goToCart}
                className="flex items-center justify-between w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Cart</span>
                </div>
                {getTotalItems() > 0 && (
                  <span className="bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {getTotalItems()}
                  </span>
                )}
              </button>
            )}
            {isAuthenticated && (
              <button
                onClick={goToBilling}
                className="flex items-center justify-between w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Billing</span>
                </div>
                {hasUnpaidOrders && (
                  <span className="bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    !
                  </span>
                )}
              </button>
            )}
            {isAuthenticated && (
              <button
                onClick={goToOrders}
                className="flex items-center gap-2 w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <span>My Orders</span>
              </button>
            )}
            {!isAuthenticated && showAuthButtons ? (
              <>
                <button
                  onClick={() => {
                    onOpenSignIn?.();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => {
                    onOpenSignUp?.();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span>Sign Up</span>
                </button>
              </>
            ) : isAuthenticated ? (
              <>
                <button
                  onClick={goToProfile}
                  className="flex items-center gap-3 w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition"
                >
                  {profileData?.user?.profile_image_url ? (
                    <img
                      src={profileData.user.profile_image_url}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover border-2 border-gray-300"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold border-2 border-gray-300">
                      {user?.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span>Profile</span>
                </button>
                {(user?.role === 'admin' || user?.role === 'super_admin') && (
                  <button
                    onClick={goToDashboard}
                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>Dashboard</span>
                  </button>
                )}
                <div className="flex items-center gap-2 px-4 py-2 text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{user?.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign Out</span>
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
