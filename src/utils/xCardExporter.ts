export type CardTheme = 'parchment' | 'obsidian';
export type XCardTheme = CardTheme;

export interface SplitContrastCardPayload {
  languageName: string;
  languageCode: string;
  bookId?: string;
  bookTitle: string;
  author: string;
  cefrLevel?: string;
  b1TextbookSentence?: string;
  textbookB1Sentence?: string;
  b1TextbookTranslation?: string;
  textbookB1Translation?: string;
  masterpieceSentence: string;
  sentenceTranslation?: string;
  focalWord: string;
  wordTranslation: string;
  lemma?: string;
  partOfSpeech?: string;
  phoneticIpa?: string;
  morphology?: string;
  theme?: CardTheme;
}

export type XCardPayload = SplitContrastCardPayload;

/**
 * Returns a realistic simplified/robotic B1 textbook comparison sentence
 * across the 6 supported languages.
 */
export function getDefaultB1ContrastSentence(
  languageCode: string,
  bookId?: string,
  _topic?: string
): string {
  const lang = languageCode.slice(0, 2).toLowerCase();

  if (bookId === 'it-machiavelli') {
    return 'Penso che la fortuna decida molte cose, ma dobbiamo lavorare duro.';
  }
  if (bookId === 'es-becquer') {
    return 'La noche estaba muy oscura y hacía bastante viento.';
  }
  if (bookId === 'fr-montaigne') {
    return "J'aime beaucoup mon ami parce que nous sommes de bons copains.";
  }
  if (bookId === 'de-schopenhauer') {
    return 'Man ist glücklich, wenn man genug Geld und nette Freunde hat.';
  }
  if (bookId === 'tr-evliya') {
    return 'Ben çok gezmek istiyorum çünkü yeni yerler görmek güzeldir.';
  }

  if (lang === 'it') {
    return 'La fortuna decide molte cose, ma dobbiamo lavorare duro per avere successo.';
  }
  if (lang === 'es') {
    return 'La noche estaba muy oscura y hacía bastante viento en la ciudad.';
  }
  if (lang === 'fr') {
    return "J'aime beaucoup mon ami parce que nous sommes de bons copains.";
  }
  if (lang === 'de') {
    return 'Man ist glücklich, wenn man genug Geld und nette Freunde hat.';
  }
  if (lang === 'tr') {
    return 'Ben çok gezmek istiyorum çünkü yeni şehirler görmek güzeldir.';
  }

  return 'People should try their best to do good things every day.';
}

/**
 * Derives a simplified, slightly flat/robotic textbook B1 sentence to contrast
 * against authentic literary or journalistic prose across supported languages.
 */
