import React, { useState, useRef, useEffect } from 'react';
import { Upload, Play, Pause, Move, Mic, Wand2, Download, AlertCircle, FileVideo, Loader2, Sparkles, Trash2, Languages, ChevronDown, Volume2, VolumeX, Music, PlayCircle, RefreshCw } from 'lucide-react';

// --------------------------------------------------------------------------
// [INSTRUCTIONS FOR LOCAL USE]
// 1. Run: npm install @ffmpeg/ffmpeg @ffmpeg/util @supabase/supabase-js
// 2. UNCOMMENT the imports below:
// --------------------------------------------------------------------------
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { createClient } from '@supabase/supabase-js';

// --- Safe Environment Variable Helper ---
const getEnv = (key: string, fallback: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) return import.meta.env[key];
  } catch (e) { /* ignore */ }
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
  } catch (e) { /* ignore */ }
  return fallback;
};

// Configuration
const SUPABASE_URL = getEnv('VITE_SUPABASE_URL', 'YOUR_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY', 'YOUR_SUPABASE_ANON_KEY');
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Types ---
interface Subtitle {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  x: number;
}

type TranslationStyle = 'Narrative' | 'Formal' | 'Informal';
type VoiceOption = 'Woman' | 'Man' | 'Boy';

// --- Helpers ---
const formatSRTTime = (seconds: number): string => {
  const date = new Date(0);
  date.setSeconds(seconds);
  date.setMilliseconds((seconds % 1) * 1000);
  return date.toISOString().substr(11, 12).replace('.', ',');
};

const generateSRT = (subtitles: Subtitle[]): string => {
  return subtitles.map((sub, index) => {
    return `${index + 1}\n${formatSRTTime(sub.startTime)} --> ${formatSRTTime(sub.endTime)}\n${sub.text}\n`;
  }).join('\n');
};

const parseSRT = (srt: string): Subtitle[] => {
  const subtitles: Subtitle[] = [];
  const lines = srt.split(/\r?\n/);
  let currentStart = 0;
  let currentEnd = 0;
  let currentText = "";
  let hasTiming = false;

  const parseTime = (t: string) => {
    const clean = t.trim().replace(/[^0-9:.,]/g, '');
    const parts = clean.replace(',', '.').split(':');
    let h = 0, m = 0, s = 0;
    if (parts.length === 3) [h, m, s] = parts.map(parseFloat);
    else if (parts.length === 2) [m, s] = parts.map(parseFloat);
    else return 0;
    return (isNaN(h) ? 0 : h * 3600) + (isNaN(m) ? 0 : m * 60) + (isNaN(s) ? 0 : s);
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (line.includes('-->')) {
      if (hasTiming && currentText) {
         const cleanedText = currentText.trim().replace(/[\n\s]+\d+\s*$/, '');
         if (cleanedText) subtitles.push({ id: crypto.randomUUID(), startTime: currentStart, endTime: currentEnd, text: cleanedText, x: 50 });
      }
      const [startStr, endStr] = line.split('-->');
      currentStart = parseTime(startStr);
      currentEnd = parseTime(endStr);
      currentText = "";
      hasTiming = true;
    } else if (/^\d+$/.test(line)) { /* Skip ID */ } 
    else { if (hasTiming) currentText += (currentText ? " " : "") + line; }
  }
  if (hasTiming && currentText) {
     const cleanedText = currentText.trim().replace(/[\n\s]+\d+\s*$/, '');
     if (cleanedText) subtitles.push({ id: crypto.randomUUID(), startTime: currentStart, endTime: currentEnd, text: cleanedText, x: 50 });
  }
  return subtitles;
};

const base64ToBlob = (base64: string, type = 'audio/mp3') => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type });
};

const getAudioDuration = async (blob: Blob): Promise<number> => {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.addEventListener('loadedmetadata', () => {
      resolve(audio.duration);
      URL.revokeObjectURL(url);
    });
    audio.addEventListener('error', () => {
      resolve(0.1); 
      URL.revokeObjectURL(url);
    });
  });
};

