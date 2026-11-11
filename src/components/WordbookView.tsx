import React, { useState, useEffect } from 'react';
import {
  Volume2,
  Check,
  BookOpen,
  Trash2,
  Layers,
  Edit3,
  Download,
  SkipForward,
} from 'lucide-react';
import { Flashcard, LanguageCode } from '../types/index.ts';
import { SUPPORTED_LANGUAGES } from '../data/constants.ts';
import { storageService } from '../services/storageService.ts';

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

  const handleScoreCard = async (mastered: boolean) => {
    if (!currentCard) return;

    const updated: Flashcard = {
      ...currentCard,
      reviewCount: (currentCard.reviewCount || 0) + 1,
      masteryLevel: mastered
        ? Math.min(5, (currentCard.masteryLevel || 0) + 1)
        : Math.max(0, (currentCard.masteryLevel || 0) - 1),
      nextReviewAt: Date.now() + (mastered ? 1000 * 60 * 60 * 24 * 3 : 1000 * 60 * 60 * 6),
    };

    await storageService.saveFlashcard(updated);
    // Immediately synchronize in-memory React state so Mastery Level updates live
    setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));

    if (mastered) {
      onAwardXP(10);
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

  // Strip diacritics for forgiving comparison when user types without accents
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
    link.setAttribute('download', `foliolingo-wordbook-${targetLang}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <p className="font-serif italic text-stone-500 text-sm">Retrieving your vocabulary manuscript...</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <BookOpen className="w-12 h-12 mx-auto text-stone-400 mb-4 stroke-[1.5]" />
        <h2 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2">
          Your Wordbook is Pristine
        </h2>
        <p className="text-stone-600 dark:text-stone-400 text-sm max-w-md mx-auto mb-6 font-serif">
          While reading any literature or news article in the Reader Studio, click any word to see its grammatical breakdown and save it to this spaced repetition deck.
        </p>
        <button
          onClick={onOpenReader}
          className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          Open Reader Studio
        </button>
      </div>
    );
  }

  // Unicode-safe Cloze sentence helper: replace target word in sentence even with non-ASCII letters (ñ, é, ü, ş, ğ, etc.)
  const renderClozeSentence = (sentence: string, targetWord: string) => {
    const escaped = targetWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const unicodeRegex = new RegExp(`(?<![\\p{L}])${escaped}(?![\\p{L}])`, 'giu');
    const parts = sentence.split(unicodeRegex);

    const blankNode = (
      <span className="font-mono font-bold text-amber-800 dark:text-amber-400 underline px-1">
        {revealedHintLetters > 0
          ? targetWord.slice(0, revealedHintLetters) +
            '_'.repeat(Math.max(1, targetWord.length - revealedHintLetters))
          : '[ ______ ]'}
      </span>
    );

    if (parts.length === 1) {
      // Case-insensitive substring fallback
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

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Top Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-stone-200/80 dark:border-stone-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-stone-400 mb-1">
            <span>Spaced Repetition & Context Recall</span>
            <span aria-hidden="true">·</span>
            <span>{activeLangInfo.name}</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
            Vocabulary Practice Studio
          </h1>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center p-1 bg-stone-100 dark:bg-stone-900 rounded-lg border border-stone-200/60 dark:border-stone-800/60">
            <button
              onClick={() => {
                setPracticeMode('flip');
                setIsFlipped(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                practiceMode === 'flip'
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              3D Flip Deck
            </button>

            <button
              onClick={() => {
                setPracticeMode('cloze');
                setFillFeedback('idle');
                setUserFillInput('');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                practiceMode === 'cloze'
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              Fill-in-the-Blank
            </button>

            <button
              onClick={() => setPracticeMode('list')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                practiceMode === 'list'
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              Word Index ({cards.length})
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            title="Export deck to CSV / Anki"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg text-stone-700 dark:text-stone-300 hover:border-amber-600 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-700" />
            Export CSV
          </button>
        </div>
      </div>

      {/* SRS Queue Filter Strip (All | Due Now | Mastered) */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-2">
          {(
            [
              { id: 'all', label: `All Cards (${cards.length})` },
              { id: 'due', label: `Due for Review (${dueCards.length})` },
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
              className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                filterScope === scope.id
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100'
                  : 'bg-white dark:bg-[#1C1A18] text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800 hover:border-amber-600/50'
              }`}
            >
              {scope.label}
            </button>
          ))}
        </div>
      </div>

      {filteredDeck.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-[#1C1A18] rounded-2xl border border-stone-200/80 dark:border-stone-800/80 p-8">
          <p className="font-display text-lg font-bold text-stone-900 dark:text-stone-100 mb-1">
            No cards in "{filterScope === 'due' ? 'Due for Review' : 'Mastered'}" queue right now
          </p>
          <p className="text-xs text-stone-500 font-serif mb-4">
            Switch to "All Cards" to practice your full vocabulary deck at any time.
          </p>
          <button
            onClick={() => setFilterScope('all')}
            className="px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold rounded-lg cursor-pointer"
          >
            Show All Cards ({cards.length})
          </button>
        </div>
      ) : (
        <>
          {practiceMode === 'flip' && currentCard && (
            <div className="max-w-xl mx-auto">
              {/* Card counter */}
              <div className="flex items-center justify-between text-xs text-stone-400 dark:text-stone-500 mb-3 px-1">
                <span>
                  Card {safeIndex + 1} of {filteredDeck.length}
                </span>
                <span className="font-mono">Mastery Level: {currentCard.masteryLevel}/5</span>
              </div>

              {/* 3D Flip Card Container */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="w-full min-h-[320px] bg-white dark:bg-[#1C1A18] rounded-2xl border border-stone-200/90 dark:border-stone-800/90 shadow-sm p-8 cursor-pointer flex flex-col justify-between hover:border-amber-600/50 transition-all select-none"
              >
                {!isFlipped ? (
                  /* FRONT OF CARD */
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <span className="text-[11px] font-medium uppercase tracking-wider text-amber-800 dark:text-amber-400">
                        Target Word · Tap to reveal
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayAudio(currentCard.word);
                        }}
                        className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                        title="Pronounce"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="my-8 text-center">
                      <h2 className="font-serif text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-100 mb-2">
                        {currentCard.word}
                      </h2>
                      {currentCard.phoneticIpa && (
                        <p className="font-mono text-xs text-stone-400">{currentCard.phoneticIpa}</p>
                      )}
                    </div>

                    {/* Authentic Context Sentence Preview */}
                    <div className="bg-stone-50/80 dark:bg-stone-900/40 p-4 rounded-xl border border-stone-100 dark:border-stone-800/60">
                      <span className="text-[10px] uppercase font-semibold text-stone-400 block mb-1">
                        Authentic Sentence from {currentCard.bookTitle || 'Reading'}
                      </span>
                      <p className="font-reader italic text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                        "{currentCard.contextSentence}"
                      </p>
                    </div>
                  </div>
                ) : (
                  /* BACK OF CARD */
                  <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-200">
                    <div>
                      <div className="flex items-start justify-between border-b border-stone-100 dark:border-stone-800 pb-2 mb-4">
                        <div>
                          <span className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">
                            {currentCard.word}
                          </span>
                          <span className="ml-2 font-mono text-xs text-stone-400">
                            (root: {currentCard.lemma})
                          </span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayAudio(currentCard.word);
                          }}
                          className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Contextual Translation */}
                      <div className="mb-4">
                        <span className="text-[10px] uppercase font-semibold text-amber-800 dark:text-amber-400 block mb-1">
                          Contextual Meaning
                        </span>
                        <p className="text-lg font-medium text-stone-900 dark:text-stone-100">
                          {currentCard.translation}
                        </p>
                      </div>

                      {/* Morphology details */}
                      <div className="text-xs text-stone-600 dark:text-stone-400 mb-4 space-y-1">
                        <p>
                          <strong className="text-stone-800 dark:text-stone-200">Grammar:</strong>{' '}
                          {currentCard.partOfSpeech} · {currentCard.morphology}
                        </p>
                        {currentCard.usageNote && (
                          <p className="font-serif italic text-stone-500 text-[11px] pt-1">
                            {currentCard.usageNote}
                          </p>
                        )}
                      </div>

                      {/* Sentence Translation */}
                      <div className="bg-stone-50 dark:bg-stone-900/60 p-3 rounded-lg border border-stone-100 dark:border-stone-800 text-xs">
                        <span className="text-stone-400 block mb-1">Full Sentence Translation:</span>
                        <p className="text-stone-700 dark:text-stone-300 font-serif italic">
                          "{currentCard.sentenceTranslation}"
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Rating Action Buttons */}
              <div className="flex items-center justify-between gap-4 mt-6">
                <button
                  onClick={() => handleScoreCard(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-900 text-xs font-semibold text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
                >
                  Needs Practice (+0 XP)
                </button>

                <button
                  onClick={() => handleScoreCard(true)}
                  className="flex-1 py-3 px-4 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Mastered (+10 XP)
                </button>
              </div>
            </div>
          )}

          {practiceMode === 'cloze' && currentCard && (
            <div className="max-w-xl mx-auto">
              {/* Card counter */}
              <div className="flex items-center justify-between text-xs text-stone-400 mb-3 px-1">
                <span>
                  Challenge {safeIndex + 1} of {filteredDeck.length}
                </span>
                <span className="font-mono">Mastery: {currentCard.masteryLevel}/5</span>
              </div>

              <div className="bg-white dark:bg-[#1C1A18] rounded-2xl border border-stone-200/90 dark:border-stone-800/90 shadow-sm p-8">
                <span className="text-[11px] font-medium uppercase tracking-wider text-amber-800 dark:text-amber-400 block mb-2">
                  Contextual Recall Challenge
                </span>

                {/* Target Sentence with Blank */}
                <div className="my-6 p-5 bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-200/60 dark:border-stone-800/60">
                  <p className="font-reader text-lg leading-relaxed text-stone-800 dark:text-stone-200">
                    "{renderClozeSentence(currentCard.contextSentence, currentCard.word)}"
                  </p>
                </div>

                {/* Translation Clue */}
                <div className="mb-6">
                  <span className="text-[11px] uppercase text-stone-400 block mb-1">Target Meaning Clue:</span>
                  <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
                    {currentCard.translation}{' '}
                    <span className="text-stone-400 text-xs">({currentCard.partOfSpeech})</span>
                  </p>
                </div>

                {/* Input Form */}
                <form onSubmit={handleCheckCloze} className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      autoFocus
                      value={userFillInput}
                      onChange={(e) => {
                        setUserFillInput(e.target.value);
                        if (fillFeedback !== 'idle') setFillFeedback('idle');
                      }}
                      placeholder="Type the missing word in target language..."
                      className={`w-full px-4 py-3 text-sm bg-white dark:bg-stone-800 border rounded-xl font-medium focus:outline-none transition-colors ${
                        fillFeedback === 'correct'
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200'
                          : fillFeedback === 'incorrect'
                          ? 'border-red-500 bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-200'
                          : 'border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100'
                      }`}
                    />
                  </div>

                  {fillFeedback === 'correct' && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-medium rounded-lg flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      Exact match! +15 XP awarded. Advancing to next challenge...
                    </div>
                  )}

                  {fillFeedback === 'incorrect' && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 text-xs font-medium rounded-lg flex items-center justify-between">
                      <span>Not quite. Check your spelling or click Hint.</span>
                      <button
                        type="button"
                        onClick={() => setUserFillInput(currentCard.word)}
                        className="underline font-semibold cursor-pointer"
                      >
                        Show Word
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleHint}
                        className="px-3.5 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 hover:border-stone-400 transition-colors cursor-pointer"
                      >
                        Letter Hint ({revealedHintLetters}/{currentCard.word.length})
                      </button>

                      <button
                        type="button"
                        onClick={handleSkipCloze}
                        className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 rounded-lg border border-stone-200 dark:border-stone-800 transition-colors cursor-pointer"
                      >
                        <SkipForward className="w-3.5 h-3.5" />
                        Skip
                      </button>
                    </div>

                    <button
                      type="submit"
                      className="px-6 py-2 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                    >
                      Verify Answer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {practiceMode === 'list' && (
            <div className="bg-white dark:bg-[#1C1A18] rounded-2xl border border-stone-200/90 dark:border-stone-800/90 divide-y divide-stone-100 dark:divide-stone-800">
              {filteredDeck.map((card) => (
                <div
                  key={card.id}
                  className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-stone-50/60 dark:hover:bg-stone-900/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1">
                      <h4 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100 truncate">
                        {card.word}
                      </h4>
                      <button
                        onClick={() => handlePlayAudio(card.word)}
                        className="p-0.5 text-stone-400 hover:text-stone-700 cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs text-stone-400 font-mono">· {card.lemma}</span>
                    </div>

                    <p className="text-xs font-medium text-amber-800 dark:text-amber-400 mb-1">
                      {card.translation}
                    </p>

                    <p className="text-xs text-stone-500 font-reader italic truncate">
                      "{card.contextSentence}"
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono text-stone-400">
                      Lvl {card.masteryLevel}/5
                    </span>
                    <button
                      onClick={() => handleDeleteCard(card.id)}
                      title="Remove from deck"
                      className="p-1.5 text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
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
