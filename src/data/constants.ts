import { LanguageInfo, GenreInfo, ContentItem, SocialUser } from '../types/index.ts';

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    speechLocale: 'es-ES',
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    speechLocale: 'fr-FR',
  },
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    speechLocale: 'de-DE',
  },
  {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    speechLocale: 'it-IT',
  },
  {
    code: 'tr',
    name: 'Turkish',
    nativeName: 'Türkçe',
    flag: '🇹🇷',
    speechLocale: 'tr-TR',
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    speechLocale: 'en-US',
  },
];

export const BASE_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
] as const;

export const GENRES: GenreInfo[] = [
  {
    id: 'philosophy',
    label: 'Philosophy & Thought',
    subtitle: 'Stoicism, ethics, and timeless inquiries',
    description: 'Meditations, dialogues, and philosophical essays from history’s deepest thinkers.',
  },
  {
    id: 'fiction',
    label: 'Classic Fiction',
    subtitle: 'Masterpieces of world literature',
    description: 'Novels, novellas, and character journeys that defined world culture.',
  },
  {
    id: 'history',
    label: 'History & Culture',
    subtitle: 'Chronicles, civilizations, and turning points',
    description: 'Historical accounts, biographies, and cultural examinations.',
  },
  {
    id: 'essays',
    label: 'Essays & Journalism',
    subtitle: 'Reflective prose, critiques, and commentary',
    description: 'Thoughtful long-form essays, literary critiques, and journalistic investigations.',
  },
  {
    id: 'stories',
    label: 'Short Stories & Fables',
    subtitle: 'Focused narratives for daily study',
    description: 'Concise short fiction, parables, and folklore perfect for 10-minute reading sessions.',
  },
  {
    id: 'science',
    label: 'Science & Nature',
    subtitle: 'Natural philosophy, exploration, and discovery',
    description: 'Classic naturalist writings, scientific treatises, and the wonders of the cosmos.',
  },
];

export const CEFR_LEVELS = [
  { level: 'Original', label: 'Original Text', desc: 'Unmodified authentic publication' },
  { level: 'A1', label: 'A1 Beginner', desc: 'Core 500 words, simple present and basic past' },
  { level: 'A2', label: 'A2 Elementary', desc: 'Everyday vocabulary, routine expressions' },
  { level: 'B1', label: 'B1 Intermediate', desc: 'Standard narrative flow, moderate complexity' },
  { level: 'B2', label: 'B2 Upper-Int.', desc: 'Nuanced discourse, rich vocabulary' },
  { level: 'C1', label: 'C1 Advanced', desc: 'Stylistic elegance, intricate grammar' },
] as const;

export const INITIAL_CURATED_BOOKS: ContentItem[] = [
  // SPANISH - Classic Fiction
  {
    id: 'es-quixote',
    title: 'Don Quijote de la Mancha',
    author: 'Miguel de Cervantes',
    language: 'es',
    genre: 'fiction',
    source: 'gutenberg',
    summary: 'The founding work of modern Western literature, following an hidalgo who loses his wits to tales of chivalry.',
    wordCount: 1840,
    estimatedReadTimeMinutes: 8,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    currentChunkIndex: 0,
    chunks: [
      `En un lugar de la Mancha, de cuyo nombre no quiero acordarme, no ha mucho tiempo que vivía un hidalgo de los de lanza en astillero, adarga antigua, rocín flaco y galgo corredor. Una olla de algo más vaca que carnero, salpicón las más noches, duelos y quebrantos los sábados, lantejas los viernes, algún palomino de añadidura los domingos, consumían las tres partes de su hacienda.

El resto della concluían sayo de velarte, calzas de velludo para las fiestas, con sus pantuflos de lo mesmo, y los días de entresemana se honraba con su vellorí de lo más fino. Tenía en su casa una ama que pasaba de los cuarenta, y una sobrina que no llegaba a los veinte, y un mozo de campo y plaza, que así ensillaba el rocín como tomaba la podadera.

Frisaba la edad de nuestro hidalgo con los cincuenta años; era de complexión recia, seco de carnes, enjuto de rostro, gran madrugador y amigo de la caza. Quieren decir que tenía el sobrenombre de Quijada, o Quesada, que en esto hay alguna diferencia en los autores que deste caso escriben; aunque por conjeturas verisímiles se deja entender que se llamaba Quijana. Pero esto importa poco a nuestro cuento; basta que en la narración dél no se salga un punto de la verdad.

Es, pues, de saber que este sobredicho hidalgo, los ratos que estaba ocioso —que eran los más del año—, se daba a leer libros de caballerías, con tanta afición y gusto, que olvidó casi de todo punto el ejercicio de la caza, y aun la administración de su hacienda; y llegó a tanto su curiosidad y desatino en esto, que vendió muchas hanegas de tierra de sembradura para comprar libros de caballerías en que leer.`,
      `Desvelábase por entenderlas y desentrañarles el sentido, que no se lo sacara ni las entendiera el mesmo Aristóteles, si resucitara para sólo ello. No estaba muy bien con las heridas que don Belianís daba y recebía, porque se imaginaba que, por grandes maestros que le hubiesen curado, no dejaría de tener el rostro y todo el cuerpo lleno de cicatrices y señales. Con todo esto, alababa en su autor aquel acabar su libro con la promesa de aquella inacabable aventura.

En efecto, rematado ya su juicio, vino a dar en el más estraño pensamiento que jamás dio loco en el mundo, y fue que le pareció convenible y necesario, así para el aumento de su honra como para el servicio de su república, hacerse caballero andante, y irse por todo el mundo con sus armas y caballo a buscar las aventuras y a ejercitarse en todo aquello que él había leído que los caballeros andantes se ejercitaban, deshaciendo todo género de agravio.`
    ],
  },

  // SPANISH - Philosophy
  {
    id: 'es-epicteto',
    title: 'Manual de Vida (Enquiridión)',
    author: 'Epicteto',
    language: 'es',
    genre: 'philosophy',
    source: 'gutenberg',
    summary: 'Guía esencial del estoicismo clásico sobre la libertad interior y lo que está bajo nuestro control.',
    wordCount: 1420,
    estimatedReadTimeMinutes: 6,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
    currentChunkIndex: 0,
    chunks: [
      `De las cosas, unas están bajo nuestro control y otras no lo están. Bajo nuestro control están el juicio, el impulso, el deseo, la aversión y, en una palabra, cuantas son obras nuestras. Fuera de nuestro control están el cuerpo, las posesiones, las opiniones ajenas, los cargos y, en suma, cuantas cosas no son actos propios.

Las cosas que dependen de nosotros son por naturaleza libres, sin impedimentos ni trabas; las que no dependen de nosotros son débiles, esclavas, sujetas a obstáculos y ajenas. Recuerda, por tanto, que si consideras libre aquello que es esclavo por naturaleza, y como propio lo que pertenece a otros, hallarás tropiezos a cada paso, te lamentarás, vivirás turbado y culparás a los dioses y a los hombres.

Por el contrario, si sólo consideras tuyo lo que verdaderamente es tuyo, y ajeno lo que en realidad pertenece a otros, nadie te forzará jamás, nadie te pondrá impedimentos, no culparás a nadie ni acusarás a persona alguna. Jamás actuarás contra tu voluntad, ningún enemigo te dañará, pues nada perjudicial te podrá sobrevenir.`,
    ],
  },

  // FRENCH - Classic Fiction
  {
    id: 'fr-petit-prince',
    title: 'Le Petit Prince',
    author: 'Antoine de Saint-Exupéry',
    language: 'fr',
    genre: 'fiction',
    source: 'gutenberg',
    summary: 'Un conte poétique et philosophique explorant l’amitié, l’amour et la nature humaine à travers les yeux d’un jeune prince voyageur.',
    wordCount: 1650,
    estimatedReadTimeMinutes: 7,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    currentChunkIndex: 0,
    chunks: [
      `Lorsque j'avais six ans j'ai vu, une fois, une magnifique image, dans un livre sur la Forêt Vierge qui s'appelait Histoires Vécues. Ça représentait un serpent boa qui avalait un fauve. Voilà la copie du dessin.

On disait dans le livre: « Les serpents boas avalent leur proie tout entière, sans la mâcher. Ensuite ils ne peuvent plus bouger et ils dorment pendant les six mois de leur digestion. » J'ai alors beaucoup réfléchi sur les aventures de la jungle et, à mon tour, j'ai réussi, avec un crayon de couleur, à tracer mon premier dessin. Mon dessin numéro 1.

J'ai montré mon chef-d'œuvre aux grandes personnes et je leur ai demandé si mon dessin leur faisait peur. Elles m'ont répondu: « Pourquoi un chapeau ferait-il peur? » Mon dessin ne représentait pas un chapeau. Il représentait un serpent boa qui digérait un éléphant. J'ai alors dessiné l'intérieur du serpent boa, afin que les grandes personnes puissent comprendre. Elles ont toujours besoin d'explications.

Les grandes personnes m'ont conseillé de laisser de côté les dessins de serpents boas ouverts ou fermés, et de m'intéresser plutôt à la géographie, à l'histoire, au calcul et à la grammaire. C'est ainsi que j'ai abandonné, à l'âge de six ans, une magnifique carrière de peintre.`,
      `J'ai donc vécu seul, sans personne avec qui parler véritablement, jusqu'à une panne dans le désert du Sahara, il y a six ans. Quelque chose s'était cassé dans mon moteur. Et comme je n'avais avec moi ni mécanicien, ni passagers, je m'apprêtais à réussir, tout seul, une difficile réparation. C'était pour moi une question de vie ou de mort. J'avais à peine de l'eau à boire pour huit jours.

Le premier soir je me suis donc endormi sur le sable à mille milles de toute terre habitée. J'étais bien plus isolé qu'un naufragé sur un radeau au milieu de l'océan. Alors vous imaginez ma surprise, au lever du jour, quand une drôle de petite voix m'a réveillé. Elle disait:
— S'il vous plaît... dessine-moi un mouton!
— Hein!
— Dessine-moi un mouton...`
    ],
  },

  // FRENCH - Philosophy
  {
    id: 'fr-pensees',
    title: 'Pensées & Méditations',
    author: 'Blaise Pascal',
    language: 'fr',
    genre: 'philosophy',
    source: 'gutenberg',
    summary: 'Réflexions profondes sur la grandeur et la misère de la condition humaine.',
    wordCount: 1380,
    estimatedReadTimeMinutes: 6,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 6,
    currentChunkIndex: 0,
    chunks: [
      `L'homme n'est qu'un roseau, le plus faible de la nature; mais c'est un roseau pensant. Il ne faut pas que l'univers entier s'arme pour l'écraser: une vapeur, une goutte d'eau, suffit pour le tuer. Mais, quand l'univers l'écraserait, l'homme serait encore plus noble que ce qui le tue, puisqu'il sait qu'il meurt, et l'avantage que l'univers a sur lui, l'univers n'en sait rien.

Toute notre dignité consiste donc en la pensée. C'est de là qu'il faut nous relever et non de l'espace et de la durée, que nous ne saurions remplir. Travaillons donc à bien penser: voilà le principe de la morale.

Le silence éternel de ces espaces infinis m'effraie. Combien de royaumes nous ignorent! La mémoire la plus étendue n'est qu'un court moment dans l'éternité des temps. L'homme est visiblement fait pour penser; c'est toute sa dignité et tout son mérite; et tout son devoir est de penser comme il faut.`,
    ],
  },

  // GERMAN - Classic Fiction
  {
    id: 'de-verwandlung',
    title: 'Die Verwandlung',
    author: 'Franz Kafka',
    language: 'de',
    genre: 'fiction',
    source: 'gutenberg',
    summary: 'Die erschütternde Erzählung über Gregor Samsa, der eines Morgens als ungeheures Ungeziefer erwacht.',
    wordCount: 1540,
    estimatedReadTimeMinutes: 7,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    currentChunkIndex: 0,
    chunks: [
      `Als Gregor Samsa eines Morgens aus unruhigen Träumen erwachte, fand er sich in seinem Bett zu einem ungeheuren Ungeziefer verwandelt. Er lag auf seinem panzerartig harten Rücken und sah, wenn er den Kopf ein wenig hob, seinen gewölbten, braunen, von bogenförmigen Versteifungen geteilten Bauch, auf dessen Höhe sich die Bettdecke, zum gänzlichen Niedergleiten bereit, kaum noch erhalten konnte. Seine vielen, im Vergleich zu seinem sonstigen Umfang kläglich dünnen Beine flimmerten ihm hilflos vor den Augen.

»Was ist mit mir geschehen?« dachte er. Es war kein Traum. Sein Zimmer, ein richtiges, nur etwas zu kleines Menschenzimmer, lag ruhig zwischen den vier wohlbekannten Wänden. Über dem Tisch, auf dem eine aufgespannte Musterkollektion von Tuchwaren ausgebreitet war — Samsa war Reisender —, hing das Bild, das er vor kurzem aus einer illustrierten Zeitschrift ausgeschnitten und in einen hübschen, vergoldeten Rahmen getan hatte.

Gregors Blick richtete sich dann zum Fenster, und das trübe Wetter — man hörte Regentropfen auf das Fensterblech aufschlagen — machte ihn ganz melancholisch. »Wie wäre es, wenn ich noch ein wenig weiterschliefe und alle Verrücktheiten vergäße«, dachte er, aber das war gänzlich unausführbar, denn er war gewohnt, auf der rechten Seite zu schlafen, konnte sich aber in seinem gegenwärtigen Zustand nicht in diese Lage bringen.`,
    ],
  },

  // GERMAN - Philosophy
  {
    id: 'de-zarathustra',
    title: 'Also sprach Zarathustra',
    author: 'Friedrich Nietzsche',
    language: 'de',
    genre: 'philosophy',
    source: 'gutenberg',
    summary: 'Philosophische Dichtung über Selbstüberwindung, Weisheit und den Geist der Freiheit.',
    wordCount: 1410,
    estimatedReadTimeMinutes: 6,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    currentChunkIndex: 0,
    chunks: [
      `Als Zarathustra dreißig Jahre alt war, verließ er seine Heimat und den See seiner Heimat und ging in das Gebirge. Hier genoß er seines Geistes und seiner Einsamkeit und wurde dessen zehn Jahre nicht müde. Endlich aber wandelte sich sein Herz, — und eines Morgens stand er mit der Morgenröthe auf, trat vor die Sonne hin und sprach zu ihr also:

»Du großes Gestirn! Was wäre dein Glück, wenn du nicht Die hättest, welchen du leuchtest! Zehn Jahre kamst du hier herauf zu meiner Höhle: du würdest deines Lichtes und dieses Weges satt geworden sein, ohne mich, meinen Adler und meine Schlange. Aber wir warteten deiner an jedem Morgen, nahmen dir deinen Überfluß ab und segneten dich dafür.

Siehe! Ich bin meiner Weisheit überdrüssig, wie die Biene, die des Honigs zu viel gesammelt hat, ich bedarf der Hände, die sich ausstrecken. Ich möchte verschenken und austheilen, bis die Weisen unter den Menschen wieder einmal ihrer Narrheit und die Armen einmal ihres Reichthums froh geworden sind.«`,
    ],
  },

  // ITALIAN - Classic Fiction
  {
    id: 'it-pinocchio',
    title: 'Le Avventure di Pinocchio',
    author: 'Carlo Collodi',
    language: 'it',
    genre: 'fiction',
    source: 'gutenberg',
    summary: 'La celebre storia di un burattino di legno che sogna di diventare un bambino vero tra mille peripezie e lezioni morali.',
    wordCount: 1620,
    estimatedReadTimeMinutes: 7,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 8,
    currentChunkIndex: 0,
    chunks: [
      `C'era una volta...
— Un re! — diranno subito i miei piccoli lettori.
— No, ragazzi, avete sbagliato. C'era una volta un pezzo di legno.

Non era un legno di lusso, ma un semplice pezzo da catasta, di quelli che d'inverno si mettono nelle stufe e nei caminetti per accendere il fuoco e per riscaldare le stanze.

Non so come andasse, ma il fatto gli è che un bel giorno questo pezzo di legno capitò nella bottega di un vecchio falegname, il quale aveva nome mastro Antonio, se non che tutti lo chiamavano maestro Ciliegia, per via della punta del suo naso, che era sempre lustra e paonazza, come una ciliegia matura.

Appena maestro Ciliegia ebbe visto quel pezzo di legno, si rallegrò tutto e dandosi una fregatina di mani per la contentezza, borbottò a mezza voce:
— Questo legno è capitato a tempo: voglio servirmene per fare una gamba di tavolino.

Detto fatto, prese subito la scure arrotata per cominciare a levargli la scorza e a digrossarlo; ma quando fu lì per rifilargli il primo colpo, rimase col braccio sospeso in aria, perché sentì una vocina sottile sottile, che disse raccomandandosi:
— Non mi picchiar tanto forte!`,
    ],
  },

  // ITALIAN - Essays / Culture
  {
    id: 'it-machiavelli',
    title: 'Il Principe (Trattato Politico)',
    author: 'Niccolò Machiavelli',
    language: 'it',
    genre: 'essays',
    source: 'gutenberg',
    summary: 'La fondamentale analisi del potere, della virtù e della fortuna nella condotta degli stati.',
    wordCount: 1530,
    estimatedReadTimeMinutes: 7,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 9,
    currentChunkIndex: 0,
    chunks: [
      `Tutti gli stati, tutti e' dominii che hanno avuto e hanno imperio sopra gli uomini, sono stati e sono o repubbliche o principati. E' principati sono o ereditarii, de' quali el sangue del loro signore ne sia suto lungo tempo principe, o e' sono nuovi. E' nuovi, o e' sono nuovi tutti, come fu Milano a Francesco Sforza, o e' sono come membri aggiunti allo stato ereditario del principe che gli acquista, come è el regno di Napoli al re di Spagna.

Non mi è incognito come molti hanno avuto e hanno opinione che le cose del mondo sieno in modo governate dalla fortuna e da Dio, che gli uomini con la prudenzia loro non possino correggerle, né vi abbino rimedio alcuno; e per questo potrebbono giudicare che non fusse da insudare molto nelle cose, ma lasciarsi governare alla sorte.

Nondimanco, perché el nostro libero arbitrio non sia spento, iudico potere essere vero che la fortuna sia arbitra della metà delle azioni nostre, ma che la ci lasci governare l'altra metà, o presso, a noi.`,
    ],
  },

  // TURKISH - Stories & Fables
  {
    id: 'tr-nasreddin',
    title: 'Nasreddin Hoca Hikâyeleri ve Nükteleri',
    author: 'Halk Rivayeti',
    language: 'tr',
    genre: 'stories',
    source: 'gutenberg',
    summary: 'Anadolu irfanının ve hazırcevaplığın simgesi Nasreddin Hoca’dan düşündüren ve tebessüm ettiren klasik fıkralar.',
    wordCount: 1390,
    estimatedReadTimeMinutes: 6,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
    currentChunkIndex: 0,
    chunks: [
      `Bir gün Nasreddin Hoca gölün kenarına oturmuş, elindeki yoğurt bakracından kaşık kaşık göle çalıyormuş. Köylülerden biri yanına yaklaşıp merakla sormuş:
— Hayırdır Hoca Efendi, gölün kenarında ne yapıyorsun böyle?
Hoca başını kaldırmadan sakin bir sesle cevap vermiş:
— Görmüyor musun komşu, göle yoğurt mayalıyorum!

Köylü şaşkınlıkla gülmüş:
— İlahi Hoca, koskoca göl hiç maya tutar mı?
Hoca kaşığı tekrar daldırırken tebessüm etmiş:
— Ben de biliyorum tutmayacağını, ama ya tutarsa?

Başka bir gün Hoca çarşıda kaybettiği yüzüğünü sokak lambasının altında arıyormuş. Komşusu sormuş:
— Hoca, yüzüğü nerede düşürdün?
— Evin bodrumunda düşürdüm.
— Peki neden burada arıyorsun?
Hoca cevap vermiş:
— Bodrum karanlıktı, burası ise aydınlık!`,
    ],
  },

  // TURKISH - Classic Fiction / Stories
  {
    id: 'tr-sait-faik',
    title: 'Semaver ve Ada Hikâyeleri',
    author: 'Sait Faik Abasıyanık',
    language: 'tr',
    genre: 'fiction',
    source: 'gutenberg',
    summary: 'İstanbul’un deniz kokusunu, adalarını ve sade insanların iç dünyasını anlatan lirik Türk edebiyatı klasiği.',
    wordCount: 1470,
    estimatedReadTimeMinutes: 6,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 11,
    currentChunkIndex: 0,
    chunks: [
      `Ali, sabahın erken saatinde uyandı. Annesi mutfakta semaveri yakmıştı. Semaverin sesi, evin içine tatlı bir huzur yayıyordu. Çinko semaverin bacasından çıkan ince mavi duman, açık pencereden serin sabah havasına karışıyordu. Ali için sabah kahvaltısı sadece bir yemek değil, yeni başlayan günün en temiz başlangıcıydı.

Fabrikaya gitmeden önce annesinin elini öptü. Haliç boyunca uzanan taş sokaklardan yürürken balıkçıların seslerini dinledi. Denizin üstünde martılar süzülüyor, sabah güneşi kubbelere ve minarelere altın sarısı bir ışık bırakıyordu. İnsanları sevmekle başlıyordu her şey; bunu kalbinin ta derininde hissediyordu.`,
    ],
  },

  // ENGLISH - Classic Fiction
  {
    id: 'en-sherlock',
    title: 'A Scandal in Bohemia',
    author: 'Arthur Conan Doyle',
    language: 'en',
    genre: 'fiction',
    source: 'gutenberg',
    summary: 'The thrilling case that introduced Irene Adler, the only person to outwit the brilliant detective Sherlock Holmes.',
    wordCount: 1720,
    estimatedReadTimeMinutes: 7,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
    currentChunkIndex: 0,
    chunks: [
      `To Sherlock Holmes she is always the woman. I have seldom heard him mention her under any other name. In his eyes she eclipses and predominates the whole of her sex. It was not that he felt any emotion akin to love for Irene Adler. All emotions, and that one particularly, were abhorrent to his cold, precise but admirably balanced mind. He was, I take it, the most perfect reasoning and observing machine that the world has seen, but as a lover he would have placed himself in a false position.

He never spoke of the softer passions, save with a gibe and a sneer. They were admirable things for the observer — excellent for drawing the veil from men’s motives and actions. But for the trained reasoner to admit such intrusions into his own delicate and finely adjusted temperament was to introduce a distracting factor which might throw a doubt upon all his mental results.

Grit in a sensitive instrument, or a crack in one of his own high-power lenses, would not be more disturbing than a strong emotion in a nature such as his. And yet there was but one woman to him, and that woman was the late Irene Adler, of dubious and questionable memory.`,
    ],
  },

  // ENGLISH - Philosophy & Nature
  {
    id: 'en-walden',
    title: 'Walden: Life in the Woods',
    author: 'Henry David Thoreau',
    language: 'en',
    genre: 'science',
    source: 'gutenberg',
    summary: 'A reflection upon simple living in natural surroundings and personal independence.',
    wordCount: 1510,
    estimatedReadTimeMinutes: 7,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 12,
    currentChunkIndex: 0,
    chunks: [
      `When first I took up my abode in the woods, that is, began to spend my nights as well as days there, which, by accident, was on Independence Day, or the Fourth of July, 1845, my house was not finished for winter, but was merely a defence against the rain, without plastering or chimney, the walls being of rough, weather-stained boards, with wide chinks, which made it cool at night.

The upright white hewn studs and freshly planed door and window casings gave it a clean and airy look, especially in the morning, when its timbers were saturated with dew, so that I fancied that by noon some sweet gum would exude from them. To my imagination it retained throughout the day more or less of this auroral character, reminding me of a certain house on a mountain which I had visited a year before.

This was an airy and unplastered cabin, fit to entertain a travelling god, and where a goddess might trail her garments. The winds which passed over my dwell were such as sweep over the ridges of mountains, bearing the broken strophes, or only the celestial parts, of terrestrial music.`,
    ],
  },

  // SPANISH - Science & Nature
  {
    id: 'es-cajal',
    title: 'Reglas y Consejos sobre Investigación Científica',
    author: 'Santiago Ramón y Cajal',
    language: 'es',
    genre: 'science',
    source: 'gutenberg',
    summary: 'Consejos inmortales del padre de la neurociencia moderna sobre la perseverancia y el método científico.',
    wordCount: 1610,
    estimatedReadTimeMinutes: 7,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 13,
    currentChunkIndex: 0,
    chunks: [
      `La curiosidad es el primer motor del progreso intelectual. Quien contempla los fenómenos de la naturaleza sin asombro ni deseo de penetrar sus arcanos, renuncia a la más noble prerrogativa del espíritu humano. El investigador debe unir al entusiasmo juvenil la disciplina implacable del método; debe desconfiar de las verdades consagradas sin comprobación, y no aceptar jamás una afirmación sin someterla al crisol de la experiencia.

Los descubrimientos no son fruto del azar exclusivo, sino de la mente preparada que sabe reconocer la significación de lo inesperado. El sabio mira donde todos miran, pero ve lo que nadie ha visto. Cultivad, pues, el ojo observador y la paciencia del artífice que pule pacientemente su lente hasta discernir la verdad oculta en el tejido de la realidad.`,
    ],
  },

  // SPANISH - History & Culture
  {
    id: 'es-historia',
    title: 'Historia Verdadera de la Conquista',
    author: 'Bernal Díaz del Castillo',
    language: 'es',
    genre: 'history',
    source: 'gutenberg',
    summary: 'Crónica testimonial de primera mano sobre el encuentro de dos mundos en América.',
    wordCount: 1740,
    estimatedReadTimeMinutes: 8,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 14,
    currentChunkIndex: 0,
    chunks: [
      `Y desde que vimos tantas ciudades y villas pobladas en el agua, y en tierra firme otras grandes poblaciones, y aquella calzada tan derecha y por nivel cómo iba a México, nos quedamos admirados, y decíamos que parecía a las cosas de encantamiento que cuentan en el libro de Amadís, por las grandes torres y cúes y edificios que tenían dentro en el agua, y todos de cal y canto.

Y aun algunos de nuestros soldados decían si aquello que veían si era entre sueños. Y no es de maravillar que yo lo escriba aquí de esta manera, porque hay mucho que ponderar en ello que no sé cómo lo cuente: ver cosas nunca oídas, ni vistas, ni aun soñadas como veíamos. Fuimos caminando por nuestra calzada adelante, viendo aquella multitud de canoas que venían por la laguna a vernos.`,
    ],
  },

  // FRENCH - Science & Adventure
  {
    id: 'fr-verne',
    title: 'Voyage au centre de la Terre',
    author: 'Jules Verne',
    language: 'fr',
    genre: 'science',
    source: 'gutenberg',
    summary: 'La célèbre expédition géologique et scientifique vers les entrailles de notre planète.',
    wordCount: 1680,
    estimatedReadTimeMinutes: 7,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 15,
    currentChunkIndex: 0,
    chunks: [
      `Le 24 mai 1863, mon oncle, le professeur Lidenbrock, revint précipitamment vers sa petite maison située au numéro 19 de Königstrasse, l'une des plus anciennes rues du quartier de Hambourg. La bonne Marthe dut se croire fort en retard, car le dîner commençait à peine à chanter sur le fourneau de la cuisine. Mon oncle était un homme d'une science véritable, professeur de minéralogie et géologue passionné.

Il tenait entre ses mains un vieux bouquin inestimable, relié en veau jaune, dont il feuilletait les pages jaunies avec une délectation indicible. C'était un manuscrit runique islandais du douzième siècle. C'est dans ce volume étrange que nous allions découvrir le cryptogramme énigmatique d'Arne Saknussemm, nous invitant à descendre dans le cratère du volcan Sneffels pour atteindre le centre même du globe terrestre.`,
    ],
  },

  // GERMAN - Science & Cosmos
  {
    id: 'de-humboldt',
    title: 'Kosmos: Entwurf einer physischen Weltbeschreibung',
    author: 'Alexander von Humboldt',
    language: 'de',
    genre: 'science',
    source: 'gutenberg',
    summary: 'Das epochale Monumentalwerk über das harmonische Zusammenwirken aller Naturkräfte.',
    wordCount: 1590,
    estimatedReadTimeMinutes: 7,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 16,
    currentChunkIndex: 0,
    chunks: [
      `Die Natur ist für den denkenden Geist Einheit in der Vielheit, Verbindung des Mannigfaltigen in Form und Mischung, Inbegriff der Naturdinge und Naturkräfte als ein lebendiges Ganzes. Das wichtigste Resultat des sinnlichen Forschens ist daher dieses: in der Mannigfaltigkeit die Einheit zu erfassen, das Einzelne aus dem Geiste des Ganzen zu begreifen.

Vom fernsten Nebelfleck im Himmelsraum bis zum feinsten Gewebe der organischen Schöpfung regt sich ein ununterbrochenes Band des Zusammenhanges. Wer mit offenem Sinne die Erdgesetze betrachtet, erkennt, wie die Erhebung der Gebirge das Klima bedingt, wie das Klima die Pflanzenwelt formt und wie der Mensch inmitten dieser ewigen Wechselwirkung seinen Platz findet.`,
    ],
  },
];

export const MOCK_SOCIAL_USERS: SocialUser[] = [
  {
    id: 'u-1',
    name: 'Elena Rostova',
    handle: '@elena_reads',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    wordsReadThisWeek: 3420,
    totalWordsRead: 48900,
    streakDays: 42,
    leagueTier: 'Diamond',
    currentBookTitle: 'Don Quijote de la Mancha',
    currentBookLang: 'es',
    isFollowing: true,
  },
  {
    id: 'u-2',
    name: 'Julian Moreau',
    handle: '@jmoreau_paris',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    wordsReadThisWeek: 2890,
    totalWordsRead: 39400,
    streakDays: 28,
    leagueTier: 'Diamond',
    currentBookTitle: 'Le Petit Prince',
    currentBookLang: 'fr',
    isFollowing: true,
  },
  {
    id: 'u-3',
    name: 'Clara Weber',
    handle: '@clara_berlin',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    wordsReadThisWeek: 2640,
    totalWordsRead: 29500,
    streakDays: 19,
    leagueTier: 'Sapphire',
    currentBookTitle: 'Die Verwandlung',
    currentBookLang: 'de',
    isFollowing: false,
  },
  {
    id: 'u-4',
    name: 'Marco Bellini',
    handle: '@bellini_firenze',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    wordsReadThisWeek: 2150,
    totalWordsRead: 22800,
    streakDays: 14,
    leagueTier: 'Gold',
    currentBookTitle: 'Le Avventure di Pinocchio',
    currentBookLang: 'it',
    isFollowing: false,
  },
  {
    id: 'u-5',
    name: 'Deniz Yılmaz',
    handle: '@deniz_istanbul',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&auto=format&fit=crop&q=80',
    wordsReadThisWeek: 1840,
    totalWordsRead: 17600,
    streakDays: 9,
    leagueTier: 'Gold',
    currentBookTitle: 'Semaver ve Ada Hikâyeleri',
    currentBookLang: 'tr',
    isFollowing: false,
  },
  {
    id: 'u-6',
    name: 'Arthur Sterling',
    handle: '@sterling_oxford',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    wordsReadThisWeek: 1420,
    totalWordsRead: 15300,
    streakDays: 7,
    leagueTier: 'Silver',
    currentBookTitle: 'Walden: Life in the Woods',
    currentBookLang: 'en',
    isFollowing: false,
  },
];
