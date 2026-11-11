import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Sparkles,
  BookOpen,
  Languages,
  Loader2,
  Download,
} from 'lucide-react';
import { CEFRLevel, ContentItem, LanguageCode, WordBreakdown } from '../types/index.ts';
import { CEFR_LEVELS, SUPPORTED_LANGUAGES, GENRES } from '../data/constants.ts';
import { storageService } from '../services/storageService.ts';
import { contentService } from '../services/contentService.ts';
import { geminiClient } from '../services/geminiClient.ts';
import { WordBreakdownPopover } from './WordBreakdownPopover.tsx';
import { SectionQuizModal } from './SectionQuizModal.tsx';

interface ReaderViewProps {
  currentBook: ContentItem | null;
  targetLang: LanguageCode;
  onSelectBook: (book: ContentItem) => void;
  onOpenLibrary: () => void;
  onRecordWords: (
    words: number,
    bookMeta?: { bookId?: string; bookTitle?: string; language?: LanguageCode }
  ) => void;
  onAwardXP: (xpAmount: number) => void;
  nativeLang: string;
  onChangeNativeLang: (lang: string) => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({
  currentBook,
  targetLang,
  onSelectBook,
  onOpenLibrary,
  onRecordWords,
  onAwardXP,
  nativeLang,
  onChangeNativeLang,
}) => {
  const [currentLevel, setCurrentLevel] = useState<CEFRLevel>('Original');
  const [chunkIndex, setChunkIndex] = useState(0);
  const [isAdapting, setIsAdapting] = useState(false);
  const [isFetchingGutenberg, setIsFetchingGutenberg] = useState(false);
  const [displayText, setDisplayText] = useState<string>('');
  const [selectedWordData, setSelectedWordData] = useState<WordBreakdown | null>(null);
  const [isLoadingBreakdown, setIsLoadingBreakdown] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [savedWordsMap, setSavedWordsMap] = useState<Record<string, boolean>>({});
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isBilingualMode, setIsBilingualMode] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>(() => {
    return storageService.getUserProfile().readerFontSize || 'md';
  });
  // Trigger re-render when background sentence batch prefetch finishes for bilingual parallel mode
  const [, setBilingualTick] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimerRef = useRef<number | null>(null);
  const activeLookupIdRef = useRef<number>(0);
  const activeLangInfo = SUPPORTED_LANGUAGES.find((l) => l.code === targetLang) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    if (!currentBook) return;

    const initialChunk = currentBook.currentChunkIndex || 0;
    setChunkIndex(initialChunk);
    setCurrentLevel('Original');

    // Check if this is an unhydrated Gutenberg search result placeholder
    const firstChunk = currentBook.chunks[0] || '';
    if (firstChunk.startsWith('Loading full text from Project Gutenberg')) {
      hydrateGutenbergBook(currentBook);
    } else {
      loadChunkContent(currentBook, initialChunk, 'Original');
      // Record lastReadAt timestamp so Library "Continue Reading" stays accurate
      const updatedBook: ContentItem = {
        ...currentBook,
        lastReadAt: Date.now(),
      };
      storageService.saveBook(updatedBook);
    }

