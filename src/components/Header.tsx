import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { Globe, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  isAuthenticated: boolean;
  user: { name?: string; email?: string } | null;
  points: number;
  onLoginClick: () => void;
  onLogout: () => void;
}

type FeatureStatus = 'available' | 'planned';

interface FeatureCard {
  id: string;
  category: string;
  title: string;
  description: string;
  accentFrom: string;
  accentTo: string;
  status: FeatureStatus;
  href?: string;
}

const FEATURES: FeatureCard[] = [
  {
    id: 'transcribe',
    category: 'Auto Caption',
    title: 'Auto Caption',
    description: 'Automatically generate captions from video to text.',
    accentFrom: 'from-indigo-500',
    accentTo: 'to-blue-500',
    status: 'available',
    href: '/caption-studio',
  },
  {
    id: 'video-recap',
    category: 'Studio Editor',
    title: 'Video Recap',
    description: 'Sync voiceovers, remove original audio, and add logos.',
    accentFrom: 'from-sky-500',
    accentTo: 'to-cyan-400',
    status: 'available',
    href: '/video-recap',
  },
  {
    id: 'master-editor',
    category: 'Studio Editor',
    title: 'Master Editor',
    description: 'Browser-based video/audio editing with AI assist.',
    accentFrom: 'from-slate-800',
    accentTo: 'to-slate-600',
    status: 'available',
    href: '/master-editor',
  },
  {
    id: 'recapper',
    category: 'Scripts & Ideas',
    title: 'Recapper',
    description: 'Turn videos into recap scripts with tone and POV.',
    accentFrom: 'from-emerald-500',
    accentTo: 'to-lime-400',
    status: 'available',
    href: '/recapper',
  },
  {
    id: 'story-creator',
    category: 'Scripts & Ideas',
    title: 'Story Creator',
    description: 'Generate long-form storylines and narratives.',
    accentFrom: 'from-purple-500',
    accentTo: 'to-fuchsia-500',
    status: 'available',
    href: '/story-creator',
  },
  {
    id: 'content-creator',
    category: 'Scripts & Ideas',
    title: 'Content Creator',
    description: 'Write hooks, captions, and social-ready scripts.',
    accentFrom: 'from-rose-500',
    accentTo: 'to-pink-500',
    status: 'available',
    href: '/content-creator',
  },
  {
    id: 'translate',
    category: 'Translation',
    title: 'Translate',
    description: 'Multi-language translation for scripts and captions.',
    accentFrom: 'from-emerald-500',
    accentTo: 'to-teal-400',
    status: 'available',
    href: '/translate',
  },
  {
    id: 'srt-sub',
    category: 'Translation',
    title: 'SRT Sub',
    description: 'Translate and adapt existing SRT subtitle files.',
    accentFrom: 'from-sky-500',
    accentTo: 'to-blue-400',
    status: 'available',
    href: '/srt-sub',
  },
  {
    id: 'novel-translate',
    category: 'Translation',
    title: 'Novel Translator',
    description: 'Translate long-form documents and ebooks.',
    accentFrom: 'from-orange-500',
    accentTo: 'to-amber-400',
    status: 'available',
    href: '/novel-translator',
  },
  {
    id: 'thumbnail',
    category: 'Pro Designer',
    title: 'Thumbnail',
    description: 'Design scroll-stopping thumbnails with prompts.',
    accentFrom: 'from-amber-500',
    accentTo: 'to-orange-500',
    status: 'available',
    href: '/thumbnail',
  },
  {
    id: 'ai-voice',
    category: 'Text-to-Audio',
    title: 'AI Voice',
    description: 'Turn scripts into natural-sounding voices.',
    accentFrom: 'from-pink-500',
    accentTo: 'to-rose-500',
    status: 'available',
    href: '/ai-voice',
  },
  {
    id: 'voice-gen',
    category: 'Real-time Stream',
    title: 'Voice Gen Live',
    description: 'Generate live narration with smart pausing.',
    accentFrom: 'from-violet-500',
    accentTo: 'to-indigo-500',
    status: 'available',
    href: '/voice-gen-live',
  },
  {
    id: 'sub-gen',
    category: 'Auto Align',
    title: 'Sub Gen',
    description: 'Create perfectly-timed SRT subtitle files.',
    accentFrom: 'from-blue-500',
    accentTo: 'to-cyan-400',
    status: 'available',
    href: '/sub-gen',
  },
  {
    id: 'transcribe-feature',
    category: 'Video to Text',
    title: 'Transcribe',
    description: 'Convert audio or video to text transcription.',
    accentFrom: 'from-indigo-500',
    accentTo: 'to-blue-500',
    status: 'available',
    href: '/transcribe',
  },
  {
    id: 'news-automation',
    category: 'Automation',
    title: 'News Automation',
    description: 'Automate news collection, translation, and email delivery.',
    accentFrom: 'from-orange-500',
    accentTo: 'to-amber-500',
    status: 'available',
    href: '/news-automation',
  },
  {
    id: 'viral-shorts',
    category: 'Shorts',
    title: 'Viral Shorts',
    description: 'AI finds viral moments; trim, preview, or combine segments into 9:16 vertical.',
    accentFrom: 'from-amber-500',
    accentTo: 'to-orange-500',
    status: 'available',
    href: '/viral-shorts',
  },
];

