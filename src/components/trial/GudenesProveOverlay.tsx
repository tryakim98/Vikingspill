/**
 * GudenesProveOverlay.tsx
 * Full-skjerm avbrudd når læreren utløser «Gudenes prøve» (§3.4 / §8.5). Viser den
 * tilfeldig trukne utfordringen (lik for alle grupper) og hvilken ferdighet som gir
 * bonus — pluss DENNE gruppas bonus (ferdighetsnivå). Gruppa gjør utfordringen fysisk
 * og trykker «Fullført» for å kreve belønningen.
 */

import type { SkillKey } from '../../types';
import { skillTreeData } from '../../data';

interface Props {
  navn: string;
  desc: string;
  skill: SkillKey;
  skillLevel: number;
  onDone: () => void;
}

export default function GudenesProveOverlay({ navn, desc, skill, skillLevel, onDone }: Props) {
  const branch = skillTreeData[skill];
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-viking-darkblue/95 px-4 text-center text-viking-paper">
      <div className="animate-bob text-7xl">👁️</div>
      <h1 className="mt-4 font-cinzel text-4xl font-bold tracking-widest text-viking-gold drop-shadow-lg md:text-5xl">⚡ GUDENES PRØVE ⚡</h1>
      <p className="mt-2 font-inter italic text-viking-gold-soft">Gudene avbryter reisen — alle skip prøves samtidig!</p>

      <div className="mt-8 max-w-md rounded-lg border-2 border-viking-gold bg-viking-surface p-6">
        <h2 className="mb-2 font-cinzel text-2xl text-viking-gold">{navn}</h2>
        <p className="mb-4 font-inter text-viking-paper/90">{desc}</p>
        <p className="font-inter text-sm text-viking-paper/80">
          Ferdigheten som teller: <span className="font-cinzel" style={{ color: branch.color }}>{branch.icon} {branch.name}</span>
        </p>
        <p className="mt-1 font-cinzel text-lg text-viking-gold">
          Deres bonus: +{skillLevel}{skillLevel === 0 ? ' — dere er svake her!' : ''}
        </p>
      </div>

      <button
        onClick={onDone}
        className="mt-8 rounded-md border-2 border-viking-gold bg-viking-gold px-9 py-3 font-cinzel text-lg font-bold text-viking-darkblue hover:bg-viking-gold-soft"
      >
        Fullført — krev belønningen
      </button>
    </div>
  );
}
