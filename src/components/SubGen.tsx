import { useState, useRef, useEffect } from 'react';
import { FileText, Loader2, Upload, Download, AlertCircle, X, Video, Music, Eye, HelpCircle } from 'lucide-react';
import HelpDialog from './HelpDialog';

interface SubGenProps {
  isAuthenticated: boolean;
  onLoginClick: () => void;
}

interface SubtitleEntry {
  id: number;
  startTime: string;
  endTime: string;
  text: string;
}

export default function SubGen({ isAuthenticated, onLoginClick }: SubGenProps) {
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'video' | 'audio' | null>(null);
  const [srtContent, setSrtContent] = useState<string>('');
  const [subtitleEntries, setSubtitleEntries] = useState<SubtitleEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    return () => {
      if (mediaUrl) {
        URL.revokeObjectURL(mediaUrl);
      }
    };
  }, [mediaUrl]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const videoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    const audioTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/m4a'];

    if (!videoTypes.includes(file.type) && !audioTypes.includes(file.type)) {
      setError('Please upload a valid video or audio file');
      return;
    }

    const type = videoTypes.includes(file.type) ? 'video' : 'audio';

    if (mediaUrl) {
      URL.revokeObjectURL(mediaUrl);
    }
    const newMediaUrl = URL.createObjectURL(file);
    setMediaUrl(newMediaUrl);
    setMediaFile(file);
    setMediaType(type);
    setError(null);
    setSrtContent('');
    setSubtitleEntries([]);
  };

  const parseSRT = (content: string): SubtitleEntry[] => {
    const entries: SubtitleEntry[] = [];
    const blocks = content.trim().split(/\n\s*\n/);
    
    for (const block of blocks) {
      const lines = block.trim().split('\n');
      if (lines.length < 3) continue;
      
      const id = parseInt(lines[0]);
      if (isNaN(id)) continue;
      
      const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);
      if (!timeMatch) continue;
      
      const text = lines.slice(2).join('\n').trim();
      entries.push({
        id,
        startTime: timeMatch[1],
        endTime: timeMatch[2],
        text,
      });
    }
    
    return entries;
  };

  const handleGenerate = async () => {
    if (!mediaFile) {
      setError('Please upload a video or audio file first');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', mediaFile);
      formData.append('mediaType', mediaType || '');

      const response = await fetch('http://localhost:8080/api/sub-gen/generate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate SRT file');
      }

      const srtText = await response.text();
      setSrtContent(srtText);
      const entries = parseSRT(srtText);
      setSubtitleEntries(entries);
    } catch (err: any) {
      setError(err.message || 'Failed to generate SRT file. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!srtContent) return;

    const blob = new Blob([srtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subtitles-${Date.now()}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRemoveFile = () => {
    if (mediaUrl) {
      URL.revokeObjectURL(mediaUrl);
    }
    setMediaUrl(null);
    setMediaFile(null);
    setMediaType(null);
    setSrtContent('');
    setSubtitleEntries([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (videoRef.current) {
      videoRef.current.src = '';
    }
    if (audioRef.current) {
      audioRef.current.src = '';
    }
  };

  if (!isAuthenticated) {
    return (
      <section className="mt-6 rounded-[2.5rem] border border-white/15 bg-white/6 backdrop-blur-3xl p-10 flex flex-col items-center justify-center text-center space-y-4 shadow-2xl">
        <div className="p-4 rounded-full bg-white/10 border border-white/20 mb-2">
          <FileText className="w-8 h-8 text-blue-300" />
        </div>
        <h2 className="text-2xl font-semibold">Sign in to unlock Sub Gen</h2>
        <p className="text-sm md:text-base text-white/65 max-w-md">
          Login or create an account to create perfectly-timed SRT subtitle files from audio or video.
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
          <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-white">Sub Gen</h1>
              <button
                onClick={() => setShowHelp(true)}
                className="p-1.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg hover:bg-white/15 transition-all duration-300"
              >
                <HelpCircle className="w-4 h-4 text-white/60" />
              </button>
            </div>
            <p className="text-sm text-white/60">Create perfectly-timed SRT subtitle files</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
              Upload Audio or Video
            </label>
            {!mediaFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-400/50 hover:bg-white/5 transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
                }}
              >
                <Upload className="w-12 h-12 text-white/40 mx-auto mb-3" />
                <p className="text-white/70 mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-white/50">Video: MP4, WebM, OGG, MOV | Audio: MP3, WAV, OGG, M4A</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*,audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/8 border border-white/15 backdrop-blur-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      {mediaType === 'video' ? (
                        <Video className="w-5 h-5 text-blue-400" />
                      ) : (
                        <Music className="w-5 h-5 text-blue-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{mediaFile.name}</p>
                      <p className="text-xs text-white/50">
                        {(mediaFile.size / (1024 * 1024)).toFixed(2)} MB • {mediaType === 'video' ? 'Video' : 'Audio'}
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

                {mediaType === 'video' && mediaUrl && (
                  <div className="rounded-xl bg-white/8 border border-white/15 backdrop-blur-xl overflow-hidden">
                    <video
                      ref={videoRef}
                      src={mediaUrl}
                      controls
                      className="w-full h-auto"
                    />
                  </div>
                )}

                {mediaType === 'audio' && mediaUrl && (
                  <div className="p-6 rounded-xl bg-white/8 border border-white/15 backdrop-blur-xl">
                    <audio
                      ref={audioRef}
                      src={mediaUrl}
                      controls
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            )}
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
            disabled={isProcessing || !mediaFile}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-500/90 to-cyan-500/90 backdrop-blur-2xl text-white font-medium rounded-full hover:from-blue-600 hover:to-cyan-600 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 flex items-center justify-center space-x-2 shadow-xl shadow-blue-500/40 border border-blue-400/40"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating SRT...</span>
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                <span>Generate SRT</span>
              </>
            )}
          </button>

          {srtContent && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg hover:bg-white/15 transition-all duration-300 flex items-center justify-center gap-2 text-sm"
              >
                <Eye className="w-4 h-4 text-blue-400" />
                <span>{showPreview ? 'Hide' : 'Show'} Preview</span>
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg hover:bg-white/15 transition-all duration-300 flex items-center justify-center gap-2 text-sm"
              >
                <Download className="w-4 h-4 text-blue-400" />
                <span>Download SRT</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {showPreview && subtitleEntries.length > 0 && (
        <div className="rounded-[2.5rem] border border-white/15 bg-white/6 backdrop-blur-3xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">SRT Preview</h2>
            <button
              onClick={() => setShowPreview(false)}
              className="p-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg hover:bg-white/15 transition-all duration-300"
            >
              <X className="w-4 h-4 text-white/70" />
            </button>
          </div>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {subtitleEntries.slice(0, 50).map((entry) => (
              <div
                key={entry.id}
                className="p-4 rounded-xl bg-white/8 border border-white/15 backdrop-blur-xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.05) 100%)'
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/50">#{entry.id}</span>
                  <span className="text-xs text-white/50 font-mono">
                    {entry.startTime} → {entry.endTime}
                  </span>
                </div>
                <p className="text-sm text-white/90 whitespace-pre-wrap">{entry.text}</p>
              </div>
            ))}
            {subtitleEntries.length > 50 && (
              <p className="text-xs text-white/50 text-center py-2">
                Showing first 50 entries of {subtitleEntries.length} total
              </p>
            )}
          </div>
        </div>
      )}

      <HelpDialog
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        title="How to Use Sub Gen"
        content={
          <>
            <p><strong>Step 1: Upload Media</strong></p>
            <p>Upload your audio or video file (MP3, WAV, OGG, M4A for audio; MP4, WebM, OGG, MOV for video) by clicking the upload area or dragging and dropping.</p>
            
            <p><strong>Step 2: Preview Media</strong></p>
            <p>Preview your uploaded media using the built-in player to ensure it's the correct file.</p>
            
            <p><strong>Step 3: Generate SRT</strong></p>
            <p>Click "Generate SRT" to process your media. The system will transcribe the audio and create timed subtitle entries.</p>
            
            <p><strong>Step 4: Preview & Download</strong></p>
            <p>Use the Preview button to review the generated subtitle entries. Each entry shows the ID, time codes, and text. Download the SRT file when ready.</p>
          </>
        }
      />
    </div>
  );
}
