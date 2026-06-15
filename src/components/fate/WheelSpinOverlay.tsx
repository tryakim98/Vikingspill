/**
 * WheelSpinOverlay — viser Skjebnehjulet på elevenes skjermer
 *
 * Når læreren spinner, kringkastes spinnet (felt-indeks) via Firebase. Hver elev
 * får dette overlayet, og hjulet snurrer synkront til samme felt som hos læreren.
 * Selve effekten (storm/gave/ragnarok/prøve/skjebnemøte) kommer som før via egne
 * overlays når hjulet lander — derfor ligger dette overlayet under dem (z-40 < z-50)
 * og lukker seg selv når snurringen er ferdig.
 */

import { AnimatePresence, motion } from 'motion/react';
import SkjebneHjul from '../teacher/SkjebneHjul';
import type { WheelSpin } from '../../lib/gameSync';

interface Props {
  spin: WheelSpin | null;
  onDone: () => void;
}

export default function WheelSpinOverlay({ spin, onDone }: Props) {
  return (
    <AnimatePresence>
      {spin && (
        <motion.div
          key={spin.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-viking-darkblue/95 px-4 text-center text-viking-paper"
          data-testid="wheel-spin-overlay"
        >
          <p className="mb-1 font-cinzel text-xs uppercase tracking-[0.35em] text-viking-gold-soft">
            Tor har talt
          </p>
          <h2 className="mb-5 font-cinzel text-2xl font-bold text-viking-gold sm:text-3xl">
            Nornene spinner skjebnehjulet
          </h2>
          <div className="w-full max-w-[420px]">
            <SkjebneHjul
              remoteSpin={{ id: spin.id, resultIndex: spin.resultIndex }}
              onRemoteDone={onDone}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
