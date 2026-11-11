import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Sparkles, Trophy, Loader2, ArrowRight, RotateCcw } from 'lucide-react';
import { QuizQuestion, SectionQuiz, geminiClient } from '../services/geminiClient.ts';

interface SectionQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  textChunk: string;
  targetLangName: string;
  baseLangName: string;
  onAwardXP: (amount: number) => void;
  sectionTitle?: string;
}

export const SectionQuizModal: React.FC<SectionQuizModalProps> = ({
  isOpen,
  onClose,
  textChunk,
  targetLangName,
  baseLangName,
  onAwardXP,
  sectionTitle,
}) => {
  const [quiz, setQuiz] = useState<SectionQuiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadQuiz();
    }
  }, [isOpen, textChunk]);

  const loadQuiz = async () => {
    setIsLoading(true);
    setCurrentQIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setCorrectCount(0);
    setIsQuizCompleted(false);

    try {
      const data = await geminiClient.getSectionQuiz(textChunk, targetLangName, baseLangName);
      setQuiz(data);
    } catch (err) {
      console.warn('Failed to load quiz', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentQ: QuizQuestion | undefined = quiz?.questions?.[currentQIndex];

  const handleSubmitAnswer = () => {
    if (selectedOption === null || !currentQ) return;
    setIsAnswerSubmitted(true);
    if (selectedOption === currentQ.correctIndex) {
      setCorrectCount((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (!quiz) return;
    if (currentQIndex < quiz.questions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      setIsQuizCompleted(true);
      // Award XP
      const earnedXP = 15 + correctCount * 10;
      onAwardXP(earnedXP);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white dark:bg-[#1C1A18] rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6 text-stone-900 dark:text-stone-100 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-amber-800 dark:text-amber-400 mb-0.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Section Mastery Check</span>
              <span aria-hidden="true">·</span>
              <span>{baseLangName}</span>
            </div>
            <h3 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
              {sectionTitle || 'Reading Comprehension & Vocabulary'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-600 mb-3" />
            <p className="text-xs font-serif italic text-stone-500">
              Generating comprehension questions based on your reading passage...
            </p>
          </div>
        ) : isQuizCompleted ? (
          /* Completion Screen */
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/40 rounded-full flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
              <Trophy className="w-7 h-7" />
            </div>

            <h4 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
              Section Comprehension Complete!
            </h4>

            <p className="text-stone-600 dark:text-stone-400 text-sm max-w-sm mx-auto font-serif">
              You scored <span className="font-bold text-stone-900 dark:text-stone-100">{correctCount} of {quiz?.questions.length || 3}</span> correctly. Active recall deepens neural pathway connections for foreign vocabulary.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-300 font-mono text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              +{15 + correctCount * 10} Reading XP Earned
            </div>

            <div className="pt-4 flex items-center justify-center gap-3">
              <button
                onClick={loadQuiz}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium border border-stone-200 dark:border-stone-800 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retake Quiz
              </button>

              <button
                onClick={onClose}
                className="px-5 py-2 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Continue Reading
              </button>
            </div>
          </div>
        ) : currentQ ? (
          /* Active Question */
          <div className="py-4 space-y-4">
            {/* Progress indicators */}
            <div className="flex items-center justify-between text-xs text-stone-400">
              <span className="font-medium uppercase tracking-wider text-amber-800 dark:text-amber-400">
                Question {currentQIndex + 1} of {quiz?.questions.length} · {currentQ.category}
              </span>
              <span className="font-mono">Score: {correctCount}/{currentQIndex}</span>
            </div>

            {/* Question Text */}
            <h4 className="font-serif text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 leading-snug">
              {currentQ.question}
            </h4>

            {/* Options list */}
            <div className="space-y-2.5 pt-2">
              {currentQ.options.map((option, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentQ.correctIndex;

                let optionStyles = 'border-stone-200 dark:border-stone-800 hover:border-amber-600/60 bg-stone-50/50 dark:bg-stone-900/30';
                if (isAnswerSubmitted) {
                  if (isCorrect) {
                    optionStyles = 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-medium';
                  } else if (isSelected && !isCorrect) {
                    optionStyles = 'border-red-500 bg-red-50/60 dark:bg-red-950/30 text-red-900 dark:text-red-200';
                  } else {
                    optionStyles = 'opacity-40 border-stone-200 dark:border-stone-800';
                  }
                } else if (isSelected) {
                  optionStyles = 'border-amber-600 bg-amber-50/60 dark:bg-amber-950/30 text-amber-950 dark:text-amber-100';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isAnswerSubmitted}
                    onClick={() => setSelectedOption(idx)}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-all flex items-start gap-3 cursor-pointer ${optionStyles}`}
                  >
                    <span className="font-mono text-xs font-semibold w-5 h-5 rounded-full border border-stone-300 dark:border-stone-700 flex items-center justify-center shrink-0 mt-0.5">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1 leading-relaxed">{option}</span>
                    {isAnswerSubmitted && isCorrect && <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>

            {/* Explanation card after submit */}
            {isAnswerSubmitted && (
              <div className="p-3.5 rounded-xl bg-stone-100/70 dark:bg-stone-900/70 border border-stone-200/60 dark:border-stone-800/60 text-xs space-y-1 animate-in fade-in duration-200">
                <span className="font-semibold text-stone-800 dark:text-stone-200 block">Linguistic Explanation:</span>
                <p className="text-stone-600 dark:text-stone-400 font-serif italic leading-relaxed">
                  {currentQ.explanation}
                </p>
              </div>
            )}

            {/* Submit / Next Button */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-stone-100 dark:border-stone-800">
              {!isAnswerSubmitted ? (
                <button
                  type="button"
                  disabled={selectedOption === null}
                  onClick={handleSubmitAnswer}
                  className="px-5 py-2 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-semibold rounded-lg shadow-sm disabled:opacity-40 transition-colors cursor-pointer"
                >
                  Confirm Answer
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="flex items-center gap-1.5 px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {currentQIndex < (quiz?.questions.length || 3) - 1 ? 'Next Question' : 'Complete Quiz'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
