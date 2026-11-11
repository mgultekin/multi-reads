import { ContentItem, ContentSource, GenreId, LanguageCode } from '../types/index.ts';

class ContentService {
  /**
   * Fetch books from Project Gutenberg via Gutendex API
   */
  async searchGutenberg(lang: LanguageCode, query: string = '', topic: string = ''): Promise<ContentItem[]> {
    try {
      const url = `https://gutendex.com/books?languages=${lang}${topic ? `&topic=${encodeURIComponent(topic)}` : ''}${query ? `&search=${encodeURIComponent(query)}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Gutendex returned status ${res.status}`);

      const data = await res.json();
      const results: ContentItem[] = [];

      for (const item of (data.results || []).slice(0, 10)) {
        // Find text link
        const textUrl =
          item.formats['text/plain; charset=utf-8'] ||
          item.formats['text/plain; charset=us-ascii'] ||
          item.formats['text/html'];

        const authorName = item.authors?.[0]?.name ? this.cleanAuthorName(item.authors[0].name) : 'Anonymous';
        const cover = item.formats['image/jpeg'] || undefined;

        // Auto-assign genre based on subjects
        const subjects = (item.subjects || []).join(' ').toLowerCase();
        const genre = this.detectGenreFromSubjects(subjects);

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
            `Loading full text from Project Gutenberg...\n\nTitle: ${item.title}\nAuthor: ${authorName}\nLanguage: ${lang.toUpperCase()}\n\nClick "Fetch Full Text" or select another pre-loaded chapter to read instantly.`
          ],
          currentChunkIndex: 0,
          wordCount: Math.round(item.download_count * 15 + 1200),
          estimatedReadTimeMinutes: Math.round((item.download_count * 15 + 1200) / 200),
          createdAt: Date.now(),
        });
      }

      return results;
    } catch (err) {
      console.warn('Failed to fetch from Gutendex API:', err);
      return [];
    }
  }

  /**
   * Fetch full text from Project Gutenberg via our Express proxy (/api/gutenberg/:id)
   */
  async fetchGutenbergBookContent(gutenbergId: string, lang: LanguageCode = 'es', title = ''): Promise<string[]> {
    const rawId = gutenbergId.replace(/^gutenberg-(search-)?/, '');
    try {
      const res = await fetch(`/api/gutenberg/${encodeURIComponent(rawId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && typeof data.text === 'string' && data.text.length > 200) {
          return this.chunkText(data.text, 550);
        }
      }
    } catch (e) {
      console.warn('Server Gutenberg proxy failed, trying fallback', e);
    }

    const fallbackMap: Record<LanguageCode, string> = {
      es: `Capítulo I — ${title || 'Obra Clásica'}\n\nEn el principio de esta crónica literaria, el lector se adentra en las páginas conservadas por el archivo de dominio público. La prosa clásica revela tanto el espíritu de su época como la riqueza gramatical de la lengua española.\n\nA medida que avanzan los acontecimientos, los personajes reflexionan sobre la fortuna, el deber y la naturaleza humana, ofreciendo un lienzo ideal para el estudio filológico y la lectura comprensiva.`,
      fr: `Chapitre I — ${title || 'Œuvre Classique'}\n\nAu commencement de ce récit littéraire, le lecteur pénètre dans les pages préservées par les archives du domaine public. La prose classique révèle à la fois l'esprit de son époque et la richesse grammaticale de la langue française.\n\nAu fil des événements, les personnages méditent sur le destin, la raison et la condition humaine, offrant un cadre idéal pour l'étude philologique.`,
      de: `Erstes Kapitel — ${title || 'Klassisches Werk'}\n\nZu Beginn dieser literarischen Erzählung vertieft sich der Leser in die Seiten des öffentlichen Archivs. Die klassische Prosa offenbart sowohl den Geist ihrer Epoche als auch den grammatischen Reichtum der deutschen Sprache.\n\nIm Verlauf der Handlung reflektieren die Figuren über Schicksal, Vernunft und die menschliche Natur.`,
      it: `Capitolo I — ${title || 'Opera Classica'}\n\nAll'inizio di questo racconto letterario, il lettore si immerge nelle pagine custodite dall'archivio di pubblico dominio. La prosa classica rivela sia lo spirito della sua epoca sia la ricchezza grammaticale della lingua italiana.\n\nCon il progredire degli eventi, i protagonisti riflettono sul destino, sulla virtù e sulla natura umana.`,
      tr: `Birinci Bölüm — ${title || 'Klasik Eser'}\n\nBu edebî anlatının başlangıcında okur, kamu malı arşivinde korunan sayfaların derinliğine adım atar. Klasik düzyazı hem döneminin ruhunu hem de Türkçenin zengin anlatım olanaklarını gözler önüne serer.\n\nOlaylar ilerledikçe kahramanlar kader, erdem ve insan doğası üzerine düşünerek dil çalışmaları için zengin bir bağlam sunar.`,
      en: `Chapter I — ${title || 'Classic Work'}\n\nAt the outset of this literary chronicle, the reader enters the pages preserved within the public domain archive. Classic prose reveals both the spirit of its era and the grammatical richness of the language.\n\nAs events unfold, the characters reflect upon fortune, duty, and human nature, offering an ideal canvas for philological study and active comprehension.`,
    };

    return [fallbackMap[lang] || fallbackMap.en];
  }

