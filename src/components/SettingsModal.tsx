import React, { useState, useEffect } from 'react';
import { X, Globe, Target, Check, Trash2, Type } from 'lucide-react';
import { UserProfile } from '../types/index.ts';
import { BASE_LANGUAGES } from '../data/constants.ts';
import { storageService } from '../services/storageService.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSaveProfile: (updated: UserProfile) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const [name, setName] = useState(profile.name);
  const [nativeLanguage, setNativeLanguage] = useState(profile.nativeLanguage);
  const [dailyWordGoal, setDailyWordGoal] = useState(profile.dailyWordGoal);
  const [readerFontSize, setReaderFontSize] = useState<'sm' | 'md' | 'lg'>(
    profile.readerFontSize || 'md'
  );
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [confirmClearCache, setConfirmClearCache] = useState(false);
  const [cacheClearedMessage, setCacheClearedMessage] = useState(false);

  // Sync local form state whenever profile prop updates or modal opens
  useEffect(() => {
    if (isOpen) {
      setName(profile.name);
      setNativeLanguage(profile.nativeLanguage);
      setDailyWordGoal(profile.dailyWordGoal);
      setReaderFontSize(profile.readerFontSize || 'md');
      setConfirmClearCache(false);
      setCacheClearedMessage(false);
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...profile,
      name: name.trim() || 'Scholar',
      nativeLanguage,
      dailyWordGoal,
      readerFontSize,
    };
    storageService.saveUserProfile(updated);
    onSaveProfile(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleClearCache = async () => {
    if (!confirmClearCache) {
      setConfirmClearCache(true);
      return;
    }
    await storageService.clearCEFRCache();
    setConfirmClearCache(false);
    setCacheClearedMessage(true);
    setTimeout(() => setCacheClearedMessage(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white dark:bg-[#1C1A18] rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6 text-stone-900 dark:text-stone-100 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
          <div>
            <h2 className="font-display text-xl font-bold">Preferences & Reading Settings</h2>
            <p className="text-xs text-stone-500 font-serif italic">
              Configure your translation base language, typography, and daily reading ritual.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          {/* Reader Display Name */}
          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
              Scholar Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-600"
            />
          </div>

          {/* Native / Translation Base Language (All 14 BASE_LANGUAGES) */}
          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-stone-400" />
              Your Native Language (for translations & explanations)
            </label>
            <select
              value={nativeLanguage}
              onChange={(e) => setNativeLanguage(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
            >
              {BASE_LANGUAGES.map((lang) => (
                <option key={lang.name} value={lang.name}>
                  {lang.name} ({lang.nativeName})
                </option>
              ))}
            </select>
          </div>

          {/* Default Reader Typography Scale */}
          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-stone-400" />
              Reader Typeface Scale
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'sm', label: 'Compact (16px)' },
                  { id: 'md', label: 'Editorial (19px)' },
                  { id: 'lg', label: 'Large Print (22px)' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setReaderFontSize(opt.id)}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                    readerFontSize === opt.id
                      ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100'
                      : 'bg-stone-50 dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Daily Word Reading Target */}
          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-stone-400" />
                Daily Reading Volume Goal
              </span>
              <span className="font-mono text-amber-800 dark:text-amber-400 font-bold">
                {dailyWordGoal} words/day
              </span>
            </label>
            <input
              type="range"
              min="150"
              max="2000"
              step="50"
              value={dailyWordGoal}
              onChange={(e) => setDailyWordGoal(parseInt(e.target.value, 10))}
              className="w-full accent-amber-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-400 mt-1 font-mono">
              <span>Casual (250w)</span>
              <span>Dedicated (500w)</span>
              <span>Scholar (1500w)</span>
            </div>
          </div>

          {/* Iframe-Safe Two-Step Cache Cleanup */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={handleClearCache}
              className={`flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ${
                confirmClearCache
                  ? 'px-3 py-1.5 rounded-lg bg-red-600 text-white'
                  : 'text-stone-500 hover:text-red-600'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {confirmClearCache
                ? 'Click Again to Confirm Cache Reset'
                : 'Clear Local CEFR Adaptation Cache'}
            </button>

            {cacheClearedMessage && (
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                CEFR cache cleared
              </span>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  Saved
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
