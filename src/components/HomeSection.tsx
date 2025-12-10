import { useAuth } from '../context/AuthContext';

function HomeSection() {
  const { user } = useAuth();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
        Welcome to Our Website
      </h1>
      {!user ? (
        <>
          <p className="text-xl text-white/90 mb-8">
            Please sign in or sign up to continue
          </p>
          <div className="flex gap-4">
            <button 
              onClick={() => scrollToSection('signin')}
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition duration-300 transform hover:scale-105"
            >
              Sign In
            </button>
            <button 
              onClick={() => scrollToSection('signup')}
              className="px-8 py-3 bg-gray-700 text-white font-semibold rounded-lg shadow-lg hover:bg-gray-800 transition duration-300 transform hover:scale-105"
            >
              Sign Up
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-xl text-white/90 mb-4">
            Welcome back, {user.email}!
          </p>
          <p className="text-lg text-white/80">
            You are successfully logged in.
          </p>
        </>
      )}
    </section>
  );
}

export default HomeSection;
