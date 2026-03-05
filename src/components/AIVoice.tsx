import { useState, useRef, useEffect } from 'react';
import { Mic, Play, Pause, Download, Loader2, Volume2, FileText, AlertCircle, HelpCircle } from 'lucide-react';
import HelpDialog from './HelpDialog';

interface AIVoiceProps {
  isAuthenticated: boolean;
  onLoginClick: () => void;
}

type VoiceStyle = 'Woman' | 'Man' | 'Boy' | 'Girl';

export default function AIVoice({ isAuthenticated, onLoginClick }: AIVoiceProps) {
  const [script, setScript] = useState('');
  const [voiceStyle, setVoiceStyle] = useState<VoiceStyle>('Woman');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.addEventListener('timeupdate', updateProgress);
    return () => audio.removeEventListener('timeupdate', updateProgress);
  }, [audioUrl]);

  const handleGenerate = async () => {
    if (!script.trim()) {
      setError('Please enter some text to convert to voice');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8080/api/ai-voice/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: script,
          voice: voiceStyle,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate voice');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setProgress(0);
      setIsPlaying(false);
    } catch (err: any) {
      setError(err.message || 'Failed to generate voice. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleDownload = () => {
    if (audioUrl) {
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = `ai-voice-${Date.now()}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  if (!isAuthenticated) {
    return (
      <section className="mt-6 rounded-[2.5rem] border border-white/15 bg-white/6 backdrop-blur-3xl p-10 flex flex-col items-center justify-center text-center space-y-4 shadow-2xl">
        <div className="p-4 rounded-full bg-white/10 border border-white/20 mb-2">
          <Mic className="w-8 h-8 text-purple-300" />
        </div>
        <h2 className="text-2xl font-semibold">Sign in to unlock AI Voice</h2>
        <p className="text-sm md:text-base text-white/65 max-w-md">
          Login or create an account to convert your scripts into natural-sounding voice narration.
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
          <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl">
            <Mic className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">AI Voice</h1>
            <p className="text-sm text-white/60">Convert text into natural-sounding voice</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
              Script
            </label>
            <div className="relative">
              <div className="absolute left-4 top-4 p-2 bg-white/10 rounded-full backdrop-blur-md border border-white/20">
                <FileText className="w-4 h-4 text-purple-400" />
              </div>
              <textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="Enter your script here...&#10;&#10;Example: Welcome to our channel. Today we will talk about AI tools."
                className="w-full pl-14 pr-4 py-4 bg-white/8 backdrop-blur-xl border border-white/15 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:border-purple-400/50 focus:bg-white/12 transition-all duration-300 min-h-[200px] resize-y"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.05) 100%)'
                }}
              />
            </div>
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
                  className={`px-4 py-3 rounded-xl border backdrop-blur-xl transition-all duration-200 ${
                    voiceStyle === style
                      ? 'bg-white/15 border-purple-400/50 text-white shadow-lg'
                      : 'bg-white/6 border-white/15 text-white/70 hover:bg-white/10'
                  }`}
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

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !script.trim()}
            className="w-full px-6 py-4 bg-gradient-to-r from-purple-500/90 to-purple-600/90 backdrop-blur-2xl text-white font-medium rounded-full hover:from-purple-600 hover:to-purple-700 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 flex items-center justify-center space-x-2 shadow-xl shadow-purple-500/40 border border-purple-400/40"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating voice...</span>
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                <span>Generate Voice</span>
              </>
            )}
          </button>
        </div>
      </div>

      {audioUrl && (
        <div className="rounded-[2.5rem] border border-white/15 bg-white/6 backdrop-blur-3xl p-6 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-4">Generated Audio</h2>
          <div className="flex items-center gap-4">
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="hidden"
            />
            <button
              onClick={handlePlayPause}
              className="p-4 bg-white/12 backdrop-blur-2xl rounded-full border border-white/25 hover:bg-white/18 hover:scale-105 transition-all duration-300 shadow-xl"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-purple-400" />
              ) : (
                <Play className="w-6 h-6 text-purple-400" />
              )}
            </button>
            <div className="flex-1">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-white/12 backdrop-blur-2xl rounded-full border border-white/25 hover:bg-white/18 hover:scale-105 transition-all duration-300 flex items-center gap-2 shadow-xl"
            >
              <Download className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium">Download</span>
            </button>
          </div>
        </div>
      )}

      <HelpDialog
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        title="How to Use AI Voice"
        content={
          <>
            <p><strong>Step 1: Enter Your Script</strong></p>
            <p>Type or paste your text script into the input area. This will be converted to speech.</p>
            
            <p><strong>Step 2: Select Voice Style</strong></p>
            <p>Choose from Woman, Man, Boy, or Girl voice styles to match your content needs.</p>
            
            <p><strong>Step 3: Generate Audio</strong></p>
            <p>Click "Generate Voice" to create the audio. The system will process your text and generate natural-sounding speech.</p>
            
            <p><strong>Step 4: Preview & Download</strong></p>
            <p>Use the audio player to preview your generated voice. Adjust playback speed if needed, then download the audio file when satisfied.</p>
          </>
        }
      />
    </div>
  );
}
