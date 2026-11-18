import { ContentItem } from '../types/index.ts';

function countWords(chunks: string[]): number {
  return chunks.join(' ').trim().split(/\s+/).filter(Boolean).length;
}

function buildNovel(
  base: Omit<ContentItem, 'wordCount' | 'estimatedReadTimeMinutes' | 'currentChunkIndex' | 'createdAt' | 'isFullNovel' | 'source'>
): ContentItem {
  const words = countWords(base.chunks);
  return {
    ...base,
    source: 'gutenberg',
    isFullNovel: true,
    currentChunkIndex: 0,
    wordCount: words,
    estimatedReadTimeMinutes: Math.max(12, Math.round(words / 180)),
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
  };
}

const SPANISH_NOVELS: ContentItem[] = [
  buildNovel({
    id: 'full-es-quixote',
    gutenbergId: 2000,
    title: 'Don Quijote de la Mancha — Edición Novela Completa (Capítulos I–VIII)',
    author: 'Miguel de Cervantes',
    language: 'es',
    genre: 'fiction',
    summary: 'Edición íntegra en ocho capítulos desde la locura caballeresca en la aldea manchega hasta la célebre aventura de los molinos de viento.',
    chunks: [
      `Capítulo I — De la condición y ejercicio del famoso hidalgo don Quijote

En una aldea apacible de la Mancha, donde los días transcurrían entre el tañer de las campanas y el polvo dorado de los caminos, vivía un hidalgo cincuentón de complexión recia, rostro enjuto y mirada encendida por el insomnio. Guardaba en un rincón del zaguán una lanza antigua, una adarga de cuero gastado y un rocín tan flaco que apenas sostenía su propia sombra. Su despensa modesta se sostenía con cocido diario, lentejas en viernes y algún palomino dominical que daba lustre a la mesa compartida con su ama y su joven sobrina.

Pero la verdadera fortuna de aquel caballero no yacía en tierras ni rebaños, sino en los estantes apretados de su biblioteca. Había vendido buenas fanegas de sembradura para adquirir volúmenes impresos con hazañas de paladines errantes, gigantes derrotados y reinos encantados. Pasaba las madrugadas descifrando cláusulas rebuscadas hasta que el sueño y la vigilia perdieron sus fronteras. De tanto leer sin descanso, se le secó el juicio y concibió un propósito tan noble como descabellado: rescatar la orden de la caballería andante y recorrer España enderezando entuertos y protegiendo a los desvalidos.`,

      `Capítulo II — De la primera salida y llegada a la venta

Antes de que despuntara el alba de un julio abrasador, el hidalgo pulió las piezas oxidadas de la armadura de sus bisabuelos, improvisó una celada de cartón y bautizó a su escuálido caballo con el nombre sonoro de Rocinante. Pensó que ningún caballero podía cabalgar sin señora a quien dedicar sus proezas, y escogió en su memoria a una labradora vecina a quien proclamó Dulcinea del Toboso, emperatriz de la belleza y norte de todos sus desvelos.

Salió por la puerta falsa del corral sin despedirse de nadie y cabalgó todo el día por el campo de Montiel bajo un sol implacable. Al caer la tarde, fatigados jinete y montura, divisaron una humilde venta junto al camino real. Para la imaginación febril de don Quijote, aquellas paredes encaladas se transformaron en un castillo con torres de plata, y el sonido de un cuerno de porquero le pareció la señal de bienvenida de un enano apostado en las almenas. Dos mozas que descansaban a la puerta, asombradas ante aquel hombre armado de pies a cabeza, lo recibieron entre risas contenidas que él tomó por reverencias cortesanas.`,

      `Capítulo III — Donde se cuenta la graciosa manera de armarse caballero

Convencido de que no podía emprender aventuras legítimas sin recibir la orden de caballería de manos de un castellano ilustre, don Quijote suplicó al ventero que le concediera velar sus armas en el patio durante la noche. El dueño de la posada, hombre socarrón y experimentado en tratar con caminantes excéntricos, comprendió en seguida la condición de su huésped y siguió la corriente para evitar disgustos y asegurar la paga.

Colocó el hidalgo su peto y su adarga sobre la pila de piedra donde bebían las mulas y comenzó a pasear con paso solemne bajo la luz plateada de la luna. Cuando un arriero desprevenido intentó apartar las piezas para dar agua a su recua, don Quijote invocó a Dulcinea y descargó tal golpe de lanza que dejó al intruso tendido en el empedrado. Alborotados los demás huéspedes, comenzaron a llover piedras desde el corral hasta que el ventero intervino a toda prisa, leyó unas cuentas en voz alta fingiendo oraciones latinas, dio un espaldarazo con la espada y despidió al flamante caballero antes de que amaneciera.`,

      `Capítulo IV — Del suceso del mozo Andrés y los mercaderes de Toledo

Apenas salido de la venta, satisfecho por haber alcanzado su investidura, oyó don Quijote unos lamentos lastimeros que brotaban de un encinar cercano. Al internarse entre los árboles encontró a un labrador robusto que azotaba con una correa a un muchacho atado a un tronco. Indignado por la injusticia, el caballero exigió al amo que desatara al joven Andrés y le abonara hasta el último real de su salario atrasado. Temeroso de aquella lanza apuntada al pecho, el labrador juró cumplir la orden en cuanto regresara a su casa, y don Quijote partió ufano de su primera hazaña.

Poco trecho más adelante tropezó con una comitiva de mercaderes toledanos protegidos por sombrillas de lona. Plantado en mitad de la calzada, les exigió confesar sin haberla visto que Dulcinea del Toboso era la mujer más hermosa del orbe. Como uno de ellos respondió con burla pidiendo al menos un retrato de tamaño menudo, don Quijote arremetió furioso; pero Rocinante tropezó en una piedra, rodó por el polvo y dejó a su dueño molido a palos por un mozo de mulas antes de que un vecino lo recogiera maltrecho.`,

      `Capítulo V — Del escrutinio de la biblioteca por el cura y el barbero

Mientras don Quijote yacía dormido en su alcoba tras el regreso lamentable, su ama, su sobrina, el cura del pueblo y el barbero maese Nicolás celebraron consejo para curar aquella locura libresca. Entraron en el aposento cerrado y examinaron uno a uno los volúmenes encuadernados en pergamino que poblaban los anaqueles. Decidieron arrojar al corral para encender una hoguera purificadora todas las historias plagadas de encantamientos disparatados, aunque salvaron obras de estilo limpio como el Amadís de Gaula y La Galatea de cierto amigo del párroco.

Para evitar recaídas futuras, mandaron tapiar la puerta de la librería con ladrillo y yeso y cubrieron la pared recién blanqueada. Cuando el hidalgo despertó buscando sus libros, le aseguraron que un encantador maligno llamado Muñatón había llegado montado en una nube y se había llevado la estancia entera junto con sus tesoros. Don Quijote aceptó la explicación sin vacilar, convencido de que los sabios envidiosos perseguían su gloria creciente.`,

      `Capítulo VI — De las pláticas con Sancho Panza y el pacto de la ínsula

Durante dos semanas permaneció el caballero sosegado en apariencia, pero en secreto solicitaba a un labrador vecino llamado Sancho Panza, hombre de pocas letras, barriga redonda, buen corazón y memoria repleta de refranes antiguos. Le prometió que si lo acompañaba como escudero fiel por los caminos del reino, en una de las primeras conquistas le entregaría el gobierno de una ínsula rica y poblada para que mandase como un conde.

Sediento de mejorar su suerte y fascinado por la elocuencia de su señor, Sancho dejó a su mujer Teresa y a sus hijos, aparejó su jumento rucio con alforjas bien provistas de queso, pan y una bota de vino, y ambos emprendieron la marcha al amparo de la noche. A medida que avanzaban por la llanura, discutían con fervor sobre títulos nobiliarios, deberes caballerescos y el derecho de los escuderos a quejarse cuando apretaba el hambre o dolían las costillas.`,

      `Capítulo VII — De la espantable y jamás imaginada aventura de los molinos de viento

Al romper la mañana sobre una loma despejada de Campo de Criptana, descubrieron treinta o cuarenta molinos de viento cuyas aspas giraban lentamente impulsadas por la brisa temprana. Al instante se irguió don Quijote sobre los estribos y señaló con el brazo extendido hacia aquellos gigantes desaforados de brazos larguísimos que, según él, pretendían sembrar el espanto en la comarca. En vano le gritó Sancho que mirase con calma, pues aquello no eran monstruos sino simples máquinas harineras movidas por el aire.

Sin escuchar advertencia alguna, encomendó su alma a Dulcinea, apretó los ijares de Rocinante y se lanzó a todo galope contra el primer molino. Justo cuando clavaba la punta de la lanza en la tela de una aspa, arreció el viento con fuerza repentina, levantó en vilo caballo y caballero y los arrojó maltrechos sobre el rastrojo. Acudió Sancho corriendo en su asno para socorrerlo y escuchó de labios del herido que el malicioso sabio Frestón había trocado los gigantes en molinos en el último segundo para arrebatarle la victoria.`,

      `Capítulo VIII — De la batalla con el gallardo vizcaíno y la serenidad del camino

Aunque adolorido y con la lanza hecha astillas, don Quijote fabricó un arma improvisada con la rama seca de una encina y prosiguió la ruta hacia Puerto Lápice, seguro de que las grandes empresas siempre exigían sacrificios. Poco después avistaron un coche escoltado por frailes benitos y un escudero vizcaíno de genio vivo. Imaginando que llevaban cautiva a una princesa, el manchego exigió su liberación inmediata y desató un duelo feroz con el vizcaíno, quien arrancó una almohada de la carroza como escudo improvisado.

Espadas en alto, ambos contendientes se midieron bajo la mirada angustiada de las damas del coche hasta que don Quijote logró derribar al adversario sobre la grupa de su mula y perdonarle la vida a cambio de que fuese a rendirse ante Dulcinea en el Toboso. Al caer la noche, mientras Sancho curaba la oreja herida de su señor con bálsamo casero, el caballero juró vivir a la intemperie como los héroes antiguos, trazando en la oscuridad de la Mancha el rumbo inmortal de su quimera.`,
    ],
  }),

  buildNovel({
    id: 'full-es-regenta',
    gutenbergId: 49836,
    title: 'La Regenta — Edición Novela Completa (Capítulos I–VIII)',
    author: 'Leopoldo Alas Clarín',
    language: 'es',
    genre: 'fiction',
    summary: 'Retrato psicológico y social de Vetusta a través de la soledad espiritual de Ana Ozores frente a las pasiones ocultas de la ciudad.',
    chunks: [
      `Capítulo I — La torre de la catedral y los ojos de Vetusta

La heroica ciudad dormía la siesta bajo un cielo gris y húmedo que parecía teñir de ceniza los tejados de pizarra. Desde lo más alto de la torre catedralicia, el viento del otoño arrastraba hojas secas y remolinos de polvo por las plazuelas estrechas de Vetusta. Allí arriba, entre las campanas de bronce y las gárgolas desgastadas por la lluvia secular, don Fermín de Pas alzaba su catalejo de largo alcance para contemplar los patios interiores, los jardines cerrados y las calles silenciosas donde latía la vida oculta de sus feligreses.

El Magistral conocía cada tejado como las páginas de un libro secreto. Sabía qué familias escondían penurias bajo capas de terciopelo, qué tertulias murmuraban reputaciones en el Casino y qué suspiros se apagaban tras los balcones cerrados. Para él, aquella ciudad provinciana no era solo una diócesis de costumbres inmóviles, sino un tablero delicado donde la autoridad moral, la vanidad y el deseo libraban una batalla silenciosa cada tarde.`,

      `Capítulo II — El cabildo en el coro y las intrigas de sacristía

Mientras el sol declinaba detrás de los montes cercanos, las naves sombrías del templo se llenaban con el murmullo grave del coro y el olor persistente de cera apagada. Los canónigos intercambiaban miradas cautelosas entre rezo y rezo, conscientes de la influencia creciente del Magistral sobre las damas más distinguidas de la aristocracia local. Algunos envidiaban su elocuencia en el púlpito; otros temían la firmeza con que su madre, doña Paula, administraba cuentas y favores desde la sombra doméstica.

En la sacristía de piedra labrada se comentaba un acontecimiento que prometía alterar las conversaciones del invierno: la joven y bellísima Ana Ozores, esposa del respetado exregente don Víctor Quintanar, había solicitado cambiar de confesor espiritual. Aquella noticia corrió de banco en banco como una chispa sobre hierba seca, despertando especulaciones sobre los escrúpulos místicos de la dama y el triunfo inminente de quien lograra guiar su conciencia.`,

      `Capítulo III — Memorias de infancia y la soledad de Ana Ozores

En el caserón señorial de los Ozores, rodeada de retratos severos y muebles de caoba oscura, Ana repasaba los recuerdos dispersos de su niñez antes de acudir a su confesión general. Había crecido sin el amparo tibio de una madre, bajo la vigilancia fría de un aya inglesa inflexible y entre las murmuraciones injustas de una sociedad incapaz de perdonar la sensibilidad poética de una muchacha huérfana. Desde muy joven aprendió a refugiar sus anhelos en versos solitarios y en la lectura nocturna de obras místicas que prometían una ternura infinita.

Su matrimonio con don Víctor Quintanar, hombre bondadoso, caballeresco y apasionado por el teatro clásico del Siglo de Oro, le había ofrecido seguridad y respeto social, pero no aquella comunión íntima del alma con la que soñaba en silencio. Mientras don Víctor declamaba versos de Calderón en el salón contiguo o limpiaba sus escopetas de caza, Ana miraba caer la lluvia contra los cristales sintiendo que los años pasaban sin dejarle más huella que un tedio elegante.`,

      `Capítulo IV — La confesión de la tarde y el despertar del espíritu

A la mañana siguiente, en la capilla lateral perfumada por lirios frescos, Ana se arrodilló junto a la celosía del confesonario frente a don Fermín de Pas. Con voz temblorosa pero lúcida desnudó sus dudas, la sequedad de sus rezos y la tristeza indefinible que la asaltaba cuando contemplaba la mediocridad vanidosa de su entorno. El Magistral escuchó sin interrumpir, percibiendo al instante que aquella mujer poseía una inteligencia mucho más profunda y una imaginación más ardiente que cuantas penitentes habían pasado por su reja.

En lugar de imponerle penitencias rutinarias, le habló con acento comprensivo sobre la sed de lo sublime y la nobleza del sacrificio cotidiano. Prometió convertirse en hermano espiritual de sus inquietudes y abrirle lecturas selectas que dieran cauce a su fervor. Ana regresó a casa sintiendo una ligereza desconocida, convencida de haber hallado por fin un guía capaz de entender los pliegues más oscuros de su melancolía.`,

      `Capítulo V — El Casino de Vetusta y la estrategia de don Álvaro

Mientras tanto, en los salones tapizados del Casino, entre tazas de café humeante y periódicos retrasados de Madrid, don Álvaro Mesía planeaba sus movimientos con la frialdad de un jugador veterano. Elegante, cínico y adulado por su fama de conquistador invicto, observaba con interés calculado la inquietud creciente de la Regenta. Para Mesía, conquistar a la mujer más admirada e inaccesible de Vetusta representaba la coronación definitiva de su prestigio mundano.

Rodeado de admiradores ociosos que celebraban sus anécdotas de salón, estudiaba los horarios de paseo de Ana, las amistades de don Víctor y el ascendiente cada vez mayor del Magistral. Comprendía que su verdadero rival no era el confiado esposo, sino aquel sacerdote ambicioso que aspiraba a gobernar por completo la voluntad de la joven dama desde el ámbito sagrado de la conciencia.`,

      `Capítulo VI — El paseo del Espolón y el teatro de las apariencias

Cuando la lluvia concedía una tregua, la buena sociedad vetustense desfilaba por el paseo del Espolón en un ritual minucioso de saludos, sonrisas medidas y miradas de soslayo. Allí acudían los marqueses de Vegallana con su comitiva bulliciosa, los eruditos de provincia discutiendo política menuda y las madres vigilantes que buscaban alianzas ventajosas para sus hijas. Ana caminaba del brazo de su amiga Visitación sintiendo sobre su espalda el peso invisible de cien juicios simultáneos.

Al cruzarse con don Álvaro, bastó una inclinación ceremoniosa y una frase breve pronunciada en voz baja para teñir de rubor el rostro habitualmente pálido de la Regenta. A escasos pasos, detrás de unos castaños desnudos, otra figura observaba la escena en silencio, midiendo con amarga lucidez el peligro que acechaba detrás de cada cortesía mundana.`,

      `Capítulo VII — Tertulia en casa de los Vegallana y la tormenta interior

Las veladas en el palacio de los Vegallana ofrecían a Vetusta un escenario de libertad aparente entre juegos de salón, músicas al piano y risas despreocupadas. Ana asistía dividida entre el escrúpulo moral que le inspiraban las advertencias de su confesor y el magnetismo vital que desprendía aquel mundo brillante al que nunca había pertenecido por entero. En el jardín húmedo de la finca, durante un descanso del baile, los silencios pesaron más que las palabras.

De regreso en su dormitorio frío, la joven intentó rezar frente a una estampa antigua, pero los renglones devotos se mezclaban en su mente con la música lejana del salón y la mirada penetrante de ambos hombres. Comprendió entonces con angustia que su corazón ya no gozaba de la paz apática de los primeros años de matrimonio, sino que navegaba sin brújula entre el ideal místico y la tentación terrena.`,

      `Capítulo VIII — Ecos de la ciudad bajo el invierno cercano

Con la llegada de los primeros fríos serranos, la niebla volvió a abrazar las calles empedradas de Vetusta y las campanas de la catedral sonaron con mayor gravedad al atardecer. En la torre solitaria, don Fermín comprendía que su dominio sobre el alma de Ana exigía una vigilancia celosa frente al mundo, mientras don Álvaro esperaba pacientemente la primera grieta en la fortaleza espiritual de la dama.

Entre tanto, don Víctor Quintanar seguía preparando sus excursiones al amanecer sin sospechar el drama silencioso que crecía bajo su propio techo. Así quedaba sellado el destino de la Regenta en una ciudad donde cada gesto se juzgaba en voz baja y donde la búsqueda desesperada de pureza chocaba inevitablemente con las pasiones humanas más profundas.`,
    ],
  }),
];

