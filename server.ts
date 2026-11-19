import express, { type NextFunction, type Request, type Response } from 'express';
import path from 'path';
import dns from 'dns/promises';
import net from 'net';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import { INSTANT_LEXICON, analyzeOfflineMorphology } from './src/services/instantLexicon.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const isProd =
  process.env.NODE_ENV === 'production' ||
  process.env.npm_lifecycle_event === 'start';
const PORT = isProd && process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

/**
 * Creates a bounded in-memory fixed-window per-IP rate limiter middleware.
 */
function createFixedWindowRateLimiter(maxRequests: number, windowMs: number) {
  const buckets = new Map<string, RateLimitBucket>();
  const MAX_TRACKED_IPS = 5000;
  let lastSweepAt = Date.now();

  const sweepExpired = (now: number) => {
    for (const [ip, entry] of buckets) {
      if (now >= entry.resetAt) {
        buckets.delete(ip);
      }
    }
    lastSweepAt = now;
  };

  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    if (now - lastSweepAt >= windowMs || buckets.size >= MAX_TRACKED_IPS) {
      sweepExpired(now);
    }

    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const existing = buckets.get(clientIp);

    if (!existing || now >= existing.resetAt) {
      if (!existing && buckets.size >= MAX_TRACKED_IPS) {
        const oldestKey = buckets.keys().next().value;
        if (oldestKey !== undefined) {
          buckets.delete(oldestKey);
        }
      }
      buckets.set(clientIp, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (existing.count >= maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSeconds));
      res.status(429).json({ error: 'Rate limit exceeded. Please try again shortly.' });
      return;
    }

    existing.count += 1;
    next();
  };
}

app.use('/api/gemini', createFixedWindowRateLimiter(60, 60_000));
app.use('/api/gutenberg', createFixedWindowRateLimiter(20, 60_000));
app.use('/api/news', createFixedWindowRateLimiter(30, 60_000));
app.use(express.json({ limit: '100kb' }));

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

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let idx = 0;
  const workers = Array.from({ length: Math.min(limit, Math.max(1, items.length)) }, async () => {
    while (idx < items.length) {
      const current = idx++;
      results[current] = await fn(items[current], current);
    }
  });
  await Promise.all(workers);
  return results;
}

// Verified reference translations for curated classic passages (guarantees 100% accurate literary translations offline/under API rate limits)
const CURATED_SENTENCE_TRANSLATIONS: Record<string, string> = {
  "es__en__En un lugar de la Mancha, de cuyo nombre no quiero acordarme, no ha mucho tiempo que vivía un hidalgo de los de lanza en astillero, adarga antigua, rocín flaco y galgo corredor. Una olla de algo más vaca que carnero, salpicón las más noches, duelos y quebrantos los sábados, lantejas los viernes, algún palomino de añadidura los domingos, consumían las tres partes de su hacienda.":
    "In a village of La Mancha, the name of which I have no desire to recall, there lived not long ago one of those gentlemen who keep a lance in the lance-rack, an old leather buckler, a lean hack, and a swift greyhound. A stew of rather more beef than mutton, cold hash most nights, scrambled eggs with bacon on Saturdays, lentils on Fridays, and an extra pigeon on Sundays consumed three-quarters of his income.",
  "es__en__El resto della concluían sayo de velarte, calzas de velludo para las fiestas, con sus pantuflos de lo mesmo, y los días de entresemana se honraba con su vellorí de lo más fino. Tenía en su casa una ama que pasaba de los cuarenta, y una sobrina que no llegaba a los veinte, y un mozo de campo y plaza, que así ensillaba el rocín como tomaba la podadera.":
    "The rest of his estate went toward a tunic of fine broadcloth, velvet breeches for feast days with slippers of the same fabric, while on weekdays he dressed himself in homespun cloth of the finest weave. He kept in his household a housekeeper past forty, a niece not yet twenty, and a lad for field and market who could both saddle the hack and wield the pruning-hook.",
  "es__en__El resto della concluían sayo de velarte, calzas de velludo para las fiestas, con sus pantuflos de lo mesmo, y los días de entresemana se honraba con su vellorí de lo más fino.":
    "The rest of his estate went toward a tunic of fine broadcloth, velvet breeches for feast days with slippers of the same fabric, while on weekdays he dressed himself in homespun cloth of the finest weave.",
  "es__en__Tenía en su casa una ama que pasaba de los cuarenta, y una sobrina que no llegaba a los veinte, y un mozo de campo y plaza, que así ensillaba el rocín como tomaba la podadera.":
    "He kept in his household a housekeeper past forty, a niece not yet twenty, and a lad for field and market who could both saddle the hack and wield the pruning-hook.",
  "es__en__Frisaba la edad de nuestro hidalgo con los cincuenta años; era de complexión recia, seco de carnes, enjuto de rostro, gran madrugador y amigo de la caza. Quieren decir que tenía el sobrenombre de Quijada, o Quesada, que en esto hay alguna diferencia en los autores que deste caso escriben; aunque por conjeturas verisímiles se deja entender que se llamaba Quijana. Pero esto importa poco a nuestro cuento; basta que en la narración dél no se salga un punto de la verdad.":
    "The age of our gentleman bordered upon fifty years; he was of sturdy constitution, spare of flesh, gaunt-featured, a great early riser, and fond of hunting. Authors differ as to whether his surname was Quijada or Quesada, though by plausible conjecture it seems he was called Quijana; yet this matters little to our tale, provided that in the telling we stray not a hair's breadth from the truth.",
  "es__en__Es, pues, de saber que este sobredicho hidalgo, los ratos que estaba ocioso —que eran los más del año—, se daba a leer libros de caballerías, con tanta afición y gusto, que olvidó casi de todo punto el ejercicio de la caza, y aun la administración de su hacienda; y llegó a tanto su curiosidad y desatino en esto, que vendió muchas hanegas de tierra de sembradura para comprar libros de caballerías en que leer.":
    "You must know, then, that whenever this gentleman was at leisure — which was most of the year — he gave himself over to reading books of chivalry with such ardor and delight that he almost completely forgot the sport of hunting and even the management of his estate; and so far did his curiosity and folly go that he sold many acres of farmland to buy books of chivalry to read.",
  "es__en__Desvelábase por entenderlas y desentrañarles el sentido, que no se lo sacara ni las entendiera el mesmo Aristóteles, si resucitara para sólo ello. No estaba muy bien con las heridas que don Belianís daba y recebía, porque se imaginaba que, por grandes maestros que le hubiesen curado, no dejaría de tener el rostro y todo el cuerpo lleno de cicatrices y señales. Con todo esto, alababa en su autor aquel acabar su libro con la promesa de aquella inacabable aventura.":
    "He kept himself awake trying to understand them and unravel their meaning, though Aristotle himself could not have extracted or comprehended it if he had risen from the dead for that sole purpose. He was not altogether pleased with the wounds that Don Belianís dealt and received, for he imagined that however skillful the surgeons who healed him might be, his face and entire body must remain covered in scars and marks. Yet for all that, he praised that author for ending his book with the promise of an endless adventure.",
  "es__en__En efecto, rematado ya su juicio, vino a dar en el más estraño pensamiento que jamás dio loco en el mundo, y fue que le pareció convenible y necesario, así para el aumento de su honra como para el servicio de su república, hacerse caballero andante, y irse por todo el mundo con sus armas y caballo a buscar las aventuras y a ejercitarse en todo aquello que él había leído que los caballeros andantes se ejercitaban, deshaciendo todo género de agravio.":
    "At last, his wits being quite gone, he hit upon the strangest notion ever conceived by a madman in this world: it seemed to him both fitting and necessary, as much for the increase of his own honor as for the service of his country, to become a knight-errant and ride throughout the world with his armor and horse in search of adventures, practicing all that he had read knights-errant practiced and righting every kind of wrong.",
  "es__en__De las cosas, unas están bajo nuestro control y otras no lo están. Bajo nuestro control están el juicio, el impulso, el deseo, la aversión y, en una palabra, cuantas son obras nuestras. Fuera de nuestro control están el cuerpo, las posesiones, las opiniones ajenas, los cargos y, en suma, cuantas cosas no son actos propios.":
    "Some things are within our control and others are not. Within our control are judgment, impulse, desire, aversion, and in a word, whatever are our own actions. Beyond our control are the body, property, reputation, office, and in short, whatever are not our own doings.",
  "it__en__C'era una volta...\n— Un re! — diranno subito i miei piccoli lettori.\n— No, ragazzi, avete sbagliato. C'era una volta un pezzo di legno.":
    "Once upon a time... 'A king!' my little readers will immediately say. 'No, children, you are mistaken. Once upon a time there was a piece of wood.'",
  "fr__en__Lorsque j'avais six ans j'ai vu, une fois, une magnifique image, dans un livre sur la Forêt Vierge qui s'appelait Histoires Vécues. Ça représentait un serpent boa qui avalait un fauve. Voilà la copie du dessin.":
    "When I was six years old I once saw a magnificent picture in a book about the Primeval Forest called True Stories. It showed a boa constrictor swallowing a wild beast. Here is a copy of the drawing.",
  "de__en__Als Gregor Samsa eines Morgens aus unruhigen Träumen erwachte, fand er sich in seinem Bett zu einem ungeheuren Ungeziefer verwandelt. Er lag auf seinem panzerartig harten Rücken und sah, wenn er den Kopf ein wenig hob, seinen gewölbten, braunen, von bogenförmigen Versteifungen geteilten Bauch, auf dessen Höhe sich die Bettdecke, zum gänzlichen Niedergleiten bereit, kaum noch erhalten konnte. Seine vielen, im Vergleich zu seinem sonstigen Umfang kläglich dünnen Beine flimmerten ihm hilflos vor den Augen.":
    "One morning, as Gregor Samsa was waking up from anxious dreams, he discovered that in bed he had been changed into a monstrous vermin. He lay on his armor-hard back and saw, as he lifted his head up a little, his brown, arched abdomen divided up into rigid bow-like sections, on top of which the blanket, ready to slide off completely, could barely hold. His many legs, pitifully thin compared with the size of the rest of him, flickered helplessly before his eyes.",
  "tr__en__Bir gün Nasreddin Hoca gölün kenarına oturmuş, elindeki yoğurt bakracından kaşık kaşık göle çalıyormuş. Köylülerden biri yanına yaklaşıp merakla sormuş:\n— Hayırdır Hoca Efendi, gölün kenarında ne yapıyorsun böyle?\nHoca başını kaldırmadan sakin bir sesle cevap vermiş:\n— Görmüyor musun komşu, göle yoğurt mayalıyorum!":
    "One day Nasreddin Hodja sat by the edge of the lake and began stirring spoonfuls from a copper pail of yogurt into the water. One of the villagers approached him and asked curiously: 'What brings you here, Master Hodja, what are you doing by the lakeshore?' Without lifting his head, the Hodja answered calmly: 'Don't you see, neighbor? I am culturing yogurt in the lake!'",
};

