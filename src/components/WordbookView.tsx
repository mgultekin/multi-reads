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

  // Activity Mastery Ring math
  const masteryRatio = cards.length > 0 ? masteredCards.length / cards.length : 0;
  const ringRadius = 17;
  const ringCirc = 2 * Math.PI * ringRadius;
  const ringOffset = ringCirc * (1 - masteryRatio);

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

  const renderClozeSentence = (sentence: string, targetWord: string) => {
    const escaped = targetWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const unicodeRegex = new RegExp(`(?<![\\p{L}])${escaped}(?![\\p{L}])`, 'giu');
    const parts = sentence.split(unicodeRegex);

    const blankNode = (
      <span className="font-mono font-semibold text-[#0071E3] dark:text-[#0A84FF] underline underline-offset-4 px-1">
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
      <div className="max-w-3xl mx-auto px-6 py-24 text-center">
        <p className="font-reader italic text-[#6E6E73] dark:text-[#98989D] text-sm">
          Retrieving your vocabulary manuscript...
        </p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center">
        <div className="apple-glass-card rounded-3xl p-10">
          <BookOpen className="w-8 h-8 mx-auto text-[#0071E3] dark:text-[#0A84FF] mb-4 stroke-[1.5]" />
          <h2 className="font-display text-2xl font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-2">
            No {activeLangInfo.name} Words Saved
          </h2>
          <p className="text-[#6E6E73] dark:text-[#98989D] text-sm max-w-md mx-auto mb-7 font-reader">
            Tap any word while reading to preserve it here, load 5 literary starter terms, or add your own custom word.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-medium">
            <button
              onClick={onOpenReader}
              className="px-4 py-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] dark:bg-[#0A84FF] text-white font-semibold transition-colors cursor-pointer"
            >
              Open Reader
            </button>
            <button
              onClick={handleLoadStarterWords}
              className="px-4 py-2 rounded-full bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/[0.09] text-[#1D1D1F] dark:text-[#F5F5F7] transition-colors cursor-pointer"
            >
              Load 5 Starter Words
            </button>
            <button
              onClick={() => setIsAddOpen((prev) => !prev)}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-full border border-black/[0.1] dark:border-white/[0.12] text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-white transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Word</span>
            </button>
          </div>

          {isAddOpen && (
            <form
              onSubmit={handleCreateCustomCard}
              className="mt-6 pt-6 border-t border-black/[0.06] dark:border-white/[0.08] text-left space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  placeholder={`${activeLangInfo.name} word`}
                  className="px-3 py-2 text-xs rounded-xl bg-black/[0.04] dark:bg-white/[0.06] text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/40"
                />
                <input
                  type="text"
                  required
                  value={newTranslation}
                  onChange={(e) => setNewTranslation(e.target.value)}
                  placeholder="Translation / meaning"
                  className="px-3 py-2 text-xs rounded-xl bg-black/[0.04] dark:bg-white/[0.06] text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/40"
                />
              </div>
              <input
                type="text"
                value={newSentence}
                onChange={(e) => setNewSentence(e.target.value)}
                placeholder="Optional context sentence"
                className="w-full px-3 py-2 text-xs rounded-xl bg-black/[0.04] dark:bg-white/[0.06] text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/40"
              />
              <div className="flex justify-end gap-3 text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3 py-1.5 text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-full bg-[#0071E3] text-white font-semibold cursor-pointer"
                >
                  Save Word
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Apple Activity Mastery Ring Header + Controls */}
      <div className="apple-glass-card rounded-3xl p-5 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Live Mastery SVG Ring */}
            <div className="relative flex items-center justify-center shrink-0">
              <svg width="46" height="46" viewBox="0 0 46 46" className="-rotate-90">
                <circle
                  cx="23"
                  cy="23"
                  r={ringRadius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-black/[0.08] dark:text-white/[0.1]"
                />
                <circle
                  cx="23"
                  cy="23"
                  r={ringRadius}
                  fill="none"
                  stroke="#34C759"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={ringCirc}
                  strokeDashoffset={ringOffset}
                  className="transition-all duration-500"
                />
              </svg>
              <span className="absolute text-[10px] font-mono font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                {Math.round(masteryRatio * 100)}%
              </span>
            </div>

            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
                Wordbook
              </h1>
              <p className="text-xs text-[#6E6E73] dark:text-[#98989D]">
                {activeLangInfo.name} · {dueCards.length} due · {masteredCards.length} mastered of {cards.length}
              </p>
            </div>
          </div>

          {/* Apple Segmented Mode Control + Export Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center p-1 rounded-full bg-black/[0.045] dark:bg-white/[0.06] text-xs">
              <button
                onClick={() => {
                  setPracticeMode('flip');
                  setIsFlipped(false);
                }}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  practiceMode === 'flip'
                    ? 'bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white font-semibold shadow-2xs'
                    : 'text-[#6E6E73] dark:text-[#98989D]'
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
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  practiceMode === 'cloze'
                    ? 'bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white font-semibold shadow-2xs'
                    : 'text-[#6E6E73] dark:text-[#98989D]'
                }`}
              >
                Cloze
              </button>
              <button
                onClick={() => setPracticeMode('list')}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  practiceMode === 'list'
                    ? 'bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white font-semibold shadow-2xs'
                    : 'text-[#6E6E73] dark:text-[#98989D]'
                }`}
              >
                Index ({cards.length})
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <button
                onClick={() => setIsAddOpen((prev) => !prev)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] text-[#1D1D1F] dark:text-[#F5F5F7] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
              <button
                onClick={handleExportCSV}
                title="Export deck to CSV"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-white transition-colors cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>CSV</span>
              </button>
              <button
                onClick={handleExportAnkiTSV}
                title="Export deck to Anki TSV format"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-white transition-colors cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Anki</span>
              </button>
            </div>
          </div>
        </div>

        {/* Queue Filter Pills */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-black/[0.05] dark:border-white/[0.06] text-xs">
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
              className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
                filterScope === scope.id
                  ? 'bg-[#1D1D1F] dark:bg-[#F5F5F7] text-white dark:text-[#1D1D1F] font-semibold'
                  : 'text-[#6E6E73] dark:text-[#98989D] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
              }`}
            >
              {scope.label}
            </button>
          ))}
        </div>

        {isAddOpen && (
          <form
            onSubmit={handleCreateCustomCard}
            className="mt-4 pt-4 border-t border-black/[0.06] dark:border-white/[0.08] space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                placeholder={`${activeLangInfo.name} word`}
                className="px-3 py-2 text-xs rounded-xl bg-black/[0.04] dark:bg-white/[0.06] text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/40"
              />
              <input
                type="text"
                required
                value={newTranslation}
                onChange={(e) => setNewTranslation(e.target.value)}
                placeholder="Translation / meaning"
                className="px-3 py-2 text-xs rounded-xl bg-black/[0.04] dark:bg-white/[0.06] text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/40"
              />
              <input
                type="text"
                value={newSentence}
                onChange={(e) => setNewSentence(e.target.value)}
                placeholder="Optional context sentence"
                className="px-3 py-2 text-xs rounded-xl bg-black/[0.04] dark:bg-white/[0.06] text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/40"
              />
            </div>
            <div className="flex justify-end gap-3 text-xs">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="px-3 py-1.5 text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-full bg-[#0071E3] text-white font-semibold cursor-pointer"
              >
                Save Card
              </button>
            </div>
          </form>
        )}
      </div>

      {filteredDeck.length === 0 ? (
        <div className="apple-glass-card rounded-3xl py-16 px-8 text-center">
          <p className="font-display text-lg font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
            No cards in "{filterScope === 'due' ? 'Due' : 'Mastered'}" queue right now
          </p>
          <p className="text-xs text-[#6E6E73] dark:text-[#98989D] font-reader italic mb-5">
            Switch to "All" to review your complete vocabulary index at any time.
          </p>
          <button
            onClick={() => setFilterScope('all')}
            className="px-4 py-2 rounded-full bg-[#0071E3] text-white text-xs font-semibold cursor-pointer"
          >
            Show All Cards ({cards.length})
          </button>
        </div>
      ) : (
        <>
          {practiceMode === 'flip' && currentCard && (
            <div className="max-w-xl mx-auto">
              <div className="flex items-center justify-between text-[11px] font-mono text-[#6E6E73] dark:text-[#98989D] mb-2.5 px-2">
                <span>
                  Card {safeIndex + 1} / {filteredDeck.length}
                </span>
                <span>Mastery {currentCard.masteryLevel}/5</span>
              </div>

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
                className="apple-glass-card rounded-3xl w-full min-h-[310px] p-7 sm:p-8 cursor-pointer flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3] transition-all select-none"
              >
                {!isFlipped ? (
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[11px] font-medium text-[#6E6E73] dark:text-[#98989D]">
                      <span>Tap or press Space to reveal</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayAudio(currentCard.word);
                        }}
                        className="p-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:text-[#0071E3] dark:hover:text-[#0A84FF] transition-colors cursor-pointer"
                        title="Pronounce"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="my-9 text-center">
                      <h2 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] mb-2">
                        {currentCard.word}
                      </h2>
                      {currentCard.phoneticIpa && (
                        <p className="font-mono text-xs text-[#6E6E73] dark:text-[#98989D]">
                          {currentCard.phoneticIpa}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.08]">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#6E6E73] dark:text-[#98989D] block mb-1">
                        {currentCard.bookTitle || 'Reading Context'}
                      </span>
                      <p className="font-reader italic text-sm text-[#1D1D1F] dark:text-[#F5F5F7] leading-relaxed">
                        "{currentCard.contextSentence}"
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-150">
                    <div>
                      <div className="flex items-start justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3 mb-5">
                        <div>
                          <span className="font-display text-2xl font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                            {currentCard.word}
                          </span>
                          <span className="ml-2.5 font-mono text-xs text-[#6E6E73] dark:text-[#98989D]">
                            root: {currentCard.lemma}
                          </span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayAudio(currentCard.word);
                          }}
                          className="p-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-[#6E6E73] hover:text-[#0071E3] dark:hover:text-[#0A84FF] cursor-pointer"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mb-4">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0071E3] dark:text-[#0A84FF] block mb-1">
                          Contextual Meaning
                        </span>
                        <p className="text-xl font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
                          {currentCard.translation}
                        </p>
                      </div>

                      <div className="text-xs text-[#6E6E73] dark:text-[#98989D] mb-4 space-y-1">
                        <p>
                          <strong className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">Grammar:</strong>{' '}
                          {currentCard.partOfSpeech}
                          {currentCard.morphology ? ` · ${currentCard.morphology}` : ''}
                        </p>
                        {currentCard.usageNote && (
                          <p className="font-reader italic text-[11px] pt-1">{currentCard.usageNote}</p>
                        )}
                      </div>

                      <div className="pt-3.5 border-t border-black/[0.06] dark:border-white/[0.08] text-xs">
                        <p className="text-[#6E6E73] dark:text-[#98989D] font-reader italic">
                          "{currentCard.sentenceTranslation}"
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5">
                {!isFlipped ? (
                  <button
                    onClick={() => setIsFlipped(true)}
                    className="w-full py-2.5 px-4 rounded-full bg-[#1D1D1F] hover:bg-black dark:bg-[#F5F5F7] dark:hover:bg-white text-white dark:text-[#1D1D1F] text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Reveal Meaning & Grammar [Space]</span>
                  </button>
                ) : (
                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      onClick={() => handleScoreCard('hard')}
                      title="Shortcut: Press 1"
                      className="py-2.5 px-3 rounded-full border border-black/[0.1] dark:border-white/[0.12] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-xs font-medium text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-white transition-colors cursor-pointer"
                    >
                      [1] Hard
                    </button>

                    <button
                      onClick={() => handleScoreCard('good')}
                      title="Shortcut: Press 2"
                      className="py-2.5 px-3 rounded-full bg-[#0071E3] hover:bg-[#0077ED] dark:bg-[#0A84FF] text-white text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>[2] Good</span>
                    </button>

                    <button
                      onClick={() => handleScoreCard('easy')}
                      title="Shortcut: Press 3"
                      className="py-2.5 px-3 rounded-full bg-[#34C759] hover:bg-[#2EB350] text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      [3] Easy
                    </button>
                  </div>
                )}
              </div>
              <p className="mt-3 text-center text-[11px] font-mono text-[#6E6E73] dark:text-[#98989D]">
                Space to flip · [1] Hard · [2] Good · [3] Easy
              </p>
            </div>
          )}

          {practiceMode === 'cloze' && currentCard && (
            <div className="max-w-xl mx-auto">
              <div className="flex items-center justify-between text-[11px] font-mono text-[#6E6E73] dark:text-[#98989D] mb-2.5 px-2">
                <span>
                  Challenge {safeIndex + 1} / {filteredDeck.length}
                </span>
                <span>Mastery {currentCard.masteryLevel}/5</span>
              </div>

              <div className="apple-glass-card rounded-3xl p-7 sm:p-8">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0071E3] dark:text-[#0A84FF] block mb-4">
                  Contextual Recall
                </span>

                <p className="font-reader text-lg sm:text-xl leading-relaxed text-[#1D1D1F] dark:text-[#F5F5F7] mb-6">
                  "{renderClozeSentence(currentCard.contextSentence, currentCard.word)}"
                </p>

                <div className="mb-6 text-xs text-[#6E6E73] dark:text-[#98989D]">
                  <span className="font-mono uppercase tracking-wider text-[10px] mr-2">Meaning:</span>
                  <span className="text-[#1D1D1F] dark:text-[#F5F5F7] font-medium">
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
                    className={`w-full px-4 py-2.5 text-base rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] font-reader focus:outline-none focus:ring-2 transition-all ${
                      fillFeedback === 'correct'
                        ? 'ring-2 ring-[#34C759] text-emerald-700 dark:text-emerald-300'
                        : fillFeedback === 'incorrect'
                        ? 'ring-2 ring-red-500 text-red-700 dark:text-red-300'
                        : 'text-[#1D1D1F] dark:text-[#F5F5F7] focus:ring-[#0071E3]/50'
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
                    <div className="flex items-center gap-3 text-[#6E6E73] dark:text-[#98989D]">
                      <button
                        type="button"
                        onClick={handleHint}
                        className="px-3 py-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:text-[#1D1D1F] dark:hover:text-white transition-colors cursor-pointer"
                      >
                        Hint ({revealedHintLetters}/{currentCard.word.length})
                      </button>

                      <button
                        type="button"
                        onClick={handleSkipCloze}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:text-[#1D1D1F] dark:hover:text-white transition-colors cursor-pointer"
                      >
                        <SkipForward className="w-3.5 h-3.5" />
                        <span>Skip</span>
                      </button>
                    </div>

                    <button
                      type="submit"
                      className="px-5 py-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] dark:bg-[#0A84FF] text-white font-semibold transition-colors cursor-pointer"
                    >
                      Verify Answer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {practiceMode === 'list' && (
            <div className="apple-glass-card rounded-3xl px-5 sm:px-6 divide-y divide-black/[0.06] dark:divide-white/[0.08]">
              {filteredDeck.map((card) => (
                <div
                  key={card.id}
                  className="py-4 flex items-center justify-between gap-4 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-0.5">
                      <h4 className="font-display text-lg font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] truncate">
                        {card.word}
                      </h4>
                      <button
                        onClick={() => handlePlayAudio(card.word)}
                        className="p-0.5 text-[#6E6E73] hover:text-[#0071E3] dark:hover:text-[#0A84FF] cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs text-[#6E6E73] dark:text-[#98989D] font-mono">
                        · {card.lemma}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-[#0071E3] dark:text-[#0A84FF] mb-1">
                      {card.translation}
                    </p>

                    <p className="text-xs text-[#6E6E73] dark:text-[#98989D] font-reader italic truncate">
                      "{card.contextSentence}"
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-[11px] font-mono text-[#6E6E73] dark:text-[#98989D]">
                      {card.masteryLevel}/5
                    </span>
                    <button
                      onClick={() => handleDeleteCard(card.id)}
                      title="Remove from deck"
                      className="p-1 text-[#6E6E73] hover:text-red-600 transition-colors cursor-pointer"
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