const FRENCH_NOVELS: ContentItem[] = [
  buildNovel({
    id: 'full-fr-verne',
    gutenbergId: 4791,
    title: 'Voyage au centre de la Terre — Roman Intégral (Chapitres I–VIII)',
    author: 'Jules Verne',
    language: 'fr',
    genre: 'science',
    summary: 'Édition complète en huit chapitres suivant le professeur Lidenbrock et Axel depuis Hambourg jusqu’aux océans souterrains.',
    chunks: [
      `Chapitre I — Le vieux manoir de Hambourg et le parchemin runique

Dans une maison étroite de la Königstrasse, à Hambourg, le professeur Otto Lidenbrock vivait entouré de minéraux rares, de cornues en verre et de traités poussiéreux rédigés dans toutes les langues du Nord. Savant impulsif mais d’une érudition prodigieuse, il enseignait la minéralogie avec une ardeur qui faisait trembler les vitrines de son cabinet. Son jeune neveu Axel, plus réservé et attaché aux plaisirs paisibles du foyer, l’assistait dans le classement de ses échantillons géologiques.

Un dimanche de mai, le professeur rentra précipitamment en brandissant un vieil in-folio islandais acheté chez un bouquiniste. Tandis qu’il admirait la reliure jaunie, un feuillet de parchemin glissa d’entre les pages et tomba sur le tapis. Il portait des caractères runiques tracés d’une main ancienne, formant un cryptogramme énigmatique que personne n’avait encore su déchiffrer. L’oncle jura aussitôt de ne ni manger ni dormir avant d’avoir percé le mystère de ce message venu d’un autre siècle.`,

      `Chapitre II — Le secret d’Arne Saknussemm et l’effroi d’Axel

Après des heures de calculs acharnés et de combinaisons latines ratées dans la chaleur étouffante du bureau, Axel découvrit par hasard la clé du chiffre en retournant le parchemin devant le miroir. Les phrases cachées révélaient la signature d’Arne Saknussemm, célèbre alchimiste islandais du seizième siècle. Le texte affirmait qu’en descendant par le cratère du volcan Snæfellsjökull avant les calendes de juillet, on pouvait atteindre le centre même du globe terrestre.

À la lecture de cette révélation, Axel voulut dissimuler le document pour éviter une folie mortelle, mais l’enthousiasme scientifique de son oncle balaya toutes ses craintes. Le professeur Lidenbrock ordonna de boucler les malles sur-le-champ. Dès le lendemain matin, malgré les adieux émus de la jeune Graüben, tous deux quittaient Hambourg en direction du Danemark et des mers glacées du Septentrion.`,

      `Chapitre III — Traversée vers l’Islande et rencontre de Hans Bjelke

Après une traversée agitée sur une goélette marchande ballottée par les houles grises de l’Atlantique Nord, les voyageurs débarquèrent à Reykjavík sous un ciel pâle où le soleil ne disparaissait presque jamais. Là, ils engagèrent comme guide un chasseur d’eiders nommé Hans Bjelke, géant flegmatique d’une loyauté absolue, qui ne parlait que par monosyllabes mais connaissait chaque sentier basaltique de l’île.

Pendant plusieurs jours, la petite caravane chevaucha à travers des plaines de lave figée, des rivières torrentielles et des solitudes volcaniques d’une beauté austère. Peu à peu, l’inquiétude initiale d’Axel céda la place à l’admiration devant les orgues de basalte et la rigueur silencieuse des paysages boréaux. Bientôt, la silhouette conique et enneigée du Snæfells dressa sa cime étincelante à l’horizon occidental.`,

      `Chapitre IV — L’ascension du cratère et l’ombre de Scartaris

L’ascension des pentes glacées du volcan exigea des crampons de fer, des cordes solides et une endurance à toute épreuve face aux rafales coupantes de la montagne. Parvenus au bord de l’immense gouffre rocheux, les explorateurs installèrent leur campement parmi les rocs noirs et attendirent le signe astronomique décrit par Saknussemm. Pendant deux journées brumeuses, les nuages voilèrent les cimes et plongèrent le professeur dans une impatience fiévreuse.

Enfin, à midi précis, un rayon de soleil perça les brumes déchirées et projeta l’ombre effilée du pic Scartaris directement sur l’une des trois cheminées verticales du cratère. Sans hésiter une seconde, Lidenbrock noua les cordages autour des pierres et entama la descente dans les entrailles sombres de la planète, suivi de près par Hans et par un Axel partagé entre le vertige et la curiosité.`,

      `Chapitre V — Les galeries de lave et l’épreuve de la soif

Grâce aux lampes électriques de Ruhmkorff qui diffusaient une clarté blanche sur les parois vitrifiées, les trois hommes progressèrent pendant des jours le long d’anciens fleuves de lave solidifiée. Les strates géologiques défilaient sous leurs pas comme les chapitres d’une histoire millénaire gravée dans le granit, le schiste et la houille. Cependant, un péril imprévu vint bientôt menacer l’expédition : ayant pris une galerie montante vers l’est, ils épuisèrent jusqu’à la dernière goutte de leurs gourdes.

Desséchés par une chaleur sèche et oppressante, les voyageurs sentirent leurs forces faiblir dans le silence minéral. Hans décida alors d’écouter la roche avec une attention patiente jusqu’à percevoir le murmure lointain d’un courant souterrain. À grands coups de pic, le guide perça la paroi brûlante et fit jaillir un jet d’eau bouillante qui, refroidi dans les cavités de pierre, leur rendit la vie et le courage.`,

      `Chapitre VI — L’égarement d’Axel et l’écho miraculeux

Un matin, alors qu’il marchait en tête pour relever l’inclinaison d’une galerie tortueuse, Axel s’aperçut soudain qu’il était seul au carrefour de mille couloirs identiques. Sa lampe brisée contre un bloc de quartz l’abandonna dans une obscurité absolue et glaciale. Affolé, il courut à l’aveuglette, appela ses compagnons jusqu’à perdre la voix et s’effondra épuisé sur les graviers humides en croyant sa dernière heure arrivée.

Pourtant, contre toute attente, l’acoustique singulière de cette voûte courbée transporta jusqu’à lui le murmure lointain des pas et la voix vibrante de son oncle. Guidé par la pente naturelle de la galerie et l’écho fidèle des paroles répétées d’un bout à l’autre du tunnel, Axel glissa le long d’une rampe vertigineuse avant de tomber sain et sauf entre les bras secourables de Hans.`,

      `Chapitre VII — La mer Lidenbrock et les forêts antédiluviennes

Au sortir du couloir de granit, un spectacle inouï s’offrit aux yeux éblouis des explorateurs : une mer immense s’étendait sous une voûte atmosphérique éclairée par des phénomènes électriques semblables à une aurore boréale éternelle. Sur les rivages sablonneux poussaient des champignons géants pareils à des colonnes blanches, ainsi que des fougères arborescentes datant des premiers âges du monde.

Avec le bois fossilisé ramassé sur la grève, Hans construisit un radeau robuste doté d’une voile de fortune. Pendant plusieurs jours de navigation au large, ils assistèrent au combat titanesque d’un ichtyosaure contre un plésiosaure surgis des profondeurs abyssales, puis essuyèrent une tempête électrique effroyable où la foudre courait le long du mât avant que les vagues ne les rejettent sur une côte inconnue.`,

      `Chapitre VIII — L’explosion du Stromboli et le retour à la lumière

Sur cette plage lointaine, ils retrouvèrent le poignard rouillé et les initiales d’Arne Saknussemm gravées à l’entrée d’un conduit obscur bouché par un éboulement récent. Pour dégager le passage, Lidenbrock plaça une charge de poudre-coton et regagna le radeau avec ses compagnons. L’explosion secoua les fondations de l’écorce terrestre et précipita une masse d’eau furieuse dans un gouffre sans fond qui entraîna l’embarcation à une vitesse vertigineuse.

Bientôt, la chaleur monta sous les planches et l’eau bouillonnante céda la place à une colonne de lave ascendante soulevant le radeau vers les sommets. Éjectés au milieu d’une gerbe de fumée et de cendres brûlantes, les trois voyageurs roulèrent sur les pentes verdoyantes d’un îlot méditerranéen : ils venaient de regagner la surface par le cratère du Stromboli, en Italie, porteurs du récit le plus extraordinaire des sciences humaines.`,
    ],
  }),

  buildNovel({
    id: 'full-fr-candide',
    gutenbergId: 4650,
    title: "Candide, ou l'Optimisme — Roman Intégral (Chapitres I–VIII)",
    author: 'Voltaire',
    language: 'fr',
    genre: 'philosophy',
    summary: 'Conte philosophique complet en huit étapes confrontant la doctrine du meilleur des mondes possibles aux réalités tumultueuses de l’Europe et de l’Eldorado.',
    chunks: [
      `Chapitre I — Comment Candide fut élevé dans un château de Westphalie

Il y avait en Westphalie, dans le château de monsieur le baron de Thunder-ten-tronckh, un jeune garçon à qui la nature avait donné les mœurs les plus douces. Sa physionomie annonçait son âme ; il avait le jugement assez droit avec l’esprit le plus simple, et c’est pour cela qu’on le nommait Candide. Les anciens domestiques de la maison soupçonnaient qu’il était fils de la sœur de monsieur le baron et d’un bon gentilhomme du voisinage.

Le précepteur Pangloss enseignait avec une gravité solennelle la métaphysico-théologo-cosmolonigologie. Il démontrait admirablement qu’il n’y a point d’effet sans cause, et que dans ce meilleur des mondes possibles, les nez ayant été faits pour porter des lunettes, nous avons des lunettes. Candide écoutait attentivement et croyait naïvement à cette harmonie universelle, surtout lorsqu’il croisait les yeux vifs de mademoiselle Cunégonde dans les jardins du château. Un simple baiser derrière un paravent mit fin à ce paradis terrestre : le baron chassa le jeune rêveur à grands coups de pied.`,

      `Chapitre II — Ce que devint Candide parmi les soldats bulgares

Chassé du château par une neige glaciale, sans argent et tremblant de faim, Candide parvint péniblement aux portes d’une taverne voisine. Deux hommes vêtus de bleu remarquèrent sa taille droite et lui offrirent un dîner copieux tout en buvant à la santé du roi des Bulgares. Dès qu’il eut prononcé qu’il aimait bien le genre humain, on lui passa des fers aux chevilles et on l’emmena au régiment pour lui apprendre l’exercice militaire à coups de baguette.

Un matin de printemps, tandis qu’il tentait une simple promenade philosophique sans autorisation, il fut rattrapé par quatre soldats et condamné aux verges devant tout le bataillon. Peu après, la guerre éclata dans une plaine couverte de fanfares héroïques et de canons tonnants. Caché derrière des broussailles tandis que des milliers d’hommes périssaient selon les lois de la discipline militaire, Candide choisit de fuir vers la Hollande pour vérifier si le bonheur existait ailleurs.`,

      `Chapitre III — L’accueil généreux de Jacques l’anabaptiste et la tempête de Lisbonne

En Hollande, où chacun vantait la charité chrétienne sans vouloir partager son pain, Candide rencontra heureusement un honnête commerçant anabaptiste nommé Jacques, qui le logea dans sa maison propre et l’employa dans sa manufacture d’étoffes. Le lendemain, il reconnut dans la rue un mendiant défiguré en qui il retrouva avec stupeur son ancien maître Pangloss, éprouvé par la misère mais toujours fidèle à la doctrine du meilleur des mondes possibles.

Jacques embarqua les deux philosophes vers le Portugal pour affaires de négoce. À peine approchaient-ils de la baie de Lisbonne qu’un ouragan terrible souleva des montagnes d’écume, suivi d’un tremblement de terre effroyable qui renversa la moitié de la ville en quelques instants. Tandis que Jacques périssait en tentant de secourir un matelot ingrat, Candide et Pangloss échappèrent aux décombres pour réfléchir avec amertume aux causes suffisantes de tant de malheurs.`,

      `Chapitre IV — L’autodafé et les retrouvailles inespérées avec Cunégonde

Après la secousse sismique, les docteurs de l’université décidèrent que le spectacle d’un autodafé solennel apaiserait les tremblements de terre. Pangloss fut pendu pour avoir parlé trop librement de la nécessité universelle, et Candide reçut le fouet en cadence avant d’être secouru secrètement la nuit même par une vieille femme mystérieuse qui pansa ses plaies avec des onguents parfumés.

Quelle ne fut pas sa stupéfaction lorsqu’elle le conduisit dans une maison écartée devant mademoiselle Cunégonde elle-même, qu’il croyait morte depuis la ruine du château westphalien ! Celle-ci lui raconta ses pérégrinations douloureuses entre un inquisiteur craintif et un riche banquier de Lisbonne. Contraint de se défendre lorsque ses deux rivaux entrèrent à l’improviste, Candide les mit hors d’état de nuire et s’enfuit au galop vers Cadix avec sa compagne et la fidèle vieille.`,

      `Chapitre V — Traversée vers le Nouveau Monde et découverte du Paraguay

À Cadix, l’esprit vif et discipliné de Candide lui valut un grade modeste dans une expédition envoyée vers l’Amérique méridionale. Durant la longue traversée océanique, chacun raconta l’histoire de ses infortunes passées, prouvant que la souffrance humaine dépassait de loin les rêveries paisibles des philosophes de cabinet. À peine arrivés à Buenos Aires, la séparation menaça de nouveau les amants, obligeant Candide à gagner l’intérieur des terres avec son fidèle valet Cacambo.

En pénétrant dans les territoires administrés avec un ordre rigoureux par les jésuites du Paraguay, ils rencontrèrent un commandant militaire à la stature imposante qui se révéla être le propre frère de Cunégonde, rescapé lui aussi des malheurs européens. Mais l’orgueil nobiliaire du jeune baron reprit aussitôt le dessus lorsqu’il refusa que sa sœur épousât un homme sans soixante-douze quartiers de noblesse, déclenchant une querelle d’épée qui força les deux voyageurs à reprendre la fuite vers la forêt.`,

      `Chapitre VI — Les Oreillons et les merveilles dorées de l’Eldorado

Perdus dans des contrées inexplorées, Candide et Cacambo échappèrent de justesse à une tribu guerrière grâce à l’ingéniosité linguistique du valet, avant de s’engager sur une rivière impétueuse qui s’engouffrait sous des voûtes de pierre. Rejetés au bout d’une course vertigineuse dans une vallée entourée de montagnes infranchissables, ils découvrirent un pays extraordinaire où les chemins brillaient de poussière d’or et où les enfants jouaient aux palets avec des émeraudes.

Dans cet Eldorado paisible, les citoyens ignoraient les procès, les prisons et les querelles religieuses ; les palais des sciences remplaçaient les cours de justice, et chacun remerciait simplement le Créateur des bienfaits reçus. Le roi accueillit les étrangers avec une bienveillance simple et leur offrit cent moutons rouges chargés de pierreries lorsqu’ils exprimèrent le désir irrésistible de retrouver Cunégonde en Europe.`,

      `Chapitre VII — Le sage Martin et les désillusions parisiennes et vénitiennes

Au Surinam, volés par un armateur sans scrupules et affligés par la rencontre d’un esclave mutilé dénonçant le prix du sucre européen, Candide recruta pour compagnon de route le philosophe Martin, esprit amer mais lucide qui doutait que la bonté gouvernât le globe. Ensemble, ils traversèrent l’Atlantique en débattant sans fin du bien et du mal, avant d’observer à Paris le tourbillon des critiques littéraires, des salons superficiels et des jeux de hasard ruineux.

Ils poursuivirent leur route jusqu’à Venise, où le carnaval dissimulait sous ses masques de soie l’ennui profond des rois détrônés et des sénateurs désabusés. Même le seigneur Pococuranté, propriétaire de tableaux de Raphaël et de livres rares, avoua n’éprouver aucun plaisir sincère devant ses trésors. Candide comprit alors que la richesse ne garantissait jamais la paix de l’esprit.`,

      `Chapitre VIII — Le vieillard turc et la sagesse de cultiver son jardin

Finalement réunis près de Constantinople grâce aux dernières pierreries conservées, Candide, Cunégonde, Martin et Pangloss — miraculeusement rescapé de sa pendaison manquée — achetèrent une petite métairie sur les rives du Bosphore. Mais l’oisiveté engendrait bientôt des disputes continuelles, chacun se plaignant de son sort passé ou discutant stérilement sur le destin du monde.

Un jour, ils rendirent visite à un bon vieillard turc qui respirait la sérénité sous ses orangers. Celui-ci leur apprit qu’il ne s’inquiétait jamais des intrigues de la cour impériale, car le travail éloignait de lui trois grands maux : l’ennui, le vice et le besoin. Rentré à la ferme, chacun se mit aussitôt à bêcher la terre, à filer la laine et à cuire le pain. Et lorsque Pangloss voulut encore démontrer l’enchaînement merveilleux des malheurs passés, Candide répondit simplement : « Cela est bien dit, mais il faut cultiver notre jardin. »`,
    ],
  }),
];

const GERMAN_NOVELS: ContentItem[] = [
  buildNovel({
    id: 'full-de-verwandlung',
    gutenbergId: 5200,
    title: 'Die Verwandlung — Vollständige Novelle (Kapitel I–VIII)',
    author: 'Franz Kafka',
    language: 'de',
    genre: 'fiction',
    summary: 'Vollständige Erzählung in acht Abschnitten über Gregor Samsas rätselhaftes Erwachen, die Entfremdung in der Familie und die Stille des letzten Morgens.',
    chunks: [
      `Kapitel I — Das rätselhafte Erwachen im stillen Zimmer

Als Gregor Samsa eines Morgens aus unruhigen Träumen erwachte, fand er sich in seinem Bett zu einem ungeheueren Ungeziefer verwandelt. Auf seinem gepanzerten Rücken liegend, sah er beim Heben des Kopfes seinen gewölbten, von bogenförmigen Versteifungen geteilten Leib, während zahllose dünne Beine hilflos vor seinen Augen flimmerten. Draußen trommelte ein grauer Regen gegen das Fensterblech und machte ihn melancholisch.

Zuerst glaubte er, eine ruhige Minute genüge, um diesen wunderlichen Spuk abzuschütteln. Er dachte an die Mühsale seines Berufes als Tuchreisender: das ewige Zugfahren im Morgengrauen, das schlechte unregelmäßige Essen und die kalte Gleichgültigkeit fremder Geschäftspartner. Doch als er sich zur rechten Seite drehen wollte, schaukelte der breite Rücken jedes Mal unerbittlich zurück, sodass er die bittere Wirklichkeit seiner Veränderung nicht länger leugnen konnte.`,

      `Kapitel II — Der Prokurist vor der verschlossenen Tür

Schon schlug es Viertel vor sieben, und Gregor begriff mit Entsetzen, dass er seinen Frühzug verpasst hatte. Zuerst klopfte die Mutter mit sanfter Sorge an die Tür, dann pochte der Vater ungeduldig mit der Faust, und Grete flüsterte besorgt durch den Spalt. Zu allem Unglück erschien kurz darauf der Prokurist persönlich im Vorzimmer, um nach dem Grund der unerhörten Verspätung zu fragen und Pflichtvergessenheit anzuprangern.

Gregor mühte sich mit äußerster Anstrengung, den Schlüssel im Schloss mit seinen Kiefern zu drehen, obgleich ihm braune Flüssigkeit aus dem Mund rann. Als er endlich die Tür aufstieß und sich halb ins Wohnzimmer neigte, ließ der Prokurist seinen Hut fallen und wich rückwärts zur Treppe zurück, während die Mutter ohnmächtig zusammensank und der Vater mit einem Stock drohend in Gregors Zimmer drängte.`,

      `Kapitel III — Die ersten Tage in der Dämmerung

Nach diesem stürmischen Vormittag kehrte eine gedrückte Stille in die Wohnung ein. Gregor richtete sich unter dem niedrigen Sofa ein, wo sein empfindlicher Leib Schutz vor neugierigen Blicken fand, wenn jemand das Zimmer betrat. Zu seiner Überraschung schmeckte ihm die gewohnte frische Milch nicht mehr; stattdessen zog ihn der strenge Geruch von halbverfaultem Gemüse, alten Knochen und starkem Käse an, die seine Schwester ihm auf altem Zeitungspapier hinstellte.

Aus den gedämpften Gesprächen im Speisezimmer erfuhr er bald die nackte Wahrheit über die Lage der Familie: Nach dem Zusammenbruch des väterlichen Geschäfts vor fünf Jahren hatten alle geglaubt, die Schuldenlast ruhe allein auf Gregors Schultern, doch in Wahrheit hatte der Vater kleine Ersparnisse zurückgelegt. Dennoch bedrückte Gregor weniger die Not als die schmerzliche Erkenntnis, wie schnell seine jahrelange Aufopferung vergessen schien.`,

      `Kapitel IV — Gretes Fürsorge und das Ausräumen der Möbel

Während Wochen vergingen, wagte allein die junge Grete den täglichen Gang in das verdunkelte Zimmer. Sie erkannte rasch, welche Reste ihr Bruder bevorzugte, und fegte die Überbleibsel wortlos zusammen, noch bevor er sich unter dem Kanapee hervorwagte. Um dem Tier mehr Raum zum Klettern an den kühlen Wänden und der hohen Zimmerdecke zu verschaffen, beschloss sie eines Tages gemeinsam mit der Mutter, Schrank, Truhe und Schreibtisch hinauszuschaffen.

Als Gregor jedoch sah, wie ihm die letzten vertrauten Gegenstände seiner menschlichen Vergangenheit genommen wurden, stieg panische Angst in ihm auf. Er kroch hastig an der Tapete empor und presste seinen heißen Bauch an das gerahmte Bild einer Dame im Pelzmuff, fest entschlossen, wenigstens dieses Stück Erinnerung zu verteidigen. Beim Anblick der riesigen Gestalt an der geblümten Wand verlor die Mutter erneut das Bewusstsein.`,

      `Kapitel V — Die Rückkehr des Vaters und die Verwundung

Genau in jenem Augenblick kehrte der Vater in seiner neuen blauen Dieneruniform mit blanken Goldknöpfen aus der Bank zurück. Wütend nahm er an, Gregor habe eine Gewalttat gegen die Mutter verübt, und verfolgte seinen entsetzten Sohn rund um den runden Esstisch. Da er den flüchtenden Körper nicht greifen konnte, griff er in eine Schale auf der Anrichte und schleuderte glänzende rote Äpfel durch die Luft.

Einer dieser Äpfel traf Gregor mit voller Wucht mitten in den gepanzerten Rücken und bohrte sich tief in das weiche Fleisch darunter. Betäubt vor Schmerz blieb der Getroffene am Boden liegen, während die Mutter flehend ihre Arme um den Hals des Vaters schlang und um Schonung bat. Niemand wagte es später, die eingewachsene Frucht herauszuziehen, sodass sie als sichtbares Mal der Entfremdung stecken blieb.`,

      `Kapitel VI — Ermüdung der Familie und die drei Zimmerherren

Monatelang heilte die entzündete Wunde nur langsam und raubte Gregor jede frühere Beweglichkeit. Zugleich veränderte sich der Haushalt grundlegend: Der Vater weigerte sich selbst abends, seine Uniform auszuziehen, die Mutter nähte feine Wäsche für ein Modegeschäft, und Grete lernte abends Stenografie und Französisch, nachdem sie tagsüber als Verkäuferin gestanden hatte. Da das Geld dennoch knapp blieb, vermietete man eines der größeren Zimmer an drei schweigsame Herren mit langen Vollbärten.

Für Gregor gab es nun kaum noch Aufmerksamkeit. Eine grobe Bedienerin übernahm hastig das Aufräumen und verspottete ihn im Vorbeigehen, während man begann, überflüssige Kisten, Ascheimer und Gerümpel einfach in sein Zimmer zu schieben. Staub legte sich auf die Möbel, und das einst geordnete Leben des Hauses schrumpfte auf kühle Müdigkeit zusammen.`,

      `Kapitel VII — Der Abend der Geigenmusik im Wohnzimmer

Eines Abends öffnete man gegen die Gewohnheit die Verbindungstür ein wenig, als Grete in der Küche für die drei Zimmerherren auf ihrer Violine zu spielen begann. Während die Mieter sich anfangs enttäuscht zurückzogen und gelangweilt am Fenster standen, zog die feine Melodie Gregor unwiderstehlich aus seiner dunklen Ecke hervor. Langsam schob er sich über den staubigen Teppich ins beleuchtete Wohnzimmer, getragen von der stillen Frage, ob er wirklich ein Tier sei, wenn Musik ihn so tief bewegte.

Als einer der Herren ihn plötzlich entdeckte und empört das Mietverhältnis auf der Stelle kündigte, brach die Geduld der Schwester endgültig zusammen. Sie erklärte mit zitternder Stimme vor den Eltern, dieses Untier könne unmöglich ihr Bruder sein, denn ein echter Gregor hätte längst begriffen, dass ein Zusammenleben unmöglich sei, und wäre freiwillig fortgegangen.`,

      `Kapitel VIII — Die ruhige Morgendämmerung und der Ausflug ins Freie

Schwerfällig und ohne jeden Groll schleppte sich Gregor in sein leeres Zimmer zurück und hörte noch, wie Grete den Schlüssel von außen umdrehte. In der tiefen Stille jener Nacht überdachte er seine ganze Familie mit Rührung und stiller Liebe, bevor sein Kopf kraftlos auf die Dielen sank und der letzte schwache Atemzug um drei Uhr morgens entwich.

Am nächsten Morgen fand die Bedienerin den flachen, ausgetrockneten Körper und meldete mit ruhiger Gelassenheit, man brauche sich darum keine Sorgen mehr zu machen. Erleichtert schrieben die Eltern und die Tochter drei Entschuldigungsbriefe an ihre Arbeitgeber, setzten die unverschämten Mieter vor die Tür und fuhren mit der elektrischen Bahn hinaus ins sonnige Grüne. Unterwegs bemerkten Vater und Mutter still, wie schön und blühend ihre junge Tochter in den letzten Monaten geworden war.`,
    ],
  }),

  buildNovel({
    id: 'full-de-werther',
    gutenbergId: 2407,
    title: 'Die Leiden des jungen Werthers — Vollständiger Roman (Kapitel I–VIII)',
    author: 'Johann Wolfgang von Goethe',
    language: 'de',
    genre: 'fiction',
    summary: 'Vollständige Brieffolge in acht Abschnitten über Werthers Naturbegeisterung, seine leidenschaftliche Liebe zu Lotte und das tragische Scheitern.',
    chunks: [
      `Kapitel I — Wahlheim und die Trunkenheit des Frühlings

Wie froh bin ich, dass ich fort bin aus jener engen Stadt! In meinem ersten Brief aus dieser lieblichen Gegend atme ich die milde Frühlingsluft ein, die mein unruhiges Herz sogleich besänftigt. Ich habe ein kleines Wirtshaus in Wahlheim gefunden, nur eine Stunde entfernt, wo zwei gewaltige Linden den Kirchplatz beschatten und einfache Bauernkinder unter dem blauen Himmel spielen. Hier brauche ich keine Bücher, denn jeder Grashalm und jedes kleine Insekt im hohen Gras offenbart mir die lebendige Nähe des Unendlichen.

Ich zeichne wenig und fühle umso tiefer; meine ganze Seele ruht wie ein klarer Spiegel unter dem Glanz dieser Hügel. Selbst der alte Graf und die verständigen Beamten achten meine einsamen Spaziergänge, obschon ich spüre, dass die Menschen meist nach engen Regeln leben und die reine Kraft der Empfindung kaum mehr kennen.`,

      `Kapitel II — Der Ball auf dem Lande und die Begegnung mit Lotte

Gestern Abend fuhr ich mit jungen Bekannten in einer Kutsche zu einem ländlichen Tanzfest hinaus und sollte dort einem Menschen begegnen, der mein ganzes Dasein verändern würde. Als wir am Forsthaus hielten, um Lotte abzuholen, bot sich mir das anmutigste Bild meines Lebens: Sie stand im schlichten weißen Kleid mit blassroten Schleifen im Flur und schnitt ihren sechs jüngeren Geschwistern Schwarzbrot ab, jedem genau nach Alter und Appetit.

Auf dem Tanzboden wirbelte sie mit einer Leichtigkeit und Natürlichkeit dahin, die alles um sie her verblassen ließ. Als plötzlich ein Gewitter über die Obstgärten zog, die Lichter im Saal erloschen und der warme Regen auf das Laub niederging, stand sie neben mir am offenen Fenster, blickte in den erfrischten Abend hinaus und sprach leise den Namen Klopstocks aus — in diesem Augenblick versank ich völlig in dem Strom ihrer Empfindungen.`,

      `Kapitel III — Glückliche Sommertage und die Ankunft Alberts

Seit jenem Abend kenne ich keine andere Stunde als diejenige, die ich in Lottes Nähe verbringe. Oft reite ich nachmittags zum Jagdhaus hinaus, helfe den kleinen Brüdern beim Pflücken von Kirschen oder lausche ihrer reinen Stimme am Klavier, wenn sie ein einfaches Lied spielt, das alle Unruhe aus meiner Brust vertreibt. Sie weiß um mein ungestümes Herz, begegnet mir jedoch stets mit jener heiteren Güte, die mich zugleich selig macht und verzweifeln lässt.

In diese hellen Tage fällt nun die Rückkehr Alberts, ihres Verlobten, von seiner längeren Geschäftsreise. Ich kann ihm meine Achtung nicht versagen: Er ist ein ruhiger, redlicher und pflichtbewusster Mann von klarem Verstand. Doch eben diese kühle Ordnung macht mir schmerzlich bewusst, wie weit mein glühendes Gefühl von dem sicheren Lebensweg entfernt ist, den das Schicksal ihm bereitet hat.`,

      `Kapitel IV — Streitgespräche über Leidenschaft und Vernunft

Mit der Zeit wurden meine Gespräche mit Albert ernster, denn hinter seiner höflichen Freundschaft spürte ich die feste Mauer bürgerlicher Vernunft. Als ich eines Tages im Scherz ein Paar entladener Pistolen an meine Stirn hob, tadelte er jede Verirrung der Seele mit ruhiger Bestimmtheit und nannte die äußerste Verzweiflung eine bloße Schwäche des Willens.

Da flammte mein ganzes Innere auf, und ich entgegnete ihm, dass man einen Menschen, den das Fieber der Leidenschaft verzehrt, ebenso wenig schwach nennen dürfe wie einen Kranken, dessen Kräfte langsam schwinden. Die Natur selbst setzt dem Gefühl ein Maß, über das hinaus kein Trost der Vernunft mehr reicht. Lotte hörte unserem Streit mit besorgten Augen zu, doch Albert verließ das Zimmer kühl und ungerührt.`,

      `Kapitel V — Abschied von Wahlheim und die Enge der Gesandtschaft

Weil mein Aufenthalt im Tal meine innere Qual nur noch steigerte, entschloss ich mich endlich auf Rat meines Freundes Wilhelm zur Abreise und trat eine Stelle bei einem Gesandten in der Residenzstadt an. Doch statt Ruhe fand ich dort nur steife Eitelkeit, kleinlichen Rangstreit und papierene Pedanterie, unter der jede lebendige Regung ersticken musste.

Eines Abends geriet ich aus Unachtsamkeit in eine hochadlige Abendgesellschaft beim Grafen, wo man mich zunächst freundlich duldete, bald aber mit spitzen Blicken und frostigen Flüstern zurechtwies, bis mir der Hausherr höflich nahelegte, den Saal zu verlassen. Beschämt und zornig reichte ich mein Entlassungsgesuch ein und kehrte auf Umwegen in jenes Tal zurück, in dem meine Seele allein noch Atem fand.`,

      `Kapitel VI — Rückkehr zu Lotte und der Herbst im Herzen

Inzwischen war Albert mit Lotte vermählt, und der Herbst hatte die grünen Höhen rund um Wahlheim in fahles Gold und graue Nebel getaucht. Die beiden hohen Nussbäume vor dem Pfarrhaus, unter denen ich einst glückliche Nachmittage verbracht hatte, fand ich zu meinem tiefen Kummer gefällt; eine kühle Gleichgültigkeit schien über alle vertrauten Plätze ausgebreitet.

Auch Lottes Lächeln trug nun einen stillen Ernst, denn sie spürte die stumme Zerrissenheit, mit der ich ihre bescheidene Häuslichkeit besuchte. Selbst die Lektüre veränderte sich: Der heitere Homer meiner ersten Briefe wich den düsteren, nebelverhangenen Gesängen Ossians, in denen Heldengestalten zwischen stürmischen Heidefelsen klagend untergehen.`,

      `Kapitel VII — Die letzte Begegnung und das Vorlesen aus Ossian

Am Abend vor Weihnachten, als Albert verreist war, betrat ich zum letzten Mal Lottes Wohnzimmer, obwohl sie mich noch kurz zuvor gebeten hatte, bis zum Festtage fernzubleiben. Mit zitternder Stimme bat sie mich, aus meiner Übersetzung Ossians vorzulesen, um die drückende Stille zwischen uns zu überbrücken. Doch je weiter ich las von der Vergänglichkeit der Jugend und der Einsamkeit der Gräber, desto heftiger brach unser beider Schmerz hervor.

Lotte verbarg ihr Gesicht in den Händen und weinte bitterlich, während ich vor ihr niederfiel und ihre zitternden Hände küsste. Für einen kurzen Augenblick berührten sich unsere Lippen in voller Verzweiflung, doch sogleich riss sie sich erschrocken los, floh ins Nebenzimmer und schloss die Tür hinter sich mit den Worten, dass wir einander nie wiedersehen dürften.`,

      `Kapitel VIII — Die dunkle Mitternacht und das stille Grab unter den Linden

In jener kalten Dezembernacht schrieb ich meinen letzten Brief voller Ruhe an Lotte und schickte meinen Diener mit einer kurzen schriftlichen Bitte zu Albert, mir für eine bevorstehende Reise seine beiden Pistolen zu leihen. Mit zitternden Händen nahm Lotte die Waffen von der Wand, wischte schweigend den Staub ab und übergab sie dem Boten, ohne ein Wort über ihre dunkle Ahnung auszusprechen.

Als die Uhr des Turmes Mitternacht schlug, setzte der unglückliche Freund seinem irdischen Leiden ein Ende; erst am Morgen fand man ihn im blauen Frack und der gelben Weste auf dem Boden seines Zimmers. Kein Geistlicher folgte dem schlichten Sarg, als einfache Handwerker ihn spät nachts unter die zwei vertrauten Linden am Rande des Kirchhofs trugen, während Lotte zu Hause um ihr eigenes Leben rang.`,
    ],
  }),
];

const ITALIAN_NOVELS: ContentItem[] = [
  buildNovel({
    id: 'full-it-pinocchio',
    gutenbergId: 16865,
    title: 'Le Avventure di Pinocchio — Romanzo Completo (Capitoli I–VIII)',
    author: 'Carlo Collodi',
    language: 'it',
    genre: 'fiction',
    summary: 'Edizione completa in otto capitoli dalla bottega di Mastro Ciliegia alle peripezie tra il Paese dei Balocchi e il ventre del Pescecane.',
    chunks: [
      `Capitolo I — Il pezzo di legno parlante nella bottega di Mastro Ciliegia

C'era una volta un pezzo di legno da catasta, uno di quei ceppi comuni che d'inverno si mettono nei camini per accendere il fuoco e riscaldare le stanze. Un giorno capitò nella bottega di un vecchio falegname chiamato da tutti Mastro Ciliegia per la punta del naso sempre lucida e paonazza. Appena il maestro alzò l'ascia per sgrossarlo e ricavarne la gamba d'un tavolino, udì una vocina sottile che lo supplicava di non battere troppo forte.

Sbalordito e tremante come una foglia, Mastro Ciliegia cercò inutilmente chi avesse parlato sotto il banco o dentro l'armadio dei ferri. Quando poi prese la pialla per lisciare la corteccia, il ciocco rispose ridendo che gli faceva il solletico sul corpo. proprio in quell'istante bussò alla porta il suo vicino Geppetto, un vecchietto arzillo ma permaloso, deciso a costruirsi un burattino meraviglioso capace di ballare, tirare di scherma e girare il mondo per guadagnarsi un tozzo di pane.`,

      `Capitolo II — Geppetto intaglia Pinocchio e riceve i primi calci

Mastro Ciliegia colse l'occasione al volo e cedette volentieri quel legno indiavolato all'amico, non senza qualche nuovo battibecco tra i due vecchi testardi. Tornato nella sua stanzuccia modesta illuminata soltanto da un lume sottoscala, Geppetto afferrò gli arnesi da intaglio e cominciò subito a scolpire la figura del suo futuro figliolo, scegliendo per lui il nome fortunato di Pinocchio.

Non aveva ancora terminato di formare gli occhi che quelli già lo fissavano impertinenti; scolpito il naso, questo si allungò a dismisura sotto gli occhi sgomenti del povero padre; modellata la bocca, il burattino cominciò a ridere e a sbeffeggiarlo. Appena ebbe finito i piedi e lo posò sul pavimento per insegnargli a camminare, Pinocchio spiccò un salto fuori dall'uscio e corse via per le vie del borgo inseguito dalle grida affannate di Geppetto.`,

      `Capitolo III — Il Grillo Parlante e la fame dell'inverno

Fermato da un carabiniere che arrestò per errore il povero Geppetto tra i commenti della folla, Pinocchio tornò solo nella casetta vuota convinto di godersi finalmente la libertà. Ma dalle pareti scure spuntò un vecchio Grillo Parlante, saggio filosofo domestico che abitava in quella stanza da oltre cent'anni. Con voce grave lo ammonì che i ragazzi disubbidienti e svogliati finiscono sempre nei guai quando abbandonano la casa paterna e rifiutano lo studio.

Punto sul vivo da quel sermone noioso, Pinocchio scagliò un martello di legno contro il muro riducendo al silenzio l'importuno consigliere. Presto però la notte portò un freddo pungente e una fame feroce: il burattino cercò invano briciole nella pentola dipinta sul muro, trovò un solo uovo che si schiuse in un pulcino fuggitivo e, addormentatosi con i piedi di legno sul braciere acceso, si risvegliò all'alba senza più polpacci né scarpe.`,

      `Capitolo IV — La giacca venduta per l'abbecedario e il Gran Teatro dei Burattini

Quando Geppetto tornò intirizzito e gli rifabbricò pazientemente i piedi nuovi condividendo con lui tre pere mature, il cuore di legno di Pinocchio si commosse profondamente. Promise di diventare un ragazzo studioso e ubbidiente per consolare la vecchiaia del babbo. Geppetto, pur non possedendo un soldo in tasca, uscì nella neve e tornò tremando in maniche di camicia dopo aver venduto la propria casacca di fustagno per comprargli un bell'abbecedario nuovo.

Ma sulla strada della scuola il suono allegro di pifferi e gran cassa attirò il burattino davanti al Gran Teatro di Mangiafoco. Vendette senza pensarci l'abbecedario per quattro soldi di biglietto e irruppe sul palcoscenico accolto dall'abbraccio festoso di Arlecchino e Pulcinella. Infuriato per lo scompiglio, il gigantesco burattinaio decise dapprima di gettarlo sul fuoco per arrostire il montone, poi intenerito dal coraggio con cui Pinocchio difese l'amico Arlecchino gli donò cinque monete d'oro per Geppetto.`,

      `Capitolo V — La Volpe e il Gatto lungo la strada del Campo dei Miracoli

Mentre correva verso casa stringendo le monete d'oro nella mano di legno, Pinocchio incontrò lungo la via una Volpe zoppa e un Gatto finto cieco che camminavano sostenendosi a vicenda. Appena seppero del piccolo tesoro, i due furfanti elogiarono la sua generosità e gli raccontarono di un luogo incantato vicino a Acchiappacitrulli chiamato Campo dei Miracoli, dove bastava seppellire poche monete e innaffiarle per veder nascere un albero carico di zecchini rilucenti.

Sordo agli ultimi consigli del fantasma del Grillo Parlante che gli apparve tra le fronde, il credulo burattino si lasciò abbindolare all'Osteria del Gambero Rosso, dove i due compari cenarono lautamente a sue spese prima di dileguarsi nel cuore della notte. Ripreso il cammino solitario nella boscaglia tenebrosa, fu assalito da due briganti incappucciati in sacchi neri e salvato in extremis soltanto dal provvidenziale intervento di una dolce Fata dai capelli turchini.`,

      `Capitolo VI — La Fata dai capelli turchini e la bugia del naso lungo

Accolto nella casa candida nel bosco, Pinocchio rifiutò sulle prime una medicina amara finché la vista dei conigli neri venuti a portarlo via non lo convinse a obbedire con un sospiro. Quando la Fata gli chiese con dolcezza come mai avesse smarrito le sue monete d'oro nel bosco, il burattino si vergognò della propria leggerezza e inventò una serie di menzogne sfacciate per apparire innocente.

Ad ogni bugia pronunciata, il suo naso cresceva a vista d'occhio finché non riuscì più a girarsi tra le pareti della stanza senza urtare i vetri della finestra. La Fata lo lasciò piangere per qualche istante perché imparasse la lezione, poi chiamò uno stormo di picchi dal becco robusto che in pochi minuti ridussero il naso alla misura naturale. Risoluto a cambiare vita, Pinocchio promise di frequentare la scuola e raggiungere suo padre, ormai partito per mare alla ricerca del figlio disperso.`,

      `Capitolo VII — Il Paese dei Balocchi e la metamorfosi in ciuchino

Per mesi Pinocchio studiò con diligenza nell'Isola delle Api Industriose meritandosi l'affetto dei compagni e la promessa della Fata di trasformarlo finalmente in un ragazzo vero. Ma alla vigilia del grande giorno, l'amico svogliato Lucignolo lo convinse a salire sul carro notturno guidato dall'Omino di Burro verso il Paese dei Balocchi, un regno meraviglioso dove non esistevano libri, maestri né compiti, ma soltanto giochi continui dal mattino alla sera.

Dopo cinque mesi di spensierata baldoria, una mattina entrambi si risvegliarono con una febbre strana e due lunghe orecchie pelose spuntate ai lati della testa. Trasformati interamente in due ciuchini raglianti, furono venduti sul mercato: Pinocchio finì in un circo equestre tra frustate e salti nei cerchi infuocati, finché azzoppato non fu gettato in mare per ricavarne la pelle di tamburo e liberato dai pesci voraci che divorarono l'involucro asinino.`,

      `Capitolo VIII — Il ventre del Pescecane e il risveglio da ragazzo vero

Nuotando disperato tra le onde spumose verso uno scoglio lontano dove scorse la Fata trasformata in capretta turchina, Pinocchio fu inghiottito insieme ai banchi di tonni dall'enorme Pescecane lungo più di un chilometro. Nelle viscere tenebrose del mostro marino, guidato da un debole lumicino tremolante, riabbracciò in lacrime il vecchio Geppetto, sopravvissuto per due anni grazie alle provviste di un bastimento naufragato.

Sfruttando il momento in cui il mostro dormiva a bocca spalancata per l'asma sotto il cielo stellato, padre e figlio fuggirono a nuoto fino alla riva grazie all'aiuto generoso d'un grosso tonno riconoscente. Da quel giorno Pinocchio lavorò prima dell'alba girando la ruota dell'orto per comprare latte caldo al padre malato e studiò di sera con amore sincero, finché una mattina si guardò allo specchio e scoprì al posto del vecchio corpo di legno un ragazzo vivo, sano e felice.`,
    ],
  }),

  buildNovel({
    id: 'full-it-promessi',
    gutenbergId: 45201,
    title: 'I Promessi Sposi — Romanzo Completo (Capitoli I–VIII)',
    author: 'Alessandro Manzoni',
    language: 'it',
    genre: 'history',
    summary: 'Edizione completa in otto capitoli dal celebre ramo del lago di Como alla fuga notturna di Renzo e Lucia sotto la protezione di fra Cristoforo.',
    chunks: [
      `Capitolo I — Quel ramo del lago di Como e i bravi di don Rodrigo

Quel ramo del lago di Como, che volge a mezzogiorno tra due catene non interrotte di monti, tutto a seni e a golfi secondo lo sporgere e il rientrare di quelli, scende verso il ponte di Lecco dove le acque si restringono in fiume. Su una delle stradicciole sassose che costeggiano i vigneti e le ville sparse sulla riva, tornava lentamente verso casa sul tramonto del sette novembre 1628 il curato don Abbondio, recitando l'ufficio e spostando distrattamente con il piede i ciottoli del sentiero.

Alla svolta di un tabernacolo solitario gli si pararono davanti due figuri dall'aria spavalda, con lunghi ciuffi calati sugli occhi, cinturoni di cuoio e pistole alla cintura: erano due bravi al servizio del prepotente don Rodrigo. Con voce bassa ma perentoria intimarono al timido sacerdote di non celebrare l'indomani il matrimonio già fissato tra Lorenzo Tramaglino e Lucia Mondella, lasciando il povero parroco preda di un terrore paralizzante.`,

      `Capitolo II — L'alba amara di Renzo e le lacrime nella casa di Lucia

Dopo una notte insonne trascorsa tra la paura delle minacce signorili e il timore dello sdegno dei giovani, don Abbondio accolse il mattino seguente lo sposo Renzo Tramaglino, arrivato vestito a festa e pieno di gioiosa impazienza. Con pretesti confusi e citazioni latine incomprensibili sui presunti impedimenti canonici, il curato cercò di guadagnare tempo e rinviare le nozze di due settimane, scatenando dapprima la perplessità e poi il sospetto del giovane filatore di seta.

Uscito dalla canonica con il cuore gonfio d'amarezza, Renzo strappò la verità al povero Perpetua e poi allo stesso curato spaventato, venendo finalmente a conoscenza del nome odiato di don Rodrigo. Salito alla casetta modesta dove Lucia si preparava insieme alle amiche con i fiori nei capelli, comunicò la notizia funesta che gettò la fanciulla e sua madre Agnese nello sgomento più profondo, spingendole a cercare aiuto al convento di Pescarenico.`,

      `Capitolo III — Il consiglio di Agnese e il dottor Azzeccagarbugli

Mentre Lucia confidava alla madre che già nei giorni precedenti il signorotto aveva tentato di molestarla lungo la strada della filanda con una scommessa infame, Agnese cercò una via legale per difendere i due promessi. Convinta che bastasse leggere le gride pubbliche contro i prepotenti per ottenere giustizia rapida, persuase Renzo a recarsi in città con quattro capponi grassi nello zaino per consultare l'avvocato Azzeccagarbugli.

Accolto nello studio ingombro di polverose carte bollate, il dottore sciorinò subito decreti severissimi credendo che Renzo fosse un bravo bisognoso di protezione; ma appena udì pronunciare il nome temuto di don Rodrigo, cambiò tono all'improvviso, si strinse nelle spalle, restituì i capponi e cacciò il giovane dalla porta. Nello stesso pomeriggio arrivò però al casolare fra Galdino, annunciando che il coraggioso fra Cristoforo sarebbe accorso presto al loro fianco.`,

      `Capitolo IV — La giovinezza di fra Cristoforo e il perdono nel convento

Prima di vestire il saio umile dei cappuccini, fra Cristoforo era stato Lodovico, figlio generoso ma orgoglioso di un ricco mercante che aveva cercato di far dimenticare le origini umili attraverso opere generose e una fierezza pronta a difendere i deboli. Un giorno, lungo una strada stretta di città, una contesa futilissima sulla precedenza del marciapiede con un nobile arrogante degenerò in un duello sanguinoso in cui perì sia l'avversario sia il fedele servitore Cristoforo che aveva tentato di difenderlo.

Ferito nel corpo e trafitto dal rimorso per quel sangue versato, Lodovico si rifugiò in un convento vicino, prese il nome del servitore morto per amor suo e volle chiedere pubblicamente perdono ai parenti dell'ucciso nel loro palazzo gremito di cavalieri. Quel gesto umile e sincero commosse persino gli avversari, trasformandolo per sempre in un difensore instancabile degli oppressi e dei poveri della terra.`,

      `Capitolo V — La sfida al palazzotto di don Rodrigo

Salito con passo fermo all'alba verso il paesello di Lucia, fra Cristoforo ascoltò la storia dolorosa delle persecuzioni subite e promise alle donne di affrontare personalmente il signore del luogo. Raggiunse il palazzotto isolato sul colle, custodito da bravi silenziosi e cani ringhiosi, proprio mentre don Rodrigo sedeva a banchetto rumoroso con il cugino Attilio, il podestà e vari commensali intenti a discutere di duelli, cavalleria e politica spagnola.

Condotto in disparte in una sala adorna di ritratti severi d'antenati, il frate parlò con fermezza serena invitando il nobile a rispettare una fanciulla innocente protetta da Dio. Ma don Rodrigo, ferito nell'orgoglio, esplose in insulti sprezzanti cacciando via il religioso. Nel momento estremo, fra Cristoforo alzò la mano profetica ammonendo che sarebbe venuto un giorno in cui l'oppressore stesso avrebbe tremato davanti alla giustizia eterna.`,

      `Capitolo VI — L'inganno del matrimonio a sorpresa e l'avviso di Menico

Deluso dal rifiuto superbo di don Rodrigo ma risoluto a non abbandonare i suoi protetti, il frate tentò di guadagnare qualche ora preziosa prima che il tiranno mettesse in atto un rapimento violento. Frattanto Agnese aveva concepito un piano audace appreso dalla tradizione popolare: sorprendere don Abbondio in casa propria la sera stessa e pronunciare davanti a due testimoni fidati le formule sacramentali del matrimonio, rendendolo valido dinanzi alla Chiesa.

Nonostante i forti scrupoli morali di Lucia, spaventata dall'idea di agire di nascosto, i preparativi procedettero in silenzio grazie all'aiuto di Tonio e di suo fratello Gervaso. Poco prima del calar della notte, tuttavia, il giovane Menico corse trafelato dal convento portando un avvertimento urgente di fra Cristoforo: i bravi stavano già per circondare la casa di Lucia per rapirla nel cuore delle tenebre.`,

      `Capitolo VII — La notte degli imbrogli nella casa di don Abbondio

Al calar della luna dietro le montagne, le due bande si misero in moto in direzioni opposte lungo i viottoli deserti del villaggio. Il Griso e i suoi sgherri penetrarono furtivamente nella casetta vuota di Agnese restando beffati dalla fuga improvvisa delle donne, mentre Renzo e Lucia raggiungevano con passo trattenuto l'uscio socchiuso della canonica dove Tonio fingeva di voler saldare un vecchio debito di venticinque lire.

Quando don Abbondio si voltò verso il tavolo per scrivere la ricevuta al lume della candela, Renzo pronunciò rapidamente le parole del matrimonio, ma prima che Lucia potesse terminare la risposta il parroco le gettò il tappeto sul volto spegnendo il lume e gridando aiuto dalla finestra. Il rintocco furioso della campana a martello suonata dal sagrestano Ambrogio mise in fuga sia i congiurati sia i bravi, salvando per un soffio gli sposi nell'oscurità generale.`,

      `Capitolo VIII — Addio monti sorgenti dall'acque sulla barca notturna

Guidati da Menico attraverso i viottoli silenziosi fino alla riva sassosa di Pescarenico, Renzo, Lucia e Agnese raggiunsero la chiesa illuminata da una lampada fioca dove fra Cristoforo li attendeva in preghiera. Il cappuccino consegnò loro lettere di raccomandazione per un convento amico di Monza e per un confratello di Milano, benedicendoli con commozione prima che salissero sopra la barca preparata da un pescatore fidato.

Mentre i remi fendevano dolcemente l'acqua immobile del lago sotto il chiarore argenteo della luna, Lucia tenne lo sguardo fisso sulle cime familiari dei monti che si allontanavano nella notte, sulle ville bianche adagiate tra gli ulivi e sulla chiesetta del paese natio. Nel silenzio rotto soltanto dallo sciabordio delle onde, l'animo suo rivolse un addio struggente alla terra amata, affidando il ritorno futuro alla misericordia della Provvidenza.`,
    ],
  }),
];

const TURKISH_NOVELS: ContentItem[] = [
  buildNovel({
    id: 'full-tr-intibah',
    title: 'İntibah: Sergüzeşt-i Ali Bey — Tam Roman Metni (Bölüm I–VIII)',
    author: 'Namık Kemal',
    language: 'tr',
    genre: 'fiction',
    summary: 'Türk edebiyatının ilk edebî romanlarından İntibah’ın sekiz bölümlük tam kurgusu: Ali Bey’in bahar gezintisi, Mehpeyker tutkusu ve Dilaşub’un fedakârlığı.',
    chunks: [
      `Bölüm I — Çamlıca Baharı ve Genç Ali Bey'in Kalp Uyanışı

İstanbul'un bahar sabahlarında Çamlıca sırtları yeşil bir halı gibi Boğaziçi'nin mavi sularına doğru serilir, bülbüllerin şakıması taze yaprakların hışırtısına karışırdı. Varlıklı ve seçkin bir ailenin tek oğlu olarak özenle yetiştirilmiş bulunan yirmi yaşlarındaki Ali Bey, babasının vefatından sonra içine kapandığı derin hüznü dağıtmak için ilk kez kalabalık mesire yerlerine çıkmaya başlamıştı. Annesi Fatma Hanım, oğlunun bu durgun hâlini dağıtabilmesi için dostlarının telkinine uymuş, ona tabiatın canlılığı içinde teselli aramasını salık vermişti.

Bir cuma günü arabasından inip çınar gölgelerinde dolaşırken Ali Bey'in gözleri, süzülen ince endamı ve mağrur bakışlarıyla bütün gezinti yerinin dikkatini üzerine çeken Mehpeyker'e takıldı. İlk bakışta kalbine işleyen bu hayranlık, ömrü boyunca yalnızca kitapların ve düzenli bir aile hayatının terbiyesiyle yaşamış saf genci o ana kadar hiç tatmadığı fırtınalı bir sevdanın eşiğine getirdi.`,

      `Bölüm II — Köşkteki Buluşmalar ve Masumiyetin Sınanışı

Çok geçmeden Ali Bey ile Mehpeyker arasında gizli mektuplarla başlayan yakınlaşma, Üsküdar sırtlarındaki tenha bir köşkte sıklaşan görüşmelere dönüştü. Saf ve tecrübesiz yüreğiyle karşısındaki kadının gösterişli sözlerine bütünüyle inanan genç adam, her ziyarette biraz daha kendi benliğinden ve evinin sıcak düzeninden uzaklaşıyordu. Annesinin sessiz gözyaşlarını fark etse de gönlünü saran tutkunun büyüsünden bir türlü sıyrılamıyordu.

Oysa parlak güzelliğinin ardında karanlık bir geçmiş ve hırslı bir gurur saklayan Mehpeyker, Ali Bey'in hem servetini hem de saygınlığını kendi nüfuzu altına almak niyetindeydi. Genç adamın safça gösterdiği her sadakat nişanesi, tecrübeli kadının gözünde yalnızca kolayca yönlendirilecek bir zaafın belirtisinden ibaretti.`,

      `Bölüm III — Fatma Hanım'ın Endişesi ve Dilaşub'un Gelişi

Oğlunun günden güne solgunlaştığını, geceleri eve geç döndüğünü ve gözlerindeki eski huzurun yerini hırçın bir dalgınlığa bıraktığını gören Fatma Hanım, onu bu tehlikeli bağdan kurtarmanın yollarını aramaya başladı. Eski aile dostlarıyla istişare ettikten sonra konağa hem zarif hem de tertemiz kalpli bir genç kız olan Dilaşub'u almaya karar verdi. Dilaşub, altın sarısı saçları, yumuşak sesi ve ağırbaşlı edasıyla girdiği her odaya sessiz bir bahar havası getiriyordu.

Başlangıçta bu iyi niyetli çabaya ilgisiz kalan Ali Bey, zamanla Dilaşub'un gösterişten uzak sevgisiyle Mehpeyker'in yapmacık nazları arasındaki derin farkı sezmeye başladı. Ancak tam kalbi doğru limana yaklaşırken, gerçeği öğrenen Mehpeyker'in içinde sönmeyecek bir kıskançlık ve intikam ateşi tutuştu.`,

      `Bölüm IV — İhanet İftirası ve Konağın Dağılışı

Ali Bey'in kendisinden soğuduğunu ve Dilaşub ile kurduğu yeni yuvada huzur bulduğunu öğrenen Mehpeyker, eski dostu Abdullah Efendi'nin de yardımıyla şeytani bir tuzak hazırladı. Genç adamın evden uzak olduğu günlerde konağa sızdırılan sahte mektuplar ve çarpıtılmış tanıklıklar aracılığıyla Dilaşub'un sadakatine dair şüphe uyandıracak ağır bir iftira düzeneği kurdu.

Öfke ve kıskançlık içinde gerçekleri araştırmadan hüküm veren Ali Bey, gözleri kararmış bir hâlde masum eşini suçlayarak konaktan uzaklaştırdı. Yıllardır evladının mutluluğu için çırpınan Fatma Hanım bu haksız yıkıma ve oğlunun düştüğü derin gaflete dayanamayarak yatağa düştü; çok geçmeden keder içinde hayata gözlerini yumdu.`,

      `Bölüm V — Savrulan Miras ve Acı Gerçeğin Ortaya Çıkışı

Annesinin ölümünün ardından tamamen yalnız kalan Ali Bey, vicdan azabını bastırmak için daha da karanlık bir hayata sürüklendi ve baba mirasını dikkatsiz eğlencelerde tüketmeye başladı. Bu arada Mehpeyker'in eline düşmüş bulunan talihsiz Dilaşub, bütün aşağılamalara rağmen sevdiği adamın adını temiz tutmak için sabırla direniyor, hiçbir tehdit karşısında onurundan ödün vermiyordu.

Tesadüfen karşılaştığı eski bir tanıdıktan vaktiyle kurulan kumpasın bütün ayrıntılarını öğrenen Ali Bey, başından aşağı kaynar sular dökülmüş gibi sarsıldı. Masum bir kadını haksız yere harcadığını ve annesinin ölümüne kendi körlüğünün sebep olduğunu anlayınca, öfkesini hem kendisine hem de bu yıkımı hazırlayanlara çevirdi.`,

      `Bölüm VI — Tuzak Gecesi ve Hırpani Kıyafetli Suikast Planı

Ali Bey'in gerçekleri öğrendiğini fark eden Mehpeyker, genç adamın kendisinden hesap sormasından korkarak onu ortadan kaldırmak için son bir plan kurdu. Kiralık adamı Hırpani ile anlaşarak Ali Bey'i ıssız bir bağ evine davet ettirdi ve gece yarısı odasına sızılacak karanlık bir pusu hazırladı. Planın her ayrıntısını gizlice işiten Dilaşub ise canı pahasına Ali Bey'i kurtarmaya karar verdi.

O gece Ali Bey'e haber ulaştıramayacağını anlayan vefalı kadın, tehlikeyi üzerine çekmek için cesurca bir fedakârlık düşündü. Genç adamın geleceği odaya bizzat kendisi girerek onun paltosunu üzerine geçirdi ve yaklaşan adımların önüne siper olmayı göze aldı.`,

      `Bölüm VII — Bağ Evindeki Fedakârlık ve Ölümcül Yanılgı

Gece yarısı rüzgârın ağaçları sarstığı bir saatte bağ evinin karanlık odasına giren katil, yatakta Ali Bey'in paltosuyla uyuyan karaltıyı hedef alarak hançerini indirdi. Kısa bir süre sonra yetişen Ali Bey, kanlar içinde yerde yatan kişinin kendisine ihanet ettiği sanılan Dilaşub olduğunu ve bu ölümü sırf onun hayatını kurtarmak için seçtiğini görünce aklını yitirecek gibi oldu.

Son nefesini verirken bile Ali Bey'e kin duymadığını fısıldayan Dilaşub'un ardından odada büyük bir boğuşma yaşandı; öfkeden gözü dönen Ali Bey, bunca yıkımın mimarı olan Mehpeyker'i oracıkta cezalandırarak kanlı gecenin ortasında adaletsizliğin hesabını kendi elleriyle gördü.`,

      `Bölüm VIII — Zindandaki Uyanış ve Acı İntibah

Kanlı gecenin sabahında teslim olan Ali Bey, mahkeme huzurunda işlediği suçu bütün çıplaklığıyla anlattı ve altı ay süren ağır bir hapis hayatının kapısından içeri girdi. Soğuk duvarlar arasında geçen her gün, geçmişin gösterişli hayallerini zihninden silip yerine acı bir uyanış — yani gerçek bir intibah — bıraktı.

Masumiyetin kıymetini onu kaybettikten sonra anlamanın dayanılmaz ağırlığı altında sağlığı hızla bozulan genç adam, cezasının bitmesine günler kala sessizce hayata veda etti. Ardında bıraktığı ibret dolu hikâye, gençlik heyecanlarının akıl ve vicdanla dengelenmediğinde nasıl derin felaketlere yol açabileceğini gösteren unutulmaz bir ders olarak kaldı.`,
    ],
  }),

  buildNovel({
    id: 'full-tr-araba',
    title: 'Araba Sevdası — Tam Roman Metni (Bölüm I–VIII)',
    author: 'Recaizade Mahmud Ekrem',
    language: 'tr',
    genre: 'fiction',
    summary: 'Yanlış Batılılaşma eleştirisinin başyapıtı Araba Sevdası’nın sekiz bölümlük tam kurgusu: Bihruz Bey, Çamlıca gösterişi ve Periveş hayal kırıklığı.',
    chunks: [
      `Bölüm I — Çamlıca Bahçesi'nin Kuralları ve Züppe Bihruz Bey

Yaz aylarında İstanbul'un yüksek tabakası için Çamlıca Millet Bahçesi, doğayı seyretmekten çok birbirinin kıyafetini, faytonunu ve Fransızca terimlerle süslü konuşmalarını süzmek için gidilen bir gösteri sahnesiydi. Yirmi üç yaşlarındaki Bihruz Bey, babasından kalan geniş mirasa güvenerek memuriyet kalemine ayda yılda bir uğrayan, vaktinin tamamını terziler, berberler ve yabancı roman çevirileri arasında geçiren alafranga meraklısı bir gençti.

En büyük tutkusu, pahalı kumaşlardan diktirdiği dar redingotuyla açık bir lando arabaya kurulup tozlu yollardan hızla geçmek ve halkın kendisine hayranlıkla baktığını sanmaktı. Kendi dilini bayağı bularak her cümlesine yarım yamalak Fransızca kelimeler sıkıştırıyor, gerçek kültür yerine dış görünüşteki parıltıyı medeniyet zannediyordu.`,

      `Bölüm II — Sarışın Hanımefendi ve İlk Yanılgı

Güneşli bir cuma akşamüstü Bihruz Bey, yeni yaptırdığı krem rengi arabasıyla bahçe kapısından içeri girerken, kenardaki kanepede oturmuş zarif tavırlı sarışın bir genç hanım gözüne ilişti. Kadının beyaz tül şemsiyesi ve ince gülümsemesi karşısında aklı başından giden genç adam, bu hanımın mutlaka asil ve köklü bir paşa ailesinin iyi eğitimli kızı olduğuna hiç tereddüt etmeden hükmetti.

Yanındaki arkadaşı Keşfi Bey'in alaylı bakışlarına aldırmadan hemen arabasını o yöne sürdürdü, selam verip karşılık aldığını sanarak kalbinde büyük bir aşk romanının başladığına inandı. Hâlbuki hayallerinde soylu bir kontese benzettiği Periveş Hanım, gerçekte sıradan ve geçim derdindeki bir çevreden gelen neşeli bir kadından başkası değildi.`,

      `Bölüm III — Aşk Mektubu Çabaları ve Sözlük Sayfaları

Ertesi sabah çalışma odasına kapanan Bihruz Bey, sevgilisine hayranlığını bildiren eşsiz bir mektup kaleme almaya koyuldu. Ancak ne duygularını Türkçe zarif bir üslupla ifade edebilecek edebî birikime sahipti ne de sözlük karıştırmadan düzgün bir Fransızca cümle kurabiliyordu. Masasının üzerine dizdiği lügatler, yarım kalmış şiir mecmuaları ve buruşturulmuş kâğıtlar arasında saatlerce ter döktü.

Sonunda birkaç şairin dizelerini birbirine karıştırıp aralarına Fransızca kelimeler ekleyerek kendi zannınca çok ince bir aşk mektubu ortaya çıkardı. Mektubu şık bir zarfa yerleştirip çiçeklerle süsledikten sonra, bir sonraki gezinti gününde Periveş Hanım'ın arabasına gizlice bırakabilmek için sabırsızlanmaya başladı.`,

      `Bölüm IV — Çamlıca'da Ters Düşen Mektup ve Alaylı Gülüşler

Cuma günü öğleden sonra heyecan içinde Çamlıca'ya çıkan Bihruz Bey, Periveş Hanım ile arkadaşı Çengi Hanım'ı yine aynı ağaçların altında yürürken gördü. Kalbi yerinden fırlayacak gibi çarparken yanlarına sokuldu ve büyük bir gösterişle hazırladığı mektubu kadının eline tutuşturup hemen uzaklaştı. Zihninde kadının bu sözler karşısında gözyaşlarına boğulacağını hayal ediyordu.

Oysa okuma yazması kıt olan ve mektuptaki ağdalı ifadelerden tek kelime anlamayan Periveş ile arkadaşı, o karmaşık satırları okurken kahkahalarla gülmekten kendilerini alamadılar. Bu gülüşmeleri uzaktan izleyen Bihruz Bey ise onları utangaç bir mutluluğun işareti zannederek kendi belagatine bir kez daha hayran kaldı.`,

      `Bölüm V — Keşfi Bey'in Yalanı ve Hayali Yas Günleri

Aradan geçen haftalarda Periveş Hanım'ı bir daha Çamlıca'da göremeyen Bihruz Bey derin bir karamsarlığa kapıldı ve sokak sokak o sarışın yüzü aramaya koyuldu. Bir gün tesadüfen karşılaştığı şakacı arkadaşı Keşfi Bey, sıkıcı sorulardan kurtulmak için akıl almaz bir yalan uydurdu: Güya o güzel hanım ince hastalığa yakalanıp kısa süre önce vefat etmişti.

Bu uydurma haberi duyunca yıkılan Bihruz Bey, kendisine romanesk bir matem kahramanı rolü biçti. Siyah elbiseler giydi, kiralık arabalara borçlanmaya devam ederken bir yandan da sevgilisinin mezarını bulmak için Üsküdar mezarlıklarında dolaşıp durdu; hatta hayali bir sevgiye yakışacak acılar çektiğini düşünerek teselli bulmaya çalıştı.`,

      `Bölüm VI — Borç Senetleri ve Tükenen Mirasın Gölgesi

Aşk hayalleriyle avunduğu aylarda Bihruz Bey'in mali durumu hızla bozulmaya başladı. Babasından kalan dükkânlar ve iratlar tek tek satılıyor, araba tamircilerinin ve terzilerin biriken senetleri kapıyı aşındırıyordu. Kalemdeki memuriyetinden de devamsızlığı yüzünden uzaklaşan genç adam, hayatın sert gerçekleriyle yüzleşmek yerine hâlâ eski gösterişini sürdürmeye çalışıyordu.

Annesi ve yaşlı kâhyası bu savurganlığa engel olmak isteseler de Bihruz Bey onları eskimiş fikirli insanlar olarak görüp dinlemiyordu. Gerçek çalışma disiplini olmayan, yalnızca taklit ve süs üzerine kurulu yaşam tarzı, artık en küçük bir sarsıntıda çökmek üzereydi.`,

      `Bölüm VII — Şehzadebaşı Akşamında Beklenmedik Karşılaşma

Bir ramazan akşamı elinde kalan son parayla kiraladığı sade bir kıyafet içinde Şehzadebaşı kalabalığına karışan Bihruz Bey, gözlerine inanamayacağı bir manzarayla karşılaştı. Aylardır öldüğünü sanıp arkasından yas tuttuğu Periveş Hanım, gayet sağlıklı, şen şakrak ve sıradan bir halk kadını kılığında vitrinlere bakarak yürüyordu.

Önce bir hayal gördüğünü sanan genç adam, çekinerek kadının yanına yaklaşıp titrek bir sesle onun hayatta olup olmadığını sordu. Periveş Hanım ise şaşkınlık ve kahkaha arasında hem o meşhur mektubun kimse tarafından ciddiye alınmadığını hem de kendisinin paşa kızı filan olmadığını açıkça yüzüne söyledi.`,

      `Bölüm VIII — Kırılan İllüzyon ve Acı Kahkahalar Arasında Uyanış

Gerçeğin bütün çıplaklığıyla ortaya serilmesi, Bihruz Bey'in yıllardır zihninde ördüğü sahte dünyayı bir anda yerle bir etti. Aylarca uğruna servet tükettiği, adına şiirler düzüp mezar aradığı hayalî aşkın tamamen kendi kuruntusundan ve özentisinden doğduğunu anlamıştı. Çevredeki kalabalığın alaylı bakışları altında ne söyleyeceğini şaşıran genç adam, başını öne eğerek karanlık sokaklara doğru uzaklaştı.

Bu acı ders, özünü tanımadan yalnızca yüzeysel bir taklit peşinde koşan zihinlerin nasıl gülünç hayallere kapılabileceğini gösteren keskin bir ayna oldu. Araba sevdası sönüp giden Bihruz Bey için artık gösterişin değil, gerçeğin soğuk yüzüyle baş başa kalma vakti gelmişti.`,
    ],
  }),
];

