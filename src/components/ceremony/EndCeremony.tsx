/**
 * EndCeremony.tsx
 * Sluttseremonien (§8.6). Trinnvis avsløring for spenning:
 *   1) «Kongen kaller alle hjem til Avaldsnes»
 *   2) Reisens regnskap (de tre poengsøylene + total)
 *   3) Arketypen avsløres mot nordlys (aurora)
 * Fase 1 viser én gruppes resultat; flerlags-rangering (siste plass først) kommer i fase 2.
 */

import { useState } from 'react';
import type { SkillKey } from '../../types';
import type { GroupSetup } from '../../hooks/useGroupSetup';
import { determineArchetype, topSkillTitle } from '../../data/archetypes';
import VikingShip from '../ship/VikingShip';

interface Scores {
  culturalUnderstanding: number;
  tradeGain: number;
  reputation: number;
}

interface Props {
  setup: GroupSetup;
  scores: Scores;
  skills: Record<SkillKey, number>;
  onClose: () => void;
}

type Step = 'intro' | 'scores' | 'archetype';

export default function EndCeremony({ setup, scores, skills, onClose }: Props) {
  const [step, setStep] = useState<Step>('intro');
  const total = scores.culturalUnderstanding + scores.tradeGain + scores.reputation;
  const archetype = determineArchetype(scores);
  const top = topSkillTitle(skills);

  const pillars = [
    { label: 'Kulturforståelse', v: scores.culturalUnderstanding },
    { label: 'Handelsutbytte', v: scores.tradeGain },
    { label: 'Rykte', v: scores.reputation },
  ];

  if (step === 'intro') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-viking-darkblue to-viking-surface px-4 text-center text-viking-paper">
        <div className="animate-rise">
          <div className="mb-4 text-6xl">🏰</div>
          <h1 className="mb-3 font-cinzel text-3xl font-bold text-viking-gold md:text-4xl">Kongen kaller alle hjem til Avaldsnes</h1>
          <p className="mb-8 font-inter italic text-viking-gold-soft">Reisen er over. Stig i land og hør hvordan det gikk.</p>
          <div className="mb-8 flex justify-center">
            <VikingShip color={setup.shipColor} symbol={setup.shipSymbol} size={180} bob />
          </div>
          <p className="mb-8 font-cinzel text-2xl text-viking-paper">{setup.shipName}</p>
          <button onClick={() => setStep('scores')} className="rounded-md border-2 border-viking-gold bg-viking-gold px-9 py-2.5 font-cinzel text-lg font-bold text-viking-darkblue hover:bg-viking-gold-soft">Stig i land →</button>
        </div>
      </div>
    );
  }

  if (step === 'scores') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-viking-darkblue to-viking-surface px-4 text-center text-viking-paper">
        <div className="w-full max-w-xl animate-rise">
          <h1 className="mb-6 font-cinzel text-3xl font-bold text-viking-gold">Reisens regnskap</h1>
          <div className="mb-4 grid grid-cols-3 gap-3">
            {pillars.map((p) => (
              <div key={p.label} className="rounded-lg border-2 border-viking-gold/40 bg-viking-surface p-4">
                <p className="font-mono text-xs text-viking-gold-soft">{p.label}</p>
                <p className="font-cinzel text-3xl font-bold text-viking-gold">{p.v}</p>
              </div>
            ))}
          </div>
          <div className="mb-3 rounded-lg border-2 border-viking-gold bg-viking-darkblue/60 p-4">
            <p className="font-mono text-xs text-viking-gold-soft">Totalt</p>
            <p className="font-cinzel text-4xl font-bold text-viking-gold-soft">{total}</p>
          </div>
          <p className="mb-8 font-inter text-xs italic text-viking-paper/50">Flerlags-rangering (siste plass først) kommer i fase 2 på lærerskjermen.</p>
          <button onClick={() => setStep('archetype')} className="rounded-md border-2 border-viking-gold bg-viking-gold px-9 py-2.5 font-cinzel text-lg font-bold text-viking-darkblue hover:bg-viking-gold-soft">Avslør arketypen ✦</button>
        </div>
      </div>
    );
  }

  // step === 'archetype'
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-viking-darkblue px-4 text-center text-viking-paper">
      <div className="aurora pointer-events-none absolute inset-0 opacity-30 blur-2xl" />
      <div className="relative z-10 animate-rise">
        <p className="mb-2 font-inter text-xs uppercase tracking-[0.3em] text-viking-gold-soft/70">Din arketype</p>
        <div className="mb-4 text-7xl">{archetype.icon}</div>
        <h1 className="mb-4 font-cinzel text-4xl font-bold text-viking-gold drop-shadow-lg md:text-5xl">{archetype.title}</h1>
        <p className="mx-auto mb-6 max-w-md font-inter text-lg italic text-viking-paper/90">{archetype.blurb}</p>
        {top && (
          <p className="mb-10 font-cinzel text-viking-gold-soft">
            {top.icon} Sterkest i {top.name} {top.level >= 3 ? '— Mester' : `(nivå ${top.level})`}
          </p>
        )}
        <button onClick={onClose} className="rounded-md border-2 border-viking-gold bg-viking-gold px-9 py-2.5 font-cinzel font-bold text-viking-darkblue hover:bg-viking-gold-soft">Tilbake til dashbordet</button>
      </div>
    </div>
  );
}
