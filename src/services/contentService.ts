import { ContentItem, ContentSource, DailyNewsEdition, GenreId, LanguageCode } from '../types/index.ts';
import { storageService } from './storageService.ts';

const CURATED_GUTENBERG_IDS: Record<string, number> = {
  'es-quixote': 2000,
  'fr-pensees': 18269,
  'fr-verne': 4791,
  'de-verwandlung': 5200,
  'de-zarathustra': 7205,
  'it-pinocchio': 16865,
  'it-machiavelli': 1232,
  'en-sherlock': 1661,
  'en-walden': 205,
  'es-historia': 32474,
};

const WIKI_TOPICS: Record<LanguageCode, Record<GenreId, string[]>> = {
  es: {
    philosophy: ['Séneca', 'Razón', 'Estoicismo', 'Ética'],
    fiction: ['Literatura_española', 'Miguel_de_Cervantes', 'Realismo_mágico'],
    history: ['Al-Ándalus', 'Imperio_español', 'Renacimiento'],
    essays: ['Ensayo', 'Generación_del_98', 'José_Ortega_y_Gasset'],
    stories: ['Fábula', 'Alegoría_de_la_caverna', 'Don_Juan'],
    science: ['Astronomía', 'Santiago_Ramón_y_Cajal', 'Biodiversidad'],
  },
  fr: {
    philosophy: ['René_Descartes', 'Lumières_(philosophie)', 'Voltaire'],
    fiction: ['Victor_Hugo', 'Marcel_Proust', 'Romantisme'],
    history: ['Révolution_française', 'Château_de_Versailles', 'Moyen_Âge'],
    essays: ['Michel_de_Montaigne', 'Existentialisme', 'Albert_Camus'],
    stories: ['Jean_de_La_Fontaine', "Contes_de_ma_mère_l'Oye", 'Mythologie'],
    science: ['Marie_Curie', 'Système_solaire', 'Océanographie'],
  },
  de: {
    philosophy: ['Immanuel_Kant', 'Aufklärung', 'Arthur_Schopenhauer'],
    fiction: ['Johann_Wolfgang_von_Goethe', 'Thomas_Mann', 'Romantik'],
    history: ['Heiliges_Römisches_Reich', 'Berliner_Mauer', 'Hanse'],
    essays: ['Walter_Benjamin', 'Kritische_Theorie', 'Heinrich_Heine'],
    stories: ['Brüder_Grimm', 'Märchen', 'Till_Eulenspiegel'],
    science: ['Albert_Einstein', 'Alexander_von_Humboldt', 'Quantenmechanik'],
  },
  it: {
    philosophy: ["Tommaso_d'Aquino", 'Umanesimo', 'Giordano_Bruno'],
    fiction: ['Dante_Alighieri', 'Giovanni_Boccaccio', 'Italo_Calvino'],
    history: ['Rinascimento', 'Impero_romano', 'Repubblica_di_Venezia'],
    essays: ['Giacomo_Leopardi', 'Umberto_Eco', 'Benedetto_Croce'],
    stories: ['Decameron', 'Favola', "Commedia_dell'arte"],
    science: ['Galileo_Galilei', 'Leonardo_da_Vinci', 'Astrofisica'],
  },
  tr: {
    philosophy: ['Fârâbî', 'Yunus_Emre', 'Mevlânâ_Celâleddîn-i_Rûmî'],
    fiction: ['Yaşar_Kemal', 'Ahmet_Hamdi_Tanpınar', 'Huzur'],
    history: ['Osmanlı_İmparatorluğu', 'İpek_Yolu', 'Göbeklitepe'],
    essays: ['Cemil_Meriç', 'Nurullah_Ataç', 'Deneme'],
    stories: ['Dede_Korkut_Kitabı', 'Keloğlan', 'Nasreddin_Hoca'],
    science: ['Aziz_Sancar', 'Hârizmî', 'Kapadokya'],
  },
  en: {
    philosophy: ['Stoicism', 'John_Locke', 'Epistemology'],
    fiction: ['William_Shakespeare', 'Jane_Austen', 'Gothic_fiction'],
    history: ['Industrial_Revolution', 'Magna_Carta', 'Silk_Road'],
    essays: ['Francis_Bacon', 'George_Orwell', 'Ralph_Waldo_Emerson'],
    stories: ["Aesop's_Fables", 'Folklore', 'The_Canterbury_Tales'],
    science: ['Charles_Darwin', 'James_Webb_Space_Telescope', 'Ecosystem'],
  },
};

