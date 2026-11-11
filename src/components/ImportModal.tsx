import React, { useState } from 'react';
import { X, Upload, FileText, Globe, Sparkles, Check, Loader2 } from 'lucide-react';
import { ContentItem, GenreId, LanguageCode } from '../types/index.ts';
import { GENRES, SUPPORTED_LANGUAGES } from '../data/constants.ts';
import { contentService } from '../services/contentService.ts';
import { storageService } from '../services/storageService.ts';

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
  const [activeTab, setActiveTab] = useState<'paste' | 'file' | 'wiki'>('paste');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [selectedLang, setSelectedLang] = useState<LanguageCode>(targetLang);
  const [genre, setGenre] = useState<GenreId>('essays');
  const [text, setText] = useState('');
  const [wikiTopic, setWikiTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setText(content);
    };
    reader.readAsText(file);
  };

  const handleFetchWikipedia = async () => {
    if (!wikiTopic.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const url = `https://${selectedLang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTopic.trim())}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Could not find Wikipedia topic "${wikiTopic}" in ${selectedLang.toUpperCase()}`);

      const data = await res.json();
      setTitle(data.title || wikiTopic);
      setAuthor('Wikipedia');
      setText(data.extract || '');
      setActiveTab('paste');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch Wikipedia article.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('Please provide text to import.');
      return;
    }

    setIsLoading(true);
    try {
      const newArticle = contentService.createCustomArticle(
        title.trim() || 'Untitled Article',
        author.trim() || 'Unknown Author',
        selectedLang,
        genre,
        text
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white dark:bg-[#1C1A18] rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6 text-stone-900 dark:text-stone-100 animate-in fade-in zoom-in-95">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
          <div>
            <h2 className="font-display text-xl font-bold">Import Literature or Magazine Article</h2>
            <p className="text-xs text-stone-500 font-serif italic">Turn any foreign language text into an interactive graded lesson.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Import Mode Tabs */}
        <div className="flex gap-2 my-4 border-b border-stone-100 dark:border-stone-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition-colors ${
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
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition-colors ${
              activeTab === 'wiki'
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Fetch Wikipedia
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition-colors ${
              activeTab === 'file'
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload File (.txt, .md)
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

        {/* Tab 3: File Upload */}
        {activeTab === 'file' && (
          <div className="mb-4 p-6 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-xl text-center">
            <Upload className="w-8 h-8 mx-auto text-stone-400 mb-2 stroke-[1.5]" />
            <p className="text-xs text-stone-600 dark:text-stone-400 mb-2">Select a .txt or .md manuscript file from your device</p>
            <input
              type="file"
              accept=".txt,.md,.text"
              onChange={handleFileUpload}
              className="text-xs text-stone-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-stone-100 dark:file:bg-stone-800 file:text-stone-800 dark:file:text-stone-200 cursor-pointer"
            />
          </div>
        )}

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

          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
              Article Text Content (Target Language)
            </label>
            <textarea
              required
              rows={8}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste article, newsletter excerpt, or book chapters here..."
              className="w-full p-3 font-reader text-xs bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-600 leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !text.trim()}
              className="px-5 py-2 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isLoading ? 'Processing...' : 'Save & Open in Reader'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
