import { CEFRLevel, WordBreakdown } from '../types/index.ts';
import { lookupInstantWord } from './instantLexicon.ts';

export interface QuizQuestion {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface SectionQuiz {
  title: string;
  questions: QuizQuestion[];
}

const PERSISTENT_WORD_CACHE_KEY = 'foliolingo_word_cache_v4';
const PERSISTENT_SENTENCE_CACHE_KEY = 'foliolingo_sentence_cache_v4';

class GeminiClientService {
  // L1 In-memory cache for 0ms word lookups
  private sessionWordCache = new Map<string, WordBreakdown>();
  // L1 In-memory cache for pre-translated sentences
  private sentenceCache = new Map<string, string>();
  // Deduplication map for in-flight hover/click requests
  private inFlightRequests = new Map<string, Promise<WordBreakdown>>();
  // Track prefetched section keys to avoid redundant batch calls
  private prefetchedSections = new Set<string>();

  constructor() {
    this.hydratePersistentCache();
  }

  private hydratePersistentCache(): void {
    try {
      const rawWords = localStorage.getItem(PERSISTENT_WORD_CACHE_KEY);
      if (rawWords) {
        const parsed: [string, WordBreakdown][] = JSON.parse(rawWords);
        for (const [k, v] of parsed) {
          this.sessionWordCache.set(k, v);
        }
      }
      const rawSentences = localStorage.getItem(PERSISTENT_SENTENCE_CACHE_KEY);
      if (rawSentences) {
        const parsedS: [string, string][] = JSON.parse(rawSentences);
        for (const [k, v] of parsedS) {
          this.sentenceCache.set(k, v);
        }
      }
    } catch {
      // ignore storage errors
    }
  }

  private persistCaches(): void {
    try {
      const wordEntries = Array.from(this.sessionWordCache.entries()).slice(-500);
      localStorage.setItem(PERSISTENT_WORD_CACHE_KEY, JSON.stringify(wordEntries));
      const sentenceEntries = Array.from(this.sentenceCache.entries()).slice(-300);
      localStorage.setItem(PERSISTENT_SENTENCE_CACHE_KEY, JSON.stringify(sentenceEntries));
    } catch {
      // ignore quota errors
    }
  }

