import { useState, useRef, useEffect } from 'react';
import { Radio, Square, Loader2, Volume2, AlertCircle, Zap, HelpCircle } from 'lucide-react';
import HelpDialog from './HelpDialog';

interface VoiceGenLiveProps {
  isAuthenticated: boolean;
  onLoginClick: () => void;
}

type VoiceStyle = 'Woman' | 'Man' | 'Boy' | 'Girl';

export default function VoiceGenLive({ isAuthenticated, onLoginClick }: VoiceGenLiveProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [voiceStyle, setVoiceStyle] = useState<VoiceStyle>('Woman');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamedText, setStreamedText] = useState<string[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const streamIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleStartStream = async () => {
    if (!currentText.trim()) {
      setError('Please enter text to stream');
      return;
    }

    setIsStreaming(true);
    setIsGenerating(true);
    setError(null);
    setStreamedText([]);

    const sentences = currentText.split(/[.!?]+/).filter(s => s.trim());

    try {
      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i].trim();
        if (!sentence) continue;

        setStreamedText(prev => [...prev, sentence]);

        const response = await fetch('http://localhost:8080/api/voice-gen-live/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: sentence,
            voice: voiceStyle,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate voice stream');
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        if (audioRef.current) {
          const audio = new Audio(url);
          await new Promise((resolve) => {
            audio.onended = () => {
              URL.revokeObjectURL(url);
              resolve(null);
            };
            audio.play();
          });
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setIsGenerating(false);
    } catch (err: any) {
      setError(err.message || 'Failed to stream voice');
      setIsStreaming(false);
      setIsGenerating(false);
    }
  };

  const handleStop = () => {
    setIsStreaming(false);
    setIsGenerating(false);
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  useEffect(() => {
    return () => {
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
    };
  }, []);

  if (!isAuthenticated) {
    return (
      <section className="mt-6 rounded-[2.5rem] border border-white/15 bg-white/6 backdrop-blur-3xl p-10 flex flex-col items-center justify-center text-center space-y-4 shadow-2xl">
        <div className="p-4 rounded-full bg-white/10 border border-white/20 mb-2">
          <Radio className="w-8 h-8 text-purple-300" />
        </div>
        <h2 className="text-2xl font-semibold">Sign in to unlock Voice Gen Live</h2>
        <p className="text-sm md:text-base text-white/65 max-w-md">
          Login or create an account to generate real-time voice narration with instant playback.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <button
            onClick={onLoginClick}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-500/90 to-purple-600/90 text-sm font-medium shadow-lg shadow-purple-500/40 border border-purple-400/60 hover:from-purple-600 hover:to-purple-700 transition-all"
          >
            Login
          </button>
          <button
            onClick={onLoginClick}
            className="px-6 py-3 rounded-full bg-white/10 border border-white/20 text-sm font-medium hover:bg-white/16 transition-all"
          >
            Sign up
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[2.5rem] border border-white/15 bg-white/6 backdrop-blur-3xl p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-2xl">
            <Radio className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-white">Voice Gen Live</h1>
              <button
                onClick={() => setShowHelp(true)}
                className="p-1.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg hover:bg-white/15 transition-all duration-300"
              >
                <HelpCircle className="w-4 h-4 text-white/60" />
              </button>
            </div>
            <p className="text-sm text-white/60">Real-time voice generation with instant playback</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
              Text to Stream
            </label>
            <textarea
              value={currentText}
              onChange={(e) => setCurrentText(e.target.value)}
              placeholder="Enter text to stream...&#10;&#10;Example: Welcome to our live stream. Today we will discuss AI tools. Let's get started!"
              className="w-full px-4 py-4 bg-white/8 backdrop-blur-xl border border-white/15 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:border-purple-400/50 focus:bg-white/12 transition-all duration-300 min-h-[150px] resize-y"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.05) 100%)'
              }}
              disabled={isStreaming}
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
              Voice Style
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(['Woman', 'Man', 'Boy', 'Girl'] as VoiceStyle[]).map((style) => (
                <button
                  key={style}
                  onClick={() => setVoiceStyle(style)}
                  disabled={isStreaming}
                  className={`px-4 py-3 rounded-xl border backdrop-blur-xl transition-all duration-200 ${
                    voiceStyle === style
                      ? 'bg-white/15 border-purple-400/50 text-white shadow-lg'
                      : 'bg-white/6 border-white/15 text-white/70 hover:bg-white/10'
                  } ${isStreaming ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={voiceStyle === style ? {
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(147,51,234,0.1) 100%)'
                  } : {}}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    <span className="text-sm font-medium">{style}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="backdrop-blur-3xl bg-red-500/15 border border-red-400/40 text-red-200 p-4 rounded-full flex items-start space-x-3 shadow-2xl shadow-red-500/30">
              <div className="p-1.5 bg-red-500/20 rounded-full backdrop-blur-md border border-red-400/30 shrink-0">
                <AlertCircle className="w-4 h-4 text-red-300" />
              </div>
              <p className="text-sm flex-1">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            {!isStreaming ? (
              <button
                onClick={handleStartStream}
                disabled={isGenerating || !currentText.trim()}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-500/90 to-purple-600/90 backdrop-blur-2xl text-white font-medium rounded-full hover:from-purple-600 hover:to-purple-700 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 flex items-center justify-center space-x-2 shadow-xl shadow-purple-500/40 border border-purple-400/40"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Starting stream...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    <span>Start Live Stream</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-red-500/90 to-red-600/90 backdrop-blur-2xl text-white font-medium rounded-full hover:from-red-600 hover:to-red-700 hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2 shadow-xl shadow-red-500/40 border border-red-400/40"
              >
                <Square className="w-5 h-5" />
                <span>Stop Stream</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {isStreaming && streamedText.length > 0 && (
        <div className="rounded-[2.5rem] border border-white/15 bg-white/6 backdrop-blur-3xl p-6 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Live Stream Active
          </h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {streamedText.map((text, index) => (
              <div
                key={index}
                className="p-3 rounded-xl bg-white/8 border border-white/15 backdrop-blur-xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.05) 100%)'
                }}
              >
                <p className="text-sm text-white/90">{text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <audio ref={audioRef} className="hidden" />

      <HelpDialog
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        title="How to Use Voice Gen Live"
        content={
          <>
            <p><strong>Step 1: Enter Text</strong></p>
            <p>Type the text you want to convert to voice in the input field.</p>
            
            <p><strong>Step 2: Select Voice Style</strong></p>
            <p>Choose from Woman, Man, Boy, or Girl voice styles.</p>
            
            <p><strong>Step 3: Start Streaming</strong></p>
            <p>Click "Start Stream" to begin real-time voice generation. The audio will play as it's generated with smart pausing.</p>
            
            <p><strong>Step 4: Control Playback</strong></p>
            <p>Use the Stop button to end the stream. The system automatically pauses at natural break points for better listening experience.</p>
          </>
        }
      />
    </div>
  );
}