class ContentService {
  /**
   * Returns a numeric Gutenberg ID if the book belongs to Project Gutenberg
   */
  getGutenbergNumericId(bookId: string): string | null {
    if (bookId in CURATED_GUTENBERG_IDS) {
      return String(CURATED_GUTENBERG_IDS[bookId]);
    }
    const stripped = bookId.replace(/^gutenberg-(search-)?/, '');
    if (/^\d+$/.test(stripped)) {
      return stripped;
    }
    return null;
  }

  /**
   * Fetch books from Project Gutenberg via Gutendex API (supports empty query for popular classics)
   */
  async searchGutenberg(lang: LanguageCode, query: string = '', topic: string = ''): Promise<ContentItem[]> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const cleanQuery = query.trim();
      const url = `/api/gutenberg/search?languages=${encodeURIComponent(lang)}${topic ? `&topic=${encodeURIComponent(topic)}` : ''}${cleanQuery ? `&search=${encodeURIComponent(cleanQuery)}` : ''}`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`Gutenberg search returned status ${res.status}`);

      const data = await res.json();
      const results: ContentItem[] = [];

      for (const item of (data.results || []).slice(0, 12)) {
        const authorName = item.authors?.[0]?.name ? this.cleanAuthorName(item.authors[0].name) : 'Anonymous';
        const cover = item.formats?.['image/jpeg'] || undefined;

        const subjects = (item.subjects || []).join(' ').toLowerCase();
        const genre = this.detectGenreFromSubjects(subjects);
        const estimatedWords = Math.max(1800, Math.round((item.download_count || 50) * 12 + 1200));

        results.push({
          id: `gutenberg-search-${item.id}`,
          title: item.title,
          author: authorName,
          language: lang,
          genre,
          source: 'gutenberg',
          summary: item.subjects?.slice(0, 3).join(', ') || 'Classic literature from Project Gutenberg archive.',
          coverImage: cover,
          chunks: [
            `Click "Load Full Book" in the reader header to download the complete chapters of "${item.title}" directly from Project Gutenberg.\n\nAuthor: ${authorName}\nLanguage: ${lang.toUpperCase()}\nArchive ID: #${item.id}`
          ],
          currentChunkIndex: 0,
          wordCount: estimatedWords,
          estimatedReadTimeMinutes: Math.max(5, Math.round(estimatedWords / 200)),
          createdAt: Date.now(),
        });
      }

      return results;
    } catch (err) {
      clearTimeout(timer);
      console.warn('Failed to fetch from Gutenberg catalog:', err);
      return [];
    }
  }

  /**
   * Fetch full text from Project Gutenberg via our Express proxy (/api/gutenberg/:id)
   */
  async fetchGutenbergBookContent(gutenbergId: string, _lang: LanguageCode = 'es', _title = ''): Promise<string[]> {
    const numericId = this.getGutenbergNumericId(gutenbergId);
    if (!numericId) {
      throw new Error('This curated edition does not have a remote Project Gutenberg mirror ID.');
    }

    const res = await fetch(`/api/gutenberg/${encodeURIComponent(numericId)}`);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Project Gutenberg archive returned status ${res.status}`);
    }

    const data = await res.json();
    if (data.success && typeof data.text === 'string' && data.text.length > 200) {
      return this.chunkText(data.text, 500);
    }

    throw new Error('Could not extract readable chapter text from Project Gutenberg.');
  }

  /**
   * Fetches the full multi-chapter Gutenberg manuscript for a book, marks it as a
   * Full Novel (`isFullNovel: true`), persists it to storage, and returns the updated item.
   */
  async insertFullGutenbergNovel(book: ContentItem): Promise<ContentItem> {
    const gutenbergRef = book.gutenbergId ? String(book.gutenbergId) : book.id;
    const fullChunks = await this.fetchGutenbergBookContent(
      gutenbergRef,
      book.language,
      book.title
    );

    const totalWords = fullChunks
      .join(' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;

    const updated: ContentItem = {
      ...book,
      chunks: fullChunks,
      wordCount: totalWords,
      estimatedReadTimeMinutes: Math.max(5, Math.round(totalWords / 200)),
      isFullNovel: true,
      currentChunkIndex: Math.min(book.currentChunkIndex || 0, Math.max(0, fullChunks.length - 1)),
    };

    await storageService.saveBook(updated);
    return updated;
  }

  /**
   * Search Wikipedia and return a multi-paragraph article extract
   */
  async searchAndFetchWikipediaArticle(
    query: string,
    lang: LanguageCode
  ): Promise<{ title: string; extract: string; summary: string; thumbnail?: string; pageId?: number }> {
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      throw new Error('Please enter a topic to search on Wikipedia.');
    }

    // 1. Forgiving MediaWiki opensearch / search query
    const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanQuery)}&srlimit=3&format=json&origin=*`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) {
      throw new Error(`Wikipedia search failed (${searchRes.status}).`);
    }
    const searchData = await searchRes.json();
    const firstHit = searchData?.query?.search?.[0];
    if (!firstHit?.title) {
      throw new Error(`No Wikipedia article found for "${cleanQuery}" in ${lang.toUpperCase()}.`);
    }

    // 2. Fetch full plain-text extract + pageimage
    const detailUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages&explaintext=1&exchars=4500&piprop=thumbnail&pithumbsize=400&titles=${encodeURIComponent(firstHit.title)}&format=json&origin=*`;
    const detailRes = await fetch(detailUrl);
    if (!detailRes.ok) {
      throw new Error(`Failed to load Wikipedia extract (${detailRes.status}).`);
    }
    const detailData = await detailRes.json();
    const pages = detailData?.query?.pages || {};
    const page: any = Object.values(pages)[0];
    const rawExtract: string = page?.extract || '';
    const cleanedExtract = rawExtract
      .replace(/^==+.*?==+$/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (cleanedExtract.length < 80) {
      throw new Error(`The Wikipedia entry "${firstHit.title}" had too little readable prose.`);
    }

    return {
      title: page.title || firstHit.title,
      extract: cleanedExtract,
      summary: cleanedExtract.split('\n')[0].slice(0, 170) + '...',
      thumbnail: page.thumbnail?.source,
      pageId: page.pageid,
    };
  }

  /**
   * Fetch curated Wikipedia articles in target language (handles 'all' genre properly)
   */
  async fetchWikipediaArticles(lang: LanguageCode, genre: GenreId | 'all' = 'all'): Promise<ContentItem[]> {
    const langTopics = WIKI_TOPICS[lang] || WIKI_TOPICS.en;
    const topicPairs: { title: string; genre: GenreId }[] =
      genre === 'all'
        ? (Object.entries(langTopics) as [GenreId, string[]][]).flatMap(([g, list]) =>
            list.slice(0, 1).map((t) => ({ title: t.replace(/_/g, ' '), genre: g }))
          )
        : (langTopics[genre] || langTopics.history).slice(0, 3).map((t) => ({
            title: t.replace(/_/g, ' '),
            genre,
          }));

    const items: ContentItem[] = [];
    const results = await Promise.allSettled(
      topicPairs.slice(0, 4).map(async ({ title, genre: resolvedGenre }) => {
        const article = await this.searchAndFetchWikipediaArticle(title, lang);
        const words = article.extract.split(/\s+/).filter(Boolean).length;
        return {
          id: `wiki-${lang}-${article.pageId || encodeURIComponent(article.title)}`,
          title: article.title,
          author: 'Wikipedia Contributors',
          language: lang,
          genre: resolvedGenre,
          source: 'wikipedia' as ContentSource,
          summary: article.summary,
          coverImage: article.thumbnail,
          chunks: this.chunkText(article.extract, 320),
          currentChunkIndex: 0,
          wordCount: words,
          estimatedReadTimeMinutes: Math.max(1, Math.round(words / 200)),
          createdAt: Date.now(),
        };
      })
    );

    for (const r of results) {
      if (r.status === 'fulfilled') {
        items.push(r.value);
      }
    }

    return items;
  }

  /**
   * Create custom imported book/article from user input or parsed EPUB chapters
   */
  createCustomArticle(
    title: string,
    author: string,
    language: LanguageCode,
    genre: GenreId,
    rawText: string,
    preParsedChapters?: { title: string; content: string }[]
  ): ContentItem {
    let chunks: string[] = [];

    if (preParsedChapters && preParsedChapters.length > 0) {
      for (const ch of preParsedChapters) {
        const subChunks = this.chunkText(ch.content.trim(), 550);
        subChunks.forEach((sc, idx) => {
          const header =
            subChunks.length > 1 ? `${ch.title} (Part ${idx + 1}/${subChunks.length})` : ch.title;
          chunks.push(`${header}\n\n${sc}`);
        });
      }
    } else {
      chunks = this.chunkText(rawText.trim(), 600);
    }

    const words = rawText.trim().split(/\s+/).filter(Boolean).length;

    return {
      id: `custom-${Date.now()}`,
      title: title.trim() || 'Imported Text',
      author: author.trim() || 'Unknown Author',
      language,
      genre,
      source: 'custom',
      summary: rawText.slice(0, 150).replace(/\n/g, ' ') + '...',
      chunks: chunks.length > 0 ? chunks : [rawText],
      currentChunkIndex: 0,
      wordCount: words,
      estimatedReadTimeMinutes: Math.max(1, Math.round(words / 200)),
      createdAt: Date.now(),
    };
  }

  /**
   * Divide large text into manageable chunks of approximately `wordsPerChunk`
   */
  chunkText(text: string, wordsPerChunk: number = 600): string[] {
    const paragraphs = text.split(/\n\s*\n/);
    const chunks: string[] = [];
    let currentChunk: string[] = [];
    let currentWordCount = 0;

    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (!trimmed) continue;

      const wordsInPara = trimmed.split(/\s+/).length;
      if (currentWordCount + wordsInPara > wordsPerChunk && currentChunk.length > 0) {
        chunks.push(currentChunk.join('\n\n'));
        currentChunk = [trimmed];
        currentWordCount = wordsInPara;
      } else {
        currentChunk.push(trimmed);
        currentWordCount += wordsInPara;
      }
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join('\n\n'));
    }

    return chunks.length > 0 ? chunks : [text];
  }

  private cleanAuthorName(raw: string): string {
    const parts = raw.split(',');
    if (parts.length === 2) {
      return `${parts[1].trim()} ${parts[0].trim()}`;
    }
    return raw.trim();
  }

  private cleanGutenbergText(text: string): string {
    // Remove Gutenberg boilerplate start and end
    const startIdx = text.search(/\*\*\* START OF (THE|THIS) PROJECT GUTENBERG EBOOK/i);
    let cleaned = startIdx !== -1 ? text.substring(startIdx) : text;
    const endIdx = cleaned.search(/\*\*\* END OF (THE|THIS) PROJECT GUTENBERG EBOOK/i);
    if (endIdx !== -1) {
      cleaned = cleaned.substring(0, endIdx);
    }
    // Remove header line itself
    cleaned = cleaned.replace(/^\*\*\*.*?\*\*\*/m, '');
    return cleaned.trim();
  }

  private detectGenreFromSubjects(subjects: string): GenreId {
    if (subjects.includes('philosophy') || subjects.includes('ethics') || subjects.includes('thought')) {
      return 'philosophy';
    }
    if (subjects.includes('history') || subjects.includes('civilization') || subjects.includes('war')) {
      return 'history';
    }
    if (subjects.includes('essay') || subjects.includes('criticism') || subjects.includes('journalism')) {
      return 'essays';
    }
    if (subjects.includes('short stories') || subjects.includes('tales') || subjects.includes('fables')) {
      return 'stories';
    }
    if (subjects.includes('science') || subjects.includes('nature') || subjects.includes('natural history')) {
      return 'science';
    }
    return 'fiction';
  }

  /**
   * Fetches the 6-hour Morning Edition daily news for the specified target language and base language.
   * Checks client-side storage cache first unless forceRefresh is true.
   */
  async fetchDailyNewsEdition(
    lang: LanguageCode,
    baseLang: string = 'English',
    forceRefresh: boolean = false
  ): Promise<DailyNewsEdition> {
    if (!forceRefresh) {
      const cached = storageService.getCachedDailyNews(lang, baseLang);
      if (cached) {
        return cached;
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    try {
      const params = new URLSearchParams({
        lang,
        baseLang,
        ...(forceRefresh ? { refresh: '1' } : {}),
      });

      const res = await fetch(`/api/news/daily?${params.toString()}`, {
        signal: controller.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `Daily news endpoint returned status ${res.status}`);
      }

      const data = await res.json();
      if (!data?.edition) {
        throw new Error('Invalid daily news payload received from server.');
      }

      storageService.saveDailyNews(data.edition, baseLang);
      return data.edition;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Fetches and parses a custom user-provided RSS/Atom feed via the SSRF-guarded server proxy.
   */
  async fetchCustomRssFeed(
    feedUrl: string,
    lang: LanguageCode,
    baseLang: string = 'English'
  ): Promise<ContentItem[]> {
    const cleanUrl = feedUrl.trim();
    if (!cleanUrl) {
      throw new Error('A valid RSS/Atom feed URL is required.');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    try {
      const res = await fetch('/api/news/custom-feed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedUrl: cleanUrl,
          lang,
          baseLang,
        }),
        signal: controller.signal,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || `Failed to parse external RSS feed (${res.status})`);
      }

      if (!Array.isArray(data?.articles)) {
        throw new Error('No articles found in the feed response.');
      }

      return data.articles;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const contentService = new ContentService();