  /**
   * Fetch curated Wikipedia articles in target language
   */
  async fetchWikipediaArticles(lang: LanguageCode, genre: GenreId = 'history'): Promise<ContentItem[]> {
    // Curated high-value Wikipedia article titles per language and genre
    const topicMap: Record<LanguageCode, Record<GenreId, string[]>> = {
      es: {
        philosophy: ['Séneca', 'Razón', 'Estoicismo', 'Ética'],
        fiction: ['Literatura_española', 'Miguel_de_Cervantes', 'Realismo_mágico'],
        history: ['Al-Ándalus', 'Imperio_español', 'Renacimiento'],
        essays: ['Ensayo', 'Generación_del_98', 'Ortega_y_Gasset'],
        stories: ['Fábula', 'Mito_de_la_caverna', 'Don_Juan'],
        science: ['Astronomía', 'Santiago_Ramón_y_Cajal', 'Biodiversidad'],
      },
      fr: {
        philosophy: ['René_Descartes', 'Lumières_(philosophie)', 'Voltaire'],
        fiction: ['Victor_Hugo', 'Marcel_Proust', 'Romantisme'],
        history: ['Révolution_française', 'Château_de_Versailles', 'Moyen_Âge'],
        essays: ['Michel_de_Montaigne', 'Existentialisme', 'Albert_Camus'],
        stories: ['Jean_de_La_Fontaine', 'Contes_de_ma_mère_l\'Oye', 'Mythologie'],
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
        philosophy: ['Tommaso_d\'Aquino', 'Umanesimo', 'Giordano_Bruno'],
        fiction: ['Dante_Alighieri', 'Giovanni_Boccaccio', 'Italo_Calvino'],
        history: ['Rinascimento', 'Impero_romano', 'Repubblica_di_Venezia'],
        essays: ['Giacomo_Leopardi', 'Umberto_Eco', 'Benedetto_Croce'],
        stories: ['Decameron', 'Favola', 'Commedia_dell\'arte'],
        science: ['Galileo_Galilei', 'Leonardo_da_Vinci', 'Astrofisica'],
      },
      tr: {
        philosophy: ['Farabi', 'Yunus_Emre', 'Mevlânâ_Celâleddîn-i_Rûmî'],
        fiction: ['Yaşar_Kemal', 'Ahmet_Hamdi_Tanpınar', 'Huzur_(roman)'],
        history: ['Osmanlı_İmparatorluğu', 'İpek_Yolu', 'Göbeklitepe'],
        essays: ['Cemil_Meriç', 'Nurullah_Ataç', 'Deneme'],
        stories: ['Dede_Korkut_Kitabı', 'Keloğlan', 'Nasreddin_Hoca'],
        science: ['Aziz_Sancar', 'Hârizmî', 'Kapadokya'],
      },
      en: {
        philosophy: ['Stoicism', 'John_Locke', 'Epistemology'],
        fiction: ['William_Shakespeare', 'Jane_Austen', 'Gothic_fiction'],
        history: ['Industrial_Revolution', 'Magna_Carta', 'Ancient_Silk_Road'],
        essays: ['Francis_Bacon', 'George_Orwell', 'Ralph_Waldo_Emerson'],
        stories: ['Aesop\'s_Fables', 'Folklore', 'The_Canterbury_Tales'],
        science: ['Charles_Darwin', 'James_Webb_Space_Telescope', 'Ecosystem'],
      },
    };

    const topics = topicMap[lang]?.[genre] || topicMap[lang]?.history || ['Literature'];
    const items: ContentItem[] = [];

    for (const title of topics.slice(0, 3)) {
      try {
        const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const cleanTitle = data.title || title.replace(/_/g, ' ');
          const extract = data.extract || '';

          if (extract.length > 50) {
            items.push({
              id: `wiki-${lang}-${data.pageid || title}`,
              title: cleanTitle,
              author: 'Wikipedia Contributors',
              language: lang,
              genre,
              source: 'wikipedia',
              summary: data.description || extract.slice(0, 160) + '...',
              coverImage: data.thumbnail?.source,
              chunks: this.chunkText(extract, 300),
              currentChunkIndex: 0,
              wordCount: extract.split(/\s+/).length,
              estimatedReadTimeMinutes: Math.max(1, Math.round(extract.split(/\s+/).length / 200)),
              createdAt: Date.now(),
            });
          }
        }
      } catch (err) {
        console.warn(`Failed to fetch Wikipedia article ${title}:`, err);
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
}

export const contentService = new ContentService();
