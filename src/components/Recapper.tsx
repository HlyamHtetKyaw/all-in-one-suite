import { useState, useRef } from 'react';
import { Video, Loader2, Copy, Check, AlertCircle, Upload, FileText, Download, X, HelpCircle } from 'lucide-react';
import HelpDialog from './HelpDialog';

interface RecapperProps {
  isAuthenticated: boolean;
  onLoginClick: () => void;
}

const TONES = [
  { id: 'engaging', label: 'Engaging', description: 'Captivating and attention-grabbing' },
  { id: 'professional', label: 'Professional', description: 'Formal and business-like' },
  { id: 'casual', label: 'Casual', description: 'Relaxed and conversational' },
  { id: 'dramatic', label: 'Dramatic', description: 'Intense and impactful' },
  { id: 'humorous', label: 'Humorous', description: 'Light-hearted and funny' },
  { id: 'informative', label: 'Informative', description: 'Educational and clear' },
];

const POVS = [
  { id: 'first-person', label: 'First Person', description: 'I, me, my perspective' },
  { id: 'second-person', label: 'Second Person', description: 'You, your perspective' },
  { id: 'third-person', label: 'Third Person', description: 'He, she, they perspective' },
  { id: 'narrator', label: 'Narrator', description: 'Objective storytelling voice' },
];

export default function Recapper({ isAuthenticated, onLoginClick }: RecapperProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [tone, setTone] = useState('engaging');
  const [pov, setPov] = useState('narrator');
  const [recapScript, setRecapScript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid video file (MP4, WebM, OGG, MOV)');
      return;
    }

    setVideoFile(file);
    setError(null);
    setRecapScript('');
  };

  const handleGenerate = async () => {
    if (!videoFile) {
      setError('Please upload a video file first');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', videoFile);
      formData.append('tone', tone);
      formData.append('pov', pov);

      const response = await fetch('http://localhost:8080/api/recapper/generate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate recap script');
      }

      const data = await response.json();
      setRecapScript(data.script || '');
    } catch (err: any) {
      setError(err.message || 'Failed to generate recap script. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(recapScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!recapScript) return;

    const blob = new Blob([recapScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recap-script-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRemoveFile = () => {
    setVideoFile(null);
    setRecapScript('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isAuthenticated) {
    return (
      <section className="mt-6 rounded-[2.5rem] border border-white/15 bg-white/6 backdrop-blur-3xl p-10 flex flex-col items-center justify-center text-center space-y-4 shadow-2xl">
        <div className="p-4 rounded-full bg-white/10 border border-white/20 mb-2">
          <Video className="w-8 h-8 text-emerald-300" />
        </div>
        <h2 className="text-2xl font-semibold">Sign in to unlock Recapper</h2>
        <p className="text-sm md:text-base text-white/65 max-w-md">
          Login or create an account to turn videos into recap scripts with tone and POV.
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
          <div className="p-3 bg-gradient-to-br from-emerald-500 to-lime-500 rounded-2xl">
            <Video className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-white">Recapper</h1>
              <button
                onClick={() => setShowHelp(true)}
                className="p-1.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg hover:bg-white/15 transition-all duration-300"
              >
                <HelpCircle className="w-4 h-4 text-white/60" />
              </button>
            </div>
            <p className="text-sm text-white/60">Turn videos into recap scripts with tone and POV</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
              Upload Video
            </label>
            {!videoFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center cursor-pointer hover:border-emerald-400/50 hover:bg-white/5 transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
                }}
              >
                <Upload className="w-12 h-12 text-white/40 mx-auto mb-3" />
                <p className="text-white/70 mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-white/50">MP4, WebM, OGG, MOV files</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-white/8 border border-white/15 backdrop-blur-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <Video className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{videoFile.name}</p>
                    <p className="text-xs text-white/50">
                      {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRemoveFile}
                  className="p-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg hover:bg-white/15 transition-all duration-300"
                >
                  <X className="w-4 h-4 text-white/70" />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
                Tone
              </label>
              <div className="grid grid-cols-2 gap-3">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTone(t.id)}
                    className={`p-3 rounded-xl border backdrop-blur-xl text-left transition-all duration-300 ${
                      tone === t.id
                        ? 'bg-emerald-500/20 border-emerald-400/50 shadow-lg shadow-emerald-500/20'
                        : 'bg-white/8 border-white/15 hover:bg-white/12'
                    }`}
                    style={{
                      background: tone === t.id
                        ? 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(132,204,22,0.15) 100%)'
                        : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.05) 100%)'
                    }}
                  >
                    <p className="text-sm font-medium text-white">{t.label}</p>
                    <p className="text-xs text-white/50 mt-1">{t.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
                Point of View
              </label>
              <div className="grid grid-cols-2 gap-3">
                {POVS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPov(p.id)}
                    className={`p-3 rounded-xl border backdrop-blur-xl text-left transition-all duration-300 ${
                      pov === p.id
                        ? 'bg-emerald-500/20 border-emerald-400/50 shadow-lg shadow-emerald-500/20'
                        : 'bg-white/8 border-white/15 hover:bg-white/12'
                    }`}
                    style={{
                      background: pov === p.id
                        ? 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(132,204,22,0.15) 100%)'
                        : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.05) 100%)'
                    }}
                  >
                    <p className="text-sm font-medium text-white">{p.label}</p>
                    <p className="text-xs text-white/50 mt-1">{p.description}</p>
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
            disabled={isProcessing || !videoFile}
            className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500/90 to-lime-500/90 backdrop-blur-2xl text-white font-medium rounded-full hover:from-emerald-600 hover:to-lime-600 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 flex items-center justify-center space-x-2 shadow-xl shadow-emerald-500/40 border border-emerald-400/40"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating recap script...</span>
              </>
            ) : (
              <>
                <Video className="w-5 h-5" />
                <span>Generate Recap Script</span>
              </>
            )}
          </button>
        </div>
      </div>

      {recapScript && (
        <div className="rounded-[2.5rem] border border-white/15 bg-white/6 backdrop-blur-3xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Generated Recap Script</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg hover:bg-white/15 transition-all duration-300 flex items-center gap-2 text-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-emerald-400" />
                    <span>Copy</span>
                  </>
                )}
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg hover:bg-white/15 transition-all duration-300 flex items-center gap-2 text-sm"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Download</span>
              </button>
            </div>
          </div>
          <div className="p-6 rounded-xl bg-white/8 border border-white/15 backdrop-blur-xl max-h-[600px] overflow-y-auto">
            <pre className="text-sm text-white/90 whitespace-pre-wrap font-sans leading-relaxed">
              {recapScript}
            </pre>
          </div>
        </div>
      )}

      <HelpDialog
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        title="How to Use Recapper"
        content={
          <>
            <p><strong>Step 1: Upload Video</strong></p>
            <p>Upload your video file (MP4, WebM, OGG, MOV) by clicking the upload area or dragging and dropping.</p>
            
            <p><strong>Step 2: Select Tone</strong></p>
            <p>Choose the tone for your recap: Engaging, Professional, Casual, Dramatic, Humorous, or Informative.</p>
            
            <p><strong>Step 3: Choose Point of View</strong></p>
            <p>Select the narrative perspective: First Person (I, me, my), Second Person (You, your), Third Person (He, she, they), or Narrator (objective storytelling).</p>
            
            <p><strong>Step 4: Generate Recap Script</strong></p>
            <p>Click "Generate Recap Script" to create your recap. The system analyzes your video and creates a script matching your selected tone and POV. Copy or download the script when complete.</p>
          </>
        }
      />
    </div>
  );
}
