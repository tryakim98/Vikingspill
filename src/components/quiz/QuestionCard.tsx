/**
 * QuestionCard.tsx
 * Gjenbrukbart flervalgs-spørsmål med fasit-farging og feedback etter svar.
 * Brukes både i stedsquizen (EncounterFlow) og i ferdighetstre-quizen (SkillTrial).
 *
 * Alternativene stokkes om tilfeldig hver gang spørsmålet vises, så elevene ikke
 * kan gjette på posisjon. Stokkingen gjøres internt: kalleren leverer fortsatt
 * original `correct`-indeks fra data og får original-indeks tilbake i `onAnswer`.
 */

import { useMemo } from 'react';
import { playSound } from '../../lib/sound';

interface QuestionCardProps {
  q: string;
  opts: string[];
  correct: number;
  feedback: string;
  answer: number | null;
  onAnswer: (i: number) => void;
  /** Tilpasser tekst-/kantfarger til underlaget. 'parchment' = mørk blekk på lys
   *  pergament (stedsquiz/kulturmøte = kunnskap); 'dark' = lys tekst på mørkt
   *  materiale (ferdighetsprøver = jern). */
  tone?: 'dark' | 'parchment';
}

/** Fisher–Yates: returner en permutasjon der perm[visIdx] = originalIdx. */
function shufflePermutation(n: number): number[] {
  const perm = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  return perm;
}

export default function QuestionCard({ q, opts, correct, feedback, answer, onAnswer, tone = 'dark' }: QuestionCardProps) {
  const parchment = tone === 'parchment';
  // Stabil per spørsmål: stokk bare når q/opts faktisk endres (nytt spørsmål),
  // ikke ved hver re-render. Bruker en streng-nøkkel så useMemo ikke trigges av
  // nye array-referanser med samme innhold.
  const memoKey = q + '' + opts.join('');
  const perm = useMemo(() => shufflePermutation(opts.length), [memoKey, opts.length]);

  const displayedOpts = perm.map((origIdx) => opts[origIdx]);
  const displayedCorrect = perm.indexOf(correct);
  const displayedAnswer = answer === null ? null : perm.indexOf(answer);

  const base = parchment
    ? 'border-viking-rust/40 text-viking-darkblue hover:border-viking-rust'
    : 'border-viking-gold/30 text-viking-paper hover:border-viking-gold/70';
  return (
    <div className="text-left">
      <p className={`mb-4 font-cinzel text-xl ${parchment ? 'text-viking-darkblue' : 'text-viking-paper'}`}>{q}</p>
      <div className="grid gap-2">
        {displayedOpts.map((opt, i) => {
          const answered = displayedAnswer !== null;
          let cls = base;
          if (answered) {
            if (i === displayedCorrect) cls = parchment ? 'border-viking-moss bg-viking-moss/30 text-viking-darkblue' : 'border-viking-moss bg-viking-moss/25 text-viking-paper';
            else if (i === displayedAnswer) cls = parchment ? 'border-viking-crimson bg-viking-crimson/20 text-viking-darkblue' : 'border-viking-crimson bg-viking-crimson/25 text-viking-paper';
            else cls = parchment ? 'border-viking-rust/20 text-viking-darkblue/55 opacity-70' : 'border-viking-gold/15 text-viking-paper opacity-60';
          }
          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => { playSound(perm[i] === correct ? 'correct' : 'wrong'); onAnswer(perm[i]); }}
              className={`rounded-md border-2 px-4 py-2.5 text-left font-inter transition-all ${cls}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {answer !== null && (
        <p className={`mt-3 rounded-md p-3 font-inter text-sm ${parchment ? 'border border-viking-rust/30 bg-viking-paper/70 text-viking-darkblue' : 'bg-viking-darkblue/60 text-viking-gold-soft'}`}>{feedback}</p>
      )}
    </div>
  );
}