// Fast Backup Dictionary & Sentence Translation Engine (<300ms)
async function translateTextBackup(text: string, sourceIso: string, targetIso: string): Promise<{
  translation: string;
  dictPos?: string;
  dictLemma?: string;
  alternatives?: string[];
}> {
  if (!text.trim()) return { translation: '' };
  if (sourceIso === targetIso) return { translation: text };

  const cleanInput = text.trim();
  const isSingleWord = !/\s/.test(cleanInput);
  const sKey = `${sourceIso}__${targetIso}__${cleanInput}`;

  if (CURATED_SENTENCE_TRANSLATIONS[sKey]) {
    setServerCache(serverSentenceCache, sKey, CURATED_SENTENCE_TRANSLATIONS[sKey]);
    return { translation: CURATED_SENTENCE_TRANSLATIONS[sKey] };
  }

  const existingCached = getServerCache(serverSentenceCache, sKey);
  if (existingCached && !isSingleWord) {
    return { translation: existingCached };
  }

  const gtxClients = ['gtx', 'dict-chrome-ex'];
  for (const client of gtxClients) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);
      const url = `https://translate.googleapis.com/translate_a/single?client=${client}&sl=${encodeURIComponent(
        sourceIso
      )}&tl=${encodeURIComponent(targetIso)}&dt=t&dt=bd&dt=rm&q=${encodeURIComponent(cleanInput)}`;

      const resp = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      clearTimeout(timeout);

      const contentType = resp.headers.get('content-type') || '';
      if (resp.ok && !contentType.includes('text/html')) {
        const data = await resp.json();
        const translatedSegments: string[] = [];
        if (Array.isArray(data?.[0])) {
          for (const seg of data[0]) {
            if (seg?.[0]) translatedSegments.push(seg[0]);
          }
        }
        const primaryTranslation = translatedSegments.join('').trim();

        let dictPos: string | undefined;
        let dictLemma: string | undefined;
        const alternatives: string[] = [];

        if (isSingleWord && Array.isArray(data?.[1]) && data[1].length > 0) {
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
            translation:
              isSingleWord && alternatives.length > 1
                ? `${primaryTranslation} (${alternatives.slice(0, 2).join(', ')})`
                : primaryTranslation,
            dictPos,
            dictLemma,
            alternatives,
          };
        }
      }
    } catch {
      // try next client
    }
  }

  // Fallback to sentence-by-sentence GTX translation if a multi-sentence paragraph timed out
  if (cleanInput.length > 160 && /[.!?]\s+/.test(cleanInput)) {
    const subSentences = (cleanInput.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) || [])
      .map((s) => s.trim())
      .filter(Boolean);
    if (subSentences.length > 1) {
      const subParts = await mapWithConcurrency(subSentences, 2, (s) =>
        translateTextBackup(s, sourceIso, targetIso)
      );
      const joined = subParts.map((r) => r.translation).filter(Boolean).join(' ');
      if (joined && joined !== cleanInput) {
        setServerCache(serverSentenceCache, sKey, joined);
        return { translation: joined };
      }
    }
  }

  // Fallback to Lingva public MT bridge (pure neural MT, zero crowd-TM hallucinations)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const lingvaUrl = `https://lingva.ml/api/v1/${encodeURIComponent(sourceIso)}/${encodeURIComponent(
      targetIso
    )}/${encodeURIComponent(cleanInput.slice(0, 500))}`;
    const lResp = await fetch(lingvaUrl, { signal: controller.signal });
    clearTimeout(timeout);
    if (lResp.ok) {
      const lData = await lResp.json();
      if (typeof lData?.translation === 'string' && lData.translation.trim()) {
        const cleaned = lData.translation.trim();
        setServerCache(serverSentenceCache, sKey, cleaned);
        return { translation: cleaned };
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
        systemInstruction: `You are FolioPress's ultra-low-latency linguist. Translate accurately into ${baseLang}. Return compact valid JSON.`,
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
    ).slice(0, 45);

    const uniqueWords: { word: string; sentence: string }[] = (Array.isArray(words) ? words : [])
      .filter((w: any) => w && w.word)
      .slice(0, 28);

    // 1. Translate all sentences with bounded concurrency (4) so external translator never throttles
    const sentenceTranslations: Record<string, string> = {};
    await mapWithConcurrency(uniqueSentences, 4, async (sent) => {
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
    });

    // 2. Pre-build dictionary breakdowns for the section's top vocabulary in bounded batches
    const wordBreakdowns: Record<string, any> = {};
    await mapWithConcurrency(uniqueWords, 5, async ({ word, sentence }) => {
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
    });

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
  if (level === 'Original') {
    return text;
  }

  const paragraphs = text.split(/\n\s*\n/);

  const adapted = paragraphs.map((para) => {
    const cleanPara = para.trim();
    if (!cleanPara) return '';

    if (level === 'C1') {
      // Advanced editorial polish: normalize double-spaces and dashes
      return cleanPara.replace(/\s+—\s+/g, ' — ').replace(/\s{2,}/g, ' ');
    }

    if (level === 'B2') {
      // Upper-intermediate: gently separate dense semicolon clauses into distinct statements
      return cleanPara
        .replace(/;\s+/g, '. ')
        .replace(/\s+—\s+/g, ', ')
        .replace(/([.!?])\s+([a-záéíóúüñàèìòùçğışö])/g, (_m, p1, ch) => `${p1} ${ch.toUpperCase()}`);
    }

    if (level === 'B1') {
      // Intermediate: break semicolons, colons, and parenthetical dashes into digestible sentences
      return cleanPara
        .replace(/;\s+/g, '. ')
        .replace(/:\s+(?![«"—])/g, '. ')
        .replace(/\s+—\s+/g, '. ')
        .replace(/([.!?])\s+([a-záéíóúüñàèìòùçğışö])/g, (_m, p1, ch) => `${p1} ${ch.toUpperCase()}`);
    }

    if (level === 'A2') {
      // Elementary: split at semicolons, colons, dashes, and common subordinating conjunctions
      const step1 = cleanPara
        .replace(/;\s+/g, '. ')
        .replace(/:\s+/g, '. ')
        .replace(/\s+—\s+/g, '. ')
        .replace(/,\s+(pero|mas|mais|aber|doch|jedoch|ma|però|fakat|ama|aunque|quoique|obwohl|sebene|while|whereas)\s+/gi, '. $1 ');
      return step1.replace(/([.!?])\s+([a-záéíóúüñàèìòùçğışö])/g, (_m, p1, ch) => `${p1} ${ch.toUpperCase()}`);
    }

    // A1 Beginner: crisp, short sentences split at clauses and trimmed of nested parentheticals
    const strippedParens = cleanPara.replace(/\([^)]*\)/g, '').replace(/\s{2,}/g, ' ');
    const splitClauses = strippedParens
      .replace(/;\s+/g, '. ')
      .replace(/:\s+/g, '. ')
      .replace(/\s+—\s+/g, '. ')
      .replace(
        /,\s+(y|e|o|pero|sino|que|cuyo|donde|cuando|porque|et|ou|mais|donc|qui|que|où|und|oder|aber|denn|welche|welcher|che|ma|perché|dove|ve|veya|ama|fakat|çünkü|and|or|but|because|which|while)\s+/gi,
        '. '
      );

    // Capitalize sentence starts cleanly and split very long sentences (>16 words) at commas
    const rawSentences = splitClauses.match(/[^.!?]+[.!?]*/g) || [splitClauses];
    const shortSentences: string[] = [];
    for (const s of rawSentences) {
      const trimmed = s.trim();
      if (!trimmed) continue;
      const words = trimmed.split(/\s+/);
      if (words.length > 16 && trimmed.includes(',')) {
        const commaParts = trimmed.split(/,\s+/).map((p) => p.trim()).filter(Boolean);
        for (let i = 0; i < commaParts.length; i++) {
          let part = commaParts[i];
          if (!/[.!?]$/.test(part)) part += '.';
          shortSentences.push(part.charAt(0).toUpperCase() + part.slice(1));
        }
      } else {
        const finalized = /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
        shortSentences.push(finalized.charAt(0).toUpperCase() + finalized.slice(1));
      }
    }
    return shortSentences.join(' ');
  });

  return adapted.filter(Boolean).join('\n\n');
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
    const { text, targetLang = 'Spanish', level = 'B1', customApiKey, preferFallback = false } = req.body;

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

    const ai = preferFallback ? null : getGeminiClient(customApiKey);
    if (!ai) {
      const fallbackText = buildFallbackCefrAdaptation(cleanText, level);
      setServerCache(serverAdaptationCache, adaptCacheKey, fallbackText, MAX_ADAPTATION_CACHE);
      res.json({
        success: true,
        adaptedText: fallbackText,
        level,
        sourceEngine: 'heuristic-cefr',
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

    const geminiPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        systemInstruction: `You are an expert literary translator and language pedagogue specializing in CEFR graded readers.
Keep the text in the same target language (${targetLang}). Do NOT translate into English.
Return pure adapted text in clean paragraphs.`,
      },
    });

    const response = await Promise.race([
      geminiPromise,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('GEMINI_ADAPT_TIMEOUT')), 5500)),
    ]);

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

    const geminiQuizPromise = ai.models.generateContent({
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

    const response = await Promise.race([
      geminiQuizPromise,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('GEMINI_QUIZ_TIMEOUT')), 5500)),
    ]);

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

