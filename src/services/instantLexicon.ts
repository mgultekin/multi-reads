import { WordBreakdown } from '../types/index.ts';

/**
 * High-speed in-memory bilingual lexicon for instant (<5ms) word translation.
 * Covers core literary vocabulary, auxiliary verbs, common nouns, adjectives, and conjunctions.
 */
interface LexiconEntry {
  lemma: string;
  pos: string;
  morph: string;
  translations: Record<string, string>; // baseLang -> meaning
}

export const INSTANT_LEXICON: Record<string, Record<string, LexiconEntry>> = {
  // SPANISH
  es: {
    lugar: { lemma: 'lugar', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'place / spot', Turkish: 'yer / mekân', French: 'lieu / endroit', German: 'Ort / Platz' } },
    nombre: { lemma: 'nombre', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'name', Turkish: 'isim / ad', French: 'nom', German: 'Name' } },
    acordarme: { lemma: 'acordarse', pos: 'Verb (Reflexive)', morph: 'Infinitive with 1st person pronoun', translations: { English: 'to remember / recall', Turkish: 'hatırlamak', French: 'me souvenir', German: 'mich erinnern' } },
    tiempo: { lemma: 'tiempo', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'time / weather', Turkish: 'zaman / vakit', French: 'temps', German: 'Zeit' } },
    vivía: { lemma: 'vivir', pos: 'Verb', morph: 'Past Imperfect Indicative, 1st/3rd person', translations: { English: 'lived / was living', Turkish: 'yaşıyordu', French: 'vivait', German: 'lebte' } },
    hidalgo: { lemma: 'hidalgo', pos: 'Noun (Masculine)', morph: 'Noble rank / gentleman', translations: { English: 'nobleman / squire', Turkish: 'asilzade / şövalye', French: 'gentilhomme', German: 'Edelmann' } },
    lanza: { lemma: 'lanza', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'lance / spear', Turkish: 'mızrak', French: 'lance', German: 'Lanze' } },
    astillero: { lemma: 'astillero', pos: 'Noun', morph: 'Rack / shipyard', translations: { English: 'lance-rack', Turkish: 'silah askısı', French: 'râtelier', German: 'Waffenständer' } },
    adarga: { lemma: 'adarga', pos: 'Noun (Feminine)', morph: 'Leather shield', translations: { English: 'leather shield / buckler', Turkish: 'kalkan', French: 'bouclier en cuir', German: 'Lederrundschild' } },
    antigua: { lemma: 'antiguo', pos: 'Adjective', morph: 'Feminine singular', translations: { English: 'ancient / antique', Turkish: 'eski / antik', French: 'ancienne', German: 'alt / antik' } },
    rocín: { lemma: 'rocín', pos: 'Noun (Masculine)', morph: 'Nag / workhorse', translations: { English: 'hack / workhorse', Turkish: 'yaşlı binek atı', French: 'haridelle', German: 'Gaul / altes Pferd' } },
    flaco: { lemma: 'flaco', pos: 'Adjective', morph: 'Masculine singular', translations: { English: 'skinny / lean', Turkish: 'zayıf / cılız', French: 'maigre', German: 'mager / dünn' } },
    galgo: { lemma: 'galgo', pos: 'Noun (Masculine)', morph: 'Greyhound', translations: { English: 'greyhound / hound', Turkish: 'tazı', French: 'lévrier', German: 'Windhund' } },
    corredor: { lemma: 'corredor', pos: 'Adjective/Noun', morph: 'Runner / swift', translations: { English: 'swift / runner', Turkish: 'koşucu / hızlı', French: 'coureur', German: 'schnell / Läufer' } },
    casa: { lemma: 'casa', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'house / home', Turkish: 'ev', French: 'maison', German: 'Haus' } },
    libros: { lemma: 'libro', pos: 'Noun (Masculine)', morph: 'Plural noun', translations: { English: 'books', Turkish: 'kitaplar', French: 'livres', German: 'Bücher' } },
    mundo: { lemma: 'mundo', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'world', Turkish: 'dünya', French: 'monde', German: 'Welt' } },
    vida: { lemma: 'vida', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'life', Turkish: 'hayat / yaşam', French: 'vie', German: 'Leben' } },
    caballería: { lemma: 'caballería', pos: 'Noun (Feminine)', morph: 'Chivalry / cavalry', translations: { English: 'chivalry / knighthood', Turkish: 'şövalyelik', French: 'chevalerie', German: 'Rittertum' } },
    control: { lemma: 'control', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'control / power', Turkish: 'kontrol / denetim', French: 'contrôle', German: 'Kontrolle' } },
    cosas: { lemma: 'cosa', pos: 'Noun (Feminine)', morph: 'Plural noun', translations: { English: 'things / matters', Turkish: 'şeyler', French: 'choses', German: 'Dinge' } },
    libre: { lemma: 'libre', pos: 'Adjective', morph: 'Free / independent', translations: { English: 'free / unhindered', Turkish: 'özgür / serbest', French: 'libre', German: 'frei' } },
  },

  // FRENCH
  fr: {
    prince: { lemma: 'prince', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'prince', Turkish: 'prens', Spanish: 'príncipe', German: 'Prinz' } },
    petit: { lemma: 'petit', pos: 'Adjective', morph: 'Masculine singular', translations: { English: 'little / small', Turkish: 'küçük', Spanish: 'pequeño', German: 'klein' } },
    livre: { lemma: 'livre', pos: 'Noun (Masculine)', morph: 'Book', translations: { English: 'book', Turkish: 'kitap', Spanish: 'libro', German: 'Buch' } },
    serpent: { lemma: 'serpent', pos: 'Noun (Masculine)', morph: 'Snake', translations: { English: 'snake / serpent', Turkish: 'yılan', Spanish: 'serpiente', German: 'Schlange' } },
    forêt: { lemma: 'forêt', pos: 'Noun (Feminine)', morph: 'Forest', translations: { English: 'forest / woods', Turkish: 'orman', Spanish: 'bosque', German: 'Wald' } },
    chapeau: { lemma: 'chapeau', pos: 'Noun (Masculine)', morph: 'Hat', translations: { English: 'hat', Turkish: 'şapka', Spanish: 'sombrero', German: 'Hut' } },
    homme: { lemma: 'homme', pos: 'Noun (Masculine)', morph: 'Man / human', translations: { English: 'man / human being', Turkish: 'insan / adam', Spanish: 'hombre', German: 'Mensch / Mann' } },
    roseau: { lemma: 'roseau', pos: 'Noun (Masculine)', morph: 'Reed', translations: { English: 'reed / cane', Turkish: 'kamış / saz', Spanish: 'caña / junco', German: 'Schilfrohr' } },
    pensant: { lemma: 'penser', pos: 'Verb', morph: 'Present Participle', translations: { English: 'thinking / reflective', Turkish: 'düşünen', Spanish: 'pensante', German: 'denkend' } },
    silence: { lemma: 'silence', pos: 'Noun (Masculine)', morph: 'Silence', translations: { English: 'silence / stillness', Turkish: 'sessizlik', Spanish: 'silencio', German: 'Stille' } },
    monde: { lemma: 'monde', pos: 'Noun (Masculine)', morph: 'World', translations: { English: 'world', Turkish: 'dünya', Spanish: 'mundo', German: 'Welt' } },
    désert: { lemma: 'désert', pos: 'Noun (Masculine)', morph: 'Desert', translations: { English: 'desert', Turkish: 'çöl', Spanish: 'desierto', German: 'Wüste' } },
    mouton: { lemma: 'mouton', pos: 'Noun (Masculine)', morph: 'Sheep', translations: { English: 'sheep', Turkish: 'koyun', Spanish: 'cordero / oveja', German: 'Schaf' } },
  },

  // GERMAN
  de: {
    morgen: { lemma: 'Morgen', pos: 'Noun/Adverb', morph: 'Morning / tomorrow', translations: { English: 'morning', Turkish: 'sabah', Spanish: 'mañana', French: 'matin' } },
    träumen: { lemma: 'Traum', pos: 'Noun (Masculine)', morph: 'Plural dative', translations: { English: 'dreams', Turkish: 'rüyalar / düşler', Spanish: 'sueños', French: 'rêves' } },
    bett: { lemma: 'Bett', pos: 'Noun (Neuter)', morph: 'Bed', translations: { English: 'bed', Turkish: 'yatak', Spanish: 'cama', French: 'lit' } },
    ungeziefer: { lemma: 'Ungeziefer', pos: 'Noun (Neuter)', morph: 'Vermin / insect', translations: { English: 'monstrous insect / vermin', Turkish: 'haşere / böcek', Spanish: 'bicho / insecto monstruoso', French: 'vermine / insecte' } },
    rücken: { lemma: 'Rücken', pos: 'Noun (Masculine)', morph: 'Back', translations: { English: 'back', Turkish: 'sırt', Spanish: 'espalda', French: 'dos' } },
    zimmer: { lemma: 'Zimmer', pos: 'Noun (Neuter)', morph: 'Room', translations: { English: 'room', Turkish: 'oda', Spanish: 'habitación', French: 'chambre' } },
    heimat: { lemma: 'Heimat', pos: 'Noun (Feminine)', morph: 'Homeland / home', translations: { English: 'homeland / home', Turkish: 'vatan / memleket', Spanish: 'patria / hogar', French: 'patrie' } },
    gebirge: { lemma: 'Gebirge', pos: 'Noun (Neuter)', morph: 'Mountains', translations: { English: 'mountains / mountain range', Turkish: 'dağlar', Spanish: 'montañas', French: 'montagnes' } },
    weisheit: { lemma: 'Weisheit', pos: 'Noun (Feminine)', morph: 'Wisdom', translations: { English: 'wisdom', Turkish: 'bilgelik', Spanish: 'sabiduría', French: 'sagesse' } },
    mensch: { lemma: 'Mensch', pos: 'Noun (Masculine)', morph: 'Human being', translations: { English: 'human being / person', Turkish: 'insan', Spanish: 'ser humano', French: 'être humain' } },
  },

  // ITALIAN
  it: {
    volta: { lemma: 'volta', pos: 'Noun (Feminine)', morph: 'Time / turn', translations: { English: 'time / once', Turkish: 'defa / kez', Spanish: 'vez', French: 'fois' } },
    legno: { lemma: 'legno', pos: 'Noun (Masculine)', morph: 'Wood / timber', translations: { English: 'wood / piece of wood', Turkish: 'odun / tahta', Spanish: 'madera', French: 'bois' } },
    re: { lemma: 're', pos: 'Noun (Masculine)', morph: 'King', translations: { English: 'king', Turkish: 'kral', Spanish: 'rey', French: 'roi' } },
    ragazzi: { lemma: 'ragazzo', pos: 'Noun (Masculine)', morph: 'Children / boys', translations: { English: 'children / boys', Turkish: 'çocuklar / gençler', Spanish: 'chicos / niños', French: 'enfants' } },
    fuoco: { lemma: 'fuoco', pos: 'Noun (Masculine)', morph: 'Fire', translations: { English: 'fire', Turkish: 'ateş', Spanish: 'fuego', French: 'feu' } },
    bottega: { lemma: 'bottega', pos: 'Noun (Feminine)', morph: 'Workshop / shop', translations: { English: 'workshop / shop', Turkish: 'dükkân / atölye', Spanish: 'taller / tienda', French: 'atelier / boutique' } },
    vecchio: { lemma: 'vecchio', pos: 'Adjective/Noun', morph: 'Old / elder', translations: { English: 'old / elder', Turkish: 'yaşlı / eski', Spanish: 'viejo', French: 'vieux' } },
    falegname: { lemma: 'falegname', pos: 'Noun (Masculine)', morph: 'Carpenter', translations: { English: 'carpenter', Turkish: 'marangoz', Spanish: 'carpintero', French: 'menuisier' } },
    fortuna: { lemma: 'fortuna', pos: 'Noun (Feminine)', morph: 'Fortune / luck', translations: { English: 'fortune / fate', Turkish: 'şans / kader', Spanish: 'fortuna / suerte', French: 'fortune' } },
    principe: { lemma: 'principe', pos: 'Noun (Masculine)', morph: 'Prince', translations: { English: 'prince / ruler', Turkish: 'prens / hükümdar', Spanish: 'príncipe', French: 'prince' } },
    arbitrio: { lemma: 'arbitrio', pos: 'Noun (Masculine)', morph: 'Free will', translations: { English: 'free will / judgement', Turkish: 'özgür irade', Spanish: 'albedrío', French: 'libre arbitre' } },
  },

  // TURKISH
  tr: {
    gölün: { lemma: 'göl', pos: 'İsim (Genitif)', morph: 'Göl + in (Genitif tamlayan)', translations: { English: 'of the lake', Spanish: 'del lago', French: 'du lac', German: 'des Sees' } },
    kenarına: { lemma: 'kenar', pos: 'İsim (Yönelme)', morph: 'Kenar + ı + na (Yönelme hali)', translations: { English: 'to the edge / bank of', Spanish: 'a la orilla de', French: 'au bord de', German: 'an das Ufer' } },
    yoğurt: { lemma: 'yoğurt', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'yogurt', Spanish: 'yogur', French: 'yaourt', German: 'Joghurt' } },
    maya: { lemma: 'maya', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'yeast / starter culture', Spanish: 'levadura / fermento', French: 'ferment / levain', German: 'Hefe / Ferment' } },
    hoca: { lemma: 'hoca', pos: 'İsim / Ünvan', morph: 'Master / teacher', translations: { English: 'teacher / master hodja', Spanish: 'maestro / maestro', French: 'maître / hodja', German: 'Lehrer / Gelehrter' } },
    komşu: { lemma: 'komşu', pos: 'İsim', morph: 'Neighbor', translations: { English: 'neighbor', Spanish: 'vecino', French: 'voisin', German: 'Nachbar' } },
    sabah: { lemma: 'sabah', pos: 'Zaman İsmi', morph: 'Morning', translations: { English: 'morning', Spanish: 'mañana', French: 'matin', German: 'Morgen' } },
    semaver: { lemma: 'semaver', pos: 'İsim', morph: 'Samovar / tea maker', translations: { English: 'samovar', Spanish: 'samovar', French: 'samovar', German: 'Samowar' } },
    deniz: { lemma: 'deniz', pos: 'İsim', morph: 'Sea', translations: { English: 'sea / ocean', Spanish: 'mar', French: 'mer', German: 'Meer' } },
    insanları: { lemma: 'insan', pos: 'İsim (Belirtme)', morph: 'İnsan + lar + ı (Çoğul belirtme)', translations: { English: 'the people / humans', Spanish: 'a las personas', French: 'les gens', German: 'die Menschen' } },
    sevmekle: { lemma: 'sevmek', pos: 'Fiil (Vasıta)', morph: 'Sevmek + le (Birliktelik/Vasıta)', translations: { English: 'with loving / by loving', Spanish: 'con amar / al amar', French: 'en aimant', German: 'mit Lieben' } },
  },

  // ENGLISH
  en: {
    woman: { lemma: 'woman', pos: 'Noun', morph: 'Singular noun', translations: { Turkish: 'kadın', Spanish: 'mujer', French: 'femme', German: 'Frau' } },
    eyes: { lemma: 'eye', pos: 'Noun', morph: 'Plural noun', translations: { Turkish: 'gözler', Spanish: 'ojos', French: 'yeux', German: 'Augen' } },
    mind: { lemma: 'mind', pos: 'Noun', morph: 'Singular noun', translations: { Turkish: 'zihin / akıl', Spanish: 'mente', French: 'esprit', German: 'Geist / Verstand' } },
    machine: { lemma: 'machine', pos: 'Noun', morph: 'Singular noun', translations: { Turkish: 'makine', Spanish: 'máquina', French: 'machine', German: 'Maschine' } },
    nature: { lemma: 'nature', pos: 'Noun', morph: 'Singular noun', translations: { Turkish: 'doğa / fıtrat', Spanish: 'naturaleza', French: 'nature', German: 'Natur', Italian: 'natura' } },
    woods: { lemma: 'wood', pos: 'Noun', morph: 'Plural / forest', translations: { Turkish: 'orman / koruluk', Spanish: 'bosques', French: 'bois / forêt', German: 'Wälder', Italian: 'boschi' } },
    life: { lemma: 'life', pos: 'Noun', morph: 'Singular noun', translations: { Turkish: 'hayat / yaşam', Spanish: 'vida', French: 'vie', German: 'Leben', Italian: 'vita' } },
    emotion: { lemma: 'emotion', pos: 'Noun', morph: 'Singular noun', translations: { Turkish: 'duygu / his', Spanish: 'emoción', French: 'émotion', German: 'Gefühl', Italian: 'emozione' } },
    reasoner: { lemma: 'reasoner', pos: 'Noun', morph: 'Agentive noun', translations: { Turkish: 'akıl yürüten / düşünür', Spanish: 'razonador', French: 'raisonneur', German: 'Denker', Italian: 'ragionatore' } },
  },
};

/**
 * Instant local lookup. Returns in <1ms!
 */
export function lookupInstantWord(
  rawWord: string,
  targetLangCode: string,
  baseLangName: string,
  surroundingSentence: string,
  cachedSentenceTranslation?: string
): WordBreakdown | null {
  const clean = rawWord.toLowerCase().trim().replace(/^[«"'(—]+|[»"')!?,.:;—]+$/g, '');
  const langDict = INSTANT_LEXICON[targetLangCode];
  if (!langDict) return null;

  const entry = langDict[clean];
  if (!entry) return null;

  const translation = entry.translations[baseLangName];
  if (!translation) return null; // If user selected a baseLang not in static lexicon, let fast/prefetch cache resolve it accurately

  return {
    word: rawWord.trim(),
    translation,
    lemma: entry.lemma,
    partOfSpeech: entry.pos,
    morphology: entry.morph,
    sentenceTranslation: cachedSentenceTranslation || surroundingSentence,
    usageNote: `Instant lexicon match for "${clean}" in ${baseLangName}.`,
    contextSentence: surroundingSentence,
    targetLang: targetLangCode,
    latencyMs: 0,
    sourceEngine: 'lexicon',
    isEnriching: !cachedSentenceTranslation,
  };
}

