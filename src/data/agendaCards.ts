/**
 * agendaCards.ts — SABOTØR (§3 trinn 2). Et agenda-kort deles ut gjennom SAMME private-
 * kort-slot som de ærlige nøkkelkortene (encounter.keyCard, kind='agenda'), så agenten er
 * ikke til å skille fra en nøkkelkort-holder for de andre — det gir ekte sosial deduksjon.
 *
 * - `brief`  = HEMMELIG motiv. Online: vises kun for agent-eleven. Solo: aldri vist (det
 *              er det spilleren skal gjennomskue).
 * - `pitch`  = det OFFENTLIGE, manipulative argumentet. Solo: NPC-agenten sier dette høyt
 *              (plausibelt, men skjuler motivet). Online: eleven argumenterer selv.
 * - `twist`  = avsløringslinje ETTER avstemningen — ALLTID rammet inn som en spilt ROLLE
 *              spillet ga, aldri «X løy».
 *
 * Sjelden og fullt lærerstyrt online (egen `saboteur`-bryter, default av). Solo: en sjelden
 * innebygd øvelse i å gjennomskue manipulasjon. Førsteutkast; finpusses senere.
 */

export interface AgendaCard {
  id: string;
  /** Kjernevalget agenten i hemmelighet skal presse gruppa mot (choice-id på havna). */
  pushChoiceId: string;
  /** Privat, skjult motiv — kun agenten (online) ser det; aldri vist i solo. */
  brief: string;
  /** Offentlig, manipulativt argument NPC-agenten sier høyt (solo). Skjuler motivet. */
  pitch: string;
  /** Avsløringslinje etter avstemningen (rolle-framing, ikke anklage). */
  twist: string;
}

