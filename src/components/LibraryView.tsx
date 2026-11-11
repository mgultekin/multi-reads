import React, { useState, useEffect } from 'react';
import {
  Search,
  BookOpen,
  Plus,
  Loader2,
  Sparkles,
  ArrowRight,
  Compass,
  Trash2,
  Bookmark,
} from 'lucide-react';
import { ContentItem, GenreId, LanguageCode } from '../types/index.ts';
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
    'all' | 'curated' | 'gutenberg' | 'wikipedia' | 'custom'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [books, setBooks] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchingGutenberg, setIsSearchingGutenberg] = useState(false);

  const currentLangInfo = SUPPORTED_LANGUAGES.find((l) => l.code === targetLang) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    loadBooks();
  }, [targetLang]);

  const loadBooks = async () => {
    setIsLoading(true);
    try {
      const stored = await storageService.getBooks();
      setBooks(stored);
    } catch (e) {
      console.warn('Error fetching books', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchGutenberg = async (e?: React.FormEvent, customTopic?: string) => {
    if (e) e.preventDefault();
    setIsSearchingGutenberg(true);
    try {
      const topic = customTopic || (selectedGenre !== 'all' ? selectedGenre : '');
      const results = await contentService.searchGutenberg(targetLang, searchQuery, topic);
      for (const item of results) {
        await storageService.saveBook(item);
      }
      await loadBooks();
      setActiveSource('gutenberg');
    } catch (err) {
      console.warn('Gutenberg search error', err);
    } finally {
      setIsSearchingGutenberg(false);
    }
  };

  const handleLoadWikipedia = async (genre: GenreId) => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const handleDeleteBook = async (e: React.MouseEvent, bookId: string) => {
    e.stopPropagation();
    await storageService.deleteBook(bookId);
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
  };

  // Identify most recently read book in current target language for "Continue Reading" shelf
  const continueReadingBook = books
    .filter((b) => b.language === targetLang && ((b.currentChunkIndex && b.currentChunkIndex > 0) || b.lastReadAt))
    .sort((a, b) => (b.lastReadAt || 0) - (a.lastReadAt || 0))[0];

  // Filter books by language, genre, source tab, and search query
  const filteredBooks = books.filter((book) => {
    const matchesLang = book.language === targetLang;
    const matchesGenre = selectedGenre === 'all' || book.genre === selectedGenre;
    const matchesSource =
      activeSource === 'all'
        ? true
        : activeSource === 'curated'
        ? book.source === 'gutenberg' && !book.id.startsWith('gutenberg-search-')
        : activeSource === 'gutenberg'
        ? book.source === 'gutenberg'
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

  // Calculate book counts per genre for the current target language
  const genreCounts = books.reduce((acc, b) => {
    if (b.language === targetLang) {
      acc[b.genre] = (acc[b.genre] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const activeGenreInfo = GENRES.find((g) => g.id === selectedGenre);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pb-6 border-b border-stone-200/80 dark:border-stone-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-amber-800 dark:text-amber-400 mb-1.5">
            <span>Literary & Cultural Archive</span>
            <span aria-hidden="true">·</span>
            <span>{currentLangInfo.name}</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Public Domain Library
          </h1>

          <p className="mt-1.5 text-sm text-stone-600 dark:text-stone-400 max-w-xl font-serif">
            Browse world classics and open articles categorized by literary genre. Filter by Fiction, Philosophy, Science, and History for targeted immersion.
          </p>
        </div>

        {/* Action Button: Custom Importer */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenImporter}
            className="flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-medium rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Import EPUB / Book
          </button>
        </div>
      </div>

      {/* Continue Reading Shelf (if user has an active book in this language) */}
      {continueReadingBook && (
        <div className="mb-8 p-5 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 mb-1">
              <Bookmark className="w-3.5 h-3.5" />
              <span>Continue Reading in {currentLangInfo.name}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">
                Section {(continueReadingBook.currentChunkIndex || 0) + 1} of {continueReadingBook.chunks.length}
              </span>
            </div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 truncate">
              {continueReadingBook.title}
            </h2>
            <p className="text-xs font-serif italic text-stone-600 dark:text-stone-400">
              by {continueReadingBook.author}
            </p>
          </div>

          <button
            onClick={() => onSelectBook(continueReadingBook)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
          >
            Resume Section {(continueReadingBook.currentChunkIndex || 0) + 1}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Primary Genre Navigation Strip */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-amber-700" />
            Select Genre Category:
          </span>

          {selectedGenre !== 'all' && (
            <button
              onClick={() => setSelectedGenre('all')}
              className="text-xs text-amber-800 dark:text-amber-400 hover:underline cursor-pointer"
            >
              Reset to All Genres
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          <button
            onClick={() => setSelectedGenre('all')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              selectedGenre === 'all'
                ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100 shadow-xs'
                : 'bg-white dark:bg-[#1C1A18] border-stone-200/80 dark:border-stone-800/80 text-stone-700 dark:text-stone-300 hover:border-amber-600/50'
            }`}
          >
            <span className="text-xs font-bold block truncate">All Genres</span>
            <span className="text-[10px] opacity-75 font-mono mt-1">
              {books.filter((b) => b.language === targetLang).length} works
            </span>
          </button>

          {GENRES.map((genre) => {
            const isSelected = selectedGenre === genre.id;
            const count = genreCounts[genre.id] || 0;

            return (
              <button
                key={genre.id}
                onClick={() => setSelectedGenre(genre.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100 shadow-xs'
                    : 'bg-white dark:bg-[#1C1A18] border-stone-200/80 dark:border-stone-800/80 text-stone-700 dark:text-stone-300 hover:border-amber-600/50'
                }`}
              >
                <span className="text-xs font-bold block truncate">{genre.label}</span>
                <span className="text-[10px] opacity-75 font-mono mt-1">
                  {count} {count === 1 ? 'work' : 'works'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Genre Banner & Exploration Affordance */}
      {selectedGenre !== 'all' && activeGenreInfo && (
        <div className="mb-8 p-4 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-800 dark:text-amber-400 block mb-0.5">
              Exploring Genre: {activeGenreInfo.label}
            </span>
            <p className="text-xs text-stone-700 dark:text-stone-300 font-serif">
              {activeGenreInfo.description}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleSearchGutenberg(undefined, selectedGenre)}
              disabled={isSearchingGutenberg}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-stone-900 border border-amber-300 dark:border-amber-700 hover:border-amber-500 text-amber-900 dark:text-amber-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              {isSearchingGutenberg ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                  Fetching Gutenberg...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Fetch More {activeGenreInfo.label} from Gutenberg
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Search & Source Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <form onSubmit={handleSearchGutenberg} className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${currentLangInfo.name} library or Gutenberg...`}
            className="w-full pl-10 pr-4 py-2 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:border-amber-600 dark:focus:border-amber-500 transition-colors"
          />
        </form>

        {/* Complete 5-Option Source Segmented Control */}
        <div className="flex items-center p-1 bg-stone-100 dark:bg-stone-900 rounded-lg border border-stone-200/60 dark:border-stone-800/60 w-full sm:w-auto overflow-x-auto">
          {(
            [
              { id: 'all', label: 'All Sources' },
              { id: 'curated', label: 'Curated Classics' },
              { id: 'gutenberg', label: 'Gutenberg' },
              { id: 'wikipedia', label: 'Wikipedia' },
              { id: 'custom', label: 'Imported' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSource(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                activeSource === tab.id
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Books Grid */}
      {isLoading ? (
        <div className="py-24 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-600 mb-3" />
          <p className="text-xs font-serif italic text-stone-500">Retrieving manuscripts...</p>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-stone-200 dark:border-stone-800 rounded-2xl p-8">
          <BookOpen className="w-10 h-10 mx-auto text-stone-400 mb-3 stroke-[1.5]" />
          <h3 className="font-display text-lg font-bold text-stone-800 dark:text-stone-200 mb-1">
            No readings found for {selectedGenre !== 'all' ? selectedGenre : 'this filter'} in {currentLangInfo.name}
          </h3>
          <p className="text-stone-500 text-xs max-w-sm mx-auto mb-6">
            Click below to fetch public domain books or articles in this genre directly.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => handleSearchGutenberg(undefined, selectedGenre !== 'all' ? selectedGenre : '')}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Search Gutenberg for {selectedGenre !== 'all' ? selectedGenre : 'Literature'}
            </button>
            <button
              onClick={() => handleLoadWikipedia(selectedGenre === 'all' ? 'philosophy' : selectedGenre)}
              className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              Fetch Wikipedia Articles
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((book) => {
            const genre = GENRES.find((g) => g.id === book.genre);
            const isRemovable =
              book.source === 'custom' ||
              book.source === 'wikipedia' ||
              book.id.startsWith('gutenberg-search-');
            const hasProgress = (book.currentChunkIndex || 0) > 0;

            return (
              <div
                key={book.id}
                onClick={() => onSelectBook(book)}
                className="group flex flex-col justify-between p-6 bg-white dark:bg-[#1C1A18] rounded-xl border border-stone-200/80 dark:border-stone-800/80 hover:border-amber-600/50 dark:hover:border-amber-500/50 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <div>
                  {/* Clean unboxed metadata kicker */}
                  <div className="flex items-center justify-between gap-2 text-xs text-stone-400 dark:text-stone-500 mb-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium uppercase tracking-wider text-amber-800 dark:text-amber-400">
                        {genre?.label || 'Literature'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{book.estimatedReadTimeMinutes} min read</span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{book.source}</span>
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

                  <h3 className="font-display text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100 group-hover:text-amber-800 dark:group-hover:text-amber-400 transition-colors mb-1 line-clamp-2">
                    {book.title}
                  </h3>

                  <p className="font-serif italic text-xs text-stone-500 dark:text-stone-400 mb-3">
                    by {book.author}
                  </p>

                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed line-clamp-3 mb-6">
                    {book.summary}
                  </p>
                </div>

                {/* Card footer: Read Action */}
                <div className="pt-4 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-stone-400 dark:text-stone-500">
                    {hasProgress
                      ? `Sec ${(book.currentChunkIndex || 0) + 1}/${book.chunks.length} · ${book.wordCount}w`
                      : `${book.chunks.length} sections · ${book.wordCount} words`}
                  </span>

                  <span className="flex items-center gap-1.5 text-xs font-semibold text-stone-900 dark:text-stone-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                    {hasProgress ? 'Resume' : 'Open Reader'}
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
