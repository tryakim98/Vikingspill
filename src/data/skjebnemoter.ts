/**
 * SKJEBNEMØTER — valgfrie ekstra-oppdrag under seiling
 *
 * Tilfeldige, stemningsfulle avbrekk mellom destinasjoner. Ikke straff —
 * gir små poengjusteringer og smakebiter av vikinghverdagen til havs.
 *
 * Mekanikk:
 *   - ~22 % sjanse per seilas (se TRIGGER_PROBABILITY)
 *   - Minimum 2 destinasjoner mellom hver utløsning
 *   - Trekkes blant Skjebnemøter gruppa ikke har sett før
 *   - Kun høvdingen velger; alle medlemmer ser scenen og utfallet
 *
 * Enkelte valg er terningavhengige (d6, valgfri ferdighetsbonus, default
 * terskel 4 = 50 % uten bonus). Resultatet skrives til Firebase så alle
 * medlemmer ser samme utfall.
 */

import type { SkillKey } from '../types';

/** Felles effekttype — scores OG valgfri ferdighetsbump (jf. FateEffect). */
export interface SkjebneEffects {
  culturalUnderstanding?: number;
  tradeGain?: number;
  reputation?: number;
  skill?: { key: SkillKey; delta: number };
}

/** Terningbasert utfall: vinn/tap på d6 + valgfri ferdighetsbonus. */
export interface SkjebneRoll {
  skill?: SkillKey;        // valgfri bonus: gruppens nivå legges til kastet
  threshold?: number;      // default 4 — total ≥ threshold ⇒ seier
  win:  { outcome: string; effects?: SkjebneEffects };
  lose: { outcome: string; effects?: SkjebneEffects };
}

export interface SkjebneMoteChoice {
  id: string;
  label: string;
  /** Deterministisk utfall — brukes når `roll` ikke er satt. */
  outcome?: string;
  effects?: SkjebneEffects;
  /** Terningbasert utfall. Hvis satt, ignoreres `outcome`/`effects`. */
  roll?: SkjebneRoll;
}

export interface SkjebneMote {
  id: string;
  title: string;
  scene: string; // førsteperson, samme stil som episke kulturmøter
  choices: SkjebneMoteChoice[];
}

export const TRIGGER_PROBABILITY = 0.22;
export const MIN_DESTINATIONS_BETWEEN = 2;
export const DEFAULT_ROLL_THRESHOLD = 4;

/**
 * Alle Skjebnemøter. Trekkes tilfeldig blant uspilte under seiling.
 */
export const SKJEBNEMOTER: SkjebneMote[] = [
  // ─── Test-quest ───────────────────────────────────────────────────────────
  {
    id: 'driftwood-runes',
    title: 'Drivved med runer',
    scene:
      'Vi rodde gjennom et belte av drivved. Én av plankene var fersk og glatt, og på den var det skåret runer. Olav, skaldelærlingen, leste sakte: «Den som finner meg, finner også...» — resten var slipt bort av sjøen. Mennene ble stille. Hva gjør vi?',
    choices: [
      {
        id: 'recite',
        label: 'Resitér det vi kunne lese — kanskje sjøen svarer',
        outcome:
          'Olav stemte sin røst og ropte runene mot horisonten. Vinden snudde et øyeblikk, akkurat lenge nok til at vi fant rytmen igjen. Et tegn fra Njord, hvisket de.',
        effects: { culturalUnderstanding: 1, reputation: 1 },
      },
      {
        id: 'return',
        label: 'Gi planken tilbake til havet — runene tilhører bølgene',
        outcome:
          'Vi senket planken sakte i sjøen. Den fløt et stykke før den forsvant. Mennene sa lite, men alle visste at vi hadde gjort det rette.',
        effects: { culturalUnderstanding: 1 },
      },
      {
        id: 'keep',
        label: 'Ta planken med — en gave fra gudene er en gave',
        outcome:
          'Planken la vi i kjølen. Kanskje en lykkebringer, kanskje noe annet. Ingen turte sove inntil den den natten.',
        effects: { tradeGain: 1 },
      },
    ],
  },

  // ─── 1. Den blinde skalden ────────────────────────────────────────────────
  {
    id: 'blind-skald',
    title: 'Den blinde skalden',
    scene:
      'Vi rodde i flatt vann da en liten skinnbåt drev mot oss fra tåka. I den satt en gammel mann med øyne hvite som flintestein. «Jeg ser ikke skipet deres,» sa han med en stemme dyp som en brønn, «men jeg hører bjørkebeitet i årene og kjenner havet under kjølen. Skåler dere brød og øl for en blind skald, kan jeg synge dere et kvad som røper noe gudene ikke vil dere skal vite ennå.» Mennene ble urolige. Skalden ventet.',
    choices: [
      {
        id: 'listen',
        label: 'Lytt — gi ham brød og øl',
        outcome:
          'Vi delte vårt siste brød med ham og senket en horntumler med øl ned i båten. Skalden lukket de hvite øynene og messet i en rytme vi aldri hadde hørt. Da han var ferdig hvisket han: «Den ene av dere kommer ikke hjem.» Han åpnet øynene som om han kunne se igjen, smilte trist, og lot strømmen ta båten. Mennene tidde lenge etter.',
        effects: { tradeGain: -1, skill: { key: 'tro', delta: 2 } },
      },
      {
        id: 'pass',
        label: 'Ro forbi i stillhet',
        outcome:
          'Vi holdt taktet stødig og passerte ham uten å si noe. Han snudde hodet etter oss til skinnbåten var en flekk i tåka. Mennene rorde litt fortere uten å vite hvorfor.',
        effects: {},
      },
      {
        id: 'demand',
        label: 'Krev at han synger gratis',
        outcome:
          '«Syng eller la oss være!» ropte vi over relingen. Skalden bøyde hodet. «En blind skald som synger uten gave, synger ikke for mennesker — han synger for ravnene som følger dere.» Vi fikk ikke noe kvad. Bare ravnene som plutselig var der, tause over masten.',
        effects: { reputation: -1 },
      },
    ],
  },

  // ─── 2. Draugen ved gravfeltet ────────────────────────────────────────────
  {
    id: 'draug-graveyard',
    title: 'Draugen ved gravfeltet',
    scene:
      'Vi trengte ferskvann og rodde inn i en liten bukt. I gresset ovenfor strandkanten hvelvet de gamle gravhaugene seg som ryggsteiner på en stor død okse. Vi var halvveis oppe da han steg fram mellom haugene — en mann, men ikke en mann. Huden grå som vått tre, øyne som glødende kull, og en rust-tæret øks i hånda. «Dette er mitt sted,» knurret draugen. Bak ham gurglet kilden vi var kommet etter.',
    choices: [
      {
        id: 'gift',
        label: 'Legg igjen gave, be om lov',
        outcome:
          'Olav løste sølvet fra beltet sitt og la det i mosen mellom haugene. Vi bukket dypt og ba om lov til å drikke. Draugen så lenge på oss. Så trakk han seg sakte tilbake mellom haugene, og vi hørte ham mumle noe på et tungemål eldre enn vårt eget. Kilden gav rent vann og en merkelig fred.',
        effects: { tradeGain: -1, reputation: 1, skill: { key: 'tro', delta: 1 } },
      },
      {
        id: 'sword',
        label: 'Trekk sverdet (krigskunst hjelper)',
        roll: {
          skill: 'krigskunst',
          threshold: 4,
          win: {
            outcome:
              'Sverdene møtte hverandre med en lyd ingen levende skulle høre. Tre slag, fire — så veltet draugen og smuldret til støv som bare lukten av jord etterlot. Mennene hogde et merke i nærmeste hauge: vi hadde felt en draug, og det skulle ingen glemme.',
            effects: { reputation: 2 },
          },
          lose: {
            outcome:
              'Vi gikk på ham med stål, men øksa hans hogde der hvor ingen øks burde hogge. Vi mistet to sekker proviant i tumulten og måtte trekke oss. Draugen ble stående i tåka og se etter oss til vi rodde rundt neset.',
            effects: { tradeGain: -2 },
          },
        },
      },
      {
        id: 'flee',
        label: 'Flykt til skipet',
        outcome:
          'Vi snudde og løp ned mot strandkanten uten å se oss tilbake. Draugen ropte ikke etter oss. Vannet måtte vi finne et annet sted.',
        effects: {},
      },
    ],
  },

  // ─── 3. Kjøpmannens veddemål ──────────────────────────────────────────────
  {
    id: 'merchant-wager',
    title: 'Kjøpmannens veddemål',
    scene:
      'I en liten naturhavn lå et fremmed skip med svarte seil. Kjøpmannen kom ned til relingen vår — en høyvokst mann med ringer på alle fingre og et smil som ikke nådde øynene. «Tre terninger, ett kast,» sa han og lot tre bein-terninger gli mellom håndflatene. «Vinner du, betaler jeg fem ganger innsatsen. Taper du, beholder jeg gullet ditt. Eller — » han nikket mot lasten vår, «— vi kan snakke om handel, hvis du heller er den slags mann.»',
    choices: [
      {
        id: 'wager',
        label: 'Ta veddemålet (50/50)',
        roll: {
          threshold: 4,
          win: {
            outcome:
              'Terningene rullet over plankene. To enere — og en sekser som la seg helt på kanten før den falt riktig vei. Kjøpmannen blunket bare én gang, så telte han opp sølvet og leverte det med et bukk. «Du har gudenes gunst i dag,» sa han uten varme.',
            effects: { tradeGain: 5 },
          },
          lose: {
            outcome:
              'Terningene rullet — og rullet feil vei. Kjøpmannen tok gullet vårt uten å snakke, og snudde ryggen til. Mennene mumlet at vi skulle ha visst bedre.',
            effects: { tradeGain: -4 },
          },
        },
      },
      {
        id: 'trade',
        label: 'Foreslå handel i stedet',
        outcome:
          '«Sett terningene bort,» sa Olav. «La oss heller se hva du har i lasten.» Kjøpmannen lo plutselig — en ekte latter denne gangen. Vi byttet pelsverk for krydder og noen tønner salt; alle gikk tilbake til skipene sine litt rikere. «Klokere enn de fleste,» ropte han etter oss.',
        effects: { tradeGain: 2, skill: { key: 'diplomati', delta: 1 } },
      },
      {
        id: 'decline',
        label: 'Avslå',
        outcome:
          'Vi takket høflig nei og rodde videre. Kjøpmannen ble stående med terningene i hånda og så etter oss. Et eller annet i blikket hans antydet at vi sannsynligvis hadde valgt rett.',
        effects: {},
      },
    ],
  },

  // ─── 4. Hvalstranda ───────────────────────────────────────────────────────
  {
    id: 'whale-shore',
    title: 'Hvalstranda',
    scene:
      'Vi rundet et nes og luktet den før vi så den — en strandhval, lang som tre langskip, lå halvt oppe på sanden. Ferskt kjøtt nok til å mette en gård i et år, og spekk til olje gjennom vinteren. Men i lia ovenfor stod tre dårlig kledde gårdsfolk og fulgte oss med øynene. Vi visste hva blikket betød: de var sultne, og hvalen lå på deres jord.',
    choices: [
      {
        id: 'share',
        label: 'Del fangsten med gårdsfolket',
        outcome:
          'Vi vinket dem ned og delte hvalen i to. Bonden gråt nesten av lettelse, kona hans løp etter kniver, og sammen flenset vi hvalen til solnedgang. Da vi seilte videre, ropte de etter oss et navn vi ikke kjente, men forstod var et velsignelsesord. Slikt rykte sprer seg langs kysten.',
        effects: { tradeGain: -1, reputation: 3, skill: { key: 'tro', delta: 1 } },
      },
      {
        id: 'take',
        label: 'Ta alt — vi fant den først',
        outcome:
          'Vi viftet med øksene mot lia og de trakk seg unna. Vi flenset hvalen hele natten og lastet skipet til ripa. Da vi seilte, så vi bonden stå ved kanten og se etter oss. Han sa ikke et ord. Men ryktet om vikingene som tok mat fra sultne menn kom fram til neste havn før vi gjorde det.',
        effects: { tradeGain: 4, reputation: -3 },
      },
      {
        id: 'fair',
        label: 'Forhandle om en rettferdig del',
        outcome:
          'Vi gikk opp og snakket med bonden. Han fikk fjerdeparten — nok til vinteren — vi tok resten. Et håndtrykk over hvalryggen, ingen våpen trukket. Da vi seilte hadde vi handel, hilsen og kanskje en venn på denne kysten.',
        effects: { tradeGain: 2, reputation: 1, skill: { key: 'diplomati', delta: 1 } },
      },
    ],
  },
];

/** Hent en Skjebnemøte etter id. */
export function getSkjebneMoteById(id: string): SkjebneMote | undefined {
  return SKJEBNEMOTER.find((q) => q.id === id);
}

/**
 * Skal vi utløse en Skjebnemøte nå? Bare høvdingen kaller denne, og bare når seilas starter.
 *   - visitedCount: antall destinasjoner gruppa har besøkt så langt
 *   - lastTriggeredAtVisited: visitedCount sist en Skjebnemøte ble utløst (eller -∞)
 *   - rng: valgfri RNG (for testing); default Math.random
 */
export function shouldTriggerSkjebneMote(
  visitedCount: number,
  lastTriggeredAtVisited: number | undefined,
  rng: () => number = Math.random,
): boolean {
  const last = lastTriggeredAtVisited ?? Number.NEGATIVE_INFINITY;
  if (visitedCount - last < MIN_DESTINATIONS_BETWEEN) return false;
  return rng() < TRIGGER_PROBABILITY;
}

/** Plukk en Skjebnemøte gruppa ikke har sett før. Returnerer null hvis alt er sett. */
export function pickSkjebneMote(
  seen: string[] | undefined,
  rng: () => number = Math.random,
): SkjebneMote | null {
  const seenSet = new Set(seen ?? []);
  const pool = SKJEBNEMOTER.filter((q) => !seenSet.has(q.id));
  if (pool.length === 0) return null;
  return pool[Math.floor(rng() * pool.length)];
}

/** Rull en d6 + valgfri ferdighetsbonus, og avgjør seier/tap mot roll.threshold (default 4). */
export interface RollResult {
  roll: number;
  bonus: number;
  total: number;
  won: boolean;
}
export function rollSkjebne(
  roll: SkjebneRoll,
  skillLevel: number,
  rng: () => number = Math.random,
): RollResult {
  const d6 = 1 + Math.floor(rng() * 6);
  const bonus = roll.skill ? skillLevel : 0;
  const total = d6 + bonus;
  const threshold = roll.threshold ?? DEFAULT_ROLL_THRESHOLD;
  return { roll: d6, bonus, total, won: total >= threshold };
}
