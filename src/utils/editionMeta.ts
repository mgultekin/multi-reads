import { ContentItem, GenreId } from '../types/index.ts';

export type EditionScopeKind =
  | 'complete-novel'
  | 'curated-excerpt'
  | 'complete-article'
  | 'imported-book';

export interface EditionMetadata {
  scopeKind: EditionScopeKind;
  scopeShortBadge: string;
  scopeBannerLabel: string;
  sourceLabel: string;
  isFullNovel: boolean;
  isSingleArticle: boolean;
  totalParts: number;
  chapterTitles: string[];
  remainingMinutes: number;
}

export const GENRE_COVER_MAP: Record<GenreId, string> = {
  fiction: '/covers/fiction.jpg',
  philosophy: '/covers/philosophy.jpg',
  history: '/covers/history.jpg',
  essays: '/covers/essays.jpg',
  stories: '/covers/stories.jpg',
  science: '/covers/science.jpg',
};

export const GENRE_CEFR_HINTS: Record<GenreId, { range: string; baseMatch: number }> = {
  fiction: { range: 'B1–C1', baseMatch: 90 },
  philosophy: { range: 'B2–C1', baseMatch: 86 },
  history: { range: 'B1–B2', baseMatch: 89 },
  essays: { range: 'B1 Ready', baseMatch: 93 },
  stories: { range: 'A2–B1', baseMatch: 95 },
  science: { range: 'B2', baseMatch: 85 },
};

export function isFullNovelItem(book: ContentItem): boolean {
  return (
    book.isFullNovel === true ||
    (book.source !== 'news' && book.source !== 'wikipedia' && book.chunks.length >= 8)
  );
}

export function getBookSourceLabel(book: ContentItem): string {
  if (book.source === 'news') {
    if (book.license === 'Custom RSS Feed') return 'Custom RSS';
    return book.license ? `Global Voices · ${book.license}` : 'Global Voices · CC BY 3.0';
  }
  if (book.source === 'wikipedia') {
    return 'Wikipedia · CC BY-SA 4.0';
  }
  if (book.source === 'custom') {
    return 'My Import';
  }
  if (
    book.isFullNovel ||
    book.id.startsWith('gutenberg-') ||
    typeof book.gutenbergId === 'number'
  ) {
    return 'Project Gutenberg';
  }
  return 'Classics · Gutenberg';
}

export function extractChapterTitle(
  chunkText: string,
  index: number,
  isFullNovel: boolean
): string {
  const firstLine = (chunkText || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);

  const chapterHeadingPattern =
    /^(Cap[íi]tulo|Chapitre|Kapitel|Capitolo|B[öo]l[üu]m|Chapter|Part|Parte)\b/i;

  if (firstLine && firstLine.length <= 84 && chapterHeadingPattern.test(firstLine)) {
    return firstLine;
  }

  return isFullNovel ? `Chapter ${index + 1}` : `Part ${index + 1}`;
}

export function getEditionMeta(book: ContentItem, chunkIndex: number = 0): EditionMetadata {
  const chunks = book.chunks || [];
  const totalParts = Math.max(1, chunks.length);
  const clampedIdx = Math.min(Math.max(0, chunkIndex), totalParts - 1);
  const fullNovel = isFullNovelItem(book);
  const sourceLabel = getBookSourceLabel(book);
  const readMins = Math.max(1, book.estimatedReadTimeMinutes || 5);
  const chapterTitles = chunks.map((chunk, idx) => extractChapterTitle(chunk, idx, fullNovel));

  const remainingRatio = Math.max(0, (totalParts - clampedIdx) / totalParts);
  const remainingMinutes = Math.max(1, Math.round(readMins * remainingRatio));

  if (fullNovel) {
    return {
      scopeKind: 'complete-novel',
      scopeShortBadge: `Complete Novel · ${totalParts} ch`,
      scopeBannerLabel: `Complete Novel · Chapter ${clampedIdx + 1} of ${totalParts}`,
      sourceLabel,
      isFullNovel: true,
      isSingleArticle: false,
      totalParts,
      chapterTitles,
      remainingMinutes,
    };
  }

  if (
    book.source === 'news' ||
    book.source === 'wikipedia' ||
    (book.source === 'custom' && totalParts <= 1)
  ) {
    const scopeText =
      book.source === 'custom' ? `Complete Imported Text · ${readMins} min` : `Complete Article · ${readMins} min read`;
    return {
      scopeKind: 'complete-article',
      scopeShortBadge: book.source === 'custom' ? `Imported · ${readMins} min` : `Complete Article · ${readMins}m`,
      scopeBannerLabel: scopeText,
      sourceLabel,
      isFullNovel: false,
      isSingleArticle: true,
      totalParts,
      chapterTitles,
      remainingMinutes: readMins,
    };
  }

  if (book.source === 'custom') {
    return {
      scopeKind: 'imported-book',
      scopeShortBadge: `Imported Book · ${totalParts} ch`,
      scopeBannerLabel: `Imported Book · Chapter ${clampedIdx + 1} of ${totalParts}`,
      sourceLabel,
      isFullNovel: false,
      isSingleArticle: false,
      totalParts,
      chapterTitles,
      remainingMinutes,
    };
  }

  return {
    scopeKind: 'curated-excerpt',
    scopeShortBadge: `Curated Excerpt · ${totalParts} parts`,
    scopeBannerLabel: `Curated Excerpt · Part ${clampedIdx + 1} of ${totalParts}`,
    sourceLabel,
    isFullNovel: false,
    isSingleArticle: false,
    totalParts,
    chapterTitles,
    remainingMinutes,
  };
}

export function getGenreSourcesLabel(
  booksInGenre: ContentItem[],
  hasDailyNews: boolean = false
): string {
  const tags: string[] = [];
  const pushTag = (tag: string) => {
    if (!tags.includes(tag)) tags.push(tag);
  };

  if (
    hasDailyNews ||
    booksInGenre.some((b) => b.source === 'news')
  ) {
    pushTag('Global Voices');
  }
  if (booksInGenre.some((b) => b.source === 'gutenberg' && !isFullNovelItem(b))) {
    pushTag('Classics');
  }
  if (
    booksInGenre.some(
      (b) =>
        b.source === 'gutenberg' &&
        (isFullNovelItem(b) || b.id.startsWith('gutenberg-') || typeof b.gutenbergId === 'number')
    )
  ) {
    pushTag('Gutenberg');
  }
  if (booksInGenre.some((b) => b.source === 'wikipedia')) {
    pushTag('Wiki');
  }
  if (booksInGenre.some((b) => b.source === 'custom')) {
    pushTag('Imported');
  }

  if (tags.length === 0) return 'Curated Archive';
  const top = tags.slice(0, 2);
  if (top.length === 2 && top[0] === 'Global Voices') {
    return `Press · ${top[1]}`;
  }
  return top.join(' · ');
}

export function estimateGenreKnownPct(genreId: GenreId, savedWordCount: number): number {
  const base = GENRE_CEFR_HINTS[genreId]?.baseMatch ?? 90;
  const boost = Math.min(7, Math.floor(Math.max(0, savedWordCount) / 8));
  return Math.min(98, base + boost);
}