  public normalizeWord(word: string): string {
    return word.trim().replace(/^[«"'(—¡¿]+|[»"')!?,.:;—]+$/g, '');
  }

  private buildWordCacheKey(cleanWord: string, targetLangName: string, baseLangName: string): string {
    return `${cleanWord.toLowerCase()}__${targetLangName}__${baseLangName}`;
  }

  private buildSentenceCacheKey(sentence: string, baseLangName: string): string {
    return `${sentence.trim()}__${baseLangName}`;
  }

  /**
   * Synchronous 0ms lookup across L1 Cache, Batch Prefetch Cache, and Instant Lexicon
   */
  public getInstantCachedBreakdown(
    word: string,
    sentence: string,
    targetLangCode: string,
    targetLangName: string,
    baseLangName: string
  ): WordBreakdown | null {
    const cleanWord = this.normalizeWord(word);
    if (!cleanWord) return null;

    const cacheKey = this.buildWordCacheKey(cleanWord, targetLangName, baseLangName);
    const cachedSentence = this.sentenceCache.get(this.buildSentenceCacheKey(sentence, baseLangName));

    if (this.sessionWordCache.has(cacheKey)) {
      const hit = this.sessionWordCache.get(cacheKey)!;
      return {
        ...hit,
        contextSentence: sentence,
        sentenceTranslation:
          hit.sentenceTranslation && hit.sentenceTranslation !== sentence
            ? hit.sentenceTranslation
            : cachedSentence || hit.sentenceTranslation,
        latencyMs: 0,
        sourceEngine: hit.sourceEngine === 'prefetch' ? 'prefetch' : 'cache',
      };
    }

    const instantHit = lookupInstantWord(
      cleanWord,
      targetLangCode,
      baseLangName,
      sentence,
      cachedSentence
    );

    if (instantHit) {
      return instantHit;
    }

    return null;
  }

  /**
   * Look up pre-cached sentence translation if available
   */
  public getCachedSentenceTranslation(sentence: string, baseLangName: string): string | undefined {
    return this.sentenceCache.get(this.buildSentenceCacheKey(sentence, baseLangName));
  }

  /**
   * Hover Intent Prefetch (triggered after 80ms pointer dwell on a word)
   */
  public prefetchWord(
    word: string,
    sentence: string,
    targetLangName: string,
    baseLangName: string
  ): void {
    const cleanWord = this.normalizeWord(word);
    if (!cleanWord || cleanWord.length <= 1) return;

    const cacheKey = this.buildWordCacheKey(cleanWord, targetLangName, baseLangName);
    if (this.sessionWordCache.has(cacheKey) || this.inFlightRequests.has(cacheKey)) {
      return;
    }

    // Fire and track in inFlightRequests so an immediate click reuses this exact promise
    const promise = this.fetchWordFromServer(cleanWord, sentence, targetLangName, baseLangName, cacheKey);
    this.inFlightRequests.set(cacheKey, promise);
    promise.finally(() => {
      this.inFlightRequests.delete(cacheKey);
    });
  }

  /**
   * Proactive Section Batch Pre-Caching:
   * Translates all sentences and top vocabulary of the active section in 1 background round-trip
   */
  public async prefetchSectionBatch(
    sectionText: string,
    targetLangName: string,
    baseLangName: string
  ): Promise<void> {
    if (!sectionText || !sectionText.trim()) return;

    const sectionSignature = `${sectionText.slice(0, 120)}__${targetLangName}__${baseLangName}`;
    if (this.prefetchedSections.has(sectionSignature)) return;
    this.prefetchedSections.add(sectionSignature);

    try {
      // Extract unique sentences from section
      const rawSentences = sectionText
        .split(/\n\s*\n/)
        .flatMap((para) => para.trim().match(/[^.!?]+[.!?]+|\S+/g) || [])
        .map((s) => s.trim())
        .filter((s) => s.length > 3);

      const uniqueSentences = Array.from(new Set(rawSentences)).slice(0, 18);

      // Extract top content words (length >= 4) not yet in sessionWordCache
      const candidateWords: { word: string; sentence: string }[] = [];
      const seenWords = new Set<string>();

      for (const sent of uniqueSentences) {
        const tokens = sent.split(/\s+/);
        for (const tok of tokens) {
          const clean = this.normalizeWord(tok);
          const lower = clean.toLowerCase();
          if (clean.length >= 4 && !seenWords.has(lower)) {
            const cKey = this.buildWordCacheKey(clean, targetLangName, baseLangName);
            if (!this.sessionWordCache.has(cKey)) {
              seenWords.add(lower);
              candidateWords.push({ word: clean, sentence: sent });
              if (candidateWords.length >= 25) break;
            }
          }
        }
        if (candidateWords.length >= 25) break;
      }

      const res = await fetch('/api/gemini/batch-prefetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sentences: uniqueSentences,
          words: candidateWords,
          targetLang: targetLangName,
          baseLang: baseLangName,
        }),
      });

      if (!res.ok) return;
      const data = await res.json();

      // Store sentence translations
      if (data.sentences && typeof data.sentences === 'object') {
        for (const [sent, trans] of Object.entries(data.sentences)) {
          if (typeof trans === 'string' && trans) {
            this.sentenceCache.set(this.buildSentenceCacheKey(sent, baseLangName), trans);
          }
        }
      }

      // Store pre-cached word breakdowns
      if (data.words && typeof data.words === 'object') {
        for (const { word, sentence } of candidateWords) {
          const lower = word.toLowerCase();
          const item = data.words[lower];
          if (item) {
            const cKey = this.buildWordCacheKey(word, targetLangName, baseLangName);
            if (!this.sessionWordCache.has(cKey)) {
              this.sessionWordCache.set(cKey, {
                ...item,
                contextSentence: sentence,
                targetLang: targetLangName,
                latencyMs: 0,
                sourceEngine: 'prefetch',
              });
            }
          }
        }
      }

      this.persistCaches();
    } catch {
      // Silent background prefetch failure is non-blocking
    }
  }

