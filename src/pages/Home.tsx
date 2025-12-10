import { useAuth } from '../context/AuthContext';

type HomeProps = {
  onOpenSignIn: () => void;
  onOpenSignUp: () => void;
};

function Home({ onOpenSignIn, onOpenSignUp }: HomeProps) {
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] text-center px-4">
      <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
        Welcome to Our Website
      </h1>
      {user ? (
        <div className="space-y-4">
          <p className="text-2xl text-white/90 mb-8">
            Welcome back, <span className="font-semibold">{user.email}</span>!
          </p>
          <p className="text-xl text-white/80">
            You are now logged in and can access all features.
          </p>
        </div>
      ) : (
        <>
          <p className="text-xl text-white/90 mb-8">
            Please sign in or sign up to continue
          </p>
          <div className="flex gap-4">
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
          </div>
        </>
      )}
    </div>
  );
}

export default Home;
