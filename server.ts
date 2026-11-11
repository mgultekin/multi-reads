import express, { type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const isProd =
  process.env.NODE_ENV === 'production' ||
  process.env.npm_lifecycle_event === 'start';
const PORT = isProd && process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to get Gemini client
function getGeminiClient(userApiKey?: string): GoogleGenAI | null {
  const apiKey = userApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Language name/code to ISO 639-1 code mapping for fast dictionary/translation fallback
const LANG_ISO_MAP: Record<string, string> = {
  spanish: 'es', es: 'es', español: 'es',
  french: 'fr', fr: 'fr', français: 'fr',
  german: 'de', de: 'de', deutsch: 'de',
  italian: 'it', it: 'it', italiano: 'it',
  turkish: 'tr', tr: 'tr', türkçe: 'tr',
  english: 'en', en: 'en',
  portuguese: 'pt', pt: 'pt', português: 'pt',
  russian: 'ru', ru: 'ru', русский: 'ru',
  arabic: 'ar', ar: 'ar', العربية: 'ar',
  japanese: 'ja', ja: 'ja', 日本語: 'ja',
  korean: 'ko', ko: 'ko', 한국어: 'ko',
  chinese: 'zh-CN', zh: 'zh-CN', 中文: 'zh-CN',
  dutch: 'nl', nl: 'nl', nederlands: 'nl',
  polish: 'pl', pl: 'pl', polski: 'pl',
};

function resolveIsoCode(lang: string, fallback = 'en'): string {
  if (!lang) return fallback;
  const key = lang.trim().toLowerCase();
  return LANG_ISO_MAP[key] || key.slice(0, 2) || fallback;
}

// High-speed Server-Side True LRU Caches
const serverBreakdownCache = new Map<string, any>();
const serverSentenceCache = new Map<string, string>();
const serverAdaptationCache = new Map<string, any>();
const MAX_SERVER_CACHE = 2000;
const MAX_ADAPTATION_CACHE = 300;

function getServerCache<T>(map: Map<string, T>, key: string): T | undefined {
  if (!map.has(key)) return undefined;
  const value = map.get(key)!;
  // Refresh key order in Map (move to newest / MRU position)
  map.delete(key);
  map.set(key, value);
  return value;
}

function setServerCache<T>(
  map: Map<string, T>,
  key: string,
  value: T,
  maxEntries: number = MAX_SERVER_CACHE
) {
  if (map.has(key)) {
    map.delete(key);
  } else if (map.size >= maxEntries) {
    const oldestKey = map.keys().next().value;
    if (oldestKey !== undefined) map.delete(oldestKey);
  }
  map.set(key, value);
}

// Fast heuristic morphology analyzer for backup engine & instant enrichment
function inferMorphology(word: string, targetIso: string): { lemma: string; pos: string; morphology: string } {
  const w = word.toLowerCase().trim();
  let lemma = w;
  let pos = 'Word';
  let morphology = 'Contextual form';

  if (targetIso === 'es') {
    if (w.endsWith('ando') || w.endsWith('iendo')) {
      lemma = w.replace(/(ando|iendo)$/, 'ar');
      pos = 'Verb (Gerund)';
      morphology = 'Progressive participle';
    } else if (w.endsWith('aba') || w.endsWith('aban') || w.endsWith('ía') || w.endsWith('ían')) {
      lemma = w.replace(/(aba|aban)$/, 'ar').replace(/(ía|ían)$/, 'er');
      pos = 'Verb (Imperfect)';
      morphology = 'Past Imperfect Indicative';
    } else if (w.endsWith('aron') || w.endsWith('ieron')) {
      lemma = w.replace(/aron$/, 'ar').replace(/ieron$/, 'ir');
      pos = 'Verb (Preterite)';
      morphology = '3rd Person Plural Preterite';
    } else if (w.endsWith('mente')) {
      lemma = w.replace(/mente$/, '');
      pos = 'Adverb';
      morphology = 'Adverb of manner';
    } else if (w.endsWith('ción') || w.endsWith('sión')) {
      pos = 'Noun (Feminine)';
      morphology = 'Singular abstract noun';
    } else if (w.endsWith('os') || w.endsWith('as') || w.endsWith('es')) {
      lemma = w.replace(/s$/, '');
      pos = 'Noun / Adjective';
      morphology = 'Plural inflection';
    }
  } else if (targetIso === 'fr') {
    if (w.endsWith('ait') || w.endsWith('aient')) {
      lemma = w.replace(/(ait|aient)$/, 'er');
      pos = 'Verb (Imperfect)';
      morphology = 'Imparfait de l’indicatif';
    } else if (w.endsWith('ant')) {
      lemma = w.replace(/ant$/, 'er');
      pos = 'Verb (Participle)';
      morphology = 'Participe présent';
    } else if (w.endsWith('ment') && w.length > 5) {
      pos = 'Adverb';
      morphology = 'Manner adverb';
    } else if (w.endsWith('eux') || w.endsWith('euse')) {
      pos = 'Adjective';
      morphology = 'Descriptive adjective';
    }
  } else if (targetIso === 'de') {
    if (/^[A-ZÄÖÜ]/.test(word.trim())) {
      pos = 'Noun';
      morphology = 'Capitalized German substantive';
      lemma = word.trim();
    } else if (w.endsWith('te') || w.endsWith('ten')) {
      lemma = w.replace(/(te|ten)$/, 'en');
      pos = 'Verb (Präteritum)';
      morphology = 'Simple past tense';
    } else if (w.endsWith('en')) {
      pos = 'Verb / Infinitive';
      morphology = 'Infinitive or plural verb form';
    }
  } else if (targetIso === 'it') {
    if (w.endsWith('ava') || w.endsWith('avano') || w.endsWith('eva')) {
      lemma = w.replace(/(ava|avano)$/, 'are').replace(/eva$/, 'ere');
      pos = 'Verb (Imperfect)';
      morphology = 'Indicativo imperfetto';
    } else if (w.endsWith('mente')) {
      pos = 'Adverb';
      morphology = 'Manner adverb';
    }
  } else if (targetIso === 'tr') {
    if (w.endsWith('yor') || w.endsWith('yordu')) {
      lemma = w.replace(/ı?yor(du)?$/, 'mak');
      pos = 'Fiil (Şimdiki/Hikâye)';
      morphology = 'Sürekli görünüş (Continuous aspect)';
    } else if (w.endsWith('mış') || w.endsWith('miş') || w.endsWith('muş') || w.endsWith('müş')) {
      pos = 'Fiil (Duyulan Geçmiş)';
      morphology = 'Evidential past tense';
    } else if (w.endsWith('lar') || w.endsWith('ler')) {
      lemma = w.replace(/(lar|ler)$/, '');
      pos = 'İsim (Çoğul)';
      morphology = 'Plural substantive';
    }
  }

  return { lemma, pos, morphology };
}

// Fast Backup Dictionary & Sentence Translation Engine (<150ms)
async function translateTextBackup(text: string, sourceIso: string, targetIso: string): Promise<{
  translation: string;
  dictPos?: string;
  dictLemma?: string;
  alternatives?: string[];
}> {
  if (!text.trim()) return { translation: '' };
  if (sourceIso === targetIso) return { translation: text };

  const sKey = `${sourceIso}__${targetIso}__${text.trim()}`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2200);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
      sourceIso
    )}&tl=${encodeURIComponent(targetIso)}&dt=t&dt=bd&dt=rm&q=${encodeURIComponent(text.trim())}`;

    const resp = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    clearTimeout(timeout);

    if (resp.ok) {
      const data = await resp.json();
      // data[0] contains translated sentence segments
      const translatedSegments: string[] = [];
      if (Array.isArray(data?.[0])) {
        for (const seg of data[0]) {
          if (seg?.[0]) translatedSegments.push(seg[0]);
        }
      }
      const primaryTranslation = translatedSegments.join('').trim();

      // data[1] contains dictionary breakdown if single word
      let dictPos: string | undefined;
      let dictLemma: string | undefined;
      const alternatives: string[] = [];

      if (Array.isArray(data?.[1]) && data[1].length > 0) {
        const firstDict = data[1][0];
        if (typeof firstDict?.[0] === 'string' && firstDict[0]) {
          dictPos = firstDict[0].charAt(0).toUpperCase() + firstDict[0].slice(1);
        }
        if (typeof firstDict?.[4] === 'string' && firstDict[4]) {
          dictLemma = firstDict[4];
        }
        if (Array.isArray(firstDict?.[1])) {
          alternatives.push(...firstDict[1].slice(0, 3));
        }
      }

      if (primaryTranslation) {
        setServerCache(serverSentenceCache, sKey, primaryTranslation);
        return {
          translation: alternatives.length > 1 ? `${primaryTranslation} (${alternatives.slice(0, 2).join(', ')})` : primaryTranslation,
          dictPos,
          dictLemma,
          alternatives,
        };
      }
    }
  } catch {
    // Fallback to MyMemory if GTX endpoint is unreachable
  }

  try {
    const mmUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      text.trim()
    )}&langpair=${encodeURIComponent(sourceIso)}|${encodeURIComponent(targetIso)}`;
    const mmResp = await fetch(mmUrl);
    if (mmResp.ok) {
      const mmData = await mmResp.json();
      const translated = mmData?.responseData?.translatedText;
      if (translated && typeof translated === 'string') {
        setServerCache(serverSentenceCache, sKey, translated);
        return { translation: translated };
      }
    }
  } catch {
    // ignore
  }

  return { translation: text };
}

