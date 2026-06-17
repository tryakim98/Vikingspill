/**
 * keyCards.ts — NØKKELKORT (§3 «sluttfasen», trinn 1: ærlig informasjons-asymmetri).
 *
 * Ved en andel av møtene får ÉN elev et privat nøkkelkort (online), eller spilleren
 * leser «kildene» (solo). Kravet: hvert kort er BESLUTNINGSRELEVANT — det endrer genuint
 * hvilket kjernevalg som er best, så holderen har en reell grunn til å dele og overbevise.
 * `favors` peker på choice-id-en kortet lader. Ingen sabotør her (det er trinn 2) —
 * informasjonen er ærlig.
 *
 * Førsteutkast bygget på havnenes egen historie/funFact; finpusses senere.
 */

export interface KeyCard {
  id: string;
  /** Beslutningsrelevant opplysning — kun holderen ser den til den deles. */
  text: string;
  /** Kjernevalget denne opplysningen taler for (choice-id på samme havn). */
  favors: string;
}

export const KEY_CARDS: Record<string, KeyCard[]> = {
  lindisfarne: [{
    id: 'lindisfarne-k1',
    text: 'Du har sett varslene: en saksisk hær er to dager unna, og munkene har alt sendt bud. Et raskt, samlet overfall rekker sølvet før hæren kommer — nøler dere med gisler og løsepenger, fanges dere mellom kloster og hær.',
    favors: 'plunder',
  }],
  hedeby: [{
    id: 'hedeby-k1',
    text: 'Du gikk gjennom lagerhusene: glassperler fra Indus selges her billig nå, men neste karavane er en måned unna — da firedobles prisen nordover. Kjøp opp ALT nå, før markedet flommer.',
    favors: 'glass',
  }],
  dublin: [{
    id: 'dublin-k1',
    text: 'Du hørte det på torget: den irske kongen er gammel og uten sterk arving — en norrøn svigersønn kan arve halve riket uten sverd. Men slavemarkedet voktes av kirken; selger dere mennesker, mister dere alliansen for alltid.',
    favors: 'marriage',
  }],
  paris: [{
    id: 'paris-k1',
    text: 'Du så broene: grev Odo har forsterket dem — en beleiring koster halve mannskapet og ender i sult. Men Karl frykter flere angrep og vil gi LAND for fred. Be om jord, ikke bare en sekk sølv som er borte til vinteren.',
    favors: 'normandy',
  }],
  hebrides: [{
    id: 'hebrides-k1',
    text: 'Du fikk vite det av en fisker: Iona-klosteret er alt plyndret tre ganger, og munkene flytter skattene til Kells i Irland til våren. Å vokte et tomt kloster gir lite — men slår dere dere ned blant Gall-Gàidheal her, eier dere sjøveiene uten kamp.',
    favors: 'hybrid',
  }],
  sameland: [{
    id: 'sameland-k1',
    text: 'Du forstod det av samenes egne ord: de kontrollerer pelsrutene østover, og krever dere finnskatt med makt, forsvinner de inn i vidda og rutene tørker ut. En giftermålsallianse åpner dem — slik Harald Hårfagre selv bandt seg til Snøfrid.',
    favors: 'marriage',
  }],
  faroyene: [{
    id: 'faroyene-k1',
    text: 'Du snakket med en papar-munk: de irske eneboerne kjenner strømmene og skjærene mot Island — kunnskap verdt mer enn gull for neste seilas. De flykter ved første tegn til vold. Snakk med dem FØR de drar, ellers seiler dere blinde vestover.',
    favors: 'monks',
  }],
  island: [{
    id: 'island-k1',
    text: 'Du fikk vite slektskapet: mannen blodhevnen retter seg mot er svoger til lovsigemannen på Alltinget. Dreper dere ham, dømmes hele mannskapet fredløse. Tal saken på tinget i stedet — der vinnes både ære og land.',
    favors: 'lawspeaker',
  }],
  vinland: [{
    id: 'vinland-k1',
    text: 'Speiderne dine kom tilbake bleke: skrælingene er hundrevis, skjult bak åskammen. Viser dere makt, blir dere nedkjempet — slik Torvald Eriksson falt for én pil. Tålmodig handel er eneste vei til å overleve OG få pelsverket.',
    favors: 'patient',
  }],
  novgorod: [{
    id: 'novgorod-k1',
    text: 'Du skjønte det av de slaviske høvdingene: stammene er splittet og ber om en utenforstående hersker for å stoppe blodfeidene — slik Rurik nettopp ble invitert. Nøyer dere med ren handel, tar en annen viking plassen og stenger Volga-ruten for dere.',
    favors: 'rule',
  }],
  baghdad: [{
    id: 'baghdad-k1',
    text: 'Du så det ved porten: kalifens hoff slipper bare inn dem som følger renhets-skikkene. Holder dere stivt på egne skikker — eller selger slaver ved porten — stenges det rikeste sølvmarkedet i verden. Tilpass dere, så åpnes dirham-strømmen.',
    favors: 'adapt',
  }],
  miklagard: [{
    id: 'miklagard-k1',
    text: 'Du hørte det fra en væring: keiseren betaler i gull OG lar dere beholde krigsbytte — slik Harald Hardråde ble rik. Men spioner henrettes offentlig; byen er full av keiserens øyne. Tjenesten i Væringgarden er den trygge veien til formue.',
    favors: 'guard',
  }],
};

/** Hjelper: alle kortene for en havn (solo «kilder» + online utvalg). */
export function keyCardsFor(destId: string): KeyCard[] {
  return KEY_CARDS[destId] ?? [];
}
