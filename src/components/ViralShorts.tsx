import { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Loader2,
  Sparkles,
  Download,
  Pencil,
  Play,
  ArrowLeft,
  Film,
  LayoutGrid,
  Type,
} from 'lucide-react';

const getBackendUrl = () =>
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_BACKEND_URL) ||
  'http://localhost:8080';

export interface ViralClipDto {
  startTime: number;
  endTime: number;
  viralScore: number;
  briefDescription: string;
}

interface ViralShortsProps {
  isAuthenticated: boolean;
  onLoginClick: () => void;
}

type Step = 'upload' | 'analyze' | 'clips' | 'edit';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ViralShorts({ isAuthenticated, onLoginClick }: ViralShortsProps) {
  const [step, setStep] = useState<Step>('upload');
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [clips, setClips] = useState<ViralClipDto[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clipPreviewUrls, setClipPreviewUrls] = useState<Record<number, string>>({});
  const [downloadingClip, setDownloadingClip] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit workspace: single clip
  const [editingClipIndex, setEditingClipIndex] = useState<number>(0);
  const editVideoRef = useRef<HTMLVideoElement>(null);

  const baseUrl = getBackendUrl();
  const api = `${baseUrl}/api/viral-shorts`;

  useEffect(() => {
    return () => {
      Object.values(clipPreviewUrls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [clipPreviewUrls]);

  // When entering edit step, load the clip being edited
  useEffect(() => {
    if (step !== 'edit' || clips.length === 0) return;
    if (!clipPreviewUrls[editingClipIndex]) loadClipPreview(editingClipIndex);
  }, [step, editingClipIndex]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const valid = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'].includes(file.type);
    if (!valid) {
      setError('Please choose an MP4 or WebM video (max 1 hour 30 min).');
      return;
    }
    setVideoFile(file);
    setFilename(file.name);
    setError(null);
  };

  const handleUpload = async () => {
    if (!videoFile) {
      setError('Select a video file first.');
      return;
    }
    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      const res = await fetch(`${api}/upload`, { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Upload failed');
      }
      const data = await res.json();
      setUploadId(data.uploadId);
      setStep('analyze');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!uploadId) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const res = await fetch(`${api}/analyze?uploadId=${encodeURIComponent(uploadId)}`, {
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Analysis failed');
      }
      const data = await res.json();
      setClips(data.clips || []);
      setStep('clips');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadClipPreview = async (index: number) => {
    if (!uploadId || !clips[index]) return;
    const clip = clips[index];
    try {
      const params = new URLSearchParams({
        uploadId,
        startTime: String(clip.startTime),
        endTime: String(clip.endTime),
      });
      const res = await fetch(`${api}/trim?${params}`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError((err as { error?: string }).error || 'Preview failed');
        return;
      }
      const blob = await res.blob();
      if (!blob.type.startsWith('video/')) {
        setError('Preview failed: server did not return video');
        return;
      }
      const url = URL.createObjectURL(blob);
      setClipPreviewUrls((prev) => {
        if (prev[index]) URL.revokeObjectURL(prev[index]);
        return { ...prev, [index]: url };
      });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Preview failed');
    }
  };

  const handleDownloadClip = async (index: number) => {
    if (!uploadId || !clips[index]) return;
    setDownloadingClip(index);
    setError(null);
    const clip = clips[index];
    try {
      const params = new URLSearchParams({
        uploadId,
        startTime: String(clip.startTime),
        endTime: String(clip.endTime),
      });
      const res = await fetch(`${api}/trim?${params}`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || 'Download failed');
      }
      const blob = await res.blob();
      if (!blob.type.startsWith('video/')) {
        throw new Error('Server did not return video');
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `viral_clip_${index + 1}_${formatTime(clip.startTime)}-${formatTime(clip.endTime)}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Download failed');
    } finally {
      setDownloadingClip(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-white/10 border border-white/20">
          <Film className="w-8 h-8 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Viral Shorts</h1>
          <p className="text-white/70 mt-1">
            Upload long-form video up to 1 hour 30 min (e.g. podcast, event, interview). AI finds viral moments; trim, preview, download, or combine any two segments into a 9:16 vertical.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/20 border border-red-400/40 text-red-200 px-4 py-3 flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-red-300 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Step: Upload */}
      {step === 'upload' && (
        <div className="glass rounded-2xl p-6 md:p-8 space-y-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Upload className="w-5 h-5" /> Upload long-form video
          </h2>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/25 rounded-xl p-8 text-center cursor-pointer hover:border-amber-500/50 hover:bg-white/5 transition"
          >
            {videoFile ? (
              <p className="text-white font-medium">{filename}</p>
            ) : (
              <p className="text-white/70">Click or drop a video (MP4/WebM, max 1 hour 30 min)</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!videoFile || isUploading}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-medium flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Uploading…
              </>
            ) : (
              <>Upload & continue</>
            )}
          </button>
        </div>
      )}

      {/* Step: Analyze */}
      {step === 'analyze' && (
        <div className="glass rounded-2xl p-6 md:p-8 space-y-6">
          <p className="text-white/80">Video uploaded. Run AI to detect viral moments.</p>
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full py-3 rounded-xl bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white font-medium flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Analyzing…
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" /> Analyze for viral clips
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setStep('upload')}
            className="text-white/60 hover:text-white flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>
      )}

      {/* Step: Clip selection */}
      {step === 'clips' && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <LayoutGrid className="w-5 h-5" /> Clips ({clips.length})
            </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clips.map((clip, index) => (
              <div
                key={index}
                className="glass rounded-xl overflow-hidden border border-white/15"
              >
                <div className="aspect-video bg-black/40 relative">
                  {clipPreviewUrls[index] ? (
                    <video
                      src={clipPreviewUrls[index]}
                      controls
                      className="w-full h-full object-contain"
                      preload="metadata"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/60">
                      <Play className="w-10 h-10" />
                      <button
                        type="button"
                        onClick={() => loadClipPreview(index)}
                        className="text-sm text-amber-400 hover:text-amber-300"
                      >
                        Load preview
                      </button>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/60 text-xs text-white">
                    {formatTime(clip.startTime)} – {formatTime(clip.endTime)}
                  </div>
                  <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-amber-500/80 text-xs font-medium text-black">
                    Score: {Math.round(clip.viralScore)}
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <p className="text-sm text-white/90 line-clamp-2">{clip.briefDescription}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadClip(index)}
                      disabled={downloadingClip === index}
                      className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {downloadingClip === index ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      Download
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingClipIndex(index);
                        setStep('edit');
                      }}
                      className="py-2 px-4 rounded-lg bg-white/10 border border-white/20 text-white text-sm hover:bg-white/15 flex items-center gap-2"
                    >
                      <Pencil className="w-4 h-4" /> Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setStep('analyze')}
            className="text-white/60 hover:text-white flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>
      )}

      {/* Step: Edit workspace — single clip, subtitles (Burmese), style */}
      {step === 'edit' && clips[editingClipIndex] != null && (
        <div className="glass rounded-2xl p-6 md:p-8 space-y-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Pencil className="w-5 h-5" /> Edit clip
          </h2>

          {/* Video to edit */}
          <div className="rounded-xl overflow-hidden border border-white/20 bg-black aspect-video max-w-2xl">
            {clipPreviewUrls[editingClipIndex] ? (
              <video
                ref={editVideoRef}
                src={clipPreviewUrls[editingClipIndex]}
                controls
                className="w-full h-full object-contain"
                preload="metadata"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-white/50 gap-2">
                <Play className="w-12 h-12" />
                <button type="button" onClick={() => loadClipPreview(editingClipIndex)} className="text-amber-400 hover:text-amber-300 text-sm">
                  Load video preview
                </button>
              </div>
            )}
          </div>

          {/* AI description (Burmese) */}
          <div className="rounded-xl bg-white/5 border border-white/15 p-4">
            <p className="text-xs uppercase tracking-wider text-white/60 mb-2 flex items-center gap-2">
              <Type className="w-4 h-4" /> AI ရွေးချယ်ထားသော ဖော်ပြချက်
            </p>
            <p className="text-white/90 leading-relaxed">{clips[editingClipIndex].briefDescription}</p>
          </div>

          <button type="button" onClick={() => setStep('clips')} className="text-white/60 hover:text-white flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to clips
          </button>
        </div>
      )}
    </div>
  );
}
