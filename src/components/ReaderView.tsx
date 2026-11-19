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
  List,
} from 'lucide-react';
import { CEFRLevel, ContentItem, LanguageCode, PreFlightWord, WordBreakdown } from '../types/index.ts';
import { CEFR_LEVELS, SUPPORTED_LANGUAGES, GENRES } from '../data/constants.ts';
import { storageService } from '../services/storageService.ts';
import { contentService } from '../services/contentService.ts';
import { geminiClient, splitParagraphIntoSentences } from '../services/geminiClient.ts';
import { WordBreakdownPopover } from './WordBreakdownPopover.tsx';
import { SectionQuizModal } from './SectionQuizModal.tsx';
import { extractChapterTitle, getEditionMeta } from '../utils/editionMeta.ts';

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
  wordsReadToday?: number;
  dailyWordGoal?: number;
  onOpenWordbook?: () => void;
}

interface TokenizedParagraph {
  rawParagraph: string;
  rawSentences: string[];
  sentences: {
    sentence: string;
    globalSentenceIdx: number;
    tokens: {
      token: string;
      isWord: boolean;
      cleanToken: string;
      normalizedToken: string;
    }[];
  }[];
}

function tokenizeTextBlock(
  text: string,
  startingSentenceIdx: number = 0
): { paragraphs: TokenizedParagraph[]; nextSentenceIdx: number } {
  if (!text) return { paragraphs: [], nextSentenceIdx: startingSentenceIdx };
  let counter = startingSentenceIdx;

  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((trimmed) => {
      const sentences = splitParagraphIntoSentences(trimmed);
      return {
        rawParagraph: trimmed,
        rawSentences: sentences,
        sentences: sentences.map((sentence) => {
          const globalSentenceIdx = counter++;
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

  return { paragraphs, nextSentenceIdx: counter };
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
  wordsReadToday = 0,
  dailyWordGoal = 500,
  onOpenWordbook,
}) => {
  const [currentLevel, setCurrentLevel] = useState<CEFRLevel>('Original');
  const [chunkIndex, setChunkIndex] = useState(0);
  const [readingFlow, setReadingFlow] = useState<'continuous' | 'paged'>('paged');
  const [isAdapting, setIsAdapting] = useState(false);
  const [isFetchingGutenberg, setIsFetchingGutenberg] = useState(false);
  const [gutenbergError, setGutenbergError] = useState<string | null>(null);
  const [gutenbergSuccess, setGutenbergSuccess] = useState<string | null>(null);
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
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isChromeVisible, setIsChromeVisible] = useState(true);
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
  const tocRef = useRef<HTMLDivElement>(null);
  const activeLookupIdRef = useRef<number>(0);
  const lastScrollYRef = useRef<number>(0);
  const speechCancelledRef = useRef<boolean>(false);
  const speechRateRef = useRef<0.85 | 1.0>(0.85);
  const activeLangInfo = SUPPORTED_LANGUAGES.find((l) => l.code === targetLang) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    speechRateRef.current = speechRate;
  }, [speechRate]);

  // Outside click / Escape handlers for Tools & Chapters popovers
  useEffect(() => {
    if (!isToolsOpen && !isTocOpen) return;
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (isToolsOpen && toolsRef.current && !toolsRef.current.contains(target)) {
        setIsToolsOpen(false);
      }
      if (isTocOpen && tocRef.current && !tocRef.current.contains(target)) {
        setIsTocOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsToolsOpen(false);
        setIsTocOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isToolsOpen, isTocOpen]);

  // Auto-hiding Scroll-Fade Floating Apple Capsule Chrome (iA Writer style)
  useEffect(() => {
    if (isToolsOpen || isTocOpen || selectedWordData !== null) {
      setIsChromeVisible(true);
    }
  }, [isToolsOpen, isTocOpen, selectedWordData]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    lastScrollYRef.current = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastScrollYRef.current;

      if (isToolsOpen || isTocOpen || selectedWordData !== null || y <= 40) {
        setIsChromeVisible(true);
      } else if (y > 60 && delta > 6) {
        setIsChromeVisible(false);
      } else if (delta < -4) {
        setIsChromeVisible(true);
      }
      lastScrollYRef.current = y;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (e.clientY < 80) {
        setIsChromeVisible(true);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [isToolsOpen, isTocOpen, selectedWordData]);

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
    setGutenbergSuccess(null);
    setIsTocOpen(false);
    setIsToolsOpen(false);
    setIsChromeVisible(true);

    if (!currentBook) return;

    const totalParts = currentBook.chunks?.length || 1;
    const initialChunk = Math.min(currentBook.currentChunkIndex || 0, Math.max(0, totalParts - 1));
    const initialMeta = getEditionMeta(currentBook, initialChunk);

    setChunkIndex(initialChunk);
    setCurrentLevel('Original');
    setReadingFlow(
      !initialMeta.isFullNovel && totalParts > 1 && totalParts <= 4 ? 'continuous' : 'paged'
    );

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

  const isContinuousActive = Boolean(
    currentBook &&
      readingFlow === 'continuous' &&
      currentLevel === 'Original' &&
      currentBook.chunks.length > 1
  );

  const activePrefetchSource = useMemo(() => {
    if (!currentBook) return displayText;
    if (isContinuousActive) {
      return currentBook.chunks.join('\n\n');
    }
    return displayText;
  }, [currentBook, isContinuousActive, displayText]);

  // Proactively batch-prefetch sentence & paragraph translations
  useEffect(() => {
    if (!activePrefetchSource) return;
    let cancelled = false;

    const paragraphs = activePrefetchSource
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);

    geminiClient.prefetchSectionBatch(activePrefetchSource, activeLangInfo.name, nativeLang).then(() => {
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
  }, [activePrefetchSource, activeLangInfo.name, nativeLang, isBilingualMode]);

  // Re-translate the active open word immediately when user changes nativeLang
  useEffect(() => {
    if (!selectedWordData) return;
    handleWordClick(selectedWordData.word, selectedWordData.contextSentence, selectedWordKey || undefined);
  }, [nativeLang]);

  const hydrateGutenbergBook = async (book: ContentItem) => {
    setIsFetchingGutenberg(true);
    setGutenbergError(null);
    setGutenbergSuccess(null);
    try {
      const updated = await contentService.insertFullGutenbergNovel(book);
      if (onUpdateBook) {
        onUpdateBook(updated);
      } else {
        onSelectBook(updated);
      }
      setChunkIndex(0);
      setReadingFlow('paged');
      setDisplayText(updated.chunks[0] || '');
      setGutenbergSuccess(
        `Complete edition loaded (${updated.chunks.length} chapters · ${updated.wordCount.toLocaleString()} words)`
      );
      setTimeout(() => {
        setGutenbergSuccess((prev) =>
          prev && prev.includes(String(updated.chunks.length)) ? null : prev
        );
      }, 6500);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
    if (level !== 'Original') {
      setReadingFlow('paged');
    }
    await loadChunkContent(currentBook, chunkIndex, level);
  };

  const handleJumpToChapter = (targetIdx: number) => {
    if (!currentBook) return;
    setIsTocOpen(false);
    if (isContinuousActive) {
      setChunkIndex(targetIdx);
      persistSectionProgress(currentBook, targetIdx);
      const el = document.getElementById(`reader-part-${targetIdx}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }
    stopSpeech();
    setSelectedWordData(null);
    setSelectedWordKey(null);
    setChunkIndex(targetIdx);
    loadChunkContent(currentBook, targetIdx, currentLevel);
    persistSectionProgress(currentBook, targetIdx);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    const sectionKey = isContinuousActive
      ? `${currentBook.id}__continuous`
      : `${currentBook.id}__${chunkIndex}`;

    if (!completedSectionKeys[sectionKey]) {
      const wordsToCount = isContinuousActive
        ? currentBook.chunks.join(' ').split(/\s+/).filter(Boolean).length
        : (displayText || '').split(/\s+/).filter(Boolean).length;

      onRecordWords(wordsToCount, {
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

  const tokenizedParagraphs = useMemo(() => {
    return tokenizeTextBlock(displayText, 0).paragraphs;
  }, [displayText]);

  const continuousSections = useMemo(() => {
    if (!currentBook || !isContinuousActive) return [];
    const editionMeta = getEditionMeta(currentBook, 0);
    let sentenceCursor = 0;

    return currentBook.chunks.map((chunkText, cIdx) => {
      const result = tokenizeTextBlock(chunkText, sentenceCursor);
      sentenceCursor = result.nextSentenceIdx;
      return {
        chunkIndex: cIdx,
        chapterTitle: extractChapterTitle(chunkText, cIdx, editionMeta.isFullNovel),
        wordCount: chunkText.split(/\s+/).filter(Boolean).length,
        paragraphs: result.paragraphs,
      };
    });
  }, [currentBook, isContinuousActive]);

  const handleOpenShareXCard = () => {
    if (!currentBook) return;

    let candidateWord = currentBook.preflightVocab?.[0]?.word || '';
    let candidateSentence = '';
    const firstSectionParagraphs = isContinuousActive
      ? continuousSections[0]?.paragraphs || []
      : tokenizedParagraphs;

    if (!candidateWord && firstSectionParagraphs.length > 0) {
      for (const p of firstSectionParagraphs) {
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

    if (!candidateSentence && firstSectionParagraphs[0]?.sentences[0]) {
      candidateSentence = firstSectionParagraphs[0].sentences[0].sentence;
      if (!candidateWord) {
        candidateWord =
          firstSectionParagraphs[0].sentences[0].tokens.find((t) => t.isWord)?.token || 'lingua';
      }
    }

    if (candidateWord) {
      handleWordClick(
        candidateWord,
        candidateSentence || activePrefetchSource.slice(0, 120),
        undefined,
        true
      );
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

    const sourceToRead = activePrefetchSource || displayText;
    const sentences = sourceToRead
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
    const sents = splitParagraphIntoSentences(activePrefetchSource || currentBook?.chunks?.[0] || '');
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
          className="px-5 py-2 rounded-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold transition-colors cursor-pointer"
        >
          Explore Library
        </button>
      </div>
    );
  }

  const genreInfo = GENRES.find((g) => g.id === currentBook.genre);
  const totalChunks = currentBook.chunks.length;
  const editionMeta = getEditionMeta(currentBook, chunkIndex);
  const gutenbergNumericId = contentService.getGutenbergNumericId(currentBook.id);
  const canLoadCompleteNovel = Boolean(gutenbergNumericId && !editionMeta.isFullNovel);
  const progressPercent = isContinuousActive
    ? 100
    : Math.round(((chunkIndex + 1) / totalChunks) * 100);

  const fontSizeClass =
    fontSize === 'sm'
      ? 'text-base lg:text-[1.05rem] leading-[1.85]'
      : fontSize === 'lg'
      ? 'text-xl lg:text-[1.35rem] leading-[1.95]'
      : 'text-lg lg:text-[1.18rem] leading-[1.88]';

  const renderParagraphList = (paragraphs: TokenizedParagraph[], keyPrefix: string, showDropCap: boolean) => {
    return paragraphs.map((paraObj, pIdx) => {
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
        <div key={`${keyPrefix}-p-${pIdx}`} className="mb-7">
          <p
            className={`font-reader ${fontSizeClass} text-[#1D1D1F] dark:text-[#EAE6DE] text-justify tracking-normal ${
              showDropCap && pIdx === 0
                ? 'first-letter:text-5xl first-letter:font-display first-letter:font-bold first-letter:float-left first-letter:mr-3.5 first-letter:mt-1 first-letter:text-amber-800 dark:first-letter:text-amber-400'
                : ''
            }`}
          >
            {paraObj.sentences.map(({ sentence, globalSentenceIdx, tokens }, sIdx) => {
              const isCurrentlySpoken = isPlayingAudio && speakingSentenceIdx === globalSentenceIdx;
              return (
                <span
                  key={`${keyPrefix}-s-${pIdx}-${sIdx}`}
                  className={`inline transition-colors ${
                    isCurrentlySpoken ? 'bg-amber-100/60 dark:bg-amber-900/25 rounded' : ''
                  }`}
                >
                  {tokens.map(({ token, isWord, normalizedToken }, tIdx) => {
                    if (!isWord) {
                      return <span key={`t-${tIdx}`}>{token}</span>;
                    }

                    const wordKey = `${keyPrefix}-${pIdx}-${sIdx}-${tIdx}`;
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
                            ? 'bg-amber-200/75 dark:bg-amber-500/30 text-stone-950 dark:text-amber-100 border-b border-amber-800 dark:border-amber-400 font-medium rounded-xs'
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

  return (
    <div className="min-h-screen pb-28">
      {/* Auto-Hiding Floating Frosted Apple Capsule Toolbar */}
      <div
        className={`sticky ${
          isFocusMode ? 'top-3' : 'top-[94px] lg:top-[64px]'
        } z-30 px-4 pointer-events-none transition-all duration-300 ${
          isChromeVisible || isToolsOpen || isTocOpen || selectedWordData !== null
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-4'
        }`}
      >
        <div className="max-w-3xl mx-auto pointer-events-auto rounded-full apple-glass-card bg-white/85 dark:bg-[#16161A]/85 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.1] px-4 py-2 flex items-center justify-between gap-2">
          {/* Left: Back to Library · Title */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={onOpenLibrary}
              className="inline-flex items-center gap-1 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Library</span>
            </button>
            <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
            <span className="text-xs font-serif italic text-stone-800 dark:text-stone-200 truncate max-w-[110px] sm:max-w-[200px]">
              {currentBook.title}
            </span>
          </div>

          {/* Right Controls: Chapters TOC + Level + Listen + Tools */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0 text-xs">
            {/* Chapters TOC Popover (Multi-part or Multi-chapter works) */}
            {totalChunks > 1 && (
              <div className="relative" ref={tocRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsTocOpen((prev) => !prev);
                    setIsToolsOpen(false);
                  }}
                  className={`inline-flex items-center gap-1 font-medium transition-colors cursor-pointer ${
                    isTocOpen
                      ? 'text-amber-800 dark:text-amber-400'
                      : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">
                    {editionMeta.isFullNovel ? 'Chapters' : 'Parts'}
                  </span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {isTocOpen && (
                  <div className="absolute right-0 mt-3 w-72 max-h-80 overflow-y-auto bg-white/95 dark:bg-[#16161A]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.1] apple-glass-card rounded-2xl p-2 z-40">
                    <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-stone-400 border-b border-stone-200/70 dark:border-stone-800 mb-1">
                      {editionMeta.isFullNovel
                        ? `Table of Contents (${totalChunks} Chapters)`
                        : `Edition Sections (${totalChunks} Parts)`}
                    </div>
                    {currentBook.chunks.map((chunk, idx) => {
                      const title = editionMeta.chapterTitles[idx];
                      const words = chunk.split(/\s+/).filter(Boolean).length;
                      const isCurrent = idx === chunkIndex;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleJumpToChapter(idx)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                            isCurrent
                              ? 'bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 font-semibold'
                              : 'text-stone-700 dark:text-stone-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                          }`}
                        >
                          <span className="truncate">{title}</span>
                          <span className="text-[10px] font-mono text-stone-400 shrink-0">
                            {words}w
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* CEFR Level Selector */}
            <label className="inline-flex items-center gap-1 text-stone-500 dark:text-stone-400">
              <span className="hidden md:inline">Level:</span>
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
                    className="bg-white dark:bg-[#16161A] text-stone-900 dark:text-stone-100"
                  >
                    {lvl.level}
                  </option>
                ))}
              </select>
            </label>

            {/* Listen + Slow Radio Speed */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleSpeechPlayback}
                title={isPlayingAudio ? 'Stop reading aloud' : `Listen aloud (${speechRate}x)`}
                className={`inline-flex items-center gap-1 transition-colors cursor-pointer ${
                  isPlayingAudio
                    ? 'text-amber-800 dark:text-amber-400 font-medium'
                    : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
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
                className="font-mono text-[11px] text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                {speechRate === 0.85 ? '0.85×' : '1.0×'}
              </button>
            </div>

            {/* Tools Popover */}
            <div className="relative" ref={toolsRef}>
              <button
                type="button"
                data-testid="reader-tools-toggle"
                onClick={() => {
                  setIsToolsOpen((prev) => !prev);
                  setIsTocOpen(false);
                }}
                className={`inline-flex items-center gap-1 font-medium transition-colors cursor-pointer ${
                  isToolsOpen
                    ? 'text-amber-800 dark:text-amber-400'
                    : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <span>Tools</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {isToolsOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white/95 dark:bg-[#16161A]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.1] apple-glass-card rounded-2xl p-3.5 space-y-3 z-40">
                  {/* Reading Flow Toggle */}
                  {totalChunks > 1 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-600 dark:text-stone-400">Reading Flow</span>
                      <div className="inline-flex p-0.5 rounded-full bg-black/[0.05] dark:bg-white/[0.08] text-[10px] font-medium">
                        <button
                          type="button"
                          onClick={() => {
                            if (currentLevel !== 'Original') setCurrentLevel('Original');
                            setReadingFlow('continuous');
                          }}
                          className={`px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                            isContinuousActive
                              ? 'bg-white dark:bg-[#2C2C32] text-stone-900 dark:text-white shadow-xs'
                              : 'text-stone-500'
                          }`}
                        >
                          Continuous
                        </button>
                        <button
                          type="button"
                          onClick={() => setReadingFlow('paged')}
                          className={`px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                            !isContinuousActive
                              ? 'bg-white dark:bg-[#2C2C32] text-stone-900 dark:text-white shadow-xs'
                              : 'text-stone-500'
                          }`}
                        >
                          By Chapter
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Parallel Translation */}
                  <button
                    type="button"
                    onClick={() => setIsBilingualMode(!isBilingualMode)}
                    className={`w-full flex items-center justify-between ${
                      totalChunks > 1 ? 'pt-2.5 border-t border-stone-200/70 dark:border-stone-800' : ''
                    } text-xs text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white cursor-pointer`}
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
                  <div className="flex items-center justify-between pt-2.5 border-t border-stone-200/70 dark:border-stone-800 text-xs">
                    <span className="text-stone-600 dark:text-stone-400">Type Size</span>
                    <div className="flex items-center gap-2 font-serif">
                      {(['sm', 'md', 'lg'] as const).map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => handleSelectFontSize(sz)}
                          className={`px-1.5 py-0.5 rounded text-xs cursor-pointer transition-colors ${
                            fontSize === sz
                              ? 'text-amber-800 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40'
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
                      className="w-full flex items-center justify-between pt-2.5 border-t border-stone-200/70 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white cursor-pointer"
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
                    className="w-full flex items-center justify-between pt-2.5 border-t border-stone-200/70 dark:border-stone-800 text-xs font-medium text-amber-800 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share X Card</span>
                    </span>
                  </button>

                  {/* Optional Wordbook & Daily Progress */}
                  {onOpenWordbook && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsToolsOpen(false);
                        onOpenWordbook();
                      }}
                      className="w-full flex items-center justify-between pt-2.5 border-t border-stone-200/70 dark:border-stone-800 text-[11px] text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white cursor-pointer"
                    >
                      <span>Open Wordbook</span>
                      <span className="font-mono">
                        {wordsReadToday}/{dailyWordGoal}w today
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Reading Canvas (Optimal 68ch Measure) */}
      <main ref={containerRef} className={`max-w-2xl mx-auto px-6 ${isFocusMode ? 'pt-8' : 'pt-10'}`}>
        {/* Unambiguous Edition Scope & Source Header */}
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

          {/* Edition Scope + Source Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-3.5">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-black/[0.05] dark:bg-white/[0.08] text-[11px] font-semibold text-stone-800 dark:text-stone-200">
              {isContinuousActive
                ? `${editionMeta.isFullNovel ? 'Complete Novel' : 'Curated Excerpt'} · All ${totalChunks} Parts`
                : editionMeta.scopeBannerLabel}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full border border-amber-800/25 dark:border-amber-400/25 bg-amber-50/70 dark:bg-amber-950/30 text-[11px] font-medium text-amber-900 dark:text-amber-300">
              {editionMeta.sourceLabel}
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-100 mb-2">
            {currentBook.title}
          </h1>

          <p className="font-serif italic text-base text-stone-500 dark:text-stone-400">
            by {currentBook.author}
          </p>

          <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-2.5 text-xs font-mono text-stone-400 dark:text-stone-500">
            <span>{currentBook.wordCount.toLocaleString()} words</span>
            <span>·</span>
            <span>~{currentBook.estimatedReadTimeMinutes} min read</span>
            {currentBook.sourceUrl && /^https?:\/\//i.test(currentBook.sourceUrl) && (
              <>
                <span>·</span>
                <a
                  href={currentBook.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-sans text-xs text-amber-800 dark:text-amber-400 hover:underline"
                >
                  Original Dispatch
                  <ExternalLink className="w-3 h-3" />
                </a>
              </>
            )}
          </div>

          {/* Prominent 1-Click Complete Novel CTA for Excerpts */}
          {canLoadCompleteNovel && !isFetchingGutenberg && (
            <div className="mt-5">
              <button
                type="button"
                onClick={() => hydrateGutenbergBook(currentBook)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/70 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Load Complete Novel (Project Gutenberg)</span>
              </button>
            </div>
          )}
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
              Loading full multi-chapter manuscript from Project Gutenberg...
            </span>
          </div>
        )}

        {gutenbergError && (
          <div className="mb-6 py-2.5 border-y border-stone-200 dark:border-stone-800 text-xs text-stone-500 dark:text-stone-400 text-center">
            Could not fetch full edition ({gutenbergError}). Showing curated edition instead.
          </div>
        )}

        {gutenbergSuccess && (
          <div className="mb-6 py-2.5 px-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/60 text-xs font-medium text-emerald-800 dark:text-emerald-300 text-center">
            {gutenbergSuccess}
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

        {/* Prose Canvas: Seamless Continuous Multi-Part OR Paged Chapter */}
        <article className="relative">
          {isContinuousActive
            ? continuousSections.map((section, idx) => (
                <section
                  key={`part-${section.chunkIndex}`}
                  id={`reader-part-${section.chunkIndex}`}
                  className={idx > 0 ? 'mt-12 pt-8 border-t border-stone-200/70 dark:border-stone-800/70' : ''}
                >
                  <div className="mb-5 flex items-center justify-between text-[11px] font-mono uppercase tracking-widest text-stone-400 dark:text-stone-500">
                    <span>{section.chapterTitle}</span>
                    <span>
                      Part {section.chunkIndex + 1} of {totalChunks} · {section.wordCount}w
                    </span>
                  </div>
                  {renderParagraphList(section.paragraphs, `c${section.chunkIndex}`, idx === 0)}
                </section>
              ))
            : renderParagraphList(tokenizedParagraphs, `p${chunkIndex}`, true)}
        </article>

        {/* End-of-Excerpt Prompt to Expand Full Novel (Never Leave User Stranded) */}
        {canLoadCompleteNovel && (isContinuousActive || chunkIndex >= totalChunks - 1) && !isFetchingGutenberg && (
          <div className="mt-10 p-5 rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-white/80 dark:bg-[#16161A]/80 apple-glass-card text-center space-y-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-400 block">
              End of Curated {totalChunks}-Part Excerpt
            </span>
            <p className="text-xs font-serif text-stone-600 dark:text-stone-300 max-w-md mx-auto">
              Want to keep reading &ldquo;{currentBook.title}&rdquo;? Load the complete multi-chapter edition straight from Project Gutenberg.
            </p>
            <button
              type="button"
              onClick={() => hydrateGutenbergBook(currentBook)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Load Complete Novel (Gutenberg)</span>
            </button>
          </div>
        )}

        {/* Bottom Pagination & Section Quiz */}
        <footer className="mt-14 pt-6 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
          {!isContinuousActive ? (
            <button
              onClick={handlePrevChunk}
              disabled={chunkIndex <= 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-full border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:border-stone-400 disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </button>
          ) : (
            <button
              onClick={onOpenLibrary}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-full border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:border-stone-400 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Library
            </button>
          )}

          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-stone-400 dark:text-stone-500 hidden sm:inline">
              {isContinuousActive
                ? `${totalChunks} / ${totalChunks} parts (100%)`
                : `${chunkIndex + 1} / ${totalChunks} (${progressPercent}%)`}
            </span>

            <button
              onClick={() => setIsQuizOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-full border border-stone-200 dark:border-stone-800 text-amber-800 dark:text-amber-400 hover:border-amber-800/50 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Section Quiz
            </button>
          </div>

          {isContinuousActive || chunkIndex >= totalChunks - 1 ? (
            <button
              onClick={handleCompleteFinalSection}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-white transition-colors cursor-pointer"
            >
              Complete Reading ✓
            </button>
          ) : (
            <button
              onClick={handleNextChunk}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-white transition-colors cursor-pointer"
            >
              Next Chapter
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
        textChunk={activePrefetchSource || displayText}
        targetLangName={activeLangInfo.name}
        baseLangName={nativeLang}
        onAwardXP={(amount) => onAwardXP(amount)}
        sectionTitle={`${currentBook.title} - ${
          isContinuousActive ? `All ${totalChunks} Parts` : `Section ${chunkIndex + 1}`
        }`}
      />
    </div>
  );
};
