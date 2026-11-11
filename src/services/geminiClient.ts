import { CEFRLevel, WordBreakdown } from '../types/index.ts';
import { analyzeOfflineMorphology, lookupInstantWord } from './instantLexicon.ts';
import { storageService } from './storageService.ts';
import { costTelemetry } from './costTelemetry.ts';

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
   * Hover Intent Prefetch (triggered on word hover/focus).
   * Resolves via Local Lexicon first (0ms) or lightweight Fast Dictionary (<120ms, 0 Gemini quota),
   * and returns the resolved WordBreakdown so ReaderView knows the data is ready before click.
   */
  public async prefetchWord(
    word: string,
    sentence: string,
    targetLangName: string,
    baseLangName: string,
    targetLangCode?: string
  ): Promise<WordBreakdown | null> {
    const cleanWord = this.normalizeWord(word);
    if (!cleanWord || cleanWord.length <= 1) return null;

    const cacheKey = this.buildWordCacheKey(cleanWord, targetLangName, baseLangName);
    if (this.sessionWordCache.has(cacheKey)) {
      return this.sessionWordCache.get(cacheKey)!;
    }
    if (this.inFlightRequests.has(cacheKey)) {
      return this.inFlightRequests.get(cacheKey)!;
    }

    // Tier 0: Check Local Dictionary first so we don't make a network request if covered locally
    const langCode = targetLangCode || targetLangName.toLowerCase().slice(0, 2);
    const cachedSentence = this.sentenceCache.get(this.buildSentenceCacheKey(sentence, baseLangName));
    const localHit = lookupInstantWord(cleanWord, langCode, baseLangName, sentence, cachedSentence);
    if (localHit && cachedSentence) {
      this.sessionWordCache.set(cacheKey, localHit);
      return localHit;
    }

    // Tier 1: Lightweight dictionary hover prefetch (preferFastDict = true reduces Gemini API dependency)
    const promise = this.fetchWordFromServer(cleanWord, sentence, targetLangName, baseLangName, cacheKey, {
      preferFastDict: true,
    });
    this.inFlightRequests.set(cacheKey, promise);
    try {
      return await promise;
    } finally {
      this.inFlightRequests.delete(cacheKey);
    }
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
        const langCode = targetLangName.toLowerCase().slice(0, 2);
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
            storageService
              .saveOfflineDictionaryEntry(
                langCode,
                word,
                item.lemma || lower,
                item.partOfSpeech || 'Word',
                item.morphology || 'Contextual form',
                baseLangName,
                item.translation || word
              )
              .catch(() => {});
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
   * Uses Hybrid Strategy:
   * 1. L1 Session / Prefetch Cache (0ms, 0 API calls)
   * 2. In-flight Hover Prefetch reuse
   * 3. Local Dictionary + Stemmer fallback (0ms, 0 Gemini calls when sentence is cached)
   * 4. Server hybrid lookup (Gemini Flash-Lite + fast backup dictionary fallback)
   */
  async getWordBreakdown(
    word: string,
    sentence: string,
    targetLangName: string,
    baseLangName: string = 'English',
    onEnrich?: (enriched: WordBreakdown) => void,
    targetLangCode?: string
  ): Promise<WordBreakdown> {
    const cleanWord = this.normalizeWord(word);
    const cacheKey = this.buildWordCacheKey(cleanWord, targetLangName, baseLangName);
    const sKey = this.buildSentenceCacheKey(sentence, baseLangName);
    const cachedSentence = this.sentenceCache.get(sKey);

    // 1. Check L1 Session / Hover-Prefetch Cache (0ms latency, 0 Gemini API calls)
    if (this.sessionWordCache.has(cacheKey)) {
      costTelemetry.recordLookupSource('cache');
      const cached = this.sessionWordCache.get(cacheKey)!;
      return {
        ...cached,
        contextSentence: sentence,
        sentenceTranslation:
          cached.sentenceTranslation && cached.sentenceTranslation !== sentence
            ? cached.sentenceTranslation
            : cachedSentence || cached.sentenceTranslation,
        latencyMs: 0,
        sourceEngine: cached.sourceEngine === 'prefetch' ? 'prefetch' : cached.sourceEngine || 'cache',
        isEnriching: false,
      };
    }

    // 2. Reuse in-flight hover prefetch promise if currently resolving
    if (this.inFlightRequests.has(cacheKey)) {
      return this.inFlightRequests.get(cacheKey)!;
    }

    // 3. Check Instant Local Dictionary (<1ms) to avoid unnecessary Gemini calls
    const langCode = targetLangCode || targetLangName.toLowerCase().slice(0, 2);
    const instantHit = lookupInstantWord(cleanWord, langCode, baseLangName, sentence, cachedSentence);
    if (instantHit) {
      costTelemetry.recordLookupSource('lexicon');
      this.sessionWordCache.set(cacheKey, instantHit);
      // Only fetch sentence translation via fast dictionary if sentence wasn't cached yet
      if (!cachedSentence && onEnrich) {
        this.fetchWordFromServer(cleanWord, sentence, targetLangName, baseLangName, cacheKey, {
          preferFastDict: true,
        })
          .then((dictRes) => {
            const merged: WordBreakdown = {
              ...instantHit,
              sentenceTranslation: dictRes.sentenceTranslation || instantHit.sentenceTranslation,
              isEnriching: false,
            };
            this.sessionWordCache.set(cacheKey, merged);
            onEnrich(merged);
          })
          .catch(() => {});
      }
      return instantHit;
    }

    // 4. Perform live lookup (Gemini Flash-Lite + server dictionary fallback)
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

  /**
   * Explicit on-demand Deep AI Analysis when user requests full Gemini philological breakdown
   */
  async enrichWithDeepAi(
    word: string,
    sentence: string,
    targetLangName: string,
    baseLangName: string = 'English'
  ): Promise<WordBreakdown> {
    const cleanWord = this.normalizeWord(word);
    const cacheKey = this.buildWordCacheKey(cleanWord, targetLangName, baseLangName);
    return this.fetchWordFromServer(cleanWord, sentence, targetLangName, baseLangName, cacheKey, {
      preferFastDict: false,
      forceAi: true,
    });
  }

  private async fetchWordFromServer(
    cleanWord: string,
    sentence: string,
    targetLangName: string,
    baseLangName: string,
    cacheKey: string,
    options?: { preferFastDict?: boolean; forceAi?: boolean }
  ): Promise<WordBreakdown> {
    const startTime = performance.now();
    const canUseGemini = costTelemetry.canPerformGeminiCall();
    const forceFastDict = Boolean(options?.preferFastDict) || !canUseGemini;
    const forceAi = Boolean(options?.forceAi) && canUseGemini;
    const customApiKey = costTelemetry.getCustomGeminiApiKey() || undefined;

    try {
      const res = await fetch('/api/gemini/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: cleanWord,
          sentence: sentence.trim(),
          targetLang: targetLangName,
          baseLang: baseLangName,
          preferFastDict: forceFastDict,
          forceAi,
          customApiKey,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned ${res.status}`);
      }

      const data = await res.json();
      if (data.breakdown) {
        if (data.breakdown.sourceEngine === 'gemini') {
          costTelemetry.recordLookupSource('gemini');
        } else {
          costTelemetry.recordLookupSource('fast-dict');
        }
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
        storageService
          .saveOfflineDictionaryEntry(
            targetLangName.toLowerCase().slice(0, 2),
            cleanWord,
            result.lemma,
            result.partOfSpeech,
            result.morphology,
            baseLangName,
            result.translation
          )
          .catch(() => {});
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
    if (!costTelemetry.canPerformGeminiCall()) {
      return this.generateFallbackQuiz(textChunk, targetLangName, baseLangName);
    }
    const customApiKey = costTelemetry.getCustomGeminiApiKey() || undefined;
    try {
      const res = await fetch('/api/gemini/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textChunk: textChunk.slice(0, 2500),
          targetLang: targetLangName,
          baseLang: baseLangName,
          customApiKey,
        }),
      });

      if (!res.ok) {
        throw new Error(`Quiz endpoint returned ${res.status}`);
      }

      const data = await res.json();
      if (data.quiz && Array.isArray(data.quiz.questions) && data.quiz.questions.length > 0) {
        costTelemetry.recordLookupSource('gemini');
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
    if (level === 'Original' || !costTelemetry.canPerformGeminiCall()) return text;
    const customApiKey = costTelemetry.getCustomGeminiApiKey() || undefined;

    try {
      const res = await fetch('/api/gemini/adapt-cefr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          targetLang: targetLangName,
          level,
          customApiKey,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned ${res.status}`);
      }

      const data = await res.json();
      if (data.adaptedText) {
        costTelemetry.recordLookupSource('gemini');
      }
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
    const langCode = targetLang.toLowerCase().slice(0, 2);
    const morphAnalysis = analyzeOfflineMorphology(word, langCode);

    return {
      word,
      translation: word,
      lemma: morphAnalysis.lemma,
      partOfSpeech: morphAnalysis.pos,
      morphology: `${morphAnalysis.morph} (${targetLang})`,
      sentenceTranslation: cachedSent || sentence,
      usageNote: `Analyzed offline via Heuristic Morphological Lemmatizer (${targetLang}).`,
      contextSentence: sentence,
      targetLang,
      sourceEngine: 'lexicon',
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
