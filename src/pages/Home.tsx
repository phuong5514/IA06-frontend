import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
        Welcome to Our Website
      </h1>
      <p className="text-xl text-white/90 mb-8">
        Please sign in or sign up to continue
      </p>
      <div className="flex gap-4">
        <Link 
          to="/signin" 
          className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition duration-300 transform hover:scale-105"
        >
          Sign In
        </Link>
        <Link 
          to="/signup" 
          className="px-8 py-3 bg-gray-700 text-white font-semibold rounded-lg shadow-lg hover:bg-gray-800 transition duration-300 transform hover:scale-105"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}

export default Home;
