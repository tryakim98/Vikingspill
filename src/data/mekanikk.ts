/**
 * MEKANIKK (fase 3-data, importert nå sammen med resten av v3-innholdet)
 *
 * Kilde: vikingspill_innhold_v2.json → _mekanikk
 *  - «Gudenes prøve» (lærertrigget konkurranse, §3.4 / §8.5): utfordringstyper
 *    trekkes TILFELDIG og er like for alle grupper. Læreren bestemmer kun NÅR.
 *  - Sjøslag «Holmgang på bølgene» (§7.2): duell-aktiviteter trekkes tilfeldig.
 */

import type { GudenesProveChallenge, HolmgangDuel } from '../types';
import { v2Mekanikk } from './v2Content';

/** Utfordringstyper for «Gudenes prøve» (trekkes tilfeldig, likt for alle). */
export const gudenesProveChallenges: GudenesProveChallenge[] =
  v2Mekanikk.lærertriggetKonkurranse.utfordringstyper;

/** Duell-aktiviteter for sjøslag / holmgang (trekkes tilfeldig per duell). */
export const holmgangDueller: HolmgangDuel[] = v2Mekanikk.sjøslag.duellAktiviteter;

/** Trekk en tilfeldig «Gudenes prøve»-utfordring. */
export function randomGudenesProve(): GudenesProveChallenge {
  return gudenesProveChallenges[Math.floor(Math.random() * gudenesProveChallenges.length)];
}

/** Trekk en tilfeldig holmgang-duell. */
export function randomHolmgangDuell(): HolmgangDuel {
  return holmgangDueller[Math.floor(Math.random() * holmgangDueller.length)];
}
