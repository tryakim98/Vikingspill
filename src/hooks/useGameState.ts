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

  const resetProgress = () => persist(seed(setup));

  return { state, applyOutcome, setSkillLevel, resetProgress };
}
