import React, { useState, useEffect } from 'react';
import {
  Volume2,
  Check,
  BookOpen,
  Trash2,
  Download,
  SkipForward,
  Plus,
  RotateCw,
} from 'lucide-react';
import { Flashcard, LanguageCode } from '../types/index.ts';
import { SUPPORTED_LANGUAGES } from '../data/constants.ts';
import { storageService } from '../services/storageService.ts';
import { INSTANT_LEXICON } from '../services/instantLexicon.ts';

interface WordbookViewProps {
  targetLang: LanguageCode;
  onAwardXP: (amount: number) => void;
  onOpenReader: () => void;
}

export const WordbookView: React.FC<WordbookViewProps> = ({
  targetLang,
  onAwardXP,
  onOpenReader,
}) => {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [filterScope, setFilterScope] = useState<'all' | 'due' | 'mastered'>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [practiceMode, setPracticeMode] = useState<'flip' | 'cloze' | 'list'>('flip');
  const [userFillInput, setUserFillInput] = useState('');
  const [fillFeedback, setFillFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [revealedHintLetters, setRevealedHintLetters] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newTranslation, setNewTranslation] = useState('');
  const [newSentence, setNewSentence] = useState('');

  const activeLangInfo = SUPPORTED_LANGUAGES.find((l) => l.code === targetLang) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    loadDeck();
  }, [targetLang]);

  const loadDeck = async () => {
    setIsLoading(true);
    try {
      const stored = await storageService.getFlashcards(targetLang);
      setCards(stored);
      setCurrentIndex(0);
      setIsFlipped(false);
      setFillFeedback('idle');
      setUserFillInput('');
      setRevealedHintLetters(0);
    } catch (e) {
      console.warn('Failed to load flashcards', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter cards by SRS schedule scope
  const now = Date.now();
  const dueCards = cards.filter((c) => (c.nextReviewAt || 0) <= now && c.masteryLevel < 5);
  const masteredCards = cards.filter((c) => c.masteryLevel >= 5);

  const filteredDeck =
    filterScope === 'due'
      ? dueCards
      : filterScope === 'mastered'
      ? masteredCards
      : cards;

  const safeIndex = filteredDeck.length > 0 ? Math.min(currentIndex, filteredDeck.length - 1) : 0;
  const currentCard: Flashcard | undefined = filteredDeck[safeIndex];

  const handlePlayAudio = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = activeLangInfo.speechLocale;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const handleScoreCard = async (grade: boolean | 'hard' | 'good' | 'easy') => {
    if (!currentCard) return;

    const isPositive = grade === true || grade === 'good' || grade === 'easy';
    const isEasy = grade === 'easy';
    const masteryDelta = isEasy ? 2 : isPositive ? 1 : -1;
    const nextIntervalMs = isEasy
      ? 1000 * 60 * 60 * 24 * 5
      : isPositive
      ? 1000 * 60 * 60 * 24 * 3
      : 1000 * 60 * 60 * 6;

    const updated: Flashcard = {
      ...currentCard,
      reviewCount: (currentCard.reviewCount || 0) + 1,
      masteryLevel: Math.min(5, Math.max(0, (currentCard.masteryLevel || 0) + masteryDelta)),
      nextReviewAt: Date.now() + nextIntervalMs,
    };

    await storageService.saveFlashcard(updated);
    setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));

    if (isPositive) {
      onAwardXP(isEasy ? 15 : 10);
    }

    setIsFlipped(false);
    setFillFeedback('idle');
    setUserFillInput('');
    setRevealedHintLetters(0);

    if (safeIndex < filteredDeck.length - 1) {
      setCurrentIndex(safeIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  // Keyboard shortcuts for Flip Deck (Space to flip; 1/2/3 to grade Hard/Good/Easy when flipped)
  useEffect(() => {
    if (practiceMode !== 'flip' || !currentCard) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName)) return;

      if (e.key === ' ') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped) {
        if (e.key === '1') {
          e.preventDefault();
          handleScoreCard('hard');
        } else if (e.key === '2') {
          e.preventDefault();
          handleScoreCard('good');
        } else if (e.key === '3') {
          e.preventDefault();
          handleScoreCard('easy');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [practiceMode, currentCard, isFlipped, safeIndex, filteredDeck.length]);

  const handleLoadStarterWords = async () => {
    const langDict = INSTANT_LEXICON[targetLang] || INSTANT_LEXICON.es;
    const baseLangName = storageService.getUserProfile().nativeLanguage || 'English';
    const entries = Object.entries(langDict)
      .filter(([_w, e]) => e.pos !== 'Article' && e.pos !== 'Preposition' && e.pos !== 'Conjunction')
      .slice(0, 5);

    const createdCards: Flashcard[] = [];
    for (const [idx, [word, entry]] of entries.entries()) {
      const card: Flashcard = {
        id: `starter-${targetLang}-${Date.now()}-${idx}`,
        word,
        lemma: entry.lemma,
        partOfSpeech: entry.pos,
        morphology: entry.morph,
        translation:
          entry.translations[baseLangName] ||
          entry.translations.English ||
          Object.values(entry.translations)[0] ||
          word,
        contextSentence: `${word.charAt(0).toUpperCase() + word.slice(1)} (${entry.pos.toLowerCase()})`,
        sentenceTranslation: `Starter vocabulary from ${activeLangInfo.name} core lexicon.`,
        language: targetLang,
        genre: 'philosophy',
        bookTitle: 'Core Literary Lexicon',
        createdAt: Date.now() - idx,
        nextReviewAt: Date.now(),
        reviewCount: 0,
        easeFactor: 2.5,
        masteryLevel: 0,
      };
      await storageService.saveFlashcard(card);
      createdCards.push(card);
    }

    setCards((prev) => [...createdCards, ...prev]);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleCreateCustomCard = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanWord = newWord.trim();
    const cleanTrans = newTranslation.trim();
    if (!cleanWord || !cleanTrans) return;

    const card: Flashcard = {
      id: `custom-card-${Date.now()}`,
      word: cleanWord,
      lemma: cleanWord.toLowerCase(),
      partOfSpeech: 'Vocabulary',
      morphology: 'Custom card',
      translation: cleanTrans,
      contextSentence: newSentence.trim() || `${cleanWord}`,
      sentenceTranslation: newSentence.trim() ? cleanTrans : `Meaning: ${cleanTrans}`,
      language: targetLang,
      genre: 'fiction',
      bookTitle: 'Personal Wordbook',
      createdAt: Date.now(),
      nextReviewAt: Date.now(),
      reviewCount: 0,
      easeFactor: 2.5,
      masteryLevel: 0,
    };

    await storageService.saveFlashcard(card);
    setCards((prev) => [card, ...prev]);
    setNewWord('');
    setNewTranslation('');
    setNewSentence('');
    setIsAddOpen(false);
    setCurrentIndex(0);
    setIsFlipped(false);
    onAwardXP(5);
  };

  const stripAccents = (str: string) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  const handleCheckCloze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCard || !userFillInput.trim()) return;

    const targetClean = currentCard.word.trim().toLowerCase();
    const inputClean = userFillInput.trim().toLowerCase();

    if (inputClean === targetClean || stripAccents(inputClean) === stripAccents(targetClean)) {
      setFillFeedback('correct');
      onAwardXP(15);
      setTimeout(() => {
        handleScoreCard(true);
      }, 900);
    } else {
      setFillFeedback('incorrect');
    }
  };

  const handleSkipCloze = () => {
    setFillFeedback('idle');
    setUserFillInput('');
    setRevealedHintLetters(0);
    if (safeIndex < filteredDeck.length - 1) {
      setCurrentIndex(safeIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handleHint = () => {
    if (!currentCard) return;
    setRevealedHintLetters((prev) => Math.min(currentCard.word.length, prev + 1));
  };

  const handleDeleteCard = async (id: string) => {
    await storageService.deleteFlashcard(id);
    setCards((prev) => prev.filter((c) => c.id !== id));
    if (currentIndex >= filteredDeck.length - 1) {
      setCurrentIndex(Math.max(0, filteredDeck.length - 2));
    }
  };

  const handleExportCSV = () => {
    if (cards.length === 0) return;
    const headers = ['Word', 'Translation', 'Lemma', 'PartOfSpeech', 'ContextSentence', 'SentenceTranslation', 'MasteryLevel'];
    const escapeCsv = (val: string | number | undefined) => {
      const str = String(val ?? '').replace(/"/g, '""');
      return `"${str}"`;
    };
    const rows = cards.map((c) =>
      [
        escapeCsv(c.word),
        escapeCsv(c.translation),
        escapeCsv(c.lemma),
        escapeCsv(c.partOfSpeech),
        escapeCsv(c.contextSentence),
        escapeCsv(c.sentenceTranslation),
        escapeCsv(c.masteryLevel),
      ].join(',')
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `foliopress-wordbook-${targetLang}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportAnkiTSV = () => {
    if (cards.length === 0) return;
    const cleanTab = (val: string | number | undefined) =>
      String(val ?? '').replace(/[\t\r\n]+/g, ' ').trim();
    const rows = cards.map((c) =>
      [
        cleanTab(c.word),
        cleanTab(`${c.translation} (${c.partOfSpeech} · root: ${c.lemma})`),
        cleanTab(c.contextSentence),
        cleanTab(c.sentenceTranslation),
        cleanTab(`foliopress ${targetLang} ${c.genre || 'literature'}`),
      ].join('\t')
    );
    const tsvContent = ['#separator:tab\n#html:false', ...rows].join('\n');
    const blob = new Blob([tsvContent], { type: 'text/tab-separated-values;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `foliopress-anki-${targetLang}.tsv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Unicode-safe Cloze sentence helper
  const renderClozeSentence = (sentence: string, targetWord: string) => {
    const escaped = targetWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const unicodeRegex = new RegExp(`(?<![\\p{L}])${escaped}(?![\\p{L}])`, 'giu');
    const parts = sentence.split(unicodeRegex);

    const blankNode = (
      <span className="font-mono font-semibold text-[#9A3412] dark:text-[#D97706] underline underline-offset-4 px-1">
        {revealedHintLetters > 0
          ? targetWord.slice(0, revealedHintLetters) +
            '_'.repeat(Math.max(1, targetWord.length - revealedHintLetters))
          : '[ ______ ]'}
      </span>
    );

    if (parts.length === 1) {
      const lowerSent = sentence.toLowerCase();
      const idx = lowerSent.indexOf(targetWord.toLowerCase());
      if (idx !== -1) {
        return (
          <span>
            {sentence.slice(0, idx)}
            {blankNode}
            {sentence.slice(idx + targetWord.length)}
          </span>
        );
      }
      return (
        <span>
          {sentence} {blankNode}
        </span>
      );
    }

    return (
      <span>
        {parts[0]}
        {blankNode}
        {parts.slice(1).join('')}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <p className="font-serif italic text-[#71717A] dark:text-[#A1A1AA] text-sm">
          Retrieving your vocabulary manuscript...
        </p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center">
        <BookOpen className="w-8 h-8 mx-auto text-[#71717A] dark:text-[#A1A1AA] mb-4 stroke-[1.25]" />
        <h2 className="font-display text-2xl font-bold text-[#18181B] dark:text-[#F4F4F5] mb-2">
          No {activeLangInfo.name} Words Saved
        </h2>
        <p className="text-[#71717A] dark:text-[#A1A1AA] text-sm max-w-md mx-auto mb-8 font-serif italic">
          Tap any word while reading to preserve it here, load 5 literary starter terms, or enter a custom entry.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-6 mb-8 text-xs font-medium">
          <button
            onClick={onOpenReader}
            className="text-[#18181B] dark:text-[#F4F4F5] border-b border-[#18181B] dark:border-[#F4F4F5] pb-0.5 hover:text-[#9A3412] hover:border-[#9A3412] transition-colors cursor-pointer"
          >
            Open Reader
          </button>
          <button
            onClick={handleLoadStarterWords}
            className="text-[#9A3412] dark:text-[#D97706] hover:underline transition-colors cursor-pointer"
          >
            Load 5 Starter Words
          </button>
          <button
            onClick={() => setIsAddOpen((prev) => !prev)}
            className="inline-flex items-center gap-1 text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Word</span>
          </button>
        </div>

        {isAddOpen && (
          <form
            onSubmit={handleCreateCustomCard}
            className="text-left py-5 border-y border-stone-200 dark:border-stone-800 space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                required
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                placeholder={`${activeLangInfo.name} word`}
                className="px-0 py-1.5 text-xs bg-transparent border-b border-stone-200 dark:border-stone-800 text-[#18181B] dark:text-[#F4F4F5] focus:outline-none focus:border-[#9A3412] dark:focus:border-[#D97706]"
              />
              <input
                type="text"
                required
                value={newTranslation}
                onChange={(e) => setNewTranslation(e.target.value)}
                placeholder="Translation / meaning"
                className="px-0 py-1.5 text-xs bg-transparent border-b border-stone-200 dark:border-stone-800 text-[#18181B] dark:text-[#F4F4F5] focus:outline-none focus:border-[#9A3412] dark:focus:border-[#D97706]"
              />
            </div>
            <input
              type="text"
              value={newSentence}
              onChange={(e) => setNewSentence(e.target.value)}
              placeholder="Optional context sentence"
              className="w-full px-0 py-1.5 text-xs bg-transparent border-b border-stone-200 dark:border-stone-800 text-[#18181B] dark:text-[#F4F4F5] focus:outline-none focus:border-[#9A3412] dark:focus:border-[#D97706]"
            />
            <div className="flex justify-end gap-4 text-xs">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="font-semibold text-[#9A3412] dark:text-[#D97706] hover:underline cursor-pointer"
              >
                Save Word
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Slim Header + Underlined Mode Links */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-5 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#18181B] dark:text-[#F4F4F5]">
            Wordbook
          </h1>
          <span className="text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">
            {activeLangInfo.name} · {dueCards.length} due
          </span>
        </div>

        {/* Plain-Text Underlined Mode Switcher + Minimal Actions */}
        <div className="flex flex-wrap items-center gap-5 text-xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setPracticeMode('flip');
                setIsFlipped(false);
              }}
              className={`pb-0.5 border-b transition-colors cursor-pointer ${
                practiceMode === 'flip'
                  ? 'text-[#18181B] dark:text-[#F4F4F5] font-semibold border-[#9A3412] dark:border-[#D97706]'
                  : 'text-[#71717A] dark:text-[#A1A1AA] border-transparent hover:text-[#18181B] dark:hover:text-[#F4F4F5]'
              }`}
            >
              Cards
            </button>

            <button
              onClick={() => {
                setPracticeMode('cloze');
                setFillFeedback('idle');
                setUserFillInput('');
              }}
              className={`pb-0.5 border-b transition-colors cursor-pointer ${
                practiceMode === 'cloze'
                  ? 'text-[#18181B] dark:text-[#F4F4F5] font-semibold border-[#9A3412] dark:border-[#D97706]'
                  : 'text-[#71717A] dark:text-[#A1A1AA] border-transparent hover:text-[#18181B] dark:hover:text-[#F4F4F5]'
              }`}
            >
              Cloze
            </button>

            <button
              onClick={() => setPracticeMode('list')}
              className={`pb-0.5 border-b transition-colors cursor-pointer ${
                practiceMode === 'list'
                  ? 'text-[#18181B] dark:text-[#F4F4F5] font-semibold border-[#9A3412] dark:border-[#D97706]'
                  : 'text-[#71717A] dark:text-[#A1A1AA] border-transparent hover:text-[#18181B] dark:hover:text-[#F4F4F5]'
              }`}
            >
              Index ({cards.length})
            </button>
          </div>

          <span aria-hidden="true" className="text-stone-300 dark:text-stone-700 hidden sm:inline">
            |
          </span>

          <div className="flex items-center gap-3 text-[#71717A] dark:text-[#A1A1AA]">
            <button
              onClick={() => setIsAddOpen((prev) => !prev)}
              className="inline-flex items-center gap-1 hover:text-[#18181B] dark:hover:text-[#F4F4F5] transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>

            <button
              onClick={handleExportCSV}
              title="Export deck to CSV"
              className="inline-flex items-center gap-1 hover:text-[#9A3412] dark:hover:text-[#D97706] transition-colors cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>CSV</span>
            </button>

            <button
              onClick={handleExportAnkiTSV}
              title="Export deck to Anki TSV format"
              className="inline-flex items-center gap-1 hover:text-[#9A3412] dark:hover:text-[#D97706] transition-colors cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>Anki</span>
            </button>
          </div>
        </div>
      </div>

      {isAddOpen && (
        <form
          onSubmit={handleCreateCustomCard}
          className="py-5 border-b border-stone-200 dark:border-stone-800 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              type="text"
              required
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              placeholder={`${activeLangInfo.name} word`}
              className="px-0 py-1.5 text-xs bg-transparent border-b border-stone-200 dark:border-stone-800 text-[#18181B] dark:text-[#F4F4F5] focus:outline-none focus:border-[#9A3412] dark:focus:border-[#D97706]"
            />
            <input
              type="text"
              required
              value={newTranslation}
              onChange={(e) => setNewTranslation(e.target.value)}
              placeholder="Translation / meaning"
              className="px-0 py-1.5 text-xs bg-transparent border-b border-stone-200 dark:border-stone-800 text-[#18181B] dark:text-[#F4F4F5] focus:outline-none focus:border-[#9A3412] dark:focus:border-[#D97706]"
            />
            <input
              type="text"
              value={newSentence}
              onChange={(e) => setNewSentence(e.target.value)}
              placeholder="Optional context sentence"
              className="px-0 py-1.5 text-xs bg-transparent border-b border-stone-200 dark:border-stone-800 text-[#18181B] dark:text-[#F4F4F5] focus:outline-none focus:border-[#9A3412] dark:focus:border-[#D97706]"
            />
          </div>
          <div className="flex justify-end gap-4 text-xs">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="font-semibold text-[#9A3412] dark:text-[#D97706] hover:underline cursor-pointer"
            >
              Save Card
            </button>
          </div>
        </form>
      )}

      {/* Minimal SRS Queue Filter Links */}
      <div className="flex items-center gap-5 py-4 text-xs mb-6">
        {(
          [
            { id: 'all', label: `All (${cards.length})` },
            { id: 'due', label: `Due (${dueCards.length})` },
            { id: 'mastered', label: `Mastered (${masteredCards.length})` },
          ] as const
        ).map((scope) => (
          <button
            key={scope.id}
            onClick={() => {
              setFilterScope(scope.id);
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className={`pb-0.5 border-b transition-colors cursor-pointer ${
              filterScope === scope.id
                ? 'text-[#18181B] dark:text-[#F4F4F5] font-medium border-[#9A3412] dark:border-[#D97706]'
                : 'text-[#71717A] dark:text-[#A1A1AA] border-transparent hover:text-[#18181B] dark:hover:text-[#F4F4F5]'
            }`}
          >
            {scope.label}
          </button>
        ))}
      </div>

      {filteredDeck.length === 0 ? (
        <div className="py-16 text-center border-y border-stone-200 dark:border-stone-800">
          <p className="font-display text-lg font-bold text-[#18181B] dark:text-[#F4F4F5] mb-1">
            No cards in "{filterScope === 'due' ? 'Due' : 'Mastered'}" queue right now
          </p>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] font-serif italic mb-5">
            Switch to "All" to review your complete vocabulary index at any time.
          </p>
          <button
            onClick={() => setFilterScope('all')}
            className="text-xs font-medium text-[#9A3412] dark:text-[#D97706] hover:underline cursor-pointer"
          >
            Show All Cards ({cards.length})
          </button>
        </div>
      ) : (
        <>
          {practiceMode === 'flip' && currentCard && (
            <div className="max-w-xl mx-auto">
              {/* Quiet Card Counter */}
              <div className="flex items-center justify-between text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA] mb-3">
                <span>
                  Card {safeIndex + 1} / {filteredDeck.length}
                </span>
                <span>Mastery {currentCard.masteryLevel}/5</span>
              </div>

              {/* Clean Hairline Flashcard Stage */}
              <div
                role="button"
                tabIndex={0}
                aria-pressed={isFlipped}
                aria-label={`Flashcard for ${currentCard.word}. Press Enter or Space to flip.`}
                onClick={() => setIsFlipped(!isFlipped)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsFlipped((prev) => !prev);
                  }
                }}
                className="w-full min-h-[300px] border-y border-stone-200 dark:border-stone-800 py-8 cursor-pointer flex flex-col justify-between focus:outline-none focus-visible:ring-1 focus-visible:ring-[#9A3412] transition-colors select-none"
              >
                {!isFlipped ? (
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA]">
                      <span>Tap or press Space to reveal</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayAudio(currentCard.word);
                        }}
                        className="p-1 hover:text-[#9A3412] dark:hover:text-[#D97706] transition-colors cursor-pointer"
                        title="Pronounce"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="my-10 text-center">
                      <h2 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-[#18181B] dark:text-[#F4F4F5] mb-2">
                        {currentCard.word}
                      </h2>
                      {currentCard.phoneticIpa && (
                        <p className="font-mono text-xs text-[#71717A] dark:text-[#A1A1AA]">
                          {currentCard.phoneticIpa}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 border-t border-stone-200/70 dark:border-stone-800/70">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] block mb-1">
                        {currentCard.bookTitle || 'Reading Context'}
                      </span>
                      <p className="font-reader italic text-sm text-[#18181B] dark:text-[#F4F4F5] leading-relaxed">
                        "{currentCard.contextSentence}"
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-150">
                    <div>
                      <div className="flex items-start justify-between border-b border-stone-200/80 dark:border-stone-800/80 pb-3 mb-5">
                        <div>
                          <span className="font-serif text-2xl font-bold text-[#18181B] dark:text-[#F4F4F5]">
                            {currentCard.word}
                          </span>
                          <span className="ml-2.5 font-mono text-xs text-[#71717A] dark:text-[#A1A1AA]">
                            root: {currentCard.lemma}
                          </span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayAudio(currentCard.word);
                          }}
                          className="p-1 text-[#71717A] hover:text-[#9A3412] dark:hover:text-[#D97706] cursor-pointer"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mb-5">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#9A3412] dark:text-[#D97706] block mb-1">
                          Contextual Meaning
                        </span>
                        <p className="text-xl font-medium text-[#18181B] dark:text-[#F4F4F5]">
                          {currentCard.translation}
                        </p>
                      </div>

                      <div className="text-xs text-[#71717A] dark:text-[#A1A1AA] mb-5 space-y-1">
                        <p>
                          <strong className="font-medium text-[#18181B] dark:text-[#F4F4F5]">Grammar:</strong>{' '}
                          {currentCard.partOfSpeech}
                          {currentCard.morphology ? ` · ${currentCard.morphology}` : ''}
                        </p>
                        {currentCard.usageNote && (
                          <p className="font-serif italic text-[11px] pt-1">{currentCard.usageNote}</p>
                        )}
                      </div>

                      <div className="pt-4 border-t border-stone-200/70 dark:border-stone-800/70 text-xs">
                        <p className="text-[#71717A] dark:text-[#A1A1AA] font-serif italic">
                          "{currentCard.sentenceTranslation}"
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Clean Hairline Grading Bar */}
              <div className="mt-6">
                {!isFlipped ? (
                  <button
                    onClick={() => setIsFlipped(true)}
                    className="w-full py-2.5 px-4 border border-stone-300 dark:border-stone-700 hover:border-[#9A3412] dark:hover:border-[#D97706] text-[#18181B] dark:text-[#F4F4F5] text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Reveal Meaning & Grammar [Space]</span>
                  </button>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => handleScoreCard('hard')}
                      title="Shortcut: Press 1"
                      className="py-2.5 px-3 rounded-lg border border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5] transition-colors cursor-pointer"
                    >
                      [1] Hard
                    </button>

                    <button
                      onClick={() => handleScoreCard('good')}
                      title="Shortcut: Press 2"
                      className="py-2.5 px-3 rounded-lg border border-[#9A3412]/50 dark:border-[#D97706]/50 hover:border-[#9A3412] dark:hover:border-[#D97706] text-xs font-semibold text-[#9A3412] dark:text-[#D97706] transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>[2] Good</span>
                    </button>

                    <button
                      onClick={() => handleScoreCard('easy')}
                      title="Shortcut: Press 3"
                      className="py-2.5 px-3 rounded-lg bg-[#18181B] dark:bg-[#F4F4F5] text-[#FAF8F4] dark:text-[#141312] text-xs font-semibold transition-opacity hover:opacity-90 cursor-pointer"
                    >
                      [3] Easy
                    </button>
                  </div>
                )}
              </div>
              <p className="mt-3 text-center text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA]">
                Space to flip · [1] Hard · [2] Good · [3] Easy
              </p>
            </div>
          )}

          {practiceMode === 'cloze' && currentCard && (
            <div className="max-w-xl mx-auto">
              <div className="flex items-center justify-between text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA] mb-3">
                <span>
                  Challenge {safeIndex + 1} / {filteredDeck.length}
                </span>
                <span>Mastery {currentCard.masteryLevel}/5</span>
              </div>

              <div className="border-y border-stone-200 dark:border-stone-800 py-8">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#9A3412] dark:text-[#D97706] block mb-4">
                  Contextual Recall
                </span>

                <p className="font-reader text-lg sm:text-xl leading-relaxed text-[#18181B] dark:text-[#F4F4F5] mb-6">
                  "{renderClozeSentence(currentCard.contextSentence, currentCard.word)}"
                </p>

                <div className="mb-6 text-xs text-[#71717A] dark:text-[#A1A1AA]">
                  <span className="font-mono uppercase tracking-wider text-[10px] mr-2">Meaning:</span>
                  <span className="text-[#18181B] dark:text-[#F4F4F5] font-medium">
                    {currentCard.translation}
                  </span>{' '}
                  <span>({currentCard.partOfSpeech})</span>
                </div>

                <form onSubmit={handleCheckCloze} className="space-y-4">
                  <input
                    type="text"
                    autoFocus
                    value={userFillInput}
                    onChange={(e) => {
                      setUserFillInput(e.target.value);
                      if (fillFeedback !== 'idle') setFillFeedback('idle');
                    }}
                    placeholder="Type the missing word..."
                    className={`w-full px-0 py-2 text-base bg-transparent border-b font-serif focus:outline-none transition-colors ${
                      fillFeedback === 'correct'
                        ? 'border-emerald-600 text-emerald-700 dark:text-emerald-300'
                        : fillFeedback === 'incorrect'
                        ? 'border-red-500 text-red-700 dark:text-red-300'
                        : 'border-stone-300 dark:border-stone-700 text-[#18181B] dark:text-[#F4F4F5] focus:border-[#9A3412] dark:focus:border-[#D97706]'
                    }`}
                  />

                  {fillFeedback === 'correct' && (
                    <div className="text-xs font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      <span>Exact match. Advancing to next prompt...</span>
                    </div>
                  )}

                  {fillFeedback === 'incorrect' && (
                    <div className="text-xs text-red-600 dark:text-red-400 flex items-center justify-between">
                      <span>Not quite — check accents or request a hint.</span>
                      <button
                        type="button"
                        onClick={() => setUserFillInput(currentCard.word)}
                        className="underline font-medium cursor-pointer"
                      >
                        Reveal Word
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 pt-2 text-xs">
                    <div className="flex items-center gap-4 text-[#71717A] dark:text-[#A1A1AA]">
                      <button
                        type="button"
                        onClick={handleHint}
                        className="hover:text-[#18181B] dark:hover:text-[#F4F4F5] transition-colors cursor-pointer"
                      >
                        Hint ({revealedHintLetters}/{currentCard.word.length})
                      </button>

                      <button
                        type="button"
                        onClick={handleSkipCloze}
                        className="inline-flex items-center gap-1 hover:text-[#18181B] dark:hover:text-[#F4F4F5] transition-colors cursor-pointer"
                      >
                        <SkipForward className="w-3.5 h-3.5" />
                        <span>Skip</span>
                      </button>
                    </div>

                    <button
                      type="submit"
                      className="font-semibold text-[#18181B] dark:text-[#F4F4F5] border-b border-[#18181B] dark:border-[#F4F4F5] pb-0.5 hover:text-[#9A3412] hover:border-[#9A3412] transition-colors cursor-pointer"
                    >
                      Verify Answer →
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {practiceMode === 'list' && (
            <div className="border-t border-stone-200 dark:border-stone-800 divide-y divide-stone-200 dark:divide-stone-800">
              {filteredDeck.map((card) => (
                <div
                  key={card.id}
                  className="py-4 flex items-center justify-between gap-4 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-0.5">
                      <h4 className="font-serif text-lg font-bold text-[#18181B] dark:text-[#F4F4F5] truncate">
                        {card.word}
                      </h4>
                      <button
                        onClick={() => handlePlayAudio(card.word)}
                        className="p-0.5 text-[#71717A] hover:text-[#9A3412] dark:hover:text-[#D97706] cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] font-mono">
                        · {card.lemma}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-[#9A3412] dark:text-[#D97706] mb-1">
                      {card.translation}
                    </p>

                    <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] font-reader italic truncate">
                      "{card.contextSentence}"
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA]">
                      {card.masteryLevel}/5
                    </span>
                    <button
                      onClick={() => handleDeleteCard(card.id)}
                      title="Remove from deck"
                      className="p-1 text-[#71717A] hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
