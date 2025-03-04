import { useEffect, useState } from "react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const endpoint = isLogin ? '/api/users/login' : '/api/users';
      const payload = isLogin 
        ? { email, password } 
        : { name, email, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      // Store the token in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        id: data.id,
        name: data.name,
        email: data.email,
      }));

      setSuccess(isLogin ? 'Login successful!' : 'Account created successfully!');
      
      // Close modal after successful login/register
      setTimeout(() => {
        onClose();
        window.location.reload(); // Reload to apply auth state
      }, 1500);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/80 backdrop-blur-sm">
      <div 
        className="w-[400px] border border-dark-200 rounded-xl bg-dark-300/90 shadow-lg animate-fadeIn"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative overflow-clip rounded-t-xl bg-dark-300">
          <div className="absolute inset-0"></div>
          <div className="absolute h-full w-3/5 from-red-600/20 to-transparent bg-gradient-to-r" />

          <div className="relative h-11 flex items-center justify-between gap-x-4 px-0.5 py-0.5">
            <div className="flex grow items-center pl-2">
              <div className="size-7 flex items-center justify-center">
                <div className="i-mdi:account-lock text-red-400 size-5" />
              </div>

              <div className="ml-1 text-sm font-medium leading-none tracking-wide">
                {isLogin ? "Login to PiDash" : "Create an Account"}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-x-0.5 pr-0.5">
              <button
                type="button"
                className="size-8 flex items-center justify-center border border-transparent rounded-lg bg-transparent text-red-400 outline-none transition-all duration-200 active:(border-dark-200 bg-dark-400/50) hover:(bg-dark-100 rotate-12)"
                onClick={onClose}
              >
                <div className="i-mdi:close size-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-5">
          {error && (
            <div className="mb-4 py-2 px-3 bg-red-500/10 border border-red-500/20 rounded-md text-sm text-red-400">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 py-2 px-3 bg-green-500/10 border border-green-500/20 rounded-md text-sm text-green-400 flex items-center">
              <div className="i-mdi:check-circle mr-1.5 size-4" />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="mb-4">
                <label className="block mb-1 text-sm text-light-900/70">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-dark-500 border border-dark-100 rounded py-2 px-3
                           transition-colors duration-200 hover:border-red-500/30 focus:border-red-500
                           focus:outline-none"
                  required={!isLogin}
                />
              </div>
            )}
            
            <div className="mb-4">
              <label className="block mb-1 text-sm text-light-900/70">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full bg-dark-500 border border-dark-100 rounded py-2 px-3
                         transition-colors duration-200 hover:border-red-500/30 focus:border-red-500
                         focus:outline-none"
                required
              />
            </div>
            
            <div className="mb-5">
              <label className="block mb-1 text-sm text-light-900/70">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isLogin ? "Your password" : "Create a strong password"}
                className="w-full bg-dark-500 border border-dark-100 rounded py-2 px-3
                         transition-colors duration-200 hover:border-red-500/30 focus:border-red-500
                         focus:outline-none"
                required
              />
            </div>
            
            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 px-4 bg-red-500 text-white rounded font-medium
                         transition-all duration-200 hover:bg-red-600 active:transform
                         active:scale-95 disabled:opacity-50 disabled:cursor-wait"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <div className="i-mdi:loading mr-2 animate-spin size-4" />
                    {isLogin ? 'Logging in...' : 'Creating account...'}
                  </span>
                ) : isLogin ? 'Login' : 'Create Account'}
              </button>
              
              <div className="text-center text-sm">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button
                  type="button"
                  className="ml-2 text-red-400 hover:underline focus:outline-none"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError(null);
                  }}
                >
                  {isLogin ? 'Sign up' : 'Login'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function useAuthCheck() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  useEffect(() => {
    // Check for token in localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
      setIsAuthenticated(false);
      setShowAuthModal(true);
      return;
    }
    
    // Verify token with backend
    const verifyToken = async () => {
      try {
        const response = await fetch('/api/users/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          // Token invalid, clear localStorage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
          setShowAuthModal(true);
        }
      } catch (error) {
        console.error('Token verification error:', error);
        setIsAuthenticated(false);
      }
    };
    
    verifyToken();
  }, []);
  
  return { 
    isAuthenticated,
    showAuthModal,
    setShowAuthModal
  };
}

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { showAuthModal, setShowAuthModal } = useAuthCheck();
  
  return (
    <>
      {children}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
}