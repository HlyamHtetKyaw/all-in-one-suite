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

<<<<<<< HEAD
  const handleUpload = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('video', file);

    try {
      // Assuming Spring Boot is running on localhost:8080
      const response = await fetch('http://localhost:8080/api/v1/captions/generate-viral', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${response.status}`);
      }

      const data: CaptionResponse = await response.json();
      setCaptions(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to upload and process video. Make sure the backend is running on port 8080.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Find the current chunk for rendering the subtitle
  const currentChunk = captions?.chunks.find(
    (chunk) => currentTime >= chunk.start && currentTime <= chunk.end + 0.5 // +0.5s padding to keep it on screen slightly longer
  );

=======
>>>>>>> a3754b72c63045b43456e73d64e2b210a7fc3c6a
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
          </Routes>
            </div>

<<<<<<< HEAD
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Video Player */}
            {videoUrl && (
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-[9/16] max-h-[600px] mx-auto w-full max-w-sm shadow-2xl ring-1 ring-white/10">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  className="w-full h-full object-contain"
                  onTimeUpdate={handleTimeUpdate}
                />
                
                {/* PRECISE VIRAL CAPTION OVERLAY */}
                {currentChunk && (
                  <div className="absolute inset-x-0 bottom-24 flex justify-center items-center pointer-events-none p-4">
                    <div className="text-center drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">
                      <p 
                        className="font-black text-4xl text-white leading-tight tracking-tight flex flex-wrap justify-center gap-2" 
                        style={{ textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000' }}
                      >
                        {currentChunk.words.map((wordObj, i) => {
                          // Precise check for highlighting based exactly on the word's timestamps
                          const isCurrentWord = currentTime >= wordObj.start && currentTime <= wordObj.end;
                          
                          return (
                            <span 
                              key={i} 
                              className={`transition-all duration-150 ease-out ${
                                isCurrentWord 
                                  ? 'text-yellow-400 scale-110 translate-y-[-2px]' 
                                  : 'text-white scale-100'
                              }`}
                            >
                              {wordObj.word}
                            </span>
                          );
                        })}
                      </p>
=======
        {showAuthPanel && (
          <div className="fixed inset-0 z-40 flex items-center justify-center auth-overlay backdrop-blur-xl">
            <div className="max-w-md w-full px-4">
              <Login onAuthenticated={handleAuthenticated} hideAuthenticatedView />
>>>>>>> a3754b72c63045b43456e73d64e2b210a7fc3c6a
                    </div>
                  </div>
                )}
              </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}