async function buildBackupBreakdown(
  word: string,
  sentence: string,
  targetLang: string,
  baseLang: string
) {
  const sourceIso = resolveIsoCode(targetLang, 'es');
  const targetIso = resolveIsoCode(baseLang, 'en');
  const heur = inferMorphology(word, sourceIso);

  const [wordRes, sentenceRes] = await Promise.all([
    translateTextBackup(word, sourceIso, targetIso),
    translateTextBackup(sentence, sourceIso, targetIso),
  ]);

  const pos = wordRes.dictPos || heur.pos;
  const lemma = wordRes.dictLemma || heur.lemma;

  return {
    word,
    translation: wordRes.translation || word,
    lemma,
    partOfSpeech: pos,
    morphology: `${heur.morphology} (${targetLang})`,
    sentenceTranslation: sentenceRes.translation || sentence,
    usageNote:
      wordRes.alternatives && wordRes.alternatives.length > 0
        ? `Contextual shades in ${baseLang}: ${wordRes.alternatives.join(', ')}.`
        : `Used in the clause: "${sentence.slice(0, 80)}${sentence.length > 80 ? '...' : ''}"`,
    sourceEngine: 'backup-translator' as const,
  };
}

// 1. Ultra-Fast Context-Aware Word & Grammar Breakdown (Folio Engine Hybrid Strategy)
app.post('/api/gemini/breakdown', async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  try {
    const {
      word,
      sentence,
      targetLang = 'Spanish',
      baseLang = 'English',
      customApiKey,
      preferFastDict = false,
    } = req.body;

    if (!word || !sentence) {
      res.status(400).json({ error: 'Both "word" and "sentence" are required.' });
      return;
    }

    const cleanWord = String(word).trim();
    const cleanSentence = String(sentence).trim();
    const wordOnlyKey = `${cleanWord.toLowerCase()}__${targetLang}__${baseLang}`;
    const cacheKey = `${wordOnlyKey}__${cleanSentence.slice(0, 64)}`;

    // 1. Check Server True LRU Cache (<1ms) and refresh MRU order on hit
    if (!req.body.forceAi) {
      const cached =
        getServerCache(serverBreakdownCache, cacheKey) ||
        getServerCache(serverBreakdownCache, wordOnlyKey);
      if (cached) {
        res.json({
          success: true,
          breakdown: {
            ...cached,
            latencyMs: Date.now() - startTime,
            sourceEngine: 'cache',
          },
        });
        return;
      }
    }

    // Start backup translation in parallel so we have an instant safety net and accurate fallback
    const backupPromise = buildBackupBreakdown(cleanWord, cleanSentence, targetLang, baseLang);

    // When preferFastDict is true (e.g. hover prefetch), resolve via fast dictionary without consuming Gemini API quota
    const ai = preferFastDict ? null : getGeminiClient(customApiKey);
    if (!ai) {
      const backup = await backupPromise;
      const payload = {
        ...backup,
        latencyMs: Date.now() - startTime,
        sourceEngine: preferFastDict ? ('prefetch' as const) : ('backup-translator' as const),
      };
      setServerCache(serverBreakdownCache, cacheKey, payload);
      setServerCache(serverBreakdownCache, wordOnlyKey, payload);
      res.json({ success: true, breakdown: payload });
      return;
    }

    const prompt = `Word: "${cleanWord}"
Sentence: "${cleanSentence}"
Source language: ${targetLang}
Target translation language: ${baseLang}

Return JSON with contextual meaning of "${cleanWord}" in ${baseLang}, dictionary root lemma, part of speech, brief morphology, 1-line usage note, IPA pronunciation, and natural translation of the full sentence into ${baseLang}.`;

    const geminiPromise = ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        systemInstruction: `You are FolioLingo's ultra-low-latency linguist. Translate accurately into ${baseLang}. Return compact valid JSON.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            translation: { type: Type.STRING },
            lemma: { type: Type.STRING },
            partOfSpeech: { type: Type.STRING },
            morphology: { type: Type.STRING },
            sentenceTranslation: { type: Type.STRING },
            usageNote: { type: Type.STRING },
            phoneticIpa: { type: Type.STRING },
          },
          required: ['word', 'translation', 'lemma', 'partOfSpeech', 'morphology', 'sentenceTranslation'],
        },
      },
    });

    // Race Gemini against a 2200ms SLA timeout; if Gemini fails or times out, resolve immediately with backupPromise
    try {
      const response = await Promise.race([
        geminiPromise,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('GEMINI_SLA_TIMEOUT')), 2200)),
      ]);
      const jsonText = response.text || '{}';
      const parsed = JSON.parse(jsonText);
      const backup = await backupPromise.catch(() => null);

      const finalBreakdown = {
        word: parsed.word || cleanWord,
        translation: parsed.translation || backup?.translation || cleanWord,
        lemma: parsed.lemma || backup?.lemma || cleanWord.toLowerCase(),
        partOfSpeech: parsed.partOfSpeech || backup?.partOfSpeech || 'Word',
        morphology: parsed.morphology || backup?.morphology || 'Contextual form',
        sentenceTranslation: parsed.sentenceTranslation || backup?.sentenceTranslation || cleanSentence,
        usageNote: parsed.usageNote || backup?.usageNote,
        phoneticIpa: parsed.phoneticIpa,
        latencyMs: Date.now() - startTime,
        sourceEngine: 'gemini-flash-lite' as const,
      };

      setServerCache(serverBreakdownCache, cacheKey, finalBreakdown);
      setServerCache(serverBreakdownCache, wordOnlyKey, finalBreakdown);
      res.json({ success: true, breakdown: finalBreakdown });
      return;
    } catch (geminiErr: any) {
      // Seamless zero-failure fallback to fast backup translator
      const backup = await backupPromise;
      const fallbackPayload = {
        ...backup,
        latencyMs: Date.now() - startTime,
        sourceEngine: 'backup-translator' as const,
      };
      setServerCache(serverBreakdownCache, cacheKey, fallbackPayload);
      setServerCache(serverBreakdownCache, wordOnlyKey, fallbackPayload);
      res.json({ success: true, breakdown: fallbackPayload });
      return;
    }
  } catch (error: any) {
    console.error('Error in /api/gemini/breakdown:', error);
    res.status(500).json({
      error: error.message || 'Failed to analyze word breakdown.',
      details: error.status || 'GENAI_ERROR',
    });
  }
});

// 1B. Proactive Section Batch Pre-Caching Endpoint (Translates sentences & key section words in 1 roundtrip)
app.post('/api/gemini/batch-prefetch', async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  try {
    const {
      sentences = [],
      words = [],
      targetLang = 'Spanish',
      baseLang = 'English',
    } = req.body;

    const sourceIso = resolveIsoCode(targetLang, 'es');
    const targetIso = resolveIsoCode(baseLang, 'en');

    const uniqueSentences: string[] = Array.from(
      new Set((Array.isArray(sentences) ? sentences : []).map((s: any) => String(s).trim()).filter(Boolean))
    ).slice(0, 20);

    const uniqueWords: { word: string; sentence: string }[] = (Array.isArray(words) ? words : [])
      .filter((w: any) => w && w.word)
      .slice(0, 28);

    // 1. Translate all sentences in parallel using server LRU cache + fast translation pipeline
    const sentenceTranslations: Record<string, string> = {};
    await Promise.all(
      uniqueSentences.map(async (sent) => {
        const sKey = `${sourceIso}__${targetIso}__${sent}`;
        const cachedSent = getServerCache(serverSentenceCache, sKey);
        if (cachedSent) {
          sentenceTranslations[sent] = cachedSent;
          return;
        }
        const resTrans = await translateTextBackup(sent, sourceIso, targetIso);
        if (resTrans.translation) {
          sentenceTranslations[sent] = resTrans.translation;
        }
      })
    );

    // 2. Pre-build dictionary breakdowns for the section's top vocabulary in parallel (checking serverBreakdownCache first)
    const wordBreakdowns: Record<string, any> = {};
    await Promise.all(
      uniqueWords.map(async ({ word, sentence }) => {
        const cleanW = String(word).trim();
        const cleanS = String(sentence || '').trim();
        if (!cleanW) return;

        const wKey = cleanW.toLowerCase();
        const wordOnlyCacheKey = `${wKey}__${targetLang}__${baseLang}`;
        const fullCacheKey = `${wordOnlyCacheKey}__${cleanS.slice(0, 64)}`;

        const sentTrans =
          sentenceTranslations[cleanS] ||
          getServerCache(serverSentenceCache, `${sourceIso}__${targetIso}__${cleanS}`) ||
          cleanS;

        // Check serverBreakdownCache before making an outbound translation call
        const cachedBreakdown =
          getServerCache(serverBreakdownCache, fullCacheKey) ||
          getServerCache(serverBreakdownCache, wordOnlyCacheKey);
        if (cachedBreakdown) {
          wordBreakdowns[wKey] = {
            ...cachedBreakdown,
            sentenceTranslation:
              cachedBreakdown.sentenceTranslation && cachedBreakdown.sentenceTranslation !== cleanS
                ? cachedBreakdown.sentenceTranslation
                : sentTrans,
            sourceEngine: 'cache',
          };
          return;
        }

        const wordRes = await translateTextBackup(cleanW, sourceIso, targetIso);
        const heur = inferMorphology(cleanW, sourceIso);

        const item = {
          word: cleanW,
          translation: wordRes.translation || cleanW,
          lemma: wordRes.dictLemma || heur.lemma,
          partOfSpeech: wordRes.dictPos || heur.pos,
          morphology: `${heur.morphology} (${targetLang})`,
          sentenceTranslation: sentTrans,
          usageNote:
            wordRes.alternatives && wordRes.alternatives.length > 0
              ? `Nuances in ${baseLang}: ${wordRes.alternatives.join(', ')}.`
              : `Pre-cached contextual meaning in ${baseLang}.`,
          sourceEngine: 'prefetch',
        };
        setServerCache(serverBreakdownCache, fullCacheKey, item);
        setServerCache(serverBreakdownCache, wordOnlyCacheKey, item);
        wordBreakdowns[wKey] = item;
      })
    );

    res.json({
      success: true,
      latencyMs: Date.now() - startTime,
      sentences: sentenceTranslations,
      words: wordBreakdowns,
    });
  } catch (err: any) {
    console.error('Error in /api/gemini/batch-prefetch:', err);
    res.json({ success: false, sentences: {}, words: {} });
  }
});

// Helper for heuristic CEFR sentence simplification when Gemini is unavailable
function buildFallbackCefrAdaptation(text: string, level: string): string {
  if (level === 'Original' || level === 'C1' || level === 'B2') {
    return text;
  }
  // For A1/A2/B1, split long compound clauses at semicolons/colons into cleaner, shorter sentences
  const paragraphs = text.split(/\n\s*\n/);
  const simplified = paragraphs.map((para) => {
    const cleaned = para
      .replace(/;\s+/g, '. ')
      .replace(/:\s+/g, '. ')
      .replace(/\s+—\s+/g, ', ');
    if (level === 'A1') {
      const sentences = cleaned.match(/[^.!?]+[.!?]+|\S+/g) || [cleaned];
      return sentences.slice(0, Math.max(2, Math.ceil(sentences.length * 0.75))).join(' ').trim();
    }
    return cleaned.trim();
  });
  return simplified.join('\n\n');
}

// Helper for dynamic vocabulary & comprehension quiz fallback using backup translator
async function buildFallbackQuiz(textChunk: string, targetLang: string, baseLang: string) {
  const sourceIso = resolveIsoCode(targetLang, 'es');
  const targetIso = resolveIsoCode(baseLang, 'en');

  const rawSentences = (textChunk.match(/[^.!?]+[.!?]+/g) || [textChunk])
    .map((s) => s.trim())
    .filter((s) => s.length > 15);
  const firstSentence = rawSentences[0] || textChunk.slice(0, 140);

  const words = textChunk
    .split(/\s+/)
    .map((w) => w.replace(/^[«"'(—¡¿]+|[»"')!?,.:;—]+$/g, '').trim())
    .filter((w) => w.length >= 5);
  const targetWord = words[0] || 'lectura';

  const [sentTrans, wordTrans] = await Promise.all([
    translateTextBackup(firstSentence, sourceIso, targetIso),
    translateTextBackup(targetWord, sourceIso, targetIso),
  ]);

  return {
    title: `Section Comprehension & Vocabulary Check (${targetLang})`,
    questions: [
      {
        id: 'q1',
        category: 'Comprehension',
        question: `What is the primary meaning of the opening passage: "${firstSentence.slice(0, 90)}${firstSentence.length > 90 ? '...' : ''}"?`,
        options: [
          sentTrans.translation || 'It introduces the central scene and narrative focus of the passage.',
          'It describes an unrelated modern technological invention.',
          'It lists geographical coordinates for a naval voyage.',
          'It concludes the final chapter without any characters.',
        ],
        correctIndex: 0,
        explanation: `In ${baseLang}, this passage translates to: "${sentTrans.translation || firstSentence}".`,
      },
      {
        id: 'q2',
        category: 'Vocabulary',
        question: `What does the word "${targetWord}" mean in the context of this ${targetLang} passage?`,
        options: [
          wordTrans.translation || targetWord,
          'An ancient musical instrument',
          'A mathematical theorem',
          'A sudden weather phenomenon',
        ],
        correctIndex: 0,
        explanation: `"${targetWord}" translates to "${wordTrans.translation || targetWord}" in ${baseLang}.`,
      },
      {
        id: 'q3',
        category: 'Nuance',
        question: `How does this excerpt advance the narrative style of the work?`,
        options: [
          'Through authentic literary phrasing and contextual character observation',
          'By using exclusively bulleted technical instructions',
          'By omitting all verbs and descriptive adjectives',
          'Through purely numerical data tables',
        ],
        correctIndex: 0,
        explanation: 'Authentic literary texts build comprehension through cohesive narrative flow and expressive vocabulary.',
      },
    ],
  };
}

// 2. Dynamic CEFR Level Adaptation
app.post('/api/gemini/adapt-cefr', async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, targetLang = 'Spanish', level = 'B1', customApiKey } = req.body;

    if (!text) {
      res.status(400).json({ error: 'Text content is required.' });
      return;
    }

    if (level === 'Original') {
      res.json({ success: true, adaptedText: text, level: 'Original' });
      return;
    }

    const cleanText = String(text).trim();
    const adaptCacheKey = `cefr__${targetLang}__${level}__${cleanText.slice(0, 240)}__${cleanText.length}`;
    const cachedAdapted = getServerCache(serverAdaptationCache, adaptCacheKey);
    if (cachedAdapted && typeof cachedAdapted === 'string') {
      res.json({ success: true, adaptedText: cachedAdapted, level, cached: true });
      return;
    }

    const ai = getGeminiClient(customApiKey);
    if (!ai) {
      const fallbackText = buildFallbackCefrAdaptation(cleanText, level);
      setServerCache(serverAdaptationCache, adaptCacheKey, fallbackText, MAX_ADAPTATION_CACHE);
      res.json({
        success: true,
        adaptedText: fallbackText,
        level,
      });
      return;
    }

    const prompt = `Rewrite the following text into CEFR level ${level} in ${targetLang}.
Preserve the entire narrative arc, characters, tone, and paragraph structure.

CEFR Level Guidelines for ${level}:
- A1: Very simple short sentences, present/basic past tense, highest frequency ~500 vocabulary words, no complex idioms.
- A2: Simple connected clauses, routine past and future tenses, basic conjunctions, everyday vocabulary.
- B1: Clear standard speech, main points on familiar topics, moderate subordinate clauses.
- B2: Complex ideas, concrete and abstract topics, varied vocabulary and grammatical structures.
- C1: Sophisticated phrasing, flexible style, nuanced literary cohesion.

Source Text:
${cleanText}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        systemInstruction: `You are an expert literary translator and language pedagogue specializing in CEFR graded readers.
Keep the text in the same target language (${targetLang}). Do NOT translate into English.
Return pure adapted text in clean paragraphs.`,
      },
    });

    const adapted = (response.text || buildFallbackCefrAdaptation(cleanText, level)).trim();
    setServerCache(serverAdaptationCache, adaptCacheKey, adapted, MAX_ADAPTATION_CACHE);
    res.json({ success: true, adaptedText: adapted, level });
  } catch (error: any) {
    const { text = '', targetLang = 'Spanish', level = 'B1' } = req.body || {};
    const cleanText = String(text).trim();
    const fallbackText = buildFallbackCefrAdaptation(cleanText, String(level));
    if (cleanText) {
      const adaptCacheKey = `cefr__${targetLang}__${level}__${cleanText.slice(0, 240)}__${cleanText.length}`;
      setServerCache(serverAdaptationCache, adaptCacheKey, fallbackText, MAX_ADAPTATION_CACHE);
    }
    res.json({
      success: true,
      adaptedText: fallbackText,
      level,
    });
  }
});

