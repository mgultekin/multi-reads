import { WordBreakdown } from '../types/index.ts';

/**
 * High-speed in-memory bilingual lexicon & morphological stemmer for instant (<1ms) word translation.
 * Reduces Gemini API dependency by resolving high-frequency literary vocabulary, function words,
 * and common inflections locally in 0ms.
 */
export interface LexiconEntry {
  lemma: string;
  pos: string;
  morph: string;
  translations: Record<string, string>; // baseLang -> meaning
}

export const INSTANT_LEXICON: Record<string, Record<string, LexiconEntry>> = {
  // SPANISH
  es: {
    en: { lemma: 'en', pos: 'Preposition', morph: 'Locative / temporal preposition', translations: { English: 'in / on / at', Turkish: 'içinde / -de / -da', French: 'dans / en', German: 'in / auf' } },
    un: { lemma: 'un', pos: 'Article', morph: 'Masculine singular indefinite article', translations: { English: 'a / an / one', Turkish: 'bir', French: 'un', German: 'ein' } },
    una: { lemma: 'un', pos: 'Article', morph: 'Feminine singular indefinite article', translations: { English: 'a / an / one', Turkish: 'bir', French: 'une', German: 'eine' } },
    el: { lemma: 'el', pos: 'Article', morph: 'Masculine singular definite article', translations: { English: 'the', Turkish: 'belirli tanımlık (o)', French: 'le', German: 'der' } },
    la: { lemma: 'la', pos: 'Article', morph: 'Feminine singular definite article', translations: { English: 'the', Turkish: 'belirli tanımlık (o)', French: 'la', German: 'die' } },
    los: { lemma: 'el', pos: 'Article', morph: 'Masculine plural definite article', translations: { English: 'the (plural)', Turkish: 'belirli tanımlık (çoğul)', French: 'les', German: 'die' } },
    las: { lemma: 'la', pos: 'Article', morph: 'Feminine plural definite article', translations: { English: 'the (plural)', Turkish: 'belirli tanımlık (çoğul)', French: 'les', German: 'die' } },
    de: { lemma: 'de', pos: 'Preposition', morph: 'Possessive / origin preposition', translations: { English: 'of / from', Turkish: '-in / -den / -dan', French: 'de', German: 'von / aus' } },
    que: { lemma: 'que', pos: 'Conjunction / Pronoun', morph: 'Relative pronoun or subordinating conjunction', translations: { English: 'that / which / who', Turkish: 'ki / olan', French: 'que / qui', German: 'dass / der / die' } },
    no: { lemma: 'no', pos: 'Adverb', morph: 'Negation particle', translations: { English: 'no / not', Turkish: 'hayır / değil', French: 'ne ... pas / non', German: 'nicht / nein' } },
    quiero: { lemma: 'querer', pos: 'Verb', morph: '1st person singular present indicative', translations: { English: 'I want / I wish', Turkish: 'istiyorum / severim', French: 'je veux', German: 'ich will / möchte' } },
    lugar: { lemma: 'lugar', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'place / village / spot', Turkish: 'yer / mekân / köy', French: 'lieu / endroit', German: 'Ort / Platz' } },
    cuyo: { lemma: 'cuyo', pos: 'Relative Adjective', morph: 'Masculine singular possessive relative', translations: { English: 'whose / of which', Turkish: 'ki onun', French: 'dont le', German: 'dessen' } },
    nombre: { lemma: 'nombre', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'name', Turkish: 'isim / ad', French: 'nom', German: 'Name' } },
    acordarme: { lemma: 'acordarse', pos: 'Verb (Reflexive)', morph: 'Infinitive with 1st person enclitic pronoun', translations: { English: 'to remember / recall', Turkish: 'hatırlamak', French: 'me souvenir', German: 'mich erinnern' } },
    tiempo: { lemma: 'tiempo', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'time / season / weather', Turkish: 'zaman / vakit', French: 'temps', German: 'Zeit' } },
    vivía: { lemma: 'vivir', pos: 'Verb', morph: 'Past Imperfect Indicative, 1st/3rd person', translations: { English: 'lived / was living', Turkish: 'yaşıyordu', French: 'vivait', German: 'lebte' } },
    hidalgo: { lemma: 'hidalgo', pos: 'Noun (Masculine)', morph: 'Noble rank / gentleman', translations: { English: 'nobleman / country squire', Turkish: 'asilzade / şövalye', French: 'gentilhomme', German: 'Edelmann' } },
    lanza: { lemma: 'lanza', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'lance / spear', Turkish: 'mızrak', French: 'lance', German: 'Lanze' } },
    astillero: { lemma: 'astillero', pos: 'Noun (Masculine)', morph: 'Weapon rack / shipyard', translations: { English: 'lance-rack', Turkish: 'silah askısı', French: 'râtelier', German: 'Waffenständer' } },
    adarga: { lemma: 'adarga', pos: 'Noun (Feminine)', morph: 'Oval leather shield', translations: { English: 'leather shield / buckler', Turkish: 'deri kalkan', French: 'bouclier en cuir', German: 'Lederrundschild' } },
    antigua: { lemma: 'antiguo', pos: 'Adjective', morph: 'Feminine singular', translations: { English: 'ancient / antique / old', Turkish: 'eski / antik', French: 'ancienne', German: 'alt / antik' } },
    antiguo: { lemma: 'antiguo', pos: 'Adjective', morph: 'Masculine singular', translations: { English: 'ancient / antique / old', Turkish: 'eski / antik', French: 'ancien', German: 'alt / antik' } },
    rocín: { lemma: 'rocín', pos: 'Noun (Masculine)', morph: 'Nag / workhorse', translations: { English: 'hack / workhorse', Turkish: 'yaşlı binek atı', French: 'haridelle', German: 'Gaul / altes Pferd' } },
    flaco: { lemma: 'flaco', pos: 'Adjective', morph: 'Masculine singular', translations: { English: 'skinny / lean', Turkish: 'zayıf / cılız', French: 'maigre', German: 'mager / dünn' } },
    galgo: { lemma: 'galgo', pos: 'Noun (Masculine)', morph: 'Greyhound', translations: { English: 'greyhound / hunting hound', Turkish: 'tazı', French: 'lévrier', German: 'Windhund' } },
    corredor: { lemma: 'corredor', pos: 'Adjective / Noun', morph: 'Runner / swift', translations: { English: 'swift / runner', Turkish: 'koşucu / hızlı', French: 'coureur', German: 'schnell / Läufer' } },
    casa: { lemma: 'casa', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'house / household', Turkish: 'ev / hane', French: 'maison', German: 'Haus' } },
    libro: { lemma: 'libro', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'book', Turkish: 'kitap', French: 'livre', German: 'Buch' } },
    libros: { lemma: 'libro', pos: 'Noun (Masculine)', morph: 'Plural noun', translations: { English: 'books', Turkish: 'kitaplar', French: 'livres', German: 'Bücher' } },
    mundo: { lemma: 'mundo', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'world', Turkish: 'dünya', French: 'monde', German: 'Welt' } },
    vida: { lemma: 'vida', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'life', Turkish: 'hayat / yaşam', French: 'vie', German: 'Leben' } },
    caballería: { lemma: 'caballería', pos: 'Noun (Feminine)', morph: 'Chivalry / knighthood', translations: { English: 'chivalry / knighthood', Turkish: 'şövalyelik', French: 'chevalerie', German: 'Rittertum' } },
    control: { lemma: 'control', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'control / power', Turkish: 'kontrol / denetim', French: 'contrôle', German: 'Kontrolle' } },
    cosa: { lemma: 'cosa', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'thing / matter', Turkish: 'şey / mesele', French: 'chose', German: 'Ding / Sache' } },
    cosas: { lemma: 'cosa', pos: 'Noun (Feminine)', morph: 'Plural noun', translations: { English: 'things / matters', Turkish: 'şeyler', French: 'choses', German: 'Dinge' } },
    libre: { lemma: 'libre', pos: 'Adjective', morph: 'Singular adjective', translations: { English: 'free / unhindered', Turkish: 'özgür / serbest', French: 'libre', German: 'frei' } },
    razón: { lemma: 'razón', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'reason / intellect', Turkish: 'akıl / neden', French: 'raison', German: 'Vernunft / Grund' } },
    verdad: { lemma: 'verdad', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'truth', Turkish: 'gerçek / hakikat', French: 'vérité', German: 'Wahrheit' } },
    noche: { lemma: 'noche', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'night / evening', Turkish: 'gece', French: 'nuit', German: 'Nacht' } },
    día: { lemma: 'día', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'day', Turkish: 'gün', French: 'jour', German: 'Tag' } },
    hombre: { lemma: 'hombre', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'man / human', Turkish: 'insan / adam', French: 'homme', German: 'Mann / Mensch' } },
  },

  // FRENCH
  fr: {
    le: { lemma: 'le', pos: 'Article', morph: 'Masculine singular definite article', translations: { English: 'the', Turkish: 'belirli tanımlık', Spanish: 'el', German: 'der' } },
    la: { lemma: 'la', pos: 'Article', morph: 'Feminine singular definite article', translations: { English: 'the', Turkish: 'belirli tanımlık', Spanish: 'la', German: 'die' } },
    les: { lemma: 'le', pos: 'Article', morph: 'Plural definite article', translations: { English: 'the (plural)', Turkish: 'belirli tanımlık (çoğul)', Spanish: 'los / las', German: 'die' } },
    un: { lemma: 'un', pos: 'Article', morph: 'Masculine indefinite article', translations: { English: 'a / an / one', Turkish: 'bir', Spanish: 'un', German: 'ein' } },
    une: { lemma: 'un', pos: 'Article', morph: 'Feminine indefinite article', translations: { English: 'a / an / one', Turkish: 'bir', Spanish: 'una', German: 'eine' } },
    dans: { lemma: 'dans', pos: 'Preposition', morph: 'Spatial/temporal preposition', translations: { English: 'in / inside / into', Turkish: 'içinde / içine', Spanish: 'en / dentro de', German: 'in' } },
    avec: { lemma: 'avec', pos: 'Preposition', morph: 'Accompaniment preposition', translations: { English: 'with', Turkish: 'ile / birlikte', Spanish: 'con', German: 'mit' } },
    sans: { lemma: 'sans', pos: 'Preposition', morph: 'Exclusion preposition', translations: { English: 'without', Turkish: 'olmadan / -sız', Spanish: 'sin', German: 'ohne' } },
    prince: { lemma: 'prince', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'prince', Turkish: 'prens', Spanish: 'príncipe', German: 'Prinz' } },
    petit: { lemma: 'petit', pos: 'Adjective', morph: 'Masculine singular', translations: { English: 'little / small', Turkish: 'küçük', Spanish: 'pequeño', German: 'klein' } },
    petite: { lemma: 'petit', pos: 'Adjective', morph: 'Feminine singular', translations: { English: 'little / small', Turkish: 'küçük', Spanish: 'pequeña', German: 'kleine' } },
    livre: { lemma: 'livre', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'book', Turkish: 'kitap', Spanish: 'libro', German: 'Buch' } },
    serpent: { lemma: 'serpent', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'snake / serpent', Turkish: 'yılan', Spanish: 'serpiente', German: 'Schlange' } },
    forêt: { lemma: 'forêt', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'forest / woods', Turkish: 'orman', Spanish: 'bosque', German: 'Wald' } },
    chapeau: { lemma: 'chapeau', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'hat', Turkish: 'şapka', Spanish: 'sombrero', German: 'Hut' } },
    homme: { lemma: 'homme', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'man / human being', Turkish: 'insan / adam', Spanish: 'hombre', German: 'Mensch / Mann' } },
    roseau: { lemma: 'roseau', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'reed / cane', Turkish: 'kamış / saz', Spanish: 'caña / junco', German: 'Schilfrohr' } },
    pensant: { lemma: 'penser', pos: 'Verb', morph: 'Present Participle', translations: { English: 'thinking / reflective', Turkish: 'düşünen', Spanish: 'pensante', German: 'denkend' } },
    silence: { lemma: 'silence', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'silence / stillness', Turkish: 'sessizlik', Spanish: 'silencio', German: 'Stille' } },
    monde: { lemma: 'monde', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'world', Turkish: 'dünya', Spanish: 'mundo', German: 'Welt' } },
    désert: { lemma: 'désert', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'desert', Turkish: 'çöl', Spanish: 'desierto', German: 'Wüste' } },
    mouton: { lemma: 'mouton', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'sheep', Turkish: 'koyun', Spanish: 'cordero / oveja', German: 'Schaf' } },
    nature: { lemma: 'nature', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'nature', Turkish: 'doğa', Spanish: 'naturaleza', German: 'Natur' } },
    esprit: { lemma: 'esprit', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'mind / spirit / wit', Turkish: 'ruh / zihin', Spanish: 'espíritu / mente', German: 'Geist' } },
  },

  // GERMAN
  de: {
    der: { lemma: 'der', pos: 'Article', morph: 'Masculine nominative / feminine genitive-dative', translations: { English: 'the', Turkish: 'belirli tanımlık', Spanish: 'el', French: 'le' } },
    die: { lemma: 'die', pos: 'Article', morph: 'Feminine / plural definite article', translations: { English: 'the', Turkish: 'belirli tanımlık', Spanish: 'la / los / las', French: 'la / les' } },
    das: { lemma: 'das', pos: 'Article', morph: 'Neuter definite article', translations: { English: 'the', Turkish: 'belirli tanımlık', Spanish: 'el / lo', French: 'le' } },
    und: { lemma: 'und', pos: 'Conjunction', morph: 'Coordinating conjunction', translations: { English: 'and', Turkish: 've', Spanish: 'y', French: 'et' } },
    nicht: { lemma: 'nicht', pos: 'Adverb', morph: 'Negation particle', translations: { English: 'not', Turkish: 'değil', Spanish: 'no', French: 'ne ... pas' } },
    morgen: { lemma: 'Morgen', pos: 'Noun / Adverb', morph: 'Morning / tomorrow', translations: { English: 'morning', Turkish: 'sabah', Spanish: 'mañana', French: 'matin' } },
    traum: { lemma: 'Traum', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'dream', Turkish: 'rüya / düş', Spanish: 'sueño', French: 'rêve' } },
    träumen: { lemma: 'Traum', pos: 'Noun (Masculine)', morph: 'Plural dative', translations: { English: 'dreams', Turkish: 'rüyalar / düşler', Spanish: 'sueños', French: 'rêves' } },
    bett: { lemma: 'Bett', pos: 'Noun (Neuter)', morph: 'Singular noun', translations: { English: 'bed', Turkish: 'yatak', Spanish: 'cama', French: 'lit' } },
    ungeziefer: { lemma: 'Ungeziefer', pos: 'Noun (Neuter)', morph: 'Singular noun', translations: { English: 'monstrous insect / vermin', Turkish: 'haşere / böcek', Spanish: 'bicho / insecto monstruoso', French: 'vermine / insecte' } },
    rücken: { lemma: 'Rücken', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'back', Turkish: 'sırt', Spanish: 'espalda', French: 'dos' } },
    zimmer: { lemma: 'Zimmer', pos: 'Noun (Neuter)', morph: 'Singular noun', translations: { English: 'room / chamber', Turkish: 'oda', Spanish: 'habitación', French: 'chambre' } },
    heimat: { lemma: 'Heimat', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'homeland / home', Turkish: 'vatan / memleket', Spanish: 'patria / hogar', French: 'patrie' } },
    gebirge: { lemma: 'Gebirge', pos: 'Noun (Neuter)', morph: 'Singular collective noun', translations: { English: 'mountains / mountain range', Turkish: 'dağlar', Spanish: 'montañas', French: 'montagnes' } },
    weisheit: { lemma: 'Weisheit', pos: 'Noun (Feminine)', morph: 'Singular abstract noun', translations: { English: 'wisdom', Turkish: 'bilgelik', Spanish: 'sabiduría', French: 'sagesse' } },
    mensch: { lemma: 'Mensch', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'human being / person', Turkish: 'insan', Spanish: 'ser humano', French: 'être humain' } },
    gedanke: { lemma: 'Gedanke', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'thought / idea', Turkish: 'düşünce / fikir', Spanish: 'pensamiento', French: 'pensée' } },
    welt: { lemma: 'Welt', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'world', Turkish: 'dünya', Spanish: 'mundo', French: 'monde' } },
  },

  // ITALIAN
  it: {
    volta: { lemma: 'volta', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'time / once / turn', Turkish: 'defa / kez', Spanish: 'vez', French: 'fois' } },
    legno: { lemma: 'legno', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'wood / piece of timber', Turkish: 'odun / tahta', Spanish: 'madera', French: 'bois' } },
    re: { lemma: 're', pos: 'Noun (Masculine)', morph: 'Invariable noun', translations: { English: 'king', Turkish: 'kral', Spanish: 'rey', French: 'roi' } },
    ragazzo: { lemma: 'ragazzo', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'boy / child / youth', Turkish: 'çocuk / genç', Spanish: 'chico / niño', French: 'garçon' } },
    ragazzi: { lemma: 'ragazzo', pos: 'Noun (Masculine)', morph: 'Plural noun', translations: { English: 'children / boys', Turkish: 'çocuklar / gençler', Spanish: 'chicos / niños', French: 'enfants' } },
    fuoco: { lemma: 'fuoco', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'fire', Turkish: 'ateş', Spanish: 'fuego', French: 'feu' } },
    bottega: { lemma: 'bottega', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'workshop / shop', Turkish: 'dükkân / atölye', Spanish: 'taller / tienda', French: 'atelier / boutique' } },
    vecchio: { lemma: 'vecchio', pos: 'Adjective / Noun', morph: 'Masculine singular', translations: { English: 'old / elder', Turkish: 'yaşlı / eski', Spanish: 'viejo', French: 'vieux' } },
    falegname: { lemma: 'falegname', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'carpenter', Turkish: 'marangoz', Spanish: 'carpintero', French: 'menuisier' } },
    fortuna: { lemma: 'fortuna', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'fortune / fate', Turkish: 'şans / kader', Spanish: 'fortuna / suerte', French: 'fortune' } },
    principe: { lemma: 'principe', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'prince / ruler', Turkish: 'prens / hükümdar', Spanish: 'príncipe', French: 'prince' } },
    arbitrio: { lemma: 'arbitrio', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'free will / judgement', Turkish: 'özgür irade', Spanish: 'albedrío', French: 'libre arbitre' } },
    vita: { lemma: 'vita', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'life', Turkish: 'hayat / yaşam', Spanish: 'vida', French: 'vie' } },
    mondo: { lemma: 'mondo', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'world', Turkish: 'dünya', Spanish: 'mundo', French: 'monde' } },
  },

  // TURKISH
  tr: {
    bir: { lemma: 'bir', pos: 'Sıfat / Sayı', morph: 'Belgisiz sıfat', translations: { English: 'one / a / an', Spanish: 'un / una / uno', French: 'un / une', German: 'ein / eins' } },
    ve: { lemma: 've', pos: 'Bağlaç', morph: 'Sıralama bağlacı', translations: { English: 'and', Spanish: 'y', French: 'et', German: 'und' } },
    gün: { lemma: 'gün', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'day', Spanish: 'día', French: 'jour', German: 'Tag' } },
    göl: { lemma: 'göl', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'lake', Spanish: 'lago', French: 'lac', German: 'See' } },
    gölün: { lemma: 'göl', pos: 'İsim (Tamlayan)', morph: 'Göl + ün (İlgi hâli)', translations: { English: 'of the lake', Spanish: 'del lago', French: 'du lac', German: 'des Sees' } },
    kenar: { lemma: 'kenar', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'edge / shore / bank', Spanish: 'orilla / borde', French: 'bord / rive', German: 'Ufer / Rand' } },
    kenarına: { lemma: 'kenar', pos: 'İsim (Yönelme)', morph: 'Kenar + ı + na (Yönelme hâli)', translations: { English: 'to the edge / bank of', Spanish: 'a la orilla de', French: 'au bord de', German: 'an das Ufer' } },
    yoğurt: { lemma: 'yoğurt', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'yogurt', Spanish: 'yogur', French: 'yaourt', German: 'Joghurt' } },
    maya: { lemma: 'maya', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'yeast / starter culture', Spanish: 'levadura / fermento', French: 'ferment / levain', German: 'Hefe / Ferment' } },
    hoca: { lemma: 'hoca', pos: 'İsim / Ünvan', morph: 'Yalın isim', translations: { English: 'teacher / master hodja', Spanish: 'maestro', French: 'maître / hodja', German: 'Lehrer / Gelehrter' } },
    komşu: { lemma: 'komşu', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'neighbor', Spanish: 'vecino', French: 'voisin', German: 'Nachbar' } },
    sabah: { lemma: 'sabah', pos: 'Zaman İsmi', morph: 'Yalın isim', translations: { English: 'morning', Spanish: 'mañana', French: 'matin', German: 'Morgen' } },
    semaver: { lemma: 'semaver', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'samovar / tea urn', Spanish: 'samovar', French: 'samovar', German: 'Samowar' } },
    deniz: { lemma: 'deniz', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'sea / ocean', Spanish: 'mar', French: 'mer', German: 'Meer' } },
    insan: { lemma: 'insan', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'human / person', Spanish: 'persona / ser humano', French: 'être humain / personne', German: 'Mensch' } },
    insanları: { lemma: 'insan', pos: 'İsim (Belirtme)', morph: 'İnsan + lar + ı (Çoğul belirtme)', translations: { English: 'the people / humans', Spanish: 'a las personas', French: 'les gens', German: 'die Menschen' } },
    sevmekle: { lemma: 'sevmek', pos: 'Fiil (Vasıta)', morph: 'Sevmek + le (Vasıta hâli)', translations: { English: 'with loving / by loving', Spanish: 'con amar / al amar', French: 'en aimant', German: 'mit Lieben' } },
    hayat: { lemma: 'hayat', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'life', Spanish: 'vida', French: 'vie', German: 'Leben' } },
    dünya: { lemma: 'dünya', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'world / earth', Spanish: 'mundo', French: 'monde', German: 'Welt' } },
  },

  // ENGLISH
  en: {
    woman: { lemma: 'woman', pos: 'Noun', morph: 'Singular noun', translations: { Turkish: 'kadın', Spanish: 'mujer', French: 'femme', German: 'Frau', Italian: 'donna' } },
    eye: { lemma: 'eye', pos: 'Noun', morph: 'Singular noun', translations: { Turkish: 'göz', Spanish: 'ojo', French: 'œil', German: 'Auge', Italian: 'occhio' } },
    eyes: { lemma: 'eye', pos: 'Noun', morph: 'Plural noun', translations: { Turkish: 'gözler', Spanish: 'ojos', French: 'yeux', German: 'Augen', Italian: 'occhi' } },
    mind: { lemma: 'mind', pos: 'Noun', morph: 'Singular noun', translations: { Turkish: 'zihin / akıl', Spanish: 'mente', French: 'esprit', German: 'Geist / Verstand', Italian: 'mente' } },
    machine: { lemma: 'machine', pos: 'Noun', morph: 'Singular noun', translations: { Turkish: 'makine', Spanish: 'máquina', French: 'machine', German: 'Maschine', Italian: 'macchina' } },
    nature: { lemma: 'nature', pos: 'Noun', morph: 'Singular noun', translations: { Turkish: 'doğa / fıtrat', Spanish: 'naturaleza', French: 'nature', German: 'Natur', Italian: 'natura' } },
    wood: { lemma: 'wood', pos: 'Noun', morph: 'Singular noun', translations: { Turkish: 'odun / koru', Spanish: 'madera / bosque', French: 'bois', German: 'Holz / Wald', Italian: 'legno / bosco' } },
    woods: { lemma: 'wood', pos: 'Noun', morph: 'Plural / forest', translations: { Turkish: 'orman / koruluk', Spanish: 'bosques', French: 'bois / forêt', German: 'Wälder', Italian: 'boschi' } },
    life: { lemma: 'life', pos: 'Noun', morph: 'Singular noun', translations: { Turkish: 'hayat / yaşam', Spanish: 'vida', French: 'vie', German: 'Leben', Italian: 'vita' } },
    emotion: { lemma: 'emotion', pos: 'Noun', morph: 'Singular noun', translations: { Turkish: 'duygu / his', Spanish: 'emoción', French: 'émotion', German: 'Gefühl', Italian: 'emozione' } },
    reasoner: { lemma: 'reasoner', pos: 'Noun', morph: 'Agentive noun', translations: { Turkish: 'akıl yürüten / düşünür', Spanish: 'razonador', French: 'raisonneur', German: 'Denker', Italian: 'ragionatore' } },
    world: { lemma: 'world', pos: 'Noun', morph: 'Singular noun', translations: { Turkish: 'dünya', Spanish: 'mundo', French: 'monde', German: 'Welt', Italian: 'mondo' } },
    truth: { lemma: 'truth', pos: 'Noun', morph: 'Singular noun', translations: { Turkish: 'gerçek / hakikat', Spanish: 'verdad', French: 'vérité', German: 'Wahrheit', Italian: 'verità' } },
  },
};

