import { useState } from 'react';
import { Languages, Loader2, Copy, Check, AlertCircle, ArrowRightLeft, ChevronDown, HelpCircle } from 'lucide-react';
import HelpDialog from './HelpDialog';

interface TranslateProps {
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

export default function Translate({ isAuthenticated, onLoginClick }: TranslateProps) {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      setError('Please enter text to translate');
      return;
    }

    if (sourceLanguage === targetLanguage) {
      setError('Source and target languages must be different');
      return;
    }

    setIsTranslating(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8080/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: sourceText,
          sourceLang: sourceLanguage,
          targetLang: targetLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to translate text');
      }

      const data = await response.json();
      setTranslatedText(data.translatedText || '');
    } catch (err: any) {
      setError(err.message || 'Failed to translate. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const swapLanguages = () => {
    const tempLang = sourceLanguage;
    const tempText = sourceText;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(tempLang);
    setSourceText(translatedText);
    setTranslatedText(tempText);
  };

  if (!isAuthenticated) {
    return (
      <section className="mt-6 rounded-[2.5rem] border border-white/15 bg-white/6 backdrop-blur-3xl p-10 flex flex-col items-center justify-center text-center space-y-4 shadow-2xl">
        <div className="p-4 rounded-full bg-white/10 border border-white/20 mb-2">
          <Languages className="w-8 h-8 text-emerald-300" />
        </div>
        <h2 className="text-2xl font-semibold">Sign in to unlock Translate</h2>
        <p className="text-sm md:text-base text-white/65 max-w-md">
          Login or create an account to translate scripts and captions into multiple languages.
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
          <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl">
            <div className="text-white font-bold text-lg leading-none" style={{ fontFamily: 'monospace' }}>
              A<span className="text-teal-200">X</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-white">Translate</h1>
              <button
                onClick={() => setShowHelp(true)}
                className="p-1.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg hover:bg-white/15 transition-all duration-300"
              >
                <HelpCircle className="w-4 h-4 text-white/60" />
              </button>
            </div>
            <p className="text-sm text-white/60">Multi-language translation for scripts and captions</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="relative">
            <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-end">
              <div>
                <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
                  Source Language
                </label>
                <div className="relative">
                  <select
                    value={sourceLanguage}
                    onChange={(e) => setSourceLanguage(e.target.value)}
                    className="w-full px-4 py-3 pr-10 bg-white/8 backdrop-blur-xl border border-white/15 rounded-xl text-white focus:outline-none focus:border-emerald-400/50 focus:bg-white/12 transition-all duration-300 appearance-none cursor-pointer"
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
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(16,185,129,0.1) 100%)'
                }}
              >
                <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
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
                    className="w-full px-4 py-3 pr-10 bg-white/8 backdrop-blur-xl border border-white/15 rounded-xl text-white focus:outline-none focus:border-emerald-400/50 focus:bg-white/12 transition-all duration-300 appearance-none cursor-pointer"
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
                Source Text
              </label>
              <textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="Enter text to translate..."
                className="w-full px-4 py-4 bg-white/8 backdrop-blur-xl border border-white/15 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:border-emerald-400/50 focus:bg-white/12 transition-all duration-300 min-h-[300px] resize-y"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.05) 100%)'
                }}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs uppercase tracking-[0.16em] text-white/60">
                  Translated Text
                </label>
                {translatedText && (
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg hover:bg-white/15 transition-all duration-300 flex items-center gap-2 text-xs"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-emerald-400" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <textarea
                value={translatedText}
                readOnly
                placeholder="Translation will appear here..."
                className="w-full px-4 py-4 bg-white/8 backdrop-blur-xl border border-white/15 rounded-2xl text-white placeholder-white/50 min-h-[300px] resize-y"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.05) 100%)'
                }}
              />
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
            disabled={isTranslating || !sourceText.trim()}
            className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500/90 to-teal-500/90 backdrop-blur-2xl text-white font-medium rounded-full hover:from-emerald-600 hover:to-teal-600 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 flex items-center justify-center space-x-2 shadow-xl shadow-emerald-500/40 border border-emerald-400/40"
          >
            {isTranslating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Translating...</span>
              </>
            ) : (
              <>
                <div className="text-white font-bold text-lg leading-none" style={{ fontFamily: 'monospace' }}>
                  A<span className="text-teal-200">X</span>
                </div>
                <span>Translate</span>
              </>
            )}
          </button>
        </div>
      </div>

      <HelpDialog
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        title="How to Use Translate"
        content={
          <>
            <p><strong>Step 1: Enter Text</strong></p>
            <p>Type or paste the text you want to translate into the source text area.</p>
            
            <p><strong>Step 2: Select Languages</strong></p>
            <p>Choose the source language (language of your text) and target language (language to translate to) from the dropdown menus. Use the swap button to quickly switch between them.</p>
            
            <p><strong>Step 3: Translate</strong></p>
            <p>Click "Translate" to convert your text. The translated text will appear in the target text area.</p>
            
            <p><strong>Step 4: Copy or Use</strong></p>
            <p>Use the copy button to copy the translated text to your clipboard, or directly use it from the text area.</p>
          </>
        }
      />
    </div>
  );
}
