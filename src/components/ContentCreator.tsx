import { useState } from 'react';
import { Sparkles, Loader2, Copy, Check, AlertCircle, FileText, Hash, Type, HelpCircle } from 'lucide-react';
import HelpDialog from './HelpDialog';

interface ContentCreatorProps {
  isAuthenticated: boolean;
  onLoginClick: () => void;
}

type ContentType = 'hook' | 'caption' | 'script' | 'hashtags';

const CONTENT_TYPES = [
  { id: 'hook' as ContentType, label: 'Hook', icon: Hash, description: 'Attention-grabbing opening lines' },
  { id: 'caption' as ContentType, label: 'Caption', icon: FileText, description: 'Social media captions' },
  { id: 'script' as ContentType, label: 'Script', icon: Type, description: 'Video scripts and narratives' },
  { id: 'hashtags' as ContentType, label: 'Hashtags', icon: Hash, description: 'Relevant hashtag suggestions' },
];

export default function ContentCreator({ isAuthenticated, onLoginClick }: ContentCreatorProps) {
  const [topic, setTopic] = useState('');
  const [contentType, setContentType] = useState<ContentType>('hook');
  const [tone, setTone] = useState('engaging');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const tones = ['engaging', 'professional', 'casual', 'funny', 'inspiring', 'dramatic'];

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic or description');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8080/api/content-creator/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          contentType,
          tone,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();
      setGeneratedContent(data.content || '');
    } catch (err: any) {
      setError(err.message || 'Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isAuthenticated) {
    return (
      <section className="mt-6 rounded-[2.5rem] border border-white/15 bg-white/6 backdrop-blur-3xl p-10 flex flex-col items-center justify-center text-center space-y-4 shadow-2xl">
        <div className="p-4 rounded-full bg-white/10 border border-white/20 mb-2">
          <Sparkles className="w-8 h-8 text-rose-300" />
        </div>
        <h2 className="text-2xl font-semibold">Sign in to unlock Content Creator</h2>
        <p className="text-sm md:text-base text-white/65 max-w-md">
          Login or create an account to generate hooks, captions, and social-ready scripts.
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

  const selectedType = CONTENT_TYPES.find(t => t.id === contentType);

  return (
    <div className="space-y-6">
      <div className="rounded-[2.5rem] border border-white/15 bg-white/6 backdrop-blur-3xl p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-white">Content Creator</h1>
              <button
                onClick={() => setShowHelp(true)}
                className="p-1.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg hover:bg-white/15 transition-all duration-300"
              >
                <HelpCircle className="w-4 h-4 text-white/60" />
              </button>
            </div>
            <p className="text-sm text-white/60">Write hooks, captions, and social-ready scripts</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
              Content Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CONTENT_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setContentType(type.id)}
                    className={`px-4 py-3 rounded-xl border backdrop-blur-xl transition-all duration-200 ${
                      contentType === type.id
                        ? 'bg-white/15 border-rose-400/50 text-white shadow-lg'
                        : 'bg-white/6 border-white/15 text-white/70 hover:bg-white/10'
                    }`}
                    style={contentType === type.id ? {
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(244,63,94,0.1) 100%)'
                    } : {}}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span className="text-xs font-medium">{type.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            {selectedType && (
              <p className="text-xs text-white/50 mt-2 px-1">{selectedType.description}</p>
            )}
          </div>

          <div>
            <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
              Topic or Description
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Describe what you want to create content about...&#10;&#10;Example: A video about AI tools for content creators"
              className="w-full px-4 py-4 bg-white/8 backdrop-blur-xl border border-white/15 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:border-rose-400/50 focus:bg-white/12 transition-all duration-300 min-h-[120px] resize-y"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.05) 100%)'
              }}
            />
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
                      ? 'bg-white/15 border-rose-400/50 text-white shadow-lg'
                      : 'bg-white/6 border-white/15 text-white/70 hover:bg-white/10'
                  }`}
                  style={tone === t ? {
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(244,63,94,0.1) 100%)'
                  } : {}}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
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
            disabled={isGenerating || !topic.trim()}
            className="w-full px-6 py-4 bg-gradient-to-r from-rose-500/90 to-pink-500/90 backdrop-blur-2xl text-white font-medium rounded-full hover:from-rose-600 hover:to-pink-600 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 flex items-center justify-center space-x-2 shadow-xl shadow-rose-500/40 border border-rose-400/40"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating content...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Generate Content</span>
              </>
            )}
          </button>
        </div>
      </div>

      {generatedContent && (
        <div className="rounded-[2.5rem] border border-white/15 bg-white/6 backdrop-blur-3xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Generated Content</h2>
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-white/12 backdrop-blur-2xl rounded-full border border-white/25 hover:bg-white/18 hover:scale-105 transition-all duration-300 flex items-center gap-2 shadow-xl"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-rose-400" />
                  <span className="text-sm font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-rose-400" />
                  <span className="text-sm font-medium">Copy</span>
                </>
              )}
            </button>
          </div>
          <div className="p-4 rounded-2xl bg-white/8 border border-white/15 backdrop-blur-xl min-h-[150px]">
            <p className="text-white/90 whitespace-pre-wrap">{generatedContent}</p>
          </div>
        </div>
      )}

      <HelpDialog
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        title="How to Use Content Creator"
        content={
          <>
            <p><strong>Step 1: Select Content Type</strong></p>
            <p>Choose what you want to create: Hook (attention-grabbing opening lines), Caption (social media captions), Script (video scripts), or Hashtags (relevant hashtag suggestions).</p>
            
            <p><strong>Step 2: Enter Topic</strong></p>
            <p>Describe your topic or what you want to create content about.</p>
            
            <p><strong>Step 3: Choose Tone</strong></p>
            <p>Select the tone that matches your brand: Engaging, Professional, Casual, Funny, Inspiring, or Dramatic.</p>
            
            <p><strong>Step 4: Generate</strong></p>
            <p>Click "Generate Content" to create your content. Use the copy button to copy the generated text to your clipboard.</p>
          </>
        }
      />
    </div>
  );
}
