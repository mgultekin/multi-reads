import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Maximize2,
  Minimize2,
  Bookmark,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Share2,
} from 'lucide-react';
import { CEFRLevel, ContentItem, LanguageCode, PreFlightWord, WordBreakdown } from '../types/index.ts';
import { CEFR_LEVELS, SUPPORTED_LANGUAGES, GENRES } from '../data/constants.ts';
import { storageService } from '../services/storageService.ts';
import { contentService } from '../services/contentService.ts';
import { geminiClient, splitParagraphIntoSentences } from '../services/geminiClient.ts';
import { WordBreakdownPopover } from './WordBreakdownPopover.tsx';
import { SectionQuizModal } from './SectionQuizModal.tsx';

interface ReaderViewProps {
  currentBook: ContentItem | null;
  targetLang: LanguageCode;
  onSelectBook: (book: ContentItem) => void;
  onUpdateBook?: (book: ContentItem) => void;
  onOpenLibrary: () => void;
  onRecordWords: (
    words: number,
    bookMeta?: { bookId?: string; bookTitle?: string; language?: LanguageCode }
  ) => void;
  onAwardXP: (xpAmount: number) => void;
  nativeLang: string;
  onChangeNativeLang: (lang: string) => void;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
  readerFontSize?: 'sm' | 'md' | 'lg';
  onChangeFontSize?: (size: 'sm' | 'md' | 'lg') => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({
  currentBook,
  targetLang,
  onSelectBook,
  onUpdateBook,
  onOpenLibrary,
  onRecordWords,
  onAwardXP,
  nativeLang,
  onChangeNativeLang,
  isFocusMode = false,
  onToggleFocusMode,
  readerFontSize,
  onChangeFontSize,
}) => {
  const [currentLevel, setCurrentLevel] = useState<CEFRLevel>('Original');
  const [chunkIndex, setChunkIndex] = useState(0);
  const [isAdapting, setIsAdapting] = useState(false);
  const [isFetchingGutenberg, setIsFetchingGutenberg] = useState(false);
  const [gutenbergError, setGutenbergError] = useState<string | null>(null);
  const [displayText, setDisplayText] = useState<string>('');
  const [selectedWordData, setSelectedWordData] = useState<WordBreakdown | null>(null);
  const [selectedWordKey, setSelectedWordKey] = useState<string | null>(null);
  const [isLoadingBreakdown, setIsLoadingBreakdown] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [speechRate, setSpeechRate] = useState<0.85 | 1.0>(0.85);
  const [speakingSentenceIdx, setSpeakingSentenceIdx] = useState<number | null>(null);
  const [savedWordsMap, setSavedWordsMap] = useState<Record<string, boolean>>({});
  const [showPreflight, setShowPreflight] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isBilingualMode, setIsBilingualMode] = useState(false);
  const [parallelTranslations, setParallelTranslations] = useState<Record<string, string>>({});
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>(() => {
    return readerFontSize || storageService.getUserProfile().readerFontSize || 'md';
  });

  useEffect(() => {
    if (readerFontSize && readerFontSize !== fontSize) {
      setFontSize(readerFontSize);
    }
  }, [readerFontSize]);

