/**
 * GudenesProveOverlay.tsx
 * Full-skjerm avbrudd når læreren utløser «Gudenes prøve» (§3.4 / §8.5).
 * To faser:
 *  1) Utfordring: gruppa ser hvilken oppgave + hvilken ferdighet som teller, og gjør
 *     utfordringen fysisk i klasserommet. Skjermen venter på Odins dom.
 *  2) Dom: når læreren har kåret vinner, viser overlayen plasseringen til DENNE gruppa
 *     og hvor mye rykte de tjener — vinner får mest, ingen taper alt (§3.4).
 */

import { useEffect } from 'react';
import { motion } from 'motion/react';
import type { SkillKey } from '../../types';
import { skillTreeData } from '../../data';
import { playSound } from '../../lib/sound';
import type { TrialResult } from '../../lib/gameSync';

// Belønningsskala (rykte). Brukes også av leaderboardet via addReward.
export const TRIAL_REWARD = { winner: 5, runnerUp: 3, consolation: 1 } as const;

interface Props {
  navn: string;
  desc: string;
  skill: SkillKey;
  skillLevel: number;
  result: TrialResult | null;
  myGroupId: string;
  onClose: (reward: { rep: number }) => void;
}

export default function GudenesProveOverlay({ navn, desc, skill, skillLevel, result, myGroupId, onClose }: Props) {
  const branch = skillTreeData[skill];

  // Torden + varsel idet skjermen avbrytes (§10).
  useEffect(() => { playSound('trial'); }, []);

  // Når dommen kommer: en kort fanfare så elevene vet at det er over.
  useEffect(() => { if (result) playSound('fanfare'); }, [result]);

  // FASE 1 — utfordringen, venter på lærerens dom.
  if (!result) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-viking-darkblue/95 px-4 text-center text-viking-paper"
      >
        <motion.div
          initial={{ opacity: 0.9 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="pointer-events-none absolute inset-0 bg-viking-gold-soft"
        />
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, x: [0, -10, 9, -7, 6, 0] }}
          transition={{ duration: 0.7 }}
          className="relative text-7xl"
        >
          👁️
        </motion.div>
        <motion.h1
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.25, type: 'spring', stiffness: 200, damping: 12 }}
          className="relative mt-4 font-cinzel text-4xl font-bold tracking-widest text-viking-gold drop-shadow-lg md:text-5xl"
        >
          ⚡ GUDENES PRØVE ⚡
        </motion.h1>
        <p className="relative mt-2 font-inter italic text-viking-gold-soft">Gudene avbryter reisen — alle skip prøves samtidig!</p>

        <div className="relative mt-8 max-w-md rounded-lg border-2 border-viking-gold bg-viking-surface p-6">
          <h2 className="mb-2 font-cinzel text-2xl text-viking-gold">{navn}</h2>
          <p className="mb-4 font-inter text-viking-paper/90">{desc}</p>
          <p className="font-inter text-sm text-viking-paper/80">
            Ferdigheten som teller: <span className="font-cinzel" style={{ color: branch.color }}>{branch.icon} {branch.name}</span>
          </p>
          <p className="mt-1 font-cinzel text-lg text-viking-gold">
            Deres bonus: +{skillLevel}{skillLevel === 0 ? ' — dere er svake her!' : ''}
          </p>
        </div>

        <p className="relative mt-8 max-w-md font-cinzel text-lg text-viking-gold-soft">
          Gjør utfordringen — så avgjør læreren hvem som vant.
        </p>
        <motion.p
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          className="relative mt-3 font-inter text-sm italic text-viking-gold-soft/70"
        >
          ⏳ Venter på Odins dom …
        </motion.p>
      </motion.div>
    );
  }

  // FASE 2 — dommen.
  const isWinner = result.winnerId === myGroupId;
  const isRunnerUp = result.runnerUpId === myGroupId;
  const placement = isWinner ? 'winner' : isRunnerUp ? 'runnerUp' : 'consolation';
  const repReward = TRIAL_REWARD[placement];

  const headline =
    isWinner ? '🏆 Seier!' :
    isRunnerUp ? '🥈 Andreplass' :
    '🤝 Tapper innsats';

  const headlineColor =
    isWinner ? '#A9A08D' :
    isRunnerUp ? '#CDC3AD' :
    '#A09A8E';

  const message =
    isWinner ? 'Gudene smiler til skipet deres. Æren spres over alle hav.' :
    isRunnerUp ? 'Dere holdt mål. Skipet beholder ansikt.' :
    'Ingen skam i å tape mot bedre menn. Ryktet svinger lite.';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-viking-darkblue/95 px-4 text-center text-viking-paper"
      data-testid="trial-result"
    >
      <motion.h1
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 12 }}
        className="font-cinzel text-5xl font-bold drop-shadow-lg md:text-6xl"
        style={{ color: headlineColor }}
      >
        {headline}
      </motion.h1>

      <div className="mt-8 max-w-md rounded-lg border-2 border-viking-gold bg-viking-surface p-6">
        <p className="font-inter text-viking-paper/90">{message}</p>
        <p className="mt-4 font-cinzel text-3xl font-bold text-viking-gold">
          +{repReward} <span className="text-base font-normal text-viking-gold-soft">rykte</span>
        </p>
      </div>

      <div className="mt-6 max-w-md text-xs text-viking-gold-soft/70">
        <p>Vinner: <span className="font-cinzel text-viking-gold-soft">{result.winnerName}</span></p>
        {result.runnerUpName && <p>2. plass: <span className="font-cinzel text-viking-gold-soft">{result.runnerUpName}</span></p>}
      </div>

      <button
        onClick={() => onClose({ rep: repReward })}
        data-testid="trial-result-close"
        className="mt-8 rounded-md border-2 border-viking-gold bg-viking-gold px-9 py-3 font-saga text-lg font-bold text-viking-darkblue hover:bg-viking-gold-soft"
      >
        Krev belønning og seil videre
      </button>
    </motion.div>
  );
}
