/**
 * V2-INNHOLD (typet bro til vikingspill_innhold_v2.json)
 *
 * Ett enkelt cast-punkt for v3-innholdspakken. JSON-en importeres ved bygging
 * og typecastes til våre presise typer. Casten går via `unknown` fordi en
 * JSON-literal inferes med brede typer (f.eks. `task.type: string` i stedet for
 * vår union `TaskType`) — innholdet er validert kildedata, så castet er trygt her.
 *
 * Konsumeres av:
 *  - destinations.ts → `v2Destinasjoner` (flettes inn per id)
 *  - mekanikk.ts      → `v2Mekanikk` (Gudenes prøve + holmgang)
 */

import type {
  EpiskeKulturmote,
  StedsQuizQuestion,
  Task,
  GudenesProveChallenge,
  HolmgangDuel,
} from '../types';
import v2raw from './vikingspill_innhold_v2.json';

/** v3-feltene som flettes inn på hver destinasjon (matchet på id). */
export interface V2DestinationContent {
  episkeKulturmote: EpiskeKulturmote;
  task: Task;
  stedsquiz: StedsQuizQuestion[];
}

interface V2File {
  destinasjoner: Record<string, V2DestinationContent>;
  _mekanikk: {
    lærertriggetKonkurranse: { utfordringstyper: GudenesProveChallenge[] };
    sjøslag: { duellAktiviteter: HolmgangDuel[] };
  };
}

const v2 = v2raw as unknown as V2File;

export const v2Destinasjoner = v2.destinasjoner;
export const v2Mekanikk = v2._mekanikk;
