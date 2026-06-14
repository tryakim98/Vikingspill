/**
 * DiceRoll.tsx
 * Animert terningkast (§10). Terningen «tumler» (motion: rotasjon + sprett) mens flatene
 * bytter raskt, lander så på den faktiske terningverdien (raw 1–6) og kaller onDone.
 * Lyden «terning mot trebord» spilles av kalleren idet kastet starter.
 */

import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

// 3x3-rutenett (indeks 0–8) → hvilke ruter som har øyne for hver terningverdi.
const FACE_CELLS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

const WOOD = 'radial-gradient(circle at 50% 40%, #2a1c10 0%, #1a1208 60%, #0E0A06 100%)';

export default function DiceRoll({ value, onDone }: { value: number; onDone: () => void }) {
  const [face, setFace] = useState(() => 1 + Math.floor(Math.random() * 6));
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  useEffect(() => {
    const cycle = setInterval(() => setFace(1 + Math.floor(Math.random() * 6)), 100);
    const settle = setTimeout(() => { clearInterval(cycle); setFace(value); }, 1100);
    const done = setTimeout(() => onDoneRef.current(), 1700);
    return () => { clearInterval(cycle); clearTimeout(settle); clearTimeout(done); };
  }, [value]);

  const cells = FACE_CELLS[face] ?? [];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center" style={{ backgroundImage: WOOD }}>
      <motion.div
        initial={{ rotate: 0, scale: 0.7, y: -40 }}
        animate={{ rotate: [0, 220, 410, 600, 720], scale: [0.7, 1.15, 0.92, 1.05, 1], y: [-40, 0, -14, 0, 0] }}
        transition={{ duration: 1.1, ease: 'easeOut', times: [0, 0.3, 0.55, 0.8, 1] }}
        className="grid h-28 w-28 grid-cols-3 grid-rows-3 gap-1.5 rounded-2xl border-4 border-viking-gold bg-viking-paper p-3 shadow-[0_12px_30px_rgba(0,0,0,0.6)]"
      >
        {Array.from({ length: 9 }).map((_, i) => (
          <span key={i} className="flex items-center justify-center">
            {cells.includes(i) && <span className="h-3.5 w-3.5 rounded-full bg-viking-darkblue" />}
          </span>
        ))}
      </motion.div>
      <p className="mt-8 font-cinzel text-xl tracking-[0.25em] text-viking-gold-soft">Terningen ruller …</p>
    </div>
  );
}
