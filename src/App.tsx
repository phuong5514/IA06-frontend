import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './config/queryClient';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Header from './components/Header';
import AuthModal from './components/AuthModal';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import backgroundImage from './assets/background.png';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import RequestPasswordReset from './pages/RequestPasswordReset';
import ResetPassword from './pages/ResetPassword';
import QRLanding from './pages/QRLanding';
import MenuCategoriesAdmin from './pages/MenuCategoriesAdmin';
import MenuBulkOps from './pages/MenuBulkOps';
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
import KitchenDisplay from './pages/KitchenDisplay';

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
        <AuthProvider>
          <WebSocketProvider>
            <CartProvider>
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
            <Route path="/request-password-reset" element={<RequestPasswordReset />} />
            <Route path="/reset-password" element={<ResetPassword />} />
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
            <Route
              path="/admin/menu-bulk-ops"
              element={
                <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
                  <MenuBulkOps />
                </ProtectedRoute>
              }
            />
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
              path="/menu/customer"
              element={
                <ProtectedRoute>
                  <MenuCustomer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/menu/item/:id"
              element={
                <ProtectedRoute>
                  <MenuItemDetail />
                </ProtectedRoute>
              }
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
              element={
                <ProtectedRoute>
                  <Cart />
                </ProtectedRoute>
              }
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
              path="/kitchen/display"
              element={
                <ProtectedRoute requiredRoles={['kitchen', 'admin', 'super_admin']}>
                  <KitchenDisplay />
                </ProtectedRoute>
              }
            />
            <Route path="/menu" element={<MenuCustomer />} />
            <Route path="/menu/item/:id" element={<MenuItemDetail />} />
          </Routes>
          </CartProvider>
          </WebSocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
