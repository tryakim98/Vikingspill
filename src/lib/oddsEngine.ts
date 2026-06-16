/**
 * oddsEngine.ts
 * Terning- og odds-logikk (§6.2). baseRoll fordeler de 6 terningflatene på fire
 * utfallsnivåer i rekkefølge bad → mid → good → crit (Katastrofe/Middels/Bra/Trumf).
 * Modifikatorer (stedsquiz-bonus, ferdighet over krav) skyver terningen oppover.
 */

import type { RollOdds } from '../types';

export type Tier = 'bad' | 'mid' | 'good' | 'crit';
export const TIER_ORDER: Tier[] = ['bad', 'mid', 'good', 'crit'];
export const TIER_LABEL: Record<Tier, string> = {
  bad: 'Katastrofe',
  mid: 'Middels',
  good: 'Bra',
  crit: 'Trumf',
};
export const TIER_COLOR: Record<Tier, string> = {
  bad: '#8B2929',
  mid: '#A9A08D', // bein-grå (monokrom) — middels skal ikke ha gull
  good: '#2B6B6B',
  crit: '#A07F32', // dempet brass — Trumf er det sjeldne gull-høydepunktet
};

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** Map en terningverdi (1-6) til et utfallsnivå via kumulativ baseRoll. */
export function rollToTier(baseRoll: RollOdds, roll: number): Tier {
  let cum = 0;
  for (const tier of TIER_ORDER) {
    cum += baseRoll[tier] ?? 0;
    if (roll <= cum) return tier;
  }
  return 'crit';
}

/** Odds i prosent per nivå (til odds-baren). */
export function oddsPercent(baseRoll: RollOdds): Record<Tier, number> {
  const total = TIER_ORDER.reduce((a, t) => a + (baseRoll[t] ?? 0), 0) || 6;
  return {
    bad: Math.round(((baseRoll.bad ?? 0) / total) * 100),
    mid: Math.round(((baseRoll.mid ?? 0) / total) * 100),
    good: Math.round(((baseRoll.good ?? 0) / total) * 100),
    crit: Math.round(((baseRoll.crit ?? 0) / total) * 100),
  };
}

export interface RollResult {
  raw: number;        // selve terningkastet (1-6)
  effective: number;  // etter modifikator (klemt til 1-6)
  modifier: number;
  tier: Tier;
}

export function rollDice(baseRoll: RollOdds, modifier: number): RollResult {
  const raw = 1 + Math.floor(Math.random() * 6);
  const effective = clamp(raw + modifier, 1, 6);
  return { raw, effective, modifier, tier: rollToTier(baseRoll, effective) };
}

// Odds = grunnsjanse + stedsquiz-bonus. Ferdigheter påvirker IKKE terningen lenger
// (ingen skill-bonus, ingen sen-spill-straff, ingen ferdighets-gating av valg).