// Curated Project Gutenberg Catalog Fallback Metadata (guarantees fast catalog results if Gutendex is throttled)
const GUTENBERG_CATALOG_FALLBACK: Record<string, Array<{ id: number; title: string; author: string; subjects: string[] }>> = {
  es: [
    { id: 2000, title: 'Don Quijote', author: 'Miguel de Cervantes Saavedra', subjects: ['Fiction', 'Chivalry', 'Spanish literature'] },
    { id: 17073, title: 'La Regenta', author: 'Leopoldo Alas (Clarín)', subjects: ['Fiction', 'Psychological fiction', 'Spanish literature'] },
    { id: 49836, title: 'Niebla', author: 'Miguel de Unamuno', subjects: ['Philosophy', 'Fiction', 'Existentialism'] },
    { id: 61202, title: 'Novelas Ejemplares', author: 'Miguel de Cervantes Saavedra', subjects: ['Short stories', 'Spanish literature'] },
    { id: 54436, title: 'Teatro selecto: La vida es sueño', author: 'Pedro Calderón de la Barca', subjects: ['Philosophy', 'Drama'] },
  ],
  fr: [
    { id: 17489, title: 'Les Misérables — Tome I', author: 'Victor Hugo', subjects: ['Fiction', 'Historical fiction', 'French literature'] },
    { id: 4791, title: 'Voyage au centre de la Terre', author: 'Jules Verne', subjects: ['Science', 'Adventure', 'French literature'] },
    { id: 4650, title: 'Candide', author: 'Voltaire', subjects: ['Philosophy', 'Satire', 'French literature'] },
    { id: 13951, title: 'Les Trois Mousquetaires', author: 'Alexandre Dumas', subjects: ['History', 'Adventure', 'French literature'] },
    { id: 13846, title: 'Discours de la méthode', author: 'René Descartes', subjects: ['Philosophy', 'Science', 'Rationalism'] },
  ],
  de: [
    { id: 22367, title: 'Die Verwandlung', author: 'Franz Kafka', subjects: ['Fiction', 'Modernism', 'German literature'] },
    { id: 7205, title: 'Also sprach Zarathustra', author: 'Friedrich Nietzsche', subjects: ['Philosophy', 'German literature'] },
    { id: 2229, title: 'Faust: Der Tragödie erster Teil', author: 'Johann Wolfgang von Goethe', subjects: ['Philosophy', 'Drama', 'German literature'] },
    { id: 2407, title: 'Die Leiden des jungen Werthers', author: 'Johann Wolfgang von Goethe', subjects: ['Fiction', 'Romance', 'German literature'] },
    { id: 5323, title: 'Effi Briest', author: 'Theodor Fontane', subjects: ['Fiction', 'Realism', 'German literature'] },
  ],
  it: [
    { id: 52484, title: 'Le avventure di Pinocchio', author: 'Carlo Collodi', subjects: ['Fiction', 'Stories', 'Italian literature'] },
    { id: 45334, title: 'I Promessi Sposi', author: 'Alessandro Manzoni', subjects: ['History', 'Fiction', 'Italian literature'] },
    { id: 1012, title: 'La Divina Commedia', author: 'Dante Alighieri', subjects: ['Philosophy', 'Epic poetry', 'Italian literature'] },
    { id: 56775, title: 'Un cavallo nella luna: Novelle', author: 'Luigi Pirandello', subjects: ['Short stories', 'Fiction', 'Italian literature'] },
  ],
  tr: [],
  en: [
    { id: 1661, title: 'The Adventures of Sherlock Holmes', author: 'Arthur Conan Doyle', subjects: ['Fiction', 'Mystery', 'Short stories'] },
    { id: 205, title: 'Walden, and On The Duty Of Civil Disobedience', author: 'Henry David Thoreau', subjects: ['Philosophy', 'Science', 'Nature'] },
    { id: 1342, title: 'Pride and Prejudice', author: 'Jane Austen', subjects: ['Fiction', 'Romance'] },
    { id: 2701, title: 'Moby-Dick; or, The Whale', author: 'Herman Melville', subjects: ['Fiction', 'Adventure'] },
    { id: 2680, title: 'Meditations', author: 'Marcus Aurelius', subjects: ['Philosophy', 'Stoicism'] },
  ],
};

// 3B. Server-Side Project Gutenberg Catalog Search Proxy & Resilient Multi-Tier Engine
const MAX_GUTENBERG_SEARCH_CACHE = 60;
const GUTENBERG_SEARCH_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const serverGutenbergSearchCache = new Map<string, { results: any[]; source: string; cachedAt: number }>();
const gutenbergSearchInFlight = new Map<string, Promise<{ results: any[]; source: string }>>();
let gutendexCooldownUntil = 0;

async function searchInternetArchiveGutenberg(
  langCode: string,
  query: string = '',
  topic: string = ''
): Promise<Array<{ id: number; title: string; authors: { name: string }[]; subjects: string[]; download_count: number; formats: Record<string, string> }> | null> {
  const IA_LANG_MAP: Record<string, string> = {
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    tr: 'Turkish',
    en: 'English',
  };
  const langName = IA_LANG_MAP[langCode] || 'Spanish';
  try {
    const qParts = ['collection:gutenberg', `(language:${langName} OR language:${langCode})`];
    if (query) {
      const cleanQ = query.replace(/[^\w\s]/g, ' ').trim();
      if (cleanQ) qParts.push(`(${cleanQ})`);
    }
    if (topic) {
      const cleanTopic = topic.replace(/[^\w\s]/g, ' ').trim();
      if (cleanTopic) qParts.push(`(subject:${cleanTopic})`);
    }

    const iaUrl = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(
      qParts.join(' AND ')
    )}&fl[]=identifier,title,creator,subject,description&sort[]=downloads+desc&rows=15&output=json`;

    const resp = await fetch(iaUrl, {
      signal: AbortSignal.timeout(4500),
      headers: { 'User-Agent': 'FolioPress/0.6 (Language Learning Reader)' },
    });
    if (!resp.ok) return null;

    const data: any = await resp.json();
    const docs = data?.response?.docs;
    if (!Array.isArray(docs) || docs.length === 0) return null;

    const results: Array<{ id: number; title: string; authors: { name: string }[]; subjects: string[]; download_count: number; formats: Record<string, string> }> = [];

    for (const doc of docs) {
      if (!doc?.title || !doc?.identifier) continue;
      if (/\b(audio\s*book|librivox|audio\s*reading)\b/i.test(`${doc.title} ${doc.description || ''}`)) {
        continue;
      }
      let numericId: number | null = null;
      const gutMatch = String(doc.identifier).match(/(?:^|\D)(\d{1,6})(?:gut|$|\D)/i);
      if (gutMatch) {
        const parsed = parseInt(gutMatch[1], 10);
        if (parsed > 0 && parsed < 1000000) {
          numericId = parsed;
        }
      }
      if (!numericId && doc.description) {
        const descMatch = String(doc.description).match(/gutenberg\.org\/(?:ebooks\/|etext\d*\/)(\d{1,6})/i);
        if (descMatch) {
          numericId = parseInt(descMatch[1], 10);
        }
      }

      if (numericId) {
        const subjects = Array.isArray(doc.subject)
          ? doc.subject.map(String)
          : doc.subject ? [String(doc.subject)] : [langName, 'Literature'];
        results.push({
          id: numericId,
          title: String(doc.title),
          authors: [{ name: String(doc.creator || 'Classic Author') }],
          subjects,
          download_count: 2000,
          formats: {},
        });
      }
    }

    return results.length > 0 ? results : null;
  } catch (err) {
    console.warn('[Gutenberg] Internet Archive search tier bypassed:', err);
    return null;
  }
}

app.get('/api/gutenberg/search', async (req: Request, res: Response): Promise<void> => {
  const lang = String(req.query.languages || 'es').slice(0, 5).toLowerCase();
  const query = String(req.query.search || '').trim();
  const topic = String(req.query.topic || '').trim();
  const cacheKey = `${lang}__${query.toLowerCase()}__${topic.toLowerCase()}`;

  // 1. Check server search cache
  const cached = getServerCache(serverGutenbergSearchCache, cacheKey);
  if (cached && Date.now() - cached.cachedAt < GUTENBERG_SEARCH_TTL_MS) {
    res.json({ success: true, results: cached.results, source: cached.source, cached: true });
    return;
  }

  // 2. Promise coalescing for in-flight queries
  let searchPromise = gutenbergSearchInFlight.get(cacheKey);
  if (!searchPromise) {
    searchPromise = (async () => {
      // Tier A: Gutendex (if not in cooldown)
      if (Date.now() >= gutendexCooldownUntil) {
        try {
          const url = `https://gutendex.com/books?languages=${encodeURIComponent(lang)}${
            topic ? `&topic=${encodeURIComponent(topic)}` : ''
          }${query ? `&search=${encodeURIComponent(query)}` : ''}`;

          const resp = await fetch(url, {
            signal: AbortSignal.timeout(3000), // reduced from 5500ms to 3000ms
            headers: { 'User-Agent': 'FolioPress/0.6 (Language Learning Reader)' },
          });

          if (resp.ok) {
            const data: any = await resp.json();
            if (Array.isArray(data?.results) && data.results.length > 0) {
              return { results: data.results.slice(0, 12), source: 'gutendex' };
            }
          } else {
            gutendexCooldownUntil = Date.now() + 5 * 60 * 1000;
          }
        } catch (err) {
          gutendexCooldownUntil = Date.now() + 5 * 60 * 1000;
          console.warn('[Gutenberg] Gutendex timeout/error, entering 5-min cooldown:', err);
        }
      }

      // Tier B: Internet Archive Gutenberg Collection (4500ms timeout)
      const iaResults = await searchInternetArchiveGutenberg(lang, query, topic);
      if (iaResults && iaResults.length > 0) {
        return { results: iaResults.slice(0, 12), source: 'internet-archive' };
      }

      // Tier C: Static Gutenberg Catalog Fallback
      const list = GUTENBERG_CATALOG_FALLBACK[lang] || GUTENBERG_CATALOG_FALLBACK.en || [];
      const filtered = list.filter((item) => {
        const qOk =
          !query ||
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.author.toLowerCase().includes(query.toLowerCase());
        const tOk = !topic || item.subjects.some((s) => s.toLowerCase().includes(topic.toLowerCase()));
        return qOk && (tOk || list.length <= 2);
      });

      const finalItems = (filtered.length > 0 ? filtered : list).map((item) => ({
        id: item.id,
        title: item.title,
        authors: [{ name: item.author }],
        subjects: item.subjects,
        download_count: 1500,
        formats: {},
      }));

      return { results: finalItems, source: 'fallback-catalog' };
    })();

    gutenbergSearchInFlight.set(cacheKey, searchPromise);
  }

  try {
    const outcome = await searchPromise;
    setServerCache(
      serverGutenbergSearchCache,
      cacheKey,
      { results: outcome.results, source: outcome.source, cachedAt: Date.now() },
      MAX_GUTENBERG_SEARCH_CACHE
    );
    res.json({ success: true, results: outcome.results, source: outcome.source, cached: false });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to search Gutenberg catalog.' });
  } finally {
    gutenbergSearchInFlight.delete(cacheKey);
  }
});

// 4. Multi-Mirror Geo-Resilient Public-Domain Full-Text Proxy ($0.00 Stack)
// Cascade: GITenberg (GitHub CDN) -> Internet Archive -> Direct Gutenberg Mirrors
const serverGutenbergTextCache = new Map<string, { text: string; mirror: string }>();
const gutenbergTextInFlight = new Map<string, Promise<{ text: string; mirror: string }>>();
let gitenbergCooldownUntil = 0;

function decodeGutenbergBuffer(buf: ArrayBuffer, filenameHint: string = ''): string {
  const bytes = new Uint8Array(buf);
  const prefersLatin1 = /-8\.txt$/i.test(filenameHint);
  if (!prefersLatin1) {
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {
      // Fallback to Windows-1252 / ISO-8859-1 below
    }
  }
  try {
    return new TextDecoder('windows-1252').decode(bytes);
  } catch {
    return new TextDecoder('utf-8').decode(bytes);
  }
}

function cleanAndUnwrapGutenbergText(rawText: string): string {
  let normalized = rawText.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');

  const startIdx = normalized.search(/\*\*\* ?START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK/i);
  if (startIdx !== -1) {
    normalized = normalized.substring(startIdx).replace(/^\*\*\*[^\n]*\*\*\*[^\n]*\n?/, '');
  } else {
    const legacyStart = normalized.search(/\*END\*THE SMALL PRINT![^\n]*\n/i);
    if (legacyStart !== -1) {
      normalized = normalized.substring(legacyStart).replace(/^\*END\*[^\n]*\n?/i, '');
    }
  }

  const endIdx = normalized.search(/\*\*\* ?END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK/i);
  if (endIdx !== -1) {
    normalized = normalized.substring(0, endIdx);
  } else {
    const legacyEnd = normalized.search(/End of(?: the)? Project Gutenberg EBook/i);
    if (legacyEnd !== -1) {
      normalized = normalized.substring(0, legacyEnd);
    }
  }

  const headingRegex =
    /^(Cap[íi]tulo|Chapitre|Kapitel|Capitolo|B[öo]l[üu]m|Chapter|Part|Parte|Libro|Livre|Book)\b/i;

  const paragraphs = normalized
    .trim()
    .split(/\n\s*\n+/)
    .map((block) => {
      const lines = block
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      if (lines.length === 0) return '';
      if (lines.length === 1) return lines[0];
      if (lines.length <= 3 && headingRegex.test(lines[0]) && lines[0].length < 80) {
        return lines.join(' — ');
      }
      return lines.join(' ').replace(/\s{2,}/g, ' ').trim();
    })
    .filter(Boolean);

  return paragraphs.join('\n\n');
}

async function fetchFromGitenberg(rawId: string): Promise<{ text: string; mirror: string } | null> {
  if (Date.now() < gitenbergCooldownUntil) {
    return null;
  }
  try {
    const searchUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(
      `org:GITenberg _${rawId} in:name`
    )}&per_page=10`;
    const searchResp = await fetch(searchUrl, {
      signal: AbortSignal.timeout(7000),
      headers: {
        'User-Agent': 'FolioPress/0.6 (Language Learning Reader)',
        Accept: 'application/vnd.github+json',
      },
    });
    if (searchResp.status === 403 || searchResp.status === 429) {
      gitenbergCooldownUntil = Date.now() + 90 * 1000;
      console.warn(`[Gutenberg] GitHub API rate-limited (${searchResp.status}). Cooldown for 90s.`);
      return null;
    }
    if (!searchResp.ok) return null;

    const searchData: any = await searchResp.json();
    const repo = (searchData?.items || []).find(
      (item: any) => typeof item?.name === 'string' && item.name.endsWith(`_${rawId}`)
    );
    if (!repo?.full_name) return null;

    const contentsResp = await fetch(
      `https://api.github.com/repos/${repo.full_name}/contents`,
      {
        signal: AbortSignal.timeout(7000),
        headers: {
          'User-Agent': 'FolioPress/0.6 (Language Learning Reader)',
          Accept: 'application/vnd.github+json',
        },
      }
    );
    if (!contentsResp.ok) return null;

    const files: any[] = await contentsResp.json();
    if (!Array.isArray(files)) return null;

    const ignoredName = /(readme|license|contributing|metadata|notes|changes)/i;
    const txtFiles = files.filter(
      (f) =>
        f?.type === 'file' &&
        typeof f?.name === 'string' &&
        /\.txt$/i.test(f.name) &&
        !ignoredName.test(f.name) &&
        (f.size || 0) > 2000 &&
        typeof f?.download_url === 'string'
    );
    if (txtFiles.length === 0) return null;

    const preferred =
      txtFiles.find((f) => /-0\.txt$/i.test(f.name)) ||
      txtFiles.find((f) => /-8\.txt$/i.test(f.name)) ||
      txtFiles.sort((a, b) => (b.size || 0) - (a.size || 0))[0];

    const rawResp = await fetch(preferred.download_url, {
      signal: AbortSignal.timeout(15000),
      headers: { 'User-Agent': 'FolioPress/0.6 (Language Learning Reader)' },
    });
    if (!rawResp.ok) return null;

    const decoded = decodeGutenbergBuffer(await rawResp.arrayBuffer(), preferred.name);
    if (decoded.length > 400) {
      return { text: decoded, mirror: `GITenberg (${repo.full_name}/${preferred.name})` };
    }
  } catch {
    // Fall through to next mirror
  }
  return null;
}

async function fetchFromInternetArchive(rawId: string): Promise<{ text: string; mirror: string } | null> {
  try {
    const padded = rawId.padStart(5, '0');
    const searchUrl = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(
      `collection:gutenberg AND identifier:*${padded}gut`
    )}&fl[]=identifier,title&output=json&rows=5`;
    const searchResp = await fetch(searchUrl, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'FolioPress/0.6 (Language Learning Reader)' },
    });
    if (!searchResp.ok) return null;

    const searchData: any = await searchResp.json();
    const docs: any[] = searchData?.response?.docs || [];
    for (const doc of docs) {
      if (!doc?.identifier) continue;
      try {
        const metaResp = await fetch(
          `https://archive.org/metadata/${encodeURIComponent(doc.identifier)}/files`,
          {
            signal: AbortSignal.timeout(8000),
            headers: { 'User-Agent': 'FolioPress/0.6 (Language Learning Reader)' },
          }
        );
        if (!metaResp.ok) continue;

        const metaData: any = await metaResp.json();
        const files: any[] = metaData?.result || [];
        const txtCandidates = files.filter(
          (f) =>
            typeof f?.name === 'string' &&
            /\.txt$/i.test(f.name) &&
            !f.name.includes('_djvu') &&
            !f.name.includes('_meta')
        );
        if (txtCandidates.length === 0) continue;

        const chosen =
          txtCandidates.find((f) => /-0\.txt$/i.test(f.name)) ||
          txtCandidates.find((f) => /-8\.txt$/i.test(f.name)) ||
          txtCandidates[0];

        const dlUrl = `https://archive.org/download/${encodeURIComponent(
          doc.identifier
        )}/${encodeURIComponent(chosen.name)}`;
        const dlResp = await fetch(dlUrl, {
          signal: AbortSignal.timeout(15000),
          headers: { 'User-Agent': 'FolioPress/0.6 (Language Learning Reader)' },
        });
        if (!dlResp.ok) continue;

        const decoded = decodeGutenbergBuffer(await dlResp.arrayBuffer(), chosen.name);
        if (decoded.length > 400) {
          return { text: decoded, mirror: `Internet Archive (${doc.identifier}/${chosen.name})` };
        }
      } catch {
        // Try next Archive item
      }
    }
  } catch {
    // Fall through to direct Gutenberg
  }
  return null;
}

async function fetchFromDirectGutenberg(rawId: string): Promise<{ text: string; mirror: string } | null> {
  const candidateUrls = [
    `https://www.gutenberg.org/cache/epub/${rawId}/pg${rawId}.txt`,
    `https://www.gutenberg.org/files/${rawId}/${rawId}-0.txt`,
    `https://www.gutenberg.org/files/${rawId}/${rawId}-8.txt`,
    `https://www.gutenberg.org/files/${rawId}/${rawId}.txt`,
    `https://www.gutenberg.org/ebooks/${rawId}.txt.utf-8`,
  ];

  for (const url of candidateUrls) {
    try {
      const resp = await fetch(url, {
        signal: AbortSignal.timeout(3500),
        headers: { 'User-Agent': 'FolioPress/0.6 (Language Learning Reader)' },
      });
      if (resp.ok) {
        const decoded = decodeGutenbergBuffer(await resp.arrayBuffer(), url);
        if (decoded.length > 400) {
          return { text: decoded, mirror: `Project Gutenberg (${url})` };
        }
      }
    } catch {
      // Try next URL
    }
  }
  return null;
}

