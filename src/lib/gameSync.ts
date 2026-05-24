/**
 * gameSync.ts
 * Sanntidssync mot Firebase Realtime Database (modulær v9+ API).
 * Datamodell:  /games/{gameCode}/meta            { createdAt }
 *              /games/{gameCode}/groups/{groupId} SyncedGroup
 *
 * Elevene SKRIVER sin egen gruppe; lærerskjermen LYTTER på alle grupper.
 * Alle skriv er «best effort» — feiler de (offline), beholder appen localStorage.
 */

import { ref, set, get, remove, onValue, type Unsubscribe } from 'firebase/database';
import { db } from './firebase';
import type { SkillKey } from '../types';

export interface SyncedGroup {
  shipName: string;
  shipSymbol: string;
  shipColor: string;
  startSkill: SkillKey;
  scores: { culturalUnderstanding: number; tradeGain: number; reputation: number };
  skills: Record<SkillKey, number>;
  visited: string[];
  locked: string[];
  updatedAt: number;
}

/** Lærer: opprett et nytt spill. */
export function createGame(code: string): Promise<void> {
  return set(ref(db, `games/${code}/meta`), { createdAt: Date.now() });
}

/** Elev: sjekk at spillkoden finnes før tilkobling. */
export async function gameExists(code: string): Promise<boolean> {
  const snap = await get(ref(db, `games/${code}/meta`));
  return snap.exists();
}

/** Elev: skriv (overskriv) gruppens tilstand. */
export function writeGroup(code: string, groupId: string, data: SyncedGroup): Promise<void> {
  return set(ref(db, `games/${code}/groups/${groupId}`), data);
}

/** Elev: fjern gruppen (når de forlater spillet). */
export function removeGroup(code: string, groupId: string): Promise<void> {
  return remove(ref(db, `games/${code}/groups/${groupId}`));
}

/** Lærer: lytt på alle grupper i et spill. Returnerer en avmeldingsfunksjon. */
export function subscribeGroups(
  code: string,
  callback: (groups: Record<string, SyncedGroup>) => void,
): Unsubscribe {
  return onValue(ref(db, `games/${code}/groups`), (snap) => {
    const groups = (snap.val() as Record<string, SyncedGroup> | null) ?? {};
    // Firebase utelater tomme arrays/objekter ved lagring → fyll inn defaults
    // så konsumenter (leaderboard m.m.) alltid kan lese .length trygt.
    for (const g of Object.values(groups)) {
      g.visited = g.visited ?? [];
      g.locked = g.locked ?? [];
    }
    callback(groups);
  });
}