  /**
   * Request context-aware breakdown for clicked word.
   * Supports progressive enrichment via optional `onEnrich` callback.
   */
  async getWordBreakdown(
    word: string,
    sentence: string,
    targetLangName: string,
    baseLangName: string = 'English',
    onEnrich?: (enriched: WordBreakdown) => void
  ): Promise<WordBreakdown> {
    const cleanWord = this.normalizeWord(word);
    const cacheKey = this.buildWordCacheKey(cleanWord, targetLangName, baseLangName);
    const sKey = this.buildSentenceCacheKey(sentence, baseLangName);
    const cachedSentence = this.sentenceCache.get(sKey);

    // 1. Check L1 Session Cache (0ms latency)
    if (this.sessionWordCache.has(cacheKey)) {
      const cached = this.sessionWordCache.get(cacheKey)!;
      const resolved: WordBreakdown = {
        ...cached,
        contextSentence: sentence,
        sentenceTranslation:
          cached.sentenceTranslation && cached.sentenceTranslation !== sentence
            ? cached.sentenceTranslation
            : cachedSentence || cached.sentenceTranslation,
        latencyMs: 0,
        sourceEngine: cached.sourceEngine === 'prefetch' ? 'prefetch' : 'cache',
        isEnriching: false,
      };

      // If this entry came from fast batch prefetch, enrich deep morphology in background
      if (cached.sourceEngine === 'prefetch' && onEnrich) {
        this.fetchWordFromServer(cleanWord, sentence, targetLangName, baseLangName, cacheKey)
          .then((deepResult) => {
            onEnrich({ ...deepResult, isEnriching: false });
          })
          .catch(() => {});
      }

      return resolved;
    }

    // 2. Check if a hover prefetch is already in flight for this exact word!
    if (this.inFlightRequests.has(cacheKey)) {
      return this.inFlightRequests.get(cacheKey)!;
    }

    // 3. Check Instant Lexicon (<1ms) and fire progressive enrichment
    const langCode = targetLangName.toLowerCase().slice(0, 2);
    const instantHit = lookupInstantWord(cleanWord, langCode, baseLangName, sentence, cachedSentence);
    if (instantHit) {
      this.fetchWordFromServer(cleanWord, sentence, targetLangName, baseLangName, cacheKey)
        .then((deepResult) => {
          if (onEnrich) {
            onEnrich({ ...deepResult, isEnriching: false });
          }
        })
        .catch(() => {});
      return instantHit;
    }

    // 4. Perform live ultra-fast lookup (`gemini-3.1-flash-lite` + server backup fallback)
    const requestPromise = this.fetchWordFromServer(
      cleanWord,
      sentence,
      targetLangName,
      baseLangName,
      cacheKey
    );
    this.inFlightRequests.set(cacheKey, requestPromise);
    try {
      return await requestPromise;
    } finally {
      this.inFlightRequests.delete(cacheKey);
    }
  }

