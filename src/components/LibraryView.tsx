import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  BookOpen,
  Plus,
  Loader2,
  ArrowRight,
  Trash2,
  Bookmark,
  Globe,
  Newspaper,
  RefreshCw,
  Sparkles,
  Flame,
  Calendar,
  ExternalLink,
  Download,
  Check,
} from 'lucide-react';
import { ContentItem, DailyNewsEdition, GenreId, LanguageCode } from '../types/index.ts';
import { GENRES, SUPPORTED_LANGUAGES } from '../data/constants.ts';
import { storageService } from '../services/storageService.ts';
import { contentService } from '../services/contentService.ts';

interface LibraryViewProps {
  targetLang: LanguageCode;
  onSelectBook: (book: ContentItem) => void;
  onOpenImporter: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  targetLang,
  onSelectBook,
  onOpenImporter,
}) => {
  const [selectedGenre, setSelectedGenre] = useState<GenreId | 'all'>('all');
  const [activeSource, setActiveSource] = useState<
    'all' | 'news' | 'novels' | 'curated' | 'gutenberg' | 'wikipedia' | 'custom'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [books, setBooks] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingExternal, setIsFetchingExternal] = useState(false);
  const [dailyEdition, setDailyEdition] = useState<DailyNewsEdition | null>(null);
  const [isLoadingDailyNews, setIsLoadingDailyNews] = useState(false);
  const [insertingNovelId, setInsertingNovelId] = useState<string | null>(null);
  const [insertNotice, setInsertNotice] = useState<{
    bookId: string;
    message: string;
    isError?: boolean;
  } | null>(null);
  const fetchedSourcesRef = useRef<Set<string>>(new Set());

  const currentLangInfo = SUPPORTED_LANGUAGES.find((l) => l.code === targetLang) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
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

  const handleSearchGutenberg = async (e?: React.FormEvent, customTopic?: string) => {
    if (e) e.preventDefault();
    setIsFetchingExternal(true);
    try {
      const topic = customTopic ?? (selectedGenre !== 'all' ? selectedGenre : '');
      const results = await contentService.searchGutenberg(targetLang, searchQuery, topic);
      for (const item of results) {
        await storageService.saveBook(item);
      }
      await loadBooks();
      setActiveSource('gutenberg');
    } catch (err) {
      console.warn('Gutenberg search error', err);
    } finally {
      setIsFetchingExternal(false);
    }
  };

  const handleLoadWikipedia = async (genre: GenreId | 'all' = selectedGenre) => {
    setIsFetchingExternal(true);
    try {
      const wikiItems = await contentService.fetchWikipediaArticles(targetLang, genre);
      for (const item of wikiItems) {
        await storageService.saveBook(item);
      }
      await loadBooks();
      setActiveSource('wikipedia');
    } catch (e) {
      console.warn('Wiki fetch error', e);
    } finally {
      setIsFetchingExternal(false);
    }
  };

  // Auto-populate Gutenberg or Wikipedia tabs when clicked if empty for current language
  const handleSelectSource = async (
    nextSource: 'all' | 'news' | 'novels' | 'curated' | 'gutenberg' | 'wikipedia' | 'custom'
  ) => {
    setActiveSource(nextSource);

    if (nextSource === 'news') {
      if (!dailyEdition && !isLoadingDailyNews) {
        await loadDailyNews();
      }
    } else if (nextSource === 'gutenberg') {
      const hasDynamicGutenberg = books.some(
        (b) => b.language === targetLang && b.id.startsWith('gutenberg-search-')
      );
      const cacheKey = `gutenberg__${targetLang}`;
      if (!hasDynamicGutenberg && !fetchedSourcesRef.current.has(cacheKey)) {
        fetchedSourcesRef.current.add(cacheKey);
        await handleSearchGutenberg(undefined, selectedGenre !== 'all' ? selectedGenre : '');
      }
    } else if (nextSource === 'wikipedia') {
      const hasWiki = books.some((b) => b.language === targetLang && b.source === 'wikipedia');
      const cacheKey = `wiki__${targetLang}`;
      if (!hasWiki && !fetchedSourcesRef.current.has(cacheKey)) {
        fetchedSourcesRef.current.add(cacheKey);
        await handleLoadWikipedia(selectedGenre);
      }
    }
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
        message: `Inserted ${updated.chunks.length} chapters!`,
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

  const continueReadingBook = books
    .filter((b) => b.language === targetLang && ((b.currentChunkIndex && b.currentChunkIndex > 0) || b.lastReadAt))
    .sort((a, b) => (b.lastReadAt || 0) - (a.lastReadAt || 0))[0];

  const allStoriesFromEdition: ContentItem[] = React.useMemo(() => {
    if (!dailyEdition) return [];
    const stories: ContentItem[] = [
      dailyEdition.leadStory,
      ...dailyEdition.culturalStories,
      ...dailyEdition.trendingStories,
      ...(dailyEdition.onThisDayStory ? [dailyEdition.onThisDayStory] : []),
    ];
    return stories.filter(Boolean);
  }, [dailyEdition]);

  const displayBooks = React.useMemo(() => {
    if (activeSource !== 'news') {
      return books;
    }
    // For 'news' view: combine any stored 'news' books with all stories from dailyEdition, deduplicating by ID
    const map = new Map<string, ContentItem>();
    for (const story of allStoriesFromEdition) {
      map.set(story.id, story);
    }
    for (const b of books) {
      if (b.language === targetLang && b.source === 'news') {
        map.set(b.id, b);
      }
    }
    return Array.from(map.values());
  }, [activeSource, books, allStoriesFromEdition, targetLang]);

  const isBookFullNovel = (book: ContentItem) =>
    book.isFullNovel === true ||
    (book.source !== 'news' && book.source !== 'wikipedia' && book.chunks.length >= 8);

  const fullNovelsCountInLang = books.filter(
    (b) => b.language === targetLang && isBookFullNovel(b)
  ).length;

  const filteredBooks = displayBooks.filter((book) => {
    const matchesLang = book.language === targetLang;
    const matchesGenre = selectedGenre === 'all' || book.genre === selectedGenre;
    const isDynamicGutenberg =
      book.id.startsWith('gutenberg-search-') || book.id.startsWith('gutenberg-');
    const matchesSource =
      activeSource === 'all'
        ? true
        : activeSource === 'news'
        ? book.source === 'news'
        : activeSource === 'novels'
        ? isBookFullNovel(book)
        : activeSource === 'curated'
        ? book.source === 'gutenberg' && !isDynamicGutenberg && !book.isFullNovel
        : activeSource === 'gutenberg'
        ? book.source === 'gutenberg' && (isDynamicGutenberg || !books.some((b) => b.language === targetLang && b.id.startsWith('gutenberg-search-')))
        : activeSource === 'wikipedia'
        ? book.source === 'wikipedia'
        : book.source === 'custom';

    const matchesSearch =
      searchQuery.trim() === '' ||
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.summary.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesLang && matchesGenre && matchesSource && matchesSearch;
  });

  const genreCounts = displayBooks.reduce((acc, b) => {
    if (b.language === targetLang) {
      acc[b.genre] = (acc[b.genre] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Streamlined Header + Continue Reading Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5 pb-4 border-b border-stone-200/80 dark:border-stone-800/80">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            {currentLangInfo.name} Library
          </h1>
          <span className="text-xs font-serif italic text-stone-500 dark:text-stone-400">
            Daily press dispatches, public domain classics, Wikipedia articles & custom manuscripts
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {continueReadingBook && (
            <button
              onClick={() => handleSelectAndPersistBook(continueReadingBook)}
              className="flex items-center gap-2 px-3.5 py-2 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100/80 dark:hover:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/60 rounded-lg text-xs text-amber-900 dark:text-amber-300 transition-colors cursor-pointer max-w-xs sm:max-w-sm"
            >
              <Bookmark className="w-3.5 h-3.5 shrink-0 text-amber-700 dark:text-amber-400" />
              <span className="truncate font-medium">
                Resume <strong className="font-semibold">{continueReadingBook.title}</strong> ({(continueReadingBook.currentChunkIndex || 0) + 1}/{continueReadingBook.chunks.length})
              </span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          )}

          <button
            onClick={onOpenImporter}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Import Text / RSS / EPUB
          </button>
        </div>
      </div>

      {/* "The Morning Espresso" Broadsheet Card */}
      {(activeSource === 'all' || activeSource === 'news') && (dailyEdition || isLoadingDailyNews) && (
        <section
          aria-label="Daily News Edition"
          className="mb-8 rounded-2xl border border-stone-300/80 dark:border-stone-800 bg-[#FDFBF7] dark:bg-[#1C1A17] text-stone-900 dark:text-stone-100 shadow-xs overflow-hidden"
        >
          {/* Newspaper Masthead */}
          <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-100/70 dark:bg-stone-900/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-900 text-amber-100 dark:bg-amber-800 dark:text-amber-100 shrink-0">
                  <Newspaper className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-amber-800 dark:text-amber-400 font-semibold">
                      The Daily Folio · 6-Hour Temporal Slot
                    </span>
                    <span className="text-stone-300 dark:text-stone-700">|</span>
                    <span className="text-xs text-stone-500 dark:text-stone-400">
                      {dailyEdition?.date || new Date().toISOString().split('T')[0]}
                    </span>
                    {dailyEdition?.leadStory?.license && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                        {dailyEdition.leadStory.license}
                      </span>
                    )}
                  </div>
                  <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                    {dailyEdition?.editionTitle || `${currentLangInfo.name} Morning Press`}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={() => loadDailyNews(true)}
                  disabled={isLoadingDailyNews}
                  title="Refresh morning edition"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-white dark:bg-stone-800/80 hover:bg-stone-50 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDailyNews ? 'animate-spin text-amber-600' : ''}`} />
                  <span className="text-[11px] font-medium">{isLoadingDailyNews ? 'Refreshing...' : 'Refresh Edition'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Broadsheet Content: Lead Story & Sidebar */}
          {isLoadingDailyNews && !dailyEdition ? (
            <div className="py-12 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-600 mb-2" />
              <p className="text-xs font-serif italic text-stone-500">
                Gathering dispatch from Global Voices & Wikimedia in {currentLangInfo.name}...
              </p>
            </div>
          ) : dailyEdition ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-stone-200 dark:divide-stone-800">
              {/* Left Column: Lead Cultural Story (8 cols) */}
              <div className="lg:col-span-8 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60">
                      Lead Cultural Story
                    </span>
                    <span className="text-xs text-stone-400 font-mono">
                      {dailyEdition.leadStory.estimatedReadTimeMinutes} min read · {dailyEdition.leadStory.wordCount} words
                    </span>
                  </div>

                  <h3
                    onClick={() => handleSelectAndPersistBook(dailyEdition.leadStory)}
                    className="font-display text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 hover:text-amber-800 dark:hover:text-amber-400 transition-colors cursor-pointer leading-snug mb-2"
                  >
                    {dailyEdition.leadStory.title}
                  </h3>

                  <p className="font-serif italic text-xs text-stone-500 dark:text-stone-400 mb-3">
                    Reported by {dailyEdition.leadStory.author}
                    {dailyEdition.leadStory.sourceUrl && (
                      <a
                        href={dailyEdition.leadStory.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="ml-2 inline-flex items-center text-stone-400 hover:text-amber-700 transition-colors"
                        title="Source article"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </p>

                  <p className="font-reader text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed line-clamp-3 mb-5">
                    {dailyEdition.leadStory.summary}
                  </p>

                  {/* Preflight Key Vocab Preview Pills */}
                  {dailyEdition.leadStory.preflightVocab && dailyEdition.leadStory.preflightVocab.length > 0 && (
                    <div className="mb-5 p-3.5 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-900 dark:text-amber-300 mb-2">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Pre-Flight Vocabulary Preview</span>
                        <span className="text-[10px] font-normal text-amber-700/80 dark:text-amber-400/70 font-serif italic">
                          (Top {dailyEdition.leadStory.preflightVocab.length} key journalistic words to unlock comprehension)
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {dailyEdition.leadStory.preflightVocab.map((item, idx) => (
                          <div
                            key={idx}
                            className="inline-flex items-baseline gap-1.5 px-2.5 py-1 bg-white dark:bg-stone-900 rounded-lg border border-amber-200 dark:border-amber-800/80 text-xs shadow-2xs"
                          >
                            <span className="font-medium text-stone-900 dark:text-stone-100">{item.word}</span>
                            <span className="text-[11px] text-stone-500 dark:text-stone-400 font-serif italic">
                              {item.translation}
                            </span>
                            {item.cefrHint && (
                              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-semibold">
                                {item.cefrHint}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-stone-200/60 dark:border-stone-800 flex items-center justify-between">
                  <span className="text-xs font-serif italic text-stone-500 dark:text-stone-400">
                    Interactive reader with instant word breakdown & CEFR level switcher
                  </span>
                  <button
                    onClick={() => handleSelectAndPersistBook(dailyEdition.leadStory)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer group"
                  >
                    <span>Read Lead Story</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Right Sidebar: Trending Today + On This Day (4 cols) */}
              <div className="lg:col-span-4 p-5 bg-stone-50/50 dark:bg-stone-900/30 flex flex-col justify-between gap-5">
                {/* Trending Today */}
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200 pb-2 mb-3 border-b border-stone-200 dark:border-stone-800">
                    <Flame className="w-3.5 h-3.5 text-amber-600" />
                    <span>Trending Today</span>
                  </div>

                  <div className="space-y-3">
                    {dailyEdition.trendingStories.slice(0, 3).map((story) => (
                      <div
                        key={story.id}
                        onClick={() => handleSelectAndPersistBook(story)}
                        className="group p-2.5 rounded-lg hover:bg-white dark:hover:bg-stone-800/80 border border-transparent hover:border-stone-200 dark:hover:border-stone-700/80 transition-all cursor-pointer"
                      >
                        <h4 className="font-display text-xs font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-800 dark:group-hover:text-amber-400 line-clamp-2 leading-snug mb-1">
                          {story.title}
                        </h4>
                        <div className="flex items-center justify-between text-[11px] text-stone-400 dark:text-stone-500 font-mono">
                          <span>{story.estimatedReadTimeMinutes}m read</span>
                          <span className="flex items-center gap-0.5 text-stone-600 dark:text-stone-300 group-hover:text-amber-700 font-medium font-sans">
                            Read <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* On This Day In History */}
                {dailyEdition.onThisDayStory && (
                  <div className="pt-4 border-t border-stone-200 dark:border-stone-800">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200 pb-2 mb-2">
                      <Calendar className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                      <span>On This Day</span>
                    </div>
                    <div
                      onClick={() => handleSelectAndPersistBook(dailyEdition.onThisDayStory!)}
                      className="group p-3 rounded-lg bg-white dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700/70 hover:border-amber-500 transition-all cursor-pointer"
                    >
                      <h4 className="font-display text-xs font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-800 dark:group-hover:text-amber-400 line-clamp-2 mb-1">
                        {dailyEdition.onThisDayStory.title}
                      </h4>
                      <p className="text-[11px] font-reader text-stone-600 dark:text-stone-400 line-clamp-2 mb-2 leading-relaxed">
                        {dailyEdition.onThisDayStory.summary}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono">
                        <span>Archival Record</span>
                        <span className="flex items-center gap-0.5 text-amber-700 dark:text-amber-400 font-semibold font-sans">
                          Explore <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </section>
      )}

      {/* Compact Two-Row Search, Source & Genre Controls */}
      <div className="space-y-3 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input with explicit Gutenberg search button */}
          <form onSubmit={handleSearchGutenberg} className="flex items-center gap-2 w-full md:w-96">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Filter library or press Enter for Gutenberg...`}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:border-amber-600 dark:focus:border-amber-500 transition-colors"
              />
            </div>
            {searchQuery.trim().length > 0 && (
              <button
                type="submit"
                disabled={isFetchingExternal}
                className="px-3 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0"
              >
                {isFetchingExternal ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Gutenberg'}
              </button>
            )}
          </form>

          {/* 7-Option Source Segmented Control */}
          <div className="flex items-center p-1 bg-stone-100 dark:bg-stone-900 rounded-lg border border-stone-200/60 dark:border-stone-800/60 w-full md:w-auto overflow-x-auto">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'news', label: 'Daily Press' },
                { id: 'novels', label: 'Full Novels' },
                { id: 'curated', label: 'Curated Classics' },
                { id: 'gutenberg', label: 'Gutenberg' },
                { id: 'wikipedia', label: 'Wikipedia' },
                { id: 'custom', label: 'Imported' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                data-testid={`source-tab-${tab.id}`}
                onClick={() => handleSelectSource(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                  activeSource === tab.id
                    ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Single-Line Compact Genre Pill Bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedGenre('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors cursor-pointer ${
                selectedGenre === 'all'
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100'
                  : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800 hover:border-amber-500/60'
              }`}
            >
              All Genres ({displayBooks.filter((b) => b.language === targetLang).length})
            </button>

            {GENRES.map((genre) => {
              const isSelected = selectedGenre === genre.id;
              const count = genreCounts[genre.id] || 0;
              return (
                <button
                  key={genre.id}
                  onClick={() => setSelectedGenre(genre.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100'
                      : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800 hover:border-amber-500/60'
                  }`}
                >
                  {genre.label.split('&')[0].trim()} {count > 0 ? `(${count})` : ''}
                </button>
              );
            })}
          </div>

          {activeSource === 'wikipedia' && (
            <button
              onClick={() => handleLoadWikipedia(selectedGenre)}
              disabled={isFetchingExternal}
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs font-medium rounded-lg hover:bg-amber-100/70 transition-colors cursor-pointer"
            >
              {isFetchingExternal ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Globe className="w-3.5 h-3.5" />
              )}
              <span>Refresh Wikipedia</span>
            </button>
          )}

          {activeSource === 'news' && (
            <button
              onClick={() => loadDailyNews(true)}
              disabled={isLoadingDailyNews}
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs font-medium rounded-lg hover:bg-amber-100/70 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDailyNews ? 'animate-spin' : ''}`} />
              <span>Refresh Press</span>
            </button>
          )}
        </div>
      </div>

      {/* Full Novels Editorial Banner */}
      {activeSource === 'novels' && (
        <section
          aria-label="Complete Multi-Chapter Novels"
          className="mb-6 p-4 sm:p-5 rounded-xl border border-emerald-200/80 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-900 text-emerald-100 dark:bg-emerald-800 shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                  Complete Multi-Chapter Novels (Full Text Inserted)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                  {fullNovelsCountInLang} in {currentLangInfo.name}
                </span>
              </div>
              <p className="text-xs font-serif italic text-stone-600 dark:text-stone-400 mt-0.5">
                Multi-chapter editions with full continuous prose (8+ chapters) ready for long-form graded reading.
              </p>
            </div>
          </div>

          <button
            onClick={() => handleSelectSource('gutenberg')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Insert More from Gutenberg</span>
          </button>
        </section>
      )}

      {/* Books Grid */}
      {isLoading || isFetchingExternal ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-600 mb-3" />
          <p className="text-xs font-serif italic text-stone-500">
            {isFetchingExternal
              ? `Fetching ${activeSource === 'wikipedia' ? 'Wikipedia articles' : 'Project Gutenberg catalog'} in ${currentLangInfo.name}...`
              : 'Loading your library...'}
          </p>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-stone-200 dark:border-stone-800 rounded-2xl p-8">
          <BookOpen className="w-9 h-9 mx-auto text-stone-400 mb-3 stroke-[1.5]" />
          <h3 className="font-display text-lg font-bold text-stone-800 dark:text-stone-200 mb-1">
            {activeSource === 'news'
              ? 'No press dispatches available for this language yet'
              : activeSource === 'novels'
              ? 'No multi-chapter full novels match this filter yet'
              : activeSource === 'custom'
              ? 'No imported manuscripts match this filter yet'
              : 'No readings match this filter yet'}
          </h3>
          <p className="text-stone-500 text-xs max-w-sm mx-auto mb-5">
            {activeSource === 'news'
              ? "Refresh today's Morning Edition or import any custom RSS/Atom news feed."
              : activeSource === 'novels'
              ? `Reset genre filters or browse Project Gutenberg to insert full multi-chapter novels in ${currentLangInfo.name}.`
              : activeSource === 'custom'
              ? 'Import your own .epub, .txt, .md file, or paste any article.'
              : `Fetch public domain books or encyclopedic articles in ${currentLangInfo.name}.`}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {activeSource === 'news' ? (
              <>
                <button
                  onClick={() => loadDailyNews(true)}
                  disabled={isLoadingDailyNews}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  {isLoadingDailyNews ? 'Refreshing Edition...' : 'Refresh Morning Edition'}
                </button>
                <button
                  onClick={onOpenImporter}
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Import Custom RSS Feed
                </button>
              </>
            ) : activeSource === 'custom' ? (
              <button
                onClick={onOpenImporter}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Import EPUB, RSS or Text
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleSearchGutenberg(undefined, selectedGenre !== 'all' ? selectedGenre : '')}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Browse Gutenberg ({currentLangInfo.name})
                </button>
                <button
                  onClick={() => handleLoadWikipedia(selectedGenre)}
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Fetch Wikipedia Articles
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBooks.map((book) => {
            const genre = GENRES.find((g) => g.id === book.genre);
            const isFull = isBookFullNovel(book);
            const canInsertFullNovel =
              book.source === 'gutenberg' &&
              !book.isFullNovel &&
              book.chunks.length <= 3 &&
              Boolean(contentService.getGutenbergNumericId(book.id) || book.gutenbergId);
            const isInsertingThis = insertingNovelId === book.id;
            const noticeForThis = insertNotice?.bookId === book.id ? insertNotice : null;
            const isRemovable =
              book.source === 'custom' ||
              book.source === 'wikipedia' ||
              book.id.startsWith('gutenberg-search-') ||
              book.id.startsWith('gutenberg-') ||
              (book.source === 'news' && (!dailyEdition || book.id !== dailyEdition.leadStory.id));
            const hasProgress = (book.currentChunkIndex || 0) > 0;

            return (
              <div
                key={book.id}
                onClick={() => handleSelectAndPersistBook(book)}
                className="group flex flex-col justify-between p-5 bg-white dark:bg-[#1C1A18] rounded-xl border border-stone-200/80 dark:border-stone-800/80 hover:border-amber-600/50 dark:hover:border-amber-500/50 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-[11px] text-stone-400 dark:text-stone-500 mb-2">
                    <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                      <span className="font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                        {genre?.label.split('&')[0].trim() || 'Literature'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{book.estimatedReadTimeMinutes} min</span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{book.source === 'news' ? 'Daily Press' : book.source}</span>
                      {book.license && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-[10px] font-mono">{book.license}</span>
                        </>
                      )}
                    </div>

                    {isRemovable && (
                      <button
                        onClick={(e) => handleDeleteBook(e, book.id)}
                        title="Remove from library"
                        className="p-1 text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {isFull && (
                    <div className="mb-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
                        FULL NOVEL · {book.chunks.length} CHAPTERS
                      </span>
                    </div>
                  )}

                  <h3 className="font-display text-lg font-bold tracking-tight text-stone-900 dark:text-stone-100 group-hover:text-amber-800 dark:group-hover:text-amber-400 transition-colors mb-1 line-clamp-2">
                    {book.title}
                  </h3>

                  <p className="font-serif italic text-xs text-stone-500 dark:text-stone-400 mb-2.5">
                    by {book.author}
                  </p>

                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed line-clamp-2 mb-4">
                    {book.summary}
                  </p>

                  {noticeForThis && (
                    <div
                      className={`mb-3 px-2.5 py-1.5 rounded-lg text-[11px] font-medium flex items-center gap-1.5 ${
                        noticeForThis.isError
                          ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      }`}
                    >
                      {!noticeForThis.isError && <Check className="w-3 h-3 shrink-0" />}
                      <span>{noticeForThis.message}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-stone-400 dark:text-stone-500 truncate">
                    {hasProgress
                      ? `Sec ${(book.currentChunkIndex || 0) + 1}/${book.chunks.length} · ${book.wordCount}w`
                      : `${book.chunks.length} section${book.chunks.length === 1 ? '' : 's'} · ${book.wordCount} words`}
                  </span>

                  <div className="flex items-center gap-2 shrink-0">
                    {canInsertFullNovel && (
                      <button
                        type="button"
                        data-testid="insert-full-novel-btn"
                        disabled={Boolean(insertingNovelId)}
                        onClick={(e) => handleInsertFullNovel(e, book)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isInsertingThis ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Inserting...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3 h-3" />
                            <span>Insert Full Novel</span>
                          </>
                        )}
                      </button>
                    )}

                    <span className="flex items-center gap-1.5 text-xs font-semibold text-stone-900 dark:text-stone-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                      {hasProgress ? 'Resume' : 'Read'}
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
