/**
 * useSession.ts
 * Elevens spilløkt, lagret i localStorage. To moduser:
 *   - online:  koblet til et spill via spillkode → synces til Firebase
 *   - offline: spiller lokalt uten kode (fase 1-oppførsel beholdt som fallback)
 * groupId er enhetens unike gruppe-id (beholdes på tvers av refresh).
 */

import { useState, useEffect } from 'react';

export type Session =
  | { mode: 'online'; groupId: string; gameCode: string }
  | { mode: 'offline'; groupId: string };

const KEY = 'vikingspill_session';

function newGroupId(): string {
  return 'g-' + Math.random().toString(36).slice(2, 8);
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

  const join = (gameCode: string) => persist({ mode: 'online', groupId: newGroupId(), gameCode });
  const playOffline = () => persist({ mode: 'offline', groupId: newGroupId() });

  const leave = () => {
    localStorage.removeItem(KEY);
    setSession(null);
  };

  return { session: loaded ? session : null, loaded, join, playOffline, leave };
}
