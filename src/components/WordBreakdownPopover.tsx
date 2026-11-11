import React, { useState, useEffect } from 'react';
import { Volume2, Bookmark, Check, X, Loader2, Sparkles, ChevronDown, ChevronUp, Globe } from 'lucide-react';
import { WordBreakdown } from '../types/index.ts';
import { BASE_LANGUAGES } from '../data/constants.ts';

interface WordBreakdownPopoverProps {
  breakdown: WordBreakdown | null;
  isLoading: boolean;
  onClose: () => void;
  onSaveToDeck: (item: WordBreakdown) => void;
  isAlreadySaved?: boolean;
  speechLocale: string;
  nativeLang: string;
  onChangeNativeLang?: (langName: string) => void;
  onRequestDeepAi?: () => void;
}

export const WordBreakdownPopover: React.FC<WordBreakdownPopoverProps> = ({
  breakdown,
  isLoading,
  onClose,
  onSaveToDeck,
  isAlreadySaved = false,
  speechLocale,
  nativeLang,
  onChangeNativeLang,
  onRequestDeepAi,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [savedLocally, setSavedLocally] = useState(isAlreadySaved);
  const [isGrammarExpanded, setIsGrammarExpanded] = useState(false);

  useEffect(() => {
    setSavedLocally(isAlreadySaved);
  }, [breakdown?.word, isAlreadySaved]);

  if (!breakdown && !isLoading) return null;

  const handlePlayAudio = (textToSpeak: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = speechLocale;
    utterance.rate = 0.9;
    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleSave = () => {
    if (!breakdown || savedLocally) return;
    onSaveToDeck(breakdown);
    setSavedLocally(true);
  };

  const engineLabel =
    breakdown?.sourceEngine === 'lexicon'
      ? 'Local Lexicon'
      : breakdown?.sourceEngine === 'prefetch'
      ? 'Hover Prefetch'
      : breakdown?.sourceEngine === 'gemini-flash-lite'
      ? 'Gemini AI'
      : 'Hybrid Cache';

  return (
    <div
      className="fixed inset-x-4 bottom-4 md:inset-auto md:bottom-8 md:right-8 z-50 md:w-96 bg-white dark:bg-[#1A1816] rounded-xl border border-stone-200 dark:border-stone-800 shadow-2xl p-5 text-stone-900 dark:text-stone-100 transition-all animate-in fade-in slide-in-from-bottom-3"
      role="dialog"
      aria-modal="true"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-stone-100 dark:border-stone-800/80">
        <div className="flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-400 font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{engineLabel}</span>
          {breakdown && typeof breakdown.latencyMs === 'number' && !isLoading && (
            <>
              <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
              <span className="font-mono text-[11px] tabular-nums text-stone-400 dark:text-stone-500">
                {breakdown.latencyMs === 0 ? '0ms' : `${breakdown.latencyMs}ms`}
              </span>
            </>
          )}
        </div>

        {/* In-Popover Base Language Switcher */}
        <div className="flex items-center gap-1.5">
          {onChangeNativeLang && (
            <div className="flex items-center gap-1">
              <Globe className="w-3 h-3 text-stone-400" />
              <select
                value={nativeLang}
                onChange={(e) => onChangeNativeLang(e.target.value)}
                className="text-[11px] font-medium bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded px-1.5 py-0.5 text-stone-700 dark:text-stone-300 focus:outline-none cursor-pointer"
                title="Change translation language"
              >
                {BASE_LANGUAGES.map((bl) => (
                  <option key={bl.code} value={bl.name}>
                    {bl.flag} {bl.nativeName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1 rounded-md transition-colors cursor-pointer"
            aria-label="Close breakdown"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {breakdown ? (
        <div className="pt-3 space-y-3.5">
          {/* Main Word & Pronunciation */}
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                  {breakdown.word}
                </h3>
                <button
                  onClick={() => handlePlayAudio(breakdown.word)}
                  disabled={isPlayingAudio}
                  title="Pronounce word"
                  className="p-1 rounded-full text-stone-400 hover:text-amber-700 dark:hover:text-amber-400 transition-colors cursor-pointer"
                >
                  <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'animate-pulse text-amber-600' : ''}`} />
                </button>
              </div>

              {breakdown.phoneticIpa && (
                <p className="text-xs font-mono text-stone-400 dark:text-stone-500 mt-0.5">
                  {breakdown.phoneticIpa}
                </p>
              )}
            </div>

            {/* Root / Lemma */}
            <div className="text-right">
              <span className="text-[10px] text-stone-400 dark:text-stone-500 block uppercase tracking-wider">
                Root Form
              </span>
              <span className="font-serif text-sm font-semibold text-stone-700 dark:text-stone-300">
                {breakdown.lemma}
              </span>
            </div>
          </div>

          {/* Instant Contextual Meaning Box */}
          <div className="bg-stone-50 dark:bg-stone-900/60 rounded-lg p-3 border border-stone-200/60 dark:border-stone-800/60">
            <span className="text-[10px] uppercase font-semibold text-amber-800 dark:text-amber-400 tracking-wider block mb-0.5">
              Meaning in this Sentence ({nativeLang})
            </span>
            {isLoading && breakdown.translation === 'Translating in context...' ? (
              <div className="flex items-center gap-2 py-0.5 text-stone-500 dark:text-stone-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-serif italic">Resolving contextual meaning...</span>
              </div>
            ) : (
              <p className="text-base font-medium text-stone-900 dark:text-stone-100 leading-snug">
                {breakdown.translation}
              </p>
            )}
          </div>

          {/* Progressive Philology & Grammar Toggle */}
          <div>
            <button
              type="button"
              onClick={() => setIsGrammarExpanded(!isGrammarExpanded)}
              className="w-full flex items-center justify-between text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 py-1 transition-colors cursor-pointer"
            >
              <span>Grammar & Morphological Analysis</span>
              {isGrammarExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {isGrammarExpanded && (
              <div className="mt-2 p-3 bg-stone-50/70 dark:bg-stone-900/40 rounded-lg border border-stone-100 dark:border-stone-800 text-xs space-y-2 animate-in fade-in duration-150">
                <div className="flex items-start gap-1.5 text-stone-600 dark:text-stone-400">
                  <span className="font-semibold text-stone-800 dark:text-stone-200 shrink-0">Role:</span>
                  <span>
                    {breakdown.partOfSpeech}
                    {breakdown.morphology ? ` · ${breakdown.morphology}` : ''}
                  </span>
                </div>

                {breakdown.usageNote && (
                  <p className="text-stone-500 dark:text-stone-400 italic text-[11px] leading-relaxed">
                    {breakdown.usageNote}
                  </p>
                )}

                {onRequestDeepAi && breakdown.sourceEngine !== 'gemini-flash-lite' && (
                  <button
                    type="button"
                    onClick={onRequestDeepAi}
                    disabled={breakdown.isEnriching}
                    className="flex items-center gap-1.5 text-[11px] font-medium text-amber-800 dark:text-amber-400 hover:underline pt-1 cursor-pointer disabled:opacity-50"
                  >
                    {breakdown.isEnriching ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Running Deep AI Grammar Analysis...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        <span>Run Deep AI Grammar & IPA Analysis</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Sentence Translation */}
          <div className="border-t border-stone-100 dark:border-stone-800/80 pt-2.5">
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-1">
              <span className="font-medium">Sentence Translation ({nativeLang}):</span>
              <button
                onClick={() => handlePlayAudio(breakdown.contextSentence)}
                title="Read sentence aloud"
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 p-0.5 cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="font-reader italic text-xs text-stone-800 dark:text-stone-300 bg-stone-50/50 dark:bg-stone-900/30 p-2 rounded border border-stone-100 dark:border-stone-800/40">
              "{breakdown.contextSentence}"
            </p>
            {breakdown.sentenceTranslation ? (
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 pl-1">
                → {breakdown.sentenceTranslation}
              </p>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-stone-400 mt-1 pl-1 italic">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Translating sentence...</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-1 flex items-center justify-between gap-3">
            <button
              onClick={handleSave}
              disabled={savedLocally}
              className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-medium transition-all ${
                savedLocally
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 shadow-sm cursor-pointer'
              }`}
            >
              {savedLocally ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Saved to Wordbook
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5" />
                  Save to Wordbook (+5 XP)
                </>
              )}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
