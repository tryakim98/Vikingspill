/**
 * useConnection.ts
 * Følger Firebase-tilkoblingen (`.info/connected`) når økten er online. Returnerer true
 * når vi har kontakt. Et lite tap (< 2,5 s) rapporteres ikke som «frakoblet», så banneret
 * ikke blinker ved korte hikke eller idet siden kobler til første gang.
 */

import { useState, useEffect } from 'react';
import { subscribeConnection } from '../lib/gameSync';

export function useConnection(active: boolean): boolean {
  const [connected, setConnected] = useState(true);

  // Når inaktiv lytter vi ikke; ConnectionBanner skjuler seg uansett via `active`-sjekken,
  // så vi trenger ikke (og bør ikke) sette state synkront her.
  useEffect(() => {
    if (!active) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsub = subscribeConnection((c) => {
      clearTimeout(timer);
      if (c) setConnected(true);
      else timer = setTimeout(() => setConnected(false), 2500);
    });
    return () => { clearTimeout(timer); unsub(); };
  }, [active]);

  return connected;
}
