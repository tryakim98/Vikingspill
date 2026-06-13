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
 */

import type { ScoreKey } from '../types';

export interface SkjebneMoteChoice {
  id: string;
  label: string;
  outcome: string; // førsteperson, kort
  effects?: Partial<Record<ScoreKey, number>>;
}

export interface SkjebneMote {
  id: string;
  title: string;
  scene: string; // førsteperson, samme stil som episke kulturmøter
  choices: SkjebneMoteChoice[];
}

export const TRIGGER_PROBABILITY = 0.22;
export const MIN_DESTINATIONS_BETWEEN = 2;

/**
 * Test-quest (én så langt). Strukturen tåler mange flere — bare legg til i lista.
 */
export const SKJEBNEMOTER: SkjebneMote[] = [
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
