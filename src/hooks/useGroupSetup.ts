/**
 * useGroupSetup.ts
 * Lagrer/leser gruppens oppsett (skipsnavn, symbol, farge, startferdighet) i
 * localStorage. Fase 1-lagring — i fase 2 flyttes dette til delt Firebase-tilstand.
 */

import { useState, useEffect } from 'react';
import type { ShipSymbol, SkillKey } from '../types';

export interface GroupSetup {
  shipName: string;
  shipSymbol: ShipSymbol;
  shipColor: string;
  startSkill: SkillKey;
}

const KEY = 'vikingspill_group';

export function useGroupSetup() {
  const [setup, setSetupState] = useState<GroupSetup | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSetupState(JSON.parse(raw) as GroupSetup);
    } catch {
      // ignorer korrupt/utilgjengelig lagring
    }
    setLoaded(true);
  }, []);

  const saveSetup = (next: GroupSetup) => {
    setSetupState(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const clearSetup = () => {
    setSetupState(null);
    localStorage.removeItem(KEY);
  };

  return { setup: loaded ? setup : null, loaded, saveSetup, clearSetup };
}
