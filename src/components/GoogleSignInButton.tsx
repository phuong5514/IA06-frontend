import { FcGoogle } from 'react-icons/fc';

interface GoogleSignInButtonProps {
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export default function GoogleSignInButton({ 
  onClick, 
  className = '', 
  disabled = false 
}: GoogleSignInButtonProps) {
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  
  const handleGoogleSignIn = () => {
    if (onClick) {
      onClick();
    } else {
      // Redirect to backend Google OAuth endpoint
      window.location.href = `${API_BASE_URL}/auth/google`;
    }
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      disabled={disabled}
      className={`
        w-full flex items-center justify-center gap-3 px-4 py-3
        border border-gray-300 rounded-lg
        bg-white hover:bg-gray-50
        disabled:bg-gray-100 disabled:cursor-not-allowed
        transition-all duration-200
        font-medium text-gray-700
        shadow-sm hover:shadow-md
        ${className}
      `}
      type="button"
    >
      <FcGoogle className="w-5 h-5" />
      <span>Continue with Google</span>
    </button>
  );
}
