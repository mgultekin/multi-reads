import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  Bookmark,
  Check,
  X,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Globe,
  Share2,
  ExternalLink,
  Download,
  Copy,
} from 'lucide-react';
import { WordBreakdown } from '../types/index.ts';
import { BASE_LANGUAGES } from '../data/constants.ts';
import {
  XCardTheme,
  SplitContrastCardPayload,
  getDefaultB1ContrastSentence,
  renderSplitContrastCardToCanvas,
  buildBenchmarkXIntentText,
  copyCardImageToClipboard,
  downloadCardPng,
  openXWebIntent,
} from '../utils/xCardExporter.ts';

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
  bookId?: string;
  bookTitle?: string;
  bookAuthor?: string;
  languageCode?: string;
  languageName?: string;
  cefrLevel?: string;
  autoOpenShareCard?: boolean;
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
  bookId,
  bookTitle,
  bookAuthor,
  languageCode,
  languageName,
  cefrLevel,
  autoOpenShareCard = false,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [savedLocally, setSavedLocally] = useState(isAlreadySaved);
  const [isGrammarExpanded, setIsGrammarExpanded] = useState(false);
  const [isShareStudioOpen, setIsShareStudioOpen] = useState(Boolean(autoOpenShareCard));
  const [cardTheme, setCardTheme] = useState<XCardTheme>('parchment');
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setSavedLocally(isAlreadySaved);
  }, [breakdown?.word, isAlreadySaved]);

  useEffect(() => {
    setIsShareStudioOpen(Boolean(autoOpenShareCard));
    setShareFeedback(null);
  }, [breakdown?.word, autoOpenShareCard]);

  useEffect(() => {
    if (!breakdown && !isLoading) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (popoverRef.current?.contains(target)) return;
      if (target.closest('[data-word-clickable="true"]')) return;
      onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [breakdown, isLoading, onClose]);

  const b1Sentence = breakdown
    ? getDefaultB1ContrastSentence(languageCode || 'it', bookId, undefined)
    : '';

  const cardPayload: SplitContrastCardPayload | null = breakdown
    ? {
        languageCode: languageCode || 'it',
        languageName: languageName || 'Literature',
        bookId,
        bookTitle: bookTitle || 'Curated Classic',
        author: bookAuthor || 'Author',
        b1TextbookSentence: b1Sentence,
        masterpieceSentence: breakdown.contextSentence || '',
        sentenceTranslation: breakdown.sentenceTranslation,
        focalWord: breakdown.word,
        lemma: breakdown.lemma,
        partOfSpeech: breakdown.partOfSpeech,
        phoneticIpa: breakdown.phoneticIpa,
        wordTranslation: breakdown.translation,
        cefrLevel: cefrLevel || 'Original',
        theme: cardTheme,
      }
    : null;

  useEffect(() => {
    if (!isShareStudioOpen || !cardPayload || !canvasRef.current) return;
    renderSplitContrastCardToCanvas(canvasRef.current, cardPayload);
  }, [isShareStudioOpen, cardPayload, cardTheme]);

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

  const handlePostOnX = async () => {
    if (!canvasRef.current || !cardPayload) return;
    const tweetText = buildBenchmarkXIntentText(cardPayload);
    try {
      const copied = await copyCardImageToClipboard(canvasRef.current);
      openXWebIntent(tweetText);
      if (copied) {
        setShareFeedback('Card copied! Paste (Ctrl+V) in X');
      } else {
        setShareFeedback('Opened X! Click Download PNG to attach');
      }
    } catch {
      openXWebIntent(tweetText);
      setShareFeedback('Opened X! Click Download PNG to attach');
    }
  };

  const handleDownloadPng = () => {
    if (!canvasRef.current || !breakdown) return;
    const cleanWord = breakdown.word.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    downloadCardPng(canvasRef.current, `foliopress-${cleanWord || 'word'}-card.png`);
    setShareFeedback('PNG card downloaded!');
  };

  const handleCopyTweet = async () => {
    if (!cardPayload) return;
    const tweetText = buildBenchmarkXIntentText(cardPayload);
    try {
      await navigator.clipboard.writeText(tweetText);
      setShareFeedback('Copied <=280c Tweet!');
    } catch {
      setShareFeedback('Failed to copy tweet text');
    }
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
      ref={popoverRef}
      className="fixed inset-x-3 bottom-3 max-h-[82vh] overflow-y-auto rounded-3xl sm:inset-auto sm:bottom-8 sm:right-8 sm:w-[400px] sm:max-h-[86vh] sm:rounded-2xl z-50 bg-white/88 dark:bg-[#1C1C1E]/92 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.12] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.24)] p-5 text-[#1D1D1F] dark:text-[#F5F5F7] transition-all animate-in fade-in slide-in-from-bottom-3"
      role="dialog"
      aria-modal="false"
      aria-label="Word Breakdown"
    >
      {/* Inspector Header Bar */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="flex items-center gap-1.5 text-[11px] text-[#0071E3] dark:text-[#0A84FF] font-medium tracking-wide">
          <Sparkles className="w-3 h-3" />
          <span>{engineLabel}</span>
          {breakdown && typeof breakdown.latencyMs === 'number' && !isLoading && (
            <>
              <span aria-hidden="true" className="text-black/20 dark:text-white/20">·</span>
              <span className="font-mono tabular-nums text-[#6E6E73] dark:text-[#98989D]">
                {breakdown.latencyMs === 0 ? '0ms' : `${breakdown.latencyMs}ms`}
              </span>
            </>
          )}
        </div>

        {/* Native Language Switcher & Close */}
        <div className="flex items-center gap-2">
          {onChangeNativeLang && (
            <div className="flex items-center gap-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] px-2 py-0.5">
              <Globe className="w-3 h-3 text-[#6E6E73] dark:text-[#98989D]" />
              <select
                value={nativeLang}
                onChange={(e) => onChangeNativeLang(e.target.value)}
                className="text-[11px] font-medium bg-transparent text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none cursor-pointer"
                title="Change translation language"
              >
                {BASE_LANGUAGES.map((bl) => (
                  <option
                    key={bl.code}
                    value={bl.name}
                    className="bg-white dark:bg-[#1C1C1E] text-[#1D1D1F] dark:text-[#F5F5F7]"
                  >
                    {bl.flag} {bl.nativeName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={onClose}
            className="p-1 rounded-full bg-black/[0.05] dark:bg-white/[0.08] text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Close breakdown"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {breakdown ? (
        <div className="pt-3.5 space-y-3.5">
          {/* Main Word · IPA · Root Form */}
          <div className="flex items-baseline justify-between gap-2 pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-2xl font-semibold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
                  {breakdown.word}
                </h3>
                <button
                  onClick={() => handlePlayAudio(breakdown.word)}
                  disabled={isPlayingAudio}
                  title="Pronounce word"
                  className="p-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-[#6E6E73] dark:text-[#98989D] hover:text-[#0071E3] dark:hover:text-[#0A84FF] transition-colors cursor-pointer"
                >
                  <Volume2 className={`w-3.5 h-3.5 ${isPlayingAudio ? 'animate-pulse text-[#0071E3] dark:text-[#0A84FF]' : ''}`} />
                </button>
              </div>

              {breakdown.phoneticIpa && (
                <p className="text-xs font-mono text-[#6E6E73] dark:text-[#98989D] mt-0.5">
                  {breakdown.phoneticIpa}
                </p>
              )}
            </div>

            <div className="text-right">
              <span className="text-[10px] text-[#6E6E73] dark:text-[#98989D] block uppercase tracking-wider">
                Root Form
              </span>
              <span className="font-display text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                {breakdown.lemma}
              </span>
            </div>
          </div>

          {/* Contextual Meaning */}
          <div>
            <span className="text-[10px] uppercase font-semibold text-[#0071E3] dark:text-[#0A84FF] tracking-wider block mb-1">
              Meaning in Context ({nativeLang})
            </span>
            {isLoading && breakdown.translation === 'Translating in context...' ? (
              <div className="flex items-center gap-2 py-0.5 text-[#6E6E73] dark:text-[#98989D]">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0071E3] dark:text-[#0A84FF]" />
                <span className="text-xs font-reader italic">Resolving contextual meaning...</span>
              </div>
            ) : (
              <p className="text-base font-medium text-[#1D1D1F] dark:text-[#F5F5F7] leading-snug">
                {breakdown.translation}
              </p>
            )}
          </div>

          {/* Subtle Textbook B1 vs. Original Inset Contrast Card */}
          <div className="rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.06] p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-[#6E6E73] dark:text-[#98989D]">
              <span>Textbook B1 vs. Original</span>
              <button
                onClick={() => handlePlayAudio(breakdown.contextSentence)}
                title="Read authentic sentence aloud"
                className="text-[#6E6E73] hover:text-[#0071E3] dark:hover:text-[#0A84FF] cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-[11px] text-[#6E6E73] dark:text-[#98989D] leading-snug">
              <span className="font-semibold text-red-600/80 dark:text-red-400/80 mr-1">× B1:</span>
              <span>"{b1Sentence}"</span>
            </div>

            <div className="pt-1.5 border-t border-black/[0.05] dark:border-white/[0.06]">
              <p className="font-reader italic text-xs text-[#1D1D1F] dark:text-[#F5F5F7] leading-relaxed">
                <span className="not-italic font-sans font-semibold text-emerald-700 dark:text-emerald-400 mr-1">
                  ✓ Original:
                </span>
                "{breakdown.contextSentence}"
              </p>
              {breakdown.sentenceTranslation ? (
                <p className="text-[11px] text-[#6E6E73] dark:text-[#98989D] mt-1">
                  → {breakdown.sentenceTranslation}
                </p>
              ) : (
                <div className="flex items-center gap-1.5 text-[11px] text-[#6E6E73] mt-1 italic">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Translating sentence...</span>
                </div>
              )}
            </div>
          </div>

          {/* Progressive Philology & Grammar Disclosure */}
          <div>
            <button
              type="button"
              onClick={() => setIsGrammarExpanded(!isGrammarExpanded)}
              className="w-full flex items-center justify-between text-xs font-medium text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-white py-0.5 transition-colors cursor-pointer"
            >
              <span>Grammar & Morphological Analysis</span>
              {isGrammarExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {isGrammarExpanded && (
              <div className="mt-2 pl-3 border-l-2 border-[#0071E3]/30 dark:border-[#0A84FF]/30 text-xs space-y-1.5 animate-in fade-in duration-150">
                <div className="flex items-start gap-1.5 text-[#6E6E73] dark:text-[#98989D]">
                  <span className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] shrink-0">Role:</span>
                  <span>
                    {breakdown.partOfSpeech}
                    {breakdown.morphology ? ` · ${breakdown.morphology}` : ''}
                  </span>
                </div>

                {breakdown.usageNote && (
                  <p className="text-[#6E6E73] dark:text-[#98989D] italic text-[11px] leading-relaxed">
                    {breakdown.usageNote}
                  </p>
                )}

                {onRequestDeepAi && breakdown.sourceEngine !== 'gemini-flash-lite' && (
                  <button
                    type="button"
                    onClick={onRequestDeepAi}
                    disabled={breakdown.isEnriching}
                    className="flex items-center gap-1.5 text-[11px] font-medium text-[#0071E3] dark:text-[#0A84FF] hover:underline pt-1 cursor-pointer disabled:opacity-50"
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

          {/* Actions: Apple System Blue + Save to Wordbook Pill + Share X Card */}
          <div className="pt-1 flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={savedLocally}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-4 rounded-full text-xs font-semibold transition-all ${
                savedLocally
                  ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25'
                  : 'bg-[#0071E3] hover:bg-[#0077ED] dark:bg-[#0A84FF] dark:hover:bg-[#3395FF] text-white cursor-pointer shadow-xs'
              }`}
            >
              {savedLocally ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Saved to Wordbook
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5" />
                  + Save to Wordbook
                </>
              )}
            </button>

            <button
              type="button"
              data-testid="toggle-x-card-studio"
              onClick={() => {
                setIsShareStudioOpen(!isShareStudioOpen);
                setShareFeedback(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                isShareStudioOpen
                  ? 'bg-black/[0.06] dark:bg-white/[0.1] border-[#0071E3] dark:border-[#0A84FF] text-[#0071E3] dark:text-[#0A84FF]'
                  : 'border-black/[0.1] dark:border-white/[0.12] text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
              }`}
              title="Create shareable split-contrast card for X"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share X Card</span>
            </button>
          </div>

          {/* Split-Contrast X Card Studio Panel */}
          {isShareStudioOpen && (
            <div className="mt-3 pt-3.5 border-t border-black/[0.06] dark:border-white/[0.08] text-xs space-y-2.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-[#6E6E73] dark:text-[#98989D] text-[10px] uppercase tracking-wider">
                  Split-Contrast Card (1200×675)
                </span>
                <div className="flex items-center p-0.5 rounded-full bg-black/[0.05] dark:bg-white/[0.07] text-[11px]">
                  <button
                    type="button"
                    data-testid="x-card-theme-parchment"
                    onClick={() => setCardTheme('parchment')}
                    className={`px-2.5 py-0.5 rounded-full transition-colors cursor-pointer ${
                      cardTheme === 'parchment'
                        ? 'bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white font-semibold shadow-2xs'
                        : 'text-[#6E6E73] dark:text-[#98989D]'
                    }`}
                  >
                    Parchment
                  </button>
                  <button
                    type="button"
                    data-testid="x-card-theme-obsidian"
                    onClick={() => setCardTheme('obsidian')}
                    className={`px-2.5 py-0.5 rounded-full transition-colors cursor-pointer ${
                      cardTheme === 'obsidian'
                        ? 'bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white font-semibold shadow-2xs'
                        : 'text-[#6E6E73] dark:text-[#98989D]'
                    }`}
                  >
                    Obsidian
                  </button>
                </div>
              </div>

              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width={1200}
                  height={675}
                  data-testid="x-card-canvas"
                  className="w-full aspect-video rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#F5F5F7] dark:bg-[#16161A]"
                />
              </div>

              <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                <button
                  type="button"
                  data-testid="x-card-post-btn"
                  onClick={handlePostOnX}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 bg-[#1D1D1F] hover:bg-black dark:bg-[#F5F5F7] dark:hover:bg-white text-white dark:text-[#1D1D1F] text-[11px] font-semibold rounded-full transition-colors cursor-pointer"
                  title="Copies PNG image to clipboard and opens X tweet composer"
                >
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  <span className="truncate">Post on X</span>
                </button>

                <button
                  type="button"
                  data-testid="x-card-download-btn"
                  onClick={handleDownloadPng}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 border border-black/[0.1] dark:border-white/[0.12] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-[#1D1D1F] dark:text-[#F5F5F7] text-[11px] font-medium rounded-full transition-colors cursor-pointer"
                  title="Download 1200x675 PNG directly"
                >
                  <Download className="w-3 h-3 shrink-0" />
                  <span className="truncate">Download</span>
                </button>

                <button
                  type="button"
                  data-testid="x-card-copy-tweet-btn"
                  onClick={handleCopyTweet}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 border border-black/[0.1] dark:border-white/[0.12] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-[#1D1D1F] dark:text-[#F5F5F7] text-[11px] font-medium rounded-full transition-colors cursor-pointer"
                  title="Copy formatted <=280c tweet hook text"
                >
                  <Copy className="w-3 h-3 shrink-0" />
                  <span className="truncate">Copy Tweet</span>
                </button>
              </div>

              {shareFeedback && (
                <div className="py-1 text-[11px] text-[#0071E3] dark:text-[#0A84FF] text-center font-medium border-t border-black/[0.06] dark:border-white/[0.08] pt-2">
                  {shareFeedback}
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