export default function App() {
  // --- State ---
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  
  const [globalSubtitleY, setGlobalSubtitleY] = useState<number>(80);
  
  const [translationStyle, setTranslationStyle] = useState<TranslationStyle>('Narrative');
  const [voice, setVoice] = useState<VoiceOption>('Woman');
  const [generatedAudioSrc, setGeneratedAudioSrc] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<string>(''); 
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // --- Refs ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const ffmpegRef = useRef(new FFmpeg());

  // --- Cleanup ---
  useEffect(() => {
    return () => {
      if (videoSrc) URL.revokeObjectURL(videoSrc);
      if (generatedAudioSrc) URL.revokeObjectURL(generatedAudioSrc);
    };
  }, [videoSrc, generatedAudioSrc]);

  // --- Sync Logic ---
  useEffect(() => {
    const vid = videoRef.current;
    const aud = audioRef.current;
    if (!vid || !aud) return;

    const onPlay = () => aud.play().catch(e => console.warn("Audio play failed:", e));
    const onPause = () => aud.pause();
    const onSeek = () => aud.currentTime = vid.currentTime;
    
    vid.addEventListener('play', onPlay);
    vid.addEventListener('pause', onPause);
    vid.addEventListener('seeking', onSeek);

    return () => {
      vid.removeEventListener('play', onPlay);
      vid.removeEventListener('pause', onPause);
      vid.removeEventListener('seeking', onSeek);
    };
  }, [generatedAudioSrc]);

  // --- Handlers ---
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setError(null);
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setSubtitles([]); 
      setGeneratedAudioSrc(null);
      setCurrentTime(0);
      setIsPlaying(false);
      setIsMuted(false);
    }
  };

  const loadFFmpeg = async () => {
    const ffmpeg = ffmpegRef.current;
    if (ffmpeg.loaded) return ffmpeg;
    try {
        const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm';
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
    } catch (e: any) {
        throw new Error("Failed to load FFmpeg. Check your connection or security headers.");
    }
    return ffmpeg;
  };

  const handleTranscribe = async () => {
    if (!videoFile) return;
    setIsProcessing(true); setError(null);
    try {
      setProcessingStep("Extracting...");
      const ffmpeg = await loadFFmpeg();
      await ffmpeg.writeFile('input_video_t', await fetchFile(videoFile));
      await ffmpeg.exec(['-i', 'input_video_t', '-vn', '-acodec', 'libmp3lame', '-ab', '32k', '-ar', '22050', 'audio.mp3']);
      const audioData = await ffmpeg.readFile('audio.mp3');
      const audioBlob = new Blob([(audioData as Uint8Array).buffer as ArrayBuffer], { type: 'audio/mp3' });
      
      setProcessingStep("Transcribing...");
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.mp3');

      const { data, error } = await supabase.functions.invoke('all-in-one', { body: formData });
      if (error) throw error;
      if (!data?.srt) throw new Error("No subtitles returned.");

      setSubtitles(parseSRT(data.srt));
    } catch (err: any) {
      console.error(err); setError(err.message);
    } finally { setIsProcessing(false); setProcessingStep(""); }
  };

  const handleTranslate = async () => {
    if (subtitles.length === 0) return setError("Transcribe first.");
    setIsProcessing(true); setError(null); setProcessingStep(`Translating (${translationStyle})...`);
    try {
      const srtContent = generateSRT(subtitles);
      const { data, error } = await supabase.functions.invoke('translate', {
        body: { srt: srtContent, style: translationStyle, targetLanguage: 'Burmese' },
      });
      if (error) throw error;
      setSubtitles(parseSRT(data.srt));
    } catch (err: any) {
      console.error(err); setError(err.message);
    } finally { setIsProcessing(false); setProcessingStep(""); }
  };

  // --- ONE-SHOT AI AUDIO GENERATION ---
  const handleGenerateSpeech = async () => {
    if (subtitles.length === 0) return setError("No text to read.");
    setIsProcessing(true); 
    setError(null); 
    
    try {
      setProcessingStep("Generating single audio file...");

      // Combine all subtitles using an ellipsis to encourage natural pacing
      const fullScript = subtitles.map(sub => sub.text.trim()).join(' ... ');

      const response = await fetch(`${SUPABASE_URL}/functions/v1/tts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: fullScript, voice: voice })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Backend failed to generate audio");
      }

      const { audioContent } = await response.json();
      if (!audioContent) throw new Error("No audio returned from API.");

      const blob = base64ToBlob(audioContent);
      const finalUrl = URL.createObjectURL(blob);
      
      setGeneratedAudioSrc(finalUrl);

      // Mute the original video so we only hear the AI
      if (videoRef.current) {
        videoRef.current.muted = true;
        setIsMuted(true);
      }

    } catch (err: any) {
      console.error("Audio Engine Error:", err); 
      setError(err.message);
    } finally { 
      setIsProcessing(false); 
      setProcessingStep(""); 
    }
  };

  // --- NEW: TIME-STRETCH SYNC ENGINE (VIDEO & SUBS) ---
  const handleSyncVideo = async () => {
    if (!videoFile || !generatedAudioSrc) return setError("Please upload a video and generate audio first.");
    setIsProcessing(true);
    setError(null);
    setProcessingStep("Stretching video & scaling subtitles...");

    try {
      const ffmpeg = await loadFFmpeg();

      // 1. Get exact durations
      const audioRes = await fetch(generatedAudioSrc);
      const audioBlob = await audioRes.blob();
      const aiAudioDuration = await getAudioDuration(audioBlob);
      const currentVideoDuration = videoRef.current?.duration || duration;

      if (!aiAudioDuration || !currentVideoDuration) throw new Error("Could not calculate durations.");

      // 2. Calculate the ratio (If AI is 90s and video is 60s, ratio is 1.5)
      const stretchRatio = aiAudioDuration / currentVideoDuration;
      
      // 3. Stretch the video file using FFmpeg's setpts filter
      await ffmpeg.writeFile('input_to_sync.mp4', await fetchFile(videoFile));
      
      await ffmpeg.exec([
        '-i', 'input_to_sync.mp4',
        '-filter:v', `setpts=${stretchRatio}*PTS`,
        '-an', // Strip original audio
        'output_synced.mp4'
      ]);

      const data = await ffmpeg.readFile('output_synced.mp4');
      const syncedVideoBlob = new Blob([(data as Uint8Array).buffer as ArrayBuffer], { type: 'video/mp4' });
      const syncedVideoFile = new File([syncedVideoBlob], "synced_video.mp4", { type: 'video/mp4' });

      // 4. Update Video State (Replaces the original fast video with the slow one)
      setVideoFile(syncedVideoFile);
      setVideoSrc(URL.createObjectURL(syncedVideoBlob));

      // 5. Scale all subtitle timings by the exact same ratio
      setSubtitles(prev => prev.map(sub => ({
        ...sub,
        startTime: sub.startTime * stretchRatio,
        endTime: sub.endTime * stretchRatio
      })));

      // Force video duration update in state
      setDuration(aiAudioDuration);

    } catch (err: any) {
      console.error("Sync Error:", err);
      setError(err.message);
    } finally {
      setIsProcessing(false);
      setProcessingStep("");
    }
  };


  // --- Export Logic ---
  const handleExport = async () => {
    if (!videoFile) return setError("Upload a video first.");
    if (subtitles.length === 0) return setError("No subtitles to export.");

    setIsExporting(true);
    setError(null);
    setExportProgress(0);
    
    try {
      const ffmpeg = await loadFFmpeg();

      ffmpeg.on('progress', ({ progress }) => {
        setExportProgress(Math.round(progress * 100));
      });

      await ffmpeg.writeFile('input_video.mp4', await fetchFile(videoFile));
      const srtContent = generateSRT(subtitles);
      await ffmpeg.writeFile('subs.srt', srtContent);

      const fontURL = 'https://raw.githubusercontent.com/ffmpegwasm/testdata/master/arial.ttf';
      await ffmpeg.writeFile('arial.ttf', await fetchFile(fontURL));

      let audioArgs: string[] = [];
      if (generatedAudioSrc) {
        const res = await fetch(generatedAudioSrc);
        const audioBlob = await res.blob();
        await ffmpeg.writeFile('voiceover.mp3', await fetchFile(audioBlob));
        audioArgs = ['-i', 'voiceover.mp3', '-map', '0:v:0', '-map', '1:a:0'];
      } else {
        audioArgs = ['-map', '0:v:0', '-map', '0:a:0'];
      }

      const videoHeight = videoRef.current?.videoHeight || 1080;
      const marginFromBottomPercent = (100 - globalSubtitleY) / 100;
      const marginVPixels = Math.round(videoHeight * marginFromBottomPercent);

      await ffmpeg.exec([
        '-i', 'input_video.mp4',
        ...audioArgs,
        '-vf', `subtitles=subs.srt:fontsdir=/:force_style='Fontname=Arial,FontSize=24,Alignment=2,MarginV=${marginVPixels}'`,
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-shortest',
        'output_final.mp4'
      ]);

      const data = await ffmpeg.readFile('output_final.mp4');
      const finalVideoBlob = new Blob([(data as Uint8Array).buffer as ArrayBuffer], { type: 'video/mp4' });
      const downloadUrl = URL.createObjectURL(finalVideoBlob);

      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = 'AI_Edited_Video.mp4';
      a.click();
      
      URL.revokeObjectURL(downloadUrl);

    } catch (err: any) {
      console.error("Export Error:", err);
      setError("Export failed: " + err.message);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
      ffmpegRef.current.off('progress', () => {});
    }
  };

  // --- UI Helpers ---

  const updateSubtitleText = (id: string, text: string) => {
    setSubtitles(prev => prev.map(sub => sub.id === id ? { ...sub, text } : sub));
  };
  
  const togglePlay = () => {
    if (videoRef.current) {
      if (error && error !== "FORMAT_ERROR") setError(null);
      if (videoRef.current.paused) {
        videoRef.current.play().catch(e => setError("Playback failed: " + e.message));
      } else {
        videoRef.current.pause();
      }
    }
  };
  
  const testAudio = () => {
    if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!videoContainerRef.current) return;
    
    const rect = videoContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    
    let y = ((e.clientY - rect.top) / rect.height) * 100;
    y = Math.max(5, Math.min(y, 95)); 
    
    const subId = e.dataTransfer.getData("subId");
    
    if (subId) {
       setSubtitles(prev => prev.map(sub => sub.id === subId ? { ...sub, x } : sub));
       setGlobalSubtitleY(y);
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans overflow-hidden">
      {generatedAudioSrc && <audio ref={audioRef} src={generatedAudioSrc} className="hidden" />}

      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 border-r border-gray-700 bg-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold flex items-center gap-2 mb-4">
            <Wand2 className="text-purple-400" /> AI Video Editor
          </h1>
          <input type="file" accept="video/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors mb-2">
            <Upload size={16} /> Upload Video
          </button>
          <button onClick={handleTranscribe} disabled={!videoFile || isProcessing || isExporting} className={`w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors border ${!videoFile ? 'border-gray-600 text-gray-500' : 'border-purple-500 text-purple-400 hover:bg-purple-900/30'}`}>
            {isProcessing && processingStep.includes('Extracting') || processingStep.includes('Transcribing') ? <><Loader2 size={16} className="animate-spin" /> {processingStep}</> : <><Sparkles size={16} /> Auto Subtitles</>}
          </button>
        </div>

        {/* Subtitle List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-600">
          {subtitles.length === 0 && <div className="text-center text-gray-500 mt-10 text-sm p-4">{videoSrc ? "Generate subtitles to start." : "Upload video."}</div>}
          {subtitles.map((sub) => {
            const isActive = currentTime >= sub.startTime && currentTime <= sub.endTime;
            return (
              <div key={sub.id} onClick={() => { if (videoRef.current) videoRef.current.currentTime = sub.startTime; }} className={`p-3 rounded-lg border cursor-pointer transition-all ${isActive ? 'bg-purple-900/40 border-purple-500 ring-1 ring-purple-500' : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'}`}>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>{formatSRTTime(sub.startTime)} - {formatSRTTime(sub.endTime)}</span>
                  {isActive && <span className="text-purple-400 font-bold">ACTIVE</span>}
                </div>
                <textarea value={sub.text} onChange={(e) => updateSubtitleText(sub.id, e.target.value)} className="w-full bg-transparent border-none text-sm text-white resize-none focus:ring-0 p-0" rows={2} />
              </div>
            );
          })}
        </div>

        {/* Tools Panel */}
        <div className="p-4 border-t border-gray-700 bg-gray-800/50 space-y-4">
           {/* Translation */}
           <div>
             <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Translation</span>
             </div>
             <div className="flex gap-2">
               <div className="relative w-full">
                 <select value={translationStyle} onChange={(e) => setTranslationStyle(e.target.value as TranslationStyle)} className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-xs rounded px-2 py-1.5 focus:outline-none" disabled={isProcessing || isExporting}>
                   <option value="Narrative">Narrative</option>
                   <option value="Formal">Formal</option>
                   <option value="Informal">Informal</option>
                 </select>
                 <ChevronDown size={12} className="absolute right-2 top-2 text-gray-400 pointer-events-none" />
               </div>
               <button onClick={handleTranslate} disabled={subtitles.length === 0 || isProcessing || isExporting} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed">
                 Translate
               </button>
             </div>
           </div>

           {/* TTS */}
           <div>
             <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">AI Voiceover</span>
                {generatedAudioSrc && <span className="text-[10px] text-green-400 bg-green-900/30 px-1.5 py-0.5 rounded border border-green-800">Ready</span>}
             </div>
             <div className="flex gap-2 mb-2">
               <div className="relative w-full">
                 <select value={voice} onChange={(e) => setVoice(e.target.value as VoiceOption)} className="w-full bg-gray-700 border border-gray-600 text-gray-200 text-xs rounded px-2 py-1.5 focus:outline-none" disabled={isProcessing || isExporting}>
                   <option value="Woman">Woman (Kore)</option>
                   <option value="Man">Man (Fenrir)</option>
                   <option value="Boy">Boy (Puck)</option>
                 </select>
                 <ChevronDown size={12} className="absolute right-2 top-2 text-gray-400 pointer-events-none" />
               </div>
               <button onClick={handleGenerateSpeech} disabled={subtitles.length === 0 || isProcessing || isExporting} className="bg-pink-600 hover:bg-pink-700 text-white px-3 py-1.5 rounded text-xs whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
                 {isProcessing && processingStep.includes('Generating') ? <Loader2 size={12} className="animate-spin" /> : "Generate"}
               </button>
             </div>

             {/* --- NEW SYNC BUTTON --- */}
             <button 
               onClick={handleSyncVideo} 
               disabled={!generatedAudioSrc || isProcessing || isExporting} 
               className="w-full bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
             >
               {isProcessing && processingStep.includes('Stretching') ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
               Sync Video & Subs
             </button>

             {isProcessing && (processingStep.includes('Stretching') || processingStep.includes('Generating')) && (
               <div className="text-[10px] text-purple-400 mt-2 text-center animate-pulse">{processingStep}</div>
             )}
           </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col bg-black relative">
        <div className="h-14 bg-gray-800 border-b border-gray-700 flex items-center px-4 justify-between">
           <div className="text-sm text-gray-400">{videoSrc ? "Editing Mode" : "No Project Loaded"}</div>
           <div className="flex items-center gap-4">
             {generatedAudioSrc && (
               <div className="flex items-center gap-2 text-xs bg-gray-700 px-3 py-1 rounded-full">
                 <Music size={12} className="text-pink-400" />
                 <span className="text-gray-300">AI Voice Active</span>
                 <button onClick={testAudio} className="hover:text-pink-300 border-l border-gray-600 pl-2 ml-2 flex items-center gap-1">
                    <PlayCircle size={12} /> Test
                 </button>
                 <button onClick={() => { 
                   if(videoRef.current) {
                     videoRef.current.muted = !videoRef.current.muted;
                     setIsMuted(videoRef.current.muted);
                   }
                 }} className="hover:text-white ml-2 border-l border-gray-600 pl-2">
                   {isMuted ? <VolumeX size={12} className="text-red-400" /> : <Volume2 size={12} />}
                 </button>
               </div>
             )}
             
             <button 
                onClick={handleExport} 
                disabled={!videoFile || isExporting || isProcessing}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
             >
               {isExporting ? (
                 <><Loader2 size={14} className="animate-spin" /> Exporting {exportProgress}%</>
               ) : (
                 <><Download size={14} /> Export</>
               )}
             </button>
           </div>
        </div>

        {/* Video Canvas */}
        <div className="flex-1 flex items-center justify-center relative bg-gray-900 overflow-hidden" ref={videoContainerRef} onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
          {error ? (
            <div className="text-red-400 flex flex-col items-center gap-4 p-8 bg-gray-800/50 rounded-xl border border-red-500/30 z-50 absolute">
              <AlertCircle size={48} />
              <div className="text-center">
                 <h3 className="text-lg font-bold text-white mb-1">Error</h3>
                 <p>{error}</p>
                 <button onClick={() => setError(null)} className="mt-4 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm">Dismiss</button>
              </div>
            </div>
          ) : null}

          {videoSrc ? (
            <div className="relative w-full h-full flex items-center justify-center bg-black group">
              <video 
                onClick={togglePlay} 
                ref={videoRef} 
                src={videoSrc} 
                className="max-h-full max-w-full object-contain relative z-10" 
                onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)} 
                onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)} 
                onPlay={() => setIsPlaying(true)} 
                onPause={() => setIsPlaying(false)} 
                onEnded={() => setIsPlaying(false)} 
                onError={() => { if (videoFile) setError("FORMAT_ERROR"); }} 
              />
              
              {/* Subtitles Overlay */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
                {subtitles.map((sub) => {
                  if (currentTime < sub.startTime || currentTime > sub.endTime) return null;
                  return (
                    <div 
                      key={sub.id} 
                      draggable 
                      onDragStart={(e) => { e.dataTransfer.setData("subId", sub.id); }} 
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing pointer-events-auto bg-black/60 px-4 py-2 rounded text-center backdrop-blur-sm border border-white/10" 
                      style={{ left: `${sub.x}%`, top: `${globalSubtitleY}%`, minWidth: '200px' }}
                    >
                      <p className="text-white text-lg font-medium drop-shadow-md select-none">{sub.text}</p>
                    </div>
                  );
                })}
              </div>

              {!isPlaying && (
                <div onClick={togglePlay} className="absolute inset-0 flex items-center justify-center bg-black/10 cursor-pointer z-40">
                  <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full hover:bg-white/30 transition">
                    <Play size={32} className="text-white ml-1" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <Upload size={48} className="mx-auto mb-4 opacity-50" />
              <p>Upload a video to begin</p>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="h-20 bg-gray-800 border-t border-gray-700 px-4 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-2">
             <button onClick={togglePlay} className="text-white hover:text-purple-400">
               {isPlaying ? <Pause size={20} /> : <Play size={20} />}
             </button>
             <span className="text-xs text-gray-400 font-mono">
               {formatSRTTime(currentTime).split(',')[0]} / {formatSRTTime(duration).split(',')[0]}
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
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500" 
          />
        </div>
      </div>
    </div>
  );
}