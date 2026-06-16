/**
 * unlocks.ts
 * Evaluerer opplåsingskrav for sidesteder, og lager de menneskelige tekstene
 * som vises på infokortet («Dere mangler: 1 sølv» / «Krever ferdsbrev i …»).
 */

import type { Destination, SkillKey, ScoreKey, TradeGoodId, UnlockRequirement } from '../types';
import { TRADE_GOODS } from '../data/tradeGoods';
import { skillTreeData } from '../data/skillTree';

interface GameStateLike {
  scores: { culturalUnderstanding: number; tradeGain: number; reputation: number };
  skills: Record<SkillKey, number>;
  goods: Partial<Record<TradeGoodId, number>>;
  locked: string[];
  unlockedSides: string[];
}

const SCORE_LABEL: Record<ScoreKey, string> = {
  culturalUnderstanding: 'Kulturforståelse',
  tradeGain: 'Handelsutbytte',
  reputation: 'Rykte',
};

/** Sann hvis kravet er oppfylt av gjeldende tilstand. svenneprove-typer regnes
 *  ALDRI som oppfylt her — de spores separat via `unlockedSides`. */
export function meetsRequirement(r: UnlockRequirement, s: GameStateLike): boolean {
  switch (r.type) {
    case 'svenneprove': return false;
    case 'skill':       return (s.skills[r.key] ?? 0) >= r.min;
    case 'score':       return s.scores[r.key] >= r.min;
    case 'goods':
      return Object.entries(r.goods).every(([g, n]) => (s.goods[g as TradeGoodId] ?? 0) >= (n ?? 0));
  }
}

/** Er destinasjonen tilgjengelig nå? Tar hensyn til både hovedrute, valg-baserte
 *  låser (`state.locked`) og sidesteders opplåsingsveier. */
export function isAccessible(d: Destination, s: GameStateLike): boolean {
  if (s.locked.includes(d.id)) return false;
  if (d.route === 'main') return true;
  if (s.unlockedSides.includes(d.id)) return true;
  return (d.unlocks ?? []).some((r) => meetsRequirement(r, s));
}

/** Menneskelig beskrivelse av et krav («Sjømannskap nivå 2», «3 sølv», …). */
export function describeRequirement(r: UnlockRequirement): string {
  switch (r.type) {
    case 'svenneprove': return `Ferdsbrev i ${skillTreeData[r.skill].name}`;
    case 'skill':       return `${skillTreeData[r.key].name} nivå ${r.min}`;
    case 'score':       return `${SCORE_LABEL[r.key]} ≥ ${r.min}`;
    case 'goods':
      return Object.entries(r.goods)
        .map(([g, n]) => `${n} ${TRADE_GOODS[g as TradeGoodId].name.toLowerCase()}`)
        .join(' + ');
  }
}

/** Det som mangler for å oppfylle et krav, formatert for info-kortet.
 *  Returnerer null hvis kravet allerede er oppfylt. */
export function missingForRequirement(r: UnlockRequirement, s: GameStateLike): string | null {
  switch (r.type) {
    case 'svenneprove': return `Ferdsbrev i ${skillTreeData[r.skill].name}`;
    case 'skill': {
      const cur = s.skills[r.key] ?? 0;
      return cur >= r.min ? null : `${r.min - cur} nivå i ${skillTreeData[r.key].name}`;
    }
    case 'score': {
      const cur = s.scores[r.key];
      return cur >= r.min ? null : `${r.min - cur} ${SCORE_LABEL[r.key].toLowerCase()}`;
    }
    case 'goods': {
      const missing = Object.entries(r.goods)
        .filter(([g, n]) => (s.goods[g as TradeGoodId] ?? 0) < (n ?? 0))
        .map(([g, n]) => `${(n ?? 0) - (s.goods[g as TradeGoodId] ?? 0)} ${TRADE_GOODS[g as TradeGoodId].name.toLowerCase()}`);
      return missing.length === 0 ? null : missing.join(' + ');
    }
  }
}

/** Det gruppa allerede har av kravet — formatert som «har X». Brukes ved siden av
 *  missingForRequirement for å vise «har 3 pelsverk, mangler 2 sølv». Returnerer
 *  null når informasjonen ikke er nyttig (f.eks. ren svenneprøve). */
export function haveForRequirement(r: UnlockRequirement, s: GameStateLike): string | null {
  switch (r.type) {
    case 'svenneprove': return null;
    case 'skill': {
      const cur = s.skills[r.key] ?? 0;
      return `nivå ${cur} i ${skillTreeData[r.key].name}`;
    }
    case 'score': {
      const cur = s.scores[r.key];
      return `${cur} ${SCORE_LABEL[r.key].toLowerCase()}`;
    }
    case 'goods': {
      const have = Object.entries(r.goods).map(([g, n]) => {
        const cur = s.goods[g as TradeGoodId] ?? 0;
        return `${cur}/${n} ${TRADE_GOODS[g as TradeGoodId].name.toLowerCase()}`;
      });
      return have.join(' · ');
    }
  }
}
