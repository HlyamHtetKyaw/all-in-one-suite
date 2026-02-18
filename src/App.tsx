import React, { useState, useRef, useEffect } from 'react';
import { Upload, Play, Pause, Type, Move, Mic, Wand2, Download, Trash2, Languages, AlertCircle, FileVideo, Loader2 } from 'lucide-react';

// -------------------------------------------------------------------------
// INSTRUCTION: SETUP FOR LOCAL DEVELOPMENT (FFMPEG.WASM)
// -------------------------------------------------------------------------
//
// 1. Install dependencies:
//    npm install @ffmpeg/ffmpeg @ffmpeg/util
//
// 2. UNCOMMENT imports below for local use:
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
//
// 3. IMPORTANT: Update your `vite.config.ts` to fix the "Worker" and "Header" errors:
//
//    export default defineConfig({
//      plugins: [react()],
//      optimizeDeps: {
//        exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'], // <--- Fixes "disallowed MIME type" / worker loading error
//      },
//      server: {
//        headers: {
//          'Cross-Origin-Opener-Policy': 'same-origin',      // <--- Required for SharedArrayBuffer
//          'Cross-Origin-Embedder-Policy': 'require-corp',   // <--- Required for SharedArrayBuffer
//        },
//      },
//    });
// -------------------------------------------------------------------------

// --- Types ---
interface Subtitle {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
}

// --- Mock Data ---
const MOCK_GENERATED_SUBTITLES: Subtitle[] = [
  { id: '1', startTime: 1, endTime: 3, text: "Welcome to this video tutorial.", x: 50, y: 80 },
  { id: '2', startTime: 3.5, endTime: 6, text: "We are going to learn about React.", x: 50, y: 80 },
  { id: '3', startTime: 6.5, endTime: 9, text: "It's really cool and easy to use.", x: 50, y: 80 },
  { id: '4', startTime: 9.5, endTime: 12, text: "Let's dive right in!", x: 50, y: 80 },
];

