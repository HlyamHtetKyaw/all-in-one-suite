import { useState, useRef } from 'react';
import { Image, Loader2, AlertCircle, Upload, Download, X, Sparkles, HelpCircle } from 'lucide-react';
import HelpDialog from './HelpDialog';

interface ThumbnailProps {
  isAuthenticated: boolean;
  onLoginClick: () => void;
}

const STYLES = [
  { id: 'bold', label: 'Bold', description: 'High contrast, eye-catching' },
  { id: 'minimal', label: 'Minimal', description: 'Clean and simple' },
  { id: 'vibrant', label: 'Vibrant', description: 'Colorful and energetic' },
  { id: 'dramatic', label: 'Dramatic', description: 'Intense and impactful' },
  { id: 'professional', label: 'Professional', description: 'Polished and refined' },
  { id: 'playful', label: 'Playful', description: 'Fun and creative' },
];

const ASPECT_RATIOS = [
  { id: '16:9', label: '16:9', description: 'YouTube standard' },
  { id: '9:16', label: '9:16', description: 'TikTok/Shorts' },
  { id: '1:1', label: '1:1', description: 'Square/Instagram' },
  { id: '4:3', label: '4:3', description: 'Classic format' },
];

export default function Thumbnail({ isAuthenticated, onLoginClick }: ThumbnailProps) {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('bold');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [generatedThumbnail, setGeneratedThumbnail] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt describing your thumbnail');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8080/api/thumbnail/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          style,
          aspectRatio,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate thumbnail');
      }

      const data = await response.json();
      setGeneratedThumbnail(data.imageUrl || data.thumbnail || '');
    } catch (err: any) {
      setError(err.message || 'Failed to generate thumbnail. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedThumbnail) return;

    const a = document.createElement('a');
    a.href = generatedThumbnail;
    a.download = `thumbnail-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (PNG, JPG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setGeneratedThumbnail(imageUrl);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  if (!isAuthenticated) {
    return (
      <section className="mt-6 rounded-[2.5rem] border border-white/15 bg-white/6 backdrop-blur-3xl p-10 flex flex-col items-center justify-center text-center space-y-4 shadow-2xl">
        <div className="p-4 rounded-full bg-white/10 border border-white/20 mb-2">
          <Image className="w-8 h-8 text-amber-300" />
        </div>
        <h2 className="text-2xl font-semibold">Sign in to unlock Thumbnail</h2>
        <p className="text-sm md:text-base text-white/65 max-w-md">
          Login or create an account to design scroll-stopping thumbnails with prompts.
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
          <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl">
            <Image className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-white">Thumbnail</h1>
              <button
                onClick={() => setShowHelp(true)}
                className="p-1.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg hover:bg-white/15 transition-all duration-300"
              >
                <HelpCircle className="w-4 h-4 text-white/60" />
              </button>
            </div>
            <p className="text-sm text-white/60">Design scroll-stopping thumbnails with prompts</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
              Thumbnail Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your thumbnail: e.g., 'A futuristic cityscape at sunset with neon lights, bold text overlay saying TECH REVIEW'"
              className="w-full px-4 py-3 bg-white/8 backdrop-blur-xl border border-white/15 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-amber-400/50 focus:bg-white/12 transition-all duration-300 resize-none"
              rows={4}
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.05) 100%)'
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
                Style
              </label>
              <div className="grid grid-cols-2 gap-3">
                {STYLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    className={`p-3 rounded-xl border backdrop-blur-xl text-left transition-all duration-300 ${
                      style === s.id
                        ? 'bg-amber-500/20 border-amber-400/50 shadow-lg shadow-amber-500/20'
                        : 'bg-white/8 border-white/15 hover:bg-white/12'
                    }`}
                    style={{
                      background: style === s.id
                        ? 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(249,115,22,0.15) 100%)'
                        : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.05) 100%)'
                    }}
                  >
                    <p className="text-sm font-medium text-white">{s.label}</p>
                    <p className="text-xs text-white/50 mt-1">{s.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
                Aspect Ratio
              </label>
              <div className="grid grid-cols-2 gap-3">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.id}
                    onClick={() => setAspectRatio(ratio.id)}
                    className={`p-3 rounded-xl border backdrop-blur-xl text-left transition-all duration-300 ${
                      aspectRatio === ratio.id
                        ? 'bg-amber-500/20 border-amber-400/50 shadow-lg shadow-amber-500/20'
                        : 'bg-white/8 border-white/15 hover:bg-white/12'
                    }`}
                    style={{
                      background: aspectRatio === ratio.id
                        ? 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(249,115,22,0.15) 100%)'
                        : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.05) 100%)'
                    }}
                  >
                    <p className="text-sm font-medium text-white">{ratio.label}</p>
                    <p className="text-xs text-white/50 mt-1">{ratio.description}</p>
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
            className="w-full px-6 py-4 bg-gradient-to-r from-amber-500/90 to-orange-500/90 backdrop-blur-2xl text-white font-medium rounded-full hover:from-amber-600 hover:to-orange-600 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 flex items-center justify-center space-x-2 shadow-xl shadow-amber-500/40 border border-amber-400/40"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating thumbnail...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Generate Thumbnail</span>
              </>
            )}
          </button>
        </div>
      </div>

      {generatedThumbnail && (
        <div className="rounded-[2.5rem] border border-white/15 bg-white/6 backdrop-blur-3xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Generated Thumbnail</h2>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg hover:bg-white/15 transition-all duration-300 flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Download</span>
            </button>
          </div>
          <div className="rounded-xl bg-white/8 border border-white/15 backdrop-blur-xl overflow-hidden">
            <img
              src={generatedThumbnail}
              alt="Generated thumbnail"
              className="w-full h-auto"
              style={{
                aspectRatio: aspectRatio === '16:9' ? '16/9' : aspectRatio === '9:16' ? '9/16' : aspectRatio === '1:1' ? '1/1' : '4/3'
              }}
            />
          </div>
        </div>
      )}

      <HelpDialog
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        title="How to Use Thumbnail"
        content={
          <>
            <p><strong>Step 1: Enter Thumbnail Prompt</strong></p>
            <p>Describe your thumbnail in detail. Include visual elements, colors, text overlays, and style. Example: "A futuristic cityscape at sunset with neon lights, bold text overlay saying TECH REVIEW".</p>
            
            <p><strong>Step 2: Select Style</strong></p>
            <p>Choose a visual style: Bold (high contrast), Minimal (clean and simple), Vibrant (colorful), Dramatic (intense), Professional (polished), or Playful (fun and creative).</p>
            
            <p><strong>Step 3: Choose Aspect Ratio</strong></p>
            <p>Select the format: 16:9 (YouTube standard), 9:16 (TikTok/Shorts), 1:1 (Square/Instagram), or 4:3 (Classic format).</p>
            
            <p><strong>Step 4: Generate & Download</strong></p>
            <p>Click "Generate Thumbnail" to create your image. Preview the result and download when satisfied.</p>
          </>
        }
      />
    </div>
  );
}
