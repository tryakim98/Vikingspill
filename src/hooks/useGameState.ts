/**
 * useGameState.ts
 * Fase 1-spilltilstand (poeng, ferdigheter, besøkte/låste destinasjoner) lagret i
 * localStorage. Seedet fra gruppens startferdighet. Flyttes til Firebase i fase 2.
 */

import { useState, useEffect } from 'react';
import type { SkillKey } from '../types';
import type { GroupSetup } from './useGroupSetup';
import type { Session } from './useSession';
import { writeGroup } from '../lib/gameSync';
import type { FateEffect } from '../data/fateCards';

const SKILL_KEYS: SkillKey[] = ['språk', 'sjømannskap', 'krigskunst', 'diplomati', 'tro'];
const KEY = 'vikingspill_state';

export interface GameProgress {
  scores: { culturalUnderstanding: number; tradeGain: number; reputation: number };
  skills: Record<SkillKey, number>;
  visited: string[];
  locked: string[];
}

export interface OutcomeApply {
  destId: string;
  deltas: { und: number; trade: number; rep: number };
  skillReward: Partial<Record<SkillKey, number>> | null;
  locks: string[];
}

function seed(setup: GroupSetup): GameProgress {
  const skills = Object.fromEntries(SKILL_KEYS.map((k) => [k, 0])) as Record<SkillKey, number>;
  skills[setup.startSkill] = 1;
  return {
    scores: { culturalUnderstanding: 0, tradeGain: 0, reputation: 0 },
    skills,
    visited: [],
    locked: [],
  };
}

export function useGameState(setup: GroupSetup, session: Session | null) {
  const [state, setState] = useState<GameProgress | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      setState(raw ? (JSON.parse(raw) as GameProgress) : seed(setup));
    } catch {
      setState(seed(setup));
    }
    // Seedes kun ved første montering; setup er stabil fra localStorage.
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Speil gruppens identitet + tilstand til Firebase når økten er online.
  // localStorage er alltid kilden; dette er «best effort»-sync (feiler stille offline).
  useEffect(() => {
    if (!state || session?.mode !== 'online') return;
    writeGroup(session.gameCode, session.groupId, {
      shipName: setup.shipName,
      shipSymbol: setup.shipSymbol,
      shipColor: setup.shipColor,
      startSkill: setup.startSkill,
      scores: state.scores,
      skills: state.skills,
      visited: state.visited,
      locked: state.locked,
      updatedAt: Date.now(),
    }).catch(() => { /* offline-fallback: localStorage beholder tilstanden */ });
  }, [state, session, setup]);

  const persist = (next: GameProgress) => {
    setState(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const applyOutcome = (a: OutcomeApply) => {
    const base = state ?? seed(setup);
    const skills = { ...base.skills };
    if (a.skillReward) {
      for (const [k, v] of Object.entries(a.skillReward) as [SkillKey, number][]) {
        skills[k] = (skills[k] ?? 0) + v;
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
    });
  };

  // Oppgrader en ferdighet etter en bestått verdighetsprøve (§3.2).
  const setSkillLevel = (skill: SkillKey, level: number) => {
    const base = state ?? seed(setup);
    persist({ ...base, skills: { ...base.skills, [skill]: level } });
  };

  // Legg til poeng uten å endre besøkt/låst/ferdigheter (f.eks. Gudenes prøve-belønning).
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

  // Et skjebne-kort kan ramme både poeng OG en ferdighet samtidig. addReward og
  // setSkillLevel leser begge fra samme `state`-snapshot, så å kalle dem etter hverandre
  // ville fått den andre til å overskrive den første. Vi gjør begge i én persist.
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
