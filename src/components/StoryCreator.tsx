import { useState } from 'react';
import { BookOpen, Loader2, Copy, Check, AlertCircle, FileText, Sparkles, Download, HelpCircle } from 'lucide-react';
import HelpDialog from './HelpDialog';

interface StoryCreatorProps {
  isAuthenticated: boolean;
  onLoginClick: () => void;
}

type StoryGenre = 'fantasy' | 'sci-fi' | 'mystery' | 'romance' | 'thriller' | 'adventure';
type StoryLength = 'short' | 'medium' | 'long';

const GENRES = [
  { id: 'fantasy' as StoryGenre, label: 'Fantasy', emoji: '🧙' },
  { id: 'sci-fi' as StoryGenre, label: 'Sci-Fi', emoji: '🚀' },
  { id: 'mystery' as StoryGenre, label: 'Mystery', emoji: '🔍' },
  { id: 'romance' as StoryGenre, label: 'Romance', emoji: '💕' },
  { id: 'thriller' as StoryGenre, label: 'Thriller', emoji: '⚡' },
  { id: 'adventure' as StoryGenre, label: 'Adventure', emoji: '🗺️' },
];

const LENGTHS = [
  { id: 'short' as StoryLength, label: 'Short', words: '500-1000 words' },
  { id: 'medium' as StoryLength, label: 'Medium', words: '2000-5000 words' },
  { id: 'long' as StoryLength, label: 'Long', words: '5000+ words' },
];

