import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './config/queryClient';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Header from './components/Header';
import AuthModal from './components/AuthModal';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import RequestPasswordReset from './pages/RequestPasswordReset';
import ResetPassword from './pages/ResetPassword';
import QRLanding from './pages/QRLanding';
import MenuCategoriesAdmin from './pages/MenuCategoriesAdmin';
import MenuBulkOps from './pages/MenuBulkOps';
import MenuCustomer from './pages/MenuCustomer';
import MenuItemEditor from './pages/MenuItemEditor';
import StaffManagement from './pages/StaffManagement';

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
          <Routes>
            <Route
              path="/"
              element={
                <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
                  <Header onOpenSignIn={openSignIn} onOpenSignUp={openSignUp} />
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
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/menu-categories"
              element={
                <ProtectedRoute>
                  <MenuCategoriesAdmin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/menu-bulk-ops"
              element={
                <ProtectedRoute>
                  <MenuBulkOps />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/staff-management"
              element={
                <ProtectedRoute>
                  <StaffManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/menu-editor"
              element={
                <ProtectedRoute>
                  <MenuItemEditor />
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
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
