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
  Mic2,
  LayoutGrid,
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

  // Edit workspace: split-screen
  const [editClipA, setEditClipA] = useState<number>(0);
  const [editClipB, setEditClipB] = useState<number>(1);
  const [isRendering, setIsRendering] = useState(false);
  const previewVideoARef = useRef<HTMLVideoElement>(null);
  const previewVideoBRef = useRef<HTMLVideoElement>(null);

  const baseUrl = getBackendUrl();
  const api = `${baseUrl}/api/viral-shorts`;

  useEffect(() => {
    return () => {
      Object.values(clipPreviewUrls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [clipPreviewUrls]);

  // When entering edit step, try to load previews for selected A/B so the 9:16 canvas can show them
  useEffect(() => {
    if (step !== 'edit' || !uploadId || clips.length === 0) return;
    if (!clipPreviewUrls[editClipA]) loadClipPreview(editClipA);
    if (!clipPreviewUrls[editClipB]) loadClipPreview(editClipB);
  }, [step, editClipA, editClipB]);

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

  const handleRenderSplitScreen = async () => {
    if (!uploadId || clips[editClipA] == null || clips[editClipB] == null) return;
    const a = clips[editClipA];
    const b = clips[editClipB];
    setIsRendering(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        uploadId,
        startA: String(a.startTime),
        endA: String(a.endTime),
        startB: String(b.startTime),
        endB: String(b.endTime),
      });
      const res = await fetch(`${api}/split-screen?${params}`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Render failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const aEl = document.createElement('a');
      aEl.href = url;
      aEl.download = 'viral_splitscreen_9x16.mp4';
      aEl.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Render failed');
    } finally {
      setIsRendering(false);
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
          <p className="text-white/80">Video uploaded. Run AI to detect viral moments (audio is sent to Gemini).</p>
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
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <LayoutGrid className="w-5 h-5" /> Clips ({clips.length})
            </h2>
<button
            type="button"
            onClick={() => setStep('edit')}
            className="py-2 px-4 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/15 flex items-center gap-2"
          >
              <Pencil className="w-4 h-4" /> Combine two clips (9:16)
            </button>
          </div>
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
                        setEditClipA(index);
                        setEditClipB(index === 0 ? 1 : 0);
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

      {/* Step: Edit workspace — 9:16 split-screen */}
      {step === 'edit' && (
        <div className="glass rounded-2xl p-6 md:p-8 space-y-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <LayoutGrid className="w-5 h-5" /> Vertical split-screen (9:16)
          </h2>
          <p className="text-white/70 text-sm">
            Pick any two segments to stack (top + bottom). Works for podcasts, events, interviews, or any content—one speaker or many.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Top half</label>
              <select
                value={editClipA}
                onChange={(e) => setEditClipA(Number(e.target.value))}
                className="w-full rounded-lg bg-white/10 border border-white/20 text-white px-3 py-2"
              >
                {clips.map((c, i) => (
                  <option key={i} value={i}>
                    Clip {i + 1}: {formatTime(c.startTime)}–{formatTime(c.endTime)} (score {Math.round(c.viralScore)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Bottom half</label>
              <select
                value={editClipB}
                onChange={(e) => setEditClipB(Number(e.target.value))}
                className="w-full rounded-lg bg-white/10 border border-white/20 text-white px-3 py-2"
              >
                {clips.map((c, i) => (
                  <option key={i} value={i}>
                    Clip {i + 1}: {formatTime(c.startTime)}–{formatTime(c.endTime)} (score {Math.round(c.viralScore)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 9:16 preview canvas: two stacked videos */}
          <div className="max-w-[280px] mx-auto">
            <div className="aspect-[9/16] rounded-xl overflow-hidden border-2 border-white/20 bg-black">
              <div className="h-1/2 w-full overflow-hidden flex items-center justify-center bg-gray-900">
                {clipPreviewUrls[editClipA] ? (
                  <video
                    ref={previewVideoARef}
                    src={clipPreviewUrls[editClipA]}
                    className="w-full h-full object-cover"
                    muted
                    loop
                    playsInline
                    onLoadedMetadata={() => loadClipPreview(editClipA)}
                  />
                ) : (
                  <div className="text-white/50 text-center p-2">
                    <Mic2 className="w-8 h-8 mx-auto mb-1" />
                    <span className="text-xs">Top — Load preview in Clips</span>
                  </div>
                )}
              </div>
              <div className="h-1/2 w-full overflow-hidden flex items-center justify-center bg-gray-800">
                {clipPreviewUrls[editClipB] ? (
                  <video
                    ref={previewVideoBRef}
                    src={clipPreviewUrls[editClipB]}
                    className="w-full h-full object-cover"
                    muted
                    loop
                    playsInline
                    onLoadedMetadata={() => loadClipPreview(editClipB)}
                  />
                ) : (
                  <div className="text-white/50 text-center p-2">
                    <Mic2 className="w-8 h-8 mx-auto mb-1" />
                    <span className="text-xs">Bottom — Load preview in Clips</span>
                  </div>
                )}
              </div>
            </div>
            <p className="text-center text-white/50 text-xs mt-2">9:16 preview</p>
          </div>

          <button
            type="button"
            onClick={handleRenderSplitScreen}
            disabled={isRendering || editClipA === editClipB}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-medium flex items-center justify-center gap-2"
          >
            {isRendering ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Rendering…
              </>
            ) : (
              <>Render & download 9:16 vertical</>
            )}
          </button>
          {editClipA === editClipB && (
            <p className="text-amber-300 text-sm text-center">Pick two different segments for top and bottom.</p>
          )}
          <button
            type="button"
            onClick={() => setStep('clips')}
            className="text-white/60 hover:text-white flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to clips
          </button>
        </div>
      )}
    </div>
  );
}
