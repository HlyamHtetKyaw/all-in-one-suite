import React, { useState, useRef, useEffect } from 'react';
import { Upload, Play, Pause, Wand2, Download, AlertCircle, Loader2, Sparkles, ChevronDown, Volume2, VolumeX, Music, PlayCircle, RefreshCw, Type, Subtitles, FileText, Clock } from 'lucide-react';

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

const BACKEND_URL = getEnv('VITE_BACKEND_URL', 'http://localhost:8080/api/dubbing');

// --- Types ---
type TranslationStyle = 'Narrative' | 'Formal' | 'Informal';
type VoiceOption = 'Woman' | 'Man' | 'Boy';
type EditorTab = 'script' | 'srt';

interface SubtitleItem {
  id: number;
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
}

// --- Time Format Helpers ---
const formatSRTTime = (seconds: number): string => {
  const date = new Date(0);
  date.setSeconds(seconds);
  date.setMilliseconds((seconds % 1) * 1000);
  return date.toISOString().substr(11, 12).replace('.', ',');
};

const srtTimeToSeconds = (timeStr: string): number => {
  const [time, ms] = timeStr.split(',');
  const [h, m, s] = time.split(':');
  return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s) + parseInt(ms || '0') / 1000;
};

const secondsToSrtTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds - Math.floor(seconds)) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
};

// --- SRT Parsers ---
const parseSRT = (srt: string): SubtitleItem[] => {
  const blocks = srt.replace(/\r\n/g, '\n').trim().split(/\n\s*\n/);
  const parsed: SubtitleItem[] = [];
  
  blocks.forEach(block => {
    const lines = block.split('\n');
    if (lines.length >= 3) {
      const id = parseInt(lines[0], 10);
      const timeLine = lines[1];
      if (timeLine && timeLine.includes('-->')) {
         const [startStr, endStr] = timeLine.split(' --> ');
         const text = lines.slice(2).join('\n');
         parsed.push({
           id: id || parsed.length + 1,
           start: srtTimeToSeconds(startStr),
           end: srtTimeToSeconds(endStr),
           text: text
         });
      }
    }
  });
  return parsed;
};

const stringifySRT = (subs: SubtitleItem[]): string => {
  return subs.map((sub, i) => {
    return `${i + 1}\n${secondsToSrtTime(sub.start)} --> ${secondsToSrtTime(sub.end)}\n${sub.text}`;
  }).join('\n\n');
};

