import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileVideo, Loader2, AlertCircle, LayoutTemplate } from 'lucide-react';

// --- Types ---
interface WhisperWord {
  word: string;
  start: number;
  end: number;
}

interface ViralChunk {
  text: string;
  start: number;
  end: number;
  words: WhisperWord[];
}

interface CaptionResponse {
  fullText: string;
  chunks: ViralChunk[];
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captions, setCaptions] = useState<CaptionResponse | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URL to avoid memory leaks
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('video/')) {
        setError('Please select a valid video file (e.g., .mp4, .mov).');
        return;
      }
      setFile(selectedFile);
      setError(null);
      setCaptions(null);
      
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      setVideoUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('video', file);

    try {
      // Assuming Spring Boot is running on localhost:8080
      const response = await fetch('http://localhost:8080/api/v1/captions/generate-viral', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${response.status}`);
      }

      const data: CaptionResponse = await response.json();
      setCaptions(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to upload and process video. Make sure the backend is running on port 8080.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Find the current chunk and active word for rendering the viral overlay
  const currentChunk = captions?.chunks.find(
    (chunk) => currentTime >= chunk.start && currentTime <= chunk.end + 0.5 // +0.5s padding to keep it on screen slightly longer
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex items-center space-x-3 border-b border-neutral-800 pb-6">
          <LayoutTemplate className="w-8 h-8 text-indigo-500" />
          <h1 className="text-3xl font-bold tracking-tight">Viral Caption Studio</h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Upload & Video Player */}
          <div className="space-y-6">
            
            {/* Upload Box */}
            <div 
              className={`border-2 border-dashed rounded-2xl p-8 transition-colors flex flex-col items-center justify-center text-center space-y-4
                ${file ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/50'}`}
            >
              <input 
                type="file" 
                accept="video/*" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileChange}
              />
              
              {!file ? (
                <>
                  <div className="p-4 bg-neutral-800 rounded-full">
                    <Upload className="w-8 h-8 text-neutral-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Select a video</h3>
                    <p className="text-neutral-500 text-sm mt-1">MP4, MOV up to 500MB</p>
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 px-6 py-2 bg-white text-black font-medium rounded-full hover:bg-neutral-200 transition-colors"
                  >
                    Browse Files
                  </button>
                </>
              ) : (
                <>
                  <div className="p-4 bg-indigo-500/20 rounded-full text-indigo-400">
                    <FileVideo className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg line-clamp-1 break-all">{file.name}</h3>
                    <p className="text-neutral-500 text-sm mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                  <div className="flex space-x-3 mt-2">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-neutral-800 text-white text-sm font-medium rounded-full hover:bg-neutral-700 transition-colors"
                      disabled={isLoading}
                    >
                      Change
                    </button>
                    <button 
                      onClick={handleUpload}
                      disabled={isLoading || !!captions}
                      className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : captions ? (
                        <span>Generated!</span>
                      ) : (
                        <span>Generate Captions</span>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Video Player */}
            {videoUrl && (
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-[9/16] max-h-[600px] mx-auto w-full max-w-sm shadow-2xl ring-1 ring-white/10">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  className="w-full h-full object-contain"
                  onTimeUpdate={handleTimeUpdate}
                />
                
                {/* VIRAL CAPTION OVERLAY */}
                {currentChunk && (
                  <div className="absolute inset-x-0 bottom-24 flex justify-center items-center pointer-events-none p-4">
                    <div className="text-center drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">
                      <p className="font-black text-4xl leading-tight tracking-tight flex flex-wrap justify-center gap-2" style={{ textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000' }}>
                        {currentChunk.words.map((wordObj, i) => {
                          // Check if this specific word is currently being spoken
                          const isCurrentWord = currentTime >= wordObj.start && currentTime <= wordObj.end;
                          
                          // Active word is yellow and slightly scaled up (Alex Hormozi style)
                          return (
                            <span 
                              key={i} 
                              className={`transition-all duration-75 ease-in-out ${
                                isCurrentWord 
                                  ? 'text-yellow-400 scale-110 translate-y-[-2px]' 
                                  : 'text-white'
                              }`}
                            >
                              {wordObj.word}
                            </span>
                          );
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Data Visualization */}
          <div className="space-y-6">
            <div className="bg-neutral-900 rounded-2xl p-6 border border-neutral-800 h-[calc(100vh-12rem)] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-6 flex items-center justify-between">
                <span>Transcript Chunks</span>
                {captions && <span className="text-sm font-normal px-3 py-1 bg-green-500/20 text-green-400 rounded-full">{captions.chunks.length} chunks</span>}
              </h2>

              {!captions ? (
                <div className="h-full flex flex-col items-center justify-center text-neutral-500 space-y-4 pb-20">
                  <LayoutTemplate className="w-12 h-12 opacity-20" />
                  <p>Upload a video to see the generated chunks here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {captions.chunks.map((chunk, index) => {
                    const isActive = currentTime >= chunk.start && currentTime <= chunk.end;
                    return (
                      <div 
                        key={index} 
                        className={`p-4 rounded-xl transition-colors cursor-pointer border ${
                          isActive 
                            ? 'bg-indigo-500/20 border-indigo-500/50' 
                            : 'bg-neutral-800/50 border-transparent hover:border-neutral-700'
                        }`}
                        onClick={() => {
                          if (videoRef.current) {
                            videoRef.current.currentTime = chunk.start;
                            videoRef.current.play();
                          }
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-mono text-neutral-400">
                            {chunk.start.toFixed(2)}s - {chunk.end.toFixed(2)}s
                          </span>
                        </div>
                        <p className={`text-lg ${isActive ? 'text-indigo-200' : 'text-neutral-300'}`}>
                          {chunk.text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}