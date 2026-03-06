import { useState } from 'react';
import { Newspaper, Loader2, AlertCircle, Mail, Clock, Image as ImageIcon, Globe, Save, Play, Pause, Check, HelpCircle } from 'lucide-react';
import HelpDialog from './HelpDialog';

interface NewsAutomationProps {
  isAuthenticated: boolean;
  onLoginClick: () => void;
}

const NEWS_SOURCES = [
  { id: 'cnn', label: 'CNN', description: 'CNN News' },
  { id: 'google', label: 'Google News', description: 'Google News Feed' },
];

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

const FREQUENCY_OPTIONS = [
  { id: 'once', label: 'Once', description: 'Run once' },
  { id: 'daily', label: 'Daily', description: 'Every day' },
  { id: 'weekly', label: 'Weekly', description: 'Once per week' },
  { id: 'custom', label: 'Custom', description: 'Custom schedule' },
];

export default function NewsAutomation({ isAuthenticated, onLoginClick }: NewsAutomationProps) {
  const [newsSource, setNewsSource] = useState('cnn');
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [generateImage, setGenerateImage] = useState(true);
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [frequency, setFrequency] = useState('daily');
  const [showHelp, setShowHelp] = useState(false);
  const [customDays, setCustomDays] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const DAYS_OF_WEEK = [
    { id: 'monday', label: 'Mon' },
    { id: 'tuesday', label: 'Tue' },
    { id: 'wednesday', label: 'Wed' },
    { id: 'thursday', label: 'Thu' },
    { id: 'friday', label: 'Fri' },
    { id: 'saturday', label: 'Sat' },
    { id: 'sunday', label: 'Sun' },
  ];

  const toggleDay = (dayId: string) => {
    setCustomDays(prev =>
      prev.includes(dayId)
        ? prev.filter(d => d !== dayId)
        : [...prev, dayId]
    );
  };

  const handleTestRun = async () => {
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('http://localhost:8080/api/news-automation/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newsSource,
          targetLanguage,
          generateImage,
          email,
          subject: subject || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to run news automation');
      }

      setSuccess('Test run completed successfully! Check your email.');
    } catch (err: any) {
      setError(err.message || 'Failed to run news automation. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveSchedule = async () => {
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    if (frequency === 'custom' && customDays.length === 0) {
      setError('Please select at least one day for custom schedule');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('http://localhost:8080/api/news-automation/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newsSource,
          targetLanguage,
          generateImage,
          email,
          subject: subject || undefined,
          scheduleTime,
          frequency,
          customDays: frequency === 'custom' ? customDays : undefined,
          isActive: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save schedule');
      }

      setIsActive(true);
      setSuccess('Schedule saved successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to save schedule. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleSchedule = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8080/api/news-automation/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !isActive,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle schedule');
      }

      setIsActive(!isActive);
    } catch (err: any) {
      setError(err.message || 'Failed to toggle schedule. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <section className="mt-6 rounded-[2.5rem] border border-white/15 bg-white/6 backdrop-blur-3xl p-10 flex flex-col items-center justify-center text-center space-y-4 shadow-2xl">
        <div className="p-4 rounded-full bg-white/10 border border-white/20 mb-2">
          <Newspaper className="w-8 h-8 text-orange-300" />
        </div>
        <h2 className="text-2xl font-semibold">Sign in to unlock News Automation</h2>
        <p className="text-sm md:text-base text-white/65 max-w-md">
          Login or create an account to automate news collection, translation, and email delivery.
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
            <Newspaper className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-white">News Automation</h1>
              <button
                onClick={() => setShowHelp(true)}
                className="p-1.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg hover:bg-white/15 transition-all duration-300"
              >
                <HelpCircle className="w-4 h-4 text-white/60" />
              </button>
            </div>
            <p className="text-sm text-white/60">Automate news collection, translation, and email delivery</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
              News Source
            </label>
            <div className="grid grid-cols-2 gap-3">
              {NEWS_SOURCES.map((source) => (
                <button
                  key={source.id}
                  onClick={() => setNewsSource(source.id)}
                  className={`p-4 rounded-xl border backdrop-blur-xl text-center transition-all duration-300 ${
                    newsSource === source.id
                      ? 'bg-orange-500/20 border-orange-400/50 shadow-lg shadow-orange-500/20'
                      : 'bg-white/8 border-white/15 hover:bg-white/12'
                  }`}
                  style={{
                    background: newsSource === source.id
                      ? 'linear-gradient(135deg, rgba(249,115,22,0.2) 0%, rgba(245,158,11,0.15) 100%)'
                      : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.05) 100%)'
                  }}
                >
                  <p className="text-sm font-medium text-white">{source.label}</p>
                  <p className="text-xs text-white/50 mt-1">{source.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <Globe className="w-5 h-5 text-white/60" />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/8 border border-white/15 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ImageIcon className="w-5 h-5 text-orange-400" />
                  <div>
                    <label className="text-sm font-medium text-white">Generate Image</label>
                    <p className="text-xs text-white/50">Create image from content</p>
                  </div>
                </div>
                <button
                  onClick={() => setGenerateImage(!generateImage)}
                  className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                    generateImage ? 'bg-orange-500' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${
                      generateImage ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
              Email Configuration
            </label>
            <div className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="recipient@example.com"
                className="w-full px-4 py-3 bg-white/8 backdrop-blur-xl border border-white/15 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-orange-400/50 focus:bg-white/12 transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.05) 100%)'
                }}
              />
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject (optional)"
                className="w-full px-4 py-3 bg-white/8 backdrop-blur-xl border border-white/15 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-orange-400/50 focus:bg-white/12 transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.05) 100%)'
                }}
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/8 border border-white/15 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-orange-400" />
                <div>
                  <label className="text-sm font-medium text-white">Schedule</label>
                  <p className="text-xs text-white/50">Automated delivery</p>
                </div>
              </div>
              <button
                onClick={() => setIsScheduled(!isScheduled)}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                  isScheduled ? 'bg-orange-500' : 'bg-white/20'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${
                    isScheduled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {isScheduled && (
              <div className="space-y-4 pt-4 border-t border-white/10">
                <div>
                  <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
                    Schedule Time
                  </label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full px-4 py-3 bg-white/8 backdrop-blur-xl border border-white/15 rounded-xl text-white focus:outline-none focus:border-orange-400/50 focus:bg-white/12 transition-all duration-300"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.05) 100%)'
                    }}
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
                    Frequency
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {FREQUENCY_OPTIONS.map((freq) => (
                      <button
                        key={freq.id}
                        onClick={() => setFrequency(freq.id)}
                        className={`p-3 rounded-xl border backdrop-blur-xl text-center transition-all duration-300 ${
                          frequency === freq.id
                            ? 'bg-orange-500/20 border-orange-400/50 shadow-lg shadow-orange-500/20'
                            : 'bg-white/8 border-white/15 hover:bg-white/12'
                        }`}
                        style={{
                          background: frequency === freq.id
                            ? 'linear-gradient(135deg, rgba(249,115,22,0.2) 0%, rgba(245,158,11,0.15) 100%)'
                            : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.05) 100%)'
                        }}
                      >
                        <p className="text-xs font-medium text-white">{freq.label}</p>
                        <p className="text-[10px] text-white/50 mt-1">{freq.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {frequency === 'custom' && (
                  <div>
                    <label className="text-xs uppercase tracking-[0.16em] text-white/60 mb-2 block">
                      Select Days
                    </label>
                    <div className="grid grid-cols-7 gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <button
                          key={day.id}
                          onClick={() => toggleDay(day.id)}
                          className={`p-2 rounded-xl border backdrop-blur-xl text-center transition-all duration-300 ${
                            customDays.includes(day.id)
                              ? 'bg-orange-500/20 border-orange-400/50 shadow-lg shadow-orange-500/20'
                              : 'bg-white/8 border-white/15 hover:bg-white/12'
                          }`}
                          style={{
                            background: customDays.includes(day.id)
                              ? 'linear-gradient(135deg, rgba(249,115,22,0.2) 0%, rgba(245,158,11,0.15) 100%)'
                              : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.05) 100%)'
                          }}
                        >
                          <p className="text-xs font-medium text-white">{day.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="backdrop-blur-3xl bg-red-500/15 border border-red-400/40 text-red-200 p-4 rounded-full flex items-start space-x-3 shadow-2xl shadow-red-500/30">
              <div className="p-1.5 bg-red-500/20 rounded-full backdrop-blur-md border border-red-400/30 shrink-0">
                <AlertCircle className="w-4 h-4 text-red-300" />
              </div>
              <p className="text-sm flex-1">{error}</p>
            </div>
          )}

          {success && (
            <div className="backdrop-blur-3xl bg-green-500/15 border border-green-400/40 text-green-200 p-4 rounded-full flex items-start space-x-3 shadow-2xl shadow-green-500/30">
              <div className="p-1.5 bg-green-500/20 rounded-full backdrop-blur-md border border-green-400/30 shrink-0">
                <Check className="w-4 h-4 text-green-300" />
              </div>
              <p className="text-sm flex-1">{success}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleTestRun}
              disabled={isProcessing || !email.trim()}
              className="flex-1 px-6 py-4 bg-white/10 backdrop-blur-2xl text-white font-medium rounded-full hover:bg-white/15 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 flex items-center justify-center space-x-2 shadow-xl border border-white/25"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5 text-orange-400" />
                  <span>Test Run</span>
                </>
              )}
            </button>

            {isScheduled && (
              <>
                <button
                  onClick={handleSaveSchedule}
                  disabled={isProcessing || !email.trim()}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-orange-500/90 to-amber-500/90 backdrop-blur-2xl text-white font-medium rounded-full hover:from-orange-600 hover:to-amber-600 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 flex items-center justify-center space-x-2 shadow-xl shadow-orange-500/40 border border-orange-400/40"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Save Schedule</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleToggleSchedule}
                  disabled={isProcessing}
                  className={`px-6 py-4 backdrop-blur-2xl text-white font-medium rounded-full hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 flex items-center justify-center space-x-2 shadow-xl border ${
                    isActive
                      ? 'bg-red-500/90 hover:bg-red-600 border-red-400/40'
                      : 'bg-green-500/90 hover:bg-green-600 border-green-400/40'
                  }`}
                >
                  {isActive ? (
                    <>
                      <Pause className="w-5 h-5" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      <span>Start</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <HelpDialog
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        title="How to Use News Automation"
        content={
          <>
            <p><strong>Step 1: Select News Source</strong></p>
            <p>Choose a news source from the dropdown (CNN, BBC, Reuters, etc.).</p>
            
            <p><strong>Step 2: Choose Target Language</strong></p>
            <p>Select the language you want the news translated to.</p>
            
            <p><strong>Step 3: Configure Options</strong></p>
            <p>Toggle "Generate Image" if you want AI-generated images included with the news. Enter the recipient email address and customize the email subject line.</p>
            
            <p><strong>Step 4: Set Schedule (Optional)</strong></p>
            <p>Enable scheduling to automate news delivery. Choose frequency (Once, Daily, Weekly, or Custom) and set the time. The system will automatically collect, translate, and email news at the scheduled time.</p>
            
            <p><strong>Step 5: Start Automation</strong></p>
            <p>Click "Start" to begin the automation process. The system will collect news, translate it, generate images (if enabled), and send it to the specified email address.</p>
          </>
        }
      />
    </div>
  );
}