export default function App() {
  // --- State ---
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  
  // Text States
  const [scriptText, setScriptText] = useState<string>('');
  const [subtitles, setSubtitles] = useState<SubtitleItem[]>([]);
  const [activeTab, setActiveTab] = useState<EditorTab>('script');
  
  // Settings
  const [translationStyle, setTranslationStyle] = useState<TranslationStyle>('Narrative');
  const [voice, setVoice] = useState<VoiceOption>('Woman');
  
  // Audio State
  const [generatedAudioBlob, setGeneratedAudioBlob] = useState<Blob | null>(null);
  const [generatedAudioSrc, setGeneratedAudioSrc] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  
  // Loading & Error States
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<string>(''); 
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // --- Refs ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Cleanup Blob URLs ---
  useEffect(() => {
    return () => {
      if (videoSrc) URL.revokeObjectURL(videoSrc);
      if (generatedAudioSrc) URL.revokeObjectURL(generatedAudioSrc);
    };
  }, [videoSrc, generatedAudioSrc]);

  // --- Sync Playback (Video + AI Audio) ---
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
      setScriptText(''); 
      setSubtitles([]);
      setActiveTab('script');
      setGeneratedAudioSrc(null);
      setGeneratedAudioBlob(null);
      setCurrentTime(0);
      setIsPlaying(false);
      setIsMuted(false);
    }
  };

  const handleTranscribe = async () => { /* ... Unchanged ... */ 
    if (!videoFile) return;
    setIsProcessing(true); setError(null);
    setProcessingStep("Extracting & Transcribing on Server...");
    try {
      const formData = new FormData();
      formData.append('file', videoFile);
      const response = await fetch(`${BACKEND_URL}/transcribe`, { method: 'POST', body: formData });
      if (!response.ok) { const err = await response.json(); throw new Error(err.error || "Transcription failed"); }
      const data = await response.json();
      if (!data.text) throw new Error("No text returned from backend");
      setScriptText(data.text);
    } catch (err: any) { console.error(err); setError(err.message); } 
    finally { setIsProcessing(false); setProcessingStep(""); }
  };

  const handleTranslate = async () => { /* ... Unchanged ... */
    if (!scriptText) return setError("Nothing to translate.");
    setIsProcessing(true); setError(null); setProcessingStep(`Translating to Burmese...`);
    try {
      const response = await fetch(`${BACKEND_URL}/translate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: scriptText, targetLanguage: 'Burmese', style: translationStyle }),
      });
      if (!response.ok) { const err = await response.json(); throw new Error(err.error || "Translation failed"); }
      const data = await response.json();
      setScriptText(data.text);
    } catch (err: any) { console.error(err); setError(err.message); } 
    finally { setIsProcessing(false); setProcessingStep(""); }
  };

  const handleGenerateSpeech = async () => { /* ... Unchanged ... */
    if (!scriptText) return setError("No script to read.");
    setIsProcessing(true); setError(null); setProcessingStep("Generating AI Voice...");
    try {
      const response = await fetch(`${BACKEND_URL}/tts`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: scriptText, voice: voice })
      });
      if (!response.ok) throw new Error("Backend failed to generate audio");
      const blob = await response.blob();
      const finalUrl = URL.createObjectURL(blob);
      setGeneratedAudioBlob(blob); setGeneratedAudioSrc(finalUrl);
      if (videoRef.current) { videoRef.current.muted = true; setIsMuted(true); }
    } catch (err: any) { console.error("Audio Engine Error:", err); setError(err.message); } 
    finally { setIsProcessing(false); setProcessingStep(""); }
  };

  const handleSyncVideo = async () => { /* ... Unchanged ... */
    if (!videoFile || !generatedAudioBlob) return setError("Upload video and generate audio first.");
    setIsProcessing(true); setError(null); setProcessingStep("Stretching video on Server...");
    try {
      const formData = new FormData();
      formData.append('video', videoFile); formData.append('audio', generatedAudioBlob);
      const response = await fetch(`${BACKEND_URL}/sync`, { method: 'POST', body: formData });
      if (!response.ok) { const errData = await response.json(); throw new Error(errData.error || "Sync failed"); }
      const blob = await response.blob();
      const syncedVideoFile = new File([blob], "synced_video.mp4", { type: 'video/mp4' });
      setVideoFile(syncedVideoFile); setVideoSrc(URL.createObjectURL(syncedVideoFile));
      setGeneratedAudioSrc(null); setGeneratedAudioBlob(null);
      if (videoRef.current) { videoRef.current.muted = false; setIsMuted(false); }
    } catch (err: any) { console.error("Sync Error:", err); setError(err.message); } 
    finally { setIsProcessing(false); setProcessingStep(""); }
  };

  // Step 5: Generate SRT Only
  const handleGenerateSrt = async () => {
    if (!videoFile || !scriptText) return setError("Upload video and transcribe/translate first.");
    setIsProcessing(true); setError(null);
    setProcessingStep("Generating Subtitles with Gemini...");

    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('text', scriptText);

      const response = await fetch(`${BACKEND_URL}/generate-srt`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to generate SRT");
      }

      const data = await response.json();
      
      // Parse the raw SRT into interactive objects
      const parsedSubs = parseSRT(data.srt);
      setSubtitles(parsedSubs);
      setActiveTab('srt'); // Switch to editor view

    } catch (err: any) {
      console.error("SRT Gen Error:", err);
      setError(err.message);
    } finally {
      setIsProcessing(false); setProcessingStep("");
    }
  };

  // Ripple Editor logic: Shifting one shifts all subsequent items
  const handleSubtitleShift = (index: number, newStart: number) => {
    if(isNaN(newStart)) return;
    setSubtitles(prev => {
      const newSubs = [...prev];
      const delta = newStart - newSubs[index].start;
      
      // Shift current AND all subsequent blocks by the same delta
      for(let i = index; i < newSubs.length; i++) {
        newSubs[i].start += delta;
        newSubs[i].end += delta;
        // Prevent negative times
        if (newSubs[i].start < 0) newSubs[i].start = 0;
        if (newSubs[i].end < 0) newSubs[i].end = 0;
      }
      return newSubs;
    });
  };

  const handleSubtitleEndChange = (index: number, newEnd: number) => {
    if(isNaN(newEnd)) return;
    setSubtitles(prev => {
      const newSubs = [...prev];
      newSubs[index].end = newEnd;
      return newSubs;
    });
  };

  const handleSubtitleTextChange = (index: number, newText: string) => {
    setSubtitles(prev => {
      const newSubs = [...prev];
      newSubs[index].text = newText;
      return newSubs;
    });
  };

  // Step 6: Final Export (Burn SRT into Video)
  const handleExport = async () => {
    if (!videoFile) return setError("Upload a video first.");
    if (subtitles.length === 0) return setError("Please generate and review subtitles first.");

    setIsExporting(true); setError(null);
    setProcessingStep("Burning subtitles on Server...");
    
    try {
      // Re-stringify our interactive array back to a raw SRT string for FFmpeg
      const finalSrtString = stringifySRT(subtitles);

      const formData = new FormData();
      formData.append('video', videoFile); 
      formData.append('srt', finalSrtString); 

      const response = await fetch(`${BACKEND_URL}/burn-srt`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Subtitling failed");
      }

      const finalVideoBlob = await response.blob();
      const downloadUrl = URL.createObjectURL(finalVideoBlob);

      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = 'Final_Dubbed_Subtitled_Video.mp4';
      a.click();
      
      URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      console.error("Export Error:", err);
      setError("Export failed: " + err.message);
    } finally {
      setIsExporting(false); setProcessingStep("");
    }
  };

  // --- UI Helpers ---
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

  // Find the active subtitle for the live preview overlay
  const activeSubtitle = subtitles.find(s => currentTime >= s.start && currentTime <= s.end);

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans overflow-hidden">
      {generatedAudioSrc && <audio ref={audioRef} src={generatedAudioSrc} className="hidden" />}

      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 border-r border-gray-700 bg-gray-800 flex flex-col">
        {/* Header & Upload */}
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold flex items-center gap-2 mb-4">
            <Wand2 className="text-purple-400" /> AI Video Editor
          </h1>
          <input type="file" accept="video/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors mb-2 shadow-lg">
            <Upload size={16} /> Upload Video
          </button>
          
          <button onClick={handleTranscribe} disabled={!videoFile || isProcessing || isExporting} className={`w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors border ${!videoFile ? 'border-gray-600 text-gray-500' : 'border-purple-500 text-purple-400 hover:bg-purple-900/30'}`}>
            {isProcessing && processingStep.includes('Extracting') ? <><Loader2 size={16} className="animate-spin" /> {processingStep}</> : <><Sparkles size={16} /> 1. Transcribe Video</>}
          </button>
        </div>

        {/* Tabbed Editor (Script vs SRT) */}
        <div className="flex-1 flex flex-col border-b border-gray-700 overflow-hidden">
           <div className="flex bg-gray-900 border-b border-gray-700">
              <button 
                onClick={() => setActiveTab('script')} 
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 ${activeTab === 'script' ? 'bg-gray-800 text-purple-400 border-t-2 border-purple-500' : 'text-gray-500 hover:bg-gray-800/50'}`}
              >
                <Type size={14}/> Script
              </button>
              <button 
                onClick={() => setActiveTab('srt')} 
                disabled={subtitles.length === 0}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 disabled:opacity-30 ${activeTab === 'srt' ? 'bg-gray-800 text-blue-400 border-t-2 border-blue-500' : 'text-gray-500 hover:bg-gray-800/50'}`}
              >
                <Subtitles size={14}/> SRT Editor
              </button>
           </div>
           
           {/* Editor Content Area */}
           <div className="flex-1 bg-gray-900/50 overflow-y-auto">
               {activeTab === 'script' ? (
                 <div className="h-full p-4">
                     <textarea
                       value={scriptText}
                       onChange={(e) => setScriptText(e.target.value)}
                       placeholder={videoSrc ? "Extract text or start typing..." : "Upload a video..."}
                       className="w-full h-full bg-transparent border border-gray-600 rounded-lg p-3 text-sm text-gray-200 resize-none focus:ring-1 focus:ring-purple-500 focus:outline-none placeholder-gray-600 leading-relaxed"
                     />
                 </div>
               ) : (
                 <div className="p-2 space-y-2">
                    {subtitles.map((sub, index) => {
                       const isActive = currentTime >= sub.start && currentTime <= sub.end;
                       return (
                         <div 
                           key={index} 
                           className={`bg-gray-800 p-2 rounded border transition-colors cursor-pointer ${isActive ? 'border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'border-gray-700 hover:border-gray-500'}`}
                           onClick={() => { if(videoRef.current) videoRef.current.currentTime = sub.start; }}
                         >
                           <div className="flex items-center justify-between text-xs mb-1.5" onClick={e => e.stopPropagation()}>
                             <span className="text-gray-500 font-mono">#{index + 1}</span>
                             <div className="flex items-center gap-1">
                               <input
                                 type="number" step="0.1" value={sub.start.toFixed(2)}
                                 onChange={(e) => handleSubtitleShift(index, parseFloat(e.target.value))}
                                 className="w-16 bg-gray-900 border border-gray-600 rounded px-1 text-center font-mono focus:border-blue-500 focus:outline-none text-gray-300"
                                 title="Start Time (Shifts all subsequent subtitles)"
                               />
                               <span className="text-gray-500">to</span>
                               <input
                                 type="number" step="0.1" value={sub.end.toFixed(2)}
                                 onChange={(e) => handleSubtitleEndChange(index, parseFloat(e.target.value))}
                                 className="w-16 bg-gray-900 border border-gray-600 rounded px-1 text-center font-mono focus:border-blue-500 focus:outline-none text-gray-300"
                                 title="End Time"
                               />
                             </div>
                           </div>
                           <textarea
                             value={sub.text}
                             onClick={e => e.stopPropagation()}
                             onChange={(e) => handleSubtitleTextChange(index, e.target.value)}
                             className="w-full bg-gray-900 border border-gray-600 rounded p-1.5 text-xs text-blue-100 resize-none focus:border-blue-500 focus:outline-none whitespace-pre-line"
                             rows={2}
                           />
                         </div>
                       );
                    })}
                 </div>
               )}
           </div>
        </div>

        {/* Tools Panel */}
        <div className="p-4 bg-gray-800/80 space-y-4 overflow-y-auto max-h-[40vh]">
           {/* Translation */}
           <div>
             <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">2. Translate</span>
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
               <button onClick={handleTranslate} disabled={!scriptText || isProcessing || isExporting} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed">
                 Translate
               </button>
             </div>
           </div>

           {/* TTS */}
           <div>
             <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">3. AI Voiceover</span>
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
               <button onClick={handleGenerateSpeech} disabled={!scriptText || isProcessing || isExporting} className="bg-pink-600 hover:bg-pink-700 text-white px-3 py-1.5 rounded text-xs whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
                 {isProcessing && processingStep.includes('Voice') ? <Loader2 size={12} className="animate-spin" /> : "Generate"}
               </button>
             </div>

             {/* Sync Button */}
             <button 
               onClick={handleSyncVideo} 
               disabled={!generatedAudioSrc || isProcessing || isExporting} 
               className="w-full bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow"
             >
               {isProcessing && processingStep.includes('Stretching') ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
               4. Sync Video Length to Audio
             </button>
           </div>
           
           {/* Step 5: Subtitles */}
           <div>
             <div className="flex items-center justify-between mb-2 mt-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">5. Subtitles</span>
             </div>
             <button 
               onClick={handleGenerateSrt} 
               disabled={!scriptText || isProcessing || isExporting} 
               className="w-full bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 rounded text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow"
             >
               {isProcessing && processingStep.includes('Gemini') ? <Loader2 size={12} className="animate-spin" /> : <Clock size={12} />}
               Generate Timestamps
             </button>
             
             {isProcessing && (
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
                 <span className="text-gray-300">Unsynced AI Voice Active</span>
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
                disabled={!videoFile || subtitles.length === 0 || isExporting || isProcessing || !!generatedAudioSrc} 
                title={generatedAudioSrc ? "Please Sync Video to Audio before exporting" : (subtitles.length === 0 ? "Generate subtitles first" : "")}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold shadow-lg"
             >
               {isExporting || (isProcessing && processingStep.includes('Burning')) ? (
                 <><Loader2 size={14} className="animate-spin" /> Exporting...</>
               ) : (
                 <><Download size={16} /> 6. Final Export</>
               )}
             </button>
           </div>
        </div>

        {/* Video Canvas */}
        <div className="flex-1 flex items-center justify-center relative bg-gray-900 overflow-hidden">
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

              {/* LIVE SUBTITLE PREVIEW OVERLAY */}
              {activeSubtitle && (
                 <div className="absolute bottom-12 w-full flex justify-center pointer-events-none z-30">
                    <div className="bg-black/75 text-white px-4 py-2 text-xl md:text-2xl font-bold rounded text-center max-w-[80%] whitespace-pre-line shadow-[0_4px_10px_rgba(0,0,0,0.5)] border border-gray-800">
                       {activeSubtitle.text}
                    </div>
                 </div>
              )}

              {!isPlaying && (
                <div onClick={togglePlay} className="absolute inset-0 flex items-center justify-center bg-black/10 cursor-pointer z-40">
                  <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full hover:bg-white/30 transition shadow-lg">
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