import { LanguageCode } from '../types/index.ts';

export interface ParsedChapter {
  title: string;
  content: string;
  wordCount: number;
}

export interface ParsedManuscript {
  title: string;
  author: string;
  language?: LanguageCode;
  chapters: ParsedChapter[];
  fullText: string;
  totalWords: number;
  format: 'epub' | 'markdown' | 'html' | 'txt';
}

const VALID_LANG_CODES = new Set<string>(['es', 'fr', 'de', 'it', 'tr', 'en']);

function normalizeLangCode(raw?: string | null): LanguageCode | undefined {
  if (!raw) return undefined;
  const code = raw.trim().toLowerCase().slice(0, 2);
  if (VALID_LANG_CODES.has(code)) {
    return code as LanguageCode;
  }
  return undefined;
}

/**
 * Extracts structured paragraphs from XHTML/HTML string using browser DOMParser
 */
function extractTextFromHtml(htmlString: string): { title?: string; bodyText: string } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');

  // Remove script, style, nav, and hidden elements
  doc.querySelectorAll('script, style, nav, svg, head > style').forEach((el) => el.remove());

  const headingEl = doc.querySelector('h1, h2, h3, title');
  const title = headingEl?.textContent?.trim() || undefined;

  const blockTags = doc.querySelectorAll('h1, h2, h3, h4, p, blockquote, li');
  const paragraphs: string[] = [];

  if (blockTags.length > 0) {
    blockTags.forEach((node) => {
      const text = (node.textContent || '').replace(/\s+/g, ' ').trim();
      if (text.length > 1) {
        paragraphs.push(text);
      }
    });
  } else {
    const rawBody = (doc.body?.textContent || '').replace(/\r\n/g, '\n');
    rawBody
      .split(/\n\s*\n/)
      .map((p) => p.replace(/\s+/g, ' ').trim())
      .filter((p) => p.length > 1)
      .forEach((p) => paragraphs.push(p));
  }

  return {
    title,
    bodyText: paragraphs.join('\n\n'),
  };
}

/**
 * Decompresses raw DEFLATE bytes from a ZIP archive entry using native DecompressionStream
 */
async function inflateRawBytes(compressed: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('Browser does not support native DecompressionStream for EPUB archive extraction.');
  }
  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  writer.write(compressed as unknown as BufferSource).catch(() => {});
  writer.close().catch(() => {});

  const reader = ds.readable.getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      totalLength += value.byteLength;
    }
  }

  const output = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

interface ZipEntry {
  filename: string;
  compressionMethod: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
}

/**
 * Reads ZIP Central Directory and extracts text files (.xml, .opf, .xhtml, .html, .htm)
 */
async function extractZipTextFiles(buffer: ArrayBuffer): Promise<Map<string, string>> {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  const files = new Map<string, string>();
  const decoder = new TextDecoder('utf-8');

  // Locate End of Central Directory (EOCD) signature 0x06054b50
  let eocdOffset = -1;
  const maxCommentSearch = Math.max(0, bytes.byteLength - 65557);
  for (let i = bytes.byteLength - 22; i >= maxCommentSearch; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset === -1) {
    throw new Error('Invalid EPUB file: ZIP Central Directory not found.');
  }

  const totalEntries = view.getUint16(eocdOffset + 10, true);
  const cdOffset = view.getUint32(eocdOffset + 16, true);

  const entries: ZipEntry[] = [];
  let ptr = cdOffset;

  for (let i = 0; i < totalEntries; i++) {
    if (ptr + 46 > bytes.byteLength) break;
    const sig = view.getUint32(ptr, true);
    if (sig !== 0x02014b50) break;

    const compressionMethod = view.getUint16(ptr + 10, true);
    const compressedSize = view.getUint32(ptr + 20, true);
    const uncompressedSize = view.getUint32(ptr + 24, true);
    const fileNameLen = view.getUint16(ptr + 28, true);
    const extraLen = view.getUint16(ptr + 30, true);
    const commentLen = view.getUint16(ptr + 32, true);
    const localHeaderOffset = view.getUint32(ptr + 42, true);

    const filename = decoder.decode(bytes.subarray(ptr + 46, ptr + 46 + fileNameLen));
    entries.push({
      filename,
      compressionMethod,
      compressedSize,
      uncompressedSize,
      localHeaderOffset,
    });

    ptr += 46 + fileNameLen + extraLen + commentLen;
  }

  for (const entry of entries) {
    const lower = entry.filename.toLowerCase();
    const isTextEntry =
      lower.endsWith('.xml') ||
      lower.endsWith('.opf') ||
      lower.endsWith('.xhtml') ||
      lower.endsWith('.html') ||
      lower.endsWith('.htm') ||
      lower.endsWith('.txt') ||
      lower.endsWith('.md');

    if (!isTextEntry || entry.uncompressedSize === 0) continue;

    const lho = entry.localHeaderOffset;
    if (lho + 30 > bytes.byteLength) continue;
    if (view.getUint32(lho, true) !== 0x04034b50) continue;

    const localNameLen = view.getUint16(lho + 26, true);
    const localExtraLen = view.getUint16(lho + 28, true);
    const dataStart = lho + 30 + localNameLen + localExtraLen;
    const dataEnd = dataStart + entry.compressedSize;
    if (dataEnd > bytes.byteLength) continue;

    const rawSlice = bytes.subarray(dataStart, dataEnd);
    try {
      if (entry.compressionMethod === 0) {
        files.set(entry.filename, decoder.decode(rawSlice));
      } else if (entry.compressionMethod === 8) {
        const inflated = await inflateRawBytes(rawSlice);
        files.set(entry.filename, decoder.decode(inflated));
      }
    } catch {
      // Skip unreadable entry
    }
  }

  return files;
}

/**
 * Resolves relative paths inside EPUB archive (e.g., OEBPS/content.opf + Text/ch1.xhtml)
 */
function resolveEpubPath(baseDir: string, relativeHref: string): string {
  const cleanHref = decodeURIComponent(relativeHref.split('#')[0]);
  if (!baseDir) return cleanHref.replace(/^\/+/, '');
  const stack = baseDir.split('/').filter(Boolean);
  for (const part of cleanHref.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') stack.pop();
    else stack.push(part);
  }
  return stack.join('/');
}

/**
 * Parses an EPUB binary file into chapters, metadata, and full text
 */
async function parseEpubFile(file: File): Promise<ParsedManuscript> {
  const buffer = await file.arrayBuffer();
  const archiveFiles = await extractZipTextFiles(buffer);

  const parser = new DOMParser();
  let opfPath = '';

  // 1. Check META-INF/container.xml for OPF rootfile path
  const containerXml = archiveFiles.get('META-INF/container.xml');
  if (containerXml) {
    const containerDoc = parser.parseFromString(containerXml, 'application/xml');
    const rootfileEl = containerDoc.querySelector('rootfile');
    opfPath = rootfileEl?.getAttribute('full-path') || '';
  }

  // Fallback: locate any .opf file in the archive
  if (!opfPath || !archiveFiles.has(opfPath)) {
    for (const key of archiveFiles.keys()) {
      if (key.toLowerCase().endsWith('.opf')) {
        opfPath = key;
        break;
      }
    }
  }

  let bookTitle = file.name.replace(/\.epub$/i, '');
  let bookAuthor = 'Unknown Author';
  let bookLang: LanguageCode | undefined;
  const orderedPaths: string[] = [];

  if (opfPath && archiveFiles.has(opfPath)) {
    const opfContent = archiveFiles.get(opfPath)!;
    const opfDoc = parser.parseFromString(opfContent, 'application/xml');
    const opfBaseDir = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/')) : '';

    const titleEl =
      opfDoc.getElementsByTagName('dc:title')[0] || opfDoc.querySelector('title');
    const creatorEl =
      opfDoc.getElementsByTagName('dc:creator')[0] || opfDoc.querySelector('creator');
    const langEl =
      opfDoc.getElementsByTagName('dc:language')[0] || opfDoc.querySelector('language');

    if (titleEl?.textContent?.trim()) bookTitle = titleEl.textContent.trim();
    if (creatorEl?.textContent?.trim()) bookAuthor = creatorEl.textContent.trim();
    bookLang = normalizeLangCode(langEl?.textContent);

    // Map manifest item id -> resolved archive path
    const manifestMap = new Map<string, string>();
    const manifestItems = Array.from(opfDoc.querySelectorAll('manifest > item'));
    for (const item of manifestItems) {
      const id = item.getAttribute('id');
      const href = item.getAttribute('href');
      const mediaType = item.getAttribute('media-type') || '';
      if (id && href && (mediaType.includes('html') || href.match(/\.(x?html|htm)$/i))) {
        manifestMap.set(id, resolveEpubPath(opfBaseDir, href));
      }
    }

    // Read spine itemref order
    const spineRefs = Array.from(opfDoc.querySelectorAll('spine > itemref'));
    for (const ref of spineRefs) {
      const idref = ref.getAttribute('idref');
      if (idref && manifestMap.has(idref)) {
        orderedPaths.push(manifestMap.get(idref)!);
      }
    }
  }

  // Fallback if spine was empty: collect all .xhtml / .html files in natural sort order
  if (orderedPaths.length === 0) {
    const htmlKeys = Array.from(archiveFiles.keys())
      .filter((k) => /\.(x?html|htm)$/i.test(k) && !/toc|nav|cover|copyright/i.test(k))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    orderedPaths.push(...htmlKeys);
  }

  const chapters: ParsedChapter[] = [];
  for (const chPath of orderedPaths) {
    const rawHtml = archiveFiles.get(chPath);
    if (!rawHtml) continue;
    const { title: chTitle, bodyText } = extractTextFromHtml(rawHtml);
    const words = bodyText.split(/\s+/).filter(Boolean).length;
    if (words < 20) continue; // skip empty cover/copyright stubs

    chapters.push({
      title: chTitle || `Chapter ${chapters.length + 1}`,
      content: bodyText,
      wordCount: words,
    });
  }

  if (chapters.length === 0) {
    throw new Error('No readable chapters found inside this EPUB archive.');
  }

  const fullText = chapters.map((c) => `${c.title}\n\n${c.content}`).join('\n\n');
  const totalWords = chapters.reduce((acc, c) => acc + c.wordCount, 0);

  return {
    title: bookTitle,
    author: bookAuthor,
    language: bookLang,
    chapters,
    fullText,
    totalWords,
    format: 'epub',
  };
}

/**
 * Parses plain text, Markdown, or HTML file into chapters and metadata
 */
export async function parseEpubOrDocumentFile(file: File): Promise<ParsedManuscript> {
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith('.epub')) {
    return parseEpubFile(file);
  }

  const rawText = await file.text();
  const baseTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');

  if (lowerName.endsWith('.html') || lowerName.endsWith('.xhtml') || lowerName.endsWith('.htm')) {
    const { title, bodyText } = extractTextFromHtml(rawText);
    const words = bodyText.split(/\s+/).filter(Boolean).length;
    return {
      title: title || baseTitle,
      author: 'Imported Document',
      chapters: [
        {
          title: title || 'Full Document',
          content: bodyText,
          wordCount: words,
        },
      ],
      fullText: bodyText,
      totalWords: words,
      format: 'html',
    };
  }

  // Markdown or Plain Text: check for YAML frontmatter & Markdown headings
  let cleanedText = rawText.replace(/\r\n/g, '\n').trim();
  let detectedTitle = baseTitle;
  let detectedAuthor = 'Imported Manuscript';

  const fmMatch = cleanedText.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (fmMatch) {
    const yaml = fmMatch[1];
    cleanedText = fmMatch[2].trim();
    const tMatch = yaml.match(/^title:\s*["']?(.+?)["']?$/m);
    const aMatch = yaml.match(/^author:\s*["']?(.+?)["']?$/m);
    if (tMatch?.[1]) detectedTitle = tMatch[1].trim();
    if (aMatch?.[1]) detectedAuthor = aMatch[1].trim();
  }

  // Split by Markdown # / ## headings or "Chapter / Capítulo / Chapitre / Kapitel" markers
  const sections = cleanedText.split(/\n(?=#{1,2}\s+|(?:Chapter|Capítulo|Chapitre|Kapitel|Capitolo|Bölüm)\s+[IVXLCDM0-9]+)/i);
  const chapters: ParsedChapter[] = [];

  for (const sec of sections) {
    const trimmed = sec.trim();
    if (!trimmed) continue;
    const firstLineEnd = trimmed.indexOf('\n');
    const firstLine = firstLineEnd !== -1 ? trimmed.slice(0, firstLineEnd).replace(/^#{1,3}\s*/, '').trim() : `Section ${chapters.length + 1}`;
    const words = trimmed.split(/\s+/).filter(Boolean).length;
    chapters.push({
      title: firstLine.slice(0, 80) || `Section ${chapters.length + 1}`,
      content: trimmed.replace(/^#{1,3}\s+/, ''),
      wordCount: words,
    });
  }

  const totalWords = cleanedText.split(/\s+/).filter(Boolean).length;
  return {
    title: detectedTitle,
    author: detectedAuthor,
    chapters:
      chapters.length > 0
        ? chapters
        : [{ title: detectedTitle, content: cleanedText, wordCount: totalWords }],
    fullText: cleanedText,
    totalWords,
    format: lowerName.endsWith('.md') || lowerName.endsWith('.markdown') ? 'markdown' : 'txt',
  };
}
