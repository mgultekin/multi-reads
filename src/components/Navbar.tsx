import React from 'react';
import { Flame, Settings, Moon, Sun, LogIn, LogOut, User as UserIcon } from 'lucide-react';
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
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  targetLang,
  setTargetLang,
  nativeLang,
  setNativeLang,
  streakDays,
  xp,
  theme,
  toggleTheme,
  openSettings,
  currentUser,
  isFirebaseConfigured = true,
  isHidden = false,
  onSignInWithGoogle,
  onSignOut,
}) => {
  if (isHidden) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E7E2D7] dark:border-[#2C2926] bg-[#FBF9F5]/95 dark:bg-[#141312]/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 h-14">
        
        {/* Zone 1: Wordmark + Compact Language Pair Selector */}
        <div className="flex items-center gap-3 shrink-0 min-w-0">
          <button
            onClick={() => setActiveTab('library')}
            className="flex items-center gap-2 group text-left cursor-pointer focus:outline-none"
          >
            <span className="font-display text-xl font-bold tracking-tight text-[#1C1917] dark:text-[#F5F2EB] group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
              FolioPress
            </span>
          </button>

          <div className="flex items-center gap-1 bg-stone-100/90 dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800 rounded-lg px-2 py-1">
            <select
              aria-label="Reading language"
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value as LanguageCode)}
              className="bg-transparent text-xs font-semibold text-stone-800 dark:text-stone-200 cursor-pointer focus:outline-none"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>

            <span className="text-stone-400 text-xs select-none">→</span>

            <select
              aria-label="Translation language"
              value={nativeLang}
              onChange={(e) => setNativeLang(e.target.value)}
              className="bg-transparent text-xs font-semibold text-amber-800 dark:text-amber-400 cursor-pointer focus:outline-none max-w-[100px] sm:max-w-none"
            >
              {BASE_LANGUAGES.map((b) => (
                <option key={b.code} value={b.name}>
                  {b.flag} {b.nativeName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Zone 2: Clean Primary Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-stone-600 dark:text-stone-400">
          <button
            onClick={() => setActiveTab('library')}
            className={`whitespace-nowrap py-1 transition-colors hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer ${
              activeTab === 'library'
                ? 'text-amber-700 dark:text-amber-400 font-semibold border-b-2 border-amber-700 dark:border-amber-400'
                : 'border-b-2 border-transparent'
            }`}
          >
            Library
          </button>

          <button
            onClick={() => setActiveTab('reader')}
            className={`whitespace-nowrap py-1 transition-colors hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer ${
              activeTab === 'reader'
                ? 'text-amber-700 dark:text-amber-400 font-semibold border-b-2 border-amber-700 dark:border-amber-400'
                : 'border-b-2 border-transparent'
            }`}
          >
            Reader
          </button>

          <button
            onClick={() => setActiveTab('wordbook')}
            className={`whitespace-nowrap py-1 transition-colors hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer ${
              activeTab === 'wordbook'
                ? 'text-amber-700 dark:text-amber-400 font-semibold border-b-2 border-amber-700 dark:border-amber-400'
                : 'border-b-2 border-transparent'
            }`}
          >
            Wordbook
          </button>

          <button
            onClick={() => setActiveTab('social')}
            className={`whitespace-nowrap py-1 transition-colors hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer ${
              activeTab === 'social'
                ? 'text-amber-700 dark:text-amber-400 font-semibold border-b-2 border-amber-700 dark:border-amber-400'
                : 'border-b-2 border-transparent'
            }`}
          >
            Progress
          </button>
        </nav>

        {/* Zone 3: Combined Streak/XP Pill, Theme Toggle & Settings */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('social')}
            title={`${streakDays} day streak · ${xp} XP (Click for Progress & Log)`}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100/90 dark:bg-stone-900/90 border border-stone-200/70 dark:border-stone-800 text-xs font-mono text-stone-700 dark:text-stone-300 hover:border-amber-500/60 transition-colors cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
            <span className="font-semibold text-amber-700 dark:text-amber-400">{streakDays}d</span>
            <span className="text-stone-300 dark:text-stone-700">·</span>
            <span>{xp} XP</span>
          </button>

          {isFirebaseConfigured &&
            (currentUser ? (
              <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg p-1 pr-2">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-4 h-4 text-stone-500 ml-1" />
                )}
                <span className="text-xs font-medium text-stone-700 dark:text-stone-300 max-w-[80px] truncate hidden md:inline">
                  {currentUser.displayName || 'Account'}
                </span>
                <button
                  onClick={onSignOut}
                  title="Sign out"
                  className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 ml-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onSignInWithGoogle}
                className="flex items-center gap-1.5 px-3 py-1 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                title="Sign in with Google to sync reading data"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            ))}

          <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            title="Toggle light / dark theme"
            className="p-1.5 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 rounded-md hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          <button
            onClick={openSettings}
            aria-label="Settings"
            title="Preferences & Free-Tier Quota Guardrail"
            className="p-1.5 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 rounded-md hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="lg:hidden flex items-center justify-around border-t border-stone-200/80 dark:border-stone-800/80 px-2 py-2 bg-stone-50 dark:bg-stone-950 text-xs font-medium text-stone-600 dark:text-stone-400">
        <button
          onClick={() => setActiveTab('library')}
          className={`px-2 py-1 rounded cursor-pointer ${activeTab === 'library' ? 'text-amber-700 dark:text-amber-400 font-semibold' : ''}`}
        >
          Library
        </button>
        <button
          onClick={() => setActiveTab('reader')}
          className={`px-2 py-1 rounded cursor-pointer ${activeTab === 'reader' ? 'text-amber-700 dark:text-amber-400 font-semibold' : ''}`}
        >
          Reader
        </button>
        <button
          onClick={() => setActiveTab('wordbook')}
          className={`px-2 py-1 rounded cursor-pointer ${activeTab === 'wordbook' ? 'text-amber-700 dark:text-amber-400 font-semibold' : ''}`}
        >
          Wordbook
        </button>
        <button
          onClick={() => setActiveTab('social')}
          className={`px-2 py-1 rounded cursor-pointer ${activeTab === 'social' ? 'text-amber-700 dark:text-amber-400 font-semibold' : ''}`}
        >
          Progress
        </button>
      </div>
    </header>
  );
};