export default function StoryCreator({ isAuthenticated, onLoginClick }: StoryCreatorProps) {
  const [prompt, setPrompt] = useState('');
  const [genre, setGenre] = useState<StoryGenre>('fantasy');
  const [length, setLength] = useState<StoryLength>('medium');
  const [tone, setTone] = useState('engaging');
  const [generatedStory, setGeneratedStory] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const tones = ['engaging', 'dramatic', 'mysterious', 'lighthearted', 'epic', 'intimate'];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a story prompt or idea');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8080/api/story-creator/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          genre,
          length,
          tone,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate story');
      }

      const data = await response.json();
      setGeneratedStory(data.story || '');
    } catch (err: any) {
      setError(err.message || 'Failed to generate story. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedStory);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (generatedStory) {
      const blob = new Blob([generatedStory], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `story-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  if (!isAuthenticated) {
    return (
      <section className="mt-6 rounded-[2.5rem] border border-white/15 bg-white/6 backdrop-blur-3xl p-10 flex flex-col items-center justify-center text-center space-y-4 shadow-2xl">
        <div className="p-4 rounded-full bg-white/10 border border-white/20 mb-2">
          <BookOpen className="w-8 h-8 text-purple-300" />
        </div>
        <h2 className="text-2xl font-semibold">Sign in to unlock Story Creator</h2>
        <p className="text-sm md:text-base text-white/65 max-w-md">
          Login or create an account to generate long-form storylines and narratives.
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
          <div className="p-3 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-2xl">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-white">Story Creator</h1>
              <button
                onClick={() => setShowHelp(true)}
                className="p-1.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg hover:bg-white/15 transition-all duration-300"
              >
                <HelpCircle className="w-4 h-4 text-white/60" />
              </button>
            </div>
            <p className="text-sm text-white/60">Generate long-form storylines and narratives</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
              Story Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your story idea or provide a prompt...&#10;&#10;Example: A young wizard discovers an ancient artifact that can control time, but using it comes with a terrible price."
              className="w-full px-4 py-4 bg-white/8 backdrop-blur-xl border border-white/15 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:border-purple-400/50 focus:bg-white/12 transition-all duration-300 min-h-[150px] resize-y"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.05) 100%)'
              }}
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
              Genre
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {GENRES.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setGenre(g.id)}
                  className={`px-4 py-3 rounded-xl border backdrop-blur-xl transition-all duration-200 ${
                    genre === g.id
                      ? 'bg-white/15 border-purple-400/50 text-white shadow-lg'
                      : 'bg-white/6 border-white/15 text-white/70 hover:bg-white/10'
                  }`}
                  style={genre === g.id ? {
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(168,85,247,0.1) 100%)'
                  } : {}}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xl">{g.emoji}</span>
                    <span className="text-xs font-medium">{g.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
                Story Length
              </label>
              <div className="flex gap-2">
                {LENGTHS.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLength(l.id)}
                    className={`flex-1 px-4 py-3 rounded-xl border backdrop-blur-xl transition-all duration-200 ${
                      length === l.id
                        ? 'bg-white/15 border-purple-400/50 text-white shadow-lg'
                        : 'bg-white/6 border-white/15 text-white/70 hover:bg-white/10'
                    }`}
                    style={length === l.id ? {
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(168,85,247,0.1) 100%)'
                    } : {}}
                  >
                    <div className="text-center">
                      <div className="text-sm font-medium">{l.label}</div>
                      <div className="text-xs text-white/60 mt-1">{l.words}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
                Tone
              </label>
              <div className="flex flex-wrap gap-2">
                {tones.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={`px-4 py-2 rounded-full border backdrop-blur-xl transition-all duration-200 text-sm ${
                      tone === t
                        ? 'bg-white/15 border-purple-400/50 text-white shadow-lg'
                        : 'bg-white/6 border-white/15 text-white/70 hover:bg-white/10'
                    }`}
                    style={tone === t ? {
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(168,85,247,0.1) 100%)'
                    } : {}}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
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
            disabled={isGenerating || !prompt.trim()}
            className="w-full px-6 py-4 bg-gradient-to-r from-purple-500/90 to-fuchsia-500/90 backdrop-blur-2xl text-white font-medium rounded-full hover:from-purple-600 hover:to-fuchsia-600 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 flex items-center justify-center space-x-2 shadow-xl shadow-purple-500/40 border border-purple-400/40"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating story...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Generate Story</span>
              </>
            )}
          </button>
        </div>
      </div>

      {generatedStory && (
        <div className="rounded-[2.5rem] border border-white/15 bg-white/6 backdrop-blur-3xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              Generated Story
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-white/12 backdrop-blur-2xl rounded-full border border-white/25 hover:bg-white/18 hover:scale-105 transition-all duration-300 flex items-center gap-2 shadow-xl"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium">Copy</span>
                  </>
                )}
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-white/12 backdrop-blur-2xl rounded-full border border-white/25 hover:bg-white/18 hover:scale-105 transition-all duration-300 flex items-center gap-2 shadow-xl"
              >
                <Download className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium">Download</span>
              </button>
            </div>
          </div>
          <div className="p-6 rounded-2xl bg-white/8 border border-white/15 backdrop-blur-xl min-h-[300px] max-h-[600px] overflow-y-auto">
            <p className="text-white/90 whitespace-pre-wrap leading-relaxed">{generatedStory}</p>
          </div>
        </div>
      )}

      <HelpDialog
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        title="How to Use Story Creator"
        content={
          <>
            <p><strong>Step 1: Enter Story Prompt</strong></p>
            <p>Describe your story idea, theme, or starting point in the prompt field.</p>
            
            <p><strong>Step 2: Select Genre</strong></p>
            <p>Choose a genre: Fantasy, Sci-Fi, Mystery, Romance, Thriller, or Adventure.</p>
            
            <p><strong>Step 3: Choose Length</strong></p>
            <p>Select story length: Short (500-1000 words), Medium (2000-5000 words), or Long (5000+ words).</p>
            
            <p><strong>Step 4: Set Tone</strong></p>
            <p>Pick the narrative tone: Engaging, Dramatic, Mysterious, Lighthearted, Epic, or Intimate.</p>
            
            <p><strong>Step 5: Generate Story</strong></p>
            <p>Click "Generate Story" to create your long-form narrative. Copy or download the generated story when complete.</p>
          </>
        }
      />
    </div>
  );
}
