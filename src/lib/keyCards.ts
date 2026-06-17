/**
 * keyCards.ts — ren logikk for utdeling av nøkkelkort (§3 trinn 1). Ingen UI, ingen
 * side-effekter, deterministisk (rng injiseres). Hjertet er den VEKTEDE utdelingen:
 * kortet går til den som har fått færrest kort til nå (proxy for «fått/snakket minst»),
 * tilfeldig blant dem som ligger likt — så alle får noe over en dobbelttime uten å
 * tvinges hver runde.
 */

import { KEY_CARDS, type KeyCard } from '../data/keyCards';

/** Andel av møtene som deler ut et nøkkelkort (~1 av 3 — ikke hver runde). */
export const KEY_CARD_CHANCE = 1 / 3;

/** Én rad i gruppas utdelingslogg (hvem fikk hvilket kort hvor) — fairness + saga. */
export interface KeyCardLogEntry {
  destId: string;
  memberId: string;
  cardId: string;
}

export interface KeyCardDeal {
  holderId: string;
  cardId: string;
}

/** Skal denne runden dele ut et kort? ~1 av 3. Rng injiseres for testbarhet. */
export function shouldDealKeyCard(rng: () => number = Math.random): boolean {
  return rng() < KEY_CARD_CHANCE;
}

/**
 * Vektet valg av kort-holder: tell hvor mange kort hvert medlem har hatt, og velg blant
 * DEM SOM HAR HATT FÆRREST (tilfeldig ved likhet). Garanterer jevn fordeling (forskjell
 * ≤ 1 over tid). Returnerer null hvis ingen medlemmer.
 */
export function pickCardHolder(
  memberIds: string[],
  history: KeyCardLogEntry[],
  rng: () => number = Math.random,
): string | null {
  if (memberIds.length === 0) return null;
  const count: Record<string, number> = {};
  for (const id of memberIds) count[id] = 0;
  for (const e of history) if (e.memberId in count) count[e.memberId]++;
  let min = Infinity;
  for (const id of memberIds) if (count[id] < min) min = count[id];
  const fewest = memberIds.filter((id) => count[id] === min);
  return fewest[Math.floor(rng() * fewest.length)];
}

/** Kortet som deles ut på en havn (første om flere — kan utvides senere). */
export function pickCard(destId: string): KeyCard | null {
  const cards = KEY_CARDS[destId];
  return cards && cards.length > 0 ? cards[0] : null;
}

/**
 * Komplett utdeling for en havn: hvilket kort, til hvem. Null hvis havna ikke har kort
 * eller det ikke finnes medlemmer. Endrer ingenting — kalleren skriver resultatet.
 */
export function dealKeyCard(
  destId: string,
  memberIds: string[],
  history: KeyCardLogEntry[],
  rng: () => number = Math.random,
): KeyCardDeal | null {
  const card = pickCard(destId);
  if (!card) return null;
  const holderId = pickCardHolder(memberIds, history, rng);
  if (!holderId) return null;
  return { holderId, cardId: card.id };
}
