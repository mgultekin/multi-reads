import React, { useState, useEffect, useMemo } from 'react';
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  Trash2,
  RefreshCw,
  ExternalLink,
  Download,
  Sparkles,
  Search,
  BookOpen,
} from 'lucide-react';
import { ContentItem, DailyNewsEdition, GenreId, LanguageCode } from '../types/index.ts';
import { GENRES, SUPPORTED_LANGUAGES } from '../data/constants.ts';
import { storageService } from '../services/storageService.ts';
import { contentService } from '../services/contentService.ts';
import {
  GENRE_CEFR_HINTS,
  GENRE_COVER_MAP,
  estimateGenreKnownPct,
  getBookSourceLabel,
  getEditionMeta,
  getGenreSourcesLabel,
  isFullNovelItem,
} from '../utils/editionMeta.ts';

interface LibraryViewProps {
  targetLang: LanguageCode;
  onSelectBook: (book: ContentItem) => void;
  onOpenImporter: () => void;
  onOpenWordbook?: () => void;
  savedWordsCount?: number;
  dueWordsCount?: number;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  targetLang,
  onSelectBook,
  onOpenImporter,
  onOpenWordbook,
  savedWordsCount = 0,
  dueWordsCount = 0,
}) => {
  const [activeView, setActiveView] = useState<'genres' | 'novels' | 'news'>('genres');
  const [selectedGenreId, setSelectedGenreId] = useState<GenreId | null>(null);
  const [books, setBooks] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dailyEdition, setDailyEdition] = useState<DailyNewsEdition | null>(null);
  const [isLoadingDailyNews, setIsLoadingDailyNews] = useState(false);
  const [insertingNovelId, setInsertingNovelId] = useState<string | null>(null);
  const [insertNotice, setInsertNotice] = useState<{
    bookId: string;
    message: string;
    isError?: boolean;
  } | null>(null);

  const currentLangInfo = SUPPORTED_LANGUAGES.find((l) => l.code === targetLang) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    setSelectedGenreId(null);
    loadBooks();
    loadDailyNews();
  }, [targetLang]);

  const loadBooks = async (): Promise<ContentItem[]> => {
    setIsLoading(true);
    try {
      const stored = await storageService.getBooks();
      setBooks(stored);
      return stored;
    } catch (e) {
      console.warn('Error fetching books', e);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const loadDailyNews = async (forceRefresh = false) => {
    setIsLoadingDailyNews(true);
    try {
      const profile = storageService.getUserProfile();
      const baseLang = profile.nativeLanguage || 'English';
      const edition = await contentService.fetchDailyNewsEdition(targetLang, baseLang, forceRefresh);
      setDailyEdition(edition);
    } catch (err) {
      console.warn('Failed to load daily news edition:', err);
    } finally {
      setIsLoadingDailyNews(false);
    }
  };

  const handleSelectAndPersistBook = async (book: ContentItem) => {
    if (book.source === 'news') {
      try {
        await storageService.saveBook(book);
      } catch (e) {
        console.warn('Failed to cache news item in storage:', e);
      }
    }
    onSelectBook(book);
  };

  const handleDeleteBook = async (e: React.MouseEvent, bookId: string) => {
    e.stopPropagation();
    await storageService.deleteBook(bookId);
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
  };

  const handleInsertFullNovel = async (e: React.MouseEvent, book: ContentItem) => {
    e.stopPropagation();
    if (insertingNovelId) return;
    setInsertingNovelId(book.id);
    setInsertNotice(null);
    try {
      const updated = await contentService.insertFullGutenbergNovel(book);
      await loadBooks();
      setInsertNotice({
        bookId: updated.id,
        message: `Inserted complete ${updated.chunks.length}-chapter edition`,
      });
      setTimeout(() => {
        setInsertNotice((prev) => (prev?.bookId === updated.id ? null : prev));
      }, 4500);
    } catch (err: any) {
      console.warn('Failed to insert full Gutenberg novel:', err);
      setInsertNotice({
        bookId: book.id,
        message: err?.message || 'Could not insert full novel text.',
        isError: true,
      });
    } finally {
      setInsertingNovelId(null);
    }
  };

  const langBooks = useMemo(
    () => books.filter((b) => b.language === targetLang),
    [books, targetLang]
  );

  const continueReadingBook = useMemo(() => {
    return langBooks
      .filter((b) => (b.currentChunkIndex && b.currentChunkIndex > 0) || b.lastReadAt)
      .sort((a, b) => (b.lastReadAt || 0) - (a.lastReadAt || 0))[0];
  }, [langBooks]);

  const allStoriesFromEdition: ContentItem[] = useMemo(() => {
    if (!dailyEdition) return [];
    return [
      dailyEdition.leadStory,
      ...dailyEdition.culturalStories,
      ...dailyEdition.trendingStories,
      ...(dailyEdition.onThisDayStory ? [dailyEdition.onThisDayStory] : []),
    ].filter(Boolean);
  }, [dailyEdition]);

  const fullNovels = useMemo(
    () => langBooks.filter((b) => isFullNovelItem(b)),
    [langBooks]
  );

  const expandableExcerpts = useMemo(
    () =>
      langBooks.filter(
        (b) => !isFullNovelItem(b) && Boolean(contentService.getGutenbergNumericId(b.id))
      ),
    [langBooks]
  );

  const dailyPressArticles = useMemo(() => {
    const map = new Map<string, ContentItem>();
    for (const story of allStoriesFromEdition) {
      map.set(story.id, story);
    }
    for (const b of langBooks) {
      if (b.source === 'news') {
        map.set(b.id, b);
      }
    }
    return Array.from(map.values());
  }, [allStoriesFromEdition, langBooks]);

  const heroBook = continueReadingBook || dailyEdition?.leadStory || langBooks[0] || null;
  const heroIsContinue = Boolean(continueReadingBook);
  const heroMeta = heroBook ? getEditionMeta(heroBook, heroBook.currentChunkIndex || 0) : null;
  const heroProgressPct = heroBook
    ? Math.round((((heroBook.currentChunkIndex || 0) + 1) / Math.max(1, heroBook.chunks.length)) * 100)
    : 0;

  const selectedGenreInfo = selectedGenreId
    ? GENRES.find((g) => g.id === selectedGenreId) || null
    : null;

  const genreCollectionBooks = useMemo(() => {
    if (!selectedGenreId) return [];
    const map = new Map<string, ContentItem>();
    for (const b of langBooks) {
      if (b.genre === selectedGenreId) {
        map.set(b.id, b);
      }
    }
    for (const story of allStoriesFromEdition) {
      if (story.genre === selectedGenreId && !map.has(story.id)) {
        map.set(story.id, story);
      }
    }
    return Array.from(map.values());
  }, [selectedGenreId, langBooks, allStoriesFromEdition]);

  const renderEditorialRow = (book: ContentItem) => {
    const meta = getEditionMeta(book, book.currentChunkIndex || 0);
    const gutenbergId = contentService.getGutenbergNumericId(book.id);
    const canInsertFull = Boolean(gutenbergId && !meta.isFullNovel);
    const isInserting = insertingNovelId === book.id;
    const isDeletable =
      book.source === 'custom' || book.source === 'wikipedia' || book.id.startsWith('gutenberg-search-');
    const rowNotice = insertNotice?.bookId === book.id ? insertNotice : null;

    return (
      <div
        key={book.id}
        onClick={() => handleSelectAndPersistBook(book)}
        className="group py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.03] -mx-3 px-3 rounded-2xl transition-colors"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <h3 className="font-display text-base sm:text-lg font-bold tracking-tight text-stone-900 dark:text-stone-100 group-hover:text-amber-800 dark:group-hover:text-amber-400 transition-colors">
              {book.title}
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/[0.04] dark:bg-white/[0.07] text-stone-700 dark:text-stone-300">
              {meta.scopeShortBadge}
            </span>
          </div>

          <div className="mt-1 flex items-center gap-2 flex-wrap text-xs text-stone-500 dark:text-stone-400">
            <span className="font-serif italic">by {book.author}</span>
            <span aria-hidden="true">·</span>
            <span className="font-medium text-amber-800 dark:text-amber-400">{meta.sourceLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-[11px]">{book.wordCount.toLocaleString()} words</span>
            {rowNotice && (
              <>
                <span aria-hidden="true">·</span>
                <span
                  className={`text-[11px] font-medium ${
                    rowNotice.isError ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  {rowNotice.message}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {canInsertFull && (
            <button
              type="button"
              data-testid="insert-full-novel-btn"
              disabled={isInserting}
              onClick={(e) => handleInsertFullNovel(e, book)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/70 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 sm:opacity-85 sm:group-hover:opacity-100 transition-all cursor-pointer disabled:opacity-60"
            >
              {isInserting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Download className="w-3 h-3" />
              )}
              <span>{isInserting ? 'Inserting...' : 'Insert Full Novel'}</span>
            </button>
          )}

          {isDeletable && (
            <button
              type="button"
              onClick={(e) => handleDeleteBook(e, book.id)}
              title="Remove from library"
              className="p-1.5 rounded-full text-stone-400 hover:text-red-600 dark:hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <span className="inline-flex items-center gap-1 text-xs font-semibold text-stone-700 dark:text-stone-300 group-hover:text-amber-800 dark:group-hover:text-amber-400 transition-colors">
            <span>Read</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-[920px] mx-auto px-4 sm:px-6 py-5 pb-16">
      {/* 1. Single Unified Focal Hero Card (Resume Reading OR Today's Dispatch — Never Stacked) */}
      {!selectedGenreId && activeView === 'genres' && heroBook && heroMeta && (
        <section
          aria-label={heroIsContinue ? 'Continue Reading' : "Today's Dispatch"}
          className="relative overflow-hidden rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-white/90 dark:bg-[#16161A]/90 apple-glass-card p-5 sm:p-6 mb-6"
        >
          {/* Ambient Blurred Cover Glow */}
          <img
            src={GENRE_COVER_MAP[heroBook.genre] || GENRE_COVER_MAP.fiction}
            alt=""
            aria-hidden="true"
            className="pointer-events-none select-none absolute -right-12 -top-12 w-72 h-72 object-cover rounded-full opacity-20 dark:opacity-15 blur-3xl"
          />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 min-w-0 flex-1">
              {/* Square 1:1 Cover Thumbnail */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 border border-black/[0.08] dark:border-white/[0.1] bg-stone-200 dark:bg-stone-800">
                <img
                  src={GENRE_COVER_MAP[heroBook.genre] || GENRE_COVER_MAP.fiction}
                  alt={heroBook.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wider mb-1">
                  <span className="text-amber-800 dark:text-amber-400">
                    {heroIsContinue ? 'Continue Reading' : "Today's Dispatch"}
                  </span>
                  <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
                  <span className="text-stone-500 dark:text-stone-400">{heroMeta.scopeBannerLabel}</span>
                  <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>
                  <span className="text-stone-500 dark:text-stone-400">{heroMeta.sourceLabel}</span>
                </div>

                <h1
                  onClick={() => handleSelectAndPersistBook(heroBook)}
                  className="font-display text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 hover:text-amber-800 dark:hover:text-amber-400 transition-colors cursor-pointer leading-tight truncate"
                >
                  {heroBook.title}
                </h1>

                <div className="mt-1.5 flex flex-wrap items-center gap-2.5 text-xs text-stone-500 dark:text-stone-400">
                  <span className="font-serif italic">by {heroBook.author}</span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.08] text-[11px] font-medium text-stone-700 dark:text-stone-300">
                    {estimateGenreKnownPct(heroBook.genre, savedWordsCount)}% known · {savedWordsCount} saved
                  </span>
                  <span className="font-mono text-[11px]">~{heroMeta.remainingMinutes} min left</span>
                </div>

                {/* Subtle Progress Hairline */}
                {heroIsContinue && heroBook.chunks.length > 1 && (
                  <div className="mt-2.5 w-full max-w-xs h-1 rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden">
                    <div
                      className="h-full bg-amber-700 dark:bg-amber-400 rounded-full transition-all duration-300"
                      style={{ width: `${heroProgressPct}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Right-aligned Primary + Secondary Pill CTAs */}
            <div className="flex flex-wrap md:flex-col md:items-end gap-2 shrink-0">
              <button
                onClick={() => handleSelectAndPersistBook(heroBook)}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-semibold transition-colors cursor-pointer"
              >
                <span>{heroIsContinue ? 'Resume Reading' : "Read Today's Dispatch"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {onOpenWordbook && (
                <button
                  onClick={onOpenWordbook}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-stone-300/80 dark:border-stone-700 bg-white/60 dark:bg-white/[0.05] hover:bg-white dark:hover:bg-white/[0.1] text-stone-800 dark:text-stone-200 text-xs font-medium transition-colors cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-800 dark:text-amber-400" />
                  <span>
                    Review Due Words{dueWordsCount > 0 ? ` (${dueWordsCount})` : ''}
                  </span>
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 2. Apple Segmented View Switcher + Discover/Import ⌘K Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="inline-flex items-center p-1 rounded-full bg-black/[0.05] dark:bg-white/[0.07] self-start">
          <button
            type="button"
            data-testid="source-tab-all"
            onClick={() => {
              setActiveView('genres');
              setSelectedGenreId(null);
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeView === 'genres'
                ? 'bg-white dark:bg-[#2C2C32] text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Genres
          </button>

          <button
            type="button"
            data-testid="source-tab-novels"
            onClick={() => {
              setActiveView('novels');
              setSelectedGenreId(null);
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeView === 'novels'
                ? 'bg-white dark:bg-[#2C2C32] text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Full Novels ({fullNovels.length})
          </button>

          <button
            type="button"
            data-testid="source-tab-news"
            onClick={() => {
              setActiveView('news');
              setSelectedGenreId(null);
              if (!dailyEdition && !isLoadingDailyNews) {
                loadDailyNews();
              }
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeView === 'news'
                ? 'bg-white dark:bg-[#2C2C32] text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Daily Press
          </button>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <span className="text-xs text-stone-500 dark:text-stone-400 font-mono">
            {currentLangInfo.name} · {langBooks.length} titles
          </span>

          <button
            type="button"
            onClick={onOpenImporter}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white/80 dark:bg-white/[0.06] hover:bg-white dark:hover:bg-white/[0.12] text-xs font-medium text-stone-800 dark:text-stone-100 transition-colors cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-stone-500" />
            <span>Discover / Import</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-black/[0.05] dark:bg-white/[0.1] text-[10px] font-mono text-stone-500 dark:text-stone-400">
              ⌘K
            </kbd>
          </button>
        </div>
      </div>

      {/* 3A. GENRES GRID (3x2 Full-Bleed Photographic Squares with Dual Pills) */}
      {activeView === 'genres' && !selectedGenreId && (
        <section aria-label="Literary Genres">
          {isLoading ? (
            <div className="py-16 flex items-center justify-center gap-2 text-xs font-serif italic text-stone-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Preparing {currentLangInfo.name} collection...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {GENRES.map((g) => {
                const genreBooks = langBooks.filter((b) => b.genre === g.id);
                const hasNewsInGenre = allStoriesFromEdition.some((s) => s.genre === g.id);
                const fullCount = genreBooks.filter((b) => isFullNovelItem(b)).length;
                const totalItems = genreBooks.length + (hasNewsInGenre ? 1 : 0);
                const cefrHint = GENRE_CEFR_HINTS[g.id];
                const knownPct = estimateGenreKnownPct(g.id, savedWordsCount);
                const sourcesLabel = getGenreSourcesLabel(genreBooks, hasNewsInGenre);

                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGenreId(g.id)}
                    className="group relative aspect-square w-full overflow-hidden rounded-3xl border border-black/[0.08] dark:border-white/[0.1] apple-glass-card text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-700"
                  >
                    <img
                      src={GENRE_COVER_MAP[g.id]}
                      alt={g.label}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Subtle top vignette for crisp pill legibility */}
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/50 to-transparent" />

                    {/* Top Frosted Badges: Learning Match (Left) + Source Provenance (Right) */}
                    <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-black/45 backdrop-blur-md border border-white/20 text-[10px] font-semibold text-white tracking-wide whitespace-nowrap">
                        {cefrHint.range} · {knownPct}% known
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-black/45 backdrop-blur-md border border-white/20 text-[10px] font-medium text-white/95 tracking-wide whitespace-nowrap">
                        {sourcesLabel}
                      </span>
                    </div>

                    {/* Bottom Frosted Progressive Scrim */}
                    <div className="apple-tile-frost absolute inset-x-0 bottom-0 pt-14 pb-4 px-4 bg-gradient-to-t from-black/85 via-black/55 to-transparent">
                      <h2 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                        {g.label}
                      </h2>
                      <p className="text-xs text-white/80 font-serif italic line-clamp-1 mt-0.5">
                        {g.subtitle}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-white/85">
                        <span>
                          {totalItems} {totalItems === 1 ? 'Title' : 'Titles'}
                          {fullCount > 0 ? ` · ${fullCount} Full Novels` : ''}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-white/90 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* 3B. GENRE COLLECTION DRILLDOWN VIEW */}
      {activeView === 'genres' && selectedGenreId && selectedGenreInfo && (
        <section aria-label={selectedGenreInfo.label} className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setSelectedGenreId(null)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Genres</span>
            </button>

            <button
              type="button"
              onClick={onOpenImporter}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 dark:text-amber-400 hover:underline cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Browse More in Gutenberg</span>
            </button>
          </div>

          {/* Genre Hero Strip */}
          <div className="relative overflow-hidden rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-white/90 dark:bg-[#16161A]/90 apple-glass-card p-5 sm:p-6 flex items-center gap-5">
            <img
              src={GENRE_COVER_MAP[selectedGenreInfo.id]}
              alt={selectedGenreInfo.label}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shrink-0 border border-black/[0.08] dark:border-white/[0.1]"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap text-[11px] font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-400 mb-1">
                <span>{GENRE_CEFR_HINTS[selectedGenreInfo.id].range}</span>
                <span aria-hidden="true">·</span>
                <span>
                  {getGenreSourcesLabel(
                    genreCollectionBooks,
                    allStoriesFromEdition.some((s) => s.genre === selectedGenreInfo.id)
                  )}
                </span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
                {selectedGenreInfo.label}
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-serif mt-1">
                {selectedGenreInfo.description}
              </p>
            </div>
          </div>

          {/* Calm Apple Editorial List */}
          <div className="rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-white/85 dark:bg-[#16161A]/85 apple-glass-card px-5 sm:px-6 py-2 divide-y divide-stone-200/70 dark:divide-stone-800/70">
            {genreCollectionBooks.length === 0 ? (
              <div className="py-12 text-center text-xs text-stone-500 font-serif italic">
                No titles yet for {currentLangInfo.name} in this genre. Use Discover / Import to add classics or RSS articles.
              </div>
            ) : (
              genreCollectionBooks.map((book) => renderEditorialRow(book))
            )}
          </div>
        </section>
      )}

      {/* 4. FULL NOVELS VIEW (`source-tab-novels`) */}
      {activeView === 'novels' && (
        <section aria-label="Complete Multi-Chapter Novels" className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-200/80 dark:border-stone-800">
            <div>
              <h2 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
                Complete Multi-Chapter Novels
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-serif italic mt-0.5">
                {fullNovels.length} full-length {currentLangInfo.name} works with multi-chapter table of contents
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenImporter}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-medium cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Browse Gutenberg</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {fullNovels.map((novel) => {
              const meta = getEditionMeta(novel, novel.currentChunkIndex || 0);
              const coverSrc = GENRE_COVER_MAP[novel.genre] || GENRE_COVER_MAP.fiction;
              const currentChapter = (novel.currentChunkIndex || 0) + 1;

              return (
                <button
                  key={novel.id}
                  type="button"
                  onClick={() => handleSelectAndPersistBook(novel)}
                  className="group relative aspect-square w-full overflow-hidden rounded-3xl border border-black/[0.08] dark:border-white/[0.1] apple-glass-card text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-700"
                >
                  <img
                    src={coverSrc}
                    alt={novel.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/55 to-transparent" />

                  <span className="absolute top-3.5 left-3.5 px-2.5 py-1 rounded-full bg-emerald-950/75 backdrop-blur-md border border-emerald-300/30 text-[10px] font-semibold text-emerald-100 tracking-wide">
                    Complete Novel · {novel.chunks.length} ch
                  </span>

                  <span className="absolute top-3.5 right-3.5 px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/20 text-[10px] font-medium text-white/95">
                    {meta.sourceLabel}
                  </span>

                  <div className="apple-tile-frost absolute inset-x-0 bottom-0 pt-14 pb-4 px-4 bg-gradient-to-t from-black/85 via-black/55 to-transparent">
                    <h3 className="font-display text-lg font-bold text-white leading-snug line-clamp-2">
                      {novel.title}
                    </h3>
                    <p className="text-xs text-white/80 font-serif italic mt-0.5 truncate">
                      by {novel.author}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-white/85">
                      <span>
                        Ch {currentChapter} of {novel.chunks.length} · ~{novel.estimatedReadTimeMinutes}m
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {expandableExcerpts.length > 0 && (
            <div className="pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-3">
                Expand Curated Excerpts into Full Gutenberg Novels
              </h3>
              <div className="rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-white/85 dark:bg-[#16161A]/85 apple-glass-card px-5 sm:px-6 py-2 divide-y divide-stone-200/70 dark:divide-stone-800/70">
                {expandableExcerpts.map((book) => renderEditorialRow(book))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 5. DAILY PRESS VIEW (`source-tab-news`) */}
      {activeView === 'news' && (
        <section aria-label="The Daily Folio Press" className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-200/80 dark:border-stone-800">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-amber-800 dark:text-amber-400 block mb-0.5">
                {dailyEdition?.editionTitle || `${currentLangInfo.name} Morning Dispatch`} ·{' '}
                {dailyEdition?.date || new Date().toISOString().split('T')[0]}
              </span>
              <h2 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
                The Daily Folio
              </h2>
            </div>

            <button
              type="button"
              onClick={() => loadDailyNews(true)}
              disabled={isLoadingDailyNews}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white/80 dark:bg-white/[0.06] text-xs font-medium text-stone-700 dark:text-stone-300 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDailyNews ? 'animate-spin text-amber-700' : ''}`} />
              <span>{isLoadingDailyNews ? 'Refreshing...' : 'Refresh Edition'}</span>
            </button>
          </div>

          {isLoadingDailyNews && !dailyEdition ? (
            <div className="py-12 flex items-center justify-center gap-2 text-xs font-serif italic text-stone-500">
              <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
              <span>Gathering open-access dispatches in {currentLangInfo.name}...</span>
            </div>
          ) : dailyEdition ? (
            <div className="space-y-6">
              {/* Lead Cultural Story Card */}
              <div className="rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-white/90 dark:bg-[#16161A]/90 apple-glass-card p-6">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-medium mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100/80 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300">
                    Lead Story · {getEditionMeta(dailyEdition.leadStory).scopeShortBadge}
                  </span>
                  <span className="text-stone-500 dark:text-stone-400">
                    {getBookSourceLabel(dailyEdition.leadStory)}
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <h3
                    onClick={() => handleSelectAndPersistBook(dailyEdition.leadStory)}
                    className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100 hover:text-amber-800 dark:hover:text-amber-400 transition-colors cursor-pointer"
                  >
                    {dailyEdition.leadStory.title}
                  </h3>
                  {dailyEdition.leadStory.sourceUrl && (
                    <a
                      href={dailyEdition.leadStory.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-stone-400 hover:text-amber-800"
                      title="Open original dispatch"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                <p className="text-xs font-serif italic text-stone-500 dark:text-stone-400 mt-1">
                  by {dailyEdition.leadStory.author}
                </p>

                <p className="text-sm font-reader text-stone-700 dark:text-stone-300 mt-3 leading-relaxed">
                  {dailyEdition.leadStory.summary}
                </p>

                {dailyEdition.leadStory.preflightVocab && dailyEdition.leadStory.preflightVocab.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-stone-200/70 dark:border-stone-800 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-600 dark:text-stone-400">
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-800 dark:text-amber-400">
                      <Sparkles className="w-3 h-3" />
                      Pre-Flight:
                    </span>
                    {dailyEdition.leadStory.preflightVocab.map((term, idx) => (
                      <span key={idx}>
                        <strong className="font-serif text-stone-900 dark:text-stone-100">{term.word}</strong>{' '}
                        <span className="italic">({term.translation})</span>
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => handleSelectAndPersistBook(dailyEdition.leadStory)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold cursor-pointer"
                  >
                    <span>Read Lead Story</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* All Press Articles List */}
              <div className="rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-white/85 dark:bg-[#16161A]/85 apple-glass-card px-5 sm:px-6 py-2 divide-y divide-stone-200/70 dark:divide-stone-800/70">
                {dailyPressArticles.map((article) => renderEditorialRow(article))}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-stone-500 font-serif italic">
              Could not reach today&apos;s morning dispatch. Try refreshing or importing a custom RSS feed via Discover.
            </div>
          )}
        </section>
      )}
    </div>
  );
};
