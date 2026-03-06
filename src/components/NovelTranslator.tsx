import { useState, useRef } from 'react';
import { BookOpen, Loader2, AlertCircle, Upload, Download, X, ChevronDown, ArrowRightLeft, FileText, HelpCircle } from 'lucide-react';
import HelpDialog from './HelpDialog';

interface NovelTranslatorProps {
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
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'sv', name: 'Swedish' },
  { code: 'tr', name: 'Turkish' },
];

const FILE_FORMATS = [
  { id: 'txt', label: 'TXT', description: 'Plain text file' },
  { id: 'docx', label: 'DOCX', description: 'Microsoft Word' },
];

export default function NovelTranslator({ isAuthenticated, onLoginClick }: NovelTranslatorProps) {
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [outputFormat, setOutputFormat] = useState('txt');
  const [translatedDocument, setTranslatedDocument] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = [
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt',
      '.docx',
    ];

    const validExtensions = ['.txt', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      setError('Please upload a valid document file (TXT, DOCX)');
      return;
    }

    setDocumentFile(file);
    setError(null);
    setTranslatedDocument(null);
    setProgress(0);
  };

  const handleTranslate = async () => {
    if (!documentFile) {
      setError('Please upload a document file first');
      return;
    }

    if (sourceLanguage === targetLanguage) {
      setError('Source and target languages must be different');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', documentFile);
      formData.append('sourceLang', sourceLanguage);
      formData.append('targetLang', targetLanguage);
      formData.append('outputFormat', outputFormat);

      const response = await fetch('http://localhost:8080/api/novel-translator/translate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to translate document');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setTranslatedDocument(url);
      setProgress(100);
    } catch (err: any) {
      setError(err.message || 'Failed to translate document. Please try again.');
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!translatedDocument) return;

    const a = document.createElement('a');
    a.href = translatedDocument;
    const extension = outputFormat === 'txt' ? '.txt' : '.docx';
    a.download = `translated-document-${Date.now()}${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const swapLanguages = () => {
    const tempLang = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(tempLang);
  };

  const handleRemoveFile = () => {
    setDocumentFile(null);
    setTranslatedDocument(null);
    setError(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isAuthenticated) {
    return (
      <section className="mt-6 rounded-[2.5rem] border border-white/15 bg-white/6 backdrop-blur-3xl p-10 flex flex-col items-center justify-center text-center space-y-4 shadow-2xl">
        <div className="p-4 rounded-full bg-white/10 border border-white/20 mb-2">
          <BookOpen className="w-8 h-8 text-orange-300" />
        </div>
        <h2 className="text-2xl font-semibold">Sign in to unlock Novel Translator</h2>
        <p className="text-sm md:text-base text-white/65 max-w-md">
          Login or create an account to translate long-form documents and ebooks.
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
          <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-white">Novel Translator</h1>
              <button
                onClick={() => setShowHelp(true)}
                className="p-1.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg hover:bg-white/15 transition-all duration-300"
              >
                <HelpCircle className="w-4 h-4 text-white/60" />
              </button>
            </div>
            <p className="text-sm text-white/60">Translate long-form documents and ebooks</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
              Upload Document
            </label>
            {!documentFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center cursor-pointer hover:border-orange-400/50 hover:bg-white/5 transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
                }}
              >
                <Upload className="w-12 h-12 text-white/40 mx-auto mb-3" />
                <p className="text-white/70 mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-white/50">TXT, DOCX files</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-white/8 border border-white/15 backdrop-blur-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <FileText className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{documentFile.name}</p>
                    <p className="text-xs text-white/50">
                      {(documentFile.size / (1024 * 1024)).toFixed(2)} MB
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
                  className="w-full px-4 py-3 pr-10 bg-white/8 backdrop-blur-xl border border-white/15 rounded-xl text-white focus:outline-none focus:border-orange-400/50 focus:bg-white/12 transition-all duration-300 appearance-none cursor-pointer"
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
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(249,115,22,0.1) 100%)'
              }}
            >
              <ArrowRightLeft className="w-4 h-4 text-orange-400" />
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
                  className="w-full px-4 py-3 pr-10 bg-white/8 backdrop-blur-xl border border-white/15 rounded-xl text-white focus:outline-none focus:border-orange-400/50 focus:bg-white/12 transition-all duration-300 appearance-none cursor-pointer"
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

          <div>
            <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
              Output Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              {FILE_FORMATS.map((format) => (
                <button
                  key={format.id}
                  onClick={() => setOutputFormat(format.id)}
                  className={`p-3 rounded-xl border backdrop-blur-xl text-center transition-all duration-300 ${
                    outputFormat === format.id
                      ? 'bg-orange-500/20 border-orange-400/50 shadow-lg shadow-orange-500/20'
                      : 'bg-white/8 border-white/15 hover:bg-white/12'
                  }`}
                  style={{
                    background: outputFormat === format.id
                      ? 'linear-gradient(135deg, rgba(249,115,22,0.2) 0%, rgba(245,158,11,0.15) 100%)'
                      : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.05) 100%)'
                  }}
                >
                  <p className="text-sm font-medium text-white">{format.label}</p>
                  <p className="text-xs text-white/50 mt-1">{format.description}</p>
                </button>
              ))}
            </div>
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>Translating document...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300"
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
            onClick={handleTranslate}
            disabled={isProcessing || !documentFile || sourceLanguage === targetLanguage}
            className="w-full px-6 py-4 bg-gradient-to-r from-orange-500/90 to-amber-500/90 backdrop-blur-2xl text-white font-medium rounded-full hover:from-orange-600 hover:to-amber-600 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 flex items-center justify-center space-x-2 shadow-xl shadow-orange-500/40 border border-orange-400/40"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Translating document...</span>
              </>
            ) : (
              <>
                <BookOpen className="w-5 h-5" />
                <span>Translate Document</span>
              </>
            )}
          </button>

          {translatedDocument && (
            <button
              onClick={handleDownload}
              className="w-full px-6 py-4 bg-white/10 backdrop-blur-2xl text-white font-medium rounded-full hover:bg-white/15 hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2 shadow-xl border border-white/25"
            >
              <Download className="w-5 h-5 text-orange-400" />
              <span>Download Translated Document</span>
            </button>
          )}
        </div>
      </div>

      <HelpDialog
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        title="How to Use Novel Translator"
        content={
          <>
            <p><strong>Step 1: Upload Document</strong></p>
            <p>Upload your document file (TXT or DOCX format) by clicking the upload area or dragging and dropping.</p>
            
            <p><strong>Step 2: Select Languages</strong></p>
            <p>Choose the source language (language of your document) and target language (language to translate to). Use the swap button to switch languages.</p>
            
            <p><strong>Step 3: Choose Output Format</strong></p>
            <p>Select the format for your translated document: TXT (plain text) or DOCX (Microsoft Word format).</p>
            
            <p><strong>Step 4: Translate</strong></p>
            <p>Click "Translate Document" to process your file. The system will translate the entire document while preserving formatting. Download the translated document when complete.</p>
          </>
        }
      />
    </div>
  );
}
