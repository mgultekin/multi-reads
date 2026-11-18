import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Loader2,
  ArrowRight,
  Trash2,
  RefreshCw,
  ExternalLink,
  Download,
  Check,
  Plus,
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
        message: `Inserted ${updated.chunks.length} chapters`,
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
        ? book.source === 'gutenberg' &&
          (isDynamicGutenberg || !books.some((b) => b.language === targetLang && b.id.startsWith('gutenberg-search-')))
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

  const sourceTabs = [
    { id: 'all', label: 'All' },
    { id: 'news', label: 'Daily Press' },
    { id: 'novels', label: 'Full Novels' },
    { id: 'curated', label: 'Classics' },
    { id: 'gutenberg', label: 'Gutenberg' },
    { id: 'wikipedia', label: 'Wiki' },
    { id: 'custom', label: 'Imported' },
  ] as const;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Minimal Header + Continue Reading + Import Link */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-6 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B] dark:text-[#F4F4F5]">
            {currentLangInfo.name} Library
          </h1>
          <span className="text-xs font-serif italic text-[#71717A] dark:text-[#A1A1AA]">
            Classics, complete novels & morning dispatches
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          {continueReadingBook && (
            <button
              onClick={() => handleSelectAndPersistBook(continueReadingBook)}
              className="inline-flex items-center gap-1.5 text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5] transition-colors cursor-pointer max-w-xs"
            >
              <span className="truncate">
                Resume <em className="font-serif text-[#18181B] dark:text-[#F4F4F5]">{continueReadingBook.title}</em>{' '}
                <span className="font-mono text-[11px]">
                  ({(continueReadingBook.currentChunkIndex || 0) + 1}/{continueReadingBook.chunks.length})
                </span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0 text-[#9A3412] dark:text-[#D97706]" />
            </button>
          )}

          <button
            onClick={onOpenImporter}
            className="inline-flex items-center gap-1 font-medium text-[#18181B] dark:text-[#F4F4F5] hover:text-[#9A3412] dark:hover:text-[#D97706] border-b border-stone-300 dark:border-stone-700 hover:border-[#9A3412] dark:hover:border-[#D97706] pb-0.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Import</span>
          </button>
        </div>
      </div>

      {/* Slim Borderless Broadsheet Masthead Strip */}
      {(activeSource === 'all' || activeSource === 'news') && (dailyEdition || isLoadingDailyNews) && (
        <section
          aria-label="Daily News Edition"
          className="py-5 border-b border-stone-200 dark:border-stone-800"
        >
          {/* 1-Line Masthead */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA] mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="uppercase tracking-widest font-semibold text-[#9A3412] dark:text-[#D97706]">
                {dailyEdition?.editionTitle || `${currentLangInfo.name} Morning Press`}
              </span>
              <span aria-hidden="true">·</span>
              <span>{dailyEdition?.date || new Date().toISOString().split('T')[0]}</span>
              {dailyEdition?.leadStory?.license && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{dailyEdition.leadStory.license}</span>
                </>
              )}
            </div>

            <button
              onClick={() => loadDailyNews(true)}
              disabled={isLoadingDailyNews}
              title="Refresh morning edition"
              className="inline-flex items-center gap-1 text-[11px] font-sans text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5] transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingDailyNews ? 'animate-spin text-[#9A3412] dark:text-[#D97706]' : ''}`} />
              <span>{isLoadingDailyNews ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>

          {isLoadingDailyNews && !dailyEdition ? (
            <div className="py-6 flex items-center gap-2 text-xs font-serif italic text-[#71717A] dark:text-[#A1A1AA]">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#9A3412] dark:text-[#D97706]" />
              <span>Gathering morning dispatches in {currentLangInfo.name}...</span>
            </div>
          ) : dailyEdition ? (
            <div className="space-y-3">
              {/* Lead Story Title & Compact 2-Line Summary */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="max-w-3xl">
                  <div className="flex items-baseline gap-2 flex-wrap mb-1">
                    <h2
                      onClick={() => handleSelectAndPersistBook(dailyEdition.leadStory)}
                      className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#18181B] dark:text-[#F4F4F5] hover:text-[#9A3412] dark:hover:text-[#D97706] transition-colors cursor-pointer leading-snug"
                    >
                      {dailyEdition.leadStory.title}
                    </h2>
                    {dailyEdition.leadStory.sourceUrl && (
                      <a
                        href={dailyEdition.leadStory.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[#71717A] hover:text-[#9A3412] dark:hover:text-[#D97706] transition-colors"
                        title="Original source article"
                      >
                        <ExternalLink className="w-3 h-3 inline" />
                      </a>
                    )}
                  </div>
                  <p className="font-reader text-sm text-[#71717A] dark:text-[#A1A1AA] leading-relaxed line-clamp-2">
                    {dailyEdition.leadStory.summary}
                  </p>
                </div>

                <button
                  onClick={() => handleSelectAndPersistBook(dailyEdition.leadStory)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#18181B] dark:text-[#F4F4F5] hover:text-[#9A3412] dark:hover:text-[#D97706] border-b border-[#18181B] dark:border-[#F4F4F5] hover:border-[#9A3412] dark:hover:border-[#D97706] pb-0.5 transition-colors cursor-pointer shrink-0 self-start md:self-auto group"
                >
                  <span>Read Lead Story</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              {/* Inline Muted Pre-Flight Key Terms (Text Only — Zero Pill Boxes) */}
              {dailyEdition.leadStory.preflightVocab && dailyEdition.leadStory.preflightVocab.length > 0 && (
                <div className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                  <span className="font-mono text-[10px] uppercase tracking-wider mr-2 text-[#18181B] dark:text-[#F4F4F5]">
                    Key Terms:
                  </span>
                  {dailyEdition.leadStory.preflightVocab.map((item, idx) => (
                    <React.Fragment key={idx}>
                      {idx > 0 && <span aria-hidden="true" className="mx-1.5 text-stone-300 dark:text-stone-700">·</span>}
                      <button
                        type="button"
                        onClick={() => handleSelectAndPersistBook(dailyEdition.leadStory)}
                        className="hover:text-[#9A3412] dark:hover:text-[#D97706] transition-colors cursor-pointer text-left"
                      >
                        <span className="font-serif font-medium text-[#18181B] dark:text-[#F4F4F5]">
                          {item.word}
                        </span>{' '}
                        <span className="italic">({item.translation})</span>
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              )}

              {/* Compact 1-Line Trending & On This Day Links */}
              {(dailyEdition.trendingStories.length > 0 || dailyEdition.onThisDayStory) && (
                <div className="pt-2.5 border-t border-stone-200/70 dark:border-stone-800/70 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-[#71717A] dark:text-[#A1A1AA]">
                  {dailyEdition.trendingStories.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#9A3412] dark:text-[#D97706]">
                        Trending:
                      </span>
                      {dailyEdition.trendingStories.slice(0, 2).map((story, idx) => (
                        <React.Fragment key={story.id}>
                          {idx > 0 && <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">·</span>}
                          <button
                            type="button"
                            onClick={() => handleSelectAndPersistBook(story)}
                            className="hover:text-[#18181B] dark:hover:text-[#F4F4F5] hover:underline underline-offset-4 transition-colors cursor-pointer truncate max-w-[240px]"
                          >
                            {story.title}
                          </button>
                        </React.Fragment>
                      ))}
                    </div>
                  )}

                  {dailyEdition.onThisDayStory && (
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#18181B] dark:text-[#F4F4F5] shrink-0">
                        On This Day:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSelectAndPersistBook(dailyEdition.onThisDayStory!)}
                        className="hover:text-[#18181B] dark:hover:text-[#F4F4F5] hover:underline underline-offset-4 transition-colors cursor-pointer truncate max-w-[280px]"
                      >
                        {dailyEdition.onThisDayStory.title}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </section>
      )}

      {/* Minimal Underlined Source Tabs, Inline Genre Dropdown & Hairline Search */}
      <div className="py-5 border-b border-stone-200 dark:border-stone-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Underlined Plain-Text Source Tabs */}
        <div className="flex items-center gap-5 overflow-x-auto pb-1 lg:pb-0 text-xs">
          {sourceTabs.map((tab) => {
            const isActive = activeSource === tab.id;
            return (
              <button
                key={tab.id}
                data-testid={`source-tab-${tab.id}`}
                onClick={() => handleSelectSource(tab.id)}
                className={`whitespace-nowrap pb-1 border-b transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[#18181B] dark:text-[#F4F4F5] font-semibold border-[#9A3412] dark:border-[#D97706]'
                    : 'text-[#71717A] dark:text-[#A1A1AA] border-transparent hover:text-[#18181B] dark:hover:text-[#F4F4F5]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Quiet Genre Dropdown + Minimal Search Underline + Contextual Refresh */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-[#71717A] dark:text-[#A1A1AA]">
            <span>Genre:</span>
            <select
              aria-label="Filter by genre"
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value as GenreId | 'all')}
              className="bg-transparent font-medium text-[#18181B] dark:text-[#F4F4F5] hover:text-[#9A3412] dark:hover:text-[#D97706] focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#FAF8F4] dark:bg-[#141312]">
                All ({displayBooks.filter((b) => b.language === targetLang).length})
              </option>
              {GENRES.map((genre) => {
                const count = genreCounts[genre.id] || 0;
                return (
                  <option key={genre.id} value={genre.id} className="bg-[#FAF8F4] dark:bg-[#141312]">
                    {genre.label.split('&')[0].trim()} {count > 0 ? `(${count})` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <form onSubmit={handleSearchGutenberg} className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter or search Gutenberg..."
                className="w-48 sm:w-56 pl-5 pr-2 py-1 text-xs bg-transparent border-b border-stone-200 dark:border-stone-800 text-[#18181B] dark:text-[#F4F4F5] placeholder-[#71717A] dark:placeholder-[#A1A1AA] focus:outline-none focus:border-[#9A3412] dark:focus:border-[#D97706] transition-colors"
              />
            </div>
            {searchQuery.trim().length > 0 && (
              <button
                type="submit"
                disabled={isFetchingExternal}
                className="text-xs font-medium text-[#9A3412] dark:text-[#D97706] hover:underline cursor-pointer shrink-0"
              >
                {isFetchingExternal ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Gutenberg →'}
              </button>
            )}
          </form>

          {activeSource === 'wikipedia' && (
            <button
              onClick={() => handleLoadWikipedia(selectedGenre)}
              disabled={isFetchingExternal}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#9A3412] dark:text-[#D97706] hover:underline cursor-pointer"
            >
              {isFetchingExternal ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              <span>Refresh Wiki</span>
            </button>
          )}
        </div>
      </div>

      {/* Full Novels Rule-Bounded Header */}
      {activeSource === 'novels' && (
        <section
          aria-label="Complete Multi-Chapter Novels"
          className="py-4 border-b border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div>
            <h2 className="font-display text-base font-bold text-[#18181B] dark:text-[#F4F4F5]">
              Complete Multi-Chapter Novels (Full Text Inserted)
            </h2>
            <p className="text-xs font-serif italic text-[#71717A] dark:text-[#A1A1AA]">
              {fullNovelsCountInLang} full-length {fullNovelsCountInLang === 1 ? 'novel' : 'novels'} available in{' '}
              {currentLangInfo.name} · 8+ chapters ready for long-form reading
            </p>
          </div>

          <button
            onClick={() => handleSelectSource('gutenberg')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9A3412] dark:text-[#D97706] hover:underline cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Insert More from Gutenberg</span>
          </button>
        </section>
      )}

      {/* Editorial Book Catalog Grid */}
      {isLoading || isFetchingExternal ? (
        <div className="py-20 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#9A3412] dark:text-[#D97706] mb-3" />
          <p className="text-xs font-serif italic text-[#71717A] dark:text-[#A1A1AA]">
            {isFetchingExternal
              ? `Fetching ${activeSource === 'wikipedia' ? 'Wikipedia articles' : 'Project Gutenberg catalog'} in ${currentLangInfo.name}...`
              : 'Loading your library...'}
          </p>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="py-16 text-center border-b border-stone-200 dark:border-stone-800">
          <h3 className="font-display text-lg font-bold text-[#18181B] dark:text-[#F4F4F5] mb-1">
            {activeSource === 'news'
              ? 'No press dispatches available for this language yet'
              : activeSource === 'novels'
              ? 'No multi-chapter full novels match this filter yet'
              : activeSource === 'custom'
              ? 'No imported manuscripts match this filter yet'
              : 'No readings match this filter yet'}
          </h3>
          <p className="text-[#71717A] dark:text-[#A1A1AA] text-xs max-w-sm mx-auto mb-5 font-serif italic">
            {activeSource === 'news'
              ? "Refresh today's Morning Edition or import a custom RSS/Atom feed."
              : activeSource === 'novels'
              ? `Reset genre filters or browse Project Gutenberg to insert full multi-chapter novels in ${currentLangInfo.name}.`
              : activeSource === 'custom'
              ? 'Import your own .epub, .txt, .md file, or paste any article.'
              : `Fetch public domain books or encyclopedic articles in ${currentLangInfo.name}.`}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-5 text-xs font-medium">
            {activeSource === 'news' ? (
              <>
                <button
                  onClick={() => loadDailyNews(true)}
                  disabled={isLoadingDailyNews}
                  className="text-[#18181B] dark:text-[#F4F4F5] border-b border-[#18181B] dark:border-[#F4F4F5] pb-0.5 hover:text-[#9A3412] dark:hover:text-[#D97706] hover:border-[#9A3412] cursor-pointer"
                >
                  {isLoadingDailyNews ? 'Refreshing...' : 'Refresh Morning Edition'}
                </button>
                <button
                  onClick={onOpenImporter}
                  className="text-[#9A3412] dark:text-[#D97706] hover:underline cursor-pointer"
                >
                  Import Custom RSS Feed
                </button>
              </>
            ) : activeSource === 'custom' ? (
              <button
                onClick={onOpenImporter}
                className="text-[#18181B] dark:text-[#F4F4F5] border-b border-[#18181B] dark:border-[#F4F4F5] pb-0.5 hover:text-[#9A3412] cursor-pointer"
              >
                Import EPUB, RSS or Text
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleSearchGutenberg(undefined, selectedGenre !== 'all' ? selectedGenre : '')}
                  className="text-[#18181B] dark:text-[#F4F4F5] border-b border-[#18181B] dark:border-[#F4F4F5] pb-0.5 hover:text-[#9A3412] cursor-pointer"
                >
                  Browse Gutenberg ({currentLangInfo.name})
                </button>
                <button
                  onClick={() => handleLoadWikipedia(selectedGenre)}
                  className="text-[#9A3412] dark:text-[#D97706] hover:underline cursor-pointer"
                >
                  Fetch Wikipedia Articles
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
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
              <article
                key={book.id}
                onClick={() => handleSelectAndPersistBook(book)}
                className="group flex flex-col justify-between py-6 border-b border-stone-200 dark:border-stone-800 cursor-pointer transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA] mb-2">
                    <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                      <span className="uppercase tracking-wider text-[#9A3412] dark:text-[#D97706]">
                        {genre?.label.split('&')[0].trim() || 'Literature'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {isFull
                          ? `FULL NOVEL · ${book.chunks.length} CHAPTERS`
                          : `${book.chunks.length} ${book.chunks.length === 1 ? 'sec' : 'ch'}`}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{book.estimatedReadTimeMinutes} min</span>
                    </div>

                    {isRemovable && (
                      <button
                        onClick={(e) => handleDeleteBook(e, book.id)}
                        title="Remove from library"
                        className="p-0.5 text-[#71717A] dark:text-[#A1A1AA] hover:text-red-600 transition-colors cursor-pointer opacity-60 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <h3 className="font-display text-lg font-bold tracking-tight text-[#18181B] dark:text-[#F4F4F5] group-hover:text-[#9A3412] dark:group-hover:text-[#D97706] transition-colors mb-1 line-clamp-2 leading-snug">
                    {book.title}
                  </h3>

                  <p className="font-serif italic text-xs text-[#71717A] dark:text-[#A1A1AA] mb-2.5">
                    by {book.author}
                  </p>

                  <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed line-clamp-2 mb-4">
                    {book.summary}
                  </p>

                  {noticeForThis && (
                    <div
                      className={`mb-2 text-[11px] font-medium flex items-center gap-1 ${
                        noticeForThis.isError
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-[#9A3412] dark:text-[#D97706]'
                      }`}
                    >
                      {!noticeForThis.isError && <Check className="w-3 h-3 shrink-0" />}
                      <span>{noticeForThis.message}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                  <span className="text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA] truncate">
                    {hasProgress
                      ? `Sec ${(book.currentChunkIndex || 0) + 1}/${book.chunks.length} · ${book.wordCount}w`
                      : `${book.wordCount} words`}
                  </span>

                  <div className="flex items-center gap-3 shrink-0">
                    {canInsertFullNovel && (
                      <button
                        type="button"
                        data-testid="insert-full-novel-btn"
                        disabled={Boolean(insertingNovelId)}
                        onClick={(e) => handleInsertFullNovel(e, book)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#9A3412] dark:hover:text-[#D97706] border-b border-stone-300 dark:border-stone-700 hover:border-[#9A3412] transition-colors cursor-pointer disabled:opacity-50"
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

                    <span className="inline-flex items-center gap-1 font-medium text-[#18181B] dark:text-[#F4F4F5] group-hover:text-[#9A3412] dark:group-hover:text-[#D97706] transition-colors">
                      {hasProgress ? 'Resume' : 'Read'}
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
