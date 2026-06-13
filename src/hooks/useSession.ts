/**
 * useSession.ts
 * Elevens spilløkt, lagret i localStorage. To moduser:
 *   - online:  koblet til et spill via spillkode → flere enheter kan tilhøre samme gruppe
 *   - offline: spiller lokalt uten kode (fase 1-oppførsel beholdt som fallback)
 *
 * `memberId` er enhetens unike ID — flere medlemmer kan dele samme `groupId`.
 * `groupId` er null i online-modus inntil eleven har valgt eller opprettet en gruppe.
 */

import { useState, useEffect } from 'react';

export type Session =
  | { mode: 'online'; gameCode: string; memberId: string; groupId: string | null }
  | { mode: 'offline'; groupId: string; memberId: string };

const KEY = 'vikingspill_session';
const MEMBER_KEY = 'vikingspill_member_id';

function ensureMemberId(): string {
  try {
    const existing = localStorage.getItem(MEMBER_KEY);
    if (existing) return existing;
  } catch { /* ignore */ }
  const id = 'm-' + Math.random().toString(36).slice(2, 10);
  try { localStorage.setItem(MEMBER_KEY, id); } catch { /* ignore */ }
  return id;
}

function newId(prefix: string): string {
  return prefix + Math.random().toString(36).slice(2, 8);
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSession(JSON.parse(raw) as Session);
    } catch {
      // ignorer korrupt lagring
    }
    setLoaded(true);
  }, []);

  const persist = (next: Session) => {
    localStorage.setItem(KEY, JSON.stringify(next));
    setSession(next);
  };

  /** Koble til spillet, men ikke til en gruppe ennå — det gjøres i GroupPicker. */
  const join = (gameCode: string) => persist({
    mode: 'online',
    gameCode,
    memberId: ensureMemberId(),
    groupId: null,
  });

  /** Velg/opprett gruppe i online-spillet. Beholder samme memberId. */
  const setGroupId = (groupId: string | null) => {
    if (!session || session.mode !== 'online') return;
    persist({ ...session, groupId });
  };

  /** Offline-modus: én enhet = én gruppe. memberId == groupId-effekt. */
  const playOffline = () => {
    const groupId = newId('g-');
    persist({ mode: 'offline', groupId, memberId: ensureMemberId() });
  };

  const leave = () => {
    localStorage.removeItem(KEY);
    setSession(null);
  };

  return { session: loaded ? session : null, loaded, join, setGroupId, playOffline, leave };
}
