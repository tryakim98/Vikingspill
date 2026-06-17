/**
 * FØRSTEGANGS-FORKLARINGER
 *
 * Korte, vennlige forklaringer som popper opp første gang gruppa møter et
 * nytt konsept (tjener rykte for første gang, ser et låst sted, osv.).
 * Lagres pr. gruppe i `seenHints` (synket online, localStorage offline) så
 * de aldri vises mer enn én gang. Hele systemet kan skrus av av læreren
 * via `showHints` i GameSettings.
 */

export type HintKey =
  | 'reward-und'
  | 'reward-trade'
  | 'reward-rep'
  | 'reward-skill'
  | 'reward-goods'
  | 'locked-system';

export interface Hint {
  icon: string;
  title: string;
  body: string;
}

export const HINTS: Record<HintKey, Hint> = {
  'reward-und': {
    icon: 'book',
    title: 'Dere fikk kulturforståelse!',
    body: 'Kulturforståelse viser at dere har lært av folkene dere møter. Den kan låse opp sidesteder, gi bedre valg, og styrer hva slags vikinger dere blir kjent som i den endelige seremonien.',
  },
  'reward-trade': {
    icon: 'coin',
    title: 'Dere fikk handelspoeng!',
    body: 'Handel er sølvet og varene dere tar med hjem. Det kan brukes til å kjøpe varer på handelstorget, betale for spesielle handlinger, og åpne fjerne sidesteder.',
  },
  'reward-rep': {
    icon: 'trophy',
    title: 'Dere fikk rykte!',
    body: 'Rykte er det andre folk sier om dere. Med høyt rykte åpnes diplomati-valg og enkelte havner som ellers ville vært stengt. Lavt rykte kan gjøre senere reiser farlige.',
  },
  'reward-skill': {
    icon: 'axe',
    title: 'En ferdighet vokser!',
    body: 'Ferdigheter (språk, sjømannskap, krigskunst, diplomati, tro) gir bonus på terningkast og åpner spesifikke valg. På nivå 1 og 2 kan dere ta en svenneprøve for å stige.',
  },
  'reward-goods': {
    icon: 'crate',
    title: 'En ny handelsvare!',
    body: 'Varer kan brukes til å låse opp sidesteder, byttes på handelstorget med andre skip, eller selges som handelspoeng. Pelsverk, sølv, jern, rav, silke, hvalrosstann, krydder og salt — alle har sin verdi.',
  },
  'locked-system': {
    icon: 'lock',
    title: 'Noen steder er låst — og det er litt opp til dere',
    body: 'Sidesteder krever at dere har gjort dere fortjent: bestått en svenneprøve, samlet handelsvarer, bygget rykte eller hevet en ferdighet. Det dere prioriterer underveis bestemmer hvor dere kan reise. Sjekk «Krever»-boksen på det låste stedet for å se hvilke veier som er åpne.',
  },
};
