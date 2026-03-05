import { useNavigate } from 'react-router-dom';

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
    category: 'Full Suite',
    title: 'Master Editor',
    description: 'Browser-based video/audio editing with AI assist.',
    accentFrom: 'from-slate-800',
    accentTo: 'to-slate-600',
    status: 'planned',
  },
  {
    id: 'recapper',
    category: 'AI Script Gen',
    title: 'Recapper',
    description: 'Turn videos into recap scripts with tone and POV.',
    accentFrom: 'from-emerald-500',
    accentTo: 'to-lime-400',
    status: 'planned',
  },
  {
    id: 'content-creator',
    category: 'Social & Scripts',
    title: 'Content Creator',
    description: 'Write hooks, captions, and social-ready scripts.',
    accentFrom: 'from-rose-500',
    accentTo: 'to-pink-500',
    status: 'planned',
  },
  {
    id: 'story-creator',
    category: 'AI Novel Engine',
    title: 'Story Creator',
    description: 'Generate long-form storylines and narratives.',
    accentFrom: 'from-purple-500',
    accentTo: 'to-fuchsia-500',
    status: 'planned',
  },
  {
    id: 'thumbnail',
    category: 'Pro Designer',
    title: 'Thumbnail',
    description: 'Design scroll-stopping thumbnails with prompts.',
    accentFrom: 'from-amber-500',
    accentTo: 'to-orange-500',
    status: 'planned',
  },
  {
    id: 'translate',
    category: 'Creative AI',
    title: 'Translate',
    description: 'Multi-language translation for scripts and captions.',
    accentFrom: 'from-emerald-500',
    accentTo: 'to-teal-400',
    status: 'planned',
  },
  {
    id: 'srt-sub',
    category: 'Translator',
    title: 'SRT Sub',
    description: 'Translate and adapt existing SRT subtitle files.',
    accentFrom: 'from-sky-500',
    accentTo: 'to-blue-400',
    status: 'planned',
  },
  {
    id: 'novel-translate',
    category: 'Localization',
    title: 'Novel Translator',
    description: 'Translate long-form documents and ebooks.',
    accentFrom: 'from-orange-500',
    accentTo: 'to-amber-400',
    status: 'planned',
  },
  {
    id: 'ai-voice',
    category: 'Text-to-Audio',
    title: 'AI Voice',
    description: 'Turn scripts into natural-sounding voices.',
    accentFrom: 'from-pink-500',
    accentTo: 'to-rose-500',
    status: 'planned',
  },
  {
    id: 'voice-gen',
    category: 'Real-time Stream',
    title: 'Voice Gen Live',
    description: 'Generate live narration with smart pausing.',
    accentFrom: 'from-violet-500',
    accentTo: 'to-indigo-500',
    status: 'planned',
  },
  {
    id: 'sub-gen',
    category: 'Auto Align',
    title: 'Sub Gen',
    description: 'Create perfectly-timed SRT subtitle files.',
    accentFrom: 'from-blue-500',
    accentTo: 'to-cyan-400',
    status: 'planned',
  },
];

interface HomeProps {
  isAuthenticated: boolean;
  user: { name?: string; email?: string } | null;
  onLoginClick: () => void;
}

export default function Home({ isAuthenticated, user, onLoginClick }: HomeProps) {
  const navigate = useNavigate();

  const handleFeatureClick = (feature: FeatureCard) => {
    if (feature.status === 'available' && feature.href) {
      navigate(feature.href);
    }
  };

  return (
    <>
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-center pt-2">
        <div className="space-y-5">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight">
            Create viral-ready videos in a modern AI studio.
          </h1>
          <p className="text-sm md:text-base text-white/70 max-w-xl">
            Upload once, and let your AI tools handle captions, dubs and scripts in a single, sleek studio.
          </p>
          <div className="flex flex-wrap gap-3 items-center">
            {!isAuthenticated ? (
              <>
                <button
                  onClick={onLoginClick}
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-500/90 to-purple-600/90 text-sm font-medium shadow-lg shadow-purple-500/40 border border-purple-400/60 hover:from-purple-600 hover:to-purple-700 transition-all"
                >
                  Login to get started
                </button>
                <button
                  onClick={onLoginClick}
                  className="px-5 py-3 rounded-full bg-white/8 border border-white/20 text-sm font-medium hover:bg-white/12 transition-all"
                >
                  Create free account
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/caption-studio')}
                  className="px-6 py-3 rounded-full bg-white/10 border border-white/25 text-sm font-medium hover:bg-white/16 transition-all"
                >
                  Open Caption Studio
                </button>
                <div className="flex items-center gap-2 text-xs md:text-sm text-white/70">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 text-xs">
                    ✓
                  </span>
                  <span>Signed in as {user?.name || user?.email}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/15 bg-white/6 backdrop-blur-3xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/50">Overview</p>
              <p className="text-sm font-medium text-white">Today&apos;s workspace</p>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-xs text-purple-100">
              {isAuthenticated ? 'Live' : 'Guest'}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="rounded-2xl bg-black/40 border border-white/10 p-3 space-y-1">
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/50">Captions</p>
              <p className="text-lg font-semibold">Viral</p>
              <p className="text-[11px] text-white/50">Punchy, word-by-word subtitles.</p>
            </div>
            <div className="rounded-2xl bg-black/40 border border-white/10 p-3 space-y-1">
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/50">Dubbing</p>
              <p className="text-lg font-semibold">Studio</p>
              <p className="text-[11px] text-white/50">Revoice clips in new languages.</p>
            </div>
            <div className="rounded-2xl bg-black/40 border border-white/10 p-3 space-y-1">
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/50">News</p>
              <p className="text-lg font-semibold">Auto</p>
              <p className="text-[11px] text-white/50">Generate smart video recaps.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => {
          const isAvailable = feature.status === 'available';
          return (
            <button
              key={feature.id}
              onClick={() => handleFeatureClick(feature)}
              disabled={!isAvailable || !feature.href}
              className={`relative text-left rounded-3xl p-4 sm:p-5 border backdrop-blur-3xl shadow-xl transition-all ${
                isAvailable
                  ? 'bg-white/10 border-white/25 hover:bg-white/16 hover:-translate-y-0.5'
                  : 'bg-white/6 border-white/15 opacity-70 cursor-default'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${feature.accentFrom} ${feature.accentTo} flex items-center justify-center text-white text-sm font-semibold`}
                >
                  {feature.title.charAt(0)}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/55">
                    {feature.category}
                  </p>
                  <p className="text-sm sm:text-base font-semibold text-white">
                    {feature.title}
                  </p>
                  <p className="text-xs text-white/65">
                    {feature.description}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px]">
                <span
                  className={`px-2 py-1 rounded-full border ${
                    isAvailable
                      ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-200'
                      : 'border-white/20 bg-white/8 text-white/60'
                  }`}
                >
                  {isAvailable ? 'Available' : 'Coming soon'}
                </span>
                {isAvailable && feature.href === '/caption-studio' && (
                  <span className="text-white/70">Open studio →</span>
                )}
              </div>
            </button>
          );
        })}
      </section>
    </>
  );
}
