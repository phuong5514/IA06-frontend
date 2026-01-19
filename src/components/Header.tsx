import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { apiClient } from '../config/api';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, ShoppingCart, Receipt, ClipboardList, LogIn, UserPlus, LayoutDashboard, Clock, LogOut, Mail, Menu, X } from 'lucide-react';
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
              <BookOpen className="w-5 h-5" />
              <span>Menu</span>
            </button>
            
            {/* Cart - available for both authenticated and guest users */}
            <button
              onClick={goToCart}
              className="relative flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-indigo-600 font-medium transition"
              title="View Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Cart</span>
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </button>

            {/* Billing - only for authenticated users */}
            {isAuthenticated && (
              <button
                onClick={goToBilling}
                className="relative flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-indigo-600 font-medium transition"
                title="View Billing"
              >
                <Receipt className="w-5 h-5" />
                <span>Billing</span>
                {hasUnpaidOrders && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    !
                  </span>
                )}
              </button>  
            )}

            {/* My Orders - only for authenticated users */}
            {isAuthenticated && (
              <button
                onClick={goToOrders}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-indigo-600 font-medium transition"
              >
                <ClipboardList className="w-5 h-5" />
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
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={onOpenSignUp}
                  className="flex items-center gap-2 px-4 py-2 text-white rounded-lg font-medium transition"
                  style={{ backgroundColor: branding.primaryColor }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <UserPlus className="w-5 h-5" />
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
                    <LayoutDashboard className="w-5 h-5" />
                    <span>Dashboard</span>
                  </button>
                )}
                {(user?.role === 'waiter' || user?.role === 'admin' || user?.role === 'super_admin') && (
                  <button
                    onClick={() => { navigate('/waiter/orders'); setIsMenuOpen(false); }}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-indigo-600 font-medium transition"
                  >
                    <Clock className="w-5 h-5" />
                    <span>Orders</span>
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition"
                >
                  <LogOut className="w-5 h-5" />
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
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 space-y-2">
            <button
              onClick={goToMenu}
              className="flex items-center gap-2 w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition"
            >
              <BookOpen className="w-5 h-5" />
              <span>Menu</span>
            </button>
            
            {/* Cart - available for both authenticated and guest users */}
            <button
              onClick={goToCart}
              className="flex items-center justify-between w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition"
            >
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                <span>Cart</span>
              </div>
              {getTotalItems() > 0 && (
                <span className="bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </button>
            
            {/* Billing - only for authenticated users */}
            {isAuthenticated && (
              <button
                onClick={goToBilling}
                className="flex items-center justify-between w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition"
              >
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  <span>Billing</span>
                </div>
                {hasUnpaidOrders && (
                  <span className="bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    !
                  </span>
                )}
              </button>
            )}
            
            {/* My Orders - only for authenticated users */}
            {isAuthenticated && (
              <button
                onClick={goToOrders}
                className="flex items-center gap-2 w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition"
              >
                <ClipboardList className="w-5 h-5" />
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
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => {
                    onOpenSignUp?.();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition"
                >
                  <UserPlus className="w-5 h-5" />
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
                    <LayoutDashboard className="w-5 h-5" />
                    <span>Dashboard</span>
                  </button>
                )}
                <div className="flex items-center gap-2 px-4 py-2 text-gray-600">
                  <Mail className="w-5 h-5" />
                  <span>{user?.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded transition"
                >
                  <LogOut className="w-5 h-5" />
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
