import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { queryClient } from './config/queryClient';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { TableSessionProvider } from './context/TableSessionContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { SettingsProvider } from './context/SettingsContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Header from './components/Header';
import AuthModal from './components/AuthModal';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import backgroundImage from './assets/background.png';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ResendVerification from './pages/ResendVerification';
import RequestPasswordReset from './pages/RequestPasswordReset';
import ResetPassword from './pages/ResetPassword';
import QRLanding from './pages/QRLanding';
import MenuCategoriesAdmin from './pages/MenuCategoriesAdmin';
// import MenuBulkOps from './pages/MenuBulkOps';
import MenuCustomer from './pages/MenuCustomer';
import MenuItemEditor from './pages/MenuItemEditor';
import MenuItemsManagement from './pages/MenuItemsManagement';
import StaffManagement from './pages/StaffManagement';
import TableManagement from './pages/TableManagement';
import TableEditor from './pages/TableEditor';
import MenuItemDetail from './pages/MenuItemDetail';
import CustomerProfile from './pages/CustomerProfile';
import Cart from './pages/Cart';
import OrderTracking from './pages/OrderTracking';
import Orders from './pages/Orders';
import WaiterOrders from './pages/WaiterOrders';
import SessionManagement from './pages/SessionManagement';
import KitchenDisplay from './pages/KitchenDisplay';
import CustomerBilling from './pages/CustomerBilling';
import WaiterBillManagement from './pages/WaiterBillManagement';
import RevenueAnalytics from './pages/RevenueAnalytics';
import GoogleAuthSuccess from './pages/GoogleAuthSuccess';
import GoogleAuthError from './pages/GoogleAuthError';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'signin' | 'signup'>('signin');

  const openSignIn = () => {
    setModalMode('signin');
    setIsModalOpen(true);
  };

  const openSignUp = () => {
    setModalMode('signup');
    setIsModalOpen(true);
  };

  const switchMode = () => {
    setModalMode(modalMode === 'signin' ? 'signup' : 'signin');
  };

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SettingsProvider>
          <AuthProvider>
            <WebSocketProvider>
              <TableSessionProvider>
                <CartProvider>
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                    },
                    success: {
                      duration: 3000,
                      iconTheme: {
                        primary: '#4ade80',
                        secondary: '#fff',
                      },
                    },
                    error: {
                      duration: 4000,
                      iconTheme: {
                        primary: '#ef4444',
                        secondary: '#fff',
                      },
                    },
                  }}
                />
                <Header onOpenSignIn={openSignIn} onOpenSignUp={openSignUp} />
              <Routes>
            <Route
              path="/"
              element={
                <div 
                  className="min-h-screen bg-cover bg-center bg-no-repeat"
                  style={{ backgroundImage: `url(${backgroundImage})` }}
                >
                  <Home onOpenSignIn={openSignIn} onOpenSignUp={openSignUp} />
                  <AuthModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    mode={modalMode}
                    onSwitchMode={switchMode}
                  />
                </div>
              }
            />
            <Route path="/register" element={<Register />} />
            <Route path="/verify" element={<VerifyEmail />} />
            <Route path="/resend-verification" element={<ResendVerification />} />
            <Route path="/request-password-reset" element={<RequestPasswordReset />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />
            <Route path="/auth/google/error" element={<GoogleAuthError />} />
            <Route path="/qr/:qr_token" element={<QRLanding />} />
            <Route path="/qr" element={<QRLanding />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requiredRoles={['admin', 'super_admin', 'waiter', 'kitchen']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/menu-categories"
              element={
                <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
                  <MenuCategoriesAdmin />
                </ProtectedRoute>
              }
            />
            {/* <Route
              path="/admin/menu-bulk-ops"
              element={
                <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
                  <MenuBulkOps />
                </ProtectedRoute>
              }
            /> */}
            <Route
              path="/admin/staff-management"
              element={
                <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
                  <StaffManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/menu-items"
              element={
                <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
                  <MenuItemsManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/menu-editor"
              element={
                <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
                  <MenuItemEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/tables"
              element={
                <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
                  <TableManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/table-editor"
              element={
                <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
                  <TableEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
                  <RevenueAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/menu/customer"
              element={<MenuCustomer />}
            />
            <Route
              path="/menu/item/:id"
              element={<MenuItemDetail />}
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <CustomerProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cart"
              element={<Cart />}
            />
            <Route
              path="/orders/:orderId"
              element={
                <ProtectedRoute>
                  <OrderTracking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/waiter/orders"
              element={
                <ProtectedRoute requiredRoles={['waiter', 'admin', 'super_admin']}>
                  <WaiterOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/waiter/sessions"
              element={
                <ProtectedRoute requiredRoles={['waiter', 'admin', 'super_admin']}>
                  <SessionManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kitchen/display"
              element={
                <ProtectedRoute requiredRoles={['kitchen', 'admin', 'super_admin']}>
                  <KitchenDisplay />
                </ProtectedRoute>
              }
            />
            <Route
              path="/billing"
              element={<CustomerBilling />}
            />
            <Route
              path="/waiter/bills"
              element={
                <ProtectedRoute requiredRoles={['waiter', 'admin', 'super_admin']}>
                  <WaiterBillManagement />
                </ProtectedRoute>
              }
            />
            <Route path="/menu" element={<MenuCustomer />} />
            <Route path="/menu/item/:id" element={<MenuItemDetail />} />
          </Routes>
              </CartProvider>
            </TableSessionProvider>
          </WebSocketProvider>
        </AuthProvider>
      </SettingsProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
