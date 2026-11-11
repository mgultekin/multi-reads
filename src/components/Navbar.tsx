import React from 'react';
import { BookOpen, Flame, Sparkles, Settings, Moon, Sun, LogIn, LogOut, User as UserIcon, ShieldCheck } from 'lucide-react';
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
  onSignInWithGoogle,
  onSignOut,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E7E2D7] dark:border-[#2C2926] bg-[#FBF9F5]/90 dark:bg-[#141312]/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6 px-6 py-3">
        
        {/* Zone 1: Wordmark + Target/Base Language Pair selector */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('library')}
            className="flex items-center gap-2 group text-left cursor-pointer focus:outline-none"
          >
            <span className="font-display text-xl font-bold tracking-tight text-[#1C1917] dark:text-[#F5F2EB] group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
              FolioLingo
            </span>
          </button>

          <span className="text-[#A8A29E] dark:text-[#57534E] text-xs">·</span>

          {/* Target Language Dropdown */}
          <div className="flex items-center gap-1.5 bg-stone-100/90 dark:bg-stone-900/90 border border-stone-200 dark:border-stone-800 rounded-lg px-2 py-1">
            <span className="text-[10px] uppercase font-bold text-stone-400">Read:</span>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value as LanguageCode)}
              className="bg-transparent text-xs font-semibold text-stone-800 dark:text-stone-200 cursor-pointer focus:outline-none pr-1"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>

            <span className="text-stone-400 text-xs">→</span>

            {/* Base Native Language Dropdown */}
            <span className="text-[10px] uppercase font-bold text-stone-400">In:</span>
            <select
              value={nativeLang}
              onChange={(e) => setNativeLang(e.target.value)}
              className="bg-transparent text-xs font-semibold text-amber-800 dark:text-amber-400 cursor-pointer focus:outline-none pr-1"
            >
              {BASE_LANGUAGES.map((b) => (
                <option key={b.code} value={b.name}>
                  {b.flag} {b.nativeName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Zone 2: 4 clean single-line text navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-stone-600 dark:text-stone-400">
          <button
            onClick={() => setActiveTab('library')}
            className={`whitespace-nowrap transition-colors hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer ${
              activeTab === 'library'
                ? 'text-amber-700 dark:text-amber-400 font-semibold underline underline-offset-8 decoration-amber-700 dark:decoration-amber-400 decoration-2'
                : ''
            }`}
          >
            Library & Genres
          </button>

          <button
            onClick={() => setActiveTab('reader')}
            className={`whitespace-nowrap transition-colors hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer ${
              activeTab === 'reader'
                ? 'text-amber-700 dark:text-amber-400 font-semibold underline underline-offset-8 decoration-amber-700 dark:decoration-amber-400 decoration-2'
                : ''
            }`}
          >
            Reader Studio
          </button>

          <button
            onClick={() => setActiveTab('wordbook')}
            className={`whitespace-nowrap transition-colors hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer ${
              activeTab === 'wordbook'
                ? 'text-amber-700 dark:text-amber-400 font-semibold underline underline-offset-8 decoration-amber-700 dark:decoration-amber-400 decoration-2'
                : ''
            }`}
          >
            Wordbook & Practice
          </button>

          <button
            onClick={() => setActiveTab('social')}
            className={`whitespace-nowrap transition-colors hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer ${
              activeTab === 'social'
                ? 'text-amber-700 dark:text-amber-400 font-semibold underline underline-offset-8 decoration-amber-700 dark:decoration-amber-400 decoration-2'
                : ''
            }`}
          >
            Scholar Hub
          </button>
        </nav>

        {/* Zone 3: Habit status, Zero-Cost Badge & Google Sign-In */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Zero-Cost Guardrail Status Pill */}
          <button
            type="button"
            onClick={openSettings}
            title="Zero-Cost Guardrail Active: Running 100% on Firebase Spark & Gemini Free Tiers ($0.00 billed). Click to inspect live quota panel."
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/70 text-[11px] font-mono font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>$0 Free Tier</span>
          </button>

          {/* Streak Indicator */}
          <div
            title={`${streakDays} days reading streak`}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-100/80 dark:bg-stone-900/80 border border-stone-200/60 dark:border-stone-800/60 text-xs font-mono font-medium text-amber-700 dark:text-amber-400"
          >
            <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
            <span>{streakDays}d</span>
          </div>

          {/* XP Tally */}
          <div
            title={`${xp} Total Reading XP`}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-100/80 dark:bg-stone-900/80 border border-stone-200/60 dark:border-stone-800/60 text-xs font-mono text-stone-700 dark:text-stone-300"
          >
            <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>{xp} XP</span>
          </div>

          {/* Google Auth / Profile Button */}
          {!isFirebaseConfigured ? (
            <span
              title="Running 100% locally in IndexedDB & localStorage. Add your own firebase-applet-config.json to enable Google Cloud Sync."
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-[11px] font-mono text-stone-600 dark:text-stone-400"
            >
              Local Sync
            </span>
          ) : currentUser ? (
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
                title="Sign out of Firebase"
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
              <span className="hidden sm:inline">Google Sign In</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="p-1.5 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 rounded-md hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Settings Trigger */}
          <button
            onClick={openSettings}
            aria-label="Settings"
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
          Practice
        </button>
        <button
          onClick={() => setActiveTab('social')}
          className={`px-2 py-1 rounded cursor-pointer ${activeTab === 'social' ? 'text-amber-700 dark:text-amber-400 font-semibold' : ''}`}
        >
          Habits
        </button>
      </div>
    </header>
  );
};
