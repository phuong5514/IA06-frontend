import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import AuthModal from './components/AuthModal';
import Home from './pages/Home';

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
    <AuthProvider>
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
    </AuthProvider>
    </AuthProvider>
  );
}

export default App;
