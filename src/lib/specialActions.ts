/**
 * specialActions.ts (lib)
 * Evaluering og menneskelige beskrivelser av spesialhandlinger på destinasjoner.
 * Datalaget ligger i `data/specialActions.ts`.
 */

import type { SkillKey, TradeGoodId } from '../types';
import type { SpecialAction, ActionCost, ActionEffect, ActionRequires } from '../data/specialActions';
import { TRADE_GOODS } from '../data/tradeGoods';
import { skillTreeData } from '../data/skillTree';

interface StateLike {
  scores: { culturalUnderstanding: number; tradeGain: number; reputation: number };
  svennebrev: Record<SkillKey, number>;
  goods: Partial<Record<TradeGoodId, number>>;
}

export interface ActionAvailability {
  performed: boolean;
  available: boolean;
  missing: string[];
}

const goodName = (g: TradeGoodId) => TRADE_GOODS[g].name.toLowerCase();

function gatherMissingFromCost(c: ActionCost | ActionRequires | undefined, state: StateLike): string[] {
  if (!c) return [];
  const missing: string[] = [];
  if (c.rep !== undefined && state.scores.reputation < c.rep) {
    missing.push(`${c.rep - state.scores.reputation} rykte`);
  }
  if (c.trade !== undefined && state.scores.tradeGain < c.trade) {
    missing.push(`${c.trade - state.scores.tradeGain} handel`);
  }
  if (c.und !== undefined && state.scores.culturalUnderstanding < c.und) {
    missing.push(`${c.und - state.scores.culturalUnderstanding} kulturforståelse`);
  }
  if (c.goods) {
    for (const [g, n] of Object.entries(c.goods)) {
      const cur = state.goods[g as TradeGoodId] ?? 0;
      if (cur < (n ?? 0)) missing.push(`${(n ?? 0) - cur} ${goodName(g as TradeGoodId)}`);
    }
  }
  return missing;
}

export function evaluateAction(a: SpecialAction, state: StateLike, performedActions: string[]): ActionAvailability {
  if (performedActions.includes(a.id)) {
    return { performed: true, available: false, missing: [] };
  }
  const missing: string[] = [];

  if (a.requires?.skill) {
    const cur = state.svennebrev[a.requires.skill.key] ?? 0;
    if (cur < a.requires.skill.min) {
      missing.push(`${skillTreeData[a.requires.skill.key].name} nivå ${a.requires.skill.min} (har ${cur})`);
    }
  }
  missing.push(...gatherMissingFromCost(a.requires, state));
  missing.push(...gatherMissingFromCost(a.cost, state));

  return { performed: false, available: missing.length === 0, missing };
}

export function describeCost(c: ActionCost | undefined): string {
  if (!c) return 'Ingen kostnad';
  const parts: string[] = [];
  if (c.rep) parts.push(`${c.rep} rykte`);
  if (c.trade) parts.push(`${c.trade} handel`);
  if (c.und) parts.push(`${c.und} kulturforståelse`);
  if (c.goods) {
    for (const [g, n] of Object.entries(c.goods)) {
      parts.push(`${n} ${goodName(g as TradeGoodId)}`);
    }
  }
  return parts.length ? parts.join(' + ') : 'Ingen kostnad';
}

export function describeEffect(e: ActionEffect): string {
  const parts: string[] = [];
  if (e.skill) parts.push(`+${e.skill.delta} ${skillTreeData[e.skill.key].name}`);
  if (e.rep) parts.push(`${e.rep > 0 ? '+' : ''}${e.rep} rykte`);
  if (e.trade) parts.push(`${e.trade > 0 ? '+' : ''}${e.trade} handel`);
  if (e.und) parts.push(`${e.und > 0 ? '+' : ''}${e.und} kulturforståelse`);
  if (e.goods) {
    for (const [g, n] of Object.entries(e.goods)) {
      parts.push(`+${n} ${goodName(g as TradeGoodId)}`);
    }
  }
  if (e.unlocks?.length) parts.push(`Låser opp ${e.unlocks.join(', ')}`);
  return parts.join(' · ');
}
