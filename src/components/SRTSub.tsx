import { useState, useRef } from 'react';
import { FileText, Loader2, Upload, Download, AlertCircle, ChevronDown, ArrowRightLeft, Eye, X, HelpCircle } from 'lucide-react';
import HelpDialog from './HelpDialog';

interface SRTSubProps {
  isAuthenticated: boolean;
  onLoginClick: () => void;
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
];

interface SubtitleEntry {
  id: number;
  startTime: string;
  endTime: string;
  text: string;
}

export default function SRTSub({ isAuthenticated, onLoginClick }: SRTSubProps) {
  const [srtFile, setSrtFile] = useState<File | null>(null);
  const [srtContent, setSrtContent] = useState<string>('');
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [translatedSrt, setTranslatedSrt] = useState<string>('');
  const [subtitleEntries, setSubtitleEntries] = useState<SubtitleEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseSRT = (content: string): SubtitleEntry[] => {
    const entries: SubtitleEntry[] = [];
    const blocks = content.trim().split(/\n\s*\n/);
    
    for (const block of blocks) {
      const lines = block.trim().split('\n');
      if (lines.length < 3) continue;
      
      const id = parseInt(lines[0]);
      if (isNaN(id)) continue;
      
      const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);
      if (!timeMatch) continue;
      
      const text = lines.slice(2).join('\n').trim();
      entries.push({
        id,
        startTime: timeMatch[1],
        endTime: timeMatch[2],
        text,
      });
    }
    
    return entries;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.srt')) {
      setError('Please upload a valid .srt file');
      return;
    }

    setSrtFile(file);
    setError(null);
    setTranslatedSrt('');
    setSubtitleEntries([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setSrtContent(content);
      const entries = parseSRT(content);
      setSubtitleEntries(entries);
    };
    reader.readAsText(file);
  };

  const handleTranslate = async () => {
    if (!srtContent.trim()) {
      setError('Please upload an SRT file first');
      return;
    }

    if (sourceLanguage === targetLanguage) {
      setError('Source and target languages must be different');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', srtFile!);
      formData.append('sourceLang', sourceLanguage);
      formData.append('targetLang', targetLanguage);

      const response = await fetch('http://localhost:8080/api/srt-sub/translate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to translate SRT file');
      }

      const translatedContent = await response.text();
      setTranslatedSrt(translatedContent);
      const entries = parseSRT(translatedContent);
      setSubtitleEntries(entries);
    } catch (err: any) {
      setError(err.message || 'Failed to translate SRT file. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!translatedSrt) return;

    const blob = new Blob([translatedSrt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translated-subtitles-${Date.now()}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const swapLanguages = () => {
    const tempLang = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(tempLang);
    if (translatedSrt) {
      setSrtContent(translatedSrt);
      setTranslatedSrt(srtContent);
      const entries = parseSRT(translatedSrt);
      setSubtitleEntries(entries);
    }
  };

  const handleRemoveFile = () => {
    setSrtFile(null);
    setSrtContent('');
    setTranslatedSrt('');
    setSubtitleEntries([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isAuthenticated) {
    return (
      <section className="mt-6 rounded-[2.5rem] border border-white/15 bg-white/6 backdrop-blur-3xl p-10 flex flex-col items-center justify-center text-center space-y-4 shadow-2xl">
        <div className="p-4 rounded-full bg-white/10 border border-white/20 mb-2">
          <FileText className="w-8 h-8 text-sky-300" />
        </div>
        <h2 className="text-2xl font-semibold">Sign in to unlock SRT Sub</h2>
        <p className="text-sm md:text-base text-white/65 max-w-md">
          Login or create an account to translate and adapt existing SRT subtitle files.
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
          <div className="p-3 bg-gradient-to-br from-sky-500 to-blue-500 rounded-2xl">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-white">SRT Sub</h1>
              <button
                onClick={() => setShowHelp(true)}
                className="p-1.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg hover:bg-white/15 transition-all duration-300"
              >
                <HelpCircle className="w-4 h-4 text-white/60" />
              </button>
            </div>
            <p className="text-sm text-white/60">Translate and adapt existing SRT subtitle files</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
              Upload SRT File
            </label>
            {!srtFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center cursor-pointer hover:border-sky-400/50 hover:bg-white/5 transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
                }}
              >
                <Upload className="w-12 h-12 text-white/40 mx-auto mb-3" />
                <p className="text-white/70 mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-white/50">SRT files only</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".srt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-white/8 border border-white/15 backdrop-blur-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-sky-500/20 rounded-lg">
                    <FileText className="w-5 h-5 text-sky-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{srtFile.name}</p>
                    <p className="text-xs text-white/50">
                      {subtitleEntries.length} subtitle entries
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="px-3 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg hover:bg-white/15 transition-all duration-300 flex items-center gap-2 text-xs"
                  >
                    <Eye className="w-4 h-4 text-sky-400" />
                    <span>Preview</span>
                  </button>
                  <button
                    onClick={handleRemoveFile}
                    className="p-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg hover:bg-white/15 transition-all duration-300"
                  >
                    <X className="w-4 h-4 text-white/70" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-end">
            <div>
              <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
                Source Language
              </label>
              <div className="relative">
                <select
                  value={sourceLanguage}
                  onChange={(e) => setSourceLanguage(e.target.value)}
                  className="w-full px-4 py-3 pr-10 bg-white/8 backdrop-blur-xl border border-white/15 rounded-xl text-white focus:outline-none focus:border-sky-400/50 focus:bg-white/12 transition-all duration-300 appearance-none cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.05) 100%)'
                  }}
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-black/90">
                      {lang.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown className="w-5 h-5 text-white/60" />
                </div>
              </div>
            </div>

            <button
              onClick={swapLanguages}
              className="px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl hover:bg-white/15 transition-all duration-300 flex items-center justify-center gap-2 mb-0"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(14,165,233,0.1) 100%)'
              }}
            >
              <ArrowRightLeft className="w-4 h-4 text-sky-400" />
              <span className="text-sm font-medium">Swap</span>
            </button>

            <div>
              <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
                Target Language
              </label>
              <div className="relative">
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="w-full px-4 py-3 pr-10 bg-white/8 backdrop-blur-xl border border-white/15 rounded-xl text-white focus:outline-none focus:border-sky-400/50 focus:bg-white/12 transition-all duration-300 appearance-none cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.05) 100%)'
                  }}
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-black/90">
                      {lang.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown className="w-5 h-5 text-white/60" />
                </div>
              </div>
            </div>
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
            onClick={handleTranslate}
            disabled={isProcessing || !srtFile || sourceLanguage === targetLanguage}
            className="w-full px-6 py-4 bg-gradient-to-r from-sky-500/90 to-blue-500/90 backdrop-blur-2xl text-white font-medium rounded-full hover:from-sky-600 hover:to-blue-600 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 flex items-center justify-center space-x-2 shadow-xl shadow-sky-500/40 border border-sky-400/40"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Translating subtitles...</span>
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                <span>Translate SRT</span>
              </>
            )}
          </button>

          {translatedSrt && (
            <button
              onClick={handleDownload}
              className="w-full px-6 py-4 bg-white/10 backdrop-blur-2xl text-white font-medium rounded-full hover:bg-white/15 hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2 shadow-xl border border-white/25"
            >
              <Download className="w-5 h-5 text-sky-400" />
              <span>Download Translated SRT</span>
            </button>
          )}
        </div>
      </div>

      {showPreview && subtitleEntries.length > 0 && (
        <div className="rounded-[2.5rem] border border-white/15 bg-white/6 backdrop-blur-3xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Subtitle Preview</h2>
            <button
              onClick={() => setShowPreview(false)}
              className="p-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg hover:bg-white/15 transition-all duration-300"
            >
              <X className="w-4 h-4 text-white/70" />
            </button>
          </div>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {subtitleEntries.slice(0, 20).map((entry) => (
              <div
                key={entry.id}
                className="p-4 rounded-xl bg-white/8 border border-white/15 backdrop-blur-xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.05) 100%)'
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/50">#{entry.id}</span>
                  <span className="text-xs text-white/50">
                    {entry.startTime} → {entry.endTime}
                  </span>
                </div>
                <p className="text-sm text-white/90 whitespace-pre-wrap">{entry.text}</p>
              </div>
            ))}
            {subtitleEntries.length > 20 && (
              <p className="text-xs text-white/50 text-center py-2">
                Showing first 20 entries of {subtitleEntries.length} total
              </p>
            )}
          </div>
        </div>
      )}

      <HelpDialog
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        title="How to Use SRT Sub"
        content={
          <>
            <p><strong>Step 1: Upload SRT File</strong></p>
            <p>Upload your existing SRT subtitle file by clicking the upload area or dragging and dropping.</p>
            
            <p><strong>Step 2: Select Languages</strong></p>
            <p>Choose the source language (language of your SRT file) and target language (language to translate to). Use the swap button to switch languages.</p>
            
            <p><strong>Step 3: Translate</strong></p>
            <p>Click "Translate SRT" to process your subtitle file. The system will translate all subtitle entries while preserving timing.</p>
            
            <p><strong>Step 4: Preview & Download</strong></p>
            <p>Use the Preview button to review translated subtitles. Each entry shows the ID, time codes, and translated text. Download the translated SRT file when ready.</p>
          </>
        }
      />
    </div>
  );
}
