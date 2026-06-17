/**
 * keyCards.ts — ren logikk for utdeling av nøkkelkort (§3 trinn 1). Ingen UI, ingen
 * side-effekter, deterministisk (rng injiseres). Hjertet er den VEKTEDE utdelingen:
 * kortet går til den som har fått færrest kort til nå (proxy for «fått/snakket minst»),
 * tilfeldig blant dem som ligger likt — så alle får noe over en dobbelttime uten å
 * tvinges hver runde.
 */

import { KEY_CARDS, type KeyCard } from '../data/keyCards';
import { pickAgenda } from '../data/agendaCards';

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

// === SABOTØR (§3 trinn 2) =========================================================
// Et privat kort kan SJELDEN være et agenda-kort i stedet for et ærlig nøkkelkort —
// kun når lærer-bryteren `saboteur` er på, og bare hvis det er gått nok runder siden
// forrige agenda (min-gap). Samme holder-utvelging (vektet); kun innholdet/typen skiller.

/** Andel av de UTDELTE private kortene som blir et agenda-kort når saboteur er på. */
export const SABOTEUR_CHANCE = 1 / 4;
/** Minste antall runder mellom to agenda-kort (så det forblir sjeldent). */
export const SABOTEUR_MIN_GAP = 3;
/** Solo (§3 trinn 2): sjanse for at én NPC-stemme bærer en skjult agenda i et møte —
 *  innebygd øvelse i å gjennomskue manipulasjon (solo har ingen lærerbryter). */
export const SOLO_AGENDA_CHANCE = 0; // AV for test — sett tilbake til 1/4 etterpå

/** Er nok runder gått siden forrige agenda til at en ny er tillatt? */
export function agendaAllowed(roundsSinceLastAgenda: number): boolean {
  return roundsSinceLastAgenda >= SABOTEUR_MIN_GAP;
}

export interface PrivateCardDeal {
  holderId: string;
  cardId: string;
  kind: 'honest' | 'agenda';
}

/**
 * Komplett utdeling av rundens private kort: hvem, hvilket kort, og om det er et ÆRLIG
 * nøkkelkort eller (sjelden) et AGENDA-kort. Holder-utvelgingen er den samme vektede
 * som for nøkkelkort. Agenda velges kun når `saboteur` er på, `canAgenda` (min-gap) er
 * oppfylt, havna har et agenda-kort, og en lav sjanse slår til. Ren funksjon.
 */
export function dealPrivateCard(
  destId: string,
  memberIds: string[],
  history: KeyCardLogEntry[],
  opts: { saboteur: boolean; canAgenda: boolean },
  rng: () => number = Math.random,
): PrivateCardDeal | null {
  const base = dealKeyCard(destId, memberIds, history, rng);
  if (!base) return null;
  const agenda = pickAgenda(destId);
  if (opts.saboteur && opts.canAgenda && agenda && rng() < SABOTEUR_CHANCE) {
    return { holderId: base.holderId, cardId: agenda.id, kind: 'agenda' };
  }
  return { holderId: base.holderId, cardId: base.cardId, kind: 'honest' };
}