/**
 * Strips common romance elisions (l', d', qu', dell', un') and tests common inflection suffixes
 * to match a surface token against root entries in INSTANT_LEXICON.
 */
function findEntryWithStemming(
  cleanWord: string,
  langDict: Record<string, LexiconEntry>
): { entry: LexiconEntry; inflectedNote?: string } | null {
  if (langDict[cleanWord]) {
    return { entry: langDict[cleanWord] };
  }

  // Strip elided prefix (e.g., l'homme -> homme, d'un -> un, dell'arbitrio -> arbitrio)
  const elisionMatch = cleanWord.match(/^(?:l|d|qu|n|s|c|j|m|t|un|dell|all|nell|sull)['’](.+)$/i);
  const core = elisionMatch ? elisionMatch[1].toLowerCase() : cleanWord;

  if (langDict[core]) {
    return {
      entry: langDict[core],
      inflectedNote: elisionMatch ? `Elided form of "${core}"` : undefined,
    };
  }

  // Try common plural / inflection suffixes (-s, -es, -lar, -ler, -en)
  const candidateStems: { stem: string; note: string }[] = [];
  if (core.endsWith('es') && core.length > 4) {
    candidateStems.push({ stem: core.slice(0, -2), note: 'Plural inflection (-es)' });
  }
  if (core.endsWith('s') && core.length > 3) {
    candidateStems.push({ stem: core.slice(0, -1), note: 'Plural inflection (-s)' });
  }
  if ((core.endsWith('lar') || core.endsWith('ler')) && core.length > 5) {
    candidateStems.push({ stem: core.slice(0, -3), note: 'Plural suffix (-lar/-ler)' });
  }
  if ((core.endsWith('da') || core.endsWith('de') || core.endsWith('ta') || core.endsWith('te')) && core.length > 5) {
    candidateStems.push({ stem: core.slice(0, -2), note: 'Locative case form' });
  }

  for (const { stem, note } of candidateStems) {
    if (langDict[stem]) {
      return { entry: langDict[stem], inflectedNote: note };
    }
  }

  return null;
}

/**
 * Instant local lookup (<1ms) with inflection stemming.
 * Eliminates network & Gemini API calls for covered vocabulary.
 */
export function lookupInstantWord(
  rawWord: string,
  targetLangCode: string,
  baseLangName: string,
  surroundingSentence: string,
  cachedSentenceTranslation?: string
): WordBreakdown | null {
  const clean = rawWord
    .toLowerCase()
    .trim()
    .replace(/^[«"'(—¡¿]+|[»"')!?,.:;—]+$/g, '');
  if (!clean) return null;

  const langDict = INSTANT_LEXICON[targetLangCode];
  if (!langDict) return null;

  const match = findEntryWithStemming(clean, langDict);
  if (!match) return null;

  const { entry, inflectedNote } = match;
  const translation = entry.translations[baseLangName];
  if (!translation) return null;

  return {
    word: rawWord.trim(),
    translation,
    lemma: entry.lemma,
    partOfSpeech: entry.pos,
    morphology: inflectedNote ? `${entry.morph} · ${inflectedNote}` : entry.morph,
    sentenceTranslation: cachedSentenceTranslation || surroundingSentence,
    usageNote: `Resolved instantly via Local Lexicon (${baseLangName}).`,
    contextSentence: surroundingSentence,
    targetLang: targetLangCode,
    latencyMs: 0,
    sourceEngine: 'lexicon',
    isEnriching: false,
  };
}
