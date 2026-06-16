/**
 * HintToast — kort engangs-forklaring som popper inn nederst når gruppa møter
 * et nytt konsept (tjener rykte for første gang, ser et låst sted, osv.).
 * Forsvinner av seg selv etter ~10 sek, eller når brukeren lukker den.
 */

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Hint } from '../../data/firstTimeHints';
import { AutoIcon } from '../decor/NorseIcon';

interface Props {
  hint: Hint | null;
  onDismiss: () => void;
}

export default function HintToast({ hint, onDismiss }: Props) {
  useEffect(() => {
    if (!hint) return;
    const id = window.setTimeout(onDismiss, 11000);
    return () => window.clearTimeout(id);
  }, [hint, onDismiss]);

  return (
    <AnimatePresence>
      {hint && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.35 }}
          className="pointer-events-auto fixed bottom-4 left-1/2 z-50 w-[min(94vw,440px)] -translate-x-1/2"
          data-testid="hint-toast"
        >
          <div className="rounded-lg border-2 border-viking-gold bg-viking-darkblue/95 p-4 shadow-2xl" style={{ boxShadow: '0 0 32px rgba(205,195,173,0.35)' }}>
            <div className="flex items-start gap-3">
              <AutoIcon name={hint.icon} size={30} className="mt-0.5 shrink-0 text-viking-gold" />
              <div className="flex-1">
                <p className="font-cinzel text-sm font-bold text-viking-gold">{hint.title}</p>
                <p className="mt-1 font-inter text-xs leading-relaxed text-viking-paper/90">{hint.body}</p>
              </div>
              <button
                onClick={onDismiss}
                aria-label="Lukk forklaring"
                className="shrink-0 rounded-full border border-viking-gold/40 px-2 font-mono text-xs text-viking-gold-soft hover:border-viking-gold hover:text-viking-gold"
              >
                ✕
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
