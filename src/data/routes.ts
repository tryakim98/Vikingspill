/**
 * routes.ts
 * Hovedrute vs sidesteder.
 *
 *  - Hovedrute (7 destinasjoner): alltid åpne fra start. Gir spillerne en garantert
 *    framgang og en kjent reisevei.
 *  - Sidesteder (5 destinasjoner): låst fra start. Har FLERE veier å låse opp:
 *      svenneprøve i en ferdighet, et bestemt nivå i ferdighetstreet, en
 *      poengterskel (rykte / kulturforståelse / handel), eller bestemte
 *      handelsvarer. Gruppen velger den de har forutsetning for.
 *
 * Innholdet av sidestedene er allerede rikere (kulturmøter østover/vestover er
 * blant de mest minneverdige i v3) — opplåsingen belønner gjennomtenkt spill.
 */

import type { UnlockRequirement } from '../types';

/** Hovedruta — 7 destinasjoner, alltid åpne. Rekkefølgen følger reisens kjerne:
 *  Britannia → Hedeby → Frankrike → Nordatlanteren. */
export const MAIN_ROUTE: ReadonlySet<string> = new Set([
  'lindisfarne', 'hedeby', 'dublin', 'paris', 'hebrides', 'sameland', 'faroyene',
]);

/** Sidesteder med opplåsingsveier. Gruppa låser opp så snart ÉN av disse er møtt.
 *  Hver havn har en svenneprøve-vei (sveinn=1 / mester=2 i et HAVN-domene:
 *  språk · sjømannskap · diplomati) + en alternativ vare-/rykte-vei, så ingen havn
 *  er låst til ett enkelt domene. Krigskunst/tro låser EVNER, ikke havner. */
export const SIDE_UNLOCKS: Record<string, UnlockRequirement[]> = {
  island: [
    { type: 'svenneprove', skill: 'sjømannskap', nivå: 1 }, // sveinn
    { type: 'goods',       goods: { hvalrosstann: 1 } },
  ],
  vinland: [
    { type: 'svenneprove', skill: 'sjømannskap', nivå: 2 }, // mester
    { type: 'goods',       goods: { hvalrosstann: 2, jern: 1 } },
  ],
  novgorod: [
    { type: 'svenneprove', skill: 'språk', nivå: 1 },       // sveinn
    { type: 'goods',       goods: { pelsverk: 2, salt: 1 } },
  ],
  baghdad: [
    { type: 'svenneprove', skill: 'språk', nivå: 2 },       // mester
    { type: 'goods',       goods: { solv: 3 } },
  ],
  miklagard: [
    { type: 'svenneprove', skill: 'diplomati', nivå: 2 },   // mester (Væringgarden)
    { type: 'score',       key: 'reputation', min: 8 },
    { type: 'goods',       goods: { solv: 4 } },
  ],
};

export function isMainRoute(id: string): boolean { return MAIN_ROUTE.has(id); }