export default function Main() {
  // --- State ---
  const [videoFile, setVideoFile] = useState<File | null>(null); // Store the actual file for conversion
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [selectedSubtitleId, setSelectedSubtitleId] = useState<string | null>(null);
  
  // Processing States
  const [isProcessing, setIsProcessing] = useState<boolean>(false); // For Transcription
  const [isConverting, setIsConverting] = useState<boolean>(false); // For Video Conversion
  const [conversionProgress, setConversionProgress] = useState<string>('0%');
  
  const [error, setError] = useState<string | null>(null);

  // --- Refs ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  
  // UNCOMMENT LOCALLY:
  const ffmpegRef = useRef(new FFmpeg());
  // const ffmpegRef = useRef<any>(null); // Placeholder for preview environment

  // --- Cleanup Effect ---
  useEffect(() => {
    return () => {
      if (videoSrc) URL.revokeObjectURL(videoSrc);
    };
  }, [videoSrc]);

  // --- Handlers ---

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setError(null);
      setVideoFile(file); // Save file for potential conversion
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setSubtitles([]); 
      setCurrentTime(0);
      setIsPlaying(false);
      setIsConverting(false);
    }
  };

  const handleVideoError = () => {
    // Determine if it's a format issue we can likely fix
    if (videoFile) {
        setError("FORMAT_ERROR"); // Special code to trigger the Convert UI
    } else {
        setError("Error loading video.");
    }
    setIsPlaying(false);
  };

  // --- Video Conversion Logic ---
  const handleConvertVideo = async () => {
    if (!videoFile) return;
    
    setIsConverting(true);
    setConversionProgress('Starting...');

    try {
      const ffmpeg = ffmpegRef.current;
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      
      // 1. Load FFmpeg if not loaded
      if (!ffmpeg.loaded) {
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
      }

      // 2. Write file to memory
      await ffmpeg.writeFile('input_video', await fetchFile(videoFile));

      // 3. Monitor progress
      ffmpeg.on('progress', ({ progress }) => {
        setConversionProgress(`${Math.round(progress * 100)}%`);
      });
      
      // 4. Run conversion: OPTIMIZED FOR SPEED
      // -preset ultrafast: Sacrifices compression ratio for pure speed (critical for browser)
      // -crf 28: Lower quality (but fine for preview), faster encoding
      await ffmpeg.exec([
        '-i', 'input_video', 
        '-c:v', 'libx264', 
        '-preset', 'ultrafast',
        '-crf', '28',
        '-c:a', 'aac', 
        'output.mp4'
      ]);

      // 5. Read result
      const data = await ffmpeg.readFile('output.mp4');
      
      // 6. Update Video Source
      const newUrl = URL.createObjectURL(
        new Blob([(data as Uint8Array).buffer], { type: 'video/mp4' })
      );
      setVideoSrc(newUrl);
      setError(null); // Clear error only after successful conversion

      // Remove this alert locally:
      // alert("Conversion logic is commented out to prevent Preview crashes. Please uncomment the block in handleConvertVideo locally.");
      
    } catch (e) {
      console.error("Conversion failed:", e);
      alert("Conversion failed. Check console for details.");
    } finally {
      setIsConverting(false);
    }
  };

  const togglePlay = () => {
    if (videoRef.current && !error && !isConverting) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(e => {
            console.error("Playback failed:", e);
        });
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setError(null);
    }
  };

  // --- AI Transcription Logic ---
  const handleTranscribe = async () => {
    if (!videoSrc) return;
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); 
      setSubtitles(MOCK_GENERATED_SUBTITLES);
    } catch (err) {
      console.error("Transcription failed", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const updateSubtitle = <K extends keyof Subtitle>(id: string, field: K, value: Subtitle[K]) => {
    setSubtitles(prev => prev.map(sub => sub.id === id ? { ...sub, [field]: value } : sub));
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, subId: string) => {
    e.dataTransfer.setData("subId", subId);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!videoContainerRef.current) return;
    const rect = videoContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const activeSub = subtitles.find(s => currentTime >= s.startTime && currentTime <= s.endTime);
    if (activeSub) {
      updateSubtitle(activeSub.id, 'x', x);
      updateSubtitle(activeSub.id, 'y', y);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 100);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans overflow-hidden">
      
      {/* --- Sidebar --- */}
      <div className="w-80 flex-shrink-0 border-r border-gray-700 bg-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold flex items-center gap-2 mb-4">
            <Wand2 className="text-purple-400" /> AI Video Editor
          </h1>
          
          <input type="file" accept="video/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors mb-2"
          >
            <Upload size={16} /> Upload Video
          </button>

          <button 
            onClick={handleTranscribe}
            disabled={!videoSrc || isProcessing || !!error}
            className={`w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors border ${
              !videoSrc || !!error ? 'border-gray-600 text-gray-500 cursor-not-allowed' :
              isProcessing ? 'border-purple-500 text-purple-400 animate-pulse' :
              'border-purple-500 text-purple-400 hover:bg-purple-900/30'
            }`}
          >
            {isProcessing ? <>Processing...</> : <><Mic size={16} /> Extract & Transcribe</>}
          </button>
        </div>

        {/* Subtitle List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {subtitles.length === 0 && (
            <div className="text-center text-gray-500 mt-10 text-sm p-4">
              {videoSrc ? "Click 'Extract' to generate subtitles." : "Upload a video to start."}
            </div>
          )}
          {subtitles.map((sub) => {
            const isActive = currentTime >= sub.startTime && currentTime <= sub.endTime;
            return (
              <div 
                key={sub.id}
                onClick={() => { if (videoRef.current) videoRef.current.currentTime = sub.startTime; }}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  isActive ? 'bg-purple-900/40 border-purple-500 ring-1 ring-purple-500' : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>{formatTime(sub.startTime)} - {formatTime(sub.endTime)}</span>
                  {isActive && <span className="text-purple-400 font-bold">ACTIVE</span>}
                </div>
                <textarea 
                  value={sub.text}
                  onChange={(e) => updateSubtitle(sub.id, 'text', e.target.value)}
                  className="w-full bg-transparent border-none text-sm text-white resize-none focus:ring-0 p-0"
                  rows={2}
                />
              </div>
            );
          })}
        </div>

        {/* Translation Placeholder */}
        <div className="p-4 border-t border-gray-700 bg-gray-800/50">
           <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Languages size={14} /> Translate
              </span>
              <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-400">Burmese</span>
           </div>
           <button className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 py-1.5 rounded text-xs transition-colors">
             Translate All (Coming Soon)
           </button>
        </div>
      </div>

      {/* --- Main Area --- */}
      <div className="flex-1 flex flex-col bg-black relative">
        <div className="h-14 bg-gray-800 border-b border-gray-700 flex items-center px-4 justify-between">
           <div className="text-sm text-gray-400">{videoSrc ? "Editing Mode" : "No Project Loaded"}</div>
           <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded text-sm flex items-center gap-2">
             <Download size={14} /> Export Video
           </button>
        </div>

        {/* Video Canvas */}
        <div 
          className="flex-1 flex items-center justify-center relative bg-gray-900 overflow-hidden"
          ref={videoContainerRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {/* --- Error / Convert State --- */}
          {error === "FORMAT_ERROR" && !isConverting ? (
            <div className="text-red-400 flex flex-col items-center gap-4 p-8 text-center bg-gray-800/50 rounded-xl border border-red-500/30">
              <FileVideo size={48} />
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Format Not Supported</h3>
                <p className="text-sm opacity-80 mb-4">This video (likely MKV/AVI) cannot be played natively.</p>
                <button 
                  onClick={handleConvertVideo}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Convert to MP4 (Repair)
                </button>
              </div>
            </div>
          ) : isConverting ? (
            <div className="text-blue-400 flex flex-col items-center gap-4 p-8 text-center bg-gray-800/50 rounded-xl border border-blue-500/30">
              <Loader2 size={48} className="animate-spin" />
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Converting Video...</h3>
                <p className="text-sm opacity-80 mb-2">Transcoding to MP4 for browser compatibility.</p>
                <div className="text-2xl font-mono font-bold">{conversionProgress}</div>
              </div>
            </div>
          ) : error ? (
            <div className="text-red-400 flex flex-col items-center gap-2 p-4 text-center">
              <AlertCircle size={48} />
              <p>{error}</p>
            </div>
          ) : videoSrc ? (
            <div className="relative w-full h-full flex items-center justify-center bg-black group">
              <video
                key={videoSrc}
                ref={videoRef}
                src={videoSrc}
                className="max-h-full max-w-full object-contain shadow-2xl"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onClick={togglePlay}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                onError={handleVideoError}
              />

              {/* Subtitles Overlay */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {subtitles.map((sub) => {
                  if (currentTime < sub.startTime || currentTime > sub.endTime) return null;
                  return (
                    <div
                      key={sub.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, sub.id)}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing pointer-events-auto bg-black/60 px-4 py-2 rounded text-center"
                      style={{ left: `${sub.x}%`, top: `${sub.y}%`, minWidth: '200px' }}
                    >
                      <p className="text-white text-lg font-medium drop-shadow-md select-none">{sub.text}</p>
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Move size={10} className="text-white" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Play Overlay */}
              {!isPlaying && !isConverting && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                  <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full">
                    <Play size={32} className="text-white ml-1" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <Upload size={48} className="mx-auto mb-4 opacity-50" />
              <p>Upload a video to begin editing</p>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="h-20 bg-gray-800 border-t border-gray-700 px-4 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-2">
             <button onClick={togglePlay} disabled={!!error || isConverting} className="text-white hover:text-purple-400 disabled:opacity-50">
               {isPlaying ? <Pause size={20} /> : <Play size={20} />}
             </button>
             <span className="text-xs text-gray-400 font-mono">
               {formatTime(currentTime)} / {formatTime(duration)}
             </span>
          </div>
          <input 
            type="range" 
            min="0" 
            max={duration || 100} 
            value={currentTime} 
            onChange={(e) => {
              const time = parseFloat(e.target.value);
              setCurrentTime(time);
              if (videoRef.current) videoRef.current.currentTime = time;
            }}
            disabled={!!error || isConverting}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500 disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  );
}