import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Header from './components/Header';
import Home from './components/Home';
import CaptionStudio from './components/CaptionStudio';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('authToken');
  });
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
  const [points] = useState<number>(120);
  const [showAuthPanel, setShowAuthPanel] = useState(false);

  useEffect(() => {
    const syncFromStorage = () => {
      const token = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('user');
      setIsAuthenticated(Boolean(token));
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed && typeof parsed === 'object') {
            setUser({ name: (parsed as any).name, email: (parsed as any).email });
          } else {
            setUser(null);
          }
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };
    syncFromStorage();
    window.addEventListener('storage', syncFromStorage);
    return () => window.removeEventListener('storage', syncFromStorage);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  const handleAuthenticated = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed && typeof parsed === 'object') {
          setUser({ name: (parsed as any).name, email: (parsed as any).email });
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    }
    setIsAuthenticated(true);
    setShowAuthPanel(false);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-black text-white p-6 font-sans relative overflow-hidden">
        <div className="fixed inset-0 bg-gradient-to-br from-purple-950/20 via-black to-indigo-950/20 pointer-events-none" />
        
        <div className="max-w-6xl mx-auto space-y-8 relative z-10">
          <Header
            isAuthenticated={isAuthenticated}
            user={user}
            points={points}
            onLoginClick={() => setShowAuthPanel(true)}
            onLogout={handleLogout}
          />

          <Routes>
            <Route
              path="/"
              element={<Home isAuthenticated={isAuthenticated} user={user} onLoginClick={() => setShowAuthPanel(true)} />}
            />
            <Route
              path="/caption-studio"
              element={<CaptionStudio isAuthenticated={isAuthenticated} onLoginClick={() => setShowAuthPanel(true)} />}
            />
          </Routes>
        </div>

        {showAuthPanel && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-xl">
            <div className="max-w-md w-full px-4">
              <Login onAuthenticated={handleAuthenticated} hideAuthenticatedView />
            </div>
          </div>
        )}
      </div>
    </BrowserRouter>
  );
}