export const AGENDA_CARDS: Record<string, AgendaCard[]> = {
  lindisfarne: [{
    id: 'lindisfarne-a1',
    pushChoiceId: 'ransom',
    brief: 'Skjult interesse: du har en kjøper for fanger i Frankrike. Få mannskapet til å ta munkene som gisler — du tjener på handelen, ikke de. Argumentér som om det er barmhjertighet.',
    pitch: 'Hvorfor drepe når vi kan tjene? Ta munkene som gisler — løsepenger er tryggere gull enn et blodig overfall.',
    twist: 'argumenterte for «barmhjertighet» — gisler framfor blod — men presset egentlig mot egen fangehandel.',
  }],
  hedeby: [{
    id: 'hedeby-a1',
    pushChoiceId: 'glass',
    brief: 'Skjult interesse: du sitter selv på glasslageret. Får du dem til å satse ALT på glassperler, firedobles din egen andel. Selg det som sikker gevinst.',
    pitch: 'Glassperlene her er rene gullet nordover — vi bør satse alt nå mens prisen er lav. Dette er sjansen.',
    twist: 'hyllet glass-satsingen som trygg rikdom for alle — fortidde at hen selv eide lageret.',
  }],
  dublin: [{
    id: 'dublin-a1',
    pushChoiceId: 'slave',
    brief: 'Skjult interesse: du skylder en slavehandler penger. Styr dem mot slavehandel, så slettes gjelda di. Kall det rask rikdom.',
    pitch: 'Slavehandel er rask, sikker rikdom — alle de andre gjør det. Hvorfor nøle med det som lønner seg mest?',
    twist: 'kalte slavehandel «rask rikdom for alle» — skjulte egen gjeld til markedet.',
  }],
  paris: [{
    id: 'paris-a1',
    pushChoiceId: 'tribute',
    brief: 'Skjult interesse: du lengter hjem til familien. Få dem til å ta sølvet og dra fort — uansett hva som er best for gruppa. Kall det å sikre gevinsten.',
    pitch: 'Ta sølvet og dra mens vi kan — hvorfor risikere alt for usikkert land? En fugl i hånda er verdt ti på taket.',
    twist: 'maste om å «sikre gevinsten nå og dra» — drevet av egen hjemlengsel, ikke gruppas beste.',
  }],
  hebrides: [{
    id: 'hebrides-a1',
    pushChoiceId: 'pirates',
    brief: 'Skjult interesse: du drømmer om å bli sjørøverkonge. Styr dem mot piratlivet og kontroll over havet. Mal det som frihet.',
    pitch: 'Med kontroll over havet bøyer alle seg for oss — sjørøverlivet er frihet, frykt og rikdom. Hvem vil leve mindre?',
    twist: 'malte sjørøveri som frihet og rikdom — skjulte egen drøm om å bli sjørøverkonge.',
  }],
  sameland: [{
    id: 'sameland-a1',
    pushChoiceId: 'finnskatt',
    brief: 'Skjult interesse: du vil ha rikdom raskt og bryr deg lite om samene. Press dem til å kreve finnskatt med makt. Kall det vår rett.',
    pitch: 'Samene er få og vi er sterke — krev skatten. Det er vår rett som de mektigste, og rikdommen kommer fort.',
    twist: 'kalte tvangsskatt «vår rett» — egentlig egen grådighet på samenes bekostning.',
  }],
  faroyene: [{
    id: 'faroyene-a1',
    pushChoiceId: 'springboard',
    brief: 'Skjult interesse: du vil videre til Island for egen oppdager-ære. Få dem til å bruke Færøyene bare som springbrett, ikke slå seg ned. Kall det fremdrift.',
    pitch: 'Ikke kast bort tid her — Island venter, og der ligger storheten. Bruk øya som springbrett og seil videre!',
    twist: 'hastet videre mot Island — drevet av egen oppdager-ære, ikke gruppas trygghet.',
  }],
  island: [{
    id: 'island-a1',
    pushChoiceId: 'feud',
    brief: 'Skjult interesse: mannen i blodhevnen skylder DEG penger. Få mannskapet til å ta hevn. Rop på ære.',
    pitch: 'Blod krever blod — æren vår tåler ikke at fornærmelsen står. Hevn er rett, og alle vil vite at vi ikke bøyer oss.',
    twist: 'ropte på «ære og hevn» — skjulte at offeret skyldte hen penger.',
  }],
  vinland: [{
    id: 'vinland-a1',
    pushChoiceId: 'force',
    brief: 'Skjult interesse: du vil vise styrke for egen anseelse. Press på maktbruk mot skrælingene. Kall det å vise hvem som er sterkest.',
    pitch: 'Vis skrælingene hvem som er sterkest med en gang — frykt gir respekt, og respekt gir trygg handel.',
    twist: 'krevde å «vise hvem som er sterkest» — for egen anseelse, ikke mannskapets trygghet.',
  }],
  novgorod: [{
    id: 'novgorod-a1',
    pushChoiceId: 'rule',
    brief: 'Skjult interesse: du vil selv gripe makten. Få dem til å akseptere herskerrollen — så du kan ta tronen. Lokk med storhet.',
    pitch: 'De ber oss herske — grip makten! Tenk på rikdommen og æren et helt rike gir oss. Når får vi sjansen igjen?',
    twist: 'lokket med «vi blir herskere» — så hen selv kunne gripe tronen.',
  }],
  baghdad: [{
    id: 'baghdad-a1',
    pushChoiceId: 'slave_trade',
    brief: 'Skjult interesse: en arabisk handelsmann betaler deg ekstra for slaver. Styr dem mot slavesalg. Kall det det araberne vil ha mest.',
    pitch: 'Araberne betaler best for slaver — det er det smarteste byttet her. Følg pengene, så seiler vi hjem rike.',
    twist: 'kalte slavesalg «det de vil ha mest» — skjulte egen betaling fra slavehandleren.',
  }],
  miklagard: [{
    id: 'miklagard-a1',
    pushChoiceId: 'spy',
    brief: 'Skjult interesse: en fremmed makt betaler deg for hemmeligheter. Styr dem mot spionasje. Framstill det som smart og lukrativt.',
    pitch: 'Hemmeligheter er verdt mer enn gull i denne byen — litt spionasje gjør oss rike fort, uten et sverd løftet.',
    twist: 'framstilte spionasje som «smart og lukrativt» — skjulte egen hemmelige betaler.',
  }],
};

/** Agenda-kortet for en havn (første om flere — kan utvides senere). */
export function pickAgenda(destId: string): AgendaCard | null {
  const cards = AGENDA_CARDS[destId];
  return cards && cards.length > 0 ? cards[0] : null;
}
