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
      className="fixed inset-x-4 bottom-4 md:inset-auto md:bottom-8 md:right-8 max-sm:!fixed max-sm:!inset-x-0 max-sm:!bottom-0 max-sm:!top-auto max-sm:!w-full max-sm:!max-w-none max-sm:!rounded-b-none max-sm:!rounded-t-xl z-50 md:w-96 max-h-[88vh] overflow-y-auto bg-[#FAF8F4] dark:bg-[#181615] rounded-lg border border-stone-200 dark:border-stone-800 p-5 text-stone-900 dark:text-stone-100 transition-colors animate-in fade-in slide-in-from-bottom-3"
      role="dialog"
      aria-modal="false"
      aria-label="Word Breakdown"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-1.5 text-[11px] text-amber-800 dark:text-amber-400 font-medium tracking-wide">
          <Sparkles className="w-3 h-3" />
          <span>{engineLabel}</span>
          {breakdown && typeof breakdown.latencyMs === 'number' && !isLoading && (
            <>
              <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
              <span className="font-mono tabular-nums text-stone-400 dark:text-stone-500">
                {breakdown.latencyMs === 0 ? '0ms' : `${breakdown.latencyMs}ms`}
              </span>
            </>
          )}
        </div>

        {/* In-Popover Base Language Switcher */}
        <div className="flex items-center gap-2">
          {onChangeNativeLang && (
            <div className="flex items-center gap-1">
              <Globe className="w-3 h-3 text-stone-400" />
              <select
                value={nativeLang}
                onChange={(e) => onChangeNativeLang(e.target.value)}
                className="text-[11px] font-medium bg-transparent border-b border-stone-300 dark:border-stone-700 pb-0.5 text-stone-700 dark:text-stone-300 focus:outline-none cursor-pointer"
                title="Change translation language"
              >
                {BASE_LANGUAGES.map((bl) => (
                  <option
                    key={bl.code}
                    value={bl.name}
                    className="bg-[#FAF8F4] dark:bg-[#181615] text-stone-900 dark:text-stone-100"
                  >
                    {bl.flag} {bl.nativeName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 p-0.5 transition-colors cursor-pointer"
            aria-label="Close breakdown"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {breakdown ? (
        <div className="pt-3.5 space-y-3.5">
          {/* Main Word · IPA · Root Form */}
          <div className="flex items-baseline justify-between gap-2 pb-3 border-b border-stone-200 dark:border-stone-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                  {breakdown.word}
                </h3>
                <button
                  onClick={() => handlePlayAudio(breakdown.word)}
                  disabled={isPlayingAudio}
                  title="Pronounce word"
                  className="p-1 text-stone-400 hover:text-amber-800 dark:hover:text-amber-400 transition-colors cursor-pointer"
                >
                  <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'animate-pulse text-amber-800 dark:text-amber-400' : ''}`} />
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

          {/* Instant Contextual Meaning (Borderless Hairline Editorial Typography) */}
          <div className="pb-3 border-b border-stone-200 dark:border-stone-800">
            <span className="text-[10px] uppercase font-semibold text-amber-800 dark:text-amber-400 tracking-wider block mb-1">
              Meaning in Context ({nativeLang})
            </span>
            {isLoading && breakdown.translation === 'Translating in context...' ? (
              <div className="flex items-center gap-2 py-0.5 text-stone-500 dark:text-stone-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-800 dark:text-amber-400" />
                <span className="text-xs font-serif italic">Resolving contextual meaning...</span>
              </div>
            ) : (
              <p className="text-base font-medium text-stone-900 dark:text-stone-100 leading-snug">
                {breakdown.translation}
              </p>
            )}
          </div>

          {/* Progressive Philology & Grammar Disclosure */}
          <div>
            <button
              type="button"
              onClick={() => setIsGrammarExpanded(!isGrammarExpanded)}
              className="w-full flex items-center justify-between text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 py-0.5 transition-colors cursor-pointer"
            >
              <span>Grammar & Morphological Analysis</span>
              {isGrammarExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {isGrammarExpanded && (
              <div className="mt-2 pl-3 border-l border-stone-300 dark:border-stone-700 text-xs space-y-1.5 animate-in fade-in duration-150">
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
          <div className="border-t border-stone-200 dark:border-stone-800 pt-3">
            <div className="flex items-center justify-between text-[11px] text-stone-400 dark:text-stone-500 mb-1.5 uppercase tracking-wider">
              <span>Sentence ({nativeLang})</span>
              <button
                onClick={() => handlePlayAudio(breakdown.contextSentence)}
                title="Read sentence aloud"
                className="text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 p-0.5 cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="font-reader italic text-xs text-stone-800 dark:text-stone-200 border-l border-stone-300 dark:border-stone-700 pl-3 leading-relaxed">
              "{breakdown.contextSentence}"
            </p>
            {breakdown.sentenceTranslation ? (
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-1.5 pl-3">
                → {breakdown.sentenceTranslation}
              </p>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-stone-400 mt-1.5 pl-3 italic">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Translating sentence...</span>
              </div>
            )}
          </div>

          {/* Actions: Save to Wordbook + Share X Card Toggle */}
          <div className="pt-1 flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={savedLocally}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded text-xs font-medium transition-colors ${
                savedLocally
                  ? 'border border-stone-300 dark:border-stone-700 text-stone-500 dark:text-stone-400'
                  : 'bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-[#FAF8F4] dark:text-stone-900 cursor-pointer'
              }`}
            >
              {savedLocally ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  Saved to Wordbook
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5" />
                  Save to Wordbook
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
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded text-xs font-medium border transition-colors cursor-pointer ${
                isShareStudioOpen
                  ? 'border-amber-800 dark:border-amber-400 text-amber-900 dark:text-amber-300'
                  : 'border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-stone-500'
              }`}
              title="Create shareable split-contrast card for X"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share X Card</span>
            </button>
          </div>

          {/* Split-Contrast X Card Studio Panel */}
          {isShareStudioOpen && (
            <div className="mt-3 pt-3.5 border-t border-stone-200 dark:border-stone-800 text-xs space-y-2.5 animate-in fade-in duration-200">
              {/* Header with Title & Theme Switcher */}
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-stone-700 dark:text-stone-300 text-[10px] uppercase tracking-wider">
                  Split-Contrast Card (1200×675)
                </span>
                <div className="flex items-center gap-2.5 text-[11px]">
                  <button
                    type="button"
                    data-testid="x-card-theme-parchment"
                    onClick={() => setCardTheme('parchment')}
                    className={`pb-0.5 transition-colors cursor-pointer ${
                      cardTheme === 'parchment'
                        ? 'text-amber-800 dark:text-amber-400 font-semibold border-b border-amber-800 dark:border-amber-400'
                        : 'text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                  >
                    Parchment
                  </button>
                  <button
                    type="button"
                    data-testid="x-card-theme-obsidian"
                    onClick={() => setCardTheme('obsidian')}
                    className={`pb-0.5 transition-colors cursor-pointer ${
                      cardTheme === 'obsidian'
                        ? 'text-amber-800 dark:text-amber-400 font-semibold border-b border-amber-800 dark:border-amber-400'
                        : 'text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                  >
                    Obsidian
                  </button>
                </div>
              </div>

              {/* Live Canvas Preview */}
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width={1200}
                  height={675}
                  data-testid="x-card-canvas"
                  className="w-full aspect-video rounded border border-stone-200 dark:border-stone-800 bg-[#FAF8F4] dark:bg-stone-950"
                />
              </div>

              {/* Action Buttons: Post on X, Download PNG, Copy Tweet */}
              <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                <button
                  type="button"
                  data-testid="x-card-post-btn"
                  onClick={handlePostOnX}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-[#FAF8F4] dark:text-stone-900 text-[11px] font-medium rounded transition-colors cursor-pointer"
                  title="Copies PNG image to clipboard and opens X tweet composer"
                >
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  <span className="truncate">Post on X</span>
                </button>

                <button
                  type="button"
                  data-testid="x-card-download-btn"
                  onClick={handleDownloadPng}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 border border-stone-300 dark:border-stone-700 hover:border-stone-500 text-stone-700 dark:text-stone-300 text-[11px] font-medium rounded transition-colors cursor-pointer"
                  title="Download 1200x675 PNG directly"
                >
                  <Download className="w-3 h-3 shrink-0" />
                  <span className="truncate">Download</span>
                </button>

                <button
                  type="button"
                  data-testid="x-card-copy-tweet-btn"
                  onClick={handleCopyTweet}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 border border-stone-300 dark:border-stone-700 hover:border-stone-500 text-stone-700 dark:text-stone-300 text-[11px] font-medium rounded transition-colors cursor-pointer"
                  title="Copy formatted <=280c tweet hook text"
                >
                  <Copy className="w-3 h-3 shrink-0" />
                  <span className="truncate">Copy Tweet</span>
                </button>
              </div>

              {/* Toast Feedback */}
              {shareFeedback && (
                <div className="py-1 text-[11px] text-amber-800 dark:text-amber-400 text-center font-medium border-t border-stone-200 dark:border-stone-800 pt-2">
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
