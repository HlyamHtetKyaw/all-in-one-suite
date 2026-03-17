import { useState, useRef, useEffect } from 'react';
import { Scissors, Loader2, AlertCircle, Upload, Download, X, Video, Play, Pause, Type, Filter, Sliders, Zap, Save, HelpCircle } from 'lucide-react';
import HelpDialog from './HelpDialog';

interface MasterEditorProps {
  isAuthenticated: boolean;
  onLoginClick: () => void;
}

const EDITING_TOOLS = [
  { id: 'trim', label: 'Trim', description: 'Cut and trim video', icon: Scissors },
  { id: 'text', label: 'Add Text', description: 'Add text overlays', icon: Type },
  { id: 'filters', label: 'Filters', description: 'Apply video filters', icon: Filter },
  { id: 'adjust', label: 'Adjust', description: 'Brightness, contrast', icon: Sliders },
  { id: 'speed', label: 'Speed', description: 'Change playback speed', icon: Zap },
];

const FILTERS = [
  { id: 'none', label: 'None', description: 'No filter' },
  { id: 'vintage', label: 'Vintage', description: 'Classic film look' },
  { id: 'blackwhite', label: 'B&W', description: 'Black and white' },
  { id: 'warm', label: 'Warm', description: 'Warm tones' },
  { id: 'cool', label: 'Cool', description: 'Cool tones' },
  { id: 'dramatic', label: 'Dramatic', description: 'High contrast' },
];

const SPEED_OPTIONS = [
  { id: '0.25x', label: '0.25x', value: 0.25 },
  { id: '0.5x', label: '0.5x', value: 0.5 },
  { id: '0.75x', label: '0.75x', value: 0.75 },
  { id: '1x', label: '1x', value: 1 },
  { id: '1.25x', label: '1.25x', value: 1.25 },
  { id: '1.5x', label: '1.5x', value: 1.5 },
  { id: '2x', label: '2x', value: 2 },
];

const EXPORT_FORMATS = [
  { id: 'mp4', label: 'MP4', description: 'Standard video' },
  { id: 'webm', label: 'WebM', description: 'Web optimized' },
  { id: 'mov', label: 'MOV', description: 'QuickTime' },
];

const QUALITY_OPTIONS = [
  { id: '1080p', label: '1080p', description: 'Full HD' },
  { id: '720p', label: '720p', description: 'HD' },
  { id: '480p', label: '480p', description: 'SD' },
];

