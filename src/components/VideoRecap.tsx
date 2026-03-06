import { useState, useRef, useEffect } from 'react';
import { Video, Loader2, AlertCircle, Upload, Download, X, Music, Image, Volume2, VolumeX, Save, HelpCircle } from 'lucide-react';
import HelpDialog from './HelpDialog';

interface VideoRecapProps {
  isAuthenticated: boolean;
  onLoginClick: () => void;
}

const LOGO_POSITIONS = [
  { id: 'top-left', label: 'Top Left', description: 'Upper left corner' },
  { id: 'top-right', label: 'Top Right', description: 'Upper right corner' },
  { id: 'bottom-left', label: 'Bottom Left', description: 'Lower left corner' },
  { id: 'bottom-right', label: 'Bottom Right', description: 'Lower right corner' },
  { id: 'center', label: 'Center', description: 'Center of video' },
];

const LOGO_SIZES = [
  { id: 'small', label: 'Small', value: 10 },
  { id: 'medium', label: 'Medium', value: 20 },
  { id: 'large', label: 'Large', value: 30 },
];

export default function VideoRecap({ isAuthenticated, onLoginClick }: VideoRecapProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [removeOriginalAudio, setRemoveOriginalAudio] = useState(true);
  const [logoPosition, setLogoPosition] = useState('top-right');
  const [logoSize, setLogoSize] = useState('medium');
  const [logoOpacity, setLogoOpacity] = useState(100);
  const [syncOffset, setSyncOffset] = useState(0);
  const [processedVideoUrl, setProcessedVideoUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
      if (logoUrl) {
        URL.revokeObjectURL(logoUrl);
      }
    };
  }, [videoUrl, logoUrl]);

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid video file (MP4, WebM, OGG, MOV)');
      return;
    }

    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    const newVideoUrl = URL.createObjectURL(file);
    setVideoUrl(newVideoUrl);
    setVideoFile(file);
    setError(null);
    setProcessedVideoUrl(null);
    setProgress(0);
  };

  const handleAudioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/m4a'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid audio file (MP3, WAV, OGG, M4A)');
      return;
    }

    setAudioFile(file);
    setError(null);
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (PNG, JPG, WebP, SVG)');
      return;
    }

    if (logoUrl) {
      URL.revokeObjectURL(logoUrl);
    }
    const newLogoUrl = URL.createObjectURL(file);
    setLogoUrl(newLogoUrl);
    setLogoFile(file);
    setError(null);
  };

  const handleProcess = async () => {
    if (!videoFile) {
      setError('Please upload a video file first');
      return;
    }

    if (!audioFile && removeOriginalAudio) {
      setError('Please upload a voiceover audio file or keep original audio');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      if (audioFile) {
        formData.append('audio', audioFile);
      }
      if (logoFile) {
        formData.append('logo', logoFile);
      }
      formData.append('removeOriginalAudio', removeOriginalAudio.toString());
      formData.append('logoPosition', logoPosition);
      formData.append('logoSize', logoSize);
      formData.append('logoOpacity', logoOpacity.toString());
      formData.append('syncOffset', syncOffset.toString());

      const response = await fetch('http://localhost:8080/api/video-recap/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process video');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setProcessedVideoUrl(url);
      setProgress(100);
    } catch (err: any) {
      setError(err.message || 'Failed to process video. Please try again.');
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedVideoUrl) return;

    const a = document.createElement('a');
    a.href = processedVideoUrl;
    a.download = `processed-video-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleRemoveVideo = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoUrl(null);
    setVideoFile(null);
    setProcessedVideoUrl(null);
    setError(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (videoRef.current) {
      videoRef.current.src = '';
    }
  };

  const handleRemoveAudio = () => {
    setAudioFile(null);
    if (audioInputRef.current) {
      audioInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = () => {
    if (logoUrl) {
      URL.revokeObjectURL(logoUrl);
    }
    setLogoUrl(null);
    setLogoFile(null);
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  if (!isAuthenticated) {
    return (
      <section className="mt-6 rounded-[2.5rem] border border-white/15 bg-white/6 backdrop-blur-3xl p-10 flex flex-col items-center justify-center text-center space-y-4 shadow-2xl">
        <div className="p-4 rounded-full bg-white/10 border border-white/20 mb-2">
          <Video className="w-8 h-8 text-sky-300" />
        </div>
        <h2 className="text-2xl font-semibold">Sign in to unlock Video Recap</h2>
        <p className="text-sm md:text-base text-white/65 max-w-md">
          Login or create an account to sync voiceovers, remove original audio, and add logos to your videos.
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
          <div className="p-3 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-2xl">
            <Video className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-white">Video Recap</h1>
              <button
                onClick={() => setShowHelp(true)}
                className="p-1.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg hover:bg-white/15 transition-all duration-300"
              >
                <HelpCircle className="w-4 h-4 text-white/60" />
              </button>
            </div>
            <p className="text-sm text-white/60">Sync voiceovers, remove original audio, and add logos</p>
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
                className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center cursor-pointer hover:border-sky-400/50 hover:bg-white/5 transition-all duration-300"
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
                  onChange={handleVideoUpload}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-white/8 border border-white/15 backdrop-blur-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-sky-500/20 rounded-lg">
                    <Video className="w-5 h-5 text-sky-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{videoFile.name}</p>
                    <p className="text-xs text-white/50">
                      {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRemoveVideo}
                  className="p-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg hover:bg-white/15 transition-all duration-300"
                >
                  <X className="w-4 h-4 text-white/70" />
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
              Upload Voiceover Audio (Optional)
            </label>
            {!audioFile ? (
              <div
                onClick={() => audioInputRef.current?.click()}
                className="border-2 border-dashed border-white/20 rounded-2xl p-6 text-center cursor-pointer hover:border-sky-400/50 hover:bg-white/5 transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
                }}
              >
                <Music className="w-8 h-8 text-white/40 mx-auto mb-2" />
                <p className="text-white/70 text-sm mb-1">Click to upload audio</p>
                <p className="text-xs text-white/50">MP3, WAV, OGG, M4A files</p>
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-white/8 border border-white/15 backdrop-blur-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-sky-500/20 rounded-lg">
                    <Music className="w-5 h-5 text-sky-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{audioFile.name}</p>
                    <p className="text-xs text-white/50">
                      {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRemoveAudio}
                  className="p-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg hover:bg-white/15 transition-all duration-300"
                >
                  <X className="w-4 h-4 text-white/70" />
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
              Upload Logo (Optional)
            </label>
            {!logoFile ? (
              <div
                onClick={() => logoInputRef.current?.click()}
                className="border-2 border-dashed border-white/20 rounded-2xl p-6 text-center cursor-pointer hover:border-sky-400/50 hover:bg-white/5 transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
                }}
              >
                <Image className="w-8 h-8 text-white/40 mx-auto mb-2" />
                <p className="text-white/70 text-sm mb-1">Click to upload logo</p>
                <p className="text-xs text-white/50">PNG, JPG, WebP, SVG files</p>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-white/8 border border-white/15 backdrop-blur-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-sky-500/20 rounded-lg">
                      <Image className="w-5 h-5 text-sky-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{logoFile.name}</p>
                      <p className="text-xs text-white/50">
                        {(logoFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveLogo}
                    className="p-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg hover:bg-white/15 transition-all duration-300"
                  >
                    <X className="w-4 h-4 text-white/70" />
                  </button>
                </div>
                {logoUrl && (
                  <div className="p-4 rounded-xl bg-white/8 border border-white/15 backdrop-blur-xl">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/60 mb-3">Logo Preview</p>
                    <div className="flex items-center justify-center p-4 bg-black/20 rounded-xl">
                      <img
                        src={logoUrl}
                        alt="Logo preview"
                        className="max-w-full max-h-32 object-contain"
                        style={{ opacity: logoOpacity / 100 }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-white/8 border border-white/15 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {removeOriginalAudio ? (
                  <VolumeX className="w-5 h-5 text-sky-400" />
                ) : (
                  <Volume2 className="w-5 h-5 text-white/60" />
                )}
                <div>
                  <label className="text-sm font-medium text-white">Remove Original Audio</label>
                  <p className="text-xs text-white/50">Replace with voiceover audio</p>
                </div>
              </div>
              <button
                onClick={() => setRemoveOriginalAudio(!removeOriginalAudio)}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                  removeOriginalAudio ? 'bg-sky-500' : 'bg-white/20'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${
                    removeOriginalAudio ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {audioFile && (
            <div className="p-4 rounded-xl bg-white/8 border border-white/15 backdrop-blur-xl">
              <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
                Sync Offset (seconds)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="-5"
                  max="5"
                  step="0.1"
                  value={syncOffset}
                  onChange={(e) => setSyncOffset(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-white/10 rounded-full appearance-none cursor-pointer"
                />
                <span className="text-sm font-medium text-white min-w-[60px] text-right">
                  {syncOffset > 0 ? '+' : ''}{syncOffset.toFixed(1)}s
                </span>
              </div>
              <p className="text-xs text-white/50 mt-2">
                Adjust timing to sync voiceover with video
              </p>
            </div>
          )}

          {logoFile && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
                  Logo Position
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {LOGO_POSITIONS.map((position) => (
                    <button
                      key={position.id}
                      onClick={() => setLogoPosition(position.id)}
                      className={`p-3 rounded-xl border backdrop-blur-xl text-center transition-all duration-300 ${
                        logoPosition === position.id
                          ? 'bg-sky-500/20 border-sky-400/50 shadow-lg shadow-sky-500/20'
                          : 'bg-white/8 border-white/15 hover:bg-white/12'
                      }`}
                      style={{
                        background: logoPosition === position.id
                          ? 'linear-gradient(135deg, rgba(14,165,233,0.2) 0%, rgba(6,182,212,0.15) 100%)'
                          : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.05) 100%)'
                      }}
                    >
                      <p className="text-sm font-medium text-white">{position.label}</p>
                      <p className="text-xs text-white/50 mt-1">{position.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
                    Logo Size
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {LOGO_SIZES.map((size) => (
                      <button
                        key={size.id}
                        onClick={() => setLogoSize(size.id)}
                        className={`p-3 rounded-xl border backdrop-blur-xl text-center transition-all duration-300 ${
                          logoSize === size.id
                            ? 'bg-sky-500/20 border-sky-400/50 shadow-lg shadow-sky-500/20'
                            : 'bg-white/8 border-white/15 hover:bg-white/12'
                        }`}
                        style={{
                          background: logoSize === size.id
                            ? 'linear-gradient(135deg, rgba(14,165,233,0.2) 0%, rgba(6,182,212,0.15) 100%)'
                            : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.05) 100%)'
                        }}
                      >
                        <p className="text-sm font-medium text-white">{size.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
                    Opacity: {logoOpacity}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={logoOpacity}
                    onChange={(e) => setLogoOpacity(parseInt(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>Processing video...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-cyan-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="backdrop-blur-3xl bg-red-500/15 border border-red-400/40 text-red-200 p-4 rounded-full flex items-start space-x-3 shadow-2xl shadow-red-500/30">
              <div className="p-1.5 bg-red-500/20 rounded-full backdrop-blur-md border border-red-400/30 shrink-0">
                <AlertCircle className="w-4 h-4 text-red-300" />
              </div>
              <p className="text-sm flex-1">{error}</p>
            </div>
          )}

          <button
            onClick={handleProcess}
            disabled={isProcessing || !videoFile || (removeOriginalAudio && !audioFile)}
            className="w-full px-6 py-4 bg-gradient-to-r from-sky-500/90 to-cyan-500/90 backdrop-blur-2xl text-white font-medium rounded-full hover:from-sky-600 hover:to-cyan-600 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 flex items-center justify-center space-x-2 shadow-xl shadow-sky-500/40 border border-sky-400/40"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing video...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Process Video</span>
              </>
            )}
          </button>
        </div>
      </div>

      {processedVideoUrl && (
        <div className="rounded-[2.5rem] border border-white/15 bg-white/6 backdrop-blur-3xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Processed Video</h2>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg hover:bg-white/15 transition-all duration-300 flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4 text-sky-400" />
              <span>Download</span>
            </button>
          </div>
          <div className="rounded-xl bg-white/8 border border-white/15 backdrop-blur-xl overflow-hidden">
            <video
              ref={videoRef}
              src={processedVideoUrl}
              controls
              className="w-full h-auto"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}

      <HelpDialog
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        title="How to Use Video Recap"
        content={
          <>
            <p><strong>Step 1: Upload Video</strong></p>
            <p>Upload your video file (MP4, WebM, OGG, MOV) by clicking the upload area or dragging and dropping.</p>
            
            <p><strong>Step 2: Add Voiceover (Optional)</strong></p>
            <p>Upload an audio file (MP3, WAV, OGG, M4A) to replace or sync with the video audio. Use the sync offset slider to adjust timing.</p>
            
            <p><strong>Step 3: Add Logo (Optional)</strong></p>
            <p>Upload a logo image (PNG, JPG, WebP, SVG). Customize the position (top-left, top-right, bottom-left, bottom-right, center), size (small, medium, large), and opacity.</p>
            
            <p><strong>Step 4: Configure Audio</strong></p>
            <p>Toggle "Remove Original Audio" to replace the video's audio with your voiceover. If disabled, the voiceover will be mixed with the original audio.</p>
            
            <p><strong>Step 5: Process Video</strong></p>
            <p>Click "Process Video" to generate your final video with synced voiceover, removed original audio (if enabled), and added logo. Download the processed video when complete.</p>
          </>
        }
      />
    </div>
  );
}
