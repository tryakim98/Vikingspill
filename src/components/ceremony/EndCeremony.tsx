/**
 * EndCeremony.tsx
 * Sluttseremonien (§8.6). Arketypen er hovedbelønningen — den sier noe om HVORDAN
 * gruppa spilte, ikke hvor mye de samlet. «Mest poeng» er ikke nødvendigvis det mest
 * attraktive. Trinn:
 *   1) «Kongen kaller alle hjem til Avaldsnes»
 *   2) Reisens regnskap (poengsøyler — bredt, men ikke himmelropende)
 *   3) Arketypen avsløres stort og stolt med ærlig karakteristikk (også de mindre
 *      flatterende), gruppens verdier, og eventuell heders-tittel.
 */

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { playSound } from '../../lib/sound';
import type { SkillKey, SagaEntry, Destination } from '../../types';
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
  saga: SagaEntry[];
  destinations: Destination[];
  acceptedTradesCount: number;
  onClose: () => void;
}

type Step = 'intro' | 'scores' | 'archetype';

export default function EndCeremony({ setup, scores, skills, saga, destinations, acceptedTradesCount, onClose }: Props) {
  const [step, setStep] = useState<Step>('intro');

  // Seremonilyd (§8.6): kongen kaller flåten hjem, og senere avsløres arketypen.
  useEffect(() => {
    if (step === 'intro') playSound('summon');
    else if (step === 'archetype') playSound('archetype');
  }, [step]);

  const total = scores.culturalUnderstanding + scores.tradeGain + scores.reputation;
  const archetype = determineArchetype({ saga, destinations, acceptedTradesCount, scores });
  const top = topSkillTitle(skills);

  const pillars = [
    { label: 'Kulturforståelse', v: scores.culturalUnderstanding },
    { label: 'Handelsutbytte', v: scores.tradeGain },
    { label: 'Rykte', v: scores.reputation },
  ];

  if (step === 'intro') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-viking-darkblue to-viking-surface px-4 text-center text-viking-paper">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="mb-4 text-6xl">🏰</div>
          <h1 className="mb-3 font-cinzel text-3xl font-bold text-viking-gold md:text-4xl">Kongen kaller alle hjem til Avaldsnes</h1>
          <p className="mb-8 font-inter italic text-viking-gold-soft">Reisen er over. Stig i land og hør hvordan det gikk.</p>
          <div className="mb-8 flex justify-center">
            <VikingShip color={setup.shipColor} symbol={setup.shipSymbol} size={180} bob />
          </div>
          <p className="mb-8 font-cinzel text-2xl text-viking-paper">{setup.shipName}</p>
          <button onClick={() => setStep('scores')} className="rounded-md border-2 border-viking-gold bg-viking-gold px-9 py-2.5 font-cinzel text-lg font-bold text-viking-darkblue hover:bg-viking-gold-soft">Stig i land →</button>
        </motion.div>
      </div>
    );
  }

  if (step === 'scores') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-viking-darkblue to-viking-surface px-4 text-center text-viking-paper">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl">
          <p className="mb-2 font-cinzel text-xs uppercase tracking-[0.3em] text-viking-gold-soft/70">Et øyeblikks regnskap</p>
          <h1 className="mb-6 font-cinzel text-3xl font-bold text-viking-gold">Hva dere samlet</h1>
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
          <p className="mb-8 max-w-md mx-auto font-inter text-sm italic text-viking-paper/65">
            Men poengsummen forteller bare HVA dere samlet — ikke HVORDAN.
            Det er HVORDAN som avgjør hvem dere ble.
          </p>
          <button onClick={() => setStep('archetype')} className="rounded-md border-2 border-viking-gold bg-viking-gold px-9 py-2.5 font-cinzel text-lg font-bold text-viking-darkblue hover:bg-viking-gold-soft">Avslør arketypen ✦</button>
        </motion.div>
      </div>
    );
  }

  // step === 'archetype'
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-viking-darkblue px-4 py-10 text-center text-viking-paper" data-testid="archetype-step">
      <div className="aurora pointer-events-none absolute inset-0 opacity-30 blur-2xl" />
      <div className="relative z-10 w-full max-w-2xl">
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="mb-3 font-inter text-xs uppercase tracking-[0.3em] text-viking-gold-soft/70"
        >Slik vil dere bli husket</motion.p>

        <motion.div
          initial={{ scale: 0.4, opacity: 0, filter: 'blur(8px)' }}
          animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
          transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 0.4 }}
          className="mb-5 text-[100px] drop-shadow-[0_0_28px_rgba(212,168,67,0.55)]"
        >
          {archetype.icon}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          className="mb-6 font-cinzel text-5xl font-bold text-viking-gold drop-shadow-[0_0_28px_rgba(212,168,67,0.5)] md:text-6xl"
          data-testid="archetype-title"
        >
          {archetype.title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}
          className="mx-auto mb-6 max-w-xl font-inter text-lg italic leading-relaxed text-viking-paper/95"
        >
          {archetype.blurb}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}
          className="mx-auto mb-6 max-w-xl rounded-md border-l-4 border-viking-gold-soft bg-viking-surface/40 px-4 py-2 text-left font-inter text-sm text-viking-paper/85"
        >
          {archetype.values}
        </motion.p>

        {archetype.honor && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.5 }}
            className="mx-auto mb-6 max-w-md rounded-lg border-2 border-viking-gold bg-viking-gold/15 px-4 py-3"
            data-testid="archetype-honor"
          >
            <p className="font-cinzel text-sm text-viking-gold">{archetype.honor.label}</p>
            <p className="mt-1 font-inter text-xs italic text-viking-paper/85">{archetype.honor.blurb}</p>
          </motion.div>
        )}

        {top && (
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.7 }}
            className="mb-8 font-cinzel text-viking-gold-soft"
          >
            {top.icon} Sterkest i {top.name} {top.level >= 3 ? '— Mester' : `(nivå ${top.level})`}
          </motion.p>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.9 }}>
          <button onClick={onClose} className="rounded-md border-2 border-viking-gold bg-viking-gold px-9 py-2.5 font-cinzel font-bold text-viking-darkblue hover:bg-viking-gold-soft">Tilbake til dashbordet</button>
          <p className="mt-4 font-inter text-xs italic text-viking-gold-soft/55">Mest poeng er ikke nødvendigvis det mest attraktive — arketypen er hovedbelønningen.</p>
        </motion.div>
      </div>
    </div>
  );
}
