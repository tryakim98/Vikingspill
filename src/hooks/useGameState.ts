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
import type { SkillKey, TradeGoodId, SagaEntry, Svennebrev } from '../types';
import type { GroupSetup } from './useGroupSetup';
import type { Session } from './useSession';
import { patchGroup, subscribeGroup, writeGroup } from '../lib/gameSync';
import type { FateEffect } from '../data/fateCards';
import type { SpecialAction } from '../data/specialActions';

const SKILL_KEYS: SkillKey[] = ['språk', 'sjømannskap', 'krigskunst', 'diplomati', 'tro'];
const KEY = 'vikingspill_state';

/** Klem til gyldig svennebrev (0 = ingen · 1 = sveinn · 2 = mester). */
const clampBrev = (n: number): 0 | 1 | 2 => (n <= 0 ? 0 : n >= 2 ? 2 : 1);
/** Tomt svennebrev-kart (migrering: gamle lagrede `skills`-tall ignoreres → alle 0). */
const emptyBrev = (): Svennebrev => Object.fromEntries(SKILL_KEYS.map((k) => [k, 0])) as Svennebrev;

export interface GameProgress {
  scores: { culturalUnderstanding: number; tradeGain: number; reputation: number };
  svennebrev: Svennebrev;
  visited: string[];
  locked: string[];
  goods: Partial<Record<TradeGoodId, number>>;
  unlockedSides: string[];
  performedActions: string[];
  saga: SagaEntry[];
}

export interface OutcomeApply {
  destId: string;
  deltas: { und: number; trade: number; rep: number };
  locks: string[];
  goodsReward?: TradeGoodId[];
  sagaEntry?: SagaEntry;
}

