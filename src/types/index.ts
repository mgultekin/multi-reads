export type LanguageCode = 'es' | 'fr' | 'de' | 'it' | 'tr' | 'en';

export interface LanguageInfo {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  speechLocale: string;
}

export type GenreId =
  | 'philosophy'
  | 'fiction'
  | 'history'
  | 'essays'
  | 'stories'
  | 'science';

export interface GenreInfo {
  id: GenreId;
  label: string;
  subtitle: string;
  description: string;
}

export type CEFRLevel = 'Original' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export type ContentSource = 'gutenberg' | 'wikipedia' | 'custom';

export interface ContentItem {
  id: string;
  title: string;
  author: string;
  language: LanguageCode;
  genre: GenreId;
  source: ContentSource;
  summary: string;
  coverImage?: string;
  chunks: string[];
  currentChunkIndex: number;
  wordCount: number;
  estimatedReadTimeMinutes: number;
  createdAt: number;
  lastReadAt?: number;
  cefrCache?: Record<string, string>; // key: `${chunkIndex}_${level}` -> text
}

export interface WordBreakdown {
  word: string;
  contextSentence: string;
  translation: string;
  lemma: string;
  partOfSpeech: string;
  morphology: string;
  sentenceTranslation: string;
  usageNote?: string;
  phoneticIpa?: string;
  targetLang: string;
  latencyMs?: number;
  sourceEngine?: 'cache' | 'lexicon' | 'prefetch' | 'gemini-flash-lite' | 'backup-translator';
  isEnriching?: boolean;
}

export interface Flashcard {
  id: string;
  word: string;
  contextSentence: string;
  translation: string;
  lemma: string;
  partOfSpeech: string;
  morphology: string;
  sentenceTranslation: string;
  usageNote?: string;
  phoneticIpa?: string;
  language: LanguageCode;
  genre: GenreId;
  bookTitle?: string;
  createdAt: number;
  nextReviewAt: number;
  reviewCount: number;
  easeFactor: number;
  masteryLevel: number; // 0 to 5
}

export type LeagueTier = 'Bronze' | 'Silver' | 'Gold' | 'Sapphire' | 'Diamond';

export interface SocialUser {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  wordsReadThisWeek: number;
  totalWordsRead: number;
  streakDays: number;
  leagueTier: LeagueTier;
  currentBookTitle?: string;
  currentBookLang?: LanguageCode;
  isFollowing?: boolean;
}

export interface ReadingLogEntry {
  id: string;
  userId: string;
  bookId?: string;
  bookTitle?: string;
  wordsCount: number;
  language?: LanguageCode;
  timestamp: string;
}

export interface UserProfile {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  nativeLanguage: string;
  targetLanguage: LanguageCode;
  streakDays: number;
  lastActiveDate: string;
  streakFrozen: boolean;
  totalWordsRead: number;
  wordsReadThisWeek?: number;
  xp: number;
  dailyWordGoal: number;
  wordsReadToday: number;
  leagueTier: LeagueTier;
  following: string[];
  theme: 'light' | 'dark';
  readerFontSize?: 'sm' | 'md' | 'lg';
}