  private async fetchWordFromServer(
    cleanWord: string,
    sentence: string,
    targetLangName: string,
    baseLangName: string,
    cacheKey: string
  ): Promise<WordBreakdown> {
    const startTime = performance.now();

    try {
      const res = await fetch('/api/gemini/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: cleanWord,
          sentence: sentence.trim(),
          targetLang: targetLangName,
          baseLang: baseLangName,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned ${res.status}`);
      }

      const data = await res.json();
      if (data.breakdown) {
        const clientLatency = Math.round(performance.now() - startTime);
        const result: WordBreakdown = {
          ...data.breakdown,
          contextSentence: sentence,
          targetLang: targetLangName,
          latencyMs: data.breakdown.latencyMs ?? clientLatency,
          isEnriching: false,
        };

        if (result.sentenceTranslation && result.sentenceTranslation !== sentence) {
          this.sentenceCache.set(this.buildSentenceCacheKey(sentence, baseLangName), result.sentenceTranslation);
        }

        this.sessionWordCache.set(cacheKey, result);
        this.persistCaches();
        return result;
      }
      throw new Error('Invalid breakdown format received');
    } catch (err: any) {
      console.warn('Breakdown API error, applying local linguistic fallback:', err);
      const fallback = this.generateFallbackBreakdown(cleanWord, sentence, targetLangName, baseLangName);
      this.sessionWordCache.set(cacheKey, fallback);
      return fallback;
    }
  }

  /**
   * Request interactive comprehension quiz for section
   */
  async getSectionQuiz(
    textChunk: string,
    targetLangName: string,
    baseLangName: string = 'English'
  ): Promise<SectionQuiz> {
    try {
      const res = await fetch('/api/gemini/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textChunk: textChunk.slice(0, 2500),
          targetLang: targetLangName,
          baseLang: baseLangName,
        }),
      });

      if (!res.ok) {
        throw new Error(`Quiz endpoint returned ${res.status}`);
      }

      const data = await res.json();
      if (data.quiz && Array.isArray(data.quiz.questions) && data.quiz.questions.length > 0) {
        return data.quiz;
      }
      throw new Error('Incomplete quiz structure');
    } catch (err) {
      console.warn('Quiz API error, providing local comprehension check:', err);
      return this.generateFallbackQuiz(textChunk, targetLangName, baseLangName);
    }
  }

  /**
   * Request CEFR Level Adaptation for chapter text
   */
  async adaptToCEFR(
    text: string,
    targetLangName: string,
    level: CEFRLevel
  ): Promise<string> {
    if (level === 'Original') return text;

    try {
      const res = await fetch('/api/gemini/adapt-cefr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          targetLang: targetLangName,
          level,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned ${res.status}`);
      }

      const data = await res.json();
      return data.adaptedText || text;
    } catch (err) {
      console.warn('Gemini CEFR adapt failed, returning original text:', err);
      return text;
    }
  }

  /**
   * Offline client-only fallback if server is completely unreachable
   */
  private generateFallbackBreakdown(
    word: string,
    sentence: string,
    targetLang: string,
    baseLang: string
  ): WordBreakdown {
    const cachedSent = this.sentenceCache.get(this.buildSentenceCacheKey(sentence, baseLang));
    const lemma = word.toLowerCase();
    let pos = 'Word';
    let morphology = 'Contextual form';

    if (lemma.endsWith('ando') || lemma.endsWith('iendo') || lemma.endsWith('ant') || lemma.endsWith('erek')) {
      pos = 'Verb (Gerund / Continuous)';
      morphology = 'Continuous / Participle form';
    } else if (lemma.endsWith('ado') || lemma.endsWith('ido') || lemma.endsWith('é') || lemma.endsWith('dı') || lemma.endsWith('di')) {
      pos = 'Verb (Past Form)';
      morphology = 'Past tense / Perfective aspect';
    } else if (lemma.endsWith('mente') || lemma.endsWith('ment') || lemma.endsWith('ca') || lemma.endsWith('ce')) {
      pos = 'Adverb';
      morphology = 'Manner / Modifying adverb';
    } else if (lemma.endsWith('ción') || lemma.endsWith('tion') || lemma.endsWith('heit') || lemma.endsWith('lik')) {
      pos = 'Noun';
      morphology = 'Substantive concept';
    }

    return {
      word,
      translation: word,
      lemma,
      partOfSpeech: pos,
      morphology: `${morphology} in ${targetLang}`,
      sentenceTranslation: cachedSent || sentence,
      usageNote: `Contextual usage in ${targetLang}.`,
      contextSentence: sentence,
      targetLang,
      sourceEngine: 'backup-translator',
      isEnriching: false,
    };
  }

  private generateFallbackQuiz(textChunk: string, targetLang: string, baseLang: string): SectionQuiz {
    const words = textChunk.split(/\s+/).filter((w) => w.length > 5);
    const sampleWord = words[0] || 'reading';

    return {
      title: `Section Comprehension Check (${targetLang})`,
      questions: [
        {
          id: 'q1',
          category: 'Comprehension',
          question: `What is the overarching tone and atmosphere established in this section of the text?`,
          options: [
            'Reflective, descriptive, and measured',
            'Frantic, rushed, and comic',
            'Technical, scientific, and dry',
            'Purely dialogue without any setting',
          ],
          correctIndex: 0,
          explanation: 'The excerpt is characterized by literary narrative depth and descriptive pacing.',
        },
        {
          id: 'q2',
          category: 'Vocabulary',
          question: `How does the vocabulary in this passage contribute to understanding in ${baseLang}?`,
          options: [
            `It reinforces key themes with words like "${sampleWord}"`,
            'It uses only modern computer jargon',
            'It avoids any nouns or adjectives',
            'It contains no connected sentences',
          ],
          correctIndex: 0,
          explanation: `Literary prose uses authentic thematic vocabulary such as "${sampleWord}" to build narrative context.`,
        },
        {
          id: 'q3',
          category: 'Nuance',
          question: `What is the best strategy when reading literary works in ${targetLang}?`,
          options: [
            'Focus on contextual sentence meaning first rather than isolated words',
            'Translate every single preposition word-for-word',
            'Ignore all verbs and adjectives',
            'Skip directly to the end of the chapter',
          ],
          correctIndex: 0,
          explanation: 'Acquiring language through natural reading context delivers deeper comprehension and long-term retention.',
        },
      ],
    };
  }
}

export const geminiClient = new GeminiClientService();
