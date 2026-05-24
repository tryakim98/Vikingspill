/**
 * GameDashboard.tsx
 * Lett fase-1-dashbord: poeng (kulturforståelse/handel/rykte), ferdigheter, og en
 * destinasjonsliste som inngang til encounter-flyten. Fullt kart + animasjoner
 * (§8.1) kommer senere. Rendres kun med en gyldig gruppe (gyldig hooks-bruk).
 */

import { useState } from 'react';
import type { Destination, SkillKey } from '../../types';
import { destinations, skillTreeData } from '../../data';
import { useGameState } from '../../hooks/useGameState';
import type { GroupSetup } from '../../hooks/useGroupSetup';
import VikingShip from '../ship/VikingShip';
import EncounterFlow from '../encounter/EncounterFlow';

const SKILL_KEYS: SkillKey[] = ['språk', 'sjømannskap', 'krigskunst', 'diplomati', 'tro'];
const SYMBOL_LABEL: Record<string, string> = { drage: '🐉 Drage', ulv: '🐺 Ulv', ravn: '🐦‍⬛ Ravn' };
const DIFFICULTY_COLOR: Record<string, string> = { trygg: '#5B7553', middels: '#D4A843', farlig: '#8B2929' };

interface Props {
  setup: GroupSetup;
  onResetSetup: () => void;
  onSwitchRole: () => void;
}

export default function GameDashboard({ setup, onResetSetup, onSwitchRole }: Props) {
  const { state, applyOutcome, resetProgress } = useGameState(setup);
  const [activeDest, setActiveDest] = useState<Destination | null>(null);

  if (!state) return null;

  if (activeDest) {
    return (
      <EncounterFlow
        destination={activeDest}
        skills={state.skills}
        onComplete={(apply) => { applyOutcome(apply); setActiveDest(null); }}
        onExit={() => setActiveDest(null)}
      />
    );
  }

  const stats = [
    { label: 'Kulturforståelse', v: state.scores.culturalUnderstanding },
    { label: 'Handelsutbytte', v: state.scores.tradeGain },
    { label: 'Rykte', v: state.scores.reputation },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-viking-darkblue to-viking-surface text-viking-paper p-6">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4 border-b-4 border-viking-gold pb-5">
          <VikingShip color={setup.shipColor} symbol={setup.shipSymbol} size={96} />
          <div>
            <h1 className="font-cinzel text-3xl text-viking-gold">{setup.shipName}</h1>
            <p className="font-inter text-sm text-viking-gold-soft">{SYMBOL_LABEL[setup.shipSymbol]} · {state.visited.length}/{destinations.length} destinasjoner besøkt</p>
          </div>
        </div>

        {/* Poeng */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border-2 border-viking-gold/40 bg-viking-surface p-3 text-center">
              <p className="font-mono text-xs text-viking-gold-soft">{s.label}</p>
              <p className="font-cinzel text-3xl font-bold text-viking-gold">{s.v}</p>
            </div>
          ))}
        </div>

        {/* Ferdigheter */}
        <div className="mb-6 flex flex-wrap gap-2">
          {SKILL_KEYS.map((key) => {
            const lvl = state.skills[key] ?? 0;
            return (
              <div key={key} className={`flex items-center gap-2 rounded-full border-2 px-3 py-1 ${lvl > 0 ? 'border-viking-gold/60 bg-viking-gold/10' : 'border-viking-gold/20 opacity-60'}`}>
                <span style={{ color: skillTreeData[key].color }}>{skillTreeData[key].icon}</span>
                <span className="font-inter text-xs text-viking-paper/90">{skillTreeData[key].name}</span>
                <span className="font-mono text-xs text-viking-gold">{lvl}</span>
              </div>
            );
          })}
        </div>

        {/* Destinasjoner */}
        <h2 className="mb-3 font-cinzel text-xl text-viking-gold">Seilas</h2>
        <div className="mb-8 grid gap-2 sm:grid-cols-2">
          {destinations.map((dest) => {
            const visited = state.visited.includes(dest.id);
            const locked = state.locked.includes(dest.id);
            return (
              <button
                key={dest.id}
                disabled={locked}
                onClick={() => setActiveDest(dest)}
                className={`flex items-center justify-between rounded-lg border-2 px-4 py-3 text-left transition-all ${locked ? 'cursor-not-allowed border-viking-crimson/30 opacity-50' : visited ? 'border-viking-moss/60 bg-viking-moss/10 hover:border-viking-moss' : 'border-viking-gold/40 bg-viking-surface hover:border-viking-gold hover:scale-[1.02]'}`}
              >
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: DIFFICULTY_COLOR[dest.difficulty ?? 'middels'] }} />
                  <span className="font-cinzel text-viking-paper">{dest.name}</span>
                </span>
                <span className="font-mono text-xs text-viking-gold-soft">{locked ? '🔒' : visited ? '✓ besøkt' : '→'}</span>
              </button>
            );
          })}
        </div>

        {/* Dev-modus */}
        <div className="rounded-lg border-2 border-viking-plum/60 bg-viking-plum/15 p-5">
          <h3 className="mb-3 font-cinzel text-lg text-viking-plum">👨‍💻 Utvikler-modus</h3>
          <div className="flex flex-wrap gap-3">
            <button onClick={resetProgress} className="rounded border-2 border-viking-gold bg-viking-teal px-4 py-2 text-sm font-bold text-viking-paper hover:bg-viking-teal/80">Nullstill reise</button>
            <button onClick={onResetSetup} className="rounded border-2 border-viking-gold bg-viking-rust px-4 py-2 text-sm font-bold text-viking-paper hover:bg-viking-rust/80">Start oppsett på nytt</button>
            <button onClick={onSwitchRole} className="rounded border-2 border-viking-gold bg-viking-plum px-4 py-2 text-sm font-bold text-viking-paper hover:bg-viking-plum/80">Bytt rolle</button>
          </div>
        </div>
      </div>
    </div>
  );
}
