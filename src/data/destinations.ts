/**
 * DESTINASJONER
 * Importer av alle 12 destinasjoner fra vikingspill_data.json
 * 
 * Struktur:
 * - id: unik identifier (engelsk, ingen mellomrom)
 * - name: norsk navn som vises til elevene
 * - history, funFact, famousPerson, task, choices: se types/index.ts
 * 
 * I fase 1, opprettes denne manuelt med mock-data.
 * I fase 2+, skal denne kunne lastes fra JSON via HTTP.
 */

import type { Destination } from '../types';

export const destinations: Destination[] = [
  {
    id: 'lindisfarne',
    name: 'Lindisfarne',
    region: 'Nordøst-England, 793',
    color: '#8B2929',
    difficulty: 'farlig',
    history: 'Det første store vikingangrepet vi har skriftlige kilder på. <strong>8. juni 793</strong> stiger nordmenn i land på den hellige øya og plyndrer klosteret. Dette er øyeblikket Europa lærte at vikingene fantes — året som regnes som vikingtidens begynnelse.',
    funFact: 'Munken som først så skipene, antok det var venner med varer. Han gikk ned til stranden for å hilse — og ble drept først.',
    famousPerson: '<strong>Alkuin av York</strong> (735–804) — engelsk lærd ved Karl den stores hoff. Hans brev hjem etter angrepet er blant våre viktigste samtidige kilder. Han skrev: «Aldri før har en slik redsel vist seg i Britannia.»',
    task: {
      type: 'movement',
      icon: '⚔️',
      typeLabel: 'Bevegelse',
      title: 'Stormløpet',
      desc: 'Hele gruppen stiller seg i en linje. På «GO!» løper alle samtidig så fort dere kan rundt nærmeste bygning og tilbake. Læreren bekrefter at hele gruppen utfører løpet samlet, og at dere puster tungt når dere kommer inn.',
      rationale: 'Vikingene kom plutselig — munkene fikk ikke tid til å reagere. Dere skal kjenne det samme tempoet på kroppen som de som først så seilene komme inn fra havet.'
    },
    choices: [
      {
        id: 'plunder',
        title: 'Plyndre klosteret — alt eller intet',
        desc: 'Munkene er ikke krigere. Sølvet ligger åpent. Dette er hele grunnen til at dere kom.',
        tag: 'aggressive',
        skillReq: null,
        skillReward: { krigskunst: 1 },
        baseRoll: { bad: 1, mid: 2, good: 2, crit: 1 },
        outcomes: {
          bad: { und: -3, trade: 1, rep: -3, text: 'En gammel munk holder fast i alterkalken og dør i et basketak. Andre vikinger ser dere som «de som drepte en hellig mann». Skipet er tungt, men forbannet.' },
          mid: { und: -2, trade: 4, rep: -3, text: 'Dere kommer hjem med kirkesølv og hellige bøker. Hjemme er dere rike — i Europa er dere fryktet.' },
          good: { und: -2, trade: 6, rep: -3, text: 'Skipet er fullt: sølv, gullkalker, edelstener fra evangeliebøker. Hver mann er rik. Halve det kristne Europa hater dere.' },
          crit: { und: -2, trade: 8, rep: -4, text: 'Dere finner det hemmelige skattkammeret. Skipet er så tungt at det knapt holder seg flytende. Karl den store sender personlig en straffeekspedisjon etter dere.' }
        },
        lesson: 'Lindisfarne 793 var historisk lønnsomt på kort sikt. Men plyndringen startet 250 år med europeisk frykt — og stengte dører for vikinger som ville handle fredelig.',
        locks: ['paris']
      },
      {
        id: 'ransom',
        title: 'Ta munker som gisler — krev løsepenger',
        desc: 'Dere viser styrke uten å rasere. Den som vil ha munkene tilbake, må betale.',
        tag: 'trade',
        skillReq: null,
        skillReward: { diplomati: 1 },
        baseRoll: { bad: 1, mid: 2, good: 2, crit: 1 },
        outcomes: {
          bad: { und: 0, trade: 2, rep: -1, text: 'Munkene er ikke verdifulle — bispen betaler lite.' },
          mid: { und: 1, trade: 5, rep: 0, text: 'Godt forhandlet. Munker kjøpes tilbake, og reisen dekkes av deres «fred-avgift».' },
          good: { und: 1, trade: 7, rep: 1, text: 'Bispen er glad for at munkene kommer tilbake uskadet. Han betaler selv mer enn forventet, og tilbyr handelssamarbeid.' },
          crit: { und: 2, trade: 9, rep: 2, text: 'Munkene tror at Gud sendte dere som tester. De anbefaler dere til andre kloster som «rettferdige viking-kjøpmenn». Et uventet rykte.' }
        },
        lesson: 'Ikke alle viking-møter endte i blod. Noen ble til forretninger — selv med kloster.'
      },
      {
        id: 'negotiate',
        title: 'Forhandle: Vi kommer i fred, vil dere handle med oss?',
        desc: 'Dere er færre enn munkene tror. En risikabel strategi — men mulig.',
        tag: 'respect',
        skillReq: { språk: 1, diplomati: 1 },
        skillReward: { språk: 1, diplomati: 1 },
        baseRoll: { bad: 2, mid: 2, good: 1, crit: 1 },
        outcomes: {
          bad: { und: -2, trade: 0, rep: 1, text: 'Munkene tror dere lyver. De ringer i klokken. Flere kommer. Dere må seile. Ingen skatt, men kjent som «redelig». Kanskje hjelper det senere.' },
          mid: { und: 2, trade: 3, rep: 2, text: 'Munkene er forundret. Noen handler med dere — silke, blyant, pergament. Dere forlater som venner.' },
          good: { und: 3, trade: 5, rep: 3, text: 'Munkene inviterer dere inn til middag. De forteller om verden som dere aldri visste fantes. Både handel og lærdom.' },
          crit: { und: 4, trade: 4, rep: 4, text: 'En av munkene er selv norsk, født før han ble klostermunk. Han kjenner språket deres — og deres kulturen. Han blir deres støttespiller ved høvet.' }
        },
        lesson: 'Historie kunne gått annerledes — hvis Lindisfarne hadde blitt et møtepunkt i stedet for et bloddbad.',
        locks: []
      }
    ]
  }
  // TODO: Legg til flere destinasjoner (hedeby, dublin, paris, hebrides, etc.)
];

/**
 * Hjelpefunksjon: Hent destinasjon etter ID
 */
export function getDestinationById(id: string): Destination | undefined {
  return destinations.find(dest => dest.id === id);
}

/**
 * Hjelpefunksjon: Hent alle destinasjoner i rekkefølge
 */
export function getAllDestinations(): Destination[] {
  return destinations;
}

/**
 * Hjelpefunksjon: Hent en tilfeldig destinasjon (for testing)
 */
export function getRandomDestination(): Destination {
  return destinations[Math.floor(Math.random() * destinations.length)];
}