app.get('/api/gutenberg/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawId = String(req.params.id || '').replace(/[^0-9]/g, '');
    if (!rawId) {
      res.status(400).json({ error: 'Valid numeric Gutenberg ID is required.' });
      return;
    }

    const cached = getServerCache(serverGutenbergTextCache, rawId);
    if (cached) {
      res.json({
        success: true,
        text: cached.text,
        mirror: cached.mirror,
        charCount: cached.text.length,
        cached: true,
      });
      return;
    }

    let textPromise = gutenbergTextInFlight.get(rawId);
    if (!textPromise) {
      textPromise = (async () => {
        const result =
          (await fetchFromGitenberg(rawId)) ||
          (await fetchFromInternetArchive(rawId)) ||
          (await fetchFromDirectGutenberg(rawId));
        if (!result) {
          throw new Error(`All remote mirrors unavailable for #${rawId}`);
        }
        return result;
      })();
      gutenbergTextInFlight.set(rawId, textPromise);
    }

    let result: { text: string; mirror: string };
    try {
      result = await textPromise;
    } catch (fetchErr: any) {
      console.warn(`[Gutenberg] All remote mirrors unavailable for #${rawId}`);
      res.status(502).json({
        error:
          'Remote Gutenberg mirrors are currently unreachable from this network. Check connection or read a bundled Full Novel edition.',
      });
      return;
    } finally {
      gutenbergTextInFlight.delete(rawId);
    }

    const cleaned = cleanAndUnwrapGutenbergText(result.text);
    if (
      /^(?:This audio reading of |Audio reading of )/i.test(cleaned) ||
      (cleaned.length < 6000 && /\b\d{2}:\d{2}:\d{2}\b/.test(cleaned))
    ) {
      res.status(422).json({
        error: 'This Gutenberg ID is an audiobook index rather than readable text. Please choose a text edition.',
      });
      return;
    }
    // Support complete multi-chapter novel manuscripts up to ~450,000 chars, cut cleanly on paragraph boundary
    let excerpt = cleaned.slice(0, 450000);
    if (cleaned.length > 450000) {
      const lastBreak = excerpt.lastIndexOf('\n\n');
      if (lastBreak > 200000) {
        excerpt = excerpt.slice(0, lastBreak);
      }
    }

    console.log(`[Gutenberg] Loaded #${rawId} (${excerpt.length} chars) via ${result.mirror}`);
    setServerCache(serverGutenbergTextCache, rawId, { text: excerpt, mirror: result.mirror }, 24);
    res.json({
      success: true,
      text: excerpt,
      mirror: result.mirror,
      charCount: excerpt.length,
      cached: false,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch Gutenberg text.' });
  }
});

// ============================================================================
// 5. "The Daily Folio" Open-Access Multilingual News Engine ($0.00 Stack)
// ============================================================================
const NEWS_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const serverNewsCache = new Map<string, any>();
const serverNewsLastValidByLang = new Map<string, any>();
const newsFetchInFlight = new Map<string, Promise<any>>();

const GLOBAL_VOICES_FEEDS: Record<string, string> = {
  it: 'https://it.globalvoices.org/feed/',
  es: 'https://es.globalvoices.org/feed/',
  fr: 'https://fr.globalvoices.org/feed/',
  de: 'https://de.globalvoices.org/feed/',
  tr: 'https://tr.globalvoices.org/feed/',
  en: 'https://globalvoices.org/feed/',
};

const LOCALIZED_EDITION_TITLES: Record<string, string> = {
  it: 'Edizione Mattutina',
  es: 'Edición Matutina',
  fr: 'Édition du Matin',
  de: 'Morgenausgabe',
  tr: 'Sabah Bülteni',
  en: 'Morning Edition',
};

const NEWS_STOPWORDS = new Set([
  'the', 'and', 'for', 'that', 'this', 'with', 'from', 'are', 'was', 'were', 'have', 'has', 'had', 'not', 'but', 'what', 'which', 'when', 'where', 'will', 'more', 'also', 'into', 'than', 'their', 'about',
  'del', 'las', 'los', 'una', 'uno', 'con', 'por', 'para', 'como', 'pero', 'más', 'este', 'esta', 'esto', 'son', 'fue', 'han', 'hay', 'sin', 'sobre', 'entre', 'todo', 'todos', 'muy', 'desde', 'donde',
  'les', 'des', 'une', 'dans', 'pour', 'par', 'avec', 'sur', 'pas', 'plus', 'mais', 'qui', 'que', 'est', 'sont', 'ont', 'cette', 'tout', 'tous', 'comme', 'nous', 'vous', 'elle', 'entre',
  'der', 'die', 'das', 'und', 'den', 'dem', 'des', 'ein', 'eine', 'einer', 'mit', 'von', 'für', 'auf', 'ist', 'sind', 'war', 'nicht', 'auch', 'als', 'noch', 'nach', 'über', 'sich', 'bei', 'wie', 'aus',
  'che', 'del', 'della', 'delle', 'degli', 'dei', 'nel', 'nella', 'con', 'per', 'una', 'uno', 'non', 'più', 'come', 'sono', 'stato', 'questa', 'questo', 'anche', 'dalla', 'dal', 'tra', 'fra',
  'bir', 've', 'ile', 'için', 'gibi', 'olan', 'olarak', 'daha', 'çok', 'ama', 'fakat', 'ancak', 'bu', 'şu', 'her', 'kadar', 'sonra', 'önce', 'göre', 'üzerine', 'tarafından', 'arasında',
]);

function decodeXmlEntities(input: string): string {
  return input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#(\d+);/g, (_m, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&apos;/gi, "'");
}

function stripHtmlToProse(rawHtml: string): string {
  let cleaned = decodeXmlEntities(rawHtml || '')
    .replace(/<(script|style|iframe|svg|form|nav|aside|noscript|figure|figcaption)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|blockquote|li|tr)>/gi, '\n\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Trim standard open-journalism promotional footers
  cleaned = cleaned
    .replace(/\n*(?:Written by|Scritto da|Escrito por|Écrit par|Geschrieben von|Yazan:|This story originally appeared).*$/is, '')
    .replace(/==+.*?==+/g, '')
    .trim();

  return cleaned;
}

function chunkNewsProse(text: string, wordsPerChunk = 340): string[] {
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let bucket: string[] = [];
  let bucketWords = 0;

  for (const para of paragraphs) {
    const wc = para.split(/\s+/).length;
    if (bucketWords + wc > wordsPerChunk && bucket.length > 0) {
      chunks.push(bucket.join('\n\n'));
      bucket = [para];
      bucketWords = wc;
    } else {
      bucket.push(para);
      bucketWords += wc;
    }
  }
  if (bucket.length > 0) chunks.push(bucket.join('\n\n'));
  return chunks.slice(0, 4);
}

