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

interface QuestionCardProps {
  q: string;
  opts: string[];
  correct: number;
  feedback: string;
  answer: number | null;
  onAnswer: (i: number) => void;
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

export default function QuestionCard({ q, opts, correct, feedback, answer, onAnswer }: QuestionCardProps) {
  // Stabil per spørsmål: stokk bare når q/opts faktisk endres (nytt spørsmål),
  // ikke ved hver re-render. Bruker en streng-nøkkel så useMemo ikke trigges av
  // nye array-referanser med samme innhold.
  const memoKey = q + '' + opts.join('');
  const perm = useMemo(() => shufflePermutation(opts.length), [memoKey, opts.length]);

  const displayedOpts = perm.map((origIdx) => opts[origIdx]);
  const displayedCorrect = perm.indexOf(correct);
  const displayedAnswer = answer === null ? null : perm.indexOf(answer);

  return (
    <div className="text-left">
      <p className="mb-4 font-cinzel text-xl text-viking-paper">{q}</p>
      <div className="grid gap-2">
        {displayedOpts.map((opt, i) => {
          const answered = displayedAnswer !== null;
          let cls = 'border-viking-gold/30 hover:border-viking-gold/70';
          if (answered) {
            if (i === displayedCorrect) cls = 'border-viking-moss bg-viking-moss/25';
            else if (i === displayedAnswer) cls = 'border-viking-crimson bg-viking-crimson/25';
            else cls = 'border-viking-gold/15 opacity-60';
          }
          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => onAnswer(perm[i])}
              className={`rounded-md border-2 px-4 py-2.5 text-left font-inter transition-all ${cls}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {answer !== null && (
        <p className="mt-3 rounded-md bg-viking-darkblue/60 p-3 font-inter text-sm text-viking-gold-soft">{feedback}</p>
      )}
    </div>
  );
}
