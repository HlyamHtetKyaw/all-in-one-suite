import React, { useState, useRef, useEffect } from 'react';
import { Upload, Loader2, AlertCircle, FileText, Type, HelpCircle } from 'lucide-react';
import HelpDialog from './HelpDialog';

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

interface CaptionStudioProps {
  isAuthenticated: boolean;
  onLoginClick: () => void;
}

export default function CaptionStudio({ isAuthenticated, onLoginClick }: CaptionStudioProps) {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captions, setCaptions] = useState<CaptionResponse | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const currentChunk = captions?.chunks.find(
    (chunk) => currentTime >= chunk.start && currentTime <= chunk.end + 0.5
  );

  if (!isAuthenticated) {
    return (
      <section className="mt-6 rounded-[2.5rem] border border-white/15 bg-white/6 backdrop-blur-3xl p-10 flex flex-col items-center justify-center text-center space-y-4 shadow-2xl">
        <div className="p-4 rounded-full bg-white/10 border border-white/20 mb-2">
          <FileText className="w-8 h-8 text-purple-300" />
        </div>
        <h2 className="text-2xl font-semibold">Sign in to unlock Auto Caption</h2>
        <p className="text-sm md:text-base text-white/65 max-w-md">
          Login or create an account to automatically generate captions from video to text.
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
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl">
          <Type className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-white">Auto Caption</h1>
            <button
              onClick={() => setShowHelp(true)}
              className="p-1.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg hover:bg-white/15 transition-all duration-300"
            >
              <HelpCircle className="w-4 h-4 text-white/60" />
            </button>
          </div>
          <p className="text-sm text-white/60">Automatically generate captions from video to text</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div 
          className="border-2 border-dashed rounded-[2.5rem] p-12 transition-all duration-500 flex flex-col items-center justify-center text-center space-y-6 backdrop-blur-3xl shadow-2xl border-white/15 bg-white/6 hover:border-purple-400/40 hover:bg-white/10"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.08) 100%)'
          }}
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
              <div className="p-6 bg-white/12 backdrop-blur-2xl rounded-full border border-white/25 shadow-xl">
                <Upload className="w-16 h-16 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-xl text-white mb-2">Select a video</h3>
                <p className="text-white/50 text-sm">MP4, MOV up to 500MB</p>
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 px-8 py-3 bg-white/12 backdrop-blur-2xl text-white font-medium rounded-full hover:bg-white/18 hover:scale-105 border border-white/25 transition-all duration-300 shadow-xl hover:shadow-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.08) 100%)'
                }}
              >
                Browse Files
              </button>
            </>
          ) : (
            <>
              <div className="p-6 bg-white/12 backdrop-blur-2xl rounded-full border border-purple-400/30 shadow-xl">
                <Upload className="w-16 h-16 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg line-clamp-1 break-all text-white mb-1">{file.name}</h3>
                <p className="text-white/50 text-sm">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
              <div className="flex space-x-3 mt-4">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 bg-white/10 backdrop-blur-2xl text-white text-sm font-medium rounded-full hover:bg-white/18 hover:scale-105 border border-white/20 transition-all duration-300 shadow-lg"
                  disabled={isLoading}
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.06) 100%)'
                  }}
                >
                  Change
                </button>
                <button 
                  onClick={handleUpload}
                  disabled={isLoading || !!captions}
                  className="px-7 py-3 bg-gradient-to-r from-purple-500/90 to-purple-600/90 backdrop-blur-2xl text-white text-sm font-medium rounded-full hover:from-purple-600 hover:to-purple-700 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 flex items-center space-x-2 shadow-xl shadow-purple-500/40 border border-purple-400/40"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-purple-200" />
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

        {error && (
          <div className="backdrop-blur-3xl bg-red-500/15 border border-red-400/40 text-red-200 p-4 rounded-full flex items-start space-x-3 shadow-2xl shadow-red-500/30"
            style={{
              background: 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.10) 100%)'
            }}
          >
            <div className="p-1.5 bg-red-500/20 rounded-full backdrop-blur-md border border-red-400/30">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-300" />
            </div>
            <p className="text-sm flex-1">{error}</p>
          </div>
        )}

        {videoUrl && (
          <div className="relative rounded-[2.5rem] overflow-hidden backdrop-blur-3xl aspect-video w-full shadow-2xl border-2 border-white/15"
            style={{
              background: 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.6) 100%)'
            }}
          >
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              className="w-full h-full object-contain"
              onTimeUpdate={handleTimeUpdate}
            />
            
            {currentChunk && (
              <div className="absolute inset-x-0 bottom-20 flex justify-center items-center pointer-events-none p-4">
                <div className="backdrop-blur-3xl bg-black/40 rounded-full px-6 py-3 border border-white/20 shadow-2xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 100%)'
                  }}
                >
                  <p className="font-black text-3xl leading-tight tracking-tight flex flex-wrap justify-center gap-2" style={{ textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000' }}>
                    {currentChunk.words.map((wordObj, i) => {
                      const isCurrentWord = currentTime >= wordObj.start && currentTime <= wordObj.end;
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

      <div className="space-y-6">
        <div className="backdrop-blur-3xl rounded-[2.5rem] p-6 border border-white/15 h-[calc(100vh-12rem)] overflow-y-auto shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.05) 100%)'
          }}
        >
          <h2 className="text-xl font-semibold mb-6 text-white">
            Transcript Chunks
          </h2>

          {!captions ? (
            <div className="h-full flex flex-col items-center justify-center text-white/40 space-y-4 pb-20">
              <div className="p-6 bg-white/8 backdrop-blur-2xl rounded-full border border-white/15">
                <FileText className="w-16 h-16 opacity-50 text-purple-400" />
              </div>
              <p className="text-white/50">Upload a video to see the generated chunks here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {captions.chunks.map((chunk, index) => {
                const isActive = currentTime >= chunk.start && currentTime <= chunk.end;
                return (
                  <div 
                    key={index} 
                    className={`p-4 rounded-2xl transition-all duration-500 cursor-pointer border backdrop-blur-2xl shadow-lg hover:scale-[1.01] ${
                      isActive 
                        ? 'bg-purple-500/25 border-purple-400/60 shadow-purple-500/30 scale-[1.02]' 
                        : 'bg-white/6 border-white/12 hover:border-purple-400/50 hover:bg-white/10'
                    }`}
                    style={isActive ? {
                      background: 'linear-gradient(135deg, rgba(147,51,234,0.25) 0%, rgba(168,85,247,0.15) 100%)'
                    } : {
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.04) 100%)'
                    }}
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.currentTime = chunk.start;
                        videoRef.current.play();
                      }
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-mono text-white/50 px-2 py-1 bg-white/5 rounded-full backdrop-blur-sm border border-white/10">
                        {chunk.start.toFixed(2)}s - {chunk.end.toFixed(2)}s
                      </span>
                    </div>
                    <p className={`text-lg ${isActive ? 'text-white font-medium' : 'text-white/80'}`}>
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

      <HelpDialog
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        title="How to Use Auto Caption"
        content={
          <>
            <p><strong>Step 1: Upload Video</strong></p>
            <p>Click "Browse Files" or drag and drop a video file (MP4, MOV up to 500MB) into the upload area.</p>
            
            <p><strong>Step 2: Generate Captions</strong></p>
            <p>Click "Generate Captions" to process your video. The system will automatically transcribe the audio and create timed caption chunks.</p>
            
            <p><strong>Step 3: Review Transcript Chunks</strong></p>
            <p>View the generated transcript chunks in the right panel. Each chunk shows the text and time range. Click on any chunk to jump to that moment in the video.</p>
            
            <p><strong>Step 4: Watch with Captions</strong></p>
            <p>Play the video to see word-by-word caption highlighting synchronized with the audio. The current word is highlighted in yellow.</p>
          </>
        }
      />
    </div>
  );
}