// 3. Interactive Section Comprehension & Vocabulary Quiz
app.post('/api/gemini/quiz', async (req: Request, res: Response): Promise<void> => {
  try {
    const { textChunk, targetLang = 'Spanish', baseLang = 'English', customApiKey } = req.body;

    if (!textChunk) {
      res.status(400).json({ error: 'textChunk is required.' });
      return;
    }

    const cleanChunk = String(textChunk).trim();
    const quizCacheKey = `quiz__${targetLang}__${baseLang}__${cleanChunk.slice(0, 240)}__${cleanChunk.length}`;
    const cachedQuiz = getServerCache(serverAdaptationCache, quizCacheKey);
    if (cachedQuiz) {
      res.json({ success: true, quiz: cachedQuiz, cached: true });
      return;
    }

    const ai = getGeminiClient(customApiKey);
    if (!ai) {
      const quiz = await buildFallbackQuiz(cleanChunk, String(targetLang), String(baseLang));
      setServerCache(serverAdaptationCache, quizCacheKey, quiz, MAX_ADAPTATION_CACHE);
      res.json({ success: true, quiz });
      return;
    }

    const prompt = `Generate a 3-question reading comprehension and vocabulary quiz based on this text excerpt:
"${cleanChunk.slice(0, 2000)}"

Target language of text: ${targetLang}
User's preferred base language: ${baseLang}

Write the questions, answer options, and explanations in ${baseLang}.
The questions must test:
1. Narrative Comprehension (What happened or what concept was discussed?)
2. Contextual Vocabulary (Meaning of a key word or phrase used in the excerpt)
3. Nuance or Character Motive / Main Idea

Each question must have exactly 4 choices and a 0-indexed correct option.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        systemInstruction: `You are a supportive, insightful language teacher creating interactive comprehension checks.
All questions, choices, and explanations must be written in the user's base language (${baseLang}), referencing the target language text.
Return strictly valid JSON adhering to the schema.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Title of the comprehension check' },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  category: { type: Type.STRING, description: 'Comprehension | Vocabulary | Nuance' },
                  question: { type: Type.STRING, description: 'The question in user base language' },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '4 multiple-choice options'
                  },
                  correctIndex: { type: Type.INTEGER, description: '0 to 3' },
                  explanation: { type: Type.STRING, description: 'Why this answer is correct' },
                },
                required: ['id', 'category', 'question', 'options', 'correctIndex', 'explanation'],
              },
            },
          },
          required: ['title', 'questions'],
        },
      },
    });

    const jsonText = response.text || '{}';
    const parsed = JSON.parse(jsonText);
    setServerCache(serverAdaptationCache, quizCacheKey, parsed, MAX_ADAPTATION_CACHE);
    res.json({ success: true, quiz: parsed });
  } catch (error: any) {
    const { textChunk = '', targetLang = 'Spanish', baseLang = 'English' } = req.body || {};
    const cleanChunk = String(textChunk).trim();
    const quiz = await buildFallbackQuiz(cleanChunk, String(targetLang), String(baseLang));
    if (cleanChunk) {
      const quizCacheKey = `quiz__${targetLang}__${baseLang}__${cleanChunk.slice(0, 240)}__${cleanChunk.length}`;
      setServerCache(serverAdaptationCache, quizCacheKey, quiz, MAX_ADAPTATION_CACHE);
    }
    res.json({ success: true, quiz });
  }
});

