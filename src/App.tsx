import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './Login';
import Header from './components/Header';
import Home from './components/Home';
import CaptionStudio from './components/CaptionStudio';
import AIVoice from './components/AIVoice';
import VoiceGenLive from './components/VoiceGenLive';
import Translate from './components/Translate';
import ContentCreator from './components/ContentCreator';
import StoryCreator from './components/StoryCreator';
import SRTSub from './components/SRTSub';
import Recapper from './components/Recapper';
import Thumbnail from './components/Thumbnail';
import NovelTranslator from './components/NovelTranslator';
import VideoRecap from './components/VideoRecap';
import MasterEditor from './components/MasterEditor';
import SubGen from './components/SubGen';
import Transcribe from './components/Transcribe';
import NewsAutomation from './components/NewsAutomation';
import ViralShorts from './components/ViralShorts';
import WaterDropEffect from './components/WaterDropEffect';

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
    <ThemeProvider>
      <BrowserRouter>
    <div className="min-h-screen app-background text-white p-6 font-sans relative overflow-hidden">
      <div className="fixed inset-0 app-gradient pointer-events-none" />
      <WaterDropEffect />
      
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="mb-8">
            <Header
              isAuthenticated={isAuthenticated}
              user={user}
              points={points}
              onLoginClick={() => setShowAuthPanel(true)}
              onLogout={handleLogout}
            />
          </div>

          <Routes>
            <Route
              path="/"
              element={<Home isAuthenticated={isAuthenticated} user={user} onLoginClick={() => setShowAuthPanel(true)} />}
            />
            <Route
              path="/caption-studio"
              element={<CaptionStudio isAuthenticated={isAuthenticated} onLoginClick={() => setShowAuthPanel(true)} />}
            />
            <Route
              path="/ai-voice"
              element={<AIVoice isAuthenticated={isAuthenticated} onLoginClick={() => setShowAuthPanel(true)} />}
            />
            <Route
              path="/voice-gen-live"
              element={<VoiceGenLive isAuthenticated={isAuthenticated} onLoginClick={() => setShowAuthPanel(true)} />}
            />
            <Route
              path="/translate"
              element={<Translate isAuthenticated={isAuthenticated} onLoginClick={() => setShowAuthPanel(true)} />}
            />
            <Route
              path="/content-creator"
              element={<ContentCreator isAuthenticated={isAuthenticated} onLoginClick={() => setShowAuthPanel(true)} />}
            />
            <Route
              path="/story-creator"
              element={<StoryCreator isAuthenticated={isAuthenticated} onLoginClick={() => setShowAuthPanel(true)} />}
            />
            <Route
              path="/srt-sub"
              element={<SRTSub isAuthenticated={isAuthenticated} onLoginClick={() => setShowAuthPanel(true)} />}
            />
            <Route
              path="/recapper"
              element={<Recapper isAuthenticated={isAuthenticated} onLoginClick={() => setShowAuthPanel(true)} />}
            />
            <Route
              path="/thumbnail"
              element={<Thumbnail isAuthenticated={isAuthenticated} onLoginClick={() => setShowAuthPanel(true)} />}
            />
            <Route
              path="/novel-translator"
              element={<NovelTranslator isAuthenticated={isAuthenticated} onLoginClick={() => setShowAuthPanel(true)} />}
            />
            <Route
              path="/video-recap"
              element={<VideoRecap isAuthenticated={isAuthenticated} onLoginClick={() => setShowAuthPanel(true)} />}
            />
            <Route
              path="/master-editor"
              element={<MasterEditor isAuthenticated={isAuthenticated} onLoginClick={() => setShowAuthPanel(true)} />}
            />
            <Route
              path="/sub-gen"
              element={<SubGen isAuthenticated={isAuthenticated} onLoginClick={() => setShowAuthPanel(true)} />}
            />
            <Route
              path="/transcribe"
              element={<Transcribe isAuthenticated={isAuthenticated} onLoginClick={() => setShowAuthPanel(true)} />}
            />
            <Route
              path="/news-automation"
              element={<NewsAutomation isAuthenticated={isAuthenticated} onLoginClick={() => setShowAuthPanel(true)} />}
            />
            <Route
              path="/viral-shorts"
              element={<ViralShorts isAuthenticated={isAuthenticated} onLoginClick={() => setShowAuthPanel(true)} />}
            />
          </Routes>
            </div>
        {showAuthPanel && (
          <div className="fixed inset-0 z-40 flex items-center justify-center auth-overlay backdrop-blur-xl">
            <div className="max-w-md w-full px-4">
              <Login onAuthenticated={handleAuthenticated} hideAuthenticatedView />
                    </div>
                  </div>
                )}
              </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}
