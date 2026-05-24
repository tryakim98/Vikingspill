/**
 * DESTINASJONER
 *
 * Bygger alle 12 destinasjoner ved å flette sammen to kilder (CLAUDE.md §5.1 / §14):
 *  - BASISDATA (region, color, difficulty, history, funFact, famousPerson, choices):
 *    fra vikingspill_data.json. Den komplette dataen for alle 12 destinasjoner er
 *    hentet ut fra prototypen (Vikingspill_v3-html → GAME_DATA.destinations).
 *  - V3-INNHOLD (episkeKulturmote, task, stedsquiz): fra vikingspill_innhold_v2.json,
 *    matchet på destinasjons-id. v2-oppgaven ERSTATTER prototypens gamle oppgave (§14).
 *
 * Rekkefølgen følger basisdataen (reiserekkefølge).
 */

import type { Destination, Choice, Difficulty } from '../types';
import { v2Destinasjoner } from './v2Content';
import baseRaw from './vikingspill_data.json';

/** Basisdata pr. destinasjon (prototypens `task` ignoreres — v2-oppgaven vinner, §14). */
interface BaseDestination {
  id: string;
  name: string;
  region: string;
  color: string;
  difficulty: Difficulty;
  history: string;
  funFact: string;
  famousPerson: string;
  choices: Choice[];
}

// JSON-import castes via unknown fordi JSON-literalen inferes med brede typer
// (f.eks. tag/difficulty som string i stedet for våre union-typer). Validert kildedata.
const baseDestinations = (baseRaw as unknown as { destinations: BaseDestination[] }).destinations;

/** De 12 destinasjonene, ferdig flettet og i reiserekkefølge. */
export const destinations: Destination[] = baseDestinations.map((base): Destination => {
  const v2 = v2Destinasjoner[base.id];
  if (!v2) {
    throw new Error(`Mangler v3-innhold (vikingspill_innhold_v2.json) for destinasjon: ${base.id}`);
  }
  return {
    id: base.id,
    name: base.name,
    region: base.region,
    color: base.color,
    difficulty: base.difficulty,
    history: base.history,
    funFact: base.funFact,
    famousPerson: base.famousPerson,
    choices: base.choices,
    task: v2.task,               // v2-oppgave erstatter prototypens gamle oppgave (§14)
    episkeKulturmote: v2.episkeKulturmote,
    stedsquiz: v2.stedsquiz,
  };
});

/** Hent destinasjon etter id. */
export function getDestinationById(id: string): Destination | undefined {
  return destinations.find((dest) => dest.id === id);
}

/** Hent alle destinasjoner i reiserekkefølge. */
export function getAllDestinations(): Destination[] {
  return destinations;
}

/** Hent en tilfeldig destinasjon (for testing). */
export function getRandomDestination(): Destination {
  return destinations[Math.floor(Math.random() * destinations.length)];
}
