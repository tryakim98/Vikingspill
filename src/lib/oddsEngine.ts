/**
 * oddsEngine.ts
 * Terning- og odds-logikk (§6.2). baseRoll fordeler de 6 terningflatene på fire
 * utfallsnivåer i rekkefølge bad → mid → good → crit (Katastrofe/Middels/Bra/Trumf).
 * Modifikatorer (stedsquiz-bonus, ferdighet over krav) skyver terningen oppover.
 */

import type { RollOdds, SkillKey, Choice } from '../types';

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
  mid: '#D4A843',
  good: '#2B6B6B',
  crit: '#E8C97A',
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

/** §6.2: ferdighet over kravet gir +1 per nivå. */
export function skillBonusForChoice(choice: Choice, skills: Record<SkillKey, number>): number {
  if (!choice.skillReq) return 0;
  let bonus = 0;
  for (const [skill, req] of Object.entries(choice.skillReq) as [SkillKey, number][]) {
    bonus += Math.max(0, (skills[skill] ?? 0) - req);
  }
  return bonus;
}

/** Et valg er tilgjengelig bare hvis gruppen oppfyller alle ferdighetskrav (§3.3). */
export function meetsRequirement(choice: Choice, skills: Record<SkillKey, number>): boolean {
  if (!choice.skillReq) return true;
  return (Object.entries(choice.skillReq) as [SkillKey, number][])
    .every(([skill, req]) => (skills[skill] ?? 0) >= req);
}