    loadSavedWords();
  }, [currentBook?.id]);

  // Proactively batch-prefetch sentence and key vocabulary translations whenever section text or nativeLang changes
  useEffect(() => {
    if (!displayText) return;
    geminiClient.prefetchSectionBatch(displayText, activeLangInfo.name, nativeLang).then(() => {
      setBilingualTick((t) => t + 1);
    });
  }, [displayText, activeLangInfo.name, nativeLang]);

  // Re-translate the active open word immediately when user changes nativeLang in Navbar or Popover
  useEffect(() => {
    if (!selectedWordData) return;
    handleWordClick(selectedWordData.word, selectedWordData.contextSentence);
  }, [nativeLang]);

  const hydrateGutenbergBook = async (book: ContentItem) => {
    setIsFetchingGutenberg(true);
    try {
      const fullChunks = await contentService.fetchGutenbergBookContent(
        book.id,
        book.language,
        book.title
      );
      const totalWords = fullChunks.join(' ').split(/\s+/).length;
      const hydratedBook: ContentItem = {
        ...book,
        chunks: fullChunks,
        wordCount: totalWords,
        estimatedReadTimeMinutes: Math.max(2, Math.round(totalWords / 180)),
        currentChunkIndex: 0,
        lastReadAt: Date.now(),
      };
      await storageService.saveBook(hydratedBook);
      onSelectBook(hydratedBook);
      setDisplayText(fullChunks[0] || '');
    } catch (e) {
      console.warn('Failed to hydrate Gutenberg book', e);
      setDisplayText(book.chunks[0] || '');
    } finally {
      setIsFetchingGutenberg(false);
    }
  };

  const loadSavedWords = async () => {
    const list = await storageService.getFlashcards(targetLang);
    const map: Record<string, boolean> = {};
    for (const card of list) {
      map[card.word.toLowerCase()] = true;
    }
    setSavedWordsMap(map);
  };

  const loadChunkContent = async (book: ContentItem, index: number, level: CEFRLevel) => {
    const rawChunk = book.chunks[index] || book.chunks[0] || '';

    if (level === 'Original') {
      setDisplayText(rawChunk);
      return;
    }

    const cached = await storageService.getCachedCEFR(book.id, index, level);
    if (cached) {
      setDisplayText(cached);
      return;
    }

    setIsAdapting(true);
    try {
      const adapted = await geminiClient.adaptToCEFR(rawChunk, activeLangInfo.name, level);
      setDisplayText(adapted);
      await storageService.setCachedCEFR(book.id, index, level, adapted);
    } catch (e) {
      console.warn('Adaptation failed, showing original chunk', e);
      setDisplayText(rawChunk);
    } finally {
      setIsAdapting(false);
    }
  };

  const persistSectionProgress = async (book: ContentItem, newIdx: number) => {
    const updatedBook: ContentItem = {
      ...book,
      currentChunkIndex: newIdx,
      lastReadAt: Date.now(),
    };
    await storageService.saveBook(updatedBook);
  };

  const handleLevelChange = async (level: CEFRLevel) => {
    if (!currentBook || level === currentLevel || isAdapting) return;
    setCurrentLevel(level);
    await loadChunkContent(currentBook, chunkIndex, level);
  };

  const handlePrevChunk = () => {
    if (!currentBook || chunkIndex <= 0) return;
    const newIdx = chunkIndex - 1;
    setChunkIndex(newIdx);
    loadChunkContent(currentBook, newIdx, currentLevel);
    persistSectionProgress(currentBook, newIdx);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextChunk = () => {
    if (!currentBook || chunkIndex >= currentBook.chunks.length - 1) return;
    const newIdx = chunkIndex + 1;
    setChunkIndex(newIdx);
    loadChunkContent(currentBook, newIdx, currentLevel);
    persistSectionProgress(currentBook, newIdx);

    // Record actual words read for this section + create ReadingLogEntry
    const chunkWords = (displayText || '').split(/\s+/).filter(Boolean).length;
    onRecordWords(chunkWords, {
      bookId: currentBook.id,
      bookTitle: currentBook.title,
      language: currentBook.language,
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFontSizeCycle = () => {
    const order: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];
    const nextSize = order[(order.indexOf(fontSize) + 1) % order.length];
    setFontSize(nextSize);
    const profile = storageService.getUserProfile();
    storageService.saveUserProfile({ ...profile, readerFontSize: nextSize });
  };

  // 80ms Hover Intent Prefetcher: silently warms cache before click completes
  const handleWordHoverStart = (word: string, surroundingSentence: string) => {
    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current);
    }
    hoverTimerRef.current = window.setTimeout(() => {
      geminiClient.prefetchWord(word, surroundingSentence, activeLangInfo.name, nativeLang);
    }, 80);
  };

  const handleWordHoverEnd = () => {
    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  // Word click handler (0ms synchronous cache/prefetch hit -> ultra-fast flash-lite & progressive enrichment)
  const handleWordClick = async (word: string, surroundingSentence: string) => {
    const clean = geminiClient.normalizeWord(word);
    if (!clean || clean.length <= 1) return;

    const lookupId = ++activeLookupIdRef.current;

    const instantHit = geminiClient.getInstantCachedBreakdown(
      clean,
      surroundingSentence,
      activeLangInfo.code,
      activeLangInfo.name,
      nativeLang
    );

    if (instantHit) {
      setSelectedWordData(instantHit);
      setIsLoadingBreakdown(false);
    } else {
      const preCachedSentence = geminiClient.getCachedSentenceTranslation(surroundingSentence, nativeLang);
      setIsLoadingBreakdown(true);
      setSelectedWordData({
        word: clean,
        contextSentence: surroundingSentence,
        translation: 'Translating in context...',
        lemma: clean.toLowerCase(),
        partOfSpeech: 'Word',
        morphology: '',
        sentenceTranslation: preCachedSentence || '',
        targetLang: activeLangInfo.name,
        isEnriching: true,
      });
    }

    try {
      const breakdown = await geminiClient.getWordBreakdown(
        clean,
        surroundingSentence,
        activeLangInfo.name,
        nativeLang,
        (enriched) => {
          if (activeLookupIdRef.current === lookupId) {
            setSelectedWordData(enriched);
          }
        }
      );
      if (activeLookupIdRef.current === lookupId) {
        setSelectedWordData(breakdown);
      }
    } catch (err) {
      console.error('Word breakdown error', err);
    } finally {
      if (activeLookupIdRef.current === lookupId) {
        setIsLoadingBreakdown(false);
      }
    }
  };

  const toggleSpeechPlayback = () => {
    if (!('speechSynthesis' in window)) return;

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(displayText);
      utterance.lang = activeLangInfo.speechLocale;
      utterance.rate = 0.92;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  const handleSaveToDeck = async (item: WordBreakdown) => {
    await storageService.saveFlashcard({
      id: `card-${Date.now()}`,
      word: item.word,
      contextSentence: item.contextSentence,
      translation: item.translation,
      lemma: item.lemma,
      partOfSpeech: item.partOfSpeech,
      morphology: item.morphology,
      sentenceTranslation: item.sentenceTranslation,
      usageNote: item.usageNote,
      phoneticIpa: item.phoneticIpa,
      language: targetLang,
      genre: currentBook?.genre || 'fiction',
      bookTitle: currentBook?.title,
      createdAt: Date.now(),
      nextReviewAt: Date.now() + 1000 * 60 * 60 * 24,
      reviewCount: 0,
      easeFactor: 2.5,
      masteryLevel: 0,
    });

    setSavedWordsMap((prev) => ({ ...prev, [item.word.toLowerCase()]: true }));
    onAwardXP(10); // +10 XP bonus for saving new vocabulary (without inflating wordsReadToday)
  };

  if (!currentBook) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-24 text-center">
        <BookOpen className="w-12 h-12 mx-auto text-stone-400 dark:text-stone-600 mb-4 stroke-[1.5]" />
        <h2 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2">
          Select a Reading from Your Library
        </h2>
        <p className="text-stone-600 dark:text-stone-400 text-sm max-w-md mx-auto mb-6">
          Choose a philosophical text, classic fiction, or imported article to begin your immersive reading session.
        </p>
        <button
          onClick={onOpenLibrary}
          className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-sm font-medium rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          Explore Genre Library
        </button>
      </div>
    );
  }

  const genreInfo = GENRES.find((g) => g.id === currentBook.genre);
  const totalChunks = currentBook.chunks.length;
  const progressPercent = Math.round(((chunkIndex + 1) / totalChunks) * 100);

  const fontSizeClass =
    fontSize === 'sm'
      ? 'text-base lg:text-[1.05rem] leading-[1.8]'
      : fontSize === 'lg'
      ? 'text-xl lg:text-[1.35rem] leading-[1.95]'
      : 'text-lg lg:text-[1.18rem] leading-[1.85]';

  // Render paragraphs and tokenize words into clickable spans + optional Bilingual Parallel line
  const renderInteractiveText = (text: string) => {
    const paragraphs = text.split(/\n\s*\n/);

    return paragraphs.map((para, pIdx) => {
      const trimmed = para.trim();
      if (!trimmed) return null;

      const sentences = trimmed.match(/[^.!?]+[.!?]+|\S+/g) || [trimmed];

      // Build parallel translation for paragraph if Bilingual Mode is active
      const parallelSentences = isBilingualMode
        ? sentences
            .map((s) => geminiClient.getCachedSentenceTranslation(s.trim(), nativeLang))
            .filter(Boolean)
            .join(' ')
        : '';

      return (
        <div key={`p-wrap-${pIdx}`} className="mb-7">
          <p
            className={`font-reader ${fontSizeClass} text-[#292524] dark:text-[#E7E2D7] text-justify tracking-normal ${
              pIdx === 0
                ? 'first-letter:text-5xl first-letter:font-display first-letter:font-bold first-letter:float-left first-letter:mr-3.5 first-letter:mt-1 first-letter:text-amber-800 dark:first-letter:text-amber-400'
                : ''
            }`}
          >
            {sentences.map((sentence, sIdx) => {
              const tokens = sentence.split(/(\s+|[«"'(]+|[»"')!?,.:;]+)/);

              return (
                <span key={`s-${pIdx}-${sIdx}`} className="inline">
                  {tokens.map((token, tIdx) => {
                    const isWord = /[\p{L}]/u.test(token);
                    const isSaved = isWord && savedWordsMap[geminiClient.normalizeWord(token)];

                    if (!isWord) {
                      return <span key={`t-${tIdx}`}>{token}</span>;
                    }

                    return (
                      <span
                        key={`t-${tIdx}`}
                        onMouseEnter={() => handleWordHoverStart(token, sentence)}
                        onMouseLeave={handleWordHoverEnd}
                        onClick={() => handleWordClick(token, sentence)}
                        className={`cursor-pointer rounded px-0.5 transition-colors select-text hover:bg-amber-200/70 dark:hover:bg-amber-900/40 hover:text-amber-950 dark:hover:text-amber-100 ${
                          isSaved
                            ? 'border-b border-amber-600/60 dark:border-amber-400/60 text-amber-900 dark:text-amber-200 font-medium'
                            : ''
                        }`}
                      >
                        {token}
                      </span>
                    );
                  })}
                </span>
              );
            })}
          </p>

          {isBilingualMode && (
            <div className="mt-2 pl-4 border-l-2 border-amber-500/40 dark:border-amber-500/30 text-xs sm:text-sm font-serif italic text-stone-500 dark:text-stone-400 leading-relaxed">
              {parallelSentences || `Translating paragraph into ${nativeLang}...`}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen pb-32">
      {/* Top Sticky Reading Utility Ribbon */}
      <div className="sticky top-[57px] z-30 w-full border-b border-[#E7E2D7]/80 dark:border-[#2C2926]/80 bg-[#FBF9F5]/95 dark:bg-[#141312]/95 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 py-2.5 flex flex-wrap items-center justify-between gap-4">
          {/* Left: Book Meta & Back */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenLibrary}
              className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Library
            </button>
            <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
            <span className="text-xs font-serif italic text-stone-600 dark:text-stone-400 truncate max-w-[180px] sm:max-w-xs">
              {currentBook.title}
            </span>
          </div>

          {/* Center / Right: CEFR Adaptation + Bilingual Parallel Mode + Font Size + Audio */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-stone-400 dark:text-stone-500 mr-0.5 hidden md:inline">
              CEFR:
            </span>

            {/* Segmented Control */}
            <div className="flex items-center p-0.5 bg-stone-200/70 dark:bg-stone-900 rounded-lg border border-stone-300/40 dark:border-stone-800">
              {CEFR_LEVELS.map((lvl) => {
                const isActive = currentLevel === lvl.level;
                return (
                  <button
                    key={lvl.level}
                    onClick={() => handleLevelChange(lvl.level as CEFRLevel)}
                    disabled={isAdapting}
                    title={lvl.desc}
                    className={`px-2 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                    }`}
                  >
                    {lvl.level}
                  </button>
                );
              })}
            </div>

            {/* Bilingual Parallel View Toggle */}
            <button
              onClick={() => setIsBilingualMode(!isBilingualMode)}
              title={`Toggle Bilingual Parallel View (${nativeLang})`}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                isBilingualMode
                  ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                  : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              <Languages className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Parallel</span>
            </button>

            {/* Font Size Cycle Button */}
            <button
              onClick={handleFontSizeCycle}
              title={`Typeface scale: ${fontSize.toUpperCase()}`}
              className="px-2 py-1 rounded-lg border bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-xs font-serif font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 transition-colors cursor-pointer"
            >
              Aa·{fontSize.toUpperCase()}
            </button>

            {/* Audio Read-Aloud Button */}
            <button
              onClick={toggleSpeechPlayback}
              title={isPlayingAudio ? 'Stop speech' : 'Listen to chapter in target language'}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isPlayingAudio
                  ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300'
                  : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              {isPlayingAudio ? <VolumeX className="w-4 h-4 animate-pulse" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Thin Horizontal Reading Progress Line */}
        <div className="w-full h-0.5 bg-stone-200 dark:bg-stone-800">
          <div
            className="h-full bg-amber-600 dark:bg-amber-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Reading Canvas (Optimal 68ch Measure) */}
      <main ref={containerRef} className="max-w-2xl mx-auto px-6 pt-12">
        {/* Editorial Heading Lockup */}
        <header className="mb-10 text-center border-b border-stone-200/70 dark:border-stone-800/70 pb-8">
          <div className="flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-3">
            <span>{genreInfo?.label || 'Literature'}</span>
            <span aria-hidden="true">·</span>
            <span>{activeLangInfo.name}</span>
            <span aria-hidden="true">·</span>
            <span>{currentLevel} Graded</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-100 mb-2">
            {currentBook.title}
          </h1>

          <p className="font-serif italic text-base text-stone-600 dark:text-stone-400">
            by {currentBook.author}
          </p>

          <div className="mt-4 inline-flex items-center gap-3 text-xs font-mono text-stone-400 dark:text-stone-500">
            <span>Section {chunkIndex + 1} of {totalChunks}</span>
            <span>·</span>
            <span>~{currentBook.estimatedReadTimeMinutes} min read</span>
          </div>
        </header>

        {/* Gutenberg Hydration Banner */}
        {isFetchingGutenberg && (
          <div className="mb-8 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl flex items-center justify-center gap-3 text-amber-900 dark:text-amber-200 text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
            <span className="font-serif italic">
              Retrieving full public-domain manuscript from Project Gutenberg archives...
            </span>
          </div>
        )}

        {/* Manual Re-Fetch Full Text Button if book is still a single short placeholder */}
        {!isFetchingGutenberg &&
          currentBook.id.startsWith('gutenberg-search-') &&
          currentBook.chunks.length === 1 && (
            <div className="mb-6 flex justify-center">
              <button
                onClick={() => hydrateGutenbergBook(currentBook)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-stone-100 dark:bg-stone-900 hover:bg-amber-100/60 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-700" />
                Load Full Multi-Section Gutenberg Text
              </button>
            </div>
          )}

        {/* Adapting Spinner Banner */}
        {isAdapting && (
          <div className="mb-8 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl flex items-center justify-center gap-3 text-amber-900 dark:text-amber-200 text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
            <span className="font-serif italic">
              Rewriting prose into CEFR {currentLevel} via Gemini... (will be cached locally)
            </span>
          </div>
        )}

        {/* Chapter Prose */}
        <article className="relative">
          {renderInteractiveText(displayText)}
        </article>

        {/* Interactive Section Mastery & Comprehension Quiz Callout */}
        <div className="my-12 p-6 bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs uppercase font-bold text-amber-800 dark:text-amber-400 tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Section Mastery Check</span>
            </div>
            <h4 className="font-display text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
              Test Comprehension & Vocabulary
            </h4>
            <p className="text-xs text-stone-600 dark:text-stone-400 font-serif mt-0.5">
              Take a 3-question active recall test on this passage in {nativeLang} and earn +25 Reading XP.
            </p>
          </div>

          <button
            onClick={() => setIsQuizOpen(true)}
            className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap self-start sm:self-auto"
          >
            Start Section Test
          </button>
        </div>

        {/* Bottom Pagination & Section Navigation */}
        <footer className="mt-8 pt-8 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-4">
          <button
            onClick={handlePrevChunk}
            disabled={chunkIndex <= 0}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:border-stone-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous Section
          </button>

          <div className="text-xs font-mono text-stone-500 dark:text-stone-400">
            {progressPercent}% Complete
          </div>

          <button
            onClick={handleNextChunk}
            disabled={chunkIndex >= totalChunks - 1}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Next Section
            <ChevronRight className="w-4 h-4" />
          </button>
        </footer>
      </main>

      {/* Context-Aware Word & Grammar Breakdown Popover */}
      <WordBreakdownPopover
        breakdown={selectedWordData}
        isLoading={isLoadingBreakdown}
        onClose={() => setSelectedWordData(null)}
        onSaveToDeck={handleSaveToDeck}
        isAlreadySaved={selectedWordData ? savedWordsMap[selectedWordData.word.toLowerCase()] : false}
        speechLocale={activeLangInfo.speechLocale}
        nativeLang={nativeLang}
        onChangeNativeLang={onChangeNativeLang}
      />

      {/* Interactive Section Comprehension Quiz Modal */}
      <SectionQuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        textChunk={displayText}
        targetLangName={activeLangInfo.name}
        baseLangName={nativeLang}
        onAwardXP={(amount) => onAwardXP(amount)}
        sectionTitle={`${currentBook.title} - Section ${chunkIndex + 1}`}
      />
    </div>
  );
};
