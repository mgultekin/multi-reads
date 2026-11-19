import { ContentItem, DailyNewsEdition, Flashcard, LanguageCode, ReadingLogEntry, UserProfile } from '../types/index.ts';
import { INITIAL_CURATED_BOOKS } from '../data/constants.ts';
import { INITIAL_FULL_NOVELS } from '../data/fullNovelsData.ts';

const ALL_BUNDLED_BOOKS: ContentItem[] = [...INITIAL_CURATED_BOOKS, ...INITIAL_FULL_NOVELS];
import {
  INSTANT_LEXICON,
  LexiconEntry,
  registerOfflineDictionaryEntry,
} from './instantLexicon.ts';

const DB_NAME = 'foliolingo_db';
const DB_VERSION = 2;
const READING_LOGS_KEY = 'foliolingo_reading_logs';

export interface StoredDictionaryRecord {
  id: string; // `${langCode}__${word}`
  langCode: string;
  word: string;
  entry: LexiconEntry;
  updatedAt: number;
}

class StorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private isIndexedDbAvailable = typeof window !== 'undefined' && 'indexedDB' in window;

  constructor() {
    if (this.isIndexedDbAvailable) {
      this.initDb().then(() => {
        this.hydrateOfflineDictionary();
      }).catch(() => {});
    }
  }

  private initDb(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          if (!db.objectStoreNames.contains('books')) {
            const bookStore = db.createObjectStore('books', { keyPath: 'id' });
            bookStore.createIndex('language', 'language', { unique: false });
            bookStore.createIndex('genre', 'genre', { unique: false });
          }

          if (!db.objectStoreNames.contains('wordbook')) {
            const wordStore = db.createObjectStore('wordbook', { keyPath: 'id' });
            wordStore.createIndex('language', 'language', { unique: false });
            wordStore.createIndex('word', 'word', { unique: false });
          }

          if (!db.objectStoreNames.contains('cefr_cache')) {
            db.createObjectStore('cefr_cache', { keyPath: 'key' });
          }

          if (!db.objectStoreNames.contains('offline_dictionary')) {
            const dictStore = db.createObjectStore('offline_dictionary', { keyPath: 'id' });
            dictStore.createIndex('langCode', 'langCode', { unique: false });
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          console.warn('IndexedDB failed to open, falling back to localStorage');
          reject(request.error);
        };
      } catch (err) {
        console.warn('IndexedDB exception, falling back to localStorage', err);
        reject(err);
      }
    });

    return this.dbPromise;
  }

  private reconcileCuratedBooks(books: ContentItem[]): { reconciled: ContentItem[]; changed: boolean } {
    const byId = new Map<string, ContentItem>();
    for (const b of books) {
      byId.set(b.id, b);
    }

    let changed = false;
    const upgraded: ContentItem[] = [];

    // Ensure every curated book and pre-bundled full novel exists and has full multi-chapter chunks
    for (const curated of ALL_BUNDLED_BOOKS) {
      const existing = byId.get(curated.id);
      if (!existing) {
        upgraded.push(curated);
        changed = true;
      } else {
        byId.delete(curated.id);
        if ((existing.chunks?.length || 0) < curated.chunks.length) {
          upgraded.push({
            ...curated,
            currentChunkIndex: Math.min(existing.currentChunkIndex || 0, curated.chunks.length - 1),
            lastReadAt: existing.lastReadAt,
            cefrCache: existing.cefrCache,
          });
          changed = true;
        } else if (
          (curated.isFullNovel && !existing.isFullNovel) ||
          (curated.gutenbergId !== undefined && existing.gutenbergId !== curated.gutenbergId)
        ) {
          upgraded.push({
            ...existing,
            isFullNovel: curated.isFullNovel ?? existing.isFullNovel,
            gutenbergId: curated.gutenbergId ?? existing.gutenbergId,
          });
          changed = true;
        } else {
          upgraded.push(existing);
        }
      }
    }

    // Preserve user-imported / dynamic Gutenberg / Wikipedia books
    for (const remaining of byId.values()) {
      upgraded.push(remaining);
    }

    return { reconciled: upgraded, changed };
  }

  // --- BOOKS & ARTICLES ---
  async getBooks(): Promise<ContentItem[]> {
    try {
      const db = await this.initDb();
      return new Promise((resolve) => {
        const tx = db.transaction('books', 'readonly');
        const store = tx.objectStore('books');
        const req = store.getAll();

        req.onsuccess = () => {
          const books = req.result as ContentItem[];
          if (!books || books.length === 0) {
            this.seedBooks(ALL_BUNDLED_BOOKS);
            resolve(ALL_BUNDLED_BOOKS);
          } else {
            const { reconciled, changed } = this.reconcileCuratedBooks(books);
            if (changed) {
              this.seedBooks(reconciled);
            }
            resolve(reconciled);
          }
        };

        req.onerror = () => {
          resolve(this.getFallbackBooks());
        };
      });
    } catch {
      return this.getFallbackBooks();
    }
  }

  async saveBook(book: ContentItem): Promise<void> {
    try {
      const db = await this.initDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('books', 'readwrite');
        tx.objectStore('books').put(book);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    } catch {
      // fallback below
    }
    const books = this.getFallbackBooks();
    const existingIdx = books.findIndex((b) => b.id === book.id);
    if (existingIdx >= 0) {
      books[existingIdx] = book;
    } else {
      books.unshift(book);
    }
    try {
      localStorage.setItem('foliolingo_books', JSON.stringify(books));
    } catch {
      // ignore quota
    }
  }

  async deleteBook(id: string): Promise<void> {
    try {
      const db = await this.initDb();
      const tx = db.transaction('books', 'readwrite');
      tx.objectStore('books').delete(id);
    } catch {
      // fallback below
    }
    const books = this.getFallbackBooks().filter((b) => b.id !== id);
    try {
      localStorage.setItem('foliolingo_books', JSON.stringify(books));
    } catch {
      // ignore
    }
  }

  private seedBooks(books: ContentItem[]): void {
    try {
      this.initDb().then((db) => {
        const tx = db.transaction('books', 'readwrite');
        const store = tx.objectStore('books');
        for (const book of books) {
          store.put(book);
        }
      });
    } catch {
      localStorage.setItem('foliolingo_books', JSON.stringify(books));
    }
  }

  private getFallbackBooks(): ContentItem[] {
    try {
      const data = localStorage.getItem('foliolingo_books');
      if (data) {
        const parsed = JSON.parse(data) as ContentItem[];
        const { reconciled } = this.reconcileCuratedBooks(parsed);
        return reconciled;
      }
    } catch (e) {
      console.warn('localStorage read error', e);
    }
    return ALL_BUNDLED_BOOKS;
  }

  // --- CEFR ADAPTED TEXT CACHING ---
  async getCachedCEFR(bookId: string, chunkIndex: number, level: string): Promise<string | null> {
    const key = `${bookId}_${chunkIndex}_${level}`;
    try {
      const db = await this.initDb();
      return new Promise((resolve) => {
        const tx = db.transaction('cefr_cache', 'readonly');
        const req = tx.objectStore('cefr_cache').get(key);
        req.onsuccess = () => resolve(req.result ? req.result.adaptedText : null);
        req.onerror = () => resolve(null);
      });
    } catch {
      const cache = JSON.parse(localStorage.getItem('foliolingo_cefr_cache') || '{}');
      return cache[key] || null;
    }
  }

  async setCachedCEFR(bookId: string, chunkIndex: number, level: string, adaptedText: string): Promise<void> {
    const key = `${bookId}_${chunkIndex}_${level}`;
    try {
      const db = await this.initDb();
      const tx = db.transaction('cefr_cache', 'readwrite');
      tx.objectStore('cefr_cache').put({ key, bookId, chunkIndex, level, adaptedText, timestamp: Date.now() });
    } catch {
      const cache = JSON.parse(localStorage.getItem('foliolingo_cefr_cache') || '{}');
      cache[key] = adaptedText;
      localStorage.setItem('foliolingo_cefr_cache', JSON.stringify(cache));
    }
  }

  async clearCEFRCache(): Promise<void> {
    localStorage.removeItem('foliolingo_cefr_cache');
    try {
      const db = await this.initDb();
      const tx = db.transaction('cefr_cache', 'readwrite');
      tx.objectStore('cefr_cache').clear();
    } catch {
      // ignore
    }
  }

  // --- OFFLINE HEURISTIC DICTIONARY (IndexedDB) ---
  private async hydrateOfflineDictionary(): Promise<void> {
    try {
      const db = await this.initDb();
      const tx = db.transaction('offline_dictionary', 'readonly');
      const store = tx.objectStore('offline_dictionary');
      const req = store.getAll();

      req.onsuccess = () => {
        const records = (req.result as StoredDictionaryRecord[]) || [];
        if (records.length === 0) {
          this.seedOfflineDictionary();
        } else {
          for (const rec of records) {
            registerOfflineDictionaryEntry(rec.langCode, rec.word, rec.entry);
          }
        }
      };
    } catch {
      // ignore
    }
  }

  private async seedOfflineDictionary(): Promise<void> {
    try {
      const db = await this.initDb();
      const tx = db.transaction('offline_dictionary', 'readwrite');
      const store = tx.objectStore('offline_dictionary');
      const now = Date.now();

      for (const [langCode, wordsMap] of Object.entries(INSTANT_LEXICON)) {
        for (const [word, entry] of Object.entries(wordsMap)) {
          const rec: StoredDictionaryRecord = {
            id: `${langCode}__${word}`,
            langCode,
            word,
            entry,
            updatedAt: now,
          };
          store.put(rec);
        }
      }
    } catch {
      // ignore
    }
  }

  async saveOfflineDictionaryEntry(
    langCode: string,
    word: string,
    lemma: string,
    pos: string,
    morph: string,
    baseLangName: string,
    translation: string
  ): Promise<void> {
    const cleanCode = langCode.toLowerCase().slice(0, 2);
    const cleanWord = word.toLowerCase().trim();
    if (!cleanWord || !translation) return;

    const entry: LexiconEntry = {
      lemma: lemma || cleanWord,
      pos: pos || 'Word',
      morph: morph || 'Contextual form',
      translations: { [baseLangName]: translation },
    };

    registerOfflineDictionaryEntry(cleanCode, cleanWord, entry);

    try {
      const db = await this.initDb();
      const tx = db.transaction('offline_dictionary', 'readwrite');
      const store = tx.objectStore('offline_dictionary');
      const id = `${cleanCode}__${cleanWord}`;
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const existing = getReq.result as StoredDictionaryRecord | undefined;
        const mergedEntry: LexiconEntry = {
          lemma: entry.lemma || existing?.entry.lemma || cleanWord,
          pos: entry.pos || existing?.entry.pos || 'Word',
          morph: entry.morph || existing?.entry.morph || 'Contextual form',
          translations: {
            ...(existing?.entry.translations || {}),
            [baseLangName]: translation,
          },
        };
        store.put({
          id,
          langCode: cleanCode,
          word: cleanWord,
          entry: mergedEntry,
          updatedAt: Date.now(),
        });
      };
    } catch {
      // ignore
    }
  }

  // --- WORDBOOK & FLASHCARDS ---
  async getFlashcards(lang?: string): Promise<Flashcard[]> {
    try {
      const db = await this.initDb();
      return new Promise((resolve) => {
        const tx = db.transaction('wordbook', 'readonly');
        const store = tx.objectStore('wordbook');
        const req = store.getAll();

        req.onsuccess = () => {
          let list = (req.result as Flashcard[]) || [];
          if (lang) {
            list = list.filter((c) => c.language === lang);
          }
          resolve(list);
        };
        req.onerror = () => resolve(this.getFallbackFlashcards(lang));
      });
    } catch {
      return this.getFallbackFlashcards(lang);
    }
  }

  private cloudSyncHandler: {
    onSave?: (card: Flashcard) => void;
    onDelete?: (id: string) => void;
    onSaveReadingLog?: (log: ReadingLogEntry) => void;
  } | null = null;

  setCloudSyncHandler(
    handler: {
      onSave?: (card: Flashcard) => void;
      onDelete?: (id: string) => void;
      onSaveReadingLog?: (log: ReadingLogEntry) => void;
    } | null
  ) {
    this.cloudSyncHandler = handler;
  }

  async saveFlashcard(card: Flashcard, skipCloudSync = false): Promise<void> {
    try {
      const db = await this.initDb();
      const tx = db.transaction('wordbook', 'readwrite');
      tx.objectStore('wordbook').put(card);
    } catch {
      const list = this.getFallbackFlashcards();
      const idx = list.findIndex((c) => c.id === card.id);
      if (idx >= 0) {
        list[idx] = card;
      } else {
        list.unshift(card);
      }
      localStorage.setItem('foliolingo_wordbook', JSON.stringify(list));
    }

    if (!skipCloudSync && this.cloudSyncHandler?.onSave) {
      try {
        this.cloudSyncHandler.onSave(card);
      } catch (e) {
        console.warn('Cloud sync error on save:', e);
      }
    }
  }

  async deleteFlashcard(id: string, skipCloudSync = false): Promise<void> {
    try {
      const db = await this.initDb();
      const tx = db.transaction('wordbook', 'readwrite');
      tx.objectStore('wordbook').delete(id);
    } catch {
      const list = this.getFallbackFlashcards().filter((c) => c.id !== id);
      localStorage.setItem('foliolingo_wordbook', JSON.stringify(list));
    }

    if (!skipCloudSync && this.cloudSyncHandler?.onDelete) {
      try {
        this.cloudSyncHandler.onDelete(id);
      } catch (e) {
        console.warn('Cloud sync error on delete:', e);
      }
    }
  }

  private getFallbackFlashcards(lang?: string): Flashcard[] {
    try {
      const raw = localStorage.getItem('foliolingo_wordbook');
      if (raw) {
        const parsed: Flashcard[] = JSON.parse(raw);
        return lang ? parsed.filter((c) => c.language === lang) : parsed;
      }
    } catch (e) {
      console.warn('Error reading fallback flashcards', e);
    }
    return [];
  }

  // --- READING LOGS ---
  getReadingLogs(): ReadingLogEntry[] {
    try {
      const raw = localStorage.getItem(READING_LOGS_KEY);
      if (raw) {
        const parsed: ReadingLogEntry[] = JSON.parse(raw);
        return parsed.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      }
    } catch {
      // ignore
    }
    // Seed with 2 initial entries so the user sees how reading logs work immediately
    const initialLogs: ReadingLogEntry[] = [
      {
        id: 'log_seed_1',
        userId: 'local_scholar',
        bookId: 'es-quixote',
        bookTitle: 'Don Quijote de la Mancha',
        wordsCount: 280,
        language: 'es',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      },
      {
        id: 'log_seed_2',
        userId: 'local_scholar',
        bookId: 'es-epicteto',
        bookTitle: 'Manual de Vida (Enquiridión)',
        wordsCount: 210,
        language: 'es',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
      },
    ];
    try {
      localStorage.setItem(READING_LOGS_KEY, JSON.stringify(initialLogs));
    } catch {
      // ignore
    }
    return initialLogs;
  }

  saveReadingLog(entry: ReadingLogEntry, skipCloudSync = false): void {
    try {
      const existing = this.getReadingLogs();
      const idx = existing.findIndex((e) => e.id === entry.id);
      if (idx >= 0) {
        existing[idx] = entry;
      } else {
        existing.unshift(entry);
      }
      const trimmed = existing.slice(0, 100);
      localStorage.setItem(READING_LOGS_KEY, JSON.stringify(trimmed));
    } catch {
      // ignore
    }

    if (!skipCloudSync && this.cloudSyncHandler?.onSaveReadingLog) {
      try {
        this.cloudSyncHandler.onSaveReadingLog(entry);
      } catch (e) {
        console.warn('Cloud sync error on reading log:', e);
      }
    }
  }

  // --- USER PROFILE & HABIT ENGINE ---
  getUserProfile(): UserProfile {
    const defaultProfile: UserProfile = {
      id: 'local_scholar',
      name: 'Scholar',
      handle: '@scholar',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      nativeLanguage: 'English',
      targetLanguage: 'es',
      streakDays: 7,
      lastActiveDate: new Date().toISOString().split('T')[0],
      streakFrozen: false,
      totalWordsRead: 4520,
      wordsReadThisWeek: 1380,
      xp: 450,
      dailyWordGoal: 500,
      wordsReadToday: 180,
      leagueTier: 'Gold',
      following: ['u-1', 'u-2'],
      theme: 'light',
      readerFontSize: 'md',
    };

    try {
      const raw = localStorage.getItem('foliolingo_user_profile');
      if (raw) {
        const saved = JSON.parse(raw);
        const today = new Date().toISOString().split('T')[0];
        if (saved.lastActiveDate !== today) {
          const lastDate = new Date(saved.lastActiveDate);
          const currDate = new Date(today);
          const diffDays = Math.round((currDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            saved.wordsReadToday = 0;
          } else if (diffDays > 1) {
            if (!saved.streakFrozen) {
              saved.streakDays = 1;
            } else {
              saved.streakFrozen = false;
            }
            saved.wordsReadToday = 0;
          }
          saved.lastActiveDate = today;
          localStorage.setItem('foliolingo_user_profile', JSON.stringify(saved));
        }
        return { ...defaultProfile, ...saved };
      }
    } catch (e) {
      console.warn('Failed to parse user profile', e);
    }

    return defaultProfile;
  }

  saveUserProfile(profile: UserProfile): void {
    try {
      localStorage.setItem('foliolingo_user_profile', JSON.stringify(profile));
    } catch (e) {
      console.warn('Failed to save profile', e);
    }
  }

  /**
   * Record actual literary words read during a section completion
   */
  recordWordsRead(
    words: number,
    bookMeta?: { bookId?: string; bookTitle?: string; language?: LanguageCode }
  ): UserProfile {
    const profile = this.getUserProfile();
    const today = new Date().toISOString().split('T')[0];
    const cleanWords = Math.max(0, Math.round(words));

    profile.totalWordsRead += cleanWords;
    profile.wordsReadToday += cleanWords;
    profile.wordsReadThisWeek = (profile.wordsReadThisWeek || 1200) + cleanWords;
    profile.xp += Math.max(5, Math.round(cleanWords * 0.1));

    if (profile.lastActiveDate !== today) {
      profile.streakDays += 1;
      profile.lastActiveDate = today;
    }

    this.saveUserProfile(profile);

    if (cleanWords > 0) {
      const logEntry: ReadingLogEntry = {
        id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        userId: profile.id,
        bookId: bookMeta?.bookId,
        bookTitle: bookMeta?.bookTitle || 'Literary Passage',
        wordsCount: cleanWords,
        language: bookMeta?.language || profile.targetLanguage,
        timestamp: new Date().toISOString(),
      };
      this.saveReadingLog(logEntry);
    }

    return profile;
  }

  /**
   * Award exact XP for quizzes, flashcards, and vocabulary saves without inflating wordsReadToday
   */
  awardXP(xpAmount: number): UserProfile {
    const profile = this.getUserProfile();
    const today = new Date().toISOString().split('T')[0];
    profile.xp += Math.max(0, Math.round(xpAmount));

    if (profile.lastActiveDate !== today) {
      profile.streakDays += 1;
      profile.lastActiveDate = today;
    }

    this.saveUserProfile(profile);
    return profile;
  }

  /**
   * Retrieves cached Daily News Edition for the target language and native base language.
   * Returns null if missing or expired (Date.now() >= edition.expiresAt).
   */
  getCachedDailyNews(lang: LanguageCode, baseLang: string = 'English'): DailyNewsEdition | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
      const raw = localStorage.getItem(`foliolingo_daily_news_${lang}_${baseLang}`);
      if (!raw) return null;
      const edition: DailyNewsEdition = JSON.parse(raw);
      if (!edition || typeof edition.expiresAt !== 'number' || Date.now() >= edition.expiresAt) {
        return null;
      }
      return edition;
    } catch (err) {
      console.warn('Failed to parse cached daily news:', err);
      return null;
    }
  }

  /**
   * Persists Daily News Edition to localStorage keyed by target language and native base language.
   */
  saveDailyNews(edition: DailyNewsEdition, baseLang: string = 'English'): void {
    if (typeof window === 'undefined' || !window.localStorage || !edition?.language) return;
    try {
      localStorage.setItem(`foliolingo_daily_news_${edition.language}_${baseLang}`, JSON.stringify(edition));
    } catch (err) {
      console.warn('Failed to save daily news to localStorage:', err);
    }
  }
}

export const storageService = new StorageService();

