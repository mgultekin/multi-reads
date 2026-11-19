import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Upload,
  FileText,
  Globe,
  BookOpen,
  Check,
  Loader2,
  Rss,
  ArrowRight,
  Sparkles,
  Search,
  Download,
} from 'lucide-react';
import { ContentItem, GenreId, LanguageCode } from '../types/index.ts';
import { GENRES, SUPPORTED_LANGUAGES } from '../data/constants.ts';
import { contentService } from '../services/contentService.ts';
import { storageService } from '../services/storageService.ts';
import { parseEpubOrDocumentFile, ParsedChapter } from '../services/epubParser.ts';
import { getBookSourceLabel, getEditionMeta, isFullNovelItem } from '../utils/editionMeta.ts';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetLang: LanguageCode;
  onImportComplete: (book: ContentItem) => void;
  books?: ContentItem[];
  onSelectBook?: (book: ContentItem) => void;
  initialGenre?: GenreId | 'all';
  onBooksUpdated?: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  targetLang,
  onImportComplete,
  books,
  onSelectBook,
  initialGenre = 'all',
  onBooksUpdated,
}) => {
  const hasBrowseCatalog = Array.isArray(books);
  const [activeTab, setActiveTab] = useState<'browse' | 'file' | 'paste' | 'wiki' | 'rss'>(
    hasBrowseCatalog ? 'browse' : 'file'
  );
  const [browseQuery, setBrowseQuery] = useState('');
  const [browseGenre, setBrowseGenre] = useState<GenreId | 'all'>(initialGenre);
  const [browseSource, setBrowseSource] = useState<
    'all' | 'novels' | 'curated' | 'news' | 'wiki' | 'custom'
  >('all');
  const [localBooks, setLocalBooks] = useState<ContentItem[]>(books || []);
  const [isSearchingGutenberg, setIsSearchingGutenberg] = useState(false);
  const [insertingBookId, setInsertingBookId] = useState<string | null>(null);
  const [browseNotice, setBrowseNotice] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [selectedLang, setSelectedLang] = useState<LanguageCode>(targetLang);
  const [genre, setGenre] = useState<GenreId>('fiction');
  const [text, setText] = useState('');
  const [parsedChapters, setParsedChapters] = useState<ParsedChapter[] | undefined>(undefined);
  const [parsedFormat, setParsedFormat] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [wikiTopic, setWikiTopic] = useState('');
  const [rssUrl, setRssUrl] = useState('');
  const [importedRssArticles, setImportedRssArticles] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedLang(targetLang);
  }, [targetLang, isOpen]);

  useEffect(() => {
    if (books) {
      setLocalBooks(books);
    }
  }, [books]);

  useEffect(() => {
    if (isOpen) {
      setBrowseGenre(initialGenre);
      setError(null);
      setBrowseNotice(null);
    }
  }, [isOpen, initialGenre]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const filteredCatalog = useMemo(() => {
    const q = browseQuery.trim().toLowerCase();
    return localBooks.filter((b) => {
      if (b.language !== selectedLang) return false;
      if (browseGenre !== 'all' && b.genre !== browseGenre) return false;
      if (browseSource === 'novels' && !isFullNovelItem(b)) return false;
      if (browseSource === 'curated' && (b.source !== 'gutenberg' || isFullNovelItem(b))) return false;
      if (browseSource === 'news' && b.source !== 'news') return false;
      if (browseSource === 'wiki' && b.source !== 'wikipedia') return false;
      if (browseSource === 'custom' && b.source !== 'custom') return false;

      if (!q) return true;
      return (
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.summary.toLowerCase().includes(q)
      );
    });
  }, [localBooks, selectedLang, browseGenre, browseSource, browseQuery]);

  if (!isOpen) return null;

  const handleOpenBookFromBrowse = (book: ContentItem) => {
    if (onSelectBook) {
      onSelectBook(book);
    } else {
      onImportComplete(book);
    }
    onClose();
  };

  const handleGutenbergLiveSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSearchingGutenberg(true);
    setError(null);
    setBrowseNotice(null);
    try {
      const topic = browseGenre !== 'all' ? browseGenre : '';
      const results = await contentService.searchGutenberg(selectedLang, browseQuery, topic);
      for (const item of results) {
        await storageService.saveBook(item);
      }
      const updated = await storageService.getBooks();
      setLocalBooks(updated);
      onBooksUpdated?.();
      setBrowseNotice(
        results.length > 0
          ? `Found ${results.length} Project Gutenberg editions.`
          : 'No additional Gutenberg editions matched that query.'
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to search Project Gutenberg.');
    } finally {
      setIsSearchingGutenberg(false);
    }
  };

  const handleInsertFullInModal = async (e: React.MouseEvent, book: ContentItem) => {
    e.stopPropagation();
    if (insertingBookId) return;
    setInsertingBookId(book.id);
    setError(null);
    setBrowseNotice(null);
    try {
      const updated = await contentService.insertFullGutenbergNovel(book);
      const refreshed = await storageService.getBooks();
      setLocalBooks(refreshed);
      onBooksUpdated?.();
      setBrowseNotice(`Inserted complete ${updated.chunks.length}-chapter text for "${updated.title}".`);
    } catch (err: any) {
      setError(err?.message || 'Could not insert full novel from Gutenberg.');
    } finally {
      setInsertingBookId(null);
    }
  };

  const processSelectedFile = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const parsed = await parseEpubOrDocumentFile(file);
      setTitle(parsed.title || file.name.replace(/\.[^/.]+$/, ''));
      setAuthor(parsed.author || 'Imported Author');
      if (parsed.language) {
        setSelectedLang(parsed.language);
      }
      setText(parsed.fullText);
      setParsedChapters(parsed.chapters);
      setParsedFormat(`${parsed.format.toUpperCase()} · ${parsed.chapters.length} chapters · ${parsed.totalWords.toLocaleString()} words`);
    } catch (err: any) {
      setError(err.message || 'Could not parse the selected file.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleFetchWikipedia = async () => {
    if (!wikiTopic.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const article = await contentService.searchAndFetchWikipediaArticle(wikiTopic.trim(), selectedLang);
      setTitle(article.title);
      setAuthor('Wikipedia Contributors');
      setText(article.extract);
      setParsedChapters(undefined);
      setParsedFormat(
        `Wikipedia (${selectedLang.toUpperCase()}) · ${article.extract.split(/\s+/).filter(Boolean).length.toLocaleString()} words ready to import`
      );
      setActiveTab('paste');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch Wikipedia article.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchRss = async () => {
    const trimmed = rssUrl.trim();
    if (!trimmed) {
      setError('Please provide a valid RSS or Atom feed URL (e.g. https://es.globalvoices.org/feed/).');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const profile = storageService.getUserProfile();
      const baseLang = profile.nativeLanguage || 'English';
      const articles = await contentService.fetchCustomRssFeed(trimmed, selectedLang, baseLang);

      if (!articles || articles.length === 0) {
        throw new Error('No articles could be extracted from this feed.');
      }

      // Persist all articles into storage so they show up under the 'news' source tab in Library
      for (const article of articles) {
        await storageService.saveBook(article);
      }

      setImportedRssArticles(articles);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch or parse the external RSS feed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRssArticle = (article: ContentItem) => {
    onImportComplete(article);
    onClose();
  };

  const handleOpenFirstRssArticle = () => {
    if (importedRssArticles.length > 0) {
      handleSelectRssArticle(importedRssArticles[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('Please provide text or upload an EPUB/manuscript file to import.');
      return;
    }

    setIsLoading(true);
    try {
      const newArticle = contentService.createCustomArticle(
        title.trim() || 'Untitled Manuscript',
        author.trim() || 'Unknown Author',
        selectedLang,
        genre,
        text,
        parsedChapters
      );

      await storageService.saveBook(newArticle);
      onImportComplete(newArticle);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save imported text.');
    } finally {
      setIsLoading(false);
    }
  };

  const sampleRssFeeds: Record<LanguageCode, string> = {
    es: 'https://es.globalvoices.org/feed/',
    fr: 'https://fr.globalvoices.org/feed/',
    de: 'https://de.globalvoices.org/feed/',
    it: 'https://it.globalvoices.org/feed/',
    tr: 'https://tr.globalvoices.org/feed/',
    en: 'https://globalvoices.org/feed/',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl bg-white/95 dark:bg-[#16161A]/95 backdrop-blur-2xl rounded-3xl border border-black/[0.08] dark:border-white/[0.1] apple-glass-card p-6 text-stone-900 dark:text-stone-100 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200/70 dark:border-stone-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl font-bold tracking-tight">
                Discover & Import Library
              </h2>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded bg-black/[0.05] dark:bg-white/[0.08] text-stone-500 dark:text-stone-400">
                ⌘K
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-serif italic mt-0.5">
              Search local titles & Project Gutenberg, or import EPUBs, Wikipedia, and RSS feeds.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Discover & Import"
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Apple Segmented Mode Tabs */}
        <div className="flex gap-1.5 my-4 p-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] overflow-x-auto">
          {hasBrowseCatalog && (
            <button
              type="button"
              onClick={() => setActiveTab('browse')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full cursor-pointer transition-all whitespace-nowrap ${
                activeTab === 'browse'
                  ? 'bg-white dark:bg-[#2C2C32] text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              Browse & Filter
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full cursor-pointer transition-all whitespace-nowrap ${
              activeTab === 'file'
                ? 'bg-white dark:bg-[#2C2C32] text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            EPUB / File
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full cursor-pointer transition-all whitespace-nowrap ${
              activeTab === 'paste'
                ? 'bg-white dark:bg-[#2C2C32] text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Paste Text
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('wiki')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full cursor-pointer transition-all whitespace-nowrap ${
              activeTab === 'wiki'
                ? 'bg-white dark:bg-[#2C2C32] text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Wikipedia
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rss')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full cursor-pointer transition-all whitespace-nowrap ${
              activeTab === 'rss'
                ? 'bg-white dark:bg-[#2C2C32] text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Rss className="w-3.5 h-3.5" />
            RSS News
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Tab 1: Browse, Filter & Project Gutenberg Live Search */}
        {activeTab === 'browse' && (
          <div className="space-y-4">
            <form onSubmit={handleGutenbergLiveSearch} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoFocus
                  value={browseQuery}
                  onChange={(e) => setBrowseQuery(e.target.value)}
                  placeholder={`Filter ${SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang)?.name || ''} books or search Gutenberg...`}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-black/[0.03] dark:bg-white/[0.05] border border-stone-200/80 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-700"
                />
              </div>

              <button
                type="submit"
                disabled={isSearchingGutenberg}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#007AFF] hover:bg-[#0062CC] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shrink-0 disabled:opacity-60"
              >
                {isSearchingGutenberg ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Globe className="w-3.5 h-3.5" />
                )}
                <span>Search Gutenberg</span>
              </button>
            </form>

            {/* Genre + Source Filter Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-200/70 dark:border-stone-800">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'novels', label: 'Full Novels' },
                    { id: 'curated', label: 'Classics & Gutenberg' },
                    { id: 'news', label: 'Daily Press' },
                    { id: 'wiki', label: 'Wiki' },
                    { id: 'custom', label: 'Imported' },
                  ] as const
                ).map((src) => (
                  <button
                    key={src.id}
                    type="button"
                    onClick={() => setBrowseSource(src.id)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      browseSource === src.id
                        ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                        : 'bg-black/[0.04] dark:bg-white/[0.06] text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                    }`}
                  >
                    {src.label}
                  </button>
                ))}
              </div>

              <select
                aria-label="Filter genre"
                value={browseGenre}
                onChange={(e) => setBrowseGenre(e.target.value as GenreId | 'all')}
                className="px-2.5 py-1 text-[11px] font-medium bg-black/[0.04] dark:bg-white/[0.06] border border-transparent rounded-full text-stone-700 dark:text-stone-300 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-white dark:bg-[#16161A]">All Genres</option>
                {GENRES.map((g) => (
                  <option key={g.id} value={g.id} className="bg-white dark:bg-[#16161A]">
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            {browseNotice && (
              <div className="px-3 py-2 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-300">
                {browseNotice}
              </div>
            )}

            {/* Catalog Results */}
            <div className="max-h-72 overflow-y-auto divide-y divide-stone-200/70 dark:divide-stone-800/70 pr-1">
              {filteredCatalog.length === 0 ? (
                <div className="py-10 text-center text-xs text-stone-500 font-serif italic">
                  No local matches. Click &ldquo;Search Gutenberg&rdquo; above to fetch public-domain classics.
                </div>
              ) : (
                filteredCatalog.map((book) => {
                  const meta = getEditionMeta(book, book.currentChunkIndex || 0);
                  const gutenbergId = contentService.getGutenbergNumericId(book.id);
                  const canInsertFull = Boolean(gutenbergId && !meta.isFullNovel);
                  const isInserting = insertingBookId === book.id;

                  return (
                    <div
                      key={book.id}
                      onClick={() => handleOpenBookFromBrowse(book)}
                      className="py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.03] -mx-2 px-2 rounded-xl transition-colors group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="font-display font-semibold text-sm text-stone-900 dark:text-stone-100 group-hover:text-amber-800 dark:group-hover:text-amber-400 truncate">
                            {book.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap text-[11px] text-stone-500 dark:text-stone-400">
                          <span className="font-serif italic">by {book.author}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-stone-700 dark:text-stone-300">
                            {meta.scopeShortBadge}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="text-amber-800 dark:text-amber-400">
                            {getBookSourceLabel(book)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {canInsertFull && (
                          <button
                            type="button"
                            data-testid="insert-full-novel-btn"
                            disabled={isInserting}
                            onClick={(e) => handleInsertFullInModal(e, book)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/70 text-[11px] font-medium text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer disabled:opacity-60"
                          >
                            {isInserting ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Download className="w-3 h-3" />
                            )}
                            <span>{isInserting ? 'Loading...' : 'Insert Full Novel'}</span>
                          </button>
                        )}
                        <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-stone-900 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Wikipedia Fetch Bar */}
        {activeTab === 'wiki' && (
          <div className="mb-4 p-4 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200/60 dark:border-stone-800">
            <label className="block text-xs font-medium mb-1.5 text-stone-700 dark:text-stone-300">
              Wikipedia Topic Search in {SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang)?.name}:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={wikiTopic}
                onChange={(e) => setWikiTopic(e.target.value)}
                placeholder="e.g. Renacimiento, Existentialisme, Göbeklitepe..."
                className="flex-1 px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleFetchWikipedia}
                disabled={isLoading}
                className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Fetch Extract'}
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: EPUB / Manuscript Drag-and-Drop Zone */}
        {activeTab === 'file' && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`mb-4 p-6 border-2 border-dashed rounded-xl text-center transition-colors ${
              isDragging
                ? 'border-amber-600 bg-amber-50/40 dark:bg-amber-950/20'
                : 'border-stone-200 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-900/40'
            }`}
          >
            <BookOpen className="w-8 h-8 mx-auto text-amber-700 dark:text-amber-500 mb-2 stroke-[1.5]" />
            <p className="text-xs font-medium text-stone-800 dark:text-stone-200 mb-1">
              Drag & drop an .epub, .html, .md, or .txt book here
            </p>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mb-3">
              Automatically extracts EPUB OPF metadata (Title, Author, Language) and Spine chapters
            </p>
            <input
              type="file"
              accept=".epub,.txt,.md,.markdown,.html,.xhtml,.htm"
              onChange={handleFileUpload}
              className="text-xs text-stone-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-stone-200/80 dark:file:bg-stone-800 file:text-stone-800 dark:file:text-stone-200 cursor-pointer"
            />
            {parsedFormat && (
              <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                <Check className="w-3.5 h-3.5" />
                <span>Parsed: {parsedFormat}</span>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: RSS News Ingestion */}
        {activeTab === 'rss' && (
          <div className="space-y-4 mb-4">
            <div className="p-4 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200/60 dark:border-stone-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                  RSS / Atom News Feed URL ({SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang)?.name}):
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-stone-500">Target:</span>
                  <select
                    value={selectedLang}
                    onChange={(e) => setSelectedLang(e.target.value as LanguageCode)}
                    className="px-2 py-1 text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100"
                  >
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.flag} {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={rssUrl}
                  onChange={(e) => setRssUrl(e.target.value)}
                  placeholder="e.g. https://es.globalvoices.org/feed/"
                  className="flex-1 px-3 py-2 text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-600"
                />
                <button
                  type="button"
                  onClick={handleFetchRss}
                  disabled={isLoading || !rssUrl.trim()}
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Fetch & Ingest Feed'}
                </button>
              </div>

              {/* Sample Feed Quick Shortcut */}
              <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-stone-500">
                <span className="font-serif italic">Sample feed:</span>
                <button
                  type="button"
                  onClick={() => setRssUrl(sampleRssFeeds[selectedLang] || sampleRssFeeds.en)}
                  className="text-amber-700 dark:text-amber-400 hover:underline cursor-pointer font-mono"
                >
                  {sampleRssFeeds[selectedLang] || sampleRssFeeds.en}
                </button>
              </div>
            </div>

            {/* Display fetched RSS articles */}
            {importedRssArticles.length > 0 && (
              <div className="p-4 bg-white dark:bg-[#1E1B18] rounded-xl border border-stone-200 dark:border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-800 dark:text-stone-200">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Ingested {importedRssArticles.length} News Articles into Library</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenFirstRssArticle}
                    className="flex items-center gap-1 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    <span>Read First Story</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {importedRssArticles.map((article) => (
                    <div
                      key={article.id}
                      onClick={() => handleSelectRssArticle(article)}
                      className="group p-3 rounded-lg bg-stone-50 dark:bg-stone-900/60 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 border border-stone-200/60 dark:border-stone-800 hover:border-amber-500/60 transition-all cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-[10px] text-stone-400 font-mono mb-0.5 flex-wrap">
                          <span>{article.estimatedReadTimeMinutes} min read</span>
                          <span>·</span>
                          <span>{article.wordCount} words</span>
                          {article.license && (
                            <>
                              <span>·</span>
                              <span className="text-amber-800 dark:text-amber-400">{article.license}</span>
                            </>
                          )}
                          {article.preflightVocab && article.preflightVocab.length > 0 && (
                            <>
                              <span>·</span>
                              <span className="inline-flex items-center gap-0.5 text-amber-700 dark:text-amber-300">
                                <Sparkles className="w-2.5 h-2.5" />
                                {article.preflightVocab.length} key words
                              </span>
                            </>
                          )}
                        </div>
                        <h4 className="font-display text-xs font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-800 dark:group-hover:text-amber-400 truncate">
                          {article.title}
                        </h4>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 font-serif italic truncate">
                          by {article.author}
                        </p>
                      </div>

                      <span className="flex items-center gap-1 text-xs font-semibold text-stone-700 dark:text-stone-300 group-hover:text-amber-700 shrink-0">
                        <span>Open</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800">
              <span className="text-xs font-serif italic text-stone-500">
                {importedRssArticles.length > 0
                  ? 'All articles are saved in your library under "Daily Press".'
                  : 'Enter any valid RSS or Atom feed URL to ingest articles.'}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Regular Form for File, Paste & Wiki imports */}
        {activeTab !== 'rss' && activeTab !== 'browse' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Article or book title"
                  className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Author
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Author or publication name"
                  className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Language
                </label>
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value as LanguageCode)}
                  className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.flag} {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Genre Category
                </label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value as GenreId)}
                  className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                >
                  {GENRES.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {parsedChapters && parsedChapters.length > 1 && (
              <div className="p-3 bg-stone-50 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 rounded-lg">
                <div className="text-[11px] font-medium text-stone-600 dark:text-stone-400 mb-1.5">
                  Detected Chapter Spine ({parsedChapters.length} chapters)
                </div>
                <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                  {parsedChapters.map((ch, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] text-stone-700 dark:text-stone-300">
                      <span className="truncate">{idx + 1}. {ch.title}</span>
                      <span className="text-stone-400 shrink-0 ml-2">{ch.wordCount} words</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Manuscript / Article Content ({selectedLang.toUpperCase()})
              </label>
              <textarea
                required
                rows={6}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (activeTab === 'paste') {
                    setParsedChapters(undefined);
                    setParsedFormat(null);
                  }
                }}
                placeholder="Paste article, newsletter excerpt, or book chapters here..."
                className="w-full p-3 font-reader text-xs bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-600 leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !text.trim()}
                className="px-5 py-2 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-semibold rounded-lg shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isLoading ? 'Processing...' : 'Save & Open in Reader'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
