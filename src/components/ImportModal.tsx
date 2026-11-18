import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, Globe, BookOpen, Check, Loader2, Rss, ArrowRight, Sparkles } from 'lucide-react';
import { ContentItem, GenreId, LanguageCode } from '../types/index.ts';
import { GENRES, SUPPORTED_LANGUAGES } from '../data/constants.ts';
import { contentService } from '../services/contentService.ts';
import { storageService } from '../services/storageService.ts';
import { parseEpubOrDocumentFile, ParsedChapter } from '../services/epubParser.ts';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetLang: LanguageCode;
  onImportComplete: (book: ContentItem) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  targetLang,
  onImportComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'paste' | 'file' | 'wiki' | 'rss'>('file');
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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white dark:bg-[#1C1A18] rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6 text-stone-900 dark:text-stone-100 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
          <div>
            <h2 className="font-display text-xl font-bold">Import Manuscript, RSS Feed, or EPUB</h2>
            <p className="text-xs text-stone-500 font-serif italic">
              Add books, articles, or external RSS news feeds with automated CEFR leveling and pre-flight vocabulary.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Import Mode Tabs */}
        <div className="flex gap-2 my-4 border-b border-stone-100 dark:border-stone-800 pb-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'file'
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            EPUB / File Drop
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'paste'
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Paste Text
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('wiki')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'wiki'
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Wikipedia
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rss')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'rss'
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900'
            }`}
          >
            <Rss className="w-3.5 h-3.5" />
            RSS News
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg text-xs text-red-700 dark:text-red-300">
            {error}
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
        {activeTab !== 'rss' && (
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
