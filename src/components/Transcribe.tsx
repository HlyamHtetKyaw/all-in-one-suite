import { useState, useRef, useEffect } from 'react';
import { Mic, Loader2, Upload, Download, AlertCircle, X, Video, Music, Copy, Check, HelpCircle } from 'lucide-react';
import HelpDialog from './HelpDialog';

interface TranscribeProps {
  isAuthenticated: boolean;
  onLoginClick: () => void;
}

export default function Transcribe({ isAuthenticated, onLoginClick }: TranscribeProps) {
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'video' | 'audio' | null>(null);
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
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
    setTranscribedText('');
  };

  const handleTranscribe = async () => {
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

      const response = await fetch('http://localhost:8080/api/transcribe/generate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to transcribe media');
      }

      const data = await response.json();
      setTranscribedText(data.text || data.transcription || '');
    } catch (err: any) {
      setError(err.message || 'Failed to transcribe media. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(transcribedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!transcribedText) return;

    const blob = new Blob([transcribedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcription-${Date.now()}.txt`;
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
    setTranscribedText('');
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
          <Mic className="w-8 h-8 text-indigo-300" />
        </div>
        <h2 className="text-2xl font-semibold">Sign in to unlock Transcribe</h2>
        <p className="text-sm md:text-base text-white/65 max-w-md">
          Login or create an account to transcribe audio or video to text.
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
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl">
            <Mic className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-white">Transcribe</h1>
              <button
                onClick={() => setShowHelp(true)}
                className="p-1.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg hover:bg-white/15 transition-all duration-300"
              >
                <HelpCircle className="w-4 h-4 text-white/60" />
              </button>
            </div>
            <p className="text-sm text-white/60">Convert audio or video to text</p>
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
                className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center cursor-pointer hover:border-indigo-400/50 hover:bg-white/5 transition-all duration-300"
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
                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                      {mediaType === 'video' ? (
                        <Video className="w-5 h-5 text-indigo-400" />
                      ) : (
                        <Music className="w-5 h-5 text-indigo-400" />
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
            onClick={handleTranscribe}
            disabled={isProcessing || !mediaFile}
            className="w-full px-6 py-4 bg-gradient-to-r from-indigo-500/90 to-blue-500/90 backdrop-blur-2xl text-white font-medium rounded-full hover:from-indigo-600 hover:to-blue-600 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 flex items-center justify-center space-x-2 shadow-xl shadow-indigo-500/40 border border-indigo-400/40"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Transcribing...</span>
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                <span>Transcribe to Text</span>
              </>
            )}
          </button>
        </div>
      </div>

      {transcribedText && (
        <div className="rounded-[2.5rem] border border-white/15 bg-white/6 backdrop-blur-3xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Transcribed Text</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg hover:bg-white/15 transition-all duration-300 flex items-center gap-2 text-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-indigo-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-indigo-400" />
                    <span>Copy</span>
                  </>
                )}
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg hover:bg-white/15 transition-all duration-300 flex items-center gap-2 text-sm"
              >
                <Download className="w-4 h-4 text-indigo-400" />
                <span>Download</span>
              </button>
            </div>
          </div>
          <div className="p-6 rounded-xl bg-white/8 border border-white/15 backdrop-blur-xl max-h-[600px] overflow-y-auto">
            <p className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">
              {transcribedText}
            </p>
          </div>
        </div>
      )}

      <HelpDialog
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        title="How to Use Transcribe"
        content={
          <>
            <p><strong>Step 1: Upload Media</strong></p>
            <p>Upload your audio or video file (MP3, WAV, OGG, M4A for audio; MP4, WebM, OGG, MOV for video) by clicking the upload area or dragging and dropping.</p>
            
            <p><strong>Step 2: Preview Media</strong></p>
            <p>Preview your uploaded media using the built-in player to ensure it's the correct file.</p>
            
            <p><strong>Step 3: Transcribe</strong></p>
            <p>Click "Transcribe" to process your media. The system will convert the audio to plain text transcription.</p>
            
            <p><strong>Step 4: Copy or Download</strong></p>
            <p>Use the Copy button to copy the transcribed text to your clipboard, or download it as a .txt file.</p>
          </>
        }
      />
    </div>
  );
}