async function extractKeyJournalisticWords(
  prose: string,
  lang: string,
  baseLangName = 'English'
): Promise<Array<{ word: string; lemma: string; partOfSpeech: string; translation: string; cefrHint?: string }>> {
  const tokens = prose
    .split(/\s+/)
    .map((t) => t.replace(/^[«"'(—¡¿“‘]+|[»"')!?,.:;—”’]+$/g, '').trim())
    .filter((t) => t.length >= 5 && /^[\p{L}-]+$/u.test(t));

  const langLexicon = INSTANT_LEXICON[lang] || {};
  const counts = new Map<string, { display: string; tf: number }>();

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    const lower = tok.toLowerCase();
    if (NEWS_STOPWORDS.has(lower)) continue;
    // De-prioritize likely mid-sentence capitalized proper names unless present in lexicon
    const isUpperMidSentence = /^[A-ZÁÉÍÓÚÑÜŞĞÇÖİ]/.test(tok) && i > 0 && !/[.!?]$/.test(tokens[i - 1] || '');
    if (isUpperMidSentence && !langLexicon[lower]) continue;

    const existing = counts.get(lower);
    if (existing) {
      existing.tf += 1;
    } else {
      counts.set(lower, { display: lower, tf: 1 });
    }
  }

  const ranked = Array.from(counts.entries())
    .map(([lower, { tf }]) => {
      const morph = analyzeOfflineMorphology(lower, lang);
      const hasComplexSuffix =
        /(zione|mento|mente|aggio|ezza|ità|ung|heit|keit|schaft|ción|sión|dad|imiento|ment|tion|ité|ance|ence|lük|lik|sız|ciği)$/i.test(
          lower
        );
      const boost = hasComplexSuffix ? 1.5 : 1.0;
      const lexBonus = langLexicon[lower] ? 1.2 : 1.0;
      const score = tf * Math.log(lower.length) * boost * lexBonus;
      return { word: lower, morph, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const sourceIso = resolveIsoCode(lang, 'es');
  const targetIso = resolveIsoCode(baseLangName, 'en');

  const resolved = await mapWithConcurrency(ranked, 3, async (entry) => {
    const local = langLexicon[entry.word] || langLexicon[entry.morph.lemma.toLowerCase()];
    if (local) {
      return {
        word: entry.word,
        lemma: local.lemma,
        partOfSpeech: local.pos,
        translation:
          local.translations[baseLangName] ||
          local.translations.English ||
          Object.values(local.translations)[0] ||
          entry.word,
        cefrHint: entry.word.length >= 9 ? 'B2–C1' : 'B1',
      };
    }

    const resTrans = await translateTextBackup(entry.word, sourceIso, targetIso).catch(() => ({
      translation: entry.word,
      dictPos: undefined,
      dictLemma: undefined,
    }));

    return {
      word: entry.word,
      lemma: resTrans.dictLemma || entry.morph.lemma,
      partOfSpeech: resTrans.dictPos || entry.morph.pos,
      translation: resTrans.translation || entry.word,
      cefrHint: entry.word.length >= 9 ? 'B2–C1' : 'B1',
    };
  });

  return resolved;
}

function extractXmlTag(block: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = block.match(regex);
  return match ? match[1] : '';
}

function parseRssOrAtomFeed(xml: string, fallbackAuthor: string) {
  const isAtom = /<entry[\s>]/i.test(xml) && !/<item[\s>]/i.test(xml);
  const rawBlocks = isAtom
    ? xml.match(/<entry[\s\S]*?<\/entry>/gi) || []
    : xml.match(/<item[\s\S]*?<\/item>/gi) || [];

  return rawBlocks.slice(0, 8).map((block) => {
    const title = decodeXmlEntities(extractXmlTag(block, 'title')).replace(/\s+/g, ' ').trim();
    const rawLink = isAtom
      ? block.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/i)?.[1] || ''
      : decodeXmlEntities(extractXmlTag(block, 'link')).trim();
    const author =
      decodeXmlEntities(
        extractXmlTag(block, 'dc:creator') || extractXmlTag(block, 'author') || fallbackAuthor
      )
        .replace(/<[^>]+>/g, '')
        .trim() || fallbackAuthor;
    const pubDateStr = extractXmlTag(block, 'pubDate') || extractXmlTag(block, 'updated') || extractXmlTag(block, 'published');
    const publishedAt = pubDateStr ? Date.parse(pubDateStr) || Date.now() : Date.now();
    const bodyRaw =
      extractXmlTag(block, 'content:encoded') ||
      extractXmlTag(block, 'content') ||
      extractXmlTag(block, 'description') ||
      extractXmlTag(block, 'summary');
    const prose = stripHtmlToProse(bodyRaw).slice(0, 6500);
    const thumbMatch =
      block.match(/<media:content[^>]*url=["']([^"']+)["']/i)?.[1] ||
      block.match(/<img[^>]*src=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i)?.[1];

    return { title, link: rawLink, author, publishedAt, prose, coverImage: thumbMatch };
  }).filter((item) => item.title && item.prose.length >= 160);
}

async function fetchStreamLimitedText(url: string, timeoutMs = 5000, maxBytes = 500 * 1024): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'FolioPress/0.7 (Educational Reader)' },
    });
    if (!resp.ok) throw new Error(`Upstream HTTP ${resp.status}`);
    if (!resp.body) return await resp.text();

    const reader = resp.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        controller.abort();
        break;
      }
      chunks.push(value);
    }
    const merged = new Uint8Array(total);
    let offset = 0;
    for (const c of chunks) {
      merged.set(c, offset);
      offset += c.byteLength;
    }
    return new TextDecoder().decode(merged);
  } finally {
    clearTimeout(timeout);
  }
}

function isBlockedPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    if (parts[0] === 127) return true; // Loopback 127.0.0.0/8
    if (parts[0] === 10) return true; // RFC1918 10.0.0.0/8
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true; // RFC1918 172.16.0.0/12
    if (parts[0] === 192 && parts[1] === 168) return true; // RFC1918 192.168.0.0/16
    if (parts[0] === 169 && parts[1] === 254) return true; // Link-local & cloud metadata 169.254.0.0/16
    if (parts[0] === 0) return true;
  } else if (net.isIPv6(ip)) {
    const norm = ip.toLowerCase();
    if (norm === '::1' || norm === '::' || norm.startsWith('fc') || norm.startsWith('fd') || norm.startsWith('fe80')) {
      return true;
    }
  }
  return false;
}

async function assertSafeExternalUrl(rawUrl: string): Promise<URL> {
  const parsed = new URL(rawUrl);
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only http:// and https:// RSS feed URLs are allowed.');
  }
  const hostname = parsed.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.local')) {
    throw new Error('Local hostnames are blocked for security.');
  }
  if (net.isIP(hostname) && isBlockedPrivateIp(hostname)) {
    throw new Error('Private/internal network IP addresses are blocked.');
  }
  const addresses = await dns.lookup(hostname, { all: true });
  for (const addr of addresses) {
    if (isBlockedPrivateIp(addr.address)) {
      throw new Error('Target hostname resolves to a restricted private IP range.');
    }
  }
  return parsed;
}

