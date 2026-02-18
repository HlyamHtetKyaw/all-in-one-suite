import React, { useState, useRef, useEffect } from 'react';
import { Upload, Play, Pause, Type, Move, Mic, Wand2, Download, Trash2, Languages } from 'lucide-react';

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
// In a real app, this would come from your Supabase Edge Function (Gemini)
const MOCK_GENERATED_SUBTITLES: Subtitle[] = [
  { id: '1', startTime: 1, endTime: 3, text: "Welcome to this video tutorial.", x: 50, y: 80 },
  { id: '2', startTime: 3.5, endTime: 6, text: "We are going to learn about React.", x: 50, y: 80 },
  { id: '3', startTime: 6.5, endTime: 9, text: "It's really cool and easy to use.", x: 50, y: 80 },
  { id: '4', startTime: 9.5, endTime: 12, text: "Let's dive right in!", x: 50, y: 80 },
];

export default function Main() {
  // --- State ---
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [selectedSubtitleId, setSelectedSubtitleId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showBurmeseTranslate, setShowBurmeseTranslate] = useState<boolean>(false); // UI toggle for future feature

  // --- Refs ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  // --- Handlers ---

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setSubtitles([]); // Reset subtitles on new video
      setCurrentTime(0);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  // --- The "AI" Logic (Simulated for Frontend) ---
  const handleSimulateExtraction = () => {
    if (!videoSrc) return;
    
    setIsProcessing(true);
    
    // Simulate network delay for "Extracting Audio -> Sending to Gemini -> Parsing SRT"
    setTimeout(() => {
      setSubtitles(MOCK_GENERATED_SUBTITLES);
      setIsProcessing(false);
      alert("Success! Audio extracted and transcribed by AI (Simulated).");
    }, 1500);
  };

  // --- Subtitle Editing ---
  const updateSubtitle = <K extends keyof Subtitle>(id: string, field: K, value: Subtitle[K]) => {
    setSubtitles(prev => prev.map(sub => 
      sub.id === id ? { ...sub, [field]: value } : sub
    ));
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, subId: string) => {
    // Basic drag implementation (could be improved with dedicated dnd library)
    e.dataTransfer.setData("subId", subId);
    // Hide ghost image usually, but here we keep simple
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    // This logic calculates where the drop happened relative to the video container
    // Note: This is a simplified calculation. Real-world needs to account for video aspect ratio vs container.
    if (!videoContainerRef.current) return;
    
    const rect = videoContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100; // Percentage
    const y = ((e.clientY - rect.top) / rect.height) * 100; // Percentage
    
    // In a real app, you'd get the ID from dataTransfer, but for this simplified interactive demo:
    // We'll update the currently VISIBLE subtitle if one exists at this time.
    const activeSub = subtitles.find(s => currentTime >= s.startTime && currentTime <= s.endTime);
    if (activeSub) {
      updateSubtitle(activeSub.id, 'x', x);
      updateSubtitle(activeSub.id, 'y', y);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  // --- Render Helpers ---
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 100);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans overflow-hidden">
      
      {/* --- Sidebar: Controls & Subtitle List --- */}
      <div className="w-80 flex-shrink-0 border-r border-gray-700 bg-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold flex items-center gap-2 mb-4">
            <Wand2 className="text-purple-400" /> 
            AI Video Editor
          </h1>
          
          {/* Upload */}
          <input 
            type="file" 
            accept="video/*" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors mb-2"
          >
            <Upload size={16} /> Upload Video
          </button>

          {/* AI Trigger */}
          <button 
            onClick={handleSimulateExtraction}
            disabled={!videoSrc || isProcessing}
            className={`w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors border ${
              !videoSrc ? 'border-gray-600 text-gray-500 cursor-not-allowed' :
              isProcessing ? 'border-purple-500 text-purple-400 animate-pulse' :
              'border-purple-500 text-purple-400 hover:bg-purple-900/30'
            }`}
          >
            {isProcessing ? (
              <>Extracting Audio...</>
            ) : (
              <><Mic size={16} /> Extract & Transcribe</>
            )}
          </button>
        </div>

        {/* Subtitle List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {subtitles.length === 0 && (
            <div className="text-center text-gray-500 mt-10 text-sm p-4">
              {videoSrc ? "Click 'Extract' to generate subtitles from audio." : "Upload a video to start."}
            </div>
          )}
          
          {subtitles.map((sub) => {
            const isActive = currentTime >= sub.startTime && currentTime <= sub.endTime;
            return (
              <div 
                key={sub.id}
                onClick={() => {
                   if (videoRef.current) videoRef.current.currentTime = sub.startTime;
                   setSelectedSubtitleId(sub.id);
                }}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  isActive 
                    ? 'bg-purple-900/40 border-purple-500 ring-1 ring-purple-500' 
                    : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
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

        {/* Future Feature: Translation */}
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

      {/* --- Main Area: Video & Editor --- */}
      <div className="flex-1 flex flex-col bg-black relative">
        {/* Toolbar */}
        <div className="h-14 bg-gray-800 border-b border-gray-700 flex items-center px-4 justify-between">
           <div className="text-sm text-gray-400">
             {videoSrc ? "Editing Mode" : "No Project Loaded"}
           </div>
           <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded text-sm flex items-center gap-2">
             <Download size={14} /> Export Video
           </button>
        </div>

        {/* Canvas / Video Container */}
        <div 
          className="flex-1 flex items-center justify-center relative bg-gray-900/50 overflow-hidden"
          ref={videoContainerRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {videoSrc ? (
            <div className="relative shadow-2xl max-h-full max-w-full aspect-video bg-black group">
              <video
                ref={videoRef}
                src={videoSrc}
                className="max-h-full max-w-full"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onClick={togglePlay}
              />

              {/* OVERLAY LAYER */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {subtitles.map((sub) => {
                  // Only render if within time range
                  if (currentTime < sub.startTime || currentTime > sub.endTime) return null;
                  
                  return (
                    <div
                      key={sub.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, sub.id)}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing pointer-events-auto bg-black/60 px-4 py-2 rounded text-center"
                      style={{ 
                        left: `${sub.x}%`, 
                        top: `${sub.y}%`,
                        minWidth: '200px'
                      }}
                    >
                      <p className="text-white text-lg font-medium drop-shadow-md select-none">
                        {sub.text}
                      </p>
                      {/* Drag handle indicator (only visible on hover in real app, simplified here) */}
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Move size={10} className="text-white" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Play Button Overlay (when paused) */}
              {!isPlaying && (
                <div 
                  className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none"
                >
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

        {/* Bottom Timeline Controls */}
        <div className="h-20 bg-gray-800 border-t border-gray-700 px-4 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-2">
             <button onClick={togglePlay} className="text-white hover:text-purple-400">
               {isPlaying ? <Pause size={20} /> : <Play size={20} />}
             </button>
             <span className="text-xs text-gray-400 font-mono">
               {formatTime(currentTime)} / {formatTime(duration)}
             </span>
          </div>
          
          {/* Seek Bar */}
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
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>
      </div>
    </div>
  );
}