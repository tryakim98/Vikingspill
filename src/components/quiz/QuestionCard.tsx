/**
 * QuestionCard.tsx
 * Gjenbrukbart flervalgs-spørsmål med fasit-farging og feedback etter svar.
 * Brukes både i stedsquizen (EncounterFlow) og i ferdighetstre-quizen (SkillTrial).
 */

interface QuestionCardProps {
  q: string;
  opts: string[];
  correct: number;
  feedback: string;
  answer: number | null;
  onAnswer: (i: number) => void;
}

export default function QuestionCard({ q, opts, correct, feedback, answer, onAnswer }: QuestionCardProps) {
  return (
    <div className="text-left">
      <p className="mb-4 font-cinzel text-xl text-viking-paper">{q}</p>
      <div className="grid gap-2">
        {opts.map((opt, i) => {
          const answered = answer !== null;
          let cls = 'border-viking-gold/30 hover:border-viking-gold/70';
          if (answered) {
            if (i === correct) cls = 'border-viking-moss bg-viking-moss/25';
            else if (i === answer) cls = 'border-viking-crimson bg-viking-crimson/25';
            else cls = 'border-viking-gold/15 opacity-60';
          }
          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => onAnswer(i)}
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