async function buildDailyNewsEdition(lang: string, baseLangName: string) {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;
  const gvUrl = GLOBAL_VOICES_FEEDS[lang] || GLOBAL_VOICES_FEEDS.en;

  const wmFeaturedUrl = `https://api.wikimedia.org/feed/v1/wikipedia/${lang}/featured/${yyyy}/${mm}/${dd}`;
  const [gvResult, wmResult] = await Promise.allSettled([
    fetchStreamLimitedText(gvUrl, 5000, 450 * 1024),
    (async () => {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4500);
      try {
        let r = await fetch(wmFeaturedUrl, {
          signal: ctrl.signal,
          headers: { 'User-Agent': 'FolioPress/0.7 (Educational Reader)' },
        });
        if (!r.ok) {
          const prev = new Date(Date.now() - 86400 * 1000);
          const py = prev.getUTCFullYear();
          const pm = String(prev.getUTCMonth() + 1).padStart(2, '0');
          const pd = String(prev.getUTCDate()).padStart(2, '0');
          r = await fetch(`https://api.wikimedia.org/feed/v1/wikipedia/${lang}/featured/${py}/${pm}/${pd}`, {
            signal: ctrl.signal,
            headers: { 'User-Agent': 'FolioPress/0.7 (Educational Reader)' },
          });
        }
        return r.ok ? await r.json() : null;
      } finally {
        clearTimeout(t);
      }
    })(),
  ]);

  const gvItems =
    gvResult.status === 'fulfilled'
      ? parseRssOrAtomFeed(gvResult.value, 'Global Voices Contributors')
      : [];
  const wmJson = wmResult.status === 'fulfilled' ? wmResult.value : null;

  const culturalStories: any[] = [];
  for (let i = 0; i < Math.min(4, gvItems.length); i++) {
    const item = gvItems[i];
    const chunks = chunkNewsProse(item.prose, 340);
    const words = item.prose.split(/\s+/).filter(Boolean).length;
    const preflightVocab = await extractKeyJournalisticWords(item.prose, lang, baseLangName);
    culturalStories.push({
      id: `news-${lang}-gv-${dateStr}-${i}`,
      title: item.title,
      author: `${item.author} · Global Voices`,
      language: lang,
      genre: 'essays',
      source: 'news',
      newsCategory: i === 0 ? 'lead' : 'world',
      license: 'CC BY 3.0',
      sourceUrl: item.link,
      publishedAt: item.publishedAt,
      coverImage: item.coverImage,
      summary: item.prose.split(/\n/)[0].slice(0, 175) + '...',
      chunks,
      currentChunkIndex: 0,
      wordCount: words,
      estimatedReadTimeMinutes: Math.max(2, Math.round(words / 180)),
      createdAt: Date.now(),
      preflightVocab,
    });
  }

  // Batch fetch full Wikimedia plain-text extracts for top trending cultural topics + 1 historical OnThisDay page
  const rawMostRead: any[] = Array.isArray(wmJson?.mostread?.articles)
    ? wmJson.mostread.articles.filter(
        (a: any) =>
          a?.title &&
          !/:/.test(String(a.title)) &&
          !/Main_Page|Pagina_principale|Portada|Accueil|Hauptseite|Anasayfa/i.test(String(a.title)) &&
          (a?.extract || '').length > 60
      )
    : [];

  const trendingCandidates = rawMostRead.slice(0, 3);
  const onThisDayEvent = Array.isArray(wmJson?.onthisday) ? wmJson.onthisday[0] : null;
  const historyPage = onThisDayEvent?.pages?.[0];

  const wikiTitlesToExpand = [
    ...trendingCandidates.map((a) => String(a.title)),
    ...(historyPage?.title ? [String(historyPage.title)] : []),
  ];

  const expandedExtracts = new Map<string, string>();
  if (wikiTitlesToExpand.length > 0) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4000);
      const batchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&exchars=2400&titles=${encodeURIComponent(
        wikiTitlesToExpand.join('|')
      )}&format=json&origin=*`;
      const exRes = await fetch(batchUrl, { signal: ctrl.signal });
      clearTimeout(t);
      if (exRes.ok) {
        const exJson = await exRes.json();
        const pages = Object.values(exJson?.query?.pages || {}) as any[];
        for (const p of pages) {
          if (p?.title && p?.extract) {
            const cleaned = String(p.extract).replace(/==+.*?==+/g, '').replace(/\n{3,}/g, '\n\n').trim();
            expandedExtracts.set(String(p.title).replace(/_/g, ' '), cleaned);
          }
        }
      }
    } catch {
      // Fallback safely to featured API extracts below
    }
  }

  const trendingStories: any[] = [];
  for (let i = 0; i < trendingCandidates.length; i++) {
    const art = trendingCandidates[i];
    const cleanTitle = String(art.titles?.normalized || art.title).replace(/_/g, ' ');
    const fullProse = expandedExtracts.get(cleanTitle) || String(art.extract || '');
    if (fullProse.length < 80) continue;
    const chunks = chunkNewsProse(fullProse, 320);
    const words = fullProse.split(/\s+/).filter(Boolean).length;
    const preflightVocab = await extractKeyJournalisticWords(fullProse, lang, baseLangName);
    trendingStories.push({
      id: `news-${lang}-wm-${dateStr}-${i}`,
      title: cleanTitle,
      author: 'Trending Today · Wikipedia',
      language: lang,
      genre: 'history',
      source: 'news',
      newsCategory: 'trending',
      license: 'CC BY-SA 4.0',
      sourceUrl: art.content_urls?.desktop?.page,
      publishedAt: Date.now(),
      coverImage: art.thumbnail?.source,
      summary: (art.description ? `${art.description} — ` : '') + fullProse.slice(0, 140) + '...',
      chunks,
      currentChunkIndex: 0,
      wordCount: words,
      estimatedReadTimeMinutes: Math.max(1, Math.round(words / 180)),
      createdAt: Date.now(),
      preflightVocab,
    });
  }

  let onThisDayStory: any = null;
  if (onThisDayEvent && (onThisDayEvent.text || historyPage?.extract)) {
    const cleanHistTitle = String(historyPage?.titles?.normalized || historyPage?.title || `On This Day (${onThisDayEvent.year})`).replace(/_/g, ' ');
    const histBody =
      `${onThisDayEvent.year}: ${onThisDayEvent.text}\n\n` +
      (expandedExtracts.get(cleanHistTitle) || historyPage?.extract || '');
    const cleanedHist = histBody.trim();
    const words = cleanedHist.split(/\s+/).filter(Boolean).length;
    onThisDayStory = {
      id: `news-${lang}-otd-${dateStr}`,
      title: `${onThisDayEvent.year} — ${cleanHistTitle}`,
      author: 'Historical Chronicle · Wikimedia',
      language: lang,
      genre: 'history',
      source: 'news',
      newsCategory: 'history',
      license: 'CC BY-SA 4.0',
      sourceUrl: historyPage?.content_urls?.desktop?.page,
      publishedAt: Date.now(),
      coverImage: historyPage?.thumbnail?.source,
      summary: String(onThisDayEvent.text || '').slice(0, 175),
      chunks: chunkNewsProse(cleanedHist, 300),
      currentChunkIndex: 0,
      wordCount: words,
      estimatedReadTimeMinutes: Math.max(1, Math.round(words / 180)),
      createdAt: Date.now(),
      preflightVocab: await extractKeyJournalisticWords(cleanedHist, lang, baseLangName),
    };
  }

  // Ensure leadStory always exists even if Global Voices returned 0 (fallback to trending or onThisDay)
  const leadStory = culturalStories[0] || trendingStories[0] || onThisDayStory;
  if (!leadStory) {
    throw new Error(`No daily news content retrieved for language: ${lang}`);
  }

  const cachedAt = Date.now();
  return {
    date: dateStr,
    editionTitle: LOCALIZED_EDITION_TITLES[lang] || 'Morning Edition',
    language: lang,
    leadStory,
    culturalStories: culturalStories.slice(1),
    trendingStories,
    onThisDayStory,
    cachedAt,
    expiresAt: cachedAt + NEWS_CACHE_TTL_MS,
  };
}

// 5A. Daily Edition News Endpoint (6-Hour Temporal Slot LRU Cache + Coalesced Upstream Fetch)
app.get('/api/news/daily', async (req: Request, res: Response): Promise<void> => {
  const lang = resolveIsoCode(String(req.query.lang || 'it'), 'it').slice(0, 2);
  const baseLang = String(req.query.baseLang || 'English');
  const forceRefresh = req.query.refresh === '1';

  const now = new Date();
  const slot = Math.floor(now.getUTCHours() / 6);
  const dateKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(
    now.getUTCDate()
  ).padStart(2, '0')}`;
  const editionKey = `${lang}:${dateKey}:slot_${slot}:${baseLang}`;

  if (!forceRefresh) {
    const cached = getServerCache(serverNewsCache, editionKey);
    if (cached && Date.now() < cached.expiresAt) {
      res.json({ success: true, edition: cached, cached: true });
      return;
    }
  }

  try {
    let promise = newsFetchInFlight.get(editionKey);
    if (!promise) {
      promise = buildDailyNewsEdition(lang, baseLang);
      newsFetchInFlight.set(editionKey, promise);
    }
    const edition = await promise;
    setServerCache(serverNewsCache, editionKey, edition, 24);
    serverNewsLastValidByLang.set(lang, edition);
    res.json({ success: true, edition, cached: false });
  } catch (err: any) {
    console.warn(`Daily news fetch failed for ${lang}, checking stale edition:`, err?.message || err);
    const stale = serverNewsLastValidByLang.get(lang);
    if (stale) {
      res.json({ success: true, edition: { ...stale, stale: true }, cached: true, stale: true });
      return;
    }
    res.status(502).json({ error: 'Daily news feeds are temporarily unavailable.' });
  } finally {
    newsFetchInFlight.delete(editionKey);
  }
});

// 5B. SSRF-Safe Custom RSS/Atom Feed Importer
app.post('/api/news/custom-feed', async (req: Request, res: Response): Promise<void> => {
  try {
    const { feedUrl, lang = 'it', baseLang = 'English' } = req.body || {};
    if (!feedUrl || typeof feedUrl !== 'string') {
      res.status(400).json({ error: 'A valid RSS/Atom feed URL is required.' });
      return;
    }

    const safeUrl = await assertSafeExternalUrl(feedUrl.trim());
    const xml = await fetchStreamLimitedText(safeUrl.toString(), 6000, 500 * 1024);
    const parsedItems = parseRssOrAtomFeed(xml, safeUrl.hostname);

    if (parsedItems.length === 0) {
      res.status(422).json({ error: 'No readable full-text RSS/Atom items found at this feed URL.' });
      return;
    }

    const articles = await mapWithConcurrency(parsedItems.slice(0, 6), 3, async (item, idx) => {
      const words = item.prose.split(/\s+/).filter(Boolean).length;
      const preflightVocab = await extractKeyJournalisticWords(item.prose, lang, baseLang);
      return {
        id: `news-rss-${Date.now()}-${idx}`,
        title: item.title,
        author: `${item.author} (${safeUrl.hostname})`,
        language: lang,
        genre: 'essays',
        source: 'news',
        newsCategory: 'custom',
        license: 'Custom RSS Feed',
        sourceUrl: item.link || safeUrl.toString(),
        publishedAt: item.publishedAt,
        coverImage: item.coverImage,
        summary: item.prose.split(/\n/)[0].slice(0, 175) + '...',
        chunks: chunkNewsProse(item.prose, 340),
        currentChunkIndex: 0,
        wordCount: words,
        estimatedReadTimeMinutes: Math.max(1, Math.round(words / 180)),
        createdAt: Date.now(),
        preflightVocab,
      };
    });

    res.json({ success: true, articles, sourceHost: safeUrl.hostname });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to parse external RSS feed.' });
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
    console.log(`FolioPress full-stack server running on http://0.0.0.0:${PORT} (mode: ${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
