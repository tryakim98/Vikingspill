/**
 * useGameState.ts
 * Gruppens spilltilstand. Den kanoniske kilden avhenger av modus:
 *  - online:  /games/{code}/groups/{groupId} i Firebase — alle medlemmer leser samme
 *             tilstand i sanntid. Endringer skrives til Firebase via patchGroup().
 *             Optimistisk lokalt sett → re-render via Firebase-echo for konsistens.
 *  - offline: localStorage er kilden (fase 1-oppførsel beholdt som fallback).
 *
 * Setterne skal idéelt sett gates av høvding-rollen før de kalles, men hooken selv
 * applikerer endringen uansett — det er forenklere ChiefOnly-wrapperen i komponentene
 * som hindrer ikke-høvding fra å trigge dem.
 */

import { useState, useEffect } from 'react';
import type { SkillKey, TradeGoodId } from '../types';
import type { GroupSetup } from './useGroupSetup';
import type { Session } from './useSession';
import { patchGroup, subscribeGroup, writeGroup } from '../lib/gameSync';
import type { FateEffect } from '../data/fateCards';

const SKILL_KEYS: SkillKey[] = ['språk', 'sjømannskap', 'krigskunst', 'diplomati', 'tro'];
const KEY = 'vikingspill_state';

export interface GameProgress {
  scores: { culturalUnderstanding: number; tradeGain: number; reputation: number };
  skills: Record<SkillKey, number>;
  visited: string[];
  locked: string[];
  goods: Partial<Record<TradeGoodId, number>>;
}

export interface OutcomeApply {
  destId: string;
  deltas: { und: number; trade: number; rep: number };
  skillReward: Partial<Record<SkillKey, number>> | null;
  locks: string[];
  goodsReward?: TradeGoodId[];
}

function seed(setup: GroupSetup): GameProgress {
  const skills = Object.fromEntries(SKILL_KEYS.map((k) => [k, 0])) as Record<SkillKey, number>;
  skills[setup.startSkill] = 1;
  return {
    scores: { culturalUnderstanding: 0, tradeGain: 0, reputation: 0 },
    skills,
    visited: [],
    locked: [],
    goods: {},
  };
}

export function useGameState(setup: GroupSetup, session: Session | null) {
  const [state, setState] = useState<GameProgress | null>(null);
  const isOnline = session?.mode === 'online' && !!session.groupId;

  // Online: lytt på Firebase som kanonisk kilde.
  useEffect(() => {
    if (!isOnline || session?.mode !== 'online' || !session.groupId) return;
    const unsub = subscribeGroup(session.gameCode, session.groupId, (g) => {
      if (!g) return;
      setState({
        scores: g.scores,
        skills: g.skills,
        visited: g.visited ?? [],
        locked: g.locked ?? [],
        goods: g.goods ?? {},
      });
    });
    return () => unsub();
  }, [isOnline, session]);

  // Offline: les fra localStorage, seed med startferdighet om første gang.
  useEffect(() => {
    if (isOnline) return;
    try {
      const raw = localStorage.getItem(KEY);
      setState(raw ? (JSON.parse(raw) as GameProgress) : seed(setup));
    } catch {
      setState(seed(setup));
    }
  }, [isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  // Offline-fallback: speil lokal state til Firebase når noe endres (legacy single-device-stier).
  useEffect(() => {
    if (!state || session?.mode !== 'online' || !session.groupId) return;
    if (isOnline) return; // online-modus skriver via persist; ikke dupliser her
    writeGroup(session.gameCode, session.groupId, {
      shipName: setup.shipName,
      shipSymbol: setup.shipSymbol,
      shipColor: setup.shipColor,
      startSkill: setup.startSkill,
      scores: state.scores,
      skills: state.skills,
      visited: state.visited,
      locked: state.locked,
      goods: state.goods,
      updatedAt: Date.now(),
    }).catch(() => {});
  }, [state, session, setup, isOnline]);

  const persist = (next: GameProgress) => {
    setState(next); // optimistisk
    if (isOnline && session?.mode === 'online' && session.groupId) {
      patchGroup(session.gameCode, session.groupId, {
        scores: next.scores,
        skills: next.skills,
        visited: next.visited,
        locked: next.locked,
        goods: next.goods,
      }).catch(() => {});
    } else {
      localStorage.setItem(KEY, JSON.stringify(next));
    }
  };

  const applyOutcome = (a: OutcomeApply) => {
    const base = state ?? seed(setup);
    const skills = { ...base.skills };
    if (a.skillReward) {
      for (const [k, v] of Object.entries(a.skillReward) as [SkillKey, number][]) {
        skills[k] = (skills[k] ?? 0) + v;
      }
    }
    const goods: Partial<Record<TradeGoodId, number>> = { ...(base.goods ?? {}) };
    if (a.goodsReward) {
      for (const g of a.goodsReward) {
        goods[g] = (goods[g] ?? 0) + 1;
      }
    }
    persist({
      scores: {
        culturalUnderstanding: base.scores.culturalUnderstanding + a.deltas.und,
        tradeGain: base.scores.tradeGain + a.deltas.trade,
        reputation: base.scores.reputation + a.deltas.rep,
      },
      skills,
      visited: base.visited.includes(a.destId) ? base.visited : [...base.visited, a.destId],
      locked: [...new Set([...base.locked, ...a.locks])],
      goods,
    });
  };

  const setSkillLevel = (skill: SkillKey, level: number) => {
    const base = state ?? seed(setup);
    persist({ ...base, skills: { ...base.skills, [skill]: level } });
  };

  const addReward = (deltas: { und: number; trade: number; rep: number }) => {
    const base = state ?? seed(setup);
    persist({
      ...base,
      scores: {
        culturalUnderstanding: base.scores.culturalUnderstanding + deltas.und,
        tradeGain: base.scores.tradeGain + deltas.trade,
        reputation: base.scores.reputation + deltas.rep,
      },
    });
  };

  const applyFateEffect = (effect: FateEffect) => {
    const base = state ?? seed(setup);
    const skills = { ...base.skills };
    if (effect.skill) {
      const cur = skills[effect.skill.key] ?? 0;
      skills[effect.skill.key] = Math.max(0, Math.min(3, cur + effect.skill.delta));
    }
    persist({
      ...base,
      scores: {
        culturalUnderstanding: base.scores.culturalUnderstanding + (effect.und ?? 0),
        tradeGain: base.scores.tradeGain + (effect.trade ?? 0),
        reputation: base.scores.reputation + (effect.rep ?? 0),
      },
      skills,
    });
  };

  const resetProgress = () => persist(seed(setup));

  return { state, applyOutcome, setSkillLevel, addReward, applyFateEffect, resetProgress };
}