export default function MasterEditor({ isAuthenticated, onLoginClick }: MasterEditorProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [speed, setSpeed] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [textOverlay, setTextOverlay] = useState('');
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [exportFormat, setExportFormat] = useState('mp4');
  const [quality, setQuality] = useState('1080p');
  const [editedVideoUrl, setEditedVideoUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
    setEditedVideoUrl(null);
    setProgress(0);
    setActiveTool(null);
    setSelectedFilter('none');
    setSpeed(1);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setTextOverlay('');
    setTrimStart(0);
    setTrimEnd(0);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const videoDuration = videoRef.current.duration;
      setDuration(videoDuration);
      setTrimEnd(videoDuration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const togglePlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleExport = async () => {
    if (!videoFile) {
      setError('Please upload a video file first');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', videoFile);
      formData.append('filter', selectedFilter);
      formData.append('speed', speed.toString());
      formData.append('brightness', brightness.toString());
      formData.append('contrast', contrast.toString());
      formData.append('saturation', saturation.toString());
      formData.append('textOverlay', textOverlay);
      formData.append('trimStart', trimStart.toString());
      formData.append('trimEnd', trimEnd.toString());
      formData.append('exportFormat', exportFormat);
      formData.append('quality', quality);

      const response = await fetch('http://localhost:8080/api/master-editor/export', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to export video');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setEditedVideoUrl(url);
      setProgress(100);
    } catch (err: any) {
      setError(err.message || 'Failed to export video. Please try again.');
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!editedVideoUrl) return;

    const a = document.createElement('a');
    a.href = editedVideoUrl;
    const extension = exportFormat === 'mp4' ? '.mp4' : exportFormat === 'webm' ? '.webm' : '.mov';
    a.download = `edited-video-${Date.now()}${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleRemoveFile = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoUrl(null);
    setVideoFile(null);
    setEditedVideoUrl(null);
    setError(null);
    setProgress(0);
    setActiveTool(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setTrimStart(0);
    setTrimEnd(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (videoRef.current) {
      videoRef.current.src = '';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getFilterStyle = () => {
    const filters: string[] = [];
    filters.push(`brightness(${brightness}%)`);
    filters.push(`contrast(${contrast}%)`);
    filters.push(`saturate(${saturation}%)`);
    
    if (selectedFilter === 'vintage') {
      filters.push('sepia(0.5) contrast(1.2)');
    } else if (selectedFilter === 'blackwhite') {
      filters.push('grayscale(100%)');
    } else if (selectedFilter === 'warm') {
      filters.push('sepia(0.3) saturate(1.2)');
    } else if (selectedFilter === 'cool') {
      filters.push('hue-rotate(180deg) saturate(0.8)');
    } else if (selectedFilter === 'dramatic') {
      filters.push('contrast(1.5) brightness(0.9)');
    }
    
    return filters.join(' ');
  };

  if (!isAuthenticated) {
    return (
      <section className="mt-6 rounded-[2.5rem] border border-white/15 bg-white/6 backdrop-blur-3xl p-10 flex flex-col items-center justify-center text-center space-y-4 shadow-2xl">
        <div className="p-4 rounded-full bg-white/10 border border-white/20 mb-2">
          <Scissors className="w-8 h-8 text-slate-300" />
        </div>
        <h2 className="text-2xl font-semibold">Sign in to unlock Master Editor</h2>
        <p className="text-sm md:text-base text-white/65 max-w-md">
          Login or create an account to use browser-based video editing.
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
          <div className="p-3 bg-gradient-to-br from-slate-800 to-slate-600 rounded-2xl">
            <Scissors className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-white">Master Editor</h1>
              <button
                onClick={() => setShowHelp(true)}
                className="p-1.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg hover:bg-white/15 transition-all duration-300"
              >
                <HelpCircle className="w-4 h-4 text-white/60" />
              </button>
            </div>
            <p className="text-sm text-white/60">Browser-based video editing</p>
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
                className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center cursor-pointer hover:border-slate-400/50 hover:bg-white/5 transition-all duration-300"
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
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/8 border border-white/15 backdrop-blur-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-500/20 rounded-lg">
                      <Video className="w-5 h-5 text-slate-400" />
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

                <div className="rounded-xl bg-white/8 border border-white/15 backdrop-blur-xl overflow-hidden relative">
                  <video
                    ref={videoRef}
                    src={videoUrl || undefined}
                    className="w-full h-auto"
                    style={{ filter: getFilterStyle() }}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    key={videoUrl}
                  />
                  {textOverlay && (
                    <div className="absolute top-4 left-4 right-4 text-white text-xl font-bold drop-shadow-lg">
                      {textOverlay}
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <button
                        onClick={togglePlayback}
                        className="p-2 bg-white/20 backdrop-blur-xl rounded-full border border-white/30 hover:bg-white/30 transition-all"
                      >
                        {isPlaying ? (
                          <Pause className="w-4 h-4 text-white" />
                        ) : (
                          <Play className="w-4 h-4 text-white" />
                        )}
                      </button>
                      <span className="text-xs text-white/80 font-mono">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                      <div className="flex-1 relative">
                        <input
                          type="range"
                          min="0"
                          max={duration || 0}
                          value={currentTime}
                          onChange={handleSeek}
                          className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer relative z-10"
                          style={{
                            background: `linear-gradient(to right, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.5) ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.2) ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.2) 100%)`
                          }}
                        />
                        {activeTool === 'trim' && duration > 0 && (
                          <>
                            <div
                              className="absolute bottom-0 h-1 bg-slate-400/50 rounded-full pointer-events-none"
                              style={{
                                left: `${(trimStart / duration) * 100}%`,
                                width: `${((trimEnd - trimStart) / duration) * 100}%`
                              }}
                            />
                            <div
                              className="absolute bottom-0 w-0.5 h-3 bg-slate-300 pointer-events-none"
                              style={{ left: `${(trimStart / duration) * 100}%` }}
                            />
                            <div
                              className="absolute bottom-0 w-0.5 h-3 bg-slate-300 pointer-events-none"
                              style={{ left: `${(trimEnd / duration) * 100}%` }}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {videoFile && (
            <>
              <div>
                <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
                  Editing Tools
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {EDITING_TOOLS.map((tool) => {
                    const Icon = tool.icon;
                    const isActive = activeTool === tool.id;
                    return (
                      <button
                        key={tool.id}
                        onClick={() => setActiveTool(isActive ? null : tool.id)}
                        className={`p-3 rounded-xl border backdrop-blur-xl text-center transition-all duration-300 ${
                          isActive
                            ? 'bg-slate-500/20 border-slate-400/50 shadow-lg shadow-slate-500/20'
                            : 'bg-white/8 border-white/15 hover:bg-white/12'
                        }`}
                        style={{
                          background: isActive
                            ? 'linear-gradient(135deg, rgba(71,85,105,0.2) 0%, rgba(51,65,85,0.15) 100%)'
                            : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.05) 100%)'
                        }}
                      >
                        <Icon className={`w-5 h-5 mx-auto mb-1 ${isActive ? 'text-slate-300' : 'text-white/70'}`} />
                        <p className="text-xs font-medium text-white">{tool.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {activeTool === 'trim' && (
                <div className="p-4 rounded-xl bg-white/8 border border-white/15 backdrop-blur-xl space-y-4">
                  <div>
                    <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
                      Trim Start: {formatTime(trimStart)}
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max={duration || 0}
                        value={trimStart}
                        onChange={(e) => {
                          const newStart = parseFloat(e.target.value);
                          if (newStart < trimEnd) {
                            setTrimStart(newStart);
                            if (videoRef.current) {
                              videoRef.current.currentTime = newStart;
                            }
                          }
                        }}
                        className="flex-1 h-2 bg-white/10 rounded-full appearance-none cursor-pointer"
                      />
                      <button
                        onClick={() => {
                          setTrimStart(currentTime);
                          if (currentTime < trimEnd) {
                            if (videoRef.current) {
                              videoRef.current.currentTime = currentTime;
                            }
                          }
                        }}
                        className="px-3 py-1.5 bg-slate-500/20 border border-slate-400/30 rounded-lg hover:bg-slate-500/30 transition-all text-xs text-white"
                      >
                        Set to Current
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
                      Trim End: {formatTime(trimEnd)}
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max={duration || 0}
                        value={trimEnd}
                        onChange={(e) => {
                          const newEnd = parseFloat(e.target.value);
                          if (newEnd > trimStart) {
                            setTrimEnd(newEnd);
                            if (videoRef.current) {
                              videoRef.current.currentTime = newEnd;
                            }
                          }
                        }}
                        className="flex-1 h-2 bg-white/10 rounded-full appearance-none cursor-pointer"
                      />
                      <button
                        onClick={() => {
                          setTrimEnd(currentTime);
                          if (currentTime > trimStart) {
                            if (videoRef.current) {
                              videoRef.current.currentTime = currentTime;
                            }
                          }
                        }}
                        className="px-3 py-1.5 bg-slate-500/20 border border-slate-400/30 rounded-lg hover:bg-slate-500/30 transition-all text-xs text-white"
                      >
                        Set to Current
                      </button>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Trim Duration:</span>
                      <span className="text-white font-medium">{formatTime(trimEnd - trimStart)}</span>
                    </div>
                    <div className="mt-2 p-3 rounded-lg bg-slate-500/10 border border-slate-400/20">
                      <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="absolute h-full bg-gradient-to-r from-slate-500 to-slate-400"
                          style={{
                            left: `${(trimStart / (duration || 1)) * 100}%`,
                            width: `${((trimEnd - trimStart) / (duration || 1)) * 100}%`
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-white/50 mt-1">
                        <span>{formatTime(trimStart)}</span>
                        <span>{formatTime(trimEnd)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTool === 'text' && (
                <div className="p-4 rounded-xl bg-white/8 border border-white/15 backdrop-blur-xl">
                  <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
                    Text Overlay
                  </label>
                  <input
                    type="text"
                    value={textOverlay}
                    onChange={(e) => setTextOverlay(e.target.value)}
                    placeholder="Enter text to overlay on video"
                    className="w-full px-4 py-3 bg-white/8 backdrop-blur-xl border border-white/15 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-slate-400/50 focus:bg-white/12 transition-all duration-300"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.05) 100%)'
                    }}
                  />
                </div>
              )}

              {activeTool === 'filters' && (
                <div className="p-4 rounded-xl bg-white/8 border border-white/15 backdrop-blur-xl">
                  <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
                    Video Filters
                  </label>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {FILTERS.map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => setSelectedFilter(filter.id)}
                        className={`p-3 rounded-xl border backdrop-blur-xl text-center transition-all duration-300 ${
                          selectedFilter === filter.id
                            ? 'bg-slate-500/20 border-slate-400/50 shadow-lg shadow-slate-500/20'
                            : 'bg-white/8 border-white/15 hover:bg-white/12'
                        }`}
                        style={{
                          background: selectedFilter === filter.id
                            ? 'linear-gradient(135deg, rgba(71,85,105,0.2) 0%, rgba(51,65,85,0.15) 100%)'
                            : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.05) 100%)'
                        }}
                      >
                        <p className="text-sm font-medium text-white">{filter.label}</p>
                        <p className="text-xs text-white/50 mt-1">{filter.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTool === 'adjust' && (
                <div className="p-4 rounded-xl bg-white/8 border border-white/15 backdrop-blur-xl space-y-4">
                  <div>
                    <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
                      Brightness: {brightness}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={brightness}
                      onChange={(e) => setBrightness(parseInt(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
                      Contrast: {contrast}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={contrast}
                      onChange={(e) => setContrast(parseInt(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
                      Saturation: {saturation}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={saturation}
                      onChange={(e) => setSaturation(parseInt(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {activeTool === 'speed' && (
                <div className="p-4 rounded-xl bg-white/8 border border-white/15 backdrop-blur-xl">
                  <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
                    Playback Speed
                  </label>
                  <div className="grid grid-cols-7 gap-2">
                    {SPEED_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setSpeed(option.value);
                          if (videoRef.current) {
                            videoRef.current.playbackRate = option.value;
                          }
                        }}
                        className={`p-2 rounded-xl border backdrop-blur-xl text-center transition-all duration-300 ${
                          speed === option.value
                            ? 'bg-slate-500/20 border-slate-400/50 shadow-lg shadow-slate-500/20'
                            : 'bg-white/8 border-white/15 hover:bg-white/12'
                        }`}
                        style={{
                          background: speed === option.value
                            ? 'linear-gradient(135deg, rgba(71,85,105,0.2) 0%, rgba(51,65,85,0.15) 100%)'
                            : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.05) 100%)'
                        }}
                      >
                        <p className="text-xs font-medium text-white">{option.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
                    Export Format
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {EXPORT_FORMATS.map((format) => (
                      <button
                        key={format.id}
                        onClick={() => setExportFormat(format.id)}
                        className={`p-3 rounded-xl border backdrop-blur-xl text-center transition-all duration-300 ${
                          exportFormat === format.id
                            ? 'bg-slate-500/20 border-slate-400/50 shadow-lg shadow-slate-500/20'
                            : 'bg-white/8 border-white/15 hover:bg-white/12'
                        }`}
                        style={{
                          background: exportFormat === format.id
                            ? 'linear-gradient(135deg, rgba(71,85,105,0.2) 0%, rgba(51,65,85,0.15) 100%)'
                            : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.05) 100%)'
                        }}
                      >
                        <p className="text-sm font-medium text-white">{format.label}</p>
                        <p className="text-xs text-white/50 mt-1">{format.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
                    Quality
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {QUALITY_OPTIONS.map((q) => (
                      <button
                        key={q.id}
                        onClick={() => setQuality(q.id)}
                        className={`p-3 rounded-xl border backdrop-blur-xl text-center transition-all duration-300 ${
                          quality === q.id
                            ? 'bg-slate-500/20 border-slate-400/50 shadow-lg shadow-slate-500/20'
                            : 'bg-white/8 border-white/15 hover:bg-white/12'
                        }`}
                        style={{
                          background: quality === q.id
                            ? 'linear-gradient(135deg, rgba(71,85,105,0.2) 0%, rgba(51,65,85,0.15) 100%)'
                            : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.05) 100%)'
                        }}
                      >
                        <p className="text-sm font-medium text-white">{q.label}</p>
                        <p className="text-xs text-white/50 mt-1">{q.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>Exporting video...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-slate-600 to-slate-500 transition-all duration-300"
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
                onClick={handleExport}
                disabled={isProcessing || !videoFile}
                className="w-full px-6 py-4 bg-gradient-to-r from-slate-700/90 to-slate-600/90 backdrop-blur-2xl text-white font-medium rounded-full hover:from-slate-600 hover:to-slate-500 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 flex items-center justify-center space-x-2 shadow-xl shadow-slate-500/40 border border-slate-400/40"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Exporting video...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Export Video</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {editedVideoUrl && (
        <div className="rounded-[2.5rem] border border-white/15 bg-white/6 backdrop-blur-3xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Exported Video</h2>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg hover:bg-white/15 transition-all duration-300 flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>Download</span>
            </button>
          </div>
          <div className="rounded-xl bg-white/8 border border-white/15 backdrop-blur-xl overflow-hidden">
            <video
              src={editedVideoUrl}
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
        title="How to Use Master Editor"
        content={
          <>
            <p><strong>Step 1: Upload Video</strong></p>
            <p>Upload your video file (MP4, WebM, OGG, MOV) by clicking the upload area or dragging and dropping.</p>
            
            <p><strong>Step 2: Use Editing Tools</strong></p>
            <p>Click on any editing tool to activate it:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><strong>Trim:</strong> Set start and end times to cut your video. Use sliders or "Set to Current" buttons.</li>
              <li><strong>Add Text:</strong> Enter text to overlay on your video.</li>
              <li><strong>Filters:</strong> Apply visual filters (Vintage, B&W, Warm, Cool, Dramatic, or None).</li>
              <li><strong>Adjust:</strong> Use sliders to adjust brightness, contrast, and saturation.</li>
              <li><strong>Speed:</strong> Change playback speed from 0.25x to 2x.</li>
            </ul>
            
            <p><strong>Step 3: Preview Changes</strong></p>
            <p>All changes are applied in real-time. Use the video player to preview your edits.</p>
            
            <p><strong>Step 4: Export</strong></p>
            <p>Select export format (MP4, WebM, MOV) and quality (1080p, 720p, 480p), then click "Export Video" to download your edited video.</p>
          </>
        }
      />
    </div>
  );
}
