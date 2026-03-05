import React, { useState } from 'react';
import { LogIn, Key, Mail, User, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AuthResponse {
  token: string;
  email: string;
  name: string;
  profilePictureUrl?: string;
  message: string;
}

interface LoginProps {
  onAuthenticated?: () => void;
  hideAuthenticatedView?: boolean;
}

export default function Login({ onAuthenticated, hideAuthenticatedView }: LoginProps) {
  const [loginMethod, setLoginMethod] = useState<'google' | 'code'>('google');
  const [loginCode, setLoginCode] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthResponse | null>(null);

  const API_BASE_URL = 'http://localhost:8080/api/auth';

  const hashLoginCode = async (code: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return btoa(String.fromCharCode(...hashArray));
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_BASE_URL}/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken: 'mock-token',
          email: 'user@example.com',
          name: 'User Name',
          picture: 'https://via.placeholder.com/150',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Google login failed');
      }

      const data: AuthResponse = await response.json();
      setUser(data);
      setIsAuthenticated(true);
      setSuccess('Login successful!');
      
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      if (onAuthenticated) {
        onAuthenticated();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login with Google. Please set up Google OAuth properly.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeLogin = async () => {
    if (!loginCode) {
      setError('Please enter your login code');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const encrypted = await hashLoginCode(loginCode);

      const response = await fetch(`${API_BASE_URL}/code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loginCode: loginCode,
          loginCodeEncrypted: encrypted,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Code login failed');
      }

      const data: AuthResponse = await response.json();
      setUser(data);
      setIsAuthenticated(true);
      setSuccess('Login successful!');
      
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      if (onAuthenticated) {
        onAuthenticated();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login with code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !name || !loginCode) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_BASE_URL}/register?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&loginCode=${encodeURIComponent(loginCode)}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      const data: AuthResponse = await response.json();
      setUser(data);
      setIsAuthenticated(true);
      setSuccess('Registration successful!');
      
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      if (onAuthenticated) {
        onAuthenticated();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to register');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    setLoginCode('');
    setEmail('');
    setName('');
    setError(null);
    setSuccess(null);
  };

  React.useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
        if (onAuthenticated) {
          onAuthenticated();
        }
      } catch (e) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    }
  }, [onAuthenticated]);

  if (isAuthenticated && user && !hideAuthenticatedView) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 relative overflow-hidden">
        <div className="fixed inset-0 bg-gradient-to-br from-purple-950/20 via-black to-indigo-950/20 pointer-events-none" />
        
        <div className="backdrop-blur-3xl bg-white/10 rounded-[2.5rem] p-8 border border-white/20 shadow-2xl max-w-md w-full relative z-10">
          <div className="text-center space-y-6">
            <div className="p-4 bg-white/12 backdrop-blur-2xl rounded-full border border-white/25 shadow-xl w-20 h-20 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white mb-2">Welcome back!</h2>
              <p className="text-white/70">{user.name || user.email}</p>
            </div>
            {user.profilePictureUrl && (
              <img 
                src={user.profilePictureUrl} 
                alt="Profile" 
                className="w-24 h-24 rounded-full mx-auto border-2 border-white/20"
              />
            )}
            <button
              onClick={handleLogout}
              className="w-full px-6 py-3 bg-white/12 backdrop-blur-2xl text-white font-medium rounded-full hover:bg-white/18 hover:scale-105 border border-white/25 transition-all duration-300 shadow-xl"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 relative overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-br from-purple-950/20 via-black to-indigo-950/20 pointer-events-none" />
      
      <div className="fixed top-20 left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-pulse delay-1000" />
      
      <div className="backdrop-blur-3xl bg-white/10 rounded-[2.5rem] p-8 border border-white/20 shadow-2xl max-w-md w-full relative z-10"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
        }}>
        
        <div className="text-center mb-8">
          <div className="p-4 bg-white/12 backdrop-blur-2xl rounded-full border border-white/25 shadow-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <LogIn className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome</h1>
          <p className="text-white/60">Choose your login method</p>
        </div>

        <div className="flex gap-2 mb-6 p-1 bg-white/8 backdrop-blur-xl rounded-full border border-white/15">
          <button
            onClick={() => {
              setLoginMethod('google');
              setError(null);
            }}
            className={`flex-1 py-2.5 px-4 rounded-full font-medium transition-all duration-300 ${
              loginMethod === 'google'
                ? 'bg-white/20 text-white shadow-lg'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            Google
          </button>
          <button
            onClick={() => {
              setLoginMethod('code');
              setError(null);
            }}
            className={`flex-1 py-2.5 px-4 rounded-full font-medium transition-all duration-300 ${
              loginMethod === 'code'
                ? 'bg-white/20 text-white shadow-lg'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            Code
          </button>
        </div>

        {error && (
          <div className="mb-4 backdrop-blur-3xl bg-red-500/15 border border-red-400/40 text-red-200 p-4 rounded-full flex items-start space-x-3 shadow-2xl shadow-red-500/30 animate-in slide-in-from-top-2 duration-300">
            <div className="p-1.5 bg-red-500/20 rounded-full backdrop-blur-md border border-red-400/30 shrink-0">
              <AlertCircle className="w-4 h-4 text-red-300" />
            </div>
            <p className="text-sm flex-1">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 backdrop-blur-3xl bg-green-500/15 border border-green-400/40 text-green-200 p-4 rounded-full flex items-start space-x-3 shadow-2xl shadow-green-500/30 animate-in slide-in-from-top-2 duration-300">
            <div className="p-1.5 bg-green-500/20 rounded-full backdrop-blur-md border border-green-400/30 shrink-0">
              <CheckCircle2 className="w-4 h-4 text-green-300" />
            </div>
            <p className="text-sm flex-1">{success}</p>
          </div>
        )}

        {loginMethod === 'google' && (
          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full px-6 py-4 bg-white/12 backdrop-blur-2xl text-white font-medium rounded-full hover:bg-white/18 hover:scale-105 border border-white/25 transition-all duration-300 shadow-xl hover:shadow-2xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-3"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.08) 100%)'
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>
            <p className="text-xs text-center text-white/50">
              Sign in with your Google account
            </p>
          </div>
        )}

        {loginMethod === 'code' && (
          <div className="space-y-4">
            {!isRegistering ? (
              <>
                <div className="space-y-3">
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 rounded-full backdrop-blur-md border border-white/20">
                      <Key className="w-4 h-4 text-purple-400" />
                    </div>
                    <input
                      type="text"
                      value={loginCode}
                      onChange={(e) => setLoginCode(e.target.value)}
                      placeholder="Enter your login code"
                      className="w-full pl-14 pr-4 py-3.5 bg-white/8 backdrop-blur-xl border border-white/15 rounded-full text-white placeholder-white/50 focus:outline-none focus:border-purple-400/50 focus:bg-white/12 transition-all duration-300"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.05) 100%)'
                      }}
                    />
                  </div>
                </div>
                <button
                  onClick={handleCodeLogin}
                  disabled={isLoading || !loginCode}
                  className="w-full px-6 py-4 bg-gradient-to-r from-purple-500/90 to-purple-600/90 backdrop-blur-2xl text-white font-medium rounded-full hover:from-purple-600 hover:to-purple-700 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 flex items-center justify-center space-x-2 shadow-xl shadow-purple-500/40 border border-purple-400/40 active:scale-95"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      <span>Login with Code</span>
                    </>
                  )}
                </button>
                <p className="text-xs text-center text-white/50">
                  Don't have an account?{' '}
                  <button
                    onClick={() => setIsRegistering(true)}
                    className="text-purple-400 hover:text-purple-300 underline"
                  >
                    Register here
                  </button>
                </p>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 rounded-full backdrop-blur-md border border-white/20">
                      <Mail className="w-4 h-4 text-purple-400" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      className="w-full pl-14 pr-4 py-3.5 bg-white/8 backdrop-blur-xl border border-white/15 rounded-full text-white placeholder-white/50 focus:outline-none focus:border-purple-400/50 focus:bg-white/12 transition-all duration-300"
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 rounded-full backdrop-blur-md border border-white/20">
                      <User className="w-4 h-4 text-purple-400" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Name"
                      className="w-full pl-14 pr-4 py-3.5 bg-white/8 backdrop-blur-xl border border-white/15 rounded-full text-white placeholder-white/50 focus:outline-none focus:border-purple-400/50 focus:bg-white/12 transition-all duration-300"
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 rounded-full backdrop-blur-md border border-white/20">
                      <Key className="w-4 h-4 text-purple-400" />
                    </div>
                    <input
                      type="text"
                      value={loginCode}
                      onChange={(e) => setLoginCode(e.target.value)}
                      placeholder="Create a login code"
                      className="w-full pl-14 pr-4 py-3.5 bg-white/8 backdrop-blur-xl border border-white/15 rounded-full text-white placeholder-white/50 focus:outline-none focus:border-purple-400/50 focus:bg-white/12 transition-all duration-300"
                    />
                  </div>
                </div>
                <button
                  onClick={handleRegister}
                  disabled={isLoading || !email || !name || !loginCode}
                  className="w-full px-6 py-4 bg-gradient-to-r from-purple-500/90 to-purple-600/90 backdrop-blur-2xl text-white font-medium rounded-full hover:from-purple-600 hover:to-purple-700 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 flex items-center justify-center space-x-2 shadow-xl shadow-purple-500/40 border border-purple-400/40 active:scale-95"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Registering...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Register</span>
                    </>
                  )}
                </button>
                <p className="text-xs text-center text-white/50">
                  Already have an account?{' '}
                  <button
                    onClick={() => setIsRegistering(false)}
                    className="text-purple-400 hover:text-purple-300 underline"
                  >
                    Login here
                  </button>
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
