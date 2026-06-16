/**
 * LeadConfetti.tsx
 * Kort konfetti-fest på lærerskjermen (§8.2) når en ny gruppe tar ledelsen.
 * Monteres med en fersk `key` per lederskifte og fjerner seg selv etter ~2 s.
 * Rent dekorativt: pointer-events-none, respekterer prefers-reduced-motion via
 * korte, enkle baner.
 */

import { useEffect } from 'react';
import { motion } from 'motion/react';

const COLORS = ['#D4A843', '#E8C97A', '#2B6B6B', '#5B7553', '#6B3FA0', '#8B2929', '#FDFBF6'];

interface Props {
  onDone?: () => void;
}

export default function LeadConfetti({ onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(() => onDone?.(), 2200);
    return () => clearTimeout(t);
  }, [onDone]);

  const pieces = Array.from({ length: 28 }, (_, i) => ({
    left: (i * 37) % 100,                 // spredt jevnt nok uten Math.random-avhengighet
    delay: (i % 7) * 0.06,
    color: COLORS[i % COLORS.length],
    rotate: (i * 53) % 360,
    drift: ((i % 5) - 2) * 12,
  }));

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[80] overflow-hidden" data-testid="lead-confetti">
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          initial={{ y: -30, x: 0, opacity: 1, rotate: p.rotate }}
          animate={{ y: '105vh', x: p.drift, opacity: [1, 1, 0.9, 0], rotate: p.rotate + 220 }}
          transition={{ duration: 2, delay: p.delay, ease: 'easeIn' }}
          style={{ position: 'absolute', top: 0, left: `${p.left}%`, width: 9, height: 13, backgroundColor: p.color, borderRadius: 1 }}
        />
      ))}
    </div>
  );
}
