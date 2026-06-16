/**
 * SummonOverlay.tsx
 * Vises på ALLE en gruppes enheter når læreren kaller dem hit (§8 klasseromsstyring).
 * Tar over skjermen til en elev kvitterer «Vi er på vei!», så beskjeden ikke overses
 * midt i et kulturmøte. Varselet blir stående hos læreren til hen fjerner det.
 */

import { useEffect } from 'react';
import { motion } from 'motion/react';
import Icon from '../decor/Icon';
import { playSound } from '../../lib/sound';

interface Props {
  message: string;
  onAck: () => void;
}

export default function SummonOverlay({ message, onAck }: Props) {
  useEffect(() => { playSound('summon'); }, []);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-viking-darkblue/95 px-4 text-center" data-testid="summon-overlay">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14 }}
        className="w-full max-w-md rounded-lg border-4 border-viking-gold bg-viking-surface p-8"
        style={{ boxShadow: '0 0 60px rgba(212,168,67,0.45)' }}
      >
        <motion.div
          animate={{ rotate: [-8, 8, -8] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-4 flex justify-center text-viking-gold"
        >
          <Icon name="bolt" size={64} />
        </motion.div>
        <p className="font-cinzel text-xs uppercase tracking-[0.3em] text-viking-gold-soft/80">Bud fra Åsgard</p>
        <h1 className="mt-2 mb-3 font-saga text-3xl font-bold text-viking-gold">Læreren kaller dere hit</h1>
        <p className="mb-7 font-inter text-lg italic leading-relaxed text-viking-paper/90">«{message}»</p>
        <button
          onClick={onAck}
          data-testid="summon-ack"
          className="rounded-md border-2 border-viking-gold bg-viking-gold px-9 py-3 font-saga text-lg font-bold text-viking-darkblue hover:bg-viking-gold-soft"
        >
          <span className="inline-flex items-center gap-2"><Icon name="sail" size={18} /> Vi er på vei!</span>
        </button>
      </motion.div>
    </div>
  );
}
