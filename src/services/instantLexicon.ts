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
    alma: { lemma: 'alma', pos: 'Noun (Feminine)', morph: 'Singular noun (takes "el" in sing.)', translations: { English: 'soul / spirit', Turkish: 'ruh / can', French: 'âme', German: 'Seele' } },
    muerte: { lemma: 'muerte', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'death', Turkish: 'ölüm', French: 'mort', German: 'Tod' } },
    amor: { lemma: 'amor', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'love', Turkish: 'aşk / sevgi', French: 'amour', German: 'Liebe' } },
    corazón: { lemma: 'corazón', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'heart', Turkish: 'kalp / yürek', French: 'cœur', German: 'Herz' } },
    sombra: { lemma: 'sombra', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'shadow / shade', Turkish: 'gölge', French: 'ombre', German: 'Schatten' } },
    luz: { lemma: 'luz', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'light', Turkish: 'ışık', French: 'lumière', German: 'Licht' } },
    cielo: { lemma: 'cielo', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'sky / heaven', Turkish: 'gök / cennet', French: 'ciel', German: 'Himmel' } },
    tierra: { lemma: 'tierra', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'earth / land / soil', Turkish: 'toprak / yer / yeryüzü', French: 'terre', German: 'Erde' } },
    viento: { lemma: 'viento', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'wind', Turkish: 'rüzgâr', French: 'vent', German: 'Wind' } },
    fuego: { lemma: 'fuego', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'fire', Turkish: 'ateş', French: 'feu', German: 'Feuer' } },
    agua: { lemma: 'agua', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'water', Turkish: 'su', French: 'eau', German: 'Wasser' } },
    mar: { lemma: 'mar', pos: 'Noun (Ambiguous)', morph: 'Singular noun', translations: { English: 'sea / ocean', Turkish: 'deniz', French: 'mer', German: 'Meer' } },
    camino: { lemma: 'camino', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'path / road / way', Turkish: 'yol', French: 'chemin', German: 'Weg' } },
    destino: { lemma: 'destino', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'destiny / fate / destination', Turkish: 'kader / hedef', French: 'destin', German: 'Schicksal' } },
    fuerza: { lemma: 'fuerza', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'force / strength', Turkish: 'güç / kuvvet', French: 'force', German: 'Kraft / Stärke' } },
    pensamiento: { lemma: 'pensamiento', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'thought / thinking', Turkish: 'düşünce / fikir', French: 'pensée', German: 'Gedanke' } },
    palabra: { lemma: 'palabra', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'word / speech', Turkish: 'kelime / söz', French: 'mot / parole', German: 'Wort' } },
    voz: { lemma: 'voz', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'voice', Turkish: 'ses', French: 'voix', German: 'Stimme' } },
    silencio: { lemma: 'silencio', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'silence / quiet', Turkish: 'sessizlik / sükût', French: 'silence', German: 'Stille / Schweigen' } },
    mirada: { lemma: 'mirada', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'gaze / look / glance', Turkish: 'bakış', French: 'regard', German: 'Blick' } },
    dolor: { lemma: 'dolor', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'pain / sorrow / grief', Turkish: 'acı / keder', French: 'douleur', German: 'Schmerz' } },
    esperanza: { lemma: 'esperanza', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'hope', Turkish: 'umut', French: 'espoir', German: 'Hoffnung' } },
    miedo: { lemma: 'miedo', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'fear / dread', Turkish: 'korku', French: 'peur', German: 'Angst' } },
    sueño: { lemma: 'sueño', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'dream / sleep', Turkish: 'rüya / uyku', French: 'rêve / sommeil', German: 'Traum / Schlaf' } },
    memoria: { lemma: 'memoria', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'memory / remembrance', Turkish: 'hafıza / anı', French: 'mémoire', German: 'Gedächtnis / Erinnerung' } },
    belleza: { lemma: 'belleza', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'beauty', Turkish: 'güzellik', French: 'beauté', German: 'Schönheit' } },
    justicia: { lemma: 'justicia', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'justice / fairness', Turkish: 'adalet', French: 'justice', German: 'Gerechtigkeit' } },
    virtud: { lemma: 'virtud', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'virtue', Turkish: 'erdem', French: 'vertu', German: 'Tugend' } },
    honor: { lemma: 'honor', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'honor', Turkish: 'onur / şeref', French: 'honneur', German: 'Ehre' } },
    saber: { lemma: 'saber', pos: 'Verb', morph: 'Infinitive / Noun', translations: { English: 'to know / knowledge', Turkish: 'bilmek / bilgi', French: 'savoir', German: 'wissen' } },
    entender: { lemma: 'entender', pos: 'Verb', morph: 'Infinitive', translations: { English: 'to understand / comprehend', Turkish: 'anlamak', French: 'comprendre', German: 'verstehen' } },
    sentir: { lemma: 'sentir', pos: 'Verb', morph: 'Infinitive', translations: { English: 'to feel / perceive / regret', Turkish: 'hissetmek / duymak', French: 'sentir', German: 'fühlen' } },
    buscar: { lemma: 'buscar', pos: 'Verb', morph: 'Infinitive', translations: { English: 'to search / seek', Turkish: 'aramak', French: 'chercher', German: 'suchen' } },
    encontrar: { lemma: 'encontrar', pos: 'Verb', morph: 'Infinitive', translations: { English: 'to find / discover', Turkish: 'bulmak', French: 'trouver', German: 'finden' } },
    hablar: { lemma: 'hablar', pos: 'Verb', morph: 'Infinitive', translations: { English: 'to speak / talk', Turkish: 'konuşmak', French: 'parler', German: 'sprechen' } },
    escribir: { lemma: 'escribir', pos: 'Verb', morph: 'Infinitive', translations: { English: 'to write', Turkish: 'yazmak', French: 'écrire', German: 'schreiben' } },
    caminar: { lemma: 'caminar', pos: 'Verb', morph: 'Infinitive', translations: { English: 'to walk', Turkish: 'yürümek', French: 'marcher', German: 'gehen / wandern' } },
    mirar: { lemma: 'mirar', pos: 'Verb', morph: 'Infinitive', translations: { English: 'to look at / gaze', Turkish: 'bakmak', French: 'regarder', German: 'schauen / ansehen' } },
    pensar: { lemma: 'pensar', pos: 'Verb', morph: 'Infinitive', translations: { English: 'to think', Turkish: 'düşünmek', French: 'penser', German: 'denken' } },
    callar: { lemma: 'callar', pos: 'Verb', morph: 'Infinitive', translations: { English: 'to be silent / keep quiet', Turkish: 'susmak', French: 'se taire', German: 'schweigen' } },
    grande: { lemma: 'grande', pos: 'Adjective', morph: 'Singular adjective', translations: { English: 'great / big / large', Turkish: 'büyük', French: 'grand', German: 'groß' } },
    pequeño: { lemma: 'pequeño', pos: 'Adjective', morph: 'Masculine singular', translations: { English: 'small / little', Turkish: 'küçük', French: 'petit', German: 'klein' } },
    nuevo: { lemma: 'nuevo', pos: 'Adjective', morph: 'Masculine singular', translations: { English: 'new', Turkish: 'yeni', French: 'nouveau', German: 'neu' } },
    hermoso: { lemma: 'hermoso', pos: 'Adjective', morph: 'Masculine singular', translations: { English: 'beautiful / lovely', Turkish: 'güzel', French: 'beau', German: 'schön' } },
    oscuro: { lemma: 'oscuro', pos: 'Adjective', morph: 'Masculine singular', translations: { English: 'dark / obscure', Turkish: 'karanlık / koyu', French: 'sombre', German: 'dunkel' } },
    claro: { lemma: 'claro', pos: 'Adjective', morph: 'Masculine singular', translations: { English: 'clear / bright / evident', Turkish: 'açık / aydınlık', French: 'clair', German: 'hell / klar' } },
    profundo: { lemma: 'profundo', pos: 'Adjective', morph: 'Masculine singular', translations: { English: 'deep / profound', Turkish: 'derin', French: 'profond', German: 'tief' } },
    eterno: { lemma: 'eterno', pos: 'Adjective', morph: 'Masculine singular', translations: { English: 'eternal / everlasting', Turkish: 'sonsuz / ebedi', French: 'éternel', German: 'ewig' } },
    solo: { lemma: 'solo', pos: 'Adjective', morph: 'Masculine singular', translations: { English: 'alone / solitary', Turkish: 'yalnız / tek', French: 'seul', German: 'allein' } },
    dulce: { lemma: 'dulce', pos: 'Adjective', morph: 'Singular adjective', translations: { English: 'sweet / gentle', Turkish: 'tatlı', French: 'doux', German: 'süß / sanft' } },
    siempre: { lemma: 'siempre', pos: 'Adverb', morph: 'Temporal adverb', translations: { English: 'always / ever', Turkish: 'her zaman / daima', French: 'toujours', German: 'immer' } },
    nunca: { lemma: 'nunca', pos: 'Adverb', morph: 'Temporal adverb', translations: { English: 'never', Turkish: 'asla / hiç', French: 'jamais', German: 'nie / niemals' } },
    pero: { lemma: 'pero', pos: 'Conjunction', morph: 'Adversative conjunction', translations: { English: 'but / yet', Turkish: 'ama / fakat', French: 'mais', German: 'aber' } },
    porque: { lemma: 'porque', pos: 'Conjunction', morph: 'Causal conjunction', translations: { English: 'because', Turkish: 'çünkü', French: 'parce que', German: 'weil' } },
    aunque: { lemma: 'aunque', pos: 'Conjunction', morph: 'Concessive conjunction', translations: { English: 'although / even though', Turkish: 'rağmen / -sa bile', French: 'bien que', German: 'obwohl' } },
    entre: { lemma: 'entre', pos: 'Preposition', morph: 'Spatial preposition', translations: { English: 'between / among', Turkish: 'arasında', French: 'entre', German: 'zwischen' } },
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
    âme: { lemma: 'âme', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'soul / spirit', Turkish: 'ruh / can', Spanish: 'alma', German: 'Seele' } },
    coeur: { lemma: 'cœur', pos: 'Noun (Masculine)', morph: 'Singular noun (spelled coeur)', translations: { English: 'heart', Turkish: 'kalp / yürek', Spanish: 'corazón', German: 'Herz' } },
    vie: { lemma: 'vie', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'life', Turkish: 'hayat / yaşam', Spanish: 'vida', German: 'Leben' } },
    mort: { lemma: 'mort', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'death', Turkish: 'ölüm', Spanish: 'muerte', German: 'Tod' } },
    amour: { lemma: 'amour', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'love', Turkish: 'aşk / sevgi', Spanish: 'amor', German: 'Liebe' } },
    temps: { lemma: 'temps', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'time / weather', Turkish: 'zaman / vakit / hava', Spanish: 'tiempo', German: 'Zeit' } },
    nuit: { lemma: 'nuit', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'night', Turkish: 'gece', Spanish: 'noche', German: 'Nacht' } },
    jour: { lemma: 'jour', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'day', Turkish: 'gün', Spanish: 'día', German: 'Tag' } },
    lumière: { lemma: 'lumière', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'light', Turkish: 'ışık', Spanish: 'luz', German: 'Licht' } },
    ombre: { lemma: 'ombre', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'shadow / shade', Turkish: 'gölge', Spanish: 'sombra', German: 'Schatten' } },
    ciel: { lemma: 'ciel', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'sky / heaven', Turkish: 'gök / cennet', Spanish: 'cielo', German: 'Himmel' } },
    terre: { lemma: 'terre', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'earth / ground / land', Turkish: 'toprak / yer / dünya', Spanish: 'tierra', German: 'Erde' } },
    mer: { lemma: 'mer', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'sea / ocean', Turkish: 'deniz', Spanish: 'mar', German: 'Meer' } },
    vent: { lemma: 'vent', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'wind', Turkish: 'rüzgâr', Spanish: 'viento', German: 'Wind' } },
    feu: { lemma: 'feu', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'fire', Turkish: 'ateş', Spanish: 'fuego', German: 'Feuer' } },
    eau: { lemma: 'eau', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'water', Turkish: 'su', Spanish: 'agua', German: 'Wasser' } },
    chemin: { lemma: 'chemin', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'path / road / way', Turkish: 'yol', Spanish: 'camino', German: 'Weg' } },
    destin: { lemma: 'destin', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'destiny / fate', Turkish: 'kader', Spanish: 'destino', German: 'Schicksal' } },
    parole: { lemma: 'parole', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'word / speech', Turkish: 'söz / kelime', Spanish: 'palabra', German: 'Wort' } },
    voix: { lemma: 'voix', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'voice', Turkish: 'ses', Spanish: 'voz', German: 'Stimme' } },
    regard: { lemma: 'regard', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'look / gaze / glance', Turkish: 'bakış', Spanish: 'mirada', German: 'Blick' } },
    pensée: { lemma: 'pensée', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'thought', Turkish: 'düşünce / fikir', Spanish: 'pensamiento', German: 'Gedanke' } },
    douleur: { lemma: 'douleur', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'pain / grief', Turkish: 'acı / keder', Spanish: 'dolor', German: 'Schmerz' } },
    espoir: { lemma: 'espoir', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'hope', Turkish: 'umut', Spanish: 'esperanza', German: 'Hoffnung' } },
    peur: { lemma: 'peur', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'fear / dread', Turkish: 'korku', Spanish: 'miedo', German: 'Angst' } },
    rêve: { lemma: 'rêve', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'dream', Turkish: 'rüya / düş', Spanish: 'sueño', German: 'Traum' } },
    vérité: { lemma: 'vérité', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'truth', Turkish: 'gerçek / hakikat', Spanish: 'verdad', German: 'Wahrheit' } },
    raison: { lemma: 'raison', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'reason / sense', Turkish: 'akıl / mantık / neden', Spanish: 'razón', German: 'Vernunft' } },
    beauté: { lemma: 'beauté', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'beauty', Turkish: 'güzellik', Spanish: 'belleza', German: 'Schönheit' } },
    vertu: { lemma: 'vertu', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'virtue', Turkish: 'erdem', Spanish: 'virtud', German: 'Tugend' } },
    savoir: { lemma: 'savoir', pos: 'Verb', morph: 'Infinitive / Noun', translations: { English: 'to know / knowledge', Turkish: 'bilmek / bilgi', Spanish: 'saber', German: 'wissen' } },
    aimer: { lemma: 'aimer', pos: 'Verb', morph: 'Infinitive', translations: { English: 'to love / like', Turkish: 'sevmek', Spanish: 'amar', German: 'lieben' } },
    chercher: { lemma: 'chercher', pos: 'Verb', morph: 'Infinitive', translations: { English: 'to seek / search', Turkish: 'aramak', Spanish: 'buscar', German: 'suchen' } },
    trouver: { lemma: 'trouver', pos: 'Verb', morph: 'Infinitive', translations: { English: 'to find / discover', Turkish: 'bulmak', Spanish: 'encontrar', German: 'finden' } },
    comprendre: { lemma: 'comprendre', pos: 'Verb', morph: 'Infinitive', translations: { English: 'to understand / grasp', Turkish: 'anlamak', Spanish: 'comprender', German: 'verstehen' } },
    parler: { lemma: 'parler', pos: 'Verb', morph: 'Infinitive', translations: { English: 'to speak / talk', Turkish: 'konuşmak', Spanish: 'hablar', German: 'sprechen' } },
    voir: { lemma: 'voir', pos: 'Verb', morph: 'Infinitive', translations: { English: 'to see', Turkish: 'görmek', Spanish: 'ver', German: 'sehen' } },
    croire: { lemma: 'croire', pos: 'Verb', morph: 'Infinitive', translations: { English: 'to believe', Turkish: 'inanmak', Spanish: 'creer', German: 'glauben' } },
    marcher: { lemma: 'marcher', pos: 'Verb', morph: 'Infinitive', translations: { English: 'to walk / march', Turkish: 'yürümek', Spanish: 'caminar', German: 'gehen / marschieren' } },
    mourir: { lemma: 'mourir', pos: 'Verb', morph: 'Infinitive', translations: { English: 'to die', Turkish: 'ölmek', Spanish: 'morir', German: 'sterben' } },
    vivre: { lemma: 'vivre', pos: 'Verb', morph: 'Infinitive', translations: { English: 'to live', Turkish: 'yaşamak', Spanish: 'vivir', German: 'leben' } },
    grand: { lemma: 'grand', pos: 'Adjective', morph: 'Masculine singular', translations: { English: 'great / big / tall', Turkish: 'büyük', Spanish: 'grande', German: 'groß' } },
    beau: { lemma: 'beau', pos: 'Adjective', morph: 'Masculine singular', translations: { English: 'beautiful / handsome', Turkish: 'güzel', Spanish: 'hermoso / bello', German: 'schön' } },
    vieux: { lemma: 'vieux', pos: 'Adjective', morph: 'Masculine singular', translations: { English: 'old / elderly', Turkish: 'yaşlı / eski', Spanish: 'viejo', German: 'alt' } },
    jeune: { lemma: 'jeune', pos: 'Adjective', morph: 'Singular adjective', translations: { English: 'young', Turkish: 'genç', Spanish: 'joven', German: 'jung' } },
    sombre: { lemma: 'sombre', pos: 'Adjective', morph: 'Singular adjective', translations: { English: 'dark / gloomy', Turkish: 'karanlık / kasvetli', Spanish: 'oscuro / sombrío', German: 'dunkel / düster' } },
    clair: { lemma: 'clair', pos: 'Adjective', morph: 'Masculine singular', translations: { English: 'clear / bright / light', Turkish: 'açık / berrak / aydınlık', Spanish: 'claro', German: 'klar / hell' } },
    profond: { lemma: 'profond', pos: 'Adjective', morph: 'Masculine singular', translations: { English: 'deep / profound', Turkish: 'derin', Spanish: 'profundo', German: 'tief' } },
    éternel: { lemma: 'éternel', pos: 'Adjective', morph: 'Masculine singular', translations: { English: 'eternal / everlasting', Turkish: 'sonsuz / ebedi', Spanish: 'eterno', German: 'ewig' } },
    seul: { lemma: 'seul', pos: 'Adjective', morph: 'Masculine singular', translations: { English: 'alone / only / solitary', Turkish: 'yalnız / tek', Spanish: 'solo', German: 'allein' } },
    doux: { lemma: 'doux', pos: 'Adjective', morph: 'Masculine singular', translations: { English: 'sweet / soft / gentle', Turkish: 'tatlı / yumuşak', Spanish: 'dulce / suave', German: 'sanft / süß' } },
    toujours: { lemma: 'toujours', pos: 'Adverb', morph: 'Temporal adverb', translations: { English: 'always / still', Turkish: 'her zaman / daima', Spanish: 'siempre', German: 'immer' } },
    jamais: { lemma: 'jamais', pos: 'Adverb', morph: 'Negative/temporal adverb', translations: { English: 'never / ever', Turkish: 'asla / hiç', Spanish: 'jamás / nunca', German: 'nie / niemals' } },
    mais: { lemma: 'mais', pos: 'Conjunction', morph: 'Coordinating conjunction', translations: { English: 'but / yet', Turkish: 'ama / fakat', Spanish: 'pero', German: 'aber' } },
    pourquoi: { lemma: 'pourquoi', pos: 'Adverb / Conjunction', morph: 'Interrogative adverb', translations: { English: 'why / wherefore', Turkish: 'neden / niçin', Spanish: 'por qué', German: 'warum' } },
    comme: { lemma: 'comme', pos: 'Conjunction / Preposition', morph: 'Comparative conjunction', translations: { English: 'as / like / since', Turkish: 'gibi / olarak', Spanish: 'como', German: 'wie / als' } },
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
    seele: { lemma: 'Seele', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'soul / spirit', Turkish: 'ruh / can', Spanish: 'alma', French: 'âme' } },
    herz: { lemma: 'Herz', pos: 'Noun (Neuter)', morph: 'Singular noun', translations: { English: 'heart', Turkish: 'kalp / yürek', Spanish: 'corazón', French: 'cœur' } },
    leben: { lemma: 'Leben', pos: 'Noun / Verb', morph: 'Neuter noun / infinitive', translations: { English: 'life / to live', Turkish: 'hayat / yaşamak', Spanish: 'vida / vivir', French: 'vie / vivre' } },
    tod: { lemma: 'Tod', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'death', Turkish: 'ölüm', Spanish: 'muerte', French: 'mort' } },
    liebe: { lemma: 'Liebe', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'love / affection', Turkish: 'sevgi / aşk', Spanish: 'amor', French: 'amour' } },
    zeit: { lemma: 'Zeit', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'time / era', Turkish: 'zaman / vakit', Spanish: 'tiempo', French: 'temps' } },
    nacht: { lemma: 'Nacht', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'night', Turkish: 'gece', Spanish: 'noche', French: 'nuit' } },
    tag: { lemma: 'Tag', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'day', Turkish: 'gün', Spanish: 'día', French: 'jour' } },
    licht: { lemma: 'Licht', pos: 'Noun (Neuter)', morph: 'Singular noun', translations: { English: 'light', Turkish: 'ışık', Spanish: 'luz', French: 'lumière' } },
    schatten: { lemma: 'Schatten', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'shadow / shade', Turkish: 'gölge', Spanish: 'sombra', French: 'ombre' } },
    himmel: { lemma: 'Himmel', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'sky / heaven', Turkish: 'gök / cennet', Spanish: 'cielo', French: 'ciel' } },
    erde: { lemma: 'Erde', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'earth / soil / ground', Turkish: 'toprak / yer / yeryüzü', Spanish: 'tierra', French: 'terre' } },
    meer: { lemma: 'Meer', pos: 'Noun (Neuter)', morph: 'Singular noun', translations: { English: 'sea / ocean', Turkish: 'deniz', Spanish: 'mar', French: 'mer' } },
    wind: { lemma: 'Wind', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'wind / breeze', Turkish: 'rüzgâr', Spanish: 'viento', French: 'vent' } },
    feuer: { lemma: 'Feuer', pos: 'Noun (Neuter)', morph: 'Singular noun', translations: { English: 'fire', Turkish: 'ateş', Spanish: 'fuego', French: 'feu' } },
    wasser: { lemma: 'Wasser', pos: 'Noun (Neuter)', morph: 'Singular noun', translations: { English: 'water', Turkish: 'su', Spanish: 'agua', French: 'eau' } },
    weg: { lemma: 'Weg', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'way / path / road', Turkish: 'yol', Spanish: 'camino', French: 'chemin' } },
    schicksal: { lemma: 'Schicksal', pos: 'Noun (Neuter)', morph: 'Singular noun', translations: { English: 'fate / destiny', Turkish: 'kader / alınyazısı', Spanish: 'destino', French: 'destin' } },
    wort: { lemma: 'Wort', pos: 'Noun (Neuter)', morph: 'Singular noun', translations: { English: 'word', Turkish: 'kelime / söz', Spanish: 'palabra', French: 'mot' } },
    stimme: { lemma: 'Stimme', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'voice / vote', Turkish: 'ses / oy', Spanish: 'voz', French: 'voix' } },
    blick: { lemma: 'Blick', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'glance / look / view', Turkish: 'bakış / manzara', Spanish: 'mirada', French: 'regard' } },
    auge: { lemma: 'Auge', pos: 'Noun (Neuter)', morph: 'Singular noun', translations: { English: 'eye', Turkish: 'göz', Spanish: 'ojo', French: 'œil' } },
    stille: { lemma: 'Stille', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'silence / stillness', Turkish: 'sessizlik / sükûnet', Spanish: 'silencio', French: 'silence' } },
    schmerz: { lemma: 'Schmerz', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'pain / sorrow', Turkish: 'acı / keder / ağrı', Spanish: 'dolor', French: 'douleur' } },
    hoffnung: { lemma: 'Hoffnung', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'hope', Turkish: 'umut', Spanish: 'esperanza', French: 'espoir' } },
    angst: { lemma: 'Angst', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'fear / anxiety', Turkish: 'korku / kaygı', Spanish: 'miedo', French: 'peur' } },
    wahrheit: { lemma: 'Wahrheit', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'truth', Turkish: 'hakikat / gerçek', Spanish: 'verdad', French: 'vérité' } },
    vernunft: { lemma: 'Vernunft', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'reason / rationality', Turkish: 'akıl / mantık', Spanish: 'razón', French: 'raison' } },
    schönheit: { lemma: 'Schönheit', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'beauty', Turkish: 'güzellik', Spanish: 'belleza', French: 'beauté' } },
    tugend: { lemma: 'Tugend', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'virtue', Turkish: 'erdem', Spanish: 'virtud', French: 'vertu' } },
    freiheit: { lemma: 'Freiheit', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'freedom / liberty', Turkish: 'özgürlük', Spanish: 'libertad', French: 'liberté' } },
    natur: { lemma: 'Natur', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'nature', Turkish: 'doğa', Spanish: 'naturaleza', French: 'nature' } },
    geist: { lemma: 'Geist', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'spirit / mind / ghost', Turkish: 'ruh / zihin', Spanish: 'espíritu / mente', French: 'esprit' } },
    buch: { lemma: 'Buch', pos: 'Noun (Neuter)', morph: 'Singular noun', translations: { English: 'book', Turkish: 'kitap', Spanish: 'libro', French: 'livre' } },
    wissen: { lemma: 'Wissen', pos: 'Noun / Verb', morph: 'Infinitive / neuter noun', translations: { English: 'knowledge / to know', Turkish: 'bilgi / bilmek', Spanish: 'conocimiento / saber', French: 'savoir / connaissance' } },
    verstehen: { lemma: 'verstehen', pos: 'Verb', morph: 'Infinitive', translations: { English: 'to understand / comprehend', Turkish: 'anlamak', Spanish: 'comprender / entender', French: 'comprendre' } },
    suchen: { lemma: 'suchen', pos: 'Verb', morph: 'Infinitive', translations: { English: 'to seek / search', Turkish: 'aramak', Spanish: 'buscar', French: 'chercher' } },
    finden: { lemma: 'finden', pos: 'Verb', morph: 'Infinitive', translations: { English: 'to find / discover', Turkish: 'bulmak', Spanish: 'encontrar', French: 'trouver' } },
    sprechen: { lemma: 'sprechen', pos: 'Verb', morph: 'Infinitive', translations: { English: 'to speak / talk', Turkish: 'konuşmak', Spanish: 'hablar', French: 'parler' } },
    sehen: { lemma: 'sehen', pos: 'Verb', morph: 'Infinitive', translations: { English: 'to see / look', Turkish: 'görmek', Spanish: 'ver', French: 'voir' } },
    glauben: { lemma: 'glauben', pos: 'Verb', morph: 'Infinitive', translations: { English: 'to believe / think', Turkish: 'inanmak / sanmak', Spanish: 'creer', French: 'croire' } },
    denken: { lemma: 'denken', pos: 'Verb', morph: 'Infinitive', translations: { English: 'to think', Turkish: 'düşünmek', Spanish: 'pensar', French: 'penser' } },
    groß: { lemma: 'groß', pos: 'Adjective', morph: 'Adjective / adverb', translations: { English: 'great / big / tall', Turkish: 'büyük', Spanish: 'grande', French: 'grand' } },
    klein: { lemma: 'klein', pos: 'Adjective', morph: 'Adjective / adverb', translations: { English: 'small / little', Turkish: 'küçük', Spanish: 'pequeño', French: 'petit' } },
    alt: { lemma: 'alt', pos: 'Adjective', morph: 'Adjective / adverb', translations: { English: 'old / ancient', Turkish: 'yaşlı / eski', Spanish: 'viejo', French: 'vieux' } },
    jung: { lemma: 'jung', pos: 'Adjective', morph: 'Adjective / adverb', translations: { English: 'young', Turkish: 'genç', Spanish: 'joven', French: 'jeune' } },
    dunkel: { lemma: 'dunkel', pos: 'Adjective', morph: 'Adjective / adverb', translations: { English: 'dark / gloomy', Turkish: 'karanlık / koyu', Spanish: 'oscuro', French: 'sombre' } },
    tief: { lemma: 'tief', pos: 'Adjective', morph: 'Adjective / adverb', translations: { English: 'deep / profound', Turkish: 'derin', Spanish: 'profundo', French: 'profond' } },
    ewig: { lemma: 'ewig', pos: 'Adjective', morph: 'Adjective / adverb', translations: { English: 'eternal / perpetual', Turkish: 'sonsuz / ebedi', Spanish: 'eterno', French: 'éternel' } },
    allein: { lemma: 'allein', pos: 'Adjective / Adverb', morph: 'Solitary / alone', translations: { English: 'alone / solitary', Turkish: 'yalnız', Spanish: 'solo', French: 'seul' } },
    immer: { lemma: 'immer', pos: 'Adverb', morph: 'Temporal adverb', translations: { English: 'always / constantly', Turkish: 'her zaman / daima', Spanish: 'siempre', French: 'toujours' } },
    nie: { lemma: 'nie', pos: 'Adverb', morph: 'Temporal adverb', translations: { English: 'never', Turkish: 'asla / hiç', Spanish: 'nunca / jamás', French: 'jamais' } },
    aber: { lemma: 'aber', pos: 'Conjunction', morph: 'Adversative conjunction', translations: { English: 'but / however', Turkish: 'ama / fakat', Spanish: 'pero', French: 'mais' } },
    weil: { lemma: 'weil', pos: 'Conjunction', morph: 'Subordinating causal conjunction', translations: { English: 'because / since', Turkish: 'çünkü / için', Spanish: 'porque', French: 'parce que' } },
    wenn: { lemma: 'wenn', pos: 'Conjunction', morph: 'Conditional / temporal conjunction', translations: { English: 'if / when', Turkish: 'eğer / -sa / zaman', Spanish: 'si / cuando', French: 'si / quand' } },
    zwischen: { lemma: 'zwischen', pos: 'Preposition', morph: 'Two-way preposition (Dative/Accusative)', translations: { English: 'between / among', Turkish: 'arasında', Spanish: 'entre', French: 'entre' } },
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
    anima: { lemma: 'anima', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'soul / spirit', Turkish: 'ruh / can', Spanish: 'alma', French: 'âme', German: 'Seele' } },
    cuore: { lemma: 'cuore', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'heart', Turkish: 'kalp / yürek', Spanish: 'corazón', French: 'cœur', German: 'Herz' } },
    morte: { lemma: 'morte', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'death', Turkish: 'ölüm', Spanish: 'muerte', French: 'mort', German: 'Tod' } },
    amore: { lemma: 'amore', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'love', Turkish: 'aşk / sevgi', Spanish: 'amor', French: 'amour', German: 'Liebe' } },
    tempo: { lemma: 'tempo', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'time / weather', Turkish: 'zaman / hava', Spanish: 'tiempo', French: 'temps', German: 'Zeit' } },
    notte: { lemma: 'notte', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'night', Turkish: 'gece', Spanish: 'noche', French: 'nuit', German: 'Nacht' } },
    giorno: { lemma: 'giorno', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'day', Turkish: 'gün', Spanish: 'día', French: 'jour', German: 'Tag' } },
    luce: { lemma: 'luce', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'light', Turkish: 'ışık', Spanish: 'luz', French: 'lumière', German: 'Licht' } },
    ombra: { lemma: 'ombra', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'shadow / shade', Turkish: 'gölge', Spanish: 'sombra', French: 'ombre', German: 'Schatten' } },
    cielo: { lemma: 'cielo', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'sky / heaven', Turkish: 'gök / cennet', Spanish: 'cielo', French: 'ciel', German: 'Himmel' } },
    terra: { lemma: 'terra', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'earth / land / ground', Turkish: 'toprak / yer / dünya', Spanish: 'tierra', French: 'terre', German: 'Erde' } },
    mare: { lemma: 'mare', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'sea / ocean', Turkish: 'deniz', Spanish: 'mar', French: 'mer', German: 'Meer' } },
    vento: { lemma: 'vento', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'wind', Turkish: 'rüzgâr', Spanish: 'viento', French: 'vent', German: 'Wind' } },
    acqua: { lemma: 'acqua', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'water', Turkish: 'su', Spanish: 'agua', French: 'eau', German: 'Wasser' } },
    via: { lemma: 'via', pos: 'Noun (Feminine)', morph: 'Singular noun / Adverb', translations: { English: 'way / street / route', Turkish: 'yol / sokak', Spanish: 'vía / calle', French: 'voie / rue', German: 'Weg / Straße' } },
    cammino: { lemma: 'cammino', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'path / journey / walk', Turkish: 'yol / yürüyüş', Spanish: 'camino', French: 'chemin', German: 'Pfad / Weg' } },
    destino: { lemma: 'destino', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'destiny / fate', Turkish: 'kader', Spanish: 'destino', French: 'destin', German: 'Schicksal' } },
    parola: { lemma: 'parola', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'word', Turkish: 'kelime / söz', Spanish: 'palabra', French: 'parole / mot', German: 'Wort' } },
    voce: { lemma: 'voce', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'voice', Turkish: 'ses', Spanish: 'voz', French: 'voix', German: 'Stimme' } },
    silenzio: { lemma: 'silenzio', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'silence', Turkish: 'sessizlik', Spanish: 'silencio', French: 'silence', German: 'Stille' } },
    sguardo: { lemma: 'sguardo', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'look / gaze / glance', Turkish: 'bakış', Spanish: 'mirada', French: 'regard', German: 'Blick' } },
    occhio: { lemma: 'occhio', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'eye', Turkish: 'göz', Spanish: 'ojo', French: 'œil', German: 'Auge' } },
    pensiero: { lemma: 'pensiero', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'thought / reflection', Turkish: 'düşünce / fikir', Spanish: 'pensamiento', French: 'pensée', German: 'Gedanke' } },
    dolore: { lemma: 'dolore', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'pain / grief / sorrow', Turkish: 'acı / keder', Spanish: 'dolor', French: 'douleur', German: 'Schmerz' } },
    speranza: { lemma: 'speranza', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'hope', Turkish: 'umut', Spanish: 'esperanza', French: 'espoir', German: 'Hoffnung' } },
    paura: { lemma: 'paura', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'fear / dread', Turkish: 'korku', Spanish: 'miedo', French: 'peur', German: 'Angst' } },
    sogno: { lemma: 'sogno', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'dream', Turkish: 'rüya / düş', Spanish: 'sueño', French: 'rêve', German: 'Traum' } },
    verità: { lemma: 'verità', pos: 'Noun (Feminine)', morph: 'Singular noun (invariable)', translations: { English: 'truth', Turkish: 'hakikat / gerçek', Spanish: 'verdad', French: 'vérité', German: 'Wahrheit' } },
    ragione: { lemma: 'ragione', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'reason / cause', Turkish: 'akıl / mantık / sebep', Spanish: 'razón', French: 'raison', German: 'Vernunft / Grund' } },
    belleza: { lemma: 'bellezza', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'beauty', Turkish: 'güzellik', Spanish: 'belleza', French: 'beauté', German: 'Schönheit' } },
    virtù: { lemma: 'virtù', pos: 'Noun (Feminine)', morph: 'Singular noun (invariable)', translations: { English: 'virtue', Turkish: 'erdem', Spanish: 'virtud', French: 'vertu', German: 'Tugend' } },
    libertà: { lemma: 'libertà', pos: 'Noun (Feminine)', morph: 'Singular noun (invariable)', translations: { English: 'freedom / liberty', Turkish: 'özgürlük', Spanish: 'libertad', French: 'liberté', German: 'Freiheit' } },
    spirito: { lemma: 'spirito', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'spirit / mind / wit', Turkish: 'ruh / zihin', Spanish: 'espíritu', French: 'esprit', German: 'Geist' } },
    mente: { lemma: 'mente', pos: 'Noun (Feminine)', morph: 'Singular noun', translations: { English: 'mind / intellect', Turkish: 'akıl / zihin', Spanish: 'mente', French: 'esprit / mental', German: 'Verstand / Geist' } },
    libro: { lemma: 'libro', pos: 'Noun (Masculine)', morph: 'Singular noun', translations: { English: 'book', Turkish: 'kitap', Spanish: 'libro', French: 'livre', German: 'Buch' } },
    sapere: { lemma: 'sapere', pos: 'Verb', morph: 'Infinitive / Noun', translations: { English: 'to know / knowledge', Turkish: 'bilmek / bilgi', Spanish: 'saber', French: 'savoir', German: 'wissen' } },
    capire: { lemma: 'capire', pos: 'Verb', morph: 'Infinitive', translations: { English: 'to understand / grasp', Turkish: 'anlamak', Spanish: 'comprender', French: 'comprendre', German: 'verstehen' } },
    cercare: { lemma: 'cercare', pos: 'Verb', morph: 'Infinitive', translations: { English: 'to search / seek', Turkish: 'aramak', Spanish: 'buscar', French: 'chercher', German: 'suchen' } },
    trovare: { lemma: 'trovare', pos: 'Verb', morph: 'Infinitive', translations: { English: 'to find / discover', Turkish: 'bulmak', Spanish: 'encontrar', French: 'trouver', German: 'finden' } },
    parlare: { lemma: 'parlare', pos: 'Verb', morph: 'Infinitive', translations: { English: 'to speak / talk', Turkish: 'konuşmak', Spanish: 'hablar', French: 'parler', German: 'sprechen' } },
    vedere: { lemma: 'vedere', pos: 'Verb', morph: 'Infinitive', translations: { English: 'to see', Turkish: 'görmek', Spanish: 'ver', French: 'voir', German: 'sehen' } },
    credere: { lemma: 'credere', pos: 'Verb', morph: 'Infinitive', translations: { English: 'to believe', Turkish: 'inanmak', Spanish: 'creer', French: 'croire', German: 'glauben' } },
    pensare: { lemma: 'pensare', pos: 'Verb', morph: 'Infinitive', translations: { English: 'to think', Turkish: 'düşünmek', Spanish: 'pensar', French: 'penser', German: 'denken' } },
    vivere: { lemma: 'vivere', pos: 'Verb', morph: 'Infinitive', translations: { English: 'to live', Turkish: 'yaşamak', Spanish: 'vivir', French: 'vivre', German: 'leben' } },
    grande: { lemma: 'grande', pos: 'Adjective', morph: 'Singular adjective', translations: { English: 'great / big', Turkish: 'büyük', Spanish: 'grande', French: 'grand', German: 'groß' } },
    piccolo: { lemma: 'piccolo', pos: 'Adjective', morph: 'Masculine singular', translations: { English: 'small / little', Turkish: 'küçük', Spanish: 'pequeño', French: 'petit', German: 'klein' } },
    bello: { lemma: 'bello', pos: 'Adjective', morph: 'Masculine singular', translations: { English: 'beautiful / fine', Turkish: 'güzel', Spanish: 'hermoso / bello', French: 'beau', German: 'schön' } },
    nuovo: { lemma: 'nuovo', pos: 'Adjective', morph: 'Masculine singular', translations: { English: 'new', Turkish: 'yeni', Spanish: 'nuevo', French: 'nouveau', German: 'neu' } },
    oscuro: { lemma: 'oscuro', pos: 'Adjective', morph: 'Masculine singular', translations: { English: 'dark / obscure', Turkish: 'karanlık', Spanish: 'oscuro', French: 'sombre', German: 'dunkel' } },
    chiaro: { lemma: 'chiaro', pos: 'Adjective', morph: 'Masculine singular', translations: { English: 'clear / bright / evident', Turkish: 'açık / aydınlık', Spanish: 'claro', French: 'clair', German: 'hell / klar' } },
    profondo: { lemma: 'profondo', pos: 'Adjective', morph: 'Masculine singular', translations: { English: 'deep / profound', Turkish: 'derin', Spanish: 'profundo', French: 'profond', German: 'tief' } },
    eterno: { lemma: 'eterno', pos: 'Adjective', morph: 'Masculine singular', translations: { English: 'eternal / everlasting', Turkish: 'sonsuz / ebedi', Spanish: 'eterno', French: 'éternel', German: 'ewig' } },
    solo: { lemma: 'solo', pos: 'Adjective / Adverb', morph: 'Masculine singular', translations: { English: 'alone / only / single', Turkish: 'yalnız / sadece', Spanish: 'solo', French: 'seul', German: 'allein' } },
    sempre: { lemma: 'sempre', pos: 'Adverb', morph: 'Temporal adverb', translations: { English: 'always / still', Turkish: 'her zaman / daima', Spanish: 'siempre', French: 'toujours', German: 'immer' } },
    mai: { lemma: 'mai', pos: 'Adverb', morph: 'Temporal adverb', translations: { English: 'never / ever', Turkish: 'asla / hiç', Spanish: 'nunca / jamás', French: 'jamais', German: 'nie / jemals' } },
    perché: { lemma: 'perché', pos: 'Conjunction / Adverb', morph: 'Causal / interrogative', translations: { English: 'why / because', Turkish: 'neden / çünkü', Spanish: 'por qué / porque', French: 'pourquoi / parce que', German: 'warum / weil' } },
    anche: { lemma: 'anche', pos: 'Adverb / Conjunction', morph: 'Additive particle', translations: { English: 'also / even / too', Turkish: 'de / da / ayrıca', Spanish: 'también / incluso', French: 'aussi / même', German: 'auch' } },
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
    can: { lemma: 'can', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'soul / life / spirit', Spanish: 'alma / vida', French: 'âme / vie', German: 'Seele / Leben' } },
    ruh: { lemma: 'ruh', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'spirit / soul / psyche', Spanish: 'espíritu / alma', French: 'esprit / âme', German: 'Geist / Seele' } },
    kalp: { lemma: 'kalp', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'heart / core', Spanish: 'corazón', French: 'cœur', German: 'Herz' } },
    ölüm: { lemma: 'ölüm', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'death', Spanish: 'muerte', French: 'mort', German: 'Tod' } },
    aşk: { lemma: 'aşk', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'love / passion', Spanish: 'amor / pasión', French: 'amour', German: 'Liebe' } },
    sevgi: { lemma: 'sevgi', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'love / affection', Spanish: 'cariño / amor', French: 'affection / amour', German: 'Zuneigung / Liebe' } },
    zaman: { lemma: 'zaman', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'time / era', Spanish: 'tiempo', French: 'temps', German: 'Zeit' } },
    vakit: { lemma: 'vakit', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'time / hour / period', Spanish: 'hora / momento', French: 'moment / temps', German: 'Zeit / Weile' } },
    gece: { lemma: 'gece', pos: 'İsim / Zarf', morph: 'Yalın isim', translations: { English: 'night', Spanish: 'noche', French: 'nuit', German: 'Nacht' } },
    ışık: { lemma: 'ışık', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'light', Spanish: 'luz', French: 'lumière', German: 'Licht' } },
    gölge: { lemma: 'gölge', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'shadow / shade', Spanish: 'sombra', French: 'ombre', German: 'Schatten' } },
    gök: { lemma: 'gök', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'sky / heavens', Spanish: 'cielo', French: 'ciel', German: 'Himmel' } },
    yer: { lemma: 'yer', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'ground / place / earth', Spanish: 'lugar / tierra', French: 'lieu / terre', German: 'Ort / Erde' } },
    toprak: { lemma: 'toprak', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'soil / land / earth', Spanish: 'tierra / suelo', French: 'sol / terre', German: 'Erde / Boden' } },
    rüzgâr: { lemma: 'rüzgâr', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'wind', Spanish: 'viento', French: 'vent', German: 'Wind' } },
    ateş: { lemma: 'ateş', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'fire / flame', Spanish: 'fuego', French: 'feu', German: 'Feuer' } },
    su: { lemma: 'su', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'water', Spanish: 'agua', French: 'eau', German: 'Wasser' } },
    yol: { lemma: 'yol', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'path / road / journey', Spanish: 'camino / vía', French: 'chemin / route', German: 'Weg' } },
    kader: { lemma: 'kader', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'destiny / fate', Spanish: 'destino / sino', French: 'destin', German: 'Schicksal' } },
    söz: { lemma: 'söz', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'word / promise / speech', Spanish: 'palabra / promesa', French: 'parole', German: 'Wort / Versprechen' } },
    ses: { lemma: 'ses', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'voice / sound', Spanish: 'voz / sonido', French: 'voix / son', German: 'Stimme / Ton' } },
    sessizlik: { lemma: 'sessizlik', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'silence / quietness', Spanish: 'silencio', French: 'silence', German: 'Stille' } },
    bakış: { lemma: 'bakış', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'gaze / look / glance', Spanish: 'mirada', French: 'regard', German: 'Blick' } },
    göz: { lemma: 'göz', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'eye', Spanish: 'ojo', French: 'œil', German: 'Auge' } },
    düşünce: { lemma: 'düşünce', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'thought / idea', Spanish: 'pensamiento / idea', French: 'pensée', German: 'Gedanke' } },
    fikir: { lemma: 'fikir', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'idea / opinion', Spanish: 'idea / opinión', French: 'idée / opinion', German: 'Idee / Ansicht' } },
    acı: { lemma: 'acı', pos: 'İsim / Sıfat', morph: 'Yalın isim / sıfat', translations: { English: 'pain / sorrow / bitter', Spanish: 'dolor / amargo', French: 'douleur / amer', German: 'Schmerz / bitter' } },
    umut: { lemma: 'umut', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'hope', Spanish: 'esperanza', French: 'espoir', German: 'Hoffnung' } },
    korku: { lemma: 'korku', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'fear / dread', Spanish: 'miedo / temor', French: 'peur', German: 'Angst / Furcht' } },
    rüya: { lemma: 'rüya', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'dream', Spanish: 'sueño', French: 'rêve', German: 'Traum' } },
    hayal: { lemma: 'hayal', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'imagination / vision / fantasy', Spanish: 'imaginación / ilusión', French: 'imagination / illusion', German: 'Phantasie / Traum' } },
    gerçek: { lemma: 'gerçek', pos: 'İsim / Sıfat', morph: 'Yalın isim', translations: { English: 'truth / reality / real', Spanish: 'verdad / realidad', French: 'vérité / réalité', German: 'Wahrheit / wirklich' } },
    akıl: { lemma: 'akıl', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'mind / reason / intellect', Spanish: 'mente / razón', French: 'raison / esprit', German: 'Vernunft / Verstand' } },
    güzellik: { lemma: 'güzellik', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'beauty', Spanish: 'belleza', French: 'beauté', German: 'Schönheit' } },
    erdem: { lemma: 'erdem', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'virtue / merit', Spanish: 'virtud', French: 'vertu', German: 'Tugend' } },
    özgürlük: { lemma: 'özgürlük', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'freedom / liberty', Spanish: 'libertad', French: 'liberté', German: 'Freiheit' } },
    kitap: { lemma: 'kitap', pos: 'İsim', morph: 'Yalın isim', translations: { English: 'book', Spanish: 'libro', French: 'livre', German: 'Buch' } },
    bilmek: { lemma: 'bilmek', pos: 'Fiil', morph: 'Mastar hâli', translations: { English: 'to know', Spanish: 'saber / conocer', French: 'savoir / connaître', German: 'wissen / kennen' } },
    anlamak: { lemma: 'anlamak', pos: 'Fiil', morph: 'Mastar hâli', translations: { English: 'to understand / comprehend', Spanish: 'entender / comprender', French: 'comprendre', German: 'verstehen' } },
    aramak: { lemma: 'aramak', pos: 'Fiil', morph: 'Mastar hâli', translations: { English: 'to search / seek / call', Spanish: 'buscar / llamar', French: 'chercher', German: 'suchen / anrufen' } },
    bulmak: { lemma: 'bulmak', pos: 'Fiil', morph: 'Mastar hâli', translations: { English: 'to find / discover', Spanish: 'encontrar / hallar', French: 'trouver', German: 'finden' } },
    konuşmak: { lemma: 'konuşmak', pos: 'Fiil', morph: 'Mastar hâli', translations: { English: 'to speak / talk', Spanish: 'hablar', French: 'parler', German: 'sprechen / reden' } },
    görmek: { lemma: 'görmek', pos: 'Fiil', morph: 'Mastar hâli', translations: { English: 'to see / perceive', Spanish: 'ver', French: 'voir', German: 'sehen' } },
    inanmak: { lemma: 'inanmak', pos: 'Fiil', morph: 'Mastar hâli', translations: { English: 'to believe / trust', Spanish: 'creer', French: 'croire', German: 'glauben' } },
    düşünmek: { lemma: 'düşünmek', pos: 'Fiil', morph: 'Mastar hâli', translations: { English: 'to think / reflect', Spanish: 'pensar', French: 'penser', German: 'denken' } },
    yaşamak: { lemma: 'yaşamak', pos: 'Fiil', morph: 'Mastar hâli', translations: { English: 'to live / experience', Spanish: 'vivir', French: 'vivre', German: 'leben' } },
    büyük: { lemma: 'büyük', pos: 'Sıfat', morph: 'Yalın sıfat', translations: { English: 'big / great / large', Spanish: 'grande', French: 'grand', German: 'groß' } },
    küçük: { lemma: 'küçük', pos: 'Sıfat', morph: 'Yalın sıfat', translations: { English: 'small / little', Spanish: 'pequeño', French: 'petit', German: 'klein' } },
    eski: { lemma: 'eski', pos: 'Sıfat', morph: 'Yalın sıfat', translations: { English: 'old / ancient', Spanish: 'viejo / antiguo', French: 'vieux / ancien', German: 'alt' } },
    yeni: { lemma: 'yeni', pos: 'Sıfat / Zarf', morph: 'Yalın sıfat', translations: { English: 'new / newly', Spanish: 'nuevo', French: 'nouveau', German: 'neu' } },
    karanlık: { lemma: 'karanlık', pos: 'İsim / Sıfat', morph: 'Yalın isim / sıfat', translations: { English: 'dark / darkness', Spanish: 'oscuro / oscuridad', French: 'sombre / obscurité', German: 'dunkel / Dunkelheit' } },
    aydınlık: { lemma: 'aydınlık', pos: 'İsim / Sıfat', morph: 'Yalın isim / sıfat', translations: { English: 'bright / brightness / light', Spanish: 'luminoso / claridad', French: 'lumineux / clarté', German: 'hell / Helligkeit' } },
    derin: { lemma: 'derin', pos: 'Sıfat', morph: 'Yalın sıfat', translations: { English: 'deep / profound', Spanish: 'profundo', French: 'profond', German: 'tief' } },
    sonsuz: { lemma: 'sonsuz', pos: 'Sıfat', morph: 'Yalın sıfat', translations: { English: 'endless / eternal / infinite', Spanish: 'infinito / eterno', French: 'infini / éternel', German: 'unendlich / ewig' } },
    yalnız: { lemma: 'yalnız', pos: 'Sıfat / Zarf / Bağlaç', morph: 'Yalın sözcük', translations: { English: 'alone / solitary / only', Spanish: 'solo / solamente', French: 'seul / seulement', German: 'allein / nur' } },
    her: { lemma: 'her', pos: 'Belgisiz Sıfat', morph: 'Yalın sıfat', translations: { English: 'every / each', Spanish: 'cada / todo', French: 'chaque / tout', German: 'jeder / jede' } },
    hiçbir: { lemma: 'hiçbir', pos: 'Belgisiz Sıfat', morph: 'Birleşik sıfat', translations: { English: 'no / not any / none', Spanish: 'ningún / ninguno', French: 'aucun', German: 'kein' } },
    ama: { lemma: 'ama', pos: 'Bağlaç', morph: 'Karşıtlık bağlacı', translations: { English: 'but / yet', Spanish: 'pero', French: 'mais', German: 'aber' } },
    çünkü: { lemma: 'çünkü', pos: 'Bağlaç', morph: 'Neden bağlacı', translations: { English: 'because / since', Spanish: 'porque', French: 'parce que', German: 'weil' } },
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
    soul: { lemma: 'soul', pos: 'Noun', morph: 'Singular noun', translations: { English: 'soul / spirit / inner essence', Turkish: 'ruh / can', Spanish: 'alma', French: 'âme', German: 'Seele', Italian: 'anima' } },
    heart: { lemma: 'heart', pos: 'Noun', morph: 'Singular noun', translations: { English: 'heart / core / emotional center', Turkish: 'kalp / yürek', Spanish: 'corazón', French: 'cœur', German: 'Herz', Italian: 'cuore' } },
    death: { lemma: 'death', pos: 'Noun', morph: 'Singular noun', translations: { English: 'death / end of life', Turkish: 'ölüm', Spanish: 'muerte', French: 'mort', German: 'Tod', Italian: 'morte' } },
    love: { lemma: 'love', pos: 'Noun / Verb', morph: 'Singular noun / verb', translations: { English: 'love / deep affection', Turkish: 'sevgi / aşk', Spanish: 'amor', French: 'amour', German: 'Liebe', Italian: 'amore' } },
    time: { lemma: 'time', pos: 'Noun', morph: 'Singular noun', translations: { English: 'time / duration / era', Turkish: 'zaman / vakit', Spanish: 'tiempo', French: 'temps', German: 'Zeit', Italian: 'tempo' } },
    night: { lemma: 'night', pos: 'Noun', morph: 'Singular noun', translations: { English: 'night / darkness', Turkish: 'gece', Spanish: 'noche', French: 'nuit', German: 'Nacht', Italian: 'notte' } },
    day: { lemma: 'day', pos: 'Noun', morph: 'Singular noun', translations: { English: 'day / daytime', Turkish: 'gün', Spanish: 'día', French: 'jour', German: 'Tag', Italian: 'giorno' } },
    light: { lemma: 'light', pos: 'Noun / Adjective', morph: 'Singular noun', translations: { English: 'light / brightness / illumination', Turkish: 'ışık / aydınlık', Spanish: 'luz', French: 'lumière', German: 'Licht', Italian: 'luce' } },
    shadow: { lemma: 'shadow', pos: 'Noun', morph: 'Singular noun', translations: { English: 'shadow / shade / dark silhouette', Turkish: 'gölge', Spanish: 'sombra', French: 'ombre', German: 'Schatten', Italian: 'ombra' } },
    sky: { lemma: 'sky', pos: 'Noun', morph: 'Singular noun', translations: { English: 'sky / celestial sphere', Turkish: 'gök / gökyüzü', Spanish: 'cielo', French: 'ciel', German: 'Himmel', Italian: 'cielo' } },
    earth: { lemma: 'earth', pos: 'Noun', morph: 'Singular noun', translations: { English: 'earth / soil / the globe', Turkish: 'toprak / yer / dünya', Spanish: 'tierra', French: 'terre', German: 'Erde', Italian: 'terra' } },
    sea: { lemma: 'sea', pos: 'Noun', morph: 'Singular noun', translations: { English: 'sea / ocean', Turkish: 'deniz', Spanish: 'mar', French: 'mer', German: 'Meer', Italian: 'mare' } },
    wind: { lemma: 'wind', pos: 'Noun', morph: 'Singular noun', translations: { English: 'wind / moving air', Turkish: 'rüzgâr', Spanish: 'viento', French: 'vent', German: 'Wind', Italian: 'vento' } },
    fire: { lemma: 'fire', pos: 'Noun', morph: 'Singular noun', translations: { English: 'fire / combustion / flame', Turkish: 'ateş', Spanish: 'fuego', French: 'feu', German: 'Feuer', Italian: 'fuoco' } },
    water: { lemma: 'water', pos: 'Noun', morph: 'Singular noun', translations: { English: 'water', Turkish: 'su', Spanish: 'agua', French: 'eau', German: 'Wasser', Italian: 'acqua' } },
    path: { lemma: 'path', pos: 'Noun', morph: 'Singular noun', translations: { English: 'path / route / track', Turkish: 'yol / patika', Spanish: 'camino / sendero', French: 'sentier / chemin', German: 'Pfad / Weg', Italian: 'sentiero / via' } },
    journey: { lemma: 'journey', pos: 'Noun', morph: 'Singular noun', translations: { English: 'journey / travel / voyage', Turkish: 'yolculuk / seyahat', Spanish: 'viaje', French: 'voyage', German: 'Reise', Italian: 'viaggio' } },
    destiny: { lemma: 'destiny', pos: 'Noun', morph: 'Singular noun', translations: { English: 'destiny / inevitable fate', Turkish: 'kader / alınyazısı', Spanish: 'destino', French: 'destin', German: 'Schicksal', Italian: 'destino' } },
    fate: { lemma: 'fate', pos: 'Noun', morph: 'Singular noun', translations: { English: 'fate / predetermined outcome', Turkish: 'kader / talih', Spanish: 'hado / sino', French: 'sort / destin', German: 'Schicksal', Italian: 'fato' } },
    word: { lemma: 'word', pos: 'Noun', morph: 'Singular noun', translations: { English: 'word / utterance / term', Turkish: 'kelime / söz', Spanish: 'palabra', French: 'mot / parole', German: 'Wort', Italian: 'parola' } },
    words: { lemma: 'word', pos: 'Noun', morph: 'Plural noun', translations: { English: 'words / speech / language', Turkish: 'kelimeler / sözler', Spanish: 'palabras', French: 'mots', German: 'Worte / Wörter', Italian: 'parole' } },
    voice: { lemma: 'voice', pos: 'Noun', morph: 'Singular noun', translations: { English: 'voice / vocal expression', Turkish: 'ses', Spanish: 'voz', French: 'voix', German: 'Stimme', Italian: 'voce' } },
    silence: { lemma: 'silence', pos: 'Noun', morph: 'Singular noun', translations: { English: 'silence / complete quiet', Turkish: 'sessizlik / sükût', Spanish: 'silencio', French: 'silence', German: 'Stille / Schweigen', Italian: 'silenzio' } },
    gaze: { lemma: 'gaze', pos: 'Noun / Verb', morph: 'Singular noun / verb', translations: { English: 'gaze / steady intent look', Turkish: 'bakış / dik dik bakmak', Spanish: 'mirada', French: 'regard', German: 'Blick', Italian: 'sguardo' } },
    thought: { lemma: 'thought', pos: 'Noun', morph: 'Singular noun', translations: { English: 'thought / idea / reflection', Turkish: 'düşünce / fikir', Spanish: 'pensamiento', French: 'pensée', German: 'Gedanke', Italian: 'pensiero' } },
    thoughts: { lemma: 'thought', pos: 'Noun', morph: 'Plural noun', translations: { English: 'thoughts / reflections', Turkish: 'düşünceler', Spanish: 'pensamientos', French: 'pensées', German: 'Gedanken', Italian: 'pensieri' } },
    pain: { lemma: 'pain', pos: 'Noun', morph: 'Singular noun', translations: { English: 'pain / physical or mental ache', Turkish: 'acı / ağrı', Spanish: 'dolor', French: 'douleur', German: 'Schmerz', Italian: 'dolore' } },
    sorrow: { lemma: 'sorrow', pos: 'Noun', morph: 'Singular noun', translations: { English: 'sorrow / deep sadness / grief', Turkish: 'keder / hüzün', Spanish: 'tristeza / dolor', French: 'chagrin / peine', German: 'Kummer / Trauer', Italian: 'tristezza / dolore' } },
    hope: { lemma: 'hope', pos: 'Noun / Verb', morph: 'Singular noun', translations: { English: 'hope / aspiration / trust', Turkish: 'umut / ümit', Spanish: 'esperanza', French: 'espoir', German: 'Hoffnung', Italian: 'speranza' } },
    fear: { lemma: 'fear', pos: 'Noun / Verb', morph: 'Singular noun', translations: { English: 'fear / apprehension / dread', Turkish: 'korku', Spanish: 'miedo / temor', French: 'peur / crainte', German: 'Angst / Furcht', Italian: 'paura' } },
    dream: { lemma: 'dream', pos: 'Noun / Verb', morph: 'Singular noun', translations: { English: 'dream / vision / aspiration', Turkish: 'rüya / düş / hayal', Spanish: 'sueño', French: 'rêve', German: 'Traum', Italian: 'sogno' } },
    dreams: { lemma: 'dream', pos: 'Noun', morph: 'Plural noun', translations: { English: 'dreams / visions', Turkish: 'rüyalar / hayaller', Spanish: 'sueños', French: 'rêves', German: 'Träume', Italian: 'sogni' } },
    reason: { lemma: 'reason', pos: 'Noun', morph: 'Singular noun', translations: { English: 'reason / intellect / cause', Turkish: 'akıl / mantık / sebep', Spanish: 'razón', French: 'raison', German: 'Vernunft / Grund', Italian: 'ragione' } },
    beauty: { lemma: 'beauty', pos: 'Noun', morph: 'Singular noun', translations: { English: 'beauty / aesthetic grace', Turkish: 'güzellik', Spanish: 'belleza', French: 'beauté', German: 'Schönheit', Italian: 'bellezza' } },
    virtue: { lemma: 'virtue', pos: 'Noun', morph: 'Singular noun', translations: { English: 'virtue / moral excellence', Turkish: 'erdem', Spanish: 'virtud', French: 'vertu', German: 'Tugend', Italian: 'virtù' } },
    freedom: { lemma: 'freedom', pos: 'Noun', morph: 'Singular noun', translations: { English: 'freedom / liberty / independence', Turkish: 'özgürlük', Spanish: 'libertad', French: 'liberté', German: 'Freiheit', Italian: 'libertà' } },
    wisdom: { lemma: 'wisdom', pos: 'Noun', morph: 'Singular noun', translations: { English: 'wisdom / profound knowledge', Turkish: 'bilgelik / hikmet', Spanish: 'sabiduría', French: 'sagesse', German: 'Weisheit', Italian: 'saggezza' } },
    spirit: { lemma: 'spirit', pos: 'Noun', morph: 'Singular noun', translations: { English: 'spirit / soul / breath of life', Turkish: 'ruh / zihin', Spanish: 'espíritu', French: 'esprit', German: 'Geist', Italian: 'spirito' } },
    book: { lemma: 'book', pos: 'Noun', morph: 'Singular noun', translations: { English: 'book / tome', Turkish: 'kitap', Spanish: 'libro', French: 'livre', German: 'Buch', Italian: 'libro' } },
    man: { lemma: 'man', pos: 'Noun', morph: 'Singular noun', translations: { English: 'man / human / mankind', Turkish: 'insan / adam', Spanish: 'hombre', French: 'homme', German: 'Mann / Mensch', Italian: 'uomo' } },
    men: { lemma: 'man', pos: 'Noun', morph: 'Plural noun', translations: { English: 'men / people / humans', Turkish: 'insanlar / adamlar', Spanish: 'hombres', French: 'hommes', German: 'Männer / Menschen', Italian: 'uomini' } },
    know: { lemma: 'know', pos: 'Verb', morph: 'Infinitive / Present verb', translations: { English: 'to know / perceive / be aware', Turkish: 'bilmek / tanımak', Spanish: 'saber / conocer', French: 'savoir / connaître', German: 'wissen / kennen', Italian: 'sapere / conoscere' } },
    understand: { lemma: 'understand', pos: 'Verb', morph: 'Infinitive / Present verb', translations: { English: 'to understand / comprehend', Turkish: 'anlamak / kavramak', Spanish: 'entender / comprender', French: 'comprendre', German: 'verstehen', Italian: 'capire / comprendere' } },
    seek: { lemma: 'seek', pos: 'Verb', morph: 'Infinitive / Present verb', translations: { English: 'to seek / search for', Turkish: 'aramak / peşinde olmak', Spanish: 'buscar', French: 'chercher', German: 'suchen', Italian: 'cercare' } },
    find: { lemma: 'find', pos: 'Verb', morph: 'Infinitive / Present verb', translations: { English: 'to find / discover', Turkish: 'bulmak', Spanish: 'encontrar / hallar', French: 'trouver', German: 'finden', Italian: 'trovare' } },
    speak: { lemma: 'speak', pos: 'Verb', morph: 'Infinitive / Present verb', translations: { English: 'to speak / utter words', Turkish: 'konuşmak', Spanish: 'hablar', French: 'parler', German: 'sprechen', Italian: 'parlare' } },
    see: { lemma: 'see', pos: 'Verb', morph: 'Infinitive / Present verb', translations: { English: 'to see / perceive visually', Turkish: 'görmek', Spanish: 'ver', French: 'voir', German: 'sehen', Italian: 'vedere' } },
    believe: { lemma: 'believe', pos: 'Verb', morph: 'Infinitive / Present verb', translations: { English: 'to believe / trust / have faith', Turkish: 'inanmak', Spanish: 'creer', French: 'croire', German: 'glauben', Italian: 'credere' } },
    think: { lemma: 'think', pos: 'Verb', morph: 'Infinitive / Present verb', translations: { English: 'to think / reflect / reason', Turkish: 'düşünmek', Spanish: 'pensar', French: 'penser', German: 'denken', Italian: 'pensare' } },
    live: { lemma: 'live', pos: 'Verb / Adjective', morph: 'Infinitive / Present verb', translations: { English: 'to live / exist / reside', Turkish: 'yaşamak', Spanish: 'vivir', French: 'vivre', German: 'leben', Italian: 'vivere' } },
    great: { lemma: 'great', pos: 'Adjective', morph: 'Positive adjective', translations: { English: 'great / grand / magnificent', Turkish: 'büyük / harika', Spanish: 'grande / gran', French: 'grand', German: 'großartig / groß', Italian: 'grande' } },
    small: { lemma: 'small', pos: 'Adjective', morph: 'Positive adjective', translations: { English: 'small / little / slight', Turkish: 'küçük / ufak', Spanish: 'pequeño', French: 'petit', German: 'klein', Italian: 'piccolo' } },
    old: { lemma: 'old', pos: 'Adjective', morph: 'Positive adjective', translations: { English: 'old / aged / ancient', Turkish: 'eski / yaşlı', Spanish: 'viejo / antiguo', French: 'vieux / ancien', German: 'alt', Italian: 'vecchio / antico' } },
    new: { lemma: 'new', pos: 'Adjective', morph: 'Positive adjective', translations: { English: 'new / fresh / novel', Turkish: 'yeni', Spanish: 'nuevo', French: 'nouveau', German: 'neu', Italian: 'nuovo' } },
    dark: { lemma: 'dark', pos: 'Adjective / Noun', morph: 'Positive adjective', translations: { English: 'dark / devoid of light', Turkish: 'karanlık / koyu', Spanish: 'oscuro', French: 'sombre / obscur', German: 'dunkel', Italian: 'oscuro / buio' } },
    deep: { lemma: 'deep', pos: 'Adjective', morph: 'Positive adjective', translations: { English: 'deep / profound / extending far down', Turkish: 'derin', Spanish: 'profundo', French: 'profond', German: 'tief', Italian: 'profondo' } },
    eternal: { lemma: 'eternal', pos: 'Adjective', morph: 'Positive adjective', translations: { English: 'eternal / everlasting / perpetual', Turkish: 'sonsuz / ebedi', Spanish: 'eterno', French: 'éternel', German: 'ewig', Italian: 'eterno' } },
    alone: { lemma: 'alone', pos: 'Adjective / Adverb', morph: 'Predicative adjective', translations: { English: 'alone / solitary / without company', Turkish: 'yalnız / tek başına', Spanish: 'solo', French: 'seul', German: 'allein', Italian: 'solo' } },
    always: { lemma: 'always', pos: 'Adverb', morph: 'Temporal adverb', translations: { English: 'always / at all times', Turkish: 'her zaman / daima', Spanish: 'siempre', French: 'toujours', German: 'immer', Italian: 'sempre' } },
    never: { lemma: 'never', pos: 'Adverb', morph: 'Temporal adverb', translations: { English: 'never / at no time', Turkish: 'asla / hiç', Spanish: 'nunca / jamás', French: 'jamais', German: 'nie / niemals', Italian: 'mai' } },
  },
};