export function deriveTextbookB1(
  masterpieceSentence: string,
  focalWord: string,
  languageCode: string,
  translation?: string
): { b1: string; trans: string } {
  const s = masterpieceSentence.toLowerCase();
  const lang = languageCode.slice(0, 2).toLowerCase();

  if (lang === 'it') {
    if (s.includes('fortuna') || s.includes('arbitra') || s.includes('governare')) {
      return {
        b1: 'La fortuna decide molte cose, ma dobbiamo lavorare duro.',
        trans: 'Fortune decides many things, but we must work hard.',
      };
    }
    if (s.includes('islandese') || s.includes('natura') || s.includes('fugge') || s.includes('scoiattolo')) {
      return {
        b1: 'La natura è grande e gli animali fuggono dai pericoli.',
        trans: 'Nature is big and animals run away from danger.',
      };
    }
    if (s.includes('legno') || s.includes('burattino') || s.includes('mastro')) {
      return {
        b1: 'Un vecchio falegname trova un pezzo di legno per fare un tavolo.',
        trans: 'An old carpenter finds a piece of wood to make a table.',
      };
    }
    return {
      b1: 'Penso che sia importante capire bene questa situazione.',
      trans: 'I think it is important to understand this situation well.',
    };
  }

  if (lang === 'es') {
    if (s.includes('noche') || s.includes('viento') || s.includes('campanas') || s.includes('ánimas')) {
      return {
        b1: 'La noche estaba muy oscura y hacía bastante viento.',
        trans: 'The night was very dark and it was quite windy.',
      };
    }
    if (s.includes('pereza') || s.includes('mañana') || s.includes('vuelva')) {
      return {
        b1: 'La gente no quiere trabajar hoy y dice que lo hará mañana.',
        trans: "People don't want to work today and say they will do it tomorrow.",
      };
    }
    if (s.includes('hidalgo') || s.includes('mancha') || s.includes('caballerías')) {
      return {
        b1: 'Un hombre de cincuenta años lee muchos libros y olvida la realidad.',
        trans: 'A fifty-year-old man reads many books and forgets reality.',
      };
    }
    return {
      b1: 'Creo que debemos practicar todos los días para hablar bien.',
      trans: 'I think we must practice every day to speak well.',
    };
  }

  if (lang === 'fr') {
    if (s.includes('aimais') || s.includes('amitié') || s.includes('ami')) {
      return {
        b1: "J'aime beaucoup mon ami parce que nous sommes de bons copains.",
        trans: 'I really like my friend because we are good pals.',
      };
    }
    if (s.includes('roseau') || s.includes('pensée') || s.includes('penser')) {
      return {
        b1: "L'être humain est fragile, mais il a une bonne intelligence.",
        trans: 'The human being is fragile, but has good intelligence.',
      };
    }
    if (s.includes('ficelle') || s.includes('marché') || s.includes('portefeuille')) {
      return {
        b1: 'Un paysan ramasse une petite corde par terre pendant le marché.',
        trans: 'A peasant picks up a small cord on the ground during the market.',
      };
    }
    return {
      b1: 'Il faut faire attention quand on voyage dans un pays étranger.',
      trans: 'You must be careful when traveling in a foreign country.',
    };
  }

  if (lang === 'de') {
    if (s.includes('glück') || s.includes('autarkie') || s.includes('einsamkeit')) {
      return {
        b1: 'Man ist glücklich, wenn man genug Geld und nette Freunde hat.',
        trans: 'You are happy when you have enough money and nice friends.',
      };
    }
    if (s.includes('ungeziefer') || s.includes('erwachte') || s.includes('samsa')) {
      return {
        b1: 'Ein Mann wacht am Morgen auf und fühlt sich sehr unwohl im Bett.',
        trans: 'A man wakes up in the morning and feels very uncomfortable in bed.',
      };
    }
    return {
      b1: 'Ich denke, dass man jeden Tag neue Vokabeln lernen muss.',
      trans: 'I think that you must learn new vocabulary every day.',
    };
  }

  if (lang === 'tr') {
    if (s.includes('şefaat') || s.includes('seyahat') || s.includes('rüya')) {
      return {
        b1: 'Ben çok gezmek istiyorum çünkü yeni şehirler görmek güzeldir.',
        trans: 'I want to travel a lot because seeing new cities is nice.',
      };
    }
    if (s.includes('leylek') || s.includes('hastane') || s.includes('gurabâhâne')) {
      return {
        b1: 'Şehirde yaralı kuşlar için güzel bir bakım yeri vardır.',
        trans: 'There is a nice care center for injured birds in the city.',
      };
    }
    return {
      b1: 'Bence her gün düzenli kitap okumak çok faydalıdır.',
      trans: 'I think reading books regularly every day is very beneficial.',
    };
  }

  return {
    b1: translation ? `People simply say: "${translation}"` : 'People should try their best to do good things every day.',
    trans: translation || 'People should try their best to do good things every day.',
  };
}

/**
 * Text-wrapping helper with line count limits.
 */
function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number = 3
): number {
  const words = text.split(/\s+/).filter(Boolean);
  let line = '';
  let linesCount = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line ? `${line} ${words[n]}` : words[n];
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = words[n];
      y += lineHeight;
      linesCount++;

      if (linesCount >= maxLines - 1 && n < words.length - 1) {
        let remaining = line;
        for (let k = n + 1; k < words.length; k++) {
          const testRemaining = `${remaining} ${words[k]}`;
          if (ctx.measureText(`${testRemaining}...`).width > maxWidth) {
            break;
          }
          remaining = testRemaining;
        }
        ctx.fillText(`${remaining}...`, x, y);
        return y + lineHeight;
      }
    } else {
      line = testLine;
    }
  }

  if (line) {
    ctx.fillText(line, x, y);
    y += lineHeight;
  }

  return y;
}

/**
 * Renders a 1200x675 split-contrast visual comparison card onto an HTML5 canvas.
 */
export function renderSplitContrastCardToCanvas(
  canvas: HTMLCanvasElement,
  payload: SplitContrastCardPayload
): void {
  const WIDTH = 1200;
  const HEIGHT = 675;

  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const isObsidian = payload.theme === 'obsidian';

  const colors = isObsidian
    ? {
        bg: '#121110',
        cardBg: '#1C1917',
        ledgerBg: '#171514',
        border: '#2E2A27',
        borderAccent: 'rgba(245, 158, 11, 0.35)',
        textPrimary: '#F5F5F4',
        textSecondary: '#A8A29E',
        textMuted: '#78716C',
        accent: '#F59E0B',
        accentPillBg: 'rgba(245, 158, 11, 0.15)',
        dangerText: '#F87171',
        successText: '#34D399',
        focalHighlight: 'rgba(245, 158, 11, 0.22)',
      }
    : {
        bg: '#FBF9F5',
        cardBg: '#F3EFE6',
        ledgerBg: '#EFE9DD',
        border: '#E7E2D6',
        borderAccent: 'rgba(180, 83, 9, 0.35)',
        textPrimary: '#1C1917',
        textSecondary: '#78716C',
        textMuted: '#A8A29E',
        accent: '#B45309',
        accentPillBg: 'rgba(180, 83, 9, 0.1)',
        dangerText: '#DC2626',
        successText: '#059669',
        focalHighlight: 'rgba(180, 83, 9, 0.15)',
      };

  // 1. Base Canvas Background
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Outer framing boundary
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(20, 20, WIDTH - 40, HEIGHT - 40);

  // 2. Header Bar (Y: 42–85)
  // Left Logomark & Label
  ctx.fillStyle = colors.accent;
  ctx.beginPath();
  ctx.roundRect(45, 45, 30, 30, 6);
  ctx.fill();

  ctx.fillStyle = isObsidian ? '#121110' : '#FFFFFF';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('F', 54, 67);

  ctx.fillStyle = colors.textPrimary;
  ctx.font = "bold 16px 'Inter', -apple-system, sans-serif";
  ctx.fillText('FOLIOPRESS', 85, 66);

  ctx.fillStyle = colors.textMuted;
  ctx.font = "13px 'Inter', -apple-system, sans-serif";
  ctx.fillText('· LITERARY CONTRAST DISPATCH', 195, 66);

  // Right Language & CEFR Badge Pill
  const pillText = `${payload.languageName.toUpperCase()} · ${payload.cefrLevel || 'ORIGINAL'}`;
  ctx.font = "bold 12px 'JetBrains Mono', monospace";
  const pillWidth = ctx.measureText(pillText).width + 24;
  const pillX = WIDTH - 45 - pillWidth;

  ctx.fillStyle = colors.accentPillBg;
  ctx.beginPath();
  ctx.roundRect(pillX, 45, pillWidth, 30, 15);
  ctx.fill();
  ctx.strokeStyle = colors.borderAccent;
  ctx.stroke();

  ctx.fillStyle = colors.accent;
  ctx.fillText(pillText, pillX + 12, 65);

  // 3. Zone 1: Textbook B1 Comparison Card (Y: 96–182)
  const z1X = 45;
  const z1Y = 96;
  const z1W = WIDTH - 90;
  const z1H = 86;

  ctx.fillStyle = colors.cardBg;
  ctx.beginPath();
  ctx.roundRect(z1X, z1Y, z1W, z1H, 10);
  ctx.fill();
  ctx.strokeStyle = colors.border;
  ctx.stroke();

  // Zone 1 Header
  ctx.fillStyle = colors.dangerText;
  ctx.font = "bold 11px 'Inter', -apple-system, sans-serif";
  ctx.fillText('❌ WHAT TEXTBOOKS & APPS TEACH (B1)', z1X + 18, z1Y + 24);

  // Zone 1 Sentence
  const resolvedB1 =
    payload.b1TextbookSentence ||
    payload.textbookB1Sentence ||
    getDefaultB1ContrastSentence(payload.languageCode, payload.bookId);

  ctx.fillStyle = colors.textPrimary;
  ctx.font = "italic 16px 'Inter', -apple-system, sans-serif";
  const b1Line = `"${resolvedB1}"`;
  ctx.fillText(b1Line, z1X + 18, z1Y + 52);

  // Zone 1 Translation
  const resolvedB1Trans = payload.b1TextbookTranslation || payload.textbookB1Translation;
  if (resolvedB1Trans) {
    ctx.fillStyle = colors.textSecondary;
    ctx.font = "13px 'Inter', -apple-system, sans-serif";
    ctx.fillText(`→ "${resolvedB1Trans}"`, z1X + 18, z1Y + 72);
  }

  // 4. Zone 2: Authentic Masterpiece Stage (Y: 198–556)
  const z2X = 45;
  const z2Y = 198;
  const z2W = WIDTH - 90;
  const z2H = 358;

  ctx.fillStyle = colors.cardBg;
  ctx.beginPath();
  ctx.roundRect(z2X, z2Y, z2W, z2H, 12);
  ctx.fill();
  ctx.strokeStyle = colors.border;
  ctx.stroke();

  // Zone 2 Header
  ctx.fillStyle = colors.successText;
  ctx.font = "bold 12px 'Inter', -apple-system, sans-serif";
  ctx.fillText(`✅ HOW ${payload.author.toUpperCase()} ACTUALLY WROTE IT`, z2X + 22, z2Y + 30);

  // Zone 2 Top-Right CEFR Toggle Badge
  const cefrToggleLabel = `CEFR: B1 ⇄ ${payload.cefrLevel || 'Original'}`;
  ctx.fillStyle = colors.accent;
  ctx.font = "bold 12px 'JetBrains Mono', monospace";
  const cefrToggleWidth = ctx.measureText(cefrToggleLabel).width;
  ctx.fillText(cefrToggleLabel, z2X + z2W - 22 - cefrToggleWidth, z2Y + 30);

  // Masterpiece Quotation
  ctx.fillStyle = colors.textPrimary;
  ctx.font = "italic 23px 'Newsreader', Georgia, serif";
  const quoteText = `«${payload.masterpieceSentence}»`;
  const quoteEndY = wrapCanvasText(ctx, quoteText, z2X + 22, z2Y + 68, z2W - 44, 34, 3);

  // Sentence Translation
  if (payload.sentenceTranslation) {
    ctx.fillStyle = colors.textSecondary;
    ctx.font = "15px 'Inter', -apple-system, sans-serif";
    wrapCanvasText(ctx, `→ ${payload.sentenceTranslation}`, z2X + 22, Math.max(quoteEndY + 4, z2Y + 142), z2W - 44, 22, 2);
  }

  // 5. Lexical Breakdown Ledger (Inset Box Y: 418–536)
  const ledX = z2X + 18;
  const ledY = z2Y + 220;
  const ledW = z2W - 36;
  const ledH = 118;

  ctx.fillStyle = colors.ledgerBg;
  ctx.beginPath();
  ctx.roundRect(ledX, ledY, ledW, ledH, 10);
  ctx.fill();
  ctx.strokeStyle = colors.borderAccent;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Column 1: Focal Word + IPA
  ctx.fillStyle = colors.accent;
  ctx.font = "bold 26px 'Newsreader', Georgia, serif";
  ctx.fillText(payload.focalWord, ledX + 20, ledY + 44);

  if (payload.phoneticIpa) {
    ctx.fillStyle = colors.textSecondary;
    ctx.font = "14px 'JetBrains Mono', monospace";
    ctx.fillText(`[${payload.phoneticIpa}]`, ledX + 20, ledY + 72);
  }

  // Column 2: POS & Root Lemma & Morphology
  const col2X = ledX + 320;
  const posLemma = `${payload.partOfSpeech || 'Word'}${payload.lemma ? ` · root: ${payload.lemma}` : ''}`;
  ctx.fillStyle = colors.textPrimary;
  ctx.font = "bold 15px 'Inter', -apple-system, sans-serif";
  ctx.fillText(posLemma, col2X, ledY + 42);

  ctx.fillStyle = colors.textSecondary;
  ctx.font = "13px 'Inter', -apple-system, sans-serif";
  const morphText = payload.morphology || 'Authentic contextual form';
  ctx.fillText(morphText, col2X, ledY + 68);

  // Column 3: English / Native Translation
  const col3X = ledX + 660;
  ctx.fillStyle = colors.textMuted;
  ctx.font = "bold 11px 'Inter', -apple-system, sans-serif";
  ctx.fillText('TRANSLATION', col3X, ledY + 30);

  ctx.fillStyle = colors.textPrimary;
  ctx.font = "bold 20px 'Inter', -apple-system, sans-serif";
  ctx.fillText(`→ ${payload.wordTranslation}`, col3X, ledY + 58);

  // 6. Zone 3: Footer Bar (Y: 574–635)
  ctx.fillStyle = colors.textSecondary;
  ctx.font = "13px 'Inter', -apple-system, sans-serif";
  const bookMeta = `📖 ${payload.bookTitle} · ${payload.author} (${payload.languageName})`;
  ctx.fillText(bookMeta, 45, 608);

  const brandTag = 'FolioPress · 0ms Literature & News Reader';
  ctx.font = "12px 'Inter', -apple-system, sans-serif";
  ctx.fillStyle = colors.textMuted;
  const brandWidth = ctx.measureText(brandTag).width;
  ctx.fillText(brandTag, WIDTH - 45 - brandWidth, 608);
}

/**
 * Calculates Twitter/X weighted character count (URL counts as 23 characters).
 */
export function calculateXWeightedLength(text: string): number {
  const urlPattern = /https?:\/\/[^\s]+/g;
  const textWithoutUrls = text.replace(urlPattern, '');
  const urlMatches = text.match(urlPattern);
  const urlCount = urlMatches ? urlMatches.length : 0;

  let length = urlCount * 23;
  for (const char of textWithoutUrls) {
    const code = char.codePointAt(0) || 0;
    if (code <= 0x7f) {
      length += 1;
    } else if (code > 0xffff) {
      length += 2;
    } else {
      length += 1;
    }
  }
  return length;
}

/**
 * Clips text cleanly on a word boundary when shortening to fit X limits.
 */
function clipAtWordBoundary(text: string, targetLen: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= targetLen) return trimmed;
  const sliced = trimmed.slice(0, Math.max(8, targetLen - 3)).trim();
  const lastSpace = sliced.lastIndexOf(' ');
  const cleanCut = lastSpace > 12 ? sliced.slice(0, lastSpace).trim() : sliced;
  return `${cleanCut.replace(/[,:;—–-]+$/, '').trim()}...`;
}

/**
 * Builds compliant X intent hook text strictly <= 275 X-weighted characters,
 * citing Author + Book Title, verbatim quote, and English translation with zero URLs.
 */
export function buildBenchmarkXIntentText(payload: SplitContrastCardPayload): string {
  const prefix = `Apps drill flat ${payload.languageName}.\n\n`;
  const cleanTitle = payload.bookTitle.replace(/\s*[—(].*$/, '').trim();
  const shortTitle =
    cleanTitle.length > 28 ? clipAtWordBoundary(cleanTitle, 28) : cleanTitle;
  const author = payload.author;
  const signOff = `\n🔍 ${payload.focalWord} → ${payload.wordTranslation} — @FolioPress`;

  let b1 =
    payload.b1TextbookSentence ||
    payload.textbookB1Sentence ||
    getDefaultB1ContrastSentence(payload.languageCode, payload.bookId);
  let quote = payload.masterpieceSentence;
  let shortEnglish = (payload.sentenceTranslation || payload.wordTranslation || '').trim();

  if (shortEnglish.length > 88) {
    shortEnglish = clipAtWordBoundary(shortEnglish, 88);
  }

  const formatTweet = (b1Text: string, quoteText: string, englishText: string): string => {
    const enLine = englishText ? `\n🇬🇧 "${englishText}"` : '';
    return `${prefix}❌ B1: "${b1Text}"\n✅ ${author} (${shortTitle}): «${quoteText}»${enLine}${signOff}`;
  };

  let tweet = formatTweet(b1, quote, shortEnglish);

  if (calculateXWeightedLength(tweet) > 275 && b1.length > 46) {
    b1 = clipAtWordBoundary(b1, 46);
    tweet = formatTweet(b1, quote, shortEnglish);
  }

  while (calculateXWeightedLength(tweet) > 275 && quote.length > 42) {
    quote = clipAtWordBoundary(quote, quote.length - 8);
    tweet = formatTweet(b1, quote, shortEnglish);
  }

  while (calculateXWeightedLength(tweet) > 275 && shortEnglish.length > 30) {
    shortEnglish = clipAtWordBoundary(shortEnglish, shortEnglish.length - 8);
    tweet = formatTweet(b1, quote, shortEnglish);
  }

  while (calculateXWeightedLength(tweet) > 275 && b1.length > 22) {
    b1 = clipAtWordBoundary(b1, b1.length - 6);
    tweet = formatTweet(b1, quote, shortEnglish);
  }

  while (calculateXWeightedLength(tweet) > 275 && quote.length > 20) {
    quote = clipAtWordBoundary(quote, quote.length - 6);
    tweet = formatTweet(b1, quote, shortEnglish);
  }

  return tweet;
}

/**
 * Copies the rendered canvas PNG to the system clipboard.
 */
export async function copyCardImageToClipboard(canvas: HTMLCanvasElement): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.clipboard || typeof ClipboardItem === 'undefined') {
    return false;
  }
  try {
    return await new Promise<boolean>((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          resolve(false);
          return;
        }
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              'image/png': blob,
            }),
          ]);
          resolve(true);
        } catch {
          resolve(false);
        }
      }, 'image/png');
    });
  } catch {
    return false;
  }
}

/**
 * Triggers a direct PNG download of the rendered canvas.
 */
export function downloadCardPng(
  canvas: HTMLCanvasElement,
  filename: string = 'foliopress-split-contrast.png'
): void {
  if (typeof window === 'undefined') return;
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Opens official X web intent in a new tab.
 */
export function openXWebIntent(tweetText: string): void {
  if (typeof window === 'undefined') return;
  const url = `https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