const ENGLISH_NOVELS: ContentItem[] = [
  buildNovel({
    id: 'full-en-sherlock',
    gutenbergId: 1661,
    title: 'The Adventures of Sherlock Holmes — Complete Novel Edition (Chapters I–VIII)',
    author: 'Arthur Conan Doyle',
    language: 'en',
    genre: 'fiction',
    summary: 'Complete eight-chapter Baker Street sequence spanning Irene Adler in Bohemia, the Red-Headed League, and the Speckled Band.',
    chunks: [
      `Chapter I — Baker Street Methods and the Bohemian Scandal

To Sherlock Holmes she is always the woman, for in his calm, incisive mind Irene Adler eclipsed every other adversary he ever encountered. One crisp evening at Baker Street, as fog curled against the gas-lit windowpanes, Dr. John Watson returned from his medical practice to find his friend pacing the hearthrug while examining a heavy sheet of pink Bohemian stationery held toward the lamplight.

Moments later a towering visitor wearing a fur-trimmed cloak and a dark vizard mask stepped into the sitting room, introducing himself initially as Count von Kramm before Holmes effortlessly pierced his disguise as the hereditary King of Bohemia. The monarch confessed that a brilliant American opera singer possessed a compromising photograph capable of ruining his forthcoming royal marriage, and every secret burglary attempt by royal agents had utterly failed to recover it.`,

      `Chapter II — Disguise at Briony Lodge and the Hidden Alcove

Never one to overlook humble details, Holmes spent the following morning disguised as an out-of-work groom lounging among the cabmen outside Briony Lodge in St. John's Wood. There he observed a brisk carriage arrival and witnessed the unexpected hurried wedding of Irene Adler to an English barrister named Godfrey Norton—an event in which Holmes himself was pressed into service as a breathless witness at the altar.

With Watson's assistance that evening, Holmes staged a clever street commotion and tossed a plumber's smoke rocket through the parlor window while crying fire. Instinctively, the startled lady rushed to protect what she valued most, revealing a sliding panel beside the bell-pull without realizing the keen eyes observing her from the darkened garden outside.`,

      `Chapter III — The Empty Safe and an Unmatched Farewell

Returning next morning with the King and Watson to claim the photograph, Holmes discovered Briony Lodge eerily silent and an elderly housekeeper awaiting them beside the open hallway. Inside the secret recess behind the wood paneling rested not the royal portrait alone, but a personal photograph of Irene Adler in evening dress accompanied by a crisp envelope addressed directly to Mr. Sherlock Holmes of Baker Street.

Her letter explained with quiet admiration that a chance encounter near the door the night before had alerted her to the master detective's trail, prompting her immediate departure to the continent with her new husband. Asking only for Irene's own portrait as his royal fee, Holmes acknowledged with rare humility how cleanly a woman's wit had outmaneuvered his own celebrated logic.`,

      `Chapter IV — The Crimson Sign of the Red-Headed League

Weeks later, a stout pawnbroker named Jabez Wilson arrived at Baker Street clutching an old newspaper advertisement and sporting hair of a remarkably fiery hue. He recounted how his obliging young assistant, Vincent Spaulding—who happily worked for half wages and spent hours developing photographs in the dark cellar—had urged him to apply for a curious vacancy funded by a deceased American millionaire for red-haired gentlemen.

Selected from a crowd blocking Fleet Street, Wilson had spent four hours every morning copying out the Encyclopaedia Britannica by hand for four pounds a week, only to find the office door locked two months later with a card stating that the Red-Headed League was dissolved. Holmes immediately tapped his walking stick upon the pavement outside Wilson's pawnshop and deduced the subterranean tunnel creeping steadily toward the City and Suburban Bank next door.`,

      `Chapter V — Midnight Vigil in the Bank Vault

Having enlisted Inspector Jones of Scotland Yard and Mr. Merryweather, director of the threatened bank, Holmes led a silent midnight party down iron staircases into an enormous stone cellar stacked with crates of French gold napoleons. Extinguishing their dark lanterns behind the heavy wooden boxes, the four men waited in total darkness while distant clock chimes echoed through the empty London streets above.

Suddenly a faint glint of light trembled between two wide flagstones on the vault floor, followed by the scrape of chisels as a pale young criminal hoisted himself upward from the newly dug tunnel—none other than John Clay, the notorious thief who had posed as Wilson's cellar-loving assistant. Before Clay could whistle to his waiting accomplice outside the pawnshop, Holmes snapped his riding crop across the pistol wrist and secured the capture without losing a single gold coin.`,

      `Chapter VI — Helen Stoner and the Terror of Stoke Moran

On an early April morning before the fog had lifted from Baker Street, a pale young woman dressed entirely in black hurried into the sitting room trembling with dread rather than the morning chill. Helen Stoner explained that she lived at decaying Stoke Moran Manor in Surrey with her violent stepfather, Dr. Grimesby Roylott, whose ferocious temper had already brought ruin to his medical career in Calcutta and constant terror to the local villagers.

Two years earlier, Helen's twin sister Julia had died inexplicably inside her locked bedroom shortly before her wedding, crying out in her final agony about a speckled band while a faint metallic whistle echoed through the night. Now that Helen's own engagement had been announced and repairs forced her to sleep inside her sister's very chamber, she feared the same unseen doom awaited her after dark.`,

      `Chapter VII — The Ventilator, the Bell-Rope, and the Iron Safe

Inspecting Stoke Moran while Dr. Roylott drove angrily to London, Holmes noted three telling anomalies inside the grim stone bedrooms: the bedstead had been clamped firmly to the floorboards, a dummy bell-rope hung above the pillow without connecting to any wire, and a freshly cut ventilator opened directly into Roylott's adjoining room rather than the outer air. Beside the stepfather's iron safe sat a small saucer of warm milk and a knotted dog-lash.

When night descended over the dark Surrey woods, Holmes and Watson waited silently in total blackness upon Helen's clamped bed until the faintest hiss and a sharp metallic clang of the safe door pierced the stillness. Instantly Holmes struck a match and lashed furiously at the hanging bell-rope with his cane, driving a deadly Indian swamp adder backward through the ventilator to strike its own scheming master.`,

      `Chapter VIII — The Final Deductions of Reason Over Superstition

Standing beside the solemn coroner's inquiry the next afternoon, Holmes traced each link in the chain of evidence from the cheetah and baboon roaming the manor lawn to the fatal arrogance of a physician who turned his knowledge of exotic poisons toward greed. Watson recorded the case faithfully in his leather-bound journal, marveling once more at how cold observation unmasked mysteries that terrified ordinary observers.

Returning by evening train toward Charing Cross as rain streaked the carriage glass, Holmes leaned back quietly with his briar pipe and reminded his companion that the gravest crimes rarely hide behind supernatural shadows—they leave quiet footprints in dust, mortar, and human habit for anyone patient enough to read them.`,
    ],
  }),

  buildNovel({
    id: 'full-en-pride',
    gutenbergId: 1342,
    title: 'Pride and Prejudice — Complete Novel Edition (Chapters I–VIII)',
    author: 'Jane Austen',
    language: 'en',
    genre: 'fiction',
    summary: 'Complete eight-chapter Hertfordshire arc from Netherfield Park and the Meryton assembly to Pemberley and the reconciliation of Elizabeth and Darcy.',
    chunks: [
      `Chapter I — Netherfield Park Is Let at Last

It is a truth universally acknowledged across Hertfordshire that a single man in possession of a good fortune must be in want of a wife. No sooner had the news reached Longbourn that wealthy young Mr. Charles Bingley from the north of England had rented grand Netherfield Park than Mrs. Bennet threw the household into lively agitation, eager to secure an introduction for her five unmarried daughters before rival neighbors could intervene.

Mr. Bennet listened to his wife's animated plans with dry, ironic amusement from behind his library pages, pretending indifference while secretly calling at Netherfield first thing the next morning. Only his sharp second daughter, Elizabeth, smiled knowingly at her father's quiet wit while her gentle older sister Jane hoped simply for friendly company at the upcoming Meryton assembly ball.`,

      `Chapter II — The Meryton Assembly and a Slight Never Forgotten

The arrival of the Netherfield party transformed the crowded Meryton assembly room into a theater of whispered admiration. Mr. Bingley immediately charmed the county with his frank good humor, lively dancing, and evident delight in Jane Bennet's serene grace. Beside him, however, stood his tall friend Mr. Fitzwilliam Darcy of Pemberley, whose grave expression and aloof reserve quickly turned initial awe into widespread resentment.

Overhearing Mr. Bingley urge his friend to join the set, Elizabeth caught Mr. Darcy's cold glance sweeping across the room as he declared her merely tolerable and not handsome enough to tempt him. Far from weeping over the slight, Elizabeth turned the remark into a sparkling anecdote among her friends, resolving quietly that a proud man who judged strangers so hastily deserved none of her esteem.`,

      `Chapter III — Rain at Netherfield and the Measure of Accomplishment

Invited to dine with the elegant Miss Bingley on a threatening afternoon, Jane set out on horseback as Mrs. Bennet shrewdly calculated that a downpour would oblige her daughter to stay overnight under Mr. Bingley's roof. The sudden storm delivered a severe fever instead, prompting Elizabeth to walk three miles across muddy fields alone and arrive at Netherfield with glowing cheeks and mud-splattered petticoats.

While Miss Bingley and Mrs. Hurst sneered behind their fans at Elizabeth's brisk independence, Mr. Darcy found himself increasingly captivated by the keen intelligence flashing in her dark eyes. During spirited evening conversations around the drawing-room pianoforte, Elizabeth parried his rigid definitions of an accomplished woman and laughed gently when he admitted he could not easily pardon those who wounded his pride.`,

      `Chapter IV — Mr. Collins Proposes and Wickham Fuels Prejudice

Hardly had the sisters returned to Longbourn when the pompous clergyman Mr. William Collins arrived to inspect the estate he stood to inherit under the family entail. Proud of his grand patroness Lady Catherine de Bourgh, Mr. Collins first set his sights on Jane, then pivoted effortlessly to Elizabeth and delivered a formal, self-satisfied marriage proposal explaining why matrimony suited his parish duties.

Outraged by his refusal to believe a young lady meant "no" the first time she spoke it, Elizabeth firmly rejected him with her father's delighted support, even as her practical friend Charlotte Lucas accepted him three days later for worldly security. Meanwhile, a charming militia officer named Mr. George Wickham captured Elizabeth's sympathy in Meryton by claiming that Darcy had cruelly cheated him out of a promised living.`,

      `Chapter V — Storm at Hunsford Parsonage and the Unwelcome Proposal

Spring brought Elizabeth to Kent to visit the newlywed Charlotte at Hunsford Parsonage, close to the imposing gates of Rosings Park. There she endured Lady Catherine's relentless cross-examinations and unexpectedly encountered Mr. Darcy again, who appeared repeatedly along her morning woodland walks without saying why his visits to his aunt's estate had grown so frequent.

At last, on a quiet afternoon when Charlotte and her husband were away, Darcy entered the parsonage parlor and abruptly confessed his ardent love despite every objection of his judgment against her inferior connections. Stung by his insulting candor and furious at his admission that he had deliberately separated Bingley from her beloved sister Jane, Elizabeth refused him in scorching words, declaring he was the last man on earth she could ever marry.`,

      `Chapter VI — The Letter on the Gravel Walk

Walking early the next morning through the chilly park grove, Elizabeth was startled when Mr. Darcy stepped quietly from among the trees, handed her a closely written letter without waiting for dialogue, and bowed himself out of sight. Sitting on a fallen branch as sunlight filtered through the oaks, she read line after line with shifting emotions ranging from indignant disbelief to painful self-examination.

With cool precision, Darcy explained that he had believed Jane indifferent to Bingley's affection because her gentle modesty concealed deep feeling, while Wickham had in truth squandered a generous cash settlement and nearly eloped with Darcy's fifteen-year-old sister Georgiana purely for her fortune. Forced to reread her own hasty judgments, Elizabeth whispered aloud that until that moment she had never truly known herself.`,

      `Chapter VII — Summer at Pemberley and the Brighton Crisis

Months later, accompanying her sensible Aunt and Uncle Gardiner on a summer tour of Derbyshire, Elizabeth agreed to visit the grand estate of Pemberley only after receiving assurances that its master was away in London. Walking through its sweeping wooded valleys and sunlit galleries, she heard the old housekeeper praise Mr. Darcy as the kindest landlord and most devoted brother in the county—just before Darcy himself appeared unexpectedly upon the lawn, transformed into a courteous, gentle host.

Scarcely had a warm reconciliation begun between them when dreadful letters arrived from Longbourn: impulsive sixteen-year-old Lydia had eloped from Brighton with the penniless Wickham, threatening eternal social ruin upon every Bennet sister. Abandoning Derbyshire at once in tears, Elizabeth feared Darcy's quiet departure meant their brief understanding had ended forever.`,

      `Chapter VIII — Pride Humbled, Prejudice Dissolved, and Double Joy

Against every expectation, news soon reached Longbourn that Lydia and Wickham had been traced in London and decently married—not through Uncle Gardiner's modest purse, as Mr. Bennet supposed, but through Mr. Darcy's quiet personal expense and tireless mediation to save the family honor. Soon afterward Bingley returned to Netherfield to ask gratefully for Jane's hand, lifting the gloom from Longbourn at last.

Even a midnight storm of indignant warnings from Lady Catherine de Bourgh failed to cow Elizabeth's spirit; indeed, hearing of Elizabeth's fearless reply gave Darcy courage to walk out with her down the quiet country lane once more. Confessing how much her earlier reproof had reshaped his proud manners, and receiving her heartfelt repentance for blind prejudice, both walked toward Pemberley in lasting mutual respect.`,
    ],
  }),
];

export const INITIAL_FULL_NOVELS: ContentItem[] = [
  ...SPANISH_NOVELS,
  ...FRENCH_NOVELS,
  ...GERMAN_NOVELS,
  ...ITALIAN_NOVELS,
  ...TURKISH_NOVELS,
  ...ENGLISH_NOVELS,
];

