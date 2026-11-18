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

En efecto, rematado ya su juicio, vino a dar en el más estraño pensamiento que jamás dio loco en el mundo, y fue que le pareció convenible y necesario, así para el aumento de su honra como para el servicio de su república, hacerse caballero andante, y irse por todo el mundo con sus armas y caballo a buscar las aventuras y a ejercitarse en todo aquello que él había leído que los caballeros andantes se ejercitaban, deshaciendo todo género de agravio.`,
      `Limpias, pues, sus armas, hecho del morrión celada, puesto nombre a su rocín y confirmándose a sí mismo, se dio a entender que no le faltaba otra cosa sino buscar una dama de quien enamorarse; porque el caballero andante sin amores era árbol sin hojas y sin fruto y cuerpo sin alma.

Y así, en un lugar cerca del suyo había una moza labradora de muy buen parecer, a quien él un tiempo anduvo enamorado, aunque, según se entiende, ella jamás lo supo ni le dio cata dello. Llamábase Aldonza Lorenzo, y a ésta le pareció ser bien darle título de señora de sus pensamientos; y, buscándole nombre que no desdijese mucho del suyo, vino a llamarla Dulcinea del Toboso, porque era natural del Toboso.`,
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

Las cosas que dependen de nosotros son por naturaleza libres, sin impedimentos ni trabas; las que no dependen de nosotros son débiles, esclavas, sujetas a obstáculos y ajenas.`,
      `Recuerda, por tanto, que si consideras libre aquello que es esclavo por naturaleza, y como propio lo que pertenece a otros, hallarás tropiezos a cada paso, te lamentarás, vivirás turbado y culparás a los dioses y a los hombres.

Por el contrario, si sólo consideras tuyo lo que verdaderamente es tuyo, y ajeno lo que en realidad pertenece a otros, nadie te forzará jamás, nadie te pondrá impedimentos, no culparás a nadie ni acusarás a persona alguna. Jamás actuarás contra tu voluntad, ningún enemigo te dañará, pues nada perjudicial te podrá sobrevenir.`,
      `No pretendas que las cosas ocurran como tú quieres, sino desea que todo suceda tal como sucede, y serás feliz. La enfermedad es un estorbo para el cuerpo, pero no para la voluntad, a menos que ella misma lo consienta.

Ante cualquier apariencia perturbadora, recuerda decirte de inmediato: «Eres sólo una impresión y en modo alguno lo que aparentas ser». Examínala después con la regla suprema: ¿pertenece a lo que depende de nosotros o a lo que no depende de nosotros? Y si es ajeno, ten a mano la respuesta: «Nada me importa».`,
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
— Dessine-moi un mouton...`,
      `J'ai sauté sur mes pieds comme si j'avais été frappé par la foudre. J'ai bien frotté mes yeux. J'ai bien regardé. Et j'ai vu un petit bonhomme tout à fait extraordinaire qui me considérait gravement.

Voilà le meilleur portrait que, plus tard, j'ai réussi à faire de lui. Mais mon dessin, bien sûr, est beaucoup moins ravissant que le modèle. Ce n'est pas ma faute. J'avais été découragé dans ma carrière de peintre par les grandes personnes, à l'âge de six ans, et je n'avais rien appris à dessiner, sauf les boas fermés et les boas ouverts.

Je regardai donc cette apparition avec des yeux tout ronds d'étonnement. N'oubliez pas que je me trouvais à mille milles de toute région habitée.`
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
      `L'homme n'est qu'un roseau, le plus faible de la nature; mais c'est un roseau pensant. Il ne faut pas que l'univers entier s'arme pour l'écraser: une vapeur, une goutte d'eau, suffit pour le tuer. Mais, quand l'univers l'écraserait, l'homme serait encore plus noble que ce qui le tue, puisqu'il sait qu'il meurt, et l'avantage que l'univers a sur lui, l'univers n'en sait rien.`,
      `Toute notre dignité consiste donc en la pensée. C'est de là qu'il faut nous relever et non de l'espace et de la durée, que nous ne saurions remplir. Travaillons donc à bien penser: voilà le principe de la morale.

Le silence éternel de ces espaces infinis m'effraie. Combien de royaumes nous ignorent! La mémoire la plus étendue n'est qu'un court moment dans l'éternité des temps.`,
      `L'homme est visiblement fait pour penser; c'est toute sa dignité et tout son mérite; et tout son devoir est de penser comme il faut. Or l'ordre de la pensée est de commencer par soi, et par son auteur et sa fin.

Le cœur a ses raisons que la raison ne connaît point; on le sait en mille choses. Je dis que le cœur aime l'être universel naturellement, et soi-même naturellement, selon qu'il s'y adonne.`,
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
      `Als Gregor Samsa eines Morgens aus unruhigen Träumen erwachte, fand er sich in seinem Bett zu einem ungeheuren Ungeziefer verwandelt. Er lag auf seinem panzerartig harten Rücken und sah, wenn er den Kopf ein wenig hob, seinen gewölbten, braunen, von bogenförmigen Versteifungen geteilten Bauch, auf dessen Höhe sich die Bettdecke, zum gänzlichen Niedergleiten bereit, kaum noch erhalten konnte. Seine vielen, im Vergleich zu seinem sonstigen Umfang kläglich dünnen Beine flimmerten ihm hilflos vor den Augen.`,
      `»Was ist mit mir geschehen?« dachte er. Es war kein Traum. Sein Zimmer, ein richtiges, nur etwas zu kleines Menschenzimmer, lag ruhig zwischen den vier wohlbekannten Wänden. Über dem Tisch, auf dem eine aufgespannte Musterkollektion von Tuchwaren ausgebreitet war — Samsa war Reisender —, hing das Bild, das er vor kurzem aus einer illustrierten Zeitschrift ausgeschnitten und in einen hübschen, vergoldeten Rahmen getan hatte.`,
      `Gregors Blick richtete sich dann zum Fenster, und das trübe Wetter — man hörte Regentropfen auf das Fensterblech aufschlagen — machte ihn ganz melancholisch. »Wie wäre es, wenn ich noch ein wenig weiterschliefe und alle Verrücktheiten vergäße«, dachte er, aber das war gänzlich unausführbar, denn er war gewohnt, auf der rechten Seite zu schlafen, konnte sich aber in seinem gegenwärtigen Zustand nicht in diese Lage bringen.`,
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
      `Als Zarathustra dreißig Jahre alt war, verließ er seine Heimat und den See seiner Heimat und ging in das Gebirge. Hier genoß er seines Geistes und seiner Einsamkeit und wurde dessen zehn Jahre nicht müde. Endlich aber wandelte sich sein Herz, — und eines Morgens stand er mit der Morgenröthe auf, trat vor die Sonne hin und sprach zu ihr also:`,
      `»Du großes Gestirn! Was wäre dein Glück, wenn du nicht Die hättest, welchen du leuchtest! Zehn Jahre kamst du hier herauf zu meiner Höhle: du würdest deines Lichtes und dieses Weges satt geworden sein, ohne mich, meinen Adler und meine Schlange. Aber wir warteten deiner an jedem Morgen, nahmen dir deinen Überfluß ab und segneten dich dafür.`,
      `Siehe! Ich bin meiner Weisheit überdrüssig, wie die Biene, die des Honigs zu viel gesammelt hat, ich bedarf der Hände, die sich ausstrecken. Ich möchte verschenken und austheilen, bis die Weisen unter den Menschen wieder einmal ihrer Narrheit und die Armen einmal ihres Reichthums froh geworden sind.«`,
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

Non era un legno di lusso, ma un semplice pezzo da catasta, di quelli che d'inverno si mettono nelle stufe e nei caminetti per accendere il fuoco e per riscaldare le stanze.`,
      `Non so come andasse, ma il fatto gli è che un bel giorno questo pezzo di legno capitò nella bottega di un vecchio falegname, il quale aveva nome mastro Antonio, se non che tutti lo chiamavano maestro Ciliegia, per via della punta del suo naso, che era sempre lustra e paonazza, come una ciliegia matura.

Appena maestro Ciliegia ebbe visto quel pezzo di legno, si rallegrò tutto e dandosi una fregatina di mani per la contentezza, borbottò a mezza voce:
— Questo legno è capitato a tempo: voglio servirmene per fare una gamba di tavolino.`,
      `Detto fatto, prese subito la scure arrotata per cominciare a levargli la scorza e a digrossarlo; ma quando fu lì per rifilargli il primo colpo, rimase col braccio sospeso in aria, perché sentì una vocina sottile sottile, che disse raccomandandosi:
— Non mi picchiar tanto forte!

Figuratevi come rimase quel buon vecchio di maestro Ciliegia! Girò gli occhi smarriti intorno alla stanza per vedere di dove mai poteva essere uscita quella vocina, e non vide nessuno!`,
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
      `Tutti gli stati, tutti e' dominii che hanno avuto e hanno imperio sopra gli uomini, sono stati e sono o repubbliche o principati. E' principati sono o ereditarii, de' quali el sangue del loro signore ne sia suto lungo tempo principe, o e' sono nuovi. E' nuovi, o e' sono nuovi tutti, come fu Milano a Francesco Sforza, o e' sono come membri aggiunti allo stato ereditario del principe che gli acquista, come è el regno di Napoli al re di Spagna.`,
      `Non mi è incognito come molti hanno avuto e hanno opinione che le cose del mondo sieno in modo governate dalla fortuna e da Dio, che gli uomini con la prudenzia loro non possino correggerle, né vi abbino rimedio alcuno; e per questo potrebbono giudicare che non fusse da insudare molto nelle cose, ma lasciarsi governare alla sorte.`,
      `Nondimanco, perché el nostro libero arbitrio non sia spento, iudico potere essere vero che la fortuna sia arbitra della metà delle azioni nostre, ma che la ci lasci governare l'altra metà, o presso, a noi. E assomiglio quella a uno di questi fiumi rovinosi, che quando s'adirano allagano e' piani, rovinano gli alberi e gli edificii.`,
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
— Ben de biliyorum tutmayacağını, ama ya tutarsa?`,
      `Başka bir gün Hoca çarşıda kaybettiği yüzüğünü sokak lambasının altında arıyormuş. Komşusu sormuş:
— Hoca, yüzüğü nerede düşürdün?
— Evin bodrumunda düşürdüm.
— Peki neden burada arıyorsun?
Hoca cevap vermiş:
— Bodrum karanlıktı, burası ise aydınlık!`,
      `Bir akşam komşusu Hoca'nın kapısını çalıp kazanını ödünç istemiş. Hoca seve seve vermiş. Birkaç gün sonra komşusu kazanı geri getirmiş ama içinde küçük bir tencere varmış. Hoca şaşırıp sormuş:
— Bu küçük tencere nedir?
— Müjde Hoca, senin kazan doğurdu! demiş komşu. Hoca da gülümseyerek kabul etmiş. Bir ay sonra komşusu kazanı tekrar istemiş, fakat aylar geçse de geri getirmemiş. Hoca kapısına gidip kazanını sorunca komşu üzgün bir sesle:
— Başın sağ olsun Hoca, senin kazan öldü! demiş. Hoca hiç bozuntuya vermeden şu cevabı vermiş:
— Doğurduğuna inanan, öldüğüne de inanır elbet!`,
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
      `Ali, sabahın erken saatinde uyandı. Annesi mutfakta semaveri yakmıştı. Semaverin sesi, evin içine tatlı bir huzur yayıyordu. Çinko semaverin bacasından çıkan ince mavi duman, açık pencereden serin sabah havasına karışıyordu. Ali için sabah kahvaltısı sadece bir yemek değil, yeni başlayan günün en temiz başlangıcıydı.`,
      `Fabrikaya gitmeden önce annesinin elini öptü. Haliç boyunca uzanan taş sokaklardan yürürken balıkçıların seslerini dinledi. Denizin üstünde martılar süzülüyor, sabah güneşi kubbelere ve minarelere altın sarısı bir ışık bırakıyordu. İnsanları sevmekle başlıyordu her şey; bunu kalbinin ta derininde hissediyordu.`,
      `Burgazada’nın çam kokulu yamaçlarından aşağıya inerken rüzgâr yüzüne vurdu. Küçük kahvenin önünde oturan ihtiyar balıkçılar çaylarını yudumluyor, uzaklardaki vapur düdükleri İstanbul sabahını selamlıyordu. Her yüzün ardında anlatılmayı bekleyen sade, sıcak ve sahici bir hikâye saklıydı.`,
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
      `To Sherlock Holmes she is always the woman. I have seldom heard him mention her under any other name. In his eyes she eclipses and predominates the whole of her sex. It was not that he felt any emotion akin to love for Irene Adler. All emotions, and that one particularly, were abhorrent to his cold, precise but admirably balanced mind. He was, I take it, the most perfect reasoning and observing machine that the world has seen, but as a lover he would have placed himself in a false position.`,
      `He never spoke of the softer passions, save with a gibe and a sneer. They were admirable things for the observer — excellent for drawing the veil from men’s motives and actions. But for the trained reasoner to admit such intrusions into his own delicate and finely adjusted temperament was to introduce a distracting factor which might throw a doubt upon all his mental results.`,
      `Grit in a sensitive instrument, or a crack in one of his own high-power lenses, would not be more disturbing than a strong emotion in a nature such as his. And yet there was but one woman to him, and that woman was the late Irene Adler, of dubious and questionable memory.`,
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
      `When first I took up my abode in the woods, that is, began to spend my nights as well as days there, which, by accident, was on Independence Day, or the Fourth of July, 1845, my house was not finished for winter, but was merely a defence against the rain, without plastering or chimney, the walls being of rough, weather-stained boards, with wide chinks, which made it cool at night.`,
      `The upright white hewn studs and freshly planed door and window casings gave it a clean and airy look, especially in the morning, when its timbers were saturated with dew, so that I fancied that by noon some sweet gum would exude from them. To my imagination it retained throughout the day more or less of this auroral character, reminding me of a certain house on a mountain which I had visited a year before.`,
      `This was an airy and unplastered cabin, fit to entertain a travelling god, and where a goddess might trail her garments. The winds which passed over my dwell were such as sweep over the ridges of mountains, bearing the broken strophes, or only the celestial parts, of terrestrial music.`,
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
      `La curiosidad es el primer motor del progreso intelectual. Quien contempla los fenómenos de la naturaleza sin asombro ni deseo de penetrar sus arcanos, renuncia a la más noble prerrogativa del espíritu humano. El investigador debe unir al entusiasmo juvenil la disciplina implacable del método; debe desconfiar de las verdades consagradas sin comprobación, y no aceptar jamás una afirmación sin someterla al crisol de la experiencia.`,
      `Los descubrimientos no son fruto del azar exclusivo, sino de la mente preparada que sabe reconocer la significación de lo inesperado. El sabio mira donde todos miran, pero ve lo que nadie ha visto. Cultivad, pues, el ojo observador y la paciencia del artífice que pule pacientemente su lente hasta discernir la verdad oculta en el tejido de la realidad.`,
      `No hay cuestiones pequeñas en la ciencia; los fenómenos que hoy parecen humildes e insignificantes encierran a menudo la clave de leyes universales. Quien persevera con humildad y rigor ante el microscopio o la página en blanco acaba por arrancar a la naturaleza secretos que iluminan generaciones enteras.`,
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
      `Y desde que vimos tantas ciudades y villas pobladas en el agua, y en tierra firme otras grandes poblaciones, y aquella calzada tan derecha y por nivel cómo iba a México, nos quedamos admirados, y decíamos que parecía a las cosas de encantamiento que cuentan en el libro de Amadís, por las grandes torres y cúes y edificios que tenían dentro en el agua, y todos de cal y canto.`,
      `Y aun algunos de nuestros soldados decían si aquello que veían si era entre sueños. Y no es de maravillar que yo lo escriba aquí de esta manera, porque hay mucho que ponderar en ello que no sé cómo lo cuente: ver cosas nunca oídas, ni vistas, ni aun soñadas como veíamos. Fuimos caminando por nuestra calzada adelante, viendo aquella multitud de canoas que venían por la laguna a vernos.`,
      `Luego que llegamos a la gran plaza, nos quedamos espantados de la multitud de gente y mercaderías que en ella había, y del gran concierto y regimiento que en todo tenían. Cada género de mercadurías estaba por sí, con sus asientos señalados y orden admirable.`,
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
      `Le 24 mai 1863, mon oncle, le professeur Lidenbrock, revint précipitamment vers sa petite maison située au numéro 19 de Königstrasse, l'une des plus anciennes rues du quartier de Hambourg. La bonne Marthe dut se croire fort en retard, car le dîner commençait à peine à chanter sur le fourneau de la cuisine. Mon oncle était un homme d'une science véritable, professeur de minéralogie et géologue passionné.`,
      `Il tenait entre ses mains un vieux bouquin inestimable, relié en veau jaune, dont il feuilletait les pages jaunies avec une délectation indicible. C'était un manuscrit runique islandais du douzième siècle. C'est dans ce volume étrange que nous allions découvrir le cryptogramme énigmatique d'Arne Saknussemm, nous invitant à descendre dans le cratère du volcan Sneffels pour atteindre le centre même du globe terrestre.`,
      `« Axel, s'écria mon oncle en frappant du poing la table couverte de minéraux rares, voici le secret qui bouleversera toutes les connaissances humaines! Prépare nos malles dès ce soir, car le chemin de l'Islande s'ouvre devant nous dès l'aube. »`,
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
      `Die Natur ist für den denkenden Geist Einheit in der Vielheit, Verbindung des Mannigfaltigen in Form und Mischung, Inbegriff der Naturdinge und Naturkräfte als ein lebendiges Ganzes. Das wichtigste Resultat des sinnlichen Forschens ist daher dieses: in der Mannigfaltigkeit die Einheit zu erfassen, das Einzelne aus dem Geiste des Ganzen zu begreifen.`,
      `Vom fernsten Nebelfleck im Himmelsraum bis zum feinsten Gewebe der organischen Schöpfung regt sich ein ununterbrochenes Band des Zusammenhanges. Wer mit offenem Sinne die Erdgesetze betrachtet, erkennt, wie die Erhebung der Gebirge das Klima bedingt, wie das Klima die Pflanzenwelt formt und wie der Mensch inmitten dieser ewigen Wechselwirkung seinen Platz findet.`,
      `Jede Zone der Erde offenbart ihre eigene Physiognomie, geformt durch das ewige Gleichgewicht von Licht, Wärme, Wasser und lebendigem Wachstum. Die wahre Wissenschaft vereint genaue Beobachtung mit der staunenden Ehrfurcht vor der Harmonie des Weltalls.`,
    ],
  },

  // SPANISH - Essays & Journalism
  {
    id: 'es-larra',
    title: 'Artículos de Costumbres (Vuelva usted mañana)',
    author: 'Mariano José de Larra',
    language: 'es',
    genre: 'essays',
    source: 'gutenberg',
    summary: 'Sátira brillante sobre la indolencia, la burocracia y la pereza nacional a través de las peripecias de un viajero extranjero.',
    wordCount: 1580,
    estimatedReadTimeMinutes: 7,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 17,
    currentChunkIndex: 0,
    chunks: [
      `Gran persona debió de ser el primero que llamó pecado mortal a la pereza. Nosotros, que ya en uno de nuestros artículos anteriores dijimos que la pereza era el pecado capital que más dominaba en nuestro país, habemos de volver a las andadas, porque de este pecado no se cura tan fácilmente el paciente.

Un extranjero vino a Madrid con el propósito de resolver ciertos negocios de familia y averiguar el estado de algunas propiedades. Traía cartas de recomendación para personas influyentes y un plan detallado de lo que pensaba hacer en quince días. Al verme, me expuso su proyecto: «En tres días veré al ministro, en cuatro consultaré a los letrados, en dos despacharemos los títulos y el resto del tiempo lo emplearé en visitar el Prado y los museos». Yo le miré con compasión y le dije: «Monsieur Sans-délai, quédese usted quince meses y acaso comience a ver el principio de sus asuntos».`,
      `Reíase el buen francés con aire de superioridad, creyendo que exageraba los defectos de mi patria. A la mañana siguiente marchamos a casa del letrado. Llegamos a las diez: el señor letrado aún no se había levantado. Volvimos a las doce: acababa de salir a paseo. A las tres comía; a las cinco descansaba de comer; a las seis había ido a la tertulia.

Al día siguiente logramos hablarle. Oyó el caso con semblante grave, hojeó los papeles por encima y con una calma olímpica nos dijo: «Vengan ustedes mañana, que hoy tengo que atender una diligencia urgente». Aquel «vuelva usted mañana» fue la primera campanada que comenzó a despertar a mi amigo de su sueño de celeridad.`,
      `Pasaron semanas enteras en idéntico peregrinaje. Si íbamos a las oficinas públicas, el oficial mayor estaba despachando, o tomando chocolate, o no era día de audiencia, o el expediente había pasado al negociado de al lado para cotejar una firma. En todas partes la misma respuesta invariable, la misma melodía desesperante: «Vuelva usted mañana».

Al cabo de seis meses, con los bolsillos más ligeros y la paciencia agotada, mi amigo Sans-délai vino a despedirse. «Tiene usted razón», me dijo compungido; «este país no se mueve con diligencia ni con razones; aquí la pereza es reina y señora, y su cetro es el perpetuo mañana».`,
    ],
  },

  // SPANISH - Short Stories & Legends
  {
    id: 'es-becquer',
    title: 'Leyendas: El Monte de las Ánimas',
    author: 'Gustavo Adolfo Bécquer',
    language: 'es',
    genre: 'stories',
    source: 'gutenberg',
    summary: 'La célebre leyenda gótica de Soria sobre la noche de difuntos, el honor caballeresco y el terror sobrenatural.',
    wordCount: 1620,
    estimatedReadTimeMinutes: 7,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 18,
    currentChunkIndex: 0,
    chunks: [
      `La noche de difuntos me despertó a no sé qué hora el doble de las campanas. Su tañido monótono y eterno me trajo a las mientes esta tradición que oí hace poco en Soria.

—Atad los perros; haced la señal con las trompas para que se reúnan los cazadores, y demos la vuelta a la ciudad. La noche se acerca, es día de Todos los Santos y estamos en el Monte de las Ánimas.

Así hablaba Alonso a su hermosa prima Beatriz, mientras los caballos espoleados cruzaban las orillas del Duero. Aquel monte, que llamaban de las Ánimas desde que los caballeros Templarios fueron degollados por los señores feudales de Soria, era evitado por todo el mundo en aquella fecha funesta. Las ánimas de los guerreros muertos, envueltas en jirones de sus sudarios, corrían como en una cacería infernal por entre las zarzas y los barrancos.`,
      `Ya en el palacio gótico de los condes de Alcudiel, sentados junto al fuego de la ancha chimenea, Alonso ofreció a su prima una joya como recuerdo de su despedida. Beatriz, indiferente y fría, contemplaba las brasas crepitantes.

—Hoy es día de Todos los Santos, y antes de que nos separemos quiero darte un recuerdo: una joya que sujetaba mi jubón en los torneos. Pero tú, prima, ¿no me dejas nada para llevar a la guerra?

La hermosa joven sonrió con fingida melancolía y murmuró:

—Te daría la banda azul que llevé hoy al cuello, pero la he perdido. La olvidé esta tarde en el Monte de las Ánimas, donde descalabró su caballo el escudero. Alonso palideció. La noche estaba cerrada, el viento aullaba entre los aleros y las campanas doblaban a muerto. Sin embargo, herido en su orgullo de caballero, se levantó en silencio, empuñó la espada y salió hacia la sombra.`,
      `Beatriz quedó a solas en su aposento. Pasaron las horas lentas y angustiosas. El reloj del postigo dio la medianoche. De pronto, un crujido sordo resonó en la alfombra; las cortinas del lecho se movieron sin viento alguno; se oían pasos apagados, respiraciones sofocadas y un rumor semejante al arrastrar de una tela húmeda por el pavimento.

La joven se acurrucó bajo las mantas, helada de espanto, rezando oraciones entrecortadas sin atreverse a abrir los ojos hasta que la claridad del alba penetró por los vitrales. Cuando por fin se atrevió a mirar la estancia desierta, lanzó un grito de pavor que conmovió todo el palacio: sobre el reclinatorio de ébano, desgarrada y teñida de sangre, yacía la banda azul perdida en el monte. Y ella, con los ojos desencajados y los labios blancos, cayó sin vida.`,
    ],
  },

  // FRENCH - History & Civil Society
  {
    id: 'fr-tocqueville',
    title: 'De la démocratie en Amérique',
    author: 'Alexis de Tocqueville',
    language: 'fr',
    genre: 'history',
    source: 'gutenberg',
    summary: 'Étude historique et politique pionnière sur l’avènement de l’égalité des conditions et les libertés publiques.',
    wordCount: 1640,
    estimatedReadTimeMinutes: 7,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 19,
    currentChunkIndex: 0,
    chunks: [
      `Parmi les objets nouveaux qui, pendant mon séjour aux États-Unis, ont attiré mon attention, aucun n'a plus vivement frappé mon regard que l'égalité des conditions. Je découvris sans peine l'influence prodigieuse qu'exerce ce premier fait sur la marche de la société; il donne à l'esprit public une certaine direction, un certain tour aux lois, des maximes nouvelles aux gouvernants et des habitudes particulières aux gouvernés.

Bientôt je reconnus que ce fait même s'étend bien au-delà des mœurs politiques et des lois, et qu'il n'a pas moins d'empire sur la société civile que sur le gouvernement: il crée des opinions, fait naître des sentiments, suggère des usages et modifie tout ce qu'il ne produit pas.`,
      `Lorsqu'on parcourt les pages de notre histoire, on ne rencontre pour ainsi dire pas de grands événements qui depuis sept cents ans n'aient tourné au profit de l'égalité. Les croisades et les guerres d'Angleterre déciment les nobles et divisent leurs terres; l'institution des communes introduit la liberté démocratique au sein de la monarchie féodale; l'invention des armes à feu égalise le vilain et le noble sur le champ de bataille; l'imprimerie offre des ressources égales à l'esprit de tous.

Le développement graduel de l'égalité des conditions est donc un fait providentiel; il en a les principaux caractères: il est universel, il est durable, il échappe chaque jour à la puissance humaine; tous les événements, comme tous les hommes, servent à son développement.`,
      `Vouloir arrêter la démocratie paraîtrait alors lutter contre Dieu même, et il ne resterait aux nations qu'à s'accommoder à l'état social que leur impose la Providence. Instruire la démocratie, ranimer s'il se peut ses croyances, purifier ses mœurs, régler ses mouvements, substituer peu à peu la science des affaires à son inexpérience, et l'art de gouverner à ses aveugles instincts.

Telle est la première des obligations imposées de nos jours à ceux qui dirigent la société. Il faut une science politique nouvelle à un monde tout nouveau; mais c'est à quoi nous ne songeons guère, placés au milieu d'un fleuve rapide, nous fixons obstinément les yeux vers quelques débris qu'on aperçoit encore sur le rivage, tandis que le courant nous entraîne et nous pousse à reculons vers des abîmes.`,
    ],
  },

  // FRENCH - Essays & Thought
  {
    id: 'fr-montaigne',
    title: 'Les Essais (De l’amitié et de l’expérience)',
    author: 'Michel de Montaigne',
    language: 'fr',
    genre: 'essays',
    source: 'gutenberg',
    summary: 'Méditations humanistes intemporelles sur la liberté intérieure, la véritable amitié et la connaissance de soi.',
    wordCount: 1520,
    estimatedReadTimeMinutes: 7,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 20,
    currentChunkIndex: 0,
    chunks: [
      `Si on me presse de dire pourquoi je l'aimais, je sens que cela ne se peut exprimer qu'en répondant: «Parce que c'était lui, parce que c'était moi». Il y a au-delà de tout mon discours, et de ce que j'en puis dire particulièrement, je ne sais quelle force inexplicable et fatale, médiatrice de cette union.

Nous nous cherchions avant que de nous être vus, et par des rapports que nous oyions l'un de l'autre, qui faisaient en notre affection plus d'effort que ne porte la raison des discours. Nous nous embrassions par nos noms; et à notre première rencontre, qui fut par hasard en une grande fête de ville, nous nous trouvâmes si pris, si connus, si obligés entre nous, que rien dès lors ne nous fut si proche que l'un à l'autre.`,
      `En l'amitié de quoi je parle, les âmes se mêlent et se confondent l'une en l'autre, d'un mélange si universel qu'elles effacent et ne retrouvent plus la couture qui les a jointes. Cette amitié n'a point d'autre idée que d'elle-même, et ne se peut rapporter qu'à soi. Ce n'est pas une spéciale considération, ni deux, ni trois, ni quatre, ni mille: c'est je ne sais quelle quintessence de tout ce mélange qui saisit toute ma volonté et la mena se plonger et se perdre dans la sienne.

Nos volontés propres ne sont plus nôtres; elles sont indivisibles: rien n'est réservé en commun, ni biens, ni pensées, ni jugements.`,
      `La grandeur de l'âme n'est pas tant de monter et de tirer avant, comme de savoir se ranger et circonscrire. Il n'est rien si beau et si légitime que de faire bien et dûment l'homme, ni science si ardue que de savoir bien et naturellement vivre cette vie; et de nos maladies la plus sauvage, c'est mépriser notre être.

Pour moi donc, j'aime la vie et la cultive telle qu'il a plu à Dieu nous l'octroyer. C'est une absolue perfection, et comme divine, de savoir jouir loyalement de son être. Nous cherchons d'autres conditions pour n'entendre pas l'usage des nôtres, et sortons hors de nous pour ne savoir quel temps il y fait.`,
    ],
  },

  // FRENCH - Short Stories
  {
    id: 'fr-maupassant',
    title: 'La Ficelle et Autres Contes Parisiens',
    author: 'Guy de Maupassant',
    language: 'fr',
    genre: 'stories',
    source: 'gutenberg',
    summary: 'Chef-d’œuvre de l’ironie tragique normande démontrant la fragilité de la réputation face aux préjugés.',
    wordCount: 1590,
    estimatedReadTimeMinutes: 7,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 21,
    currentChunkIndex: 0,
    chunks: [
      `Sur toutes les routes autour de Goderville, les paysans et leurs femmes s'en venaient vers le bourg; car c'était jour de marché. Les mâles allaient, à pas tranquilles, tout le corps en avant à chaque mouvement de leurs longues jambes torses, déformées par les rudes travaux du labour, par la pesée sur la charrue qui fait en même temps monter l'épaule gauche et dévier la taille.

Maître Hauchecorne, de Bréauté, venait d'arriver à Goderville, et il se dirigeait vers la place, quand il aperçut par terre un petit bout de ficelle. Maître Hauchecorne, économe en vrai Normand, pensa que tout était bon à ramasser qui peut servir; et il se baissa péniblement, car il souffrait de rhumatismes. Il prit le morceau de corde mince, et il se disposait à le rouler avec soin, quand il remarqua, sur le seuil de sa porte, maître Malandain, le bourrelier, qui le regardait.`,
      `Ils avaient eu des affaires ensemble autrefois au sujet d'un licol, et ils étaient restés fâchés, étant rancuniers tous les deux. Maître Hauchecorne fut pris d'une sorte de honte d'être vu ainsi par son ennemi, cherchant dans la crotte un bout de ficelle. Il cacha brusquement sa trouvaille sous sa blouse, puis dans la poche de sa culotte; puis il fit semblant de chercher encore par terre quelque chose qu'il ne trouvait pas, et il s'en alla vers le marché, la tête en avant, courbé en deux par ses douleurs.

Tout à coup le tambour roula dans la cour, devant l'auberge. Tout le monde fut debout aussitôt, et le crieur public lança d'une voix saccadée: «Il est fait savoir aux habitants qu'il a été perdu ce matin sur la route un portefeuille en cuir noir contenant cinq cents francs et des papiers d'affaires. Prière de le rapporter à la mairie».`,
      `Peu après, le brigadier de gendarmerie parut et demanda maître Hauchecorne pour le conduire chez le maire. Le maire l'attendait, assis dans son fauteuil.

— Maître Hauchecorne, vous avez été vu ce matin ramassant le portefeuille perdu par maître Houlbrèque.

Le vieux paysan, stupéfait, suffoqua d'indignation:

— Moi? Moi? J'ai ramassé ce portefeuille? Parole d'honneur, je n'en ai point eu connaissance!

— On vous a vu, répliqua le maire. Maître Malandain, le bourrelier, vous a vu ramasser l'objet et fouiller la boue.

Hauchecorne tira de sa poche le misérable bout de corde: «Mais tenez, monsieur le maire, c'est la vérité du bon Dieu! Voilà la ficelle!» Rien n'y fit; personne ne voulut le croire. On riait de son histoire de ficelle, et cette injustice lui rongea le cœur jusqu'à son dernier jour.`,
    ],
  },

  // GERMAN - History & Chronicle
  {
    id: 'de-schiller',
    title: 'Geschichte des Dreißigjährigen Kriegs',
    author: 'Friedrich Schiller',
    language: 'de',
    genre: 'history',
    source: 'gutenberg',
    summary: 'Dramatische Geschichtsschreibung über Glaubensspaltung, Reichsverfassung und die Schrecken des europäischen Krieges.',
    wordCount: 1610,
    estimatedReadTimeMinutes: 7,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 22,
    currentChunkIndex: 0,
    chunks: [
      `Seit dem Anfang des Religionskrieges in Deutschland bis zum Münsterischen und Osnabrückischen Frieden ist im europäischen Staatensystem kaum etwas Großes und Merkwürdiges geschehen, woran die Reformation nicht den vorzüglichsten Anteil gehabt hätte. Alle Weltbegebenheiten, die sich in diesem Zeitraum ereigneten, schließen sich an die Glaubensverbesserung an, wenn sie nicht gar daraus entsprungen sind, und jeder noch so große Staat hat mehr oder weniger, mittelbar oder unmittelbar, ihren Einfluß empfunden.

Fast der ganze Gebrauch, den das spanische Haus von seinen ungeheuren Schätzen machte, war gegen die neuen Meinungen oder gegen deren Bekenner gerichtet. Die Reformation spaltete Fürsten und Völker; sie riss alte Bündnisse auseinander und stiftete neue Verbrüderungen zwischen fernen Reichen.`,
      `Ein furchtbarer Vernichtungskrieg verheerte von den Ufern der Donau bis an das Baltische Meer die blühendsten Länder, entvölkerte Städte, vertilgte den Fleiß der Werkstätten und das Glück der Familien. Gustav Adolf von Schweden erschien als Retter des bedrängten protestantischen Glaubens im Norden.

Sein Eintritt in das Reich veränderte mit einem Schlage das ganze Kriegstheater. Wo zuvor Raub und Zügellosigkeit geherrscht hatten, führte er strenge Mannszucht und gottesfürchtigen Ernst ein. Bei Breitenfeld zerschlug er die bis dahin unbesiegten Heere der Liga, und der Name des Königs erfüllte ganz Europa mit Bewunderung und Schrecken.`,
      `Aber das Schicksal hemmte seinen glorreichen Lauf auf den Feldern von Lützen. Im dichten Nebel des Novembermorgens trafen die kaiserlichen Scharen unter Wallenstein und die schwedischen Brigaden aufeinander. Gustav Adolf fiel im heißesten Getümmel, von feindlichen Kugeln durchbohrt, doch sein Geist beseelte die Krieger noch im Tode zum Siege.

Der Dreißigjährige Krieg lehrte die Völker Europas durch unsagbares Leiden eine teure Lektion: dass kein Schwert das Gewissen bezwingen kann und wahrhafter Friede nur auf gegenseitiger Duldung und rechtlicher Ordnung ruht.`,
    ],
  },

  // GERMAN - Essays & Philosophy of Life
  {
    id: 'de-schopenhauer',
    title: 'Aphorismen zur Lebensweisheit',
    author: 'Arthur Schopenhauer',
    language: 'de',
    genre: 'essays',
    source: 'gutenberg',
    summary: 'Scharfsinnige Betrachtungen über Persönlichkeit, inneren Reichtum, Einsamkeit und das Glück des Geistes.',
    wordCount: 1540,
    estimatedReadTimeMinutes: 7,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 23,
    currentChunkIndex: 0,
    chunks: [
      `Aristoteles teilt die Güter des menschlichen Lebens in drei Klassen: die äußeren, die der Seele und die des Körpers. Ich behalte bloß die Einteilung in drei Hauptbestimmungen bei. Was einer ist: also die Persönlichkeit im weitesten Sinne, Gesundheit, Kraft, Schönheit, moralischer Charakter, Geist und dessen Ausbildung. Was einer hat: also Eigentum und Besitz jeder Art. Was einer vorstellt: worunter man versteht, was er in den Augen anderer ist, also Ehre, Rang und Ruhm.

Das, was einer an sich selber ist, was ihn in seine Einsamkeit begleitet und was keiner ihm geben oder nehmen kann, ist offenbar für sein Wohlbefinden wesentlicher als alles, was er besitzen, oder was er in den Augen anderer sein mag.`,
      `Ein geistreicher Mensch hat in gänzlicher Einsamkeit an seinen eigenen Gedanken und Phantasien die trefflichste Unterhaltung, während von einem Stumpfen die fortwährende Abwechslung von Gesellschaften, Schauspielen, Spazierfahrten und Lustbarkeiten die marternde Langeweile nicht abzuwehren vermag. Ein guter, mäßiger, sanfter Charakter kann unter dürftigen Umständen zufrieden sein; während ein begehrlicher, neidischer und böser es bei allem Reichtum nicht ist.

Wer den steten Genuss einer außerordentlichen, geistig hervorragenden Individualität besitzt, bedarf der meisten Vergnügungen, wie sie die Menge sucht, ganz und gar nicht; sie sind ihm sogar bloß lästig und störend.`,
      `Daher beruht das höchste und dauerhafteste Glück auf dem, was man im eigenen Innern vorfindet. Je mehr nun einer an sich selbst hat, desto weniger bedarf er von außen und desto weniger können auch die übrigen ihm sein. Darum führt die Überlegenheit des Geistes zur Ungeselligkeit.

Wahres Glück ist ein Zustand innerer Autarkie. Man muss sich selbst genügen können; denn alle äußeren Quellen des Glücks und des Genusses sind ihrer Natur nach höchst unsicher, misslich, vergänglich und dem Zufall unterworfen.`,
    ],
  },

  // GERMAN - Folk Tales & Fables
  {
    id: 'de-grimm',
    title: 'Kinder- und Hausmärchen',
    author: 'Brüder Grimm',
    language: 'de',
    genre: 'stories',
    source: 'gutenberg',
    summary: 'Klassische deutsche Märchen über Mut, Treue, List und den Triumph des Guten über finstere Mächte.',
    wordCount: 1570,
    estimatedReadTimeMinutes: 7,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 24,
    currentChunkIndex: 0,
    chunks: [
      `Es hatte ein Mann einen Esel, der schon lange Jahre die Säcke unverdrossen zur Mühle getragen hatte, dessen Kräfte aber nun zu Ende gingen, so dass er zur Arbeit immer untauglicher ward. Da dachte der Herr daran, ihn aus dem Futter zu schaffen, aber der Esel merkte, dass kein guter Wind wehte, lief fort und machte sich auf den Weg nach Bremen: dort, dachte er, kannst du ja Stadtmusikant werden.

Als er ein Weilchen fortgegangen war, fand er einen Jagdhund auf dem Wege liegen, der jappte wie einer, der sich müde gelaufen hat. »Nun, warum jappst du so, Packan?« fragte der Esel. »Ach«, sagte der Hund, »weil ich alt bin, jeden Tag schwächer werde und auch nicht mehr auf die Jagd kann, wollte mich mein Herr totschlagen; da habe ich Reißaus genommen; aber womit soll ich nun mein Brot verdienen?« »Weißt du was«, sprach der Esel, »ich gehe nach Bremen und werde dort Stadtmusikant, geh mit und lass dich auch bei der Musik annehmen.« Der Hund war es zufrieden, und sie gingen weiter.`,
      `Nicht lange, so saß da eine Katze an dem Weg und machte ein Gesicht wie drei Tage Regenwetter. »Nun, was ist dir in die Quere gekommen, alter Bartputzer?« fragte der Esel. »Wer kann da lustig sein, wenn es einem an den Kragen geht«, antwortete die Katze; »weil ich nun zu Jahren komme, meine Zähne stumpf werden und ich lieber hinter dem Ofen sitze und spinne, als nach Mäusen herumeile, hat mich meine Frau ersäufen wollen. Wo soll ich nun hin?« »Geh mit uns nach Bremen, du verstehst dich doch auf die Nachtmusik, du kannst ein Stadtmusikant werden.« Die Katze hielt das für gut und ging mit.

Darauf kamen die drei Ausreißer an einem Hof vorbei; da saß auf dem Tor der Haushahn und schrie aus Leibeskräften: »Kikeriki!« »Was schreist du so?« sprach der Esel. »Die Hausfrau hat der Köchin befohlen, mir heute Abend den Kopf abzuschlagen, morgen am Sonntag wollen sie mich in der Suppe essen. Nun schrei ich aus vollem Hals, solang ich noch kann.« »Ei was, Rotkopf«, sagte der Esel, »zieh lieber mit uns fort. Etwas Besseres als den Tod findest du überall!« Der Hahn ließ sich den Vorschlag gefallen, und sie gingen alle vier zusammen fort.`,
      `Sie konnten aber die Stadt Bremen an einem Tag nicht erreichen und kamen abends in einen Wald, wo sie übernachten wollten. Der Esel und der Hund legten sich unter einen großen Baum, die Katze und der Hahn stiegen in die Äste hinauf. Da sah der Hahn in der Ferne ein Fünkchen brennen und rief seinen Gesellen zu, es müsse nicht weit ein Haus sein, denn es scheine ein Licht.

Sie machten sich auf den Weg und gelangten an ein wohl erleuchtetes Räuberhaus. Da stellten sie sich aufeinander: der Esel stellte sich mit den Vorderfüßen auf das Fenster, der Hund sprang auf des Esels Rücken, die Katze kletterte auf den Hund, und der Hahn flog hinauf und setzte sich der Katze auf den Kopf. Auf ein Zeichen fingen sie alle zugleich an, ihre Musik zu machen: der Esel schrie, der Hund bellte, die Katze miaute und der Hahn krähte; dann stürzten sie durchs Fenster in die Stube, dass die Scheiben klirrten. Die Räuber flohen in panischem Schrecken, und die vier Musikanten setzten sich an die Tafel und aßen nach Herzenslust.`,
    ],
  },

  // ITALIAN - Philosophy & Moral Inquiries
  {
    id: 'it-leopardi',
    title: 'Operette morali',
    author: 'Giacomo Leopardi',
    language: 'it',
    genre: 'philosophy',
    source: 'gutenberg',
    summary: 'Profondi dialoghi filosofici e satirici sulla natura, l’illusione, il dolore e la ricerca della serenità.',
    wordCount: 1560,
    estimatedReadTimeMinutes: 7,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 25,
    currentChunkIndex: 0,
    chunks: [
      `A un Islandese, che era corso per la maggior parte del mondo e soggiornato in diversissime contrade, venne per sorte di abbattersi in una figura smisurata di donna, seduta in terra, col dosso appoggiato a una montagna, viva e di tratto magnifico e insieme terribile. La quale, vedutolo fermo per maraviglia, disse:

— Chi sei? che cerchi in questi luoghi dove la tua specie era incognita?

Rispose l'Islandese:

— Sono un povero Islandese, che vo fuggendo la Natura; e fuggitala quasi tutto il tempo della mia vita per cento parti della terra, la fuggo adesso per questa.

Disse la donna:

— Così fugge lo scoiattolo dal serpente a sonaglio, finché gli cade in gola da se medesimo. Io sono quella che tu fuggi.`,
      `— La Natura? — esclamò l'Islandese.

— Quella appunto, — replicò la figura. — Credevi tu forse che il mondo fosse fatto per voi altri uomini? Ora sappi che nelle fatture mie, negli ordini e nelle operazioni, eccetto pochissime, io non ebbi mai pensiero agli uomini; e quando anche mi avvenisse di estinguere tutta la vostra specie, io non me ne avvedrei.

Disse allora l'Islandese:

— Poniamo il caso che uno m'invitasse spontaneamente a una sua villa, e io per compiacerlo vi andassi. Quivi mi fosse dato per dimora un luogo diruto, dove fossi continuamente in pericolo di essere schiacciato; esposto al gelo, alle piogge, ai venti furiosi. Se quel signore mi dicesse: «Non ho fatto questa villa per te», non gli risponderei io: «Potevi fare a meno d'invitarmi»?`,
      `— Immagini tu forse — rispose la Natura — che la vita di quest'universo sia un trastullo? La vita è un perpetuo circuito di produzione e distruzione, collegate ambedue tra sé in modo che ciascuna serve continuamente all'altra, e alla conservazione del mondo; il quale, se cessasse o l'una o l'altra, verrebbe parimente in dissoluzione.

Così rimasero a disputare l'Islandese e la gran signora; e mentre cercavano il perché dell'umano patire, due leoni affamati giunsero di soppiatto e divorarono il viaggiatore, ristorandosi per quella giornata; mentre altri dicono che levatosi un fiero vento, lo ricoperse di sabbia, e vi si mantenne mummia per lungo tempo.`,
    ],
  },

  // ITALIAN - History & Renaissance Biographies
  {
    id: 'it-vasari',
    title: 'Le vite de\' più eccellenti pittori, scultori, e architettori',
    author: 'Giorgio Vasari',
    language: 'it',
    genre: 'history',
    source: 'gutenberg',
    summary: 'La cronaca fondamentale delle rivoluzioni artistiche, del genio e della rinascita delle arti in Italia.',
    wordCount: 1630,
    estimatedReadTimeMinutes: 7,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 26,
    currentChunkIndex: 0,
    chunks: [
      `Grandissimo debito per vero hanno con la natura coloro che con fatica e con l'ingegno s'adoperano per levare dall'oscurità le cose illustri e dar loro luce e fama perpetua. Vedendo io le memorie de' virtuosi artefici quasi del tutto sommerse dal tempo e dalla pigrizia degli uomini, presi fatica di raccogliere in questo volume le vite di coloro che da Cimabue in qua hanno fatto risorgere le tre arti del disegno: architettura, pittura e scultura.

Conobbe la Toscana per suo favore nascere in Firenze ingegni divini, tra i quali Giotto, che per solo dono di natura seppe abbandonare la rozza maniera greca e resuscitare la buona e moderna pittura, ritraendo le cose vive e naturali.`,
      `Venne poi Lionardo da Vinci, nel quale oltre alla bellezza del corpo, non lodata mai a bastanza, era una grazia più che infinita in qualunque sua azione, e tanta virtù d'ingegno che a qualunque cosa difficile voltava l'animo, facilissimamente la dava a perfezione.

Egli cominciò e condusse a termine la stupenda tavola dell'Ultima Cena nel refettorio delle Grazie a Milano, dando alle teste degli apostoli tanta maestà e bellezza che quella di Cristo lasciò imperfetta, non credendo poterle dare quella divinità celeste che alla persona di Dio conveniva. La sua mente speculativa investigò i secreti dell'anatomia, del volo degli uccelli, dell'idraulica e dell'ottica.`,
      `Ma sopra tutti rifulse Michelangelo Buonarroti, mandato da Dio in terra acciò che solo fusse bastante a mostrare che cosa sia la perfezione nell'arte dello scarpello, del pennello e del compasso. Quando egli scoperse la volta della cappella Sistina a Roma, tutto il mondo v'accorse stupito e muto.

Né fu alcuno scultore, antico o moderno, che vincesse il suo David o la pietà di marmo in San Pietro. Concluse l'architettura col disegno immortale della gran cupola vaticana. Onde ben si può affermare che le sue opere hanno superato non pur i moderni, ma gli antichi medesimi.`,
    ],
  },

  // ITALIAN - Short Stories & Tales
  {
    id: 'it-boccaccio',
    title: 'Il Decameron: Novelle Scelte',
    author: 'Giovanni Boccaccio',
    language: 'it',
    genre: 'stories',
    source: 'gutenberg',
    summary: 'Celebri novelle trecentesche sull’ingegno, i casi di fortuna, l’arguzia e i costumi della civiltà fiorentina.',
    wordCount: 1650,
    estimatedReadTimeMinutes: 7,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 27,
    currentChunkIndex: 0,
    chunks: [
      `Quantunque volte, graziosissime donne, meco pensando io riguardo quanto voi naturalmente tutte siate pietose, tante conosco che la presente opera nella sua fronte avrà grave e noioso principio, sì come è la dolorosa memoria della pestifera mortalità trapassata. Ma non voglio che questo vi spaventi di più innanzi leggere, quasi come sempre tra sospiri e lagrime leggendo dobbiate passare.

Questo orrido cominciamento non fia altrimenti a voi che a' camminatori una aspra e faticosa montagna, oltre alla quale un bellissimo piano e dilettevole si nasconde. Racconterò dunque di quei sette giovani donne e tre gentiluomini che in una bella villa fiesolana si rifugiarono per passar piacevolmente il tempo con racconti onesti.`,
      `Tra le novelle della prima giornata piacque quella di Melchisedech giudeo e del Saladino. Il Saladino, il cui valore fu tanto che d'umile uomo lo fece sultano d'Egitto, avendo in varie guerre consumato tutto il suo tesoro e abbisognando d'una gran somma di danari, si ricordò d'un ricco giudeo che prestava a usura in Gostantinopoli.

Fattolsi chiamare, gli propose una questione per coglierlo in fallo e costringerlo a sborsare: «Uomo dabbene, dimmi: qual delle tre leggi tu reputi la verace: la giudaica, la saracina o la cristiana?» Il giudeo, savio uomo, sentì il laccio e rispose con una parabola sottilissima.`,
      `«Signor mio, fu già un ricco uomo che possedeva un anello bellissimo e di gran pregio, per virtù del quale chiunque lo portasse era tenuto caro da tutta la sua casa. Egli stabilì che quel figliuolo a cui l'anello rimanesse fusse lerede di tutto il suo patrimonio.

Avendo tre figliuoli parimenti virtuosi e obbedienti, e non sapendo a chi lasciarlo, fece fare a un sottilissimo maestro altri due anelli sì simili al primo che neppur lui li distingueva; e morendo diede segretamente a ciascun figlio il suo anello. Ciascuno si credette erede; ma quale anello fusse il vero non si poté mai sapere: e così delle tre leggi date da Dio ai popoli: ciascuno si crede la sua eredità legittima, ma qual sia la vera resta ancora pendente». Il Saladino, ammirata tanta sagacia, gli aprì il suo bisogno e ne fu lautamente servito, restandogli amico per sempre.`,
    ],
  },

  // ITALIAN - Science & Astronomy
  {
    id: 'it-galileo',
    title: 'Dialogo sopra i due massimi sistemi del mondo',
    author: 'Galileo Galilei',
    language: 'it',
    genre: 'science',
    source: 'gutenberg',
    summary: 'L’opera cardine della rivoluzione scientifica sul moto della Terra e l’evidenza telescopica dell’universo.',
    wordCount: 1580,
    estimatedReadTimeMinutes: 7,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 28,
    currentChunkIndex: 0,
    chunks: [
      `SALVIATI: Venite pur su con le ragioni e con le dimostrazioni, vostre o d'Aristotile, e non con testi e con nude autorità, perché i discorsi nostri hanno a essere intorno al mondo sensibile, e non sopra un mondo di carta.

Voi dite che la Terra è immobile perché altrimenti gli uccelli e le cose scagliate in alto rimarrebbero indietro rispetto al moto diurno del globo. Ma rinchiudetevi con qualche amico nella maggior stanza che sia sotto coverta di una gran nave, e fate d'averci mosche, farfalle e simili animaletti volanti; siavi anco un gran vaso d'acqua, e dentrovi de' pescetti; sospendasi anco in alto una secchiella, che a goccia a goccia vada versando acqua in un altro vaso a basso.`,
      `Osservate diligentemente come gli animaletti volanti con pari velocità vanno verso tutte le parti della stanza; i pesci nuotano indifferentemente per tutti i versi; le gocciole cadono tutte nel vaso sottoposto; e voi, gettando all'amico alcuna cosa, non più gagliardamente la dovrete lanciare verso quella parte che verso questa, ancorché la nave si muova con grandissima velocità.

Fate muovere la nave con quanta si voglia velocità, purché il moto sia uniforme e non fluttuante in qua e in là: voi non riconoscerete una minima mutazione in tutti li nominati effetti; né da alcuno di quelli potrete comprendere se la nave cammina, o pure sta ferma. Causa di tutta questa corrispondenza d'effetti è l'essere il moto comune a tutte le cose contenute in essa ed all'aria medesima.`,
      `SAGREDO: O ingegno mirabile! Come questa sola esperienza basta a dissipare tante puerili difficoltà contro il moto della Terra!

SALVIATI: E che diremo noi delle scoperte fatte con l'occhiale? Chi rimira la Luna vi scorge monti scoscesi, vallate profonde ed erte rupi, non diversamente dalla nostra Terra. Chi rimira Giove vi scorge quattro pianeti minori che gli girano attorno continuamente, sì come la Luna alla Terra. Le macchie del Sole ne attestano la rotazione; e le fasi di Venere mostrano a tutta evidenza ch'essa gira intorno al Sole. Il gran libro della natura sta aperto innanzi a' nostri occhi, ma non si può intendere se prima non s'impara a intender la lingua e conoscer i caratteri ne' quali è scritto: egli è scritto in lingua matematica.`,
    ],
  },

  // TURKISH - Philosophy & Spiritual Wisdom
  {
    id: 'tr-mevlana',
    title: 'Fîhi Mâ Fîh (İçindekiler İçindedir)',
    author: 'Mevlânâ Celâleddîn-i Rûmî',
    language: 'tr',
    genre: 'philosophy',
    source: 'gutenberg',
    summary: 'Gönül terbiyesi, varoluş sırrı, nefsin terbiyesi ve evrensel sevgi üzerine derin irfani sohbetler.',
    wordCount: 1510,
    estimatedReadTimeMinutes: 7,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 29,
    currentChunkIndex: 0,
    chunks: [
      `İnsan bu dünyaya belirli bir iş için gelmiştir; gaye o iştir. Eğer insan yüzlerce başka iş başarsa da o asıl işi yapmasa, hiçbir şey yapmamış sayılır.

Tıpkı padişahların hazinesinde bulunan paha biçilmez bir Hint hançerine benzer bu hal. Biri o hançeri alıp kokuşmuş bir eti doğramak için kullansa ve «Ben bu hançeri boş bırakmıyorum, onunla iş görüyorum» dese, ne büyük bir cehalettir! Altın bir kâsede şalgam kaynatmak veya sedef kakmalı bir çekmecede çakıl taşı saklamak ne kadar abes ise, insanın kendi ulvi ruhunu sadece geçici hevesler uğruna harcaması da öyle ziyandır.`,
      `Gönül bir aynadır; oraya türlü suretler yansır. Fakat aynanın tozu pası silinmedikçe onda hakikatin nuru görünmez. Dünya sevgisi, hırs, öfke ve kibir o aynanın pasıdır. Sabır ve tefekkür ise o pası gideren cila gibidir.

Sen kendi içine bakmayı öğrenirsen, aradığın hazinenin harabeler altında gizlendiğini anlarsın. Dışarıdaki deniz dalgalanır, köpürür; ama denizin dibi daima sakindir. İnsan da beden dalgalanmalarından ve söz gürültüsünden kurtulup ruhun derinliğine inerse, sarsılmaz bir huzur bulur.`,
      `Söz bir oktur, yaydan fırladı mı geri dönmez. Bu yüzden bilgelik, çok konuşmakta değil; özü kavrayıp dinlemesini bilmektedir. Balık suyun içindeyken denizi aramaz; çünkü denizin içindedir ve denizle yaşar.

Hakikati uzakta arayan yolcu, menzile varamaz. Her ne arıyorsan kendinde ara; çünkü kâinatın özeti insandır. Sevgiyi rehber edinen gönül için ne doğu vardır ne batı; sevgi her yerdedir ve bütün varlığı birbirine bağlayan ebedi bağdır.`,
    ],
  },

  // TURKISH - History & Travelogue
  {
    id: 'tr-evliya',
    title: 'Seyahatnâme: Şehirler ve İnsan Manzaraları',
    author: 'Evliya Çelebi',
    language: 'tr',
    genre: 'history',
    source: 'gutenberg',
    summary: '17. yüzyıl Osmanlı coğrafyasının, görkemli sarayların, çarşıların ve halk hikâyelerinin canlı panoraması.',
    wordCount: 1640,
    estimatedReadTimeMinutes: 7,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
    currentChunkIndex: 0,
    chunks: [
      `Sene bin kırk bir Muharrem ayının onuncu gecesi, rüyamda Ahi Çelebi Camii’nde idim. Camiye nur yüzlü bir cemaat dolmuştu. Mihrapta Fahr-i Kâinat Hazretleri oturmaktaydı. Heyecan ve sevinçten ayaklarım titreyerek huzuruna vardım, mübarek ellerini öptüm.

O esnada «Şefaat yâ Resûlallah» diyecek yerde dilim sürçtü ve «Seyahat yâ Resûlallah!» deyiverdim. Sultan-ı Enbiya tebessüm buyurdu; «Şefaati, seyahati ve sıhhati sana verdim» dedi. Cemaatte bulunan Hazret-i Ebû Bekir ve Sa’d bin Ebî Vakkas sırtımı sıvazlayıp «Yürü, göresin, yazasın; dünyanın dört bucağındaki garip ve acayip şeyleri ümmete bildiresin» dediler. İşte bu fakirin elli bir yıl süren seyahat macerası böylece başladı.`,
      `Evvela aziz vatanımız Kostantiniyye'yi, yani dünya güzeli İstanbul'u adım adım gezip yazdım. Galata Kulesi’nden bakıldığında Boğaziçi bir mavi atlas kumaş gibi serilir; iki yanda servi ormanları, zarif yalılar ve kaleler nöbet tutar.

Kapalıçarşı’nın dört bin dükkânında Çin ipeği, Hint baharatı, Venedik kadifesi ve Acem halıları satılır; yetmiş iki milletin tüccarı burada buluşup dostça alışveriş eder. Sultanahmet Camii’nin altı minaresi göklere uzanır; Süleymaniye’nin kubbesi ise sanki mavi semaya asılmış bir billur fanustur. Bu şehrin her çeşmesinden ab-ı hayat akar, her köşesinde bir ulu velinin nefesi duyulur.`,
      `Oradan Bursa’ya revan oldum. Bursa, ruhaniyetli ulu bir şehirdir; suları gürül gürül, kaplıcaları şifalı, çınarları asırlıktır. Ulu Cami’nin içinde şadırvan akar, kubbesinden içeriye cennet ışığı dolar.

Daha sonra Trabzon, Erzurum, Şam, Kahire ve Viyana kalelerine kadar uzandım. Nice dağlar aştım, nice diller işittim. Gördüm ki dünya fanidir; insanoğluna kalan sadece hoş bir seda ve hayırla anılacak bir yadigârdır.`,
    ],
  },

  // TURKISH - Essays & Cultural Musings
  {
    id: 'tr-hasim',
    title: 'Bize Göre ve Gurabâhâne-i Laklakân',
    author: 'Ahmet Haşim',
    language: 'tr',
    genre: 'essays',
    source: 'gutenberg',
    summary: 'Modern Türk deneme sanatının zirvesi: zaman, estetik, şehir hayatı ve yaralı leylekler üzerine hüzünlü ve zarif gözlemler.',
    wordCount: 1530,
    estimatedReadTimeMinutes: 7,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 31,
    currentChunkIndex: 0,
    chunks: [
      `Bursa’da garip bir hastane vardır: Gurabâhâne-i Laklakân... Yani sakat ve hasta leyleklerin bakıldığı, tedavi edildiği bir düşkünler yurdu. Bu ismi ilk işittiğimde şaka zannetmiştim. Fakat Hacivat Köprüsü civarındaki geniş bahçeye girip de bir köşede bacağı kırık, kanadı alçılı, diğer köşede boynu bükük leylekleri görünce hayretten dona kaldım.

Bu şefkat yuvası, Türk merhametinin kuşlara kadar uzanan zarif bir abidesiydi. Gökyüzünün bu hür yolcuları, sonbaharda güneye uçamayınca onları soğuktan ve açlıktan koruyan bir vicdan medeniyeti vardı. İnsanın hayvanla dostluğu ancak bu derece şiirli bir hayırseverlikle taçlanabilirdi.`,
      `Eski zamanların kendine has bir lezzeti, bir «Müslüman Saati» vardı. O saat ne mekanik çarkların soğuk tıkırtısıydı ne de aceleyle koşturan trenlerin düdüğü. Zaman, güneşin doğuşuyla başlar, ezan sesleriyle bölünür, akşamın alaca karanlığında tatlı bir sükûnete bürünürdü.

Günün başlangıcı fecirdi; kuşların cıvıltısıyla uyanılır, kahve kokusuyla sokağa çıkılırdı. Şimdiki modern insan ise zamanı rakkasların demir dişleri arasında öğütüyor. Saate baktıkça ömrünün tükendiğini unutup dakikaların kölesi oluyor.`,
      `Gözlerimizi dinlendirmeyi unuttuk. Şehirlerin taş ve beton yığınları arasında gökyüzü ufacık bir yarık halinde kaldı. Eski evlerin cumbalarından süzülen sarmaşıklar, bahçelerdeki erguvanlar birer birer silindi.

Sanat, tabiatın unuttuğumuz güzelliklerini bize yeniden hatırlatan bir aynadır. O aynaya bakmayan ruhlar, çorak bir bozkır gibi kurur. Akşamın mor gölgeleri şehre inerken biraz durup ufku seyretmek, fani ömrümüze katabileceğimiz en asil zenginliktir.`,
    ],
  },

  // TURKISH - Science & Cosmography
  {
    id: 'tr-katip-celebi',
    title: 'Cihannümâ: Yeryüzü ve Gökyüzü Tasviri',
    author: 'Kâtip Çelebi',
    language: 'tr',
    genre: 'science',
    source: 'gutenberg',
    summary: 'Osmanlı coğrafya ve astronomi devriminin ana eseri: yer küresi, gök küreleri, iklimler ve bilimsel yöntem.',
    wordCount: 1570,
    estimatedReadTimeMinutes: 7,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 32,
    currentChunkIndex: 0,
    chunks: [
      `Bilinmelidir ki coğrafya ve astronomi ilmi, kâinatın nizamını anlamak ve yeryüzündeki memleketlerin hallerine vakıf olmak için en lüzumlu fenlerdendir. Yeryüzü, boşlukta duran bir küredir; etrafı gök küreleriyle çevrilidir.

Eski hekimler ve mühendisler dünyayı yedi iklime ayırmışlardır. Ekvator çizgisinden kutuplara doğru gidildikçe güneş ışınlarının geliş açısı değişir; buna bağlı olarak sıcaklık, rüzgârlar, bitkiler ve insanların mizaçları farklılık gösterir. Akıl sahibi insan, yerin ve göğün yaratılışındaki bu kusursuz kanunları inceledikçe Yaratıcı’nın kudretine hayran kalır.`,
      `Denizlerin akıntıları, med ve cezir hadiseleri ayın hareketleriyle irtibatlıdır. Pusulanın icadı ve harita ilminin gelişmesiyle gemiciler okyanuslara açılmış, yeni kıtalar keşfetmişlerdir.

Biz bu Cihannümâ adlı kitabımızda hem şark ulemasının hem de garp bilginlerinin kitaplarını tetkik ettik. Zira ilim müminin yitiğidir; nerede bulursa oradan alır. Hakikati arayan kimse taassuptan uzak durmalı, sadece rivayetlere güvenmeyip gözlem ve hendese delillerine dayanmalıdır.`,
      `Avrupa haritacılarının atlaslarını tercüme edip kendi denizcilerimizin tecrübeleriyle birleştirdik. Gördük ki ilimde durgunluk gerilemedir. Bir millet fenni ve riyaziye ilimlerini terk ederse, düşmanları ona üstün gelir.

Bu sebeple medreselerde hendese, heyet (astronomi) ve hesap derslerinin yeniden ihya edilmesi şarttır. Göklerin dönüşünü, yıldızların menzillerini ve yerkürenin ölçülerini bilmeyen devlet adamları memleket idaresinde basiretli kararlar veremezler.`,
    ],
  },

  // ENGLISH - Philosophy & Stoicism
  {
    id: 'en-aurelius',
    title: 'Meditations (The Emperor’s Journal)',
    author: 'Marcus Aurelius',
    language: 'en',
    genre: 'philosophy',
    source: 'gutenberg',
    summary: 'Private reflections of the Roman emperor on Stoic duty, inner serenity, mortality, and rational conduct.',
    wordCount: 1550,
    estimatedReadTimeMinutes: 7,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 33,
    currentChunkIndex: 0,
    chunks: [
      `When you wake up in the morning, tell yourself: The people I deal with today will be meddling, ungrateful, arrogant, dishonest, jealous, and surly. They are like this because they cannot distinguish good from evil. But I have seen the beauty of good, and the ugliness of evil, and have recognized that the wrongdoer has a nature related to my own — not of the same blood or birth, but the same mind, and possessing a share of the divine.

None of them can hurt me. No one can implicate me in ugliness. Nor can I feel angry at my fellow man, or hate him. We were made to work together like hands, like feet, like the rows of the upper and lower teeth. To obstruct each other is contrary to nature.`,
      `Never esteem anything as of advantage to you that will make you break your word or lose your self-respect. People look for retreats for themselves, in the country, by the coast, or in the hills. There is nowhere that a person can find a more peaceful and trouble-free retreat than in his own mind.

So constantly give yourself this retreat, and renew yourself. Let your basic principles be brief and fundamental, so that at the first step they will cleanse your soul and send you back without anger to whatever awaits you. What is it that vexes you? The wickedness of men? Consider that rational creatures exist for one another, and that forbearance is part of justice.`,
      `Time is a river, a fierce torrent of things passing by. No sooner is a thing brought to sight than it is swept away and another takes its place, and this too will be swept away. Consider the whole universe, of which you are a tiny fraction, and the vast eternity of time, of which a narrow and momentary span has been assigned to you.

Do not act as if you had ten thousand years to live. Fate hangs over you. While you live, while it is in your power, be good. Live your life in simplicity, in goodness, and with serenity, keeping your ruling center free from all perturbation.`,
    ],
  },

  // ENGLISH - History & Roman Civilization
  {
    id: 'en-gibbon',
    title: 'The History of the Decline and Fall of the Roman Empire',
    author: 'Edward Gibbon',
    language: 'en',
    genre: 'history',
    source: 'gutenberg',
    summary: 'The monumental historical masterwork charting the zenith and gradual disintegration of Rome’s imperial civilization.',
    wordCount: 1680,
    estimatedReadTimeMinutes: 8,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 34,
    currentChunkIndex: 0,
    chunks: [
      `In the second century of the Christian era, the Empire of Rome comprehended the fairest part of the earth, and the most civilized portion of mankind. The frontiers of that extensive monarchy were guarded by ancient renown and disciplined valour. The gentle but powerful influence of laws and manners had gradually cemented the union of the provinces.

Their peaceful inhabitants enjoyed and abused the advantages of wealth and luxury. The image of a free constitution was preserved with decent reverence: the Roman senate appeared to possess the sovereign authority, and devolved on the emperors all the executive powers of government. During a happy period of more than fourscore years, the public administration was conducted by the virtue and abilities of Nerva, Trajan, Hadrian, and the two Antonines.`,
      `If a man were called to fix the period in the history of the world during which the condition of the human race was most happy and prosperous, he would, without hesitation, name that which elapsed from the death of Domitian to the accession of Commodus. The vast extent of the Roman empire was governed by absolute power, under the guidance of virtue and wisdom.

The armies were restrained by the firm but gentle hand of four successive emperors whose characters commanded respect. The forms of the civil administration were carefully respected by Trajan and the Antonines, who delighted in the image of liberty, and were pleased to consider themselves the accountable ministers of the laws.`,
      `The decline of Rome was the natural and inevitable effect of immoderate greatness. Prosperity ripened the principle of decay; the causes of destruction multiplied with the extent of conquest; and as soon as time or accident had removed the artificial supports, the stupendous fabric yielded to the pressure of its own weight.

The story of its ruin is simple and obvious; and instead of inquiring why the Roman empire was destroyed, we should rather be surprised that it had survived so long. The victorious legions acquired the vices of strangers and mercenaries, first oppressing the freedom of the republic, and at length violating the majesty of the purple.`,
    ],
  },

  // ENGLISH - Essays & Transcendentalism
  {
    id: 'en-emerson',
    title: 'Self-Reliance and Selected Essays',
    author: 'Ralph Waldo Emerson',
    language: 'en',
    genre: 'essays',
    source: 'gutenberg',
    summary: 'A cornerstone of American philosophy: intellectual autonomy, original genius, nonconformity, and spiritual confidence.',
    wordCount: 1590,
    estimatedReadTimeMinutes: 7,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 35,
    currentChunkIndex: 0,
    chunks: [
      `There is a time in every man's education when he arrives at the conviction that envy is ignorance; that imitation is suicide; that he must take himself for better for worse as his portion; that though the wide universe is full of good, no kernel of nourishing corn can come to him but through his toil bestowed on that plot of ground which is given to him to till.

The power which resides in him is new in nature, and none but he knows what that is which he can do, nor does he know until he has tried. Trust thyself: every heart vibrates to that iron string. Accept the place the divine providence has found for you, the society of your contemporaries, the connection of events.`,
      `Whoso would be a man must be a nonconformist. He who would gather immortal palms must not be hindered by the name of goodness, but must explore if it be goodness. Nothing is at last sacred but the integrity of your own mind. Absolve you to yourself, and you shall have the suffrage of the world.

What I must do is all that concerns me, not what the people think. This rule, equally arduous in actual and in intellectual life, may serve for the whole distinction between greatness and meanness. It is easy in the world to live after the world's opinion; it is easy in solitude to live after our own; but the great man is he who in the midst of the crowd keeps with perfect sweetness the independence of solitude.`,
      `A foolish consistency is the hobgoblin of little minds, adored by little statesmen and philosophers and divines. With consistency a great soul has simply nothing to do. He may as well concern himself with his shadow on the wall. Speak what you think now in hard words, and tomorrow speak what tomorrow thinks in hard words again, though it contradict everything you said today.

«Ah, so you shall be sure to be misunderstood.» — Is it so bad, then, to be misunderstood? Pythagoras was misunderstood, and Socrates, and Jesus, and Luther, and Copernicus, and Galileo, and Newton, and every pure and wise spirit that ever took flesh. To be great is to be misunderstood.`,
    ],
  },

  // ENGLISH - Short Stories & Suspense
  {
    id: 'en-poe',
    title: 'The Tell-Tale Heart and Other Tales',
    author: 'Edgar Allan Poe',
    language: 'en',
    genre: 'stories',
    source: 'gutenberg',
    summary: 'Iconic tales of psychological dread, gothic obsession, acute perception, and the haunting voice of conscience.',
    wordCount: 1640,
    estimatedReadTimeMinutes: 7,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 36,
    currentChunkIndex: 0,
    chunks: [
      `True! — nervous — very, very dreadfully nervous I had been and am; but why will you say that I am mad? The disease had sharpened my senses — not destroyed — not dulled them. Above all was the sense of hearing acute. I heard all things in the heaven and in the earth. I heard many things in hell. How, then, am I mad? Hearken! and observe how healthily — how calmly I can tell you the whole story.

It is impossible to say how first the idea entered my brain; but once conceived, it haunted me day and night. Object there was none. Passion there was none. I loved the old man. He had never wronged me. He had never given me insult. For his gold I had no desire. I think it was his eye! yes, it was this! He had the eye of a vulture — a pale blue eye, with a film over it. Whenever it fell upon me, my blood ran cold; and so by degrees — very gradually — I made up my mind to take the life of the old man, and thus rid myself of the eye forever.`,
      `Now this is the point. You fancy me mad. Madmen know nothing. But you should have seen me. You should have seen how wisely I proceeded — with what caution — with what foresight — with what dissimulation I went to work! I was never kinder to the old man than during the whole week before I killed him.

And every night, about midnight, I turned the latch of his door and opened it — oh so gently! And then, when I had made an opening sufficient for my head, I put in a dark lantern, all closed, closed, that no light shone out, and then I thrust in my head. Oh, you would have laughed to see how cunningly I thrust it in! I moved it slowly — very, very slowly, so that I might not disturb the old man's sleep. It took me an hour to place my whole head within the opening so far that I could see him as he lay upon his bed.`,
      `When I had made an end of these labors, it was four o'clock — still dark as midnight. As the bell sounded the hour, there came a knocking at the street door. I went down to open it with a light heart, — for what had I now to fear? There entered three gentlemen, who introduced themselves, with great civility, as officers of the police. A shriek had been heard by a neighbour during the night; suspicion of foul play had been aroused.

I smiled, for what had I to fear? I bade the gentlemen welcome. I took my visitors through the whole house. I led them to his chamber. I showed them his treasures, secure, undisturbed. In the enthusiasm of my confidence, I brought chairs into the room, and desired them here to rest from their fatigues, while I myself placed my own seat upon the very spot beneath which reposed the corpse of the victim.

The officers were satisfied. But ere long, I felt myself getting pale and wished them gone. My head ached, and I fancied a ringing in my ears: but it continued and grew more distinct. It was a low, dull, quick sound — much such a sound as a watch makes when enveloped in cotton. I gasped for breath — and yet the officers heard it not. They heard! — they suspected! — they knew! — they were making a mockery of my horror! I could bear those hypocritical smiles no longer! «Villains!» I shrieked, «dissemble no more! I admit the deed! — tear up the planks! here, here! — it is the beating of his hideous heart!»`,
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
