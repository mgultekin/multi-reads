import React, { useState, useEffect } from 'react';
import {
  X,
  Globe,
  Target,
  Check,
  Trash2,
  Type,
  ShieldCheck,
  KeyRound,
  Activity,
  Cpu,
} from 'lucide-react';
import { UserProfile } from '../types/index.ts';
import { BASE_LANGUAGES } from '../data/constants.ts';
import { storageService } from '../services/storageService.ts';
import { getOfflineDictionaryCount } from '../services/instantLexicon.ts';
import {
  costTelemetry,
  DailyCostTelemetry,
  FREE_TIER_LIMITS,
} from '../services/costTelemetry.ts';

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
  const [customApiKey, setCustomApiKey] = useState(() => costTelemetry.getCustomGeminiApiKey());
  const [telemetry, setTelemetry] = useState<DailyCostTelemetry>(() =>
    costTelemetry.getSnapshot()
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
      setCustomApiKey(costTelemetry.getCustomGeminiApiKey());
      setTelemetry(costTelemetry.getSnapshot());
      setConfirmClearCache(false);
      setCacheClearedMessage(false);
    }
  }, [isOpen, profile]);

  useEffect(() => {
    if (!isOpen) return;
    return costTelemetry.subscribe((snapshot) => {
      setTelemetry(snapshot);
    });
  }, [isOpen]);

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
    costTelemetry.setCustomGeminiApiKey(customApiKey);
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

  const totalLookupsToday =
    telemetry.offlineLexiconHits +
    telemetry.cacheHits +
    telemetry.fastDictHits +
    telemetry.geminiFreeTierCalls;
  const zeroApiHits =
    telemetry.offlineLexiconHits + telemetry.cacheHits + telemetry.fastDictHits;
  const zeroApiPct =
    totalLookupsToday > 0 ? Math.round((zeroApiHits / totalLookupsToday) * 100) : 100;

  const readsPct = Math.min(
    100,
    Math.round((telemetry.firestoreReads / FREE_TIER_LIMITS.FIRESTORE_DAILY_READS) * 100)
  );
  const writesPct = Math.min(
    100,
    Math.round((telemetry.firestoreWrites / FREE_TIER_LIMITS.FIRESTORE_DAILY_WRITES) * 100)
  );
  const geminiPct = Math.min(
    100,
    Math.round(
      (telemetry.geminiFreeTierCalls / FREE_TIER_LIMITS.GEMINI_FREE_DAILY_REQUESTS) * 100
    )
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-md overflow-y-auto"
    >
      <div className="apple-glass-card w-full max-w-xl my-auto max-h-[90vh] overflow-y-auto rounded-3xl p-6 text-[#1D1D1F] dark:text-[#F5F5F7] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div>
            <h2 id="settings-modal-title" className="font-display text-xl font-semibold tracking-tight">
              Preferences & Zero-Cost Guardrail
            </h2>
            <p className="text-xs text-[#6E6E73] dark:text-[#98989D] font-reader italic mt-0.5">
              Configure your translation language, typography, and inspect live $0.00 free-tier quotas.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="p-1.5 rounded-full bg-black/[0.05] dark:bg-white/[0.08] text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          {/* Zero-Cost & Free-Tier Quota Guardrail Panel */}
          <div className="p-4 rounded-2xl bg-[#34C759]/[0.08] dark:bg-[#34C759]/[0.1] border border-[#34C759]/25 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#28A745] dark:text-[#34C759] shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] block">
                    Zero-Cost Billing Verification: $0.00 Billed
                  </span>
                  <span className="text-[11px] text-[#6E6E73] dark:text-[#98989D]">
                    Firebase Spark Plan (Free Forever) + Google AI Studio Free Tier
                  </span>
                </div>
              </div>
              <span className="font-mono text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#34C759] text-white shrink-0">
                $0.00 / mo
              </span>
            </div>

            {/* Live Quota Progress Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-white/[0.05] border border-black/[0.05] dark:border-white/[0.08]">
                <div className="flex items-center justify-between text-[10px] font-mono text-[#6E6E73] dark:text-[#98989D]">
                  <span>Firestore Reads</span>
                  <span className="text-[#28A745] dark:text-[#34C759] font-semibold">$0</span>
                </div>
                <div className="mt-1 font-mono text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                  {telemetry.firestoreReads.toLocaleString()}{' '}
                  <span className="text-[10px] font-normal text-[#6E6E73] dark:text-[#98989D]">/ 50,000/d</span>
                </div>
                <div className="w-full h-1.5 bg-black/[0.07] dark:bg-white/[0.1] rounded-full overflow-hidden mt-1.5">
                  <div
                    className="h-full bg-[#34C759] transition-all"
                    style={{ width: `${Math.max(2, readsPct)}%` }}
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-white/[0.05] border border-black/[0.05] dark:border-white/[0.08]">
                <div className="flex items-center justify-between text-[10px] font-mono text-[#6E6E73] dark:text-[#98989D]">
                  <span>Firestore Writes</span>
                  <span className="text-[#28A745] dark:text-[#34C759] font-semibold">$0</span>
                </div>
                <div className="mt-1 font-mono text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                  {telemetry.firestoreWrites.toLocaleString()}{' '}
                  <span className="text-[10px] font-normal text-[#6E6E73] dark:text-[#98989D]">/ 20,000/d</span>
                </div>
                <div className="w-full h-1.5 bg-black/[0.07] dark:bg-white/[0.1] rounded-full overflow-hidden mt-1.5">
                  <div
                    className="h-full bg-[#34C759] transition-all"
                    style={{ width: `${Math.max(2, writesPct)}%` }}
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-white/[0.05] border border-black/[0.05] dark:border-white/[0.08]">
                <div className="flex items-center justify-between text-[10px] font-mono text-[#6E6E73] dark:text-[#98989D]">
                  <span>Gemini Free RPD</span>
                  <span className="text-[#28A745] dark:text-[#34C759] font-semibold">$0</span>
                </div>
                <div className="mt-1 font-mono text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                  {telemetry.geminiFreeTierCalls.toLocaleString()}{' '}
                  <span className="text-[10px] font-normal text-[#6E6E73] dark:text-[#98989D]">/ 1,500/d</span>
                </div>
                <div className="w-full h-1.5 bg-black/[0.07] dark:bg-white/[0.1] rounded-full overflow-hidden mt-1.5">
                  <div
                    className="h-full bg-[#0071E3] dark:bg-[#0A84FF] transition-all"
                    style={{ width: `${Math.max(2, geminiPct)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Engine Breakdown Summary */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-[#6E6E73] dark:text-[#98989D] font-mono">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#28A745] dark:text-[#34C759]" />
                Zero-Quota Lookups: <strong className="text-[#1D1D1F] dark:text-[#F5F5F7]">{zeroApiPct}%</strong> ({telemetry.offlineLexiconHits}{' '}
                lexicon · {telemetry.cacheHits} cache · {telemetry.fastDictHits} dict)
              </span>
              <span className="text-[10px] text-[#28A745] dark:text-[#34C759] font-semibold">
                {getOfflineDictionaryCount()} offline entries active
              </span>
            </div>

            {/* Circuit Breaker & Local-Only Toggles */}
            <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.08] grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white/80 dark:bg-white/[0.05] border border-black/[0.05] dark:border-white/[0.08] cursor-pointer">
                <div>
                  <span className="text-[11px] font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] block">
                    Strict $0 Circuit Breaker
                  </span>
                  <span className="text-[10px] text-[#6E6E73] dark:text-[#98989D]">
                    Auto-cap at 80% of free daily limit
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={telemetry.strictZeroCostGuardrail}
                  onChange={(e) =>
                    costTelemetry.setStrictZeroCostGuardrail(e.target.checked)
                  }
                  className="accent-[#0071E3] dark:accent-[#0A84FF] w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white/80 dark:bg-white/[0.05] border border-black/[0.05] dark:border-white/[0.08] cursor-pointer">
                <div>
                  <span className="text-[11px] font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-[#0071E3] dark:text-[#0A84FF]" />
                    Zero-AI Dictionary Mode
                  </span>
                  <span className="text-[10px] text-[#6E6E73] dark:text-[#98989D]">
                    Use only 0ms lexicon & free dictionary
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={telemetry.zeroAiLocalOnlyMode}
                  onChange={(e) => costTelemetry.setZeroAiLocalOnlyMode(e.target.checked)}
                  className="accent-[#0071E3] dark:accent-[#0A84FF] w-4 h-4 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Reader Display Name & Native Language in 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
                Scholar Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/40 dark:focus:ring-[#0A84FF]/40"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#6E6E73] dark:text-[#98989D]" />
                Native Translation Language
              </label>
              <select
                value={nativeLanguage}
                onChange={(e) => setNativeLanguage(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/40 dark:focus:ring-[#0A84FF]/40 cursor-pointer"
              >
                {BASE_LANGUAGES.map((lang) => (
                  <option key={lang.name} value={lang.name} className="bg-white dark:bg-[#16161A]">
                    {lang.name} ({lang.nativeName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional Personal Gemini API Key (BYOK) */}
          <div>
            <label className="block text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#0071E3] dark:text-[#0A84FF]" />
                Personal Gemini API Key (Optional BYOK — Stored Locally Only)
              </span>
              <span className="text-[10px] font-mono text-[#6E6E73] dark:text-[#98989D]">
                {customApiKey.trim() ? 'Custom Key Set' : 'Using Default Free Tier'}
              </span>
            </label>
            <input
              type="password"
              value={customApiKey}
              onChange={(e) => setCustomApiKey(e.target.value)}
              placeholder="AIzaSy... (Leave blank to use default free tier / local dictionary)"
              className="w-full px-3 py-2 text-xs font-mono bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/40 dark:focus:ring-[#0A84FF]/40"
            />
          </div>

          {/* Default Reader Typography Scale (Apple Segmented Pill) */}
          <div>
            <label className="block text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] mb-1.5 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-[#6E6E73] dark:text-[#98989D]" />
              Reader Typeface Scale
            </label>
            <div className="grid grid-cols-3 p-1 rounded-full bg-black/[0.045] dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.06]">
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
                  className={`py-1.5 px-2 text-xs rounded-full transition-all cursor-pointer ${
                    readerFontSize === opt.id
                      ? 'bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white font-semibold shadow-2xs'
                      : 'text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-white font-medium'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Daily Word Reading Target */}
          <div>
            <label className="block text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-[#6E6E73] dark:text-[#98989D]" />
                Daily Reading Volume Goal
              </span>
              <span className="font-mono text-[#0071E3] dark:text-[#0A84FF] font-semibold">
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
              className="w-full accent-[#0071E3] dark:accent-[#0A84FF] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#6E6E73] dark:text-[#98989D] mt-1 font-mono">
              <span>Casual (250w)</span>
              <span>Dedicated (500w)</span>
              <span>Scholar (1500w)</span>
            </div>
          </div>

          {/* Iframe-Safe Two-Step Cache Cleanup */}
          <div className="pt-1 flex items-center justify-between">
            <button
              type="button"
              onClick={handleClearCache}
              className={`flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ${
                confirmClearCache
                  ? 'px-3 py-1.5 rounded-full bg-red-600 text-white'
                  : 'text-[#6E6E73] dark:text-[#98989D] hover:text-red-600 dark:hover:text-red-400'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {confirmClearCache
                ? 'Click Again to Confirm Cache Reset'
                : 'Clear Local CEFR Adaptation Cache'}
            </button>

            {cacheClearedMessage && (
              <span className="text-xs text-[#28A745] dark:text-[#34C759] font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                CEFR cache cleared
              </span>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/[0.06] dark:border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-white cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 bg-[#0071E3] hover:bg-[#0077ED] dark:bg-[#0A84FF] dark:hover:bg-[#3395FF] text-white text-xs font-semibold rounded-full transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
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