/**
 * Strips common romance elisions (l', d', qu', dell', un') and tests common inflection suffixes
 * to match a surface token against root entries in INSTANT_LEXICON.
 */
export interface OfflineMorphologyAnalysis {
  lemma: string;
  pos: string;
  morph: string;
  affixNotes: string[];
}

/**
 * Full rule-based offline morphological lemmatizer across ES, FR, DE, IT, TR, EN.
 * Infers dictionary root lemma, part of speech, and inflectional morphology in 0ms without network.
 */
export function analyzeOfflineMorphology(rawWord: string, langCode: string): OfflineMorphologyAnalysis {
  const clean = rawWord
    .trim()
    .replace(/^[«"'(—¡¿]+|[»"')!?,.:;—]+$/g, '');
  const lower = clean.toLowerCase();
  const affixNotes: string[] = [];

  // Strip Romance elisions (l', d', qu', dell', all', nell', sull')
  const elisionMatch = lower.match(/^(l|d|qu|n|s|c|j|m|t|un|dell|all|nell|sull)['’](.+)$/i);
  const core = elisionMatch ? elisionMatch[2] : lower;
  if (elisionMatch) {
    affixNotes.push(`Elided prefix (${elisionMatch[1]}')`);
  }

  if (langCode === 'es') {
    // Enclitic pronouns on infinitives/gerunds (e.g. acordarme, decirle, haciéndolo)
    const enclitic = core.match(/^(.+?(?:ar|er|ir|ando|iendo))(me|te|se|lo|la|le|nos|os|los|las|les)$/);
    if (enclitic && enclitic[1].length >= 4) {
      const base = enclitic[1].replace(/(ando|iendo)$/, 'ar');
      affixNotes.push(`Enclitic pronoun (-${enclitic[2]})`);
      return {
        lemma: base,
        pos: 'Verb (Pronominal)',
        morph: `Verb with enclitic object/reflexive pronoun (-${enclitic[2]})`,
        affixNotes,
      };
    }
    if (core.endsWith('ando') && core.length > 5) {
      return { lemma: `${core.slice(0, -4)}ar`, pos: 'Verb (Gerund)', morph: 'Present participle (-ando)', affixNotes };
    }
    if (core.endsWith('iendo') && core.length > 6) {
      return { lemma: `${core.slice(0, -5)}er`, pos: 'Verb (Gerund)', morph: 'Present participle (-iendo)', affixNotes };
    }
    if ((core.endsWith('aba') || core.endsWith('aban') || core.endsWith('abas')) && core.length > 5) {
      return { lemma: core.replace(/(aban|abas|aba)$/, 'ar'), pos: 'Verb (Imperfect)', morph: 'Past imperfect indicative (-aba)', affixNotes };
    }
    if ((core.endsWith('ía') || core.endsWith('ían') || core.endsWith('ías')) && core.length > 4) {
      return { lemma: core.replace(/(ían|ías|ía)$/, 'er'), pos: 'Verb (Imperfect/Conditional)', morph: 'Imperfect or conditional tense (-ía)', affixNotes };
    }
    if ((core.endsWith('aron') || core.endsWith('ieron')) && core.length > 6) {
      return {
        lemma: core.endsWith('aron') ? `${core.slice(0, -4)}ar` : `${core.slice(0, -5)}ir`,
        pos: 'Verb (Preterite)',
        morph: '3rd person plural preterite indicative',
        affixNotes,
      };
    }
    if (core.endsWith('mente') && core.length > 7) {
      return { lemma: core.slice(0, -5), pos: 'Adverb', morph: 'Adverb of manner (-mente)', affixNotes };
    }
    if (core.endsWith('ción') || core.endsWith('sión')) {
      return { lemma: core, pos: 'Noun (Feminine)', morph: 'Abstract feminine singular noun', affixNotes };
    }
    if (core.endsWith('dad') || core.endsWith('tad')) {
      return { lemma: core, pos: 'Noun (Feminine)', morph: 'Abstract quality noun (-dad)', affixNotes };
    }
  } else if (langCode === 'fr') {
    if ((core.endsWith('ait') || core.endsWith('aient') || core.endsWith('ais')) && core.length > 5) {
      return { lemma: core.replace(/(aient|ait|ais)$/, 'er'), pos: 'Verb (Imparfait)', morph: 'Imperfect indicative', affixNotes };
    }
    if (core.endsWith('ant') && core.length > 5) {
      return { lemma: `${core.slice(0, -3)}er`, pos: 'Verb (Participle)', morph: 'Present participle (-ant)', affixNotes };
    }
    if (core.endsWith('ment') && core.length > 6) {
      return { lemma: core.slice(0, -4), pos: 'Adverb', morph: 'Derived adverb (-ment)', affixNotes };
    }
    if (core.endsWith('tion') || core.endsWith('sion')) {
      return { lemma: core, pos: 'Noun (Feminine)', morph: 'Feminine abstract noun', affixNotes };
    }
    if (core.endsWith('aux') && core.length > 4) {
      return { lemma: `${core.slice(0, -3)}al`, pos: 'Noun / Adjective', morph: 'Masculine plural (-aux → -al)', affixNotes };
    }
  } else if (langCode === 'de') {
    const isCapitalized = /^[A-ZÄÖÜ]/.test(clean);
    if (core.endsWith('ung') && isCapitalized && core.length > 5) {
      return { lemma: clean, pos: 'Noun (Feminine)', morph: 'Feminine nominalization (die -ung)', affixNotes };
    }
    if ((core.endsWith('heit') || core.endsWith('keit')) && isCapitalized) {
      return { lemma: clean, pos: 'Noun (Feminine)', morph: 'Abstract feminine noun (-heit/-keit)', affixNotes };
    }
    if (isCapitalized) {
      return { lemma: clean, pos: 'Noun (Substantive)', morph: 'German capitalized noun', affixNotes };
    }
    if (core.startsWith('ge') && (core.endsWith('t') || core.endsWith('en')) && core.length > 5) {
      return { lemma: core.replace(/^ge/, '').replace(/t$/, 'en'), pos: 'Verb (Partizip II)', morph: 'Past participle (ge-...-t/-en)', affixNotes };
    }
    if ((core.endsWith('te') || core.endsWith('ten')) && core.length > 5) {
      return { lemma: core.replace(/(ten|te)$/, 'en'), pos: 'Verb (Präteritum)', morph: 'Simple past tense (-te/-ten)', affixNotes };
    }
  } else if (langCode === 'it') {
    if ((core.endsWith('ava') || core.endsWith('avano') || core.endsWith('eva') || core.endsWith('evano')) && core.length > 5) {
      return {
        lemma: core.replace(/(avano|ava)$/, 'are').replace(/(evano|eva)$/, 'ere'),
        pos: 'Verb (Imperfetto)',
        morph: 'Past imperfect indicative',
        affixNotes,
      };
    }
    if ((core.endsWith('ando') || core.endsWith('endo')) && core.length > 5) {
      return {
        lemma: core.endsWith('ando') ? `${core.slice(0, -4)}are` : `${core.slice(0, -4)}ere`,
        pos: 'Verb (Gerundio)',
        morph: 'Progressive gerund',
        affixNotes,
      };
    }
    if (core.endsWith('mente') && core.length > 7) {
      return { lemma: core.slice(0, -5), pos: 'Adverb', morph: 'Manner adverb (-mente)', affixNotes };
    }
    if (core.endsWith('zione') && core.length > 6) {
      return { lemma: core, pos: 'Noun (Feminine)', morph: 'Feminine singular abstract noun (-zione)', affixNotes };
    }
  } else if (langCode === 'tr') {
    if ((core.endsWith('yorum') || core.endsWith('yorsun') || core.endsWith('yor') || core.endsWith('yordu') || core.endsWith('yorlar')) && core.length > 5) {
      const stem = core.replace(/[ıiuü]?yor(um|sun|du|lar)?$/, '');
      return { lemma: `${stem}mek`, pos: 'Fiil (Şimdiki Zaman)', morph: 'Continuous aspect (-yor)', affixNotes };
    }
    if ((core.endsWith('mış') || core.endsWith('miş') || core.endsWith('muş') || core.endsWith('müş')) && core.length > 5) {
      return { lemma: `${core.slice(0, -3)}mek`, pos: 'Fiil (Duyulan Geçmiş)', morph: 'Evidential past tense (-mış/-miş)', affixNotes };
    }
    if ((core.endsWith('acak') || core.endsWith('ecek')) && core.length > 6) {
      return { lemma: `${core.slice(0, -4)}mek`, pos: 'Fiil (Gelecek Zaman)', morph: 'Future tense (-acak/-ecek)', affixNotes };
    }
    if ((core.endsWith('lar') || core.endsWith('ler')) && core.length > 5) {
      return { lemma: core.slice(0, -3), pos: 'İsim (Çoğul)', morph: 'Plural suffix (-lar/-ler)', affixNotes };
    }
    if ((core.endsWith('dan') || core.endsWith('den') || core.endsWith('tan') || core.endsWith('ten')) && core.length > 5) {
      return { lemma: core.slice(0, -3), pos: 'İsim (Ayrılma Hâli)', morph: 'Ablative case (-dan/-den)', affixNotes };
    }
    if ((core.endsWith('da') || core.endsWith('de') || core.endsWith('ta') || core.endsWith('te')) && core.length > 4) {
      return { lemma: core.slice(0, -2), pos: 'İsim (Bulunma Hâli)', morph: 'Locative case (-da/-de)', affixNotes };
    }
  } else if (langCode === 'en') {
    if (core.endsWith('ing') && core.length > 5) {
      return { lemma: core.slice(0, -3), pos: 'Verb (Participle/Gerund)', morph: 'Progressive form (-ing)', affixNotes };
    }
    if (core.endsWith('ed') && core.length > 4) {
      return { lemma: core.slice(0, -2), pos: 'Verb (Past)', morph: 'Past tense / participle (-ed)', affixNotes };
    }
    if (core.endsWith('ly') && core.length > 4) {
      return { lemma: core.slice(0, -2), pos: 'Adverb', morph: 'Manner adverb (-ly)', affixNotes };
    }
    if (core.endsWith('ness') && core.length > 6) {
      return { lemma: core.slice(0, -4), pos: 'Noun', morph: 'State/quality noun (-ness)', affixNotes };
    }
  }

  return {
    lemma: core,
    pos: 'Word',
    morph: affixNotes.length > 0 ? affixNotes.join(' · ') : 'Contextual form',
    affixNotes,
  };
}

function findEntryWithStemming(
  cleanWord: string,
  langDict: Record<string, LexiconEntry>,
  langCode?: string
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

  // Try morphological lemmatizer root lookup
  if (langCode) {
    const morphAnalysis = analyzeOfflineMorphology(core, langCode);
    if (morphAnalysis.lemma && langDict[morphAnalysis.lemma.toLowerCase()]) {
      return {
        entry: langDict[morphAnalysis.lemma.toLowerCase()],
        inflectedNote: `${morphAnalysis.pos} (${morphAnalysis.morph})`,
      };
    }
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
 * Runtime expandable dictionary map (hydrated from IndexedDB `offline_dictionary` store)
 */
const runtimeOfflineEntries: Record<string, Record<string, LexiconEntry>> = {
  es: {},
  fr: {},
  de: {},
  it: {},
  tr: {},
  en: {},
};

export function registerOfflineDictionaryEntry(
  langCode: string,
  wordOrLemma: string,
  entry: LexiconEntry
): void {
  const code = langCode.toLowerCase().slice(0, 2);
  if (!runtimeOfflineEntries[code]) {
    runtimeOfflineEntries[code] = {};
  }
  const key = wordOrLemma.toLowerCase().trim();
  if (!key) return;
  const existing = runtimeOfflineEntries[code][key];
  runtimeOfflineEntries[code][key] = {
    lemma: entry.lemma || existing?.lemma || key,
    pos: entry.pos || existing?.pos || 'Word',
    morph: entry.morph || existing?.morph || 'Contextual form',
    translations: {
      ...(existing?.translations || {}),
      ...entry.translations,
    },
  };
}

export function getOfflineDictionaryCount(): number {
  let total = 0;
  for (const lang of Object.keys(INSTANT_LEXICON)) {
    const mergedKeys = new Set([
      ...Object.keys(INSTANT_LEXICON[lang] || {}),
      ...Object.keys(runtimeOfflineEntries[lang] || {}),
    ]);
    total += mergedKeys.size;
  }
  return total;
}

/**
 * Instant local lookup (<1ms) with inflection stemming + IndexedDB runtime dictionary entries.
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

  const combinedDict: Record<string, LexiconEntry> = {
    ...(INSTANT_LEXICON[targetLangCode] || {}),
    ...(runtimeOfflineEntries[targetLangCode] || {}),
  };

  const match = findEntryWithStemming(clean, combinedDict, targetLangCode);
  if (!match) return null;

  const { entry, inflectedNote } = match;
  const translation = entry.translations[baseLangName] || entry.translations.English;
  if (!translation) return null;

  return {
    word: rawWord.trim(),
    translation,
    lemma: entry.lemma,
    partOfSpeech: entry.pos,
    morphology: inflectedNote ? `${entry.morph} · ${inflectedNote}` : entry.morph,
    sentenceTranslation: cachedSentenceTranslation || surroundingSentence,
    usageNote: `Resolved instantly via Offline Heuristic Dictionary (${baseLangName}).`,
    contextSentence: surroundingSentence,
    targetLang: targetLangCode,
    latencyMs: 0,
    sourceEngine: 'lexicon',
    isEnriching: false,
  };
}
