import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';

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
    category: 'Video to Text',
    title: 'Transcribe',
    description: 'Convert media to accurate word-for-word transcripts.',
    accentFrom: 'from-indigo-500',
    accentTo: 'to-blue-500',
    status: 'available',
    href: '/caption-studio',
  },
  {
    id: 'video-recap',
    category: 'Studio Editor',
    title: 'Video Recap',
    description: 'Create AI-powered recap videos from long content.',
    accentFrom: 'from-sky-500',
    accentTo: 'to-cyan-400',
    status: 'planned',
  },
  {
    id: 'master-editor',
    category: 'Studio Editor',
    title: 'Master Editor',
    description: 'Browser-based video/audio editing with AI assist.',
    accentFrom: 'from-slate-800',
    accentTo: 'to-slate-600',
    status: 'planned',
  },
  {
    id: 'recapper',
    category: 'Scripts & Ideas',
    title: 'Recapper',
    description: 'Turn videos into recap scripts with tone and POV.',
    accentFrom: 'from-emerald-500',
    accentTo: 'to-lime-400',
    status: 'planned',
  },
  {
    id: 'content-creator',
    category: 'Scripts & Ideas',
    title: 'Content Creator',
    description: 'Write hooks, captions, and social-ready scripts.',
    accentFrom: 'from-rose-500',
    accentTo: 'to-pink-500',
    status: 'planned',
  },
  {
    id: 'translate',
    category: 'Translation',
    title: 'Translate',
    description: 'Multi-language translation for scripts and captions.',
    accentFrom: 'from-emerald-500',
    accentTo: 'to-teal-400',
    status: 'planned',
  },
  {
    id: 'srt-sub',
    category: 'Translation',
    title: 'SRT Sub',
    description: 'Translate and adapt existing SRT subtitle files.',
    accentFrom: 'from-sky-500',
    accentTo: 'to-blue-400',
    status: 'planned',
  },
];

export default function Header({ isAuthenticated, user, points, onLoginClick, onLogout }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isModelsOpen, setIsModelsOpen] = useState(false);

  return (
    <header className="flex items-center justify-between rounded-full px-6 py-3 bg-white/5 border border-white/10 backdrop-blur-3xl shadow-xl">
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
          Home
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
            AI Models
            <span className="text-[10px]">▾</span>
          </button>
          {isModelsOpen && (
            <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-black/80 border border-white/15 backdrop-blur-2xl shadow-2xl p-3 z-50">
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
        {isAuthenticated && user ? (
          <>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20">
              <span className="text-[10px] uppercase tracking-[0.16em] text-white/50">Points</span>
              <span className="text-sm font-semibold text-amber-300">{points}</span>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 rounded-full text-xs md:text-sm font-medium bg-white/10 hover:bg-white/16 border border-white/25 transition-all"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onLoginClick}
              className="px-4 py-2 rounded-full text-xs md:text-sm font-medium bg-white/6 hover:bg-white/10 border border-white/20 transition-all"
            >
              Login
            </button>
            <button
              onClick={onLoginClick}
              className="px-4 py-2 rounded-full text-xs md:text-sm font-medium bg-gradient-to-r from-purple-500/90 to-purple-600/90 shadow-lg shadow-purple-500/40 border border-purple-400/60 hover:from-purple-600 hover:to-purple-700 transition-all"
            >
              Sign up
            </button>
          </>
        )}
      </div>
    </header>
  );
}
