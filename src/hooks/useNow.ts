/**
 * useNow.ts
 * Re-render hvert sekund (eller annet intervall) så nedtellinger oppdateres jevnt.
 * Tikker kun når `active` er sann, så stoppede timere ikke maler unødig.
 */

import { useState, useEffect } from 'react';

export function useNow(active: boolean, intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [active, intervalMs]);
  return now;
}
