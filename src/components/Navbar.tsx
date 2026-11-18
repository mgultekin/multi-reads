import React from 'react';
import { Settings, Moon, Sun, LogOut, User as UserIcon } from 'lucide-react';
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
  xp: _xp,
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

  const navItems: { id: NavbarProps['activeTab']; label: string }[] = [
    { id: 'library', label: 'Library' },
    { id: 'reader', label: 'Reader' },
    { id: 'wordbook', label: 'Wordbook' },
    { id: 'social', label: 'Journal' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200 dark:border-stone-800 bg-[#FAF8F4]/95 dark:bg-[#141312]/95 backdrop-blur-md transition-colors">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 h-14">
        {/* Left: Borderless Serif Wordmark + Quiet Language Pair Selector */}
        <div className="flex items-center gap-4 shrink-0 min-w-0">
          <button
            onClick={() => setActiveTab('library')}
            className="text-left cursor-pointer focus:outline-none group"
          >
            <span className="font-display text-xl font-bold tracking-tight text-[#18181B] dark:text-[#F4F4F5] group-hover:text-[#9A3412] dark:group-hover:text-[#D97706] transition-colors">
              FolioPress
            </span>
          </button>

          <span aria-hidden="true" className="text-stone-300 dark:text-stone-700 text-xs hidden sm:inline">
            |
          </span>

          <div className="flex items-center gap-1 text-xs">
            <select
              aria-label="Reading language"
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value as LanguageCode)}
              className="bg-transparent font-medium text-[#18181B] dark:text-[#F4F4F5] hover:text-[#9A3412] dark:hover:text-[#D97706] cursor-pointer focus:outline-none transition-colors"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-[#FAF8F4] dark:bg-[#141312]">
                  {lang.code.toUpperCase()} · {lang.name}
                </option>
              ))}
            </select>

            <span className="text-[#71717A] dark:text-[#A1A1AA] select-none px-0.5">→</span>

            <select
              aria-label="Translation language"
              value={nativeLang}
              onChange={(e) => setNativeLang(e.target.value)}
              className="bg-transparent font-medium text-[#9A3412] dark:text-[#D97706] cursor-pointer focus:outline-none max-w-[90px] sm:max-w-none"
            >
              {BASE_LANGUAGES.map((b) => (
                <option key={b.code} value={b.name} className="bg-[#FAF8F4] dark:bg-[#141312]">
                  {b.nativeName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center: Clean Editorial Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm text-[#71717A] dark:text-[#A1A1AA]">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`whitespace-nowrap py-1 border-b transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[#18181B] dark:text-[#F4F4F5] font-medium border-[#9A3412] dark:border-[#D97706]'
                    : 'border-transparent hover:text-[#18181B] dark:hover:text-[#F4F4F5]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Quiet Monochrome Streak, Sign-In Link, Theme & Settings */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('social')}
            title={`${streakDays} day reading streak — View Journal`}
            className="hidden sm:inline-block text-xs font-mono tabular-nums text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5] transition-colors cursor-pointer"
          >
            {streakDays}d
          </button>

          {isFirebaseConfigured &&
            (currentUser ? (
              <div className="flex items-center gap-2 text-xs text-[#71717A] dark:text-[#A1A1AA]">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-5 h-5 rounded-full object-cover opacity-90"
                  />
                ) : (
                  <UserIcon className="w-3.5 h-3.5" />
                )}
                <span className="max-w-[80px] truncate hidden md:inline text-[#18181B] dark:text-[#F4F4F5]">
                  {currentUser.displayName || 'Account'}
                </span>
                <button
                  onClick={onSignOut}
                  title="Sign out"
                  className="hover:text-[#18181B] dark:hover:text-[#F4F4F5] transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onSignInWithGoogle}
                className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5] transition-colors cursor-pointer"
                title="Sign in with Google to sync reading data"
              >
                Sign in
              </button>
            ))}

          <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            title="Toggle light / dark theme"
            className="p-1 text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5] transition-colors cursor-pointer"
          >
            {theme === 'light' ? <Moon className="w-4 h-4 stroke-[1.5]" /> : <Sun className="w-4 h-4 stroke-[1.5]" />}
          </button>

          <button
            onClick={openSettings}
            aria-label="Settings"
            title="Preferences & Free-Tier Quota Guardrail"
            className="p-1 text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5] transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4 stroke-[1.5]" />
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="lg:hidden flex items-center justify-around border-t border-stone-200 dark:border-stone-800 px-3 py-2 bg-[#FAF8F4] dark:bg-[#141312] text-xs text-[#71717A] dark:text-[#A1A1AA]">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-2 py-0.5 border-b cursor-pointer transition-colors ${
                isActive
                  ? 'text-[#18181B] dark:text-[#F4F4F5] font-medium border-[#9A3412] dark:border-[#D97706]'
                  : 'border-transparent'
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