function seed(): GameProgress {
  // §2.3: en ny gruppe starter med svennebrev alle 0. Disposisjonen lever nå i
  // medlemmets ROLLE (members/{id}.role), ikke i et start-svennebrev.
  const svennebrev = Object.fromEntries(SKILL_KEYS.map((k) => [k, 0])) as Svennebrev;
  return {
    scores: { culturalUnderstanding: 0, tradeGain: 0, reputation: 0 },
    svennebrev,
    visited: [],
    locked: [],
    goods: {},
    unlockedSides: [],
    performedActions: [],
    saga: [],
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
        svennebrev: g.svennebrev ?? emptyBrev(), // migrering: gamle grupper uten svennebrev
        visited: g.visited ?? [],
        locked: g.locked ?? [],
        goods: g.goods ?? {},
        unlockedSides: g.unlockedSides ?? [],
        performedActions: g.performedActions ?? [],
        saga: g.saga ?? [],
      });
    });
    return () => unsub();
  }, [isOnline, session]);

  // Offline: les fra localStorage, seed (svennebrev alle 0) om første gang.
  useEffect(() => {
    if (isOnline) return;
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) { setState(seed()); return; }
      const parsed = JSON.parse(raw) as GameProgress;
      // Migrering: gamle lagrede spill manglet svennebrev (het `skills`) → start på 0.
      setState({ ...parsed, svennebrev: parsed.svennebrev ?? emptyBrev() });
    } catch {
      setState(seed());
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
      scores: state.scores,
      svennebrev: state.svennebrev,
      visited: state.visited,
      locked: state.locked,
      goods: state.goods,
      unlockedSides: state.unlockedSides,
      performedActions: state.performedActions,
      saga: state.saga,
      updatedAt: Date.now(),
    }).catch(() => {});
  }, [state, session, setup, isOnline]);

  const persist = (next: GameProgress) => {
    setState(next); // optimistisk
    if (isOnline && session?.mode === 'online' && session.groupId) {
      patchGroup(session.gameCode, session.groupId, {
        scores: next.scores,
        svennebrev: next.svennebrev,
        visited: next.visited,
        locked: next.locked,
        goods: next.goods,
        unlockedSides: next.unlockedSides,
        performedActions: next.performedActions,
        saga: next.saga,
      }).catch(() => {});
    } else {
      localStorage.setItem(KEY, JSON.stringify(next));
    }
  };

  const applyOutcome = (a: OutcomeApply) => {
    const base = state ?? seed();
    // Valg gir ikke lenger svennebrev (skillReward fjernet) — brev fås kun via svenneprøven.
    const goods: Partial<Record<TradeGoodId, number>> = { ...(base.goods ?? {}) };
    if (a.goodsReward) {
      for (const g of a.goodsReward) {
        goods[g] = (goods[g] ?? 0) + 1;
      }
    }
    const saga = [...(base.saga ?? [])];
    if (a.sagaEntry) saga.push(a.sagaEntry);
    persist({
      scores: {
        culturalUnderstanding: base.scores.culturalUnderstanding + a.deltas.und,
        tradeGain: base.scores.tradeGain + a.deltas.trade,
        reputation: base.scores.reputation + a.deltas.rep,
      },
      svennebrev: base.svennebrev,
      visited: base.visited.includes(a.destId) ? base.visited : [...base.visited, a.destId],
      locked: [...new Set([...base.locked, ...a.locks])],
      goods,
      unlockedSides: base.unlockedSides ?? [],
      performedActions: base.performedActions ?? [],
      saga,
    });
  };

  /** Tildel et svennebrev (1 = sveinn, 2 = mester) i et domene. */
  const setSkillLevel = (skill: SkillKey, brev: 0 | 1 | 2) => {
    const base = state ?? seed();
    persist({ ...base, svennebrev: { ...base.svennebrev, [skill]: brev } });
  };

  const addReward = (deltas: { und: number; trade: number; rep: number }) => {
    const base = state ?? seed();
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
    const base = state ?? seed();
    const svennebrev = { ...base.svennebrev };
    if (effect.skill) {
      const cur = svennebrev[effect.skill.key] ?? 0;
      svennebrev[effect.skill.key] = clampBrev(cur + effect.skill.delta);
    }
    persist({
      ...base,
      scores: {
        culturalUnderstanding: base.scores.culturalUnderstanding + (effect.und ?? 0),
        tradeGain: base.scores.tradeGain + (effect.trade ?? 0),
        reputation: base.scores.reputation + (effect.rep ?? 0),
      },
      svennebrev,
    });
  };

  const resetProgress = () => persist(seed());

  /** Markér et sidested som låst opp via svenneprøve (vedvarer i state). */
  const unlockSide = (destId: string) => {
    const base = state ?? seed();
    if (base.unlockedSides.includes(destId)) return;
    persist({ ...base, unlockedSides: [...base.unlockedSides, destId] });
  };

  /** Utfør en spesialhandling: trekk kostnad, legg til effekt, marker som utført.
   *  Henter ressurser fra gruppens nåværende tilstand og oppdaterer alt i ÉN persist. */
  const performAction = (action: SpecialAction) => {
    const base = state ?? seed();
    if (base.performedActions.includes(action.id)) return;
    const scores = { ...base.scores };
    const svennebrev = { ...base.svennebrev };
    const goods: Partial<Record<TradeGoodId, number>> = { ...base.goods };
    let unlockedSides = base.unlockedSides;

    if (action.cost) {
      if (action.cost.rep) scores.reputation -= action.cost.rep;
      if (action.cost.trade) scores.tradeGain -= action.cost.trade;
      if (action.cost.und) scores.culturalUnderstanding -= action.cost.und;
      if (action.cost.goods) {
        for (const [g, n] of Object.entries(action.cost.goods)) {
          goods[g as TradeGoodId] = Math.max(0, (goods[g as TradeGoodId] ?? 0) - (n ?? 0));
        }
      }
    }
    if (action.effect.rep) scores.reputation += action.effect.rep;
    if (action.effect.trade) scores.tradeGain += action.effect.trade;
    if (action.effect.und) scores.culturalUnderstanding += action.effect.und;
    if (action.effect.goods) {
      for (const [g, n] of Object.entries(action.effect.goods)) {
        goods[g as TradeGoodId] = (goods[g as TradeGoodId] ?? 0) + (n ?? 0);
      }
    }
    if (action.effect.skill) {
      const cur = svennebrev[action.effect.skill.key] ?? 0;
      svennebrev[action.effect.skill.key] = clampBrev(cur + action.effect.skill.delta);
    }
    if (action.effect.unlocks?.length) {
      unlockedSides = [...new Set([...unlockedSides, ...action.effect.unlocks])];
    }

    persist({
      ...base,
      scores,
      svennebrev,
      goods,
      unlockedSides,
      performedActions: [...base.performedActions, action.id],
    });
  };

  return { state, applyOutcome, setSkillLevel, addReward, applyFateEffect, unlockSide, performAction, resetProgress };
}
