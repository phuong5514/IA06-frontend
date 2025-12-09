import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import HomeSection from './components/HomeSection';
import SignInSection from './components/SignInSection';
import SignUpSection from './components/SignUpSection';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen">
        <Header />
        <main>
          <HomeSection />
          <SignInSection />
          <SignUpSection />
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;