// 4. Server-Side Project Gutenberg Full-Text Proxy (Eliminates CORS errors)
app.get('/api/gutenberg/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawId = String(req.params.id || '').replace(/[^0-9]/g, '');
    if (!rawId) {
      res.status(400).json({ error: 'Valid numeric Gutenberg ID is required.' });
      return;
    }

    const candidateUrls = [
      `https://www.gutenberg.org/cache/epub/${rawId}/pg${rawId}.txt`,
      `https://www.gutenberg.org/files/${rawId}/${rawId}-0.txt`,
      `https://www.gutenberg.org/files/${rawId}/${rawId}.txt`,
    ];

    let fullText = '';
    for (const url of candidateUrls) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const resp = await fetch(url, {
          signal: controller.signal,
          headers: { 'User-Agent': 'FolioLingo/0.5 (Language Learning Reader)' },
        });
        clearTimeout(timeout);
        if (resp.ok) {
          const text = await resp.text();
          if (text && text.length > 400) {
            fullText = text;
            break;
          }
        }
      } catch {
        // try next mirror
      }
    }

    if (!fullText) {
      res.status(404).json({ error: 'Manuscript text not found on Gutenberg mirrors.' });
      return;
    }

    // Strip Project Gutenberg header and footer boilerplate
    const startIdx = fullText.search(/\*\*\* ?START OF (THE|THIS) PROJECT GUTENBERG EBOOK/i);
    let cleaned = startIdx !== -1 ? fullText.substring(startIdx) : fullText;
    const endIdx = cleaned.search(/\*\*\* ?END OF (THE|THIS) PROJECT GUTENBERG EBOOK/i);
    if (endIdx !== -1) {
      cleaned = cleaned.substring(0, endIdx);
    }
    cleaned = cleaned.replace(/^\*\*\*.*?\*\*\*/m, '').trim();

    // Limit to first ~35,000 characters (~6,000 words / ~10 sections) for fast interactive reading
    const excerpt = cleaned.slice(0, 35000);
    res.json({ success: true, text: excerpt });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch Gutenberg text.' });
  }
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  const hasEnvKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({ status: 'ok', hasServerKey: hasEnvKey });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FolioLingo full-stack server running on http://0.0.0.0:${PORT} (mode: ${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