export default function Header({ isAuthenticated, user, points, onLoginClick, onLogout }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [isModelsOpen, setIsModelsOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
    setIsLangOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };

    if (isLangOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLangOpen]);

  return (
    <>
      {isModelsOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20"
          onClick={() => setIsModelsOpen(false)}
        />
      )}
      <header className="sticky top-0 z-30 flex items-center justify-between rounded-full px-6 py-3 bg-white/10 border border-white/10 backdrop-blur-3xl shadow-xl">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-amber-400/15 flex items-center justify-center border border-amber-300/40">
          <span className="text-amber-300 text-lg font-semibold">AI</span>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/50">Dashboard</p>
          <p className="text-sm md:text-base font-semibold text-white">Your AI Minions</p>
        </div>
      </div>
      <nav className="hidden md:flex items-center gap-4 text-xs md:text-sm text-white/70 relative">
        <Link
          to="/"
          className={`px-3 py-1.5 rounded-full transition-colors ${
            location.pathname === '/' ? 'bg-white/15 text-white shadow-sm' : 'hover:bg-white/10'
          }`}
        >
          {t('common.home')}
        </Link>
        <div
          className="relative"
          onMouseEnter={() => setIsModelsOpen(true)}
          onMouseLeave={() => setIsModelsOpen(false)}
        >
          <button
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-colors ${
              isModelsOpen ? 'bg-white/15 text-white shadow-sm' : 'hover:bg-white/10'
            }`}
            type="button"
          >
            {t('common.aiModels')}
            <span className="text-[10px]">▾</span>
          </button>
          {isModelsOpen && (
            <div className="absolute left-0 top-full mt-2 w-72 rounded-2xl bg-black/80 border border-white/15 backdrop-blur-3xl shadow-2xl p-3 z-[100]">
              {Array.from(
                FEATURES.reduce((map, feature) => {
                  const key = feature.category;
                  if (!map.has(key)) map.set(key, [] as FeatureCard[]);
                  (map.get(key) as FeatureCard[]).push(feature);
                  return map;
                }, new Map<string, FeatureCard[]>())
              ).map(([category, items]) => (
                <div key={category} className="mb-3 last:mb-0">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/55 mb-1 px-1">
                    {category}
                  </p>
                  {items.map((feature) => {
                    const isAvailable = feature.status === 'available';
                    const handleClick = () => {
                      if (!isAvailable || !feature.href) return;
                      navigate(feature.href);
                      setIsModelsOpen(false);
                    };
                    return (
                      <button
                        key={feature.id}
                        onClick={handleClick}
                        disabled={!isAvailable || !feature.href}
                        className={`w-full text-left text-xs px-2.5 py-1.5 rounded-xl flex items-center justify-between transition-colors ${
                          isAvailable
                            ? 'hover:bg-white/10 text-white'
                            : 'text-white/50 cursor-default'
                        }`}
                        type="button"
                      >
                        <span>{feature.title}</span>
                        <span className="text-[10px] text-white/50">
                          {isAvailable ? 'Go' : 'Soon'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </nav>
      <div className="flex items-center gap-3">
        <div className="relative" ref={langDropdownRef}>
          <button
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 transition-all"
            type="button"
          >
            <Globe className="w-4 h-4 text-white/70" />
          </button>
          {isLangOpen && (
            <div className="absolute right-0 top-full mt-2 w-32 rounded-xl bg-black/80 border border-white/15 backdrop-blur-3xl shadow-2xl p-2 z-[100]">
              <button
                onClick={() => changeLanguage('en')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  i18n.language === 'en' ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10'
                }`}
                type="button"
              >
                English
              </button>
              <button
                onClick={() => changeLanguage('my')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  i18n.language === 'my' ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10'
                }`}
                type="button"
              >
                မြန်မာ
              </button>
            </div>
          )}
        </div>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 transition-all"
          type="button"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-white/70" />
          ) : (
            <Moon className="w-4 h-4 text-white/70" />
          )}
        </button>
        {isAuthenticated && user ? (
          <>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20">
              <span className="text-[10px] uppercase tracking-[0.16em] text-white/50">{t('common.points')}</span>
              <span className="text-sm font-semibold text-amber-300">{points}</span>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 rounded-full text-xs md:text-sm font-medium bg-white/10 hover:bg-white/16 border border-white/25 transition-all"
            >
              {t('common.logout')}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onLoginClick}
              className="px-4 py-2 rounded-full text-xs md:text-sm font-medium bg-white/6 hover:bg-white/10 border border-white/20 transition-all"
            >
              {t('common.login')}
            </button>
            <button
              onClick={onLoginClick}
              className="px-4 py-2 rounded-full text-xs md:text-sm font-medium bg-gradient-to-r from-purple-500/90 to-purple-600/90 shadow-lg shadow-purple-500/40 border border-purple-400/60 hover:from-purple-600 hover:to-purple-700 transition-all"
            >
              {t('common.signUp')}
            </button>
          </>
        )}
      </div>
    </header>
    </>
  );
}
