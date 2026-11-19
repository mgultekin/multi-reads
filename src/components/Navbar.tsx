import React from 'react';
import { Settings, Moon, Sun, LogOut, User as UserIcon, Search } from 'lucide-react';
import { User } from 'firebase/auth';
import { LanguageCode } from '../types/index.ts';
import { SUPPORTED_LANGUAGES, BASE_LANGUAGES } from '../data/constants.ts';

interface NavbarProps {
  activeTab: 'library' | 'reader' | 'wordbook' | 'social';
  setActiveTab: (tab: 'library' | 'reader' | 'wordbook' | 'social') => void;
  targetLang: LanguageCode;
  setTargetLang: (lang: LanguageCode) => void;
  nativeLang: string;
  setNativeLang: (lang: string) => void;
  streakDays: number;
  xp: number;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  openSettings: () => void;
  currentUser: User | null;
  isFirebaseConfigured?: boolean;
  isHidden?: boolean;
  onSignInWithGoogle: () => void;
  onSignOut: () => void;
  wordsReadToday?: number;
  dailyWordGoal?: number;
  savedWordsCount?: number;
  onOpenDiscover?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  targetLang,
  setTargetLang,
  nativeLang,
  setNativeLang,
  streakDays,
  xp: _xp,
  theme,
  toggleTheme,
  openSettings,
  currentUser,
  isFirebaseConfigured = true,
  isHidden = false,
  onSignInWithGoogle,
  onSignOut,
  wordsReadToday = 0,
  dailyWordGoal = 500,
  savedWordsCount = 0,
  onOpenDiscover,
}) => {
  if (isHidden) {
    return null;
  }

  const navItems: { id: NavbarProps['activeTab']; label: string }[] = [
    { id: 'library', label: 'Library' },
    { id: 'reader', label: 'Reader' },
    { id: 'wordbook', label: 'Wordbook' },
    { id: 'social', label: 'Journal' },
  ];

  const safeGoal = Math.max(50, dailyWordGoal || 500);
  const safeRead = Math.max(0, wordsReadToday || 0);
  const ringProgress = Math.min(1, safeRead / safeGoal);
  const ringPct = Math.round(ringProgress * 100);
  const radius = 9.5;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - ringProgress);

  return (
    <header className="sticky top-0 z-40 w-full h-auto border-b border-black/[0.06] dark:border-white/[0.08] apple-glass-nav transition-colors">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 px-4 sm:px-6 h-14">
        {/* Left: Borderless Serif Wordmark + Quiet Language Pill */}
        <div className="flex items-center gap-3 shrink-0 min-w-0">
          <button
            onClick={() => setActiveTab('library')}
            className="text-left cursor-pointer focus:outline-none group"
          >
            <span className="font-display text-xl font-semibold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] group-hover:text-[#0071E3] dark:group-hover:text-[#0A84FF] transition-colors">
              FolioPress
            </span>
          </button>

          <div className="flex items-center gap-1 rounded-full bg-black/[0.045] dark:bg-white/[0.07] border border-black/[0.05] dark:border-white/[0.08] px-2.5 py-1 text-xs">
            <select
              aria-label="Reading language"
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value as LanguageCode)}
              className="bg-transparent font-medium text-[#1D1D1F] dark:text-[#F5F5F7] cursor-pointer focus:outline-none"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-white dark:bg-[#16161A]">
                  {lang.code.toUpperCase()}
                </option>
              ))}
            </select>

            <span className="text-[#6E6E73] dark:text-[#98989D] select-none text-[11px]">→</span>

            <select
              aria-label="Translation language"
              value={nativeLang}
              onChange={(e) => setNativeLang(e.target.value)}
              className="bg-transparent font-medium text-[#0071E3] dark:text-[#0A84FF] cursor-pointer focus:outline-none max-w-[82px] sm:max-w-none"
            >
              {BASE_LANGUAGES.map((b) => (
                <option key={b.code} value={b.name} className="bg-white dark:bg-[#16161A]">
                  {b.nativeName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center: Apple macOS Segmented Navigation */}
        <nav
          aria-label="Primary"
          className="hidden lg:flex items-center p-1 rounded-full bg-black/[0.045] dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.06] text-xs"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3.5 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white font-semibold shadow-xs'
                    : 'text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] font-medium'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Discover Trigger, Live Apple Daily Mastery Ring, Streak, Account & Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {onOpenDiscover && (
            <button
              type="button"
              onClick={onOpenDiscover}
              title="Discover & Import (⌘K)"
              aria-label="Discover and Import"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-xs text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-white transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="font-mono text-[10px]">⌘K</span>
            </button>
          )}

          {/* Live SVG Apple Daily Mastery Ring */}
          <button
            type="button"
            onClick={() => setActiveTab('wordbook')}
            title={`Daily Mastery: ${safeRead}/${safeGoal} words (${ringPct}%) · ${savedWordsCount} saved words — Open Wordbook`}
            aria-label={`Daily Mastery ${ringPct}% (${savedWordsCount} saved words)`}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" className="-rotate-90 shrink-0">
              <circle
                cx="12"
                cy="12"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-black/[0.09] dark:text-white/[0.12]"
              />
              <circle
                cx="12"
                cy="12"
                r={radius}
                fill="none"
                stroke={ringProgress >= 1 ? '#34C759' : 'var(--accent-apple)'}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className="transition-all duration-500"
              />
            </svg>
            {savedWordsCount > 0 && (
              <span className="hidden md:inline text-[11px] font-mono tabular-nums text-[#6E6E73] dark:text-[#98989D]">
                {savedWordsCount}w
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('social')}
            title={`${streakDays} day reading streak — Open Journal`}
            className="hidden sm:inline-block text-xs font-mono tabular-nums text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] transition-colors cursor-pointer"
          >
            {streakDays}d
          </button>

          {isFirebaseConfigured &&
            (currentUser ? (
              <div className="flex items-center gap-1.5 text-xs text-[#6E6E73] dark:text-[#98989D]">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-3.5 h-3.5" />
                )}
                <button
                  onClick={onSignOut}
                  title="Sign out"
                  className="hover:text-[#1D1D1F] dark:hover:text-white transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onSignInWithGoogle}
                className="text-xs font-medium text-[#0071E3] dark:text-[#0A84FF] hover:underline transition-colors cursor-pointer"
                title="Sign in with Google to sync reading data"
              >
                Sign in
              </button>
            ))}

          <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            title="Toggle light / dark theme"
            className="p-1.5 rounded-full text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            {theme === 'light' ? <Moon className="w-4 h-4 stroke-[1.5]" /> : <Sun className="w-4 h-4 stroke-[1.5]" />}
          </button>

          <button
            onClick={openSettings}
            aria-label="Settings"
            title="Preferences & Free-Tier Quota Guardrail"
            className="p-1.5 rounded-full text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4 stroke-[1.5]" />
          </button>
        </div>
      </div>

      {/* Mobile Segmented Sub-Navigation */}
      <div className="lg:hidden flex items-center justify-around border-t border-black/[0.06] dark:border-white/[0.08] px-3 py-2 text-xs text-[#6E6E73] dark:text-[#98989D]">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-3 py-1 rounded-full cursor-pointer transition-colors ${
                isActive
                  ? 'bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white font-semibold shadow-2xs'
                  : ''
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