  const [completedSectionKeys, setCompletedSectionKeys] = useState<Record<string, boolean>>({});
  const [autoOpenShareCard, setAutoOpenShareCard] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);
  const activeLookupIdRef = useRef<number>(0);

  useEffect(() => {
    if (!isToolsOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setIsToolsOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsToolsOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isToolsOpen]);
  const speechCancelledRef = useRef<boolean>(false);
  const speechRateRef = useRef<0.85 | 1.0>(0.85);
  const activeLangInfo = SUPPORTED_LANGUAGES.find((l) => l.code === targetLang) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    speechRateRef.current = speechRate;
  }, [speechRate]);

  const stopSpeech = () => {
    speechCancelledRef.current = true;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    setSpeakingSentenceIdx(null);
  };

  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  useEffect(() => {
    stopSpeech();
    setSelectedWordData(null);
    setSelectedWordKey(null);
    setAutoOpenShareCard(false);
    setGutenbergError(null);

    if (!currentBook) return;

    const initialChunk = Math.min(
      currentBook.currentChunkIndex || 0,
      Math.max(0, (currentBook.chunks?.length || 1) - 1)
    );
    setChunkIndex(initialChunk);
    setCurrentLevel('Original');

    const firstChunk = currentBook.chunks[0] || '';
    if (
      firstChunk.startsWith('Loading full text from Project Gutenberg') ||
      firstChunk.startsWith('Click "Load Full Book"')
    ) {
      hydrateGutenbergBook(currentBook);
    } else {
      loadChunkContent(currentBook, initialChunk, 'Original');
      const updatedBook: ContentItem = {
        ...currentBook,
        lastReadAt: Date.now(),
      };
      storageService.saveBook(updatedBook);
    }

    loadSavedWords();
  }, [currentBook?.id, targetLang]);

  // Proactively batch-prefetch sentence & paragraph translations
  useEffect(() => {
    if (!displayText) return;
    let cancelled = false;

    const paragraphs = displayText
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);

    geminiClient.prefetchSectionBatch(displayText, activeLangInfo.name, nativeLang).then(() => {
      if (cancelled || !isBilingualMode) return;
      geminiClient.translateParagraphs(paragraphs, activeLangInfo.name, nativeLang).then((map) => {
        if (!cancelled) {
          setParallelTranslations((prev) => ({ ...prev, ...map }));
        }
      });
    });

    if (isBilingualMode) {
      geminiClient.translateParagraphs(paragraphs, activeLangInfo.name, nativeLang).then((map) => {
        if (!cancelled) {
          setParallelTranslations((prev) => ({ ...prev, ...map }));
        }
      });
    }

    return () => {
      cancelled = true;
    };
  }, [displayText, activeLangInfo.name, nativeLang, isBilingualMode]);

  // Re-translate the active open word immediately when user changes nativeLang in Navbar or Popover
  useEffect(() => {
    if (!selectedWordData) return;
    handleWordClick(selectedWordData.word, selectedWordData.contextSentence, selectedWordKey || undefined);
  }, [nativeLang]);

  const hydrateGutenbergBook = async (book: ContentItem) => {
    setIsFetchingGutenberg(true);
    setGutenbergError(null);
    try {
      const fullChunks = await contentService.fetchGutenbergBookContent(
        book.id,
        book.language,
        book.title
      );
      const totalWords = fullChunks.join(' ').split(/\s+/).filter(Boolean).length;
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
      setChunkIndex(0);
      setDisplayText(fullChunks[0] || '');
    } catch (e: any) {
      console.warn('Failed to hydrate Gutenberg book', e);
      setGutenbergError(e.message || 'Could not reach Project Gutenberg mirror right now.');
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
    if (onUpdateBook) {
      onUpdateBook(updatedBook);
    }
  };

  const handleLevelChange = async (level: CEFRLevel) => {
    if (!currentBook || level === currentLevel || isAdapting) return;
    stopSpeech();
    setSelectedWordData(null);
    setSelectedWordKey(null);
    setCurrentLevel(level);
    await loadChunkContent(currentBook, chunkIndex, level);
  };

  const handlePrevChunk = () => {
    if (!currentBook || chunkIndex <= 0) return;
    stopSpeech();
    setSelectedWordData(null);
    setSelectedWordKey(null);
    const newIdx = chunkIndex - 1;
    setChunkIndex(newIdx);
    loadChunkContent(currentBook, newIdx, currentLevel);
    persistSectionProgress(currentBook, newIdx);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextChunk = () => {
    if (!currentBook || chunkIndex >= currentBook.chunks.length - 1) return;
    stopSpeech();
    setSelectedWordData(null);
    setSelectedWordKey(null);
    const sectionKey = `${currentBook.id}__${chunkIndex}`;
    const newIdx = chunkIndex + 1;
    setChunkIndex(newIdx);
    loadChunkContent(currentBook, newIdx, currentLevel);
    persistSectionProgress(currentBook, newIdx);

    if (!completedSectionKeys[sectionKey]) {
      const chunkWords = (displayText || '').split(/\s+/).filter(Boolean).length;
      onRecordWords(chunkWords, {
        bookId: currentBook.id,
        bookTitle: currentBook.title,
        language: currentBook.language,
      });
      setCompletedSectionKeys((prev) => ({ ...prev, [sectionKey]: true }));
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCompleteFinalSection = () => {
    if (!currentBook) return;
    const sectionKey = `${currentBook.id}__${chunkIndex}`;
    if (!completedSectionKeys[sectionKey]) {
      const chunkWords = (displayText || '').split(/\s+/).filter(Boolean).length;
      onRecordWords(chunkWords, {
        bookId: currentBook.id,
        bookTitle: currentBook.title,
        language: currentBook.language,
      });
      setCompletedSectionKeys((prev) => ({ ...prev, [sectionKey]: true }));
      setIsQuizOpen(true);
    } else {
      onOpenLibrary();
    }
  };

  const handleSelectFontSize = (nextSize: 'sm' | 'md' | 'lg') => {
    setFontSize(nextSize);
    const profile = storageService.getUserProfile();
    storageService.saveUserProfile({ ...profile, readerFontSize: nextSize });
    if (onChangeFontSize) {
      onChangeFontSize(nextSize);
    }
  };

  const handleWordClick = async (
    word: string,
    surroundingSentence: string,
    wordKey?: string,
    openShareCard: boolean = false
  ) => {
    setAutoOpenShareCard(openShareCard);
    const clean = geminiClient.normalizeWord(word);
    if (!clean || clean.length <= 1) return;

    if (wordKey) {
      setSelectedWordKey(wordKey);
    }

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
        },
        activeLangInfo.code
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

  const handleDeepAiEnrich = async () => {
    if (!selectedWordData) return;
    setSelectedWordData({ ...selectedWordData, isEnriching: true });
    try {
      const enriched = await geminiClient.enrichWithDeepAi(
        selectedWordData.word,
        selectedWordData.contextSentence,
        activeLangInfo.name,
        nativeLang
      );
      setSelectedWordData({ ...enriched, isEnriching: false });
    } catch {
      setSelectedWordData({ ...selectedWordData, isEnriching: false });
    }
  };

  const handleOpenShareXCard = () => {
    if (!currentBook) return;

    // Pick meaningful focal word from preflightVocab or first >= 5-letter word in first sentence
    let candidateWord = currentBook.preflightVocab?.[0]?.word || '';
    let candidateSentence = '';

    if (!candidateWord && tokenizedParagraphs.length > 0) {
      for (const p of tokenizedParagraphs) {
        for (const s of p.sentences) {
          const match = s.tokens.find((t) => t.isWord && t.token.length >= 5);
          if (match) {
            candidateWord = match.token;
            candidateSentence = s.sentence;
            break;
          }
        }
        if (candidateWord) break;
      }
    }

    if (!candidateSentence && tokenizedParagraphs[0]?.sentences[0]) {
      candidateSentence = tokenizedParagraphs[0].sentences[0].sentence;
      if (!candidateWord) {
        candidateWord = tokenizedParagraphs[0].sentences[0].tokens.find((t) => t.isWord)?.token || 'lingua';
      }
    }

    if (candidateWord) {
      handleWordClick(candidateWord, candidateSentence || displayText.slice(0, 120), undefined, true);
    }
  };

  const toggleSpeechPlayback = () => {
    if (!('speechSynthesis' in window)) return;

    if (isPlayingAudio) {
      stopSpeech();
      return;
    }

    window.speechSynthesis.cancel();
    speechCancelledRef.current = false;

    const sentences = displayText
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)
      .flatMap((p) => splitParagraphIntoSentences(p));
    if (sentences.length === 0) return;

    setIsPlayingAudio(true);

    const speakNext = (idx: number) => {
      if (speechCancelledRef.current || idx >= sentences.length) {
        setIsPlayingAudio(false);
        setSpeakingSentenceIdx(null);
        return;
      }

      setSpeakingSentenceIdx(idx);
      const utterance = new SpeechSynthesisUtterance(sentences[idx]);
      utterance.lang = activeLangInfo.speechLocale;
      utterance.rate = speechRateRef.current;
      utterance.onend = () => speakNext(idx + 1);
      utterance.onerror = () => {
        setIsPlayingAudio(false);
        setSpeakingSentenceIdx(null);
      };
      window.speechSynthesis.speak(utterance);
    };

    speakNext(0);
  };

  const handleToggleSpeechRate = () => {
    const nextRate: 0.85 | 1.0 = speechRate === 0.85 ? 1.0 : 0.85;
    setSpeechRate(nextRate);
    speechRateRef.current = nextRate;
    if (isPlayingAudio) {
      stopSpeech();
    }
  };

  const findContextForTerm = (word: string): string => {
    const clean = word.toLowerCase();
    const sents = splitParagraphIntoSentences(displayText || currentBook?.chunks?.[0] || '');
    return sents.find((s) => s.toLowerCase().includes(clean)) || sents[0] || word;
  };

  const handleSavePreflightWord = async (term: PreFlightWord, award = true) => {
    const key = term.word.toLowerCase();
    if (savedWordsMap[key]) return false;
    const contextSentence = findContextForTerm(term.word);
    await storageService.saveFlashcard({
      id: `card-${Date.now()}-${key}`,
      word: term.word,
      contextSentence,
      translation: term.translation,
      lemma: term.lemma || key,
      partOfSpeech: term.partOfSpeech || 'Vocabulary',
      morphology: term.cefrHint ? `Daily Press (${term.cefrHint})` : 'Daily Press',
      sentenceTranslation: currentBook?.summary || contextSentence,
      usageNote: `Pre-flight key journalistic term from "${currentBook?.title || 'Daily Edition'}".`,
      language: targetLang,
      genre: currentBook?.genre || 'essays',
      bookTitle: currentBook?.title,
      createdAt: Date.now(),
      nextReviewAt: Date.now() + 1000 * 60 * 60 * 24,
      reviewCount: 0,
      easeFactor: 2.5,
      masteryLevel: 0,
    });
    setSavedWordsMap((prev) => ({ ...prev, [key]: true }));
    if (award) onAwardXP(5);
    return true;
  };

  const handleSaveAllPreflight = async () => {
    if (!currentBook?.preflightVocab?.length) return;
    let newlySaved = 0;
    for (const term of currentBook.preflightVocab) {
      const saved = await handleSavePreflightWord(term, false);
      if (saved) newlySaved += 1;
    }
    if (newlySaved > 0) {
      onAwardXP(25);
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
    onAwardXP(10);
  };

  const tokenizedParagraphs = useMemo(() => {
    if (!displayText) return [];
    let globalSentenceCounter = 0;

    return displayText
      .split(/\n\s*\n/)
      .map((para) => para.trim())
      .filter(Boolean)
      .map((trimmed) => {
        const sentences = splitParagraphIntoSentences(trimmed);
        return {
          rawParagraph: trimmed,
          rawSentences: sentences,
          sentences: sentences.map((sentence) => {
            const globalSentenceIdx = globalSentenceCounter++;
            const tokens = sentence.split(/(\s+|[«"'(]+|[»"')!?,.:;]+)/);
            return {
              sentence,
              globalSentenceIdx,
              tokens: tokens.map((token) => {
                const isWord = /[\p{L}]/u.test(token);
                const cleanToken = isWord ? geminiClient.normalizeWord(token) : '';
                return {
                  token,
                  isWord,
                  cleanToken,
                  normalizedToken: cleanToken.toLowerCase(),
                };
              }),
            };
          }),
        };
      });
  }, [displayText]);

  if (!currentBook) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-24 text-center">
        <BookOpen className="w-10 h-10 mx-auto text-stone-400 dark:text-stone-600 mb-4 stroke-[1.25]" />
        <h2 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2">
          Select a Reading from Your Library
        </h2>
        <p className="text-stone-500 dark:text-stone-400 text-sm max-w-md mx-auto mb-6 font-serif">
          Choose a philosophical text, classic fiction, or daily press edition to begin your reading session.
        </p>
        <button
          onClick={onOpenLibrary}
          className="px-5 py-2 border border-stone-900 dark:border-stone-100 text-stone-900 dark:text-stone-100 hover:bg-stone-900 hover:text-[#FAF8F4] dark:hover:bg-stone-100 dark:hover:text-stone-900 text-xs font-medium tracking-wide uppercase transition-colors cursor-pointer"
        >
          Explore Library
        </button>
      </div>
    );
  }

  const genreInfo = GENRES.find((g) => g.id === currentBook.genre);
  const totalChunks = currentBook.chunks.length;
  const progressPercent = Math.round(((chunkIndex + 1) / totalChunks) * 100);

  const fontSizeClass =
    fontSize === 'sm'
      ? 'text-base lg:text-[1.05rem] leading-[1.85]'
      : fontSize === 'lg'
      ? 'text-xl lg:text-[1.35rem] leading-[1.95]'
      : 'text-lg lg:text-[1.18rem] leading-[1.88]';

  // Render memoized paragraphs and tokenized word spans + optional Bilingual Parallel line
  const renderInteractiveText = () => {
    return tokenizedParagraphs.map((paraObj, pIdx) => {
      const parallelSentenceFallback = isBilingualMode
        ? paraObj.rawSentences
            .map((s) => geminiClient.getCachedSentenceTranslation(s.trim(), nativeLang))
            .filter(Boolean)
            .join(' ')
        : '';
      const resolvedParallelText = isBilingualMode
        ? parallelTranslations[paraObj.rawParagraph] || parallelSentenceFallback
        : '';

      return (
        <div key={`p-wrap-${pIdx}`} className="mb-7">
          <p
            className={`font-reader ${fontSizeClass} text-[#18181B] dark:text-[#EAE6DE] text-justify tracking-normal ${
              pIdx === 0
                ? 'first-letter:text-5xl first-letter:font-display first-letter:font-bold first-letter:float-left first-letter:mr-3.5 first-letter:mt-1 first-letter:text-amber-800 dark:first-letter:text-amber-400'
                : ''
            }`}
          >
            {paraObj.sentences.map(({ sentence, globalSentenceIdx, tokens }, sIdx) => {
              const isCurrentlySpoken = isPlayingAudio && speakingSentenceIdx === globalSentenceIdx;
              return (
                <span
                  key={`s-${pIdx}-${sIdx}`}
                  className={`inline transition-colors ${
                    isCurrentlySpoken ? 'bg-amber-100/60 dark:bg-amber-900/25' : ''
                  }`}
                >
                  {tokens.map(({ token, isWord, normalizedToken }, tIdx) => {
                    if (!isWord) {
                      return <span key={`t-${tIdx}`}>{token}</span>;
                    }

                    const wordKey = `${pIdx}-${sIdx}-${tIdx}`;
                    const isSelected = Boolean(selectedWordData && selectedWordKey === wordKey);
                    const isSaved = savedWordsMap[normalizedToken];

                    return (
                      <span
                        key={`t-${tIdx}`}
                        role="button"
                        data-word-clickable="true"
                        onClick={() => handleWordClick(token, sentence, wordKey)}
                        className={`cursor-pointer select-text transition-colors ${
                          isSelected
                            ? 'bg-amber-200/70 dark:bg-amber-500/30 text-stone-950 dark:text-amber-100 border-b border-amber-800 dark:border-amber-400 font-medium'
                            : isSaved
                            ? 'border-b border-amber-800/45 dark:border-amber-400/45 text-amber-900 dark:text-amber-200 hover:border-amber-800'
                            : 'hover:underline hover:decoration-stone-400/80 hover:underline-offset-4'
                        }`}
                      >
                        {token}
                      </span>
                    );
                  })}
                  {sIdx < paraObj.sentences.length - 1 ? ' ' : ''}
                </span>
              );
            })}
          </p>

          {isBilingualMode && (
            <div className="mt-2.5 pl-4 border-l border-stone-300 dark:border-stone-700 text-xs sm:text-sm font-serif italic text-stone-500 dark:text-stone-400 leading-relaxed">
              {resolvedParallelText || `Translating paragraph into ${nativeLang}...`}
            </div>
          )}
        </div>
      );
    });
  };

  const gutenbergNumericId = contentService.getGutenbergNumericId(currentBook.id);

  return (
    <div className="min-h-screen pb-28">
      {/* Quiet 4-Item Sticky Reading Bar (2A) */}
      <div
        className={`sticky ${
          isFocusMode ? 'top-0' : 'top-[89px] lg:top-[57px]'
        } z-30 w-full border-b border-stone-200 dark:border-stone-800 bg-[#FAF8F4]/95 dark:bg-[#141312]/95 backdrop-blur-sm`}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-11 flex items-center justify-between gap-4">
          {/* Item 1: Left Back to Library · Title */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={onOpenLibrary}
              className="inline-flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer shrink-0"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Library</span>
            </button>
            <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
            <span className="text-xs font-serif italic text-stone-700 dark:text-stone-300 truncate max-w-[140px] sm:max-w-xs">
              {currentBook.title}
            </span>
          </div>

          {/* Items 2–4: Compact Level Select + Listen/Speed + Tools Popover */}
          <div className="flex items-center gap-4 sm:gap-5 shrink-0 text-xs">
            {/* Item 2: Compact Level Select */}
            <label className="inline-flex items-center gap-1 text-stone-500 dark:text-stone-400">
              <span className="hidden sm:inline">Level:</span>
              <select
                value={currentLevel}
                disabled={isAdapting}
                onChange={(e) => handleLevelChange(e.target.value as CEFRLevel)}
                aria-label="CEFR Reading Level"
                className="bg-transparent font-medium text-stone-900 dark:text-stone-100 focus:outline-none cursor-pointer disabled:opacity-50"
              >
                {CEFR_LEVELS.map((lvl) => (
                  <option
                    key={lvl.level}
                    value={lvl.level}
                    className="bg-[#FAF8F4] dark:bg-[#181615] text-stone-900 dark:text-stone-100"
                  >
                    {lvl.level}
                  </option>
                ))}
              </select>
            </label>

            {/* Item 3: Listen + Slow Radio Cadence */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleSpeechPlayback}
                title={isPlayingAudio ? 'Stop reading aloud' : `Listen aloud (${speechRate}x)`}
                className={`inline-flex items-center gap-1 transition-colors cursor-pointer ${
                  isPlayingAudio
                    ? 'text-amber-800 dark:text-amber-400 font-medium'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                {isPlayingAudio ? (
                  <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">{isPlayingAudio ? 'Stop' : 'Listen'}</span>
              </button>
              <button
                onClick={handleToggleSpeechRate}
                title="Toggle Slow Radio (0.85x learner cadence vs 1.0x native speed)"
                className="font-mono text-[11px] text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer"
              >
                {speechRate === 0.85 ? '0.85×' : '1.0×'}
              </button>
            </div>

            {/* Item 4: Quiet Tools Popover */}
            <div className="relative" ref={toolsRef}>
              <button
                type="button"
                data-testid="reader-tools-toggle"
                onClick={() => setIsToolsOpen((prev) => !prev)}
                className={`inline-flex items-center gap-1 transition-colors cursor-pointer ${
                  isToolsOpen
                    ? 'text-amber-800 dark:text-amber-400 font-medium'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                <span>Tools</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {isToolsOpen && (
                <div className="absolute right-0 mt-2.5 w-60 bg-[#FAF8F4] dark:bg-[#181615] border border-stone-200 dark:border-stone-800 rounded-lg p-3.5 space-y-3 z-40">
                  {/* Parallel Translation */}
                  <button
                    type="button"
                    onClick={() => setIsBilingualMode(!isBilingualMode)}
                    className="w-full flex items-center justify-between text-xs text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Languages className="w-3.5 h-3.5 text-stone-400" />
                      <span>Parallel Translation</span>
                    </span>
                    <span
                      className={`font-mono text-[11px] ${
                        isBilingualMode ? 'text-amber-800 dark:text-amber-400 font-semibold' : 'text-stone-400'
                      }`}
                    >
                      {isBilingualMode ? 'On' : 'Off'}
                    </span>
                  </button>

                  {/* Type Size (S / M / L) */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-stone-200 dark:border-stone-800 text-xs">
                    <span className="text-stone-600 dark:text-stone-400">Type Size</span>
                    <div className="flex items-center gap-2 font-serif">
                      {(['sm', 'md', 'lg'] as const).map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => handleSelectFontSize(sz)}
                          className={`px-1 text-xs cursor-pointer transition-colors ${
                            fontSize === sz
                              ? 'text-amber-800 dark:text-amber-400 font-bold border-b border-amber-800 dark:border-amber-400'
                              : 'text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                          }`}
                        >
                          {sz === 'sm' ? 'S' : sz === 'md' ? 'M' : 'L'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Zen Focus Mode */}
                  {onToggleFocusMode && (
                    <button
                      type="button"
                      onClick={() => {
                        onToggleFocusMode();
                        setIsToolsOpen(false);
                      }}
                      className="w-full flex items-center justify-between pt-2.5 border-t border-stone-200 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer"
                    >
                      <span className="inline-flex items-center gap-2">
                        {isFocusMode ? (
                          <Minimize2 className="w-3.5 h-3.5 text-stone-400" />
                        ) : (
                          <Maximize2 className="w-3.5 h-3.5 text-stone-400" />
                        )}
                        <span>{isFocusMode ? 'Exit Zen Focus' : 'Zen Focus Mode'}</span>
                      </span>
                    </button>
                  )}

                  {/* Share X Card */}
                  <button
                    type="button"
                    data-testid="reader-header-share-x"
                    onClick={() => {
                      setIsToolsOpen(false);
                      handleOpenShareXCard();
                    }}
                    className="w-full flex items-center justify-between pt-2.5 border-t border-stone-200 dark:border-stone-800 text-xs font-medium text-amber-800 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share X Card</span>
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 0.5px Reading Progress Hairline */}
        <div className="w-full h-[1px] bg-stone-200 dark:bg-stone-800">
          <div
            className="h-full bg-amber-800 dark:bg-amber-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Reading Canvas (Optimal 68ch Measure) */}
      <main ref={containerRef} className={`max-w-2xl mx-auto px-6 ${isFocusMode ? 'pt-10' : 'pt-12'}`}>
        {/* Pure Serif Editorial Heading Lockup */}
        <header className="mb-9 text-center border-b border-stone-200 dark:border-stone-800 pb-8">
          {!isFocusMode && (
            <div className="flex items-center justify-center gap-2 text-[11px] font-medium uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-3">
              <span>{genreInfo?.label || 'Literature'}</span>
              <span aria-hidden="true">·</span>
              <span>{activeLangInfo.name}</span>
              <span aria-hidden="true">·</span>
              <span>{currentLevel}</span>
            </div>
          )}

          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-100 mb-2">
            {currentBook.title}
          </h1>

          <p className="font-serif italic text-base text-stone-500 dark:text-stone-400">
            by {currentBook.author}
          </p>

          <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-2.5 text-xs font-mono text-stone-400 dark:text-stone-500">
            <span>Section {chunkIndex + 1} of {totalChunks}</span>
            <span>·</span>
            <span>~{currentBook.estimatedReadTimeMinutes} min read</span>
            {currentBook.license && (
              <>
                <span>·</span>
                <span>{currentBook.license}</span>
              </>
            )}
            {currentBook.sourceUrl && /^https?:\/\//i.test(currentBook.sourceUrl) && (
              <>
                <span>·</span>
                <a
                  href={currentBook.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-sans text-xs text-amber-800 dark:text-amber-400 hover:underline"
                >
                  Dispatch
                  <ExternalLink className="w-3 h-3" />
                </a>
              </>
            )}
            {!isFetchingGutenberg && gutenbergNumericId && totalChunks <= 3 && (
              <>
                <span>·</span>
                <button
                  onClick={() => hydrateGutenbergBook(currentBook)}
                  className="inline-flex items-center gap-1 font-sans text-xs text-amber-800 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  Load Full Gutenberg
                </button>
              </>
            )}
          </div>
        </header>

        {/* Sleek 1-Line Pre-Flight Vocabulary Disclosure Bar (Collapsed by Default) */}
        {!isFocusMode && currentBook.preflightVocab && currentBook.preflightVocab.length > 0 && (
          <section className="mb-9 border-y border-stone-200 dark:border-stone-800 py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowPreflight((prev) => !prev)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer transition-colors"
              >
                {showPreflight ? (
                  <ChevronUp className="w-3.5 h-3.5 text-amber-800 dark:text-amber-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-amber-800 dark:text-amber-400" />
                )}
                <span>Pre-Flight Vocabulary ({currentBook.preflightVocab.length} Key Terms)</span>
              </button>

              {currentBook.preflightVocab.some((t) => !savedWordsMap[t.word.toLowerCase()]) && (
                <button
                  onClick={handleSaveAllPreflight}
                  className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 dark:text-amber-400 hover:underline transition-colors cursor-pointer"
                >
                  <Bookmark className="w-3 h-3" />
                  Save All
                </button>
              )}
            </div>

            {showPreflight && (
              <div className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-800 divide-y divide-stone-200/70 dark:divide-stone-800/70">
                {currentBook.preflightVocab.map((term) => {
                  const isTermSaved = Boolean(savedWordsMap[term.word.toLowerCase()]);
                  return (
                    <div
                      key={term.word}
                      className="py-2 flex items-baseline justify-between gap-4 text-xs"
                    >
                      <div className="min-w-0 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="font-serif font-semibold text-sm text-stone-900 dark:text-stone-100">
                          {term.word}
                        </span>
                        <span className="text-[11px] text-stone-400 font-mono">
                          {term.partOfSpeech} · {term.lemma}
                          {term.cefrHint ? ` · ${term.cefrHint}` : ''}
                        </span>
                        <span className="text-stone-600 dark:text-stone-300">
                          — {term.translation}
                        </span>
                      </div>

                      <button
                        onClick={() => handleSavePreflightWord(term, true)}
                        disabled={isTermSaved}
                        className={`shrink-0 text-[11px] font-medium inline-flex items-center gap-1 transition-colors ${
                          isTermSaved
                            ? 'text-stone-400 dark:text-stone-500'
                            : 'text-amber-800 dark:text-amber-400 hover:underline cursor-pointer'
                        }`}
                      >
                        {isTermSaved ? (
                          <>
                            <Check className="w-3 h-3" />
                            Saved
                          </>
                        ) : (
                          '+ Save'
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Gutenberg Hydration Banner */}
        {isFetchingGutenberg && (
          <div className="mb-8 py-3 border-y border-stone-200 dark:border-stone-800 flex items-center justify-center gap-2.5 text-stone-600 dark:text-stone-300 text-xs">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-800 dark:text-amber-400" />
            <span className="font-serif italic">
              Retrieving full manuscript from Project Gutenberg archive...
            </span>
          </div>
        )}

        {gutenbergError && (
          <div className="mb-6 py-2.5 border-y border-stone-200 dark:border-stone-800 text-xs text-stone-500 dark:text-stone-400 text-center">
            Could not fetch full edition ({gutenbergError}). Showing curated excerpt instead.
          </div>
        )}

        {/* Adapting Spinner Banner */}
        {isAdapting && (
          <div className="mb-8 py-3 border-y border-stone-200 dark:border-stone-800 flex items-center justify-center gap-2.5 text-stone-600 dark:text-stone-300 text-xs">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-800 dark:text-amber-400" />
            <span className="font-serif italic">
              Adapting passage to CEFR {currentLevel}...
            </span>
          </div>
        )}

        {/* Subtle First-Visit Instruction */}
        {chunkIndex === 0 && !selectedWordData && !isFocusMode && (
          <p className="mb-6 text-center text-[11px] font-serif italic text-stone-400 dark:text-stone-500">
            Click any word for contextual translation & morphology
          </p>
        )}

        <article className="relative">
          {renderInteractiveText()}
        </article>

        {/* Bottom Hairline Pagination & Quiet Quiz Action */}
        <footer className="mt-14 pt-6 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handlePrevChunk}
            disabled={chunkIndex <= 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:border-stone-400 disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Previous
          </button>

          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-stone-400 dark:text-stone-500 hidden sm:inline">
              {chunkIndex + 1} / {totalChunks} ({progressPercent}%)
            </span>

            <button
              onClick={() => setIsQuizOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-stone-200 dark:border-stone-800 text-amber-800 dark:text-amber-400 hover:border-amber-800/50 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Section Quiz
            </button>
          </div>

          {chunkIndex >= totalChunks - 1 ? (
            <button
              onClick={handleCompleteFinalSection}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium border border-amber-800 dark:border-amber-500 text-amber-900 dark:text-amber-300 hover:bg-amber-800 hover:text-white dark:hover:bg-amber-500 dark:hover:text-stone-950 transition-colors cursor-pointer"
            >
              Complete Section ✓
            </button>
          ) : (
            <button
              onClick={handleNextChunk}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-stone-900 dark:bg-stone-100 text-[#FAF8F4] dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-white transition-colors cursor-pointer"
            >
              Next Section
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </footer>
      </main>

      {/* Context-Aware Word & Grammar Breakdown Popover */}
      <WordBreakdownPopover
        breakdown={selectedWordData}
        isLoading={isLoadingBreakdown}
        onClose={() => {
          setSelectedWordData(null);
          setSelectedWordKey(null);
          setAutoOpenShareCard(false);
        }}
        onSaveToDeck={handleSaveToDeck}
        isAlreadySaved={selectedWordData ? savedWordsMap[selectedWordData.word.toLowerCase()] : false}
        speechLocale={activeLangInfo.speechLocale}
        nativeLang={nativeLang}
        onChangeNativeLang={onChangeNativeLang}
        onRequestDeepAi={handleDeepAiEnrich}
        bookId={currentBook.id}
        bookTitle={currentBook.title}
        bookAuthor={currentBook.author}
        languageCode={targetLang}
        languageName={activeLangInfo.name}
        cefrLevel={currentLevel}
        autoOpenShareCard={autoOpenShareCard}
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
