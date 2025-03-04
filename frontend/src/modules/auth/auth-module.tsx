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
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!isLogin && !name.trim()) {
      errors.name = "Name is required";
    }
    
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Email format is invalid";
    }
    
    if (!password) {
      errors.password = "Password is required";
    } else if (!isLogin && password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate form
    if (!validateForm()) return;
    
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
      
      // Clear any previous validation errors
      setValidationErrors({});
      
      // Add fade-out animation before closing modal
      setTimeout(() => {
        setIsFadingOut(true);
      }, 1000);
      
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

  // Reset validation errors when switching between login and signup
  useEffect(() => {
    setValidationErrors({});
    setError(null);
  }, [isLogin]);

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
    <>
      {/* Full screen backdrop with stronger blur that affects all elements including navbar */}
      <div className="fixed inset-0 z-[9999] bg-dark-900/70 backdrop-blur-xl pointer-events-auto" />
      
      {/* Modal container */}
      <div className="fixed inset-0 z-[10000] flex items-center justify-center pointer-events-none">
        <div 
          className={`w-[480px] border border-dark-200 rounded-xl bg-dark-300/90 shadow-lg pointer-events-auto ${isFadingOut ? 'animate-fadeOut' : 'animate-fadeIn'}`}
          onClick={e => e.stopPropagation()}
        >
          <div className="relative overflow-clip rounded-t-xl bg-dark-300">
            <div className="absolute inset-0"></div>
            <div className="absolute h-full w-3/5 from-red-600/20 to-transparent bg-gradient-to-r" />

            <div className="relative h-14 flex items-center justify-between gap-x-4 px-0.5 py-0.5">
              <div className="flex grow items-center pl-3">
                <div className="size-8 flex items-center justify-center">
                  <div className="i-mdi:account-lock text-red-400 size-6" />
                </div>

                <div className="ml-2 text-sm font-medium leading-none tracking-wide uppercase op-80">
                  <span className="translate-y-px">{isLogin ? "Login to PiDash" : "Create an Account"}</span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-x-0.5 pr-0.5">
                <button
                  type="button"
                  className="size-10 flex items-center justify-center border border-transparent rounded-lg bg-transparent text-red-400 outline-none transition-all duration-200 active:(border-dark-200 bg-dark-400/50) hover:(bg-dark-100 rotate-12)"
                  onClick={onClose}
                >
                  <div className="i-mdi:close size-6" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-5 py-3 px-4 bg-red-500/10 border border-red-500/20 rounded-md text-sm text-red-400 animate-pulse">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-5 py-3 px-4 bg-green-500/10 border border-green-500/20 rounded-md text-sm text-green-400 flex items-center animate-fadeIn">
                <div className="i-mdi:check-circle mr-2 size-5" />
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <div className="mb-5">
                  <label className="block text-sm text-light-900/50 font-medium mb-1.5">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (validationErrors.name) {
                        setValidationErrors({...validationErrors, name: ''});
                      }
                    }}
                    placeholder="Your name"
                    className={`w-full h-10 px-3 border rounded-md bg-dark-400 text-sm transition-colors duration-200
                             focus:outline-none focus:border-red-500 ${validationErrors.name ? 'border-red-500' : 'border-dark-100'}`}
                    required={!isLogin}
                  />
                  {validationErrors.name && (
                    <div className="text-red-400 text-xs mt-1.5 ml-1 animate-fadeIn">{validationErrors.name}</div>
                  )}
                </div>
              )}
              
              <div className="mb-5">
                <label className="block text-sm text-light-900/50 font-medium mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (validationErrors.email) {
                      setValidationErrors({...validationErrors, email: ''});
                    }
                  }}
                  placeholder="your.email@example.com"
                  className={`w-full h-10 px-3 border rounded-md bg-dark-400 text-sm transition-colors duration-200
                           focus:outline-none focus:border-red-500 ${validationErrors.email ? 'border-red-500' : 'border-dark-100'}`}
                  required
                />
                {validationErrors.email && (
                  <div className="text-red-400 text-xs mt-1.5 ml-1 animate-fadeIn">{validationErrors.email}</div>
                )}
              </div>
              
              <div className="mb-6">
                <label className="block text-sm text-light-900/50 font-medium mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (validationErrors.password) {
                      setValidationErrors({...validationErrors, password: ''});
                    }
                  }}
                  placeholder={isLogin ? "Your password" : "Create a strong password"}
                  className={`w-full h-10 px-3 border rounded-md bg-dark-400 text-sm transition-colors duration-200
                           focus:outline-none focus:border-red-500 ${validationErrors.password ? 'border-red-500' : 'border-dark-100'}`}
                  required
                />
                {validationErrors.password && (
                  <div className="text-red-400 text-xs mt-1.5 ml-1 animate-fadeIn">{validationErrors.password}</div>
                )}
              </div>
              
              <div className="flex flex-col gap-4 animate-fadeIn animation-delay-200">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 px-5 bg-red-500 text-white rounded-md text-sm font-medium
                           transition-all duration-200 hover:bg-red-600 active:transform
                           active:scale-95 disabled:opacity-50 disabled:cursor-wait"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <div className="i-mdi:loading mr-2 animate-spin size-5" />
                      {isLogin ? 'Logging in...' : 'Creating account...'}
                    </span>
                  ) : isLogin ? 'Login' : 'Create Account'}
                </button>
                
                <div className="text-center text-sm py-2">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}
                  <a
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError(null);
                    }}
                    className="ml-2 text-red-400 hover:underline focus:outline-none cursor-pointer transition-colors duration-200"
                  >
                    {isLogin ? 'Sign up' : 'Login'}
                  </a>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
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

// Function to sign out the user
export function signOut() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.reload(); // Reload to apply auth state change
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

// Custom hook to get user information
export function useUser() {
  const [user, setUser] = useState<{id: string, name: string, email: string} | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }
  }, []);

  return { user, isAuthenticated: !!user };
}