/**
 * unlocks.ts
 * Evaluerer opplåsingskrav for sidesteder, og lager de menneskelige tekstene
 * som vises på infokortet («Dere mangler: 1 sølv» / «Krever fagbrev i …»).
 */

import type { Destination, SkillKey, ScoreKey, TradeGoodId, UnlockRequirement } from '../types';
import { TRADE_GOODS } from '../data/tradeGoods';
import { skillTreeData } from '../data/skillTree';

/** «Fagbrev» (1) eller «Mesterbrev» (2). */
const brevLabel = (nivå: 1 | 2) => (nivå === 2 ? 'Mesterbrev' : 'Fagbrev');

/** Jorvik-krok (capstone, §6.3): venter når gruppa har MESTERBREV i ALLE fem domener.
 *  Her bygger vi kun betingelsen + en markør for at Jorvik venter — selve havne-/
 *  seremoni-innholdet kommer senere (gjenbruker eksisterende mekanikk). */
export function jorvikUnlocked(svennebrev: Record<SkillKey, number>): boolean {
  return (Object.keys(skillTreeData) as SkillKey[]).every((k) => (svennebrev[k] ?? 0) >= 2);
}

interface GameStateLike {
  scores: { culturalUnderstanding: number; tradeGain: number; reputation: number };
  svennebrev: Record<SkillKey, number>;
  goods: Partial<Record<TradeGoodId, number>>;
  locked: string[];
  unlockedSides: string[];
}

const SCORE_LABEL: Record<ScoreKey, string> = {
  culturalUnderstanding: 'Kulturforståelse',
  tradeGain: 'Handelsutbytte',
  reputation: 'Rykte',
};

/** Sann hvis kravet er oppfylt av gjeldende tilstand. Et svenneprøve-krav er møtt
 *  når gruppa har minst det brevet (fagbrev/mesterbrev) i domenet. */
export function meetsRequirement(r: UnlockRequirement, s: GameStateLike): boolean {
  switch (r.type) {
    case 'svenneprove': return (s.svennebrev[r.skill] ?? 0) >= r.nivå;
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
    case 'svenneprove': return `${brevLabel(r.nivå)} i ${skillTreeData[r.skill].name}`;
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
    case 'svenneprove': {
      const cur = s.svennebrev[r.skill] ?? 0;
      return cur >= r.nivå ? null : `${brevLabel(r.nivå)} i ${skillTreeData[r.skill].name}`;
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
 *  null når informasjonen ikke er nyttig. */
export function haveForRequirement(r: UnlockRequirement, s: GameStateLike): string | null {
  switch (r.type) {
    case 'svenneprove': {
      const cur = s.svennebrev[r.skill] ?? 0;
      return cur >= 2 ? `mesterbrev i ${skillTreeData[r.skill].name}`
        : cur >= 1 ? `fagbrev i ${skillTreeData[r.skill].name}` : null;
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
