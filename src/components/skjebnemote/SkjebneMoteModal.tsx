/**
 * SKJEBNEMØTE-MODAL
 *
 * Stemningsfullt avbrekk som vises midt i seilasen. Bare høvdingen kan velge;
 * de andre medlemmene ser scenen og venter. Etter valget vises utfallsteksten,
 * deretter lukker høvdingen og seilasen fortsetter til encounter.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { SkjebneMote, SkjebneMoteChoice } from '../../data/skjebnemoter';

interface Props {
  quest: SkjebneMote;
  isChief: boolean;
  selectedChoiceId: string | undefined;
  onChoose: (choice: SkjebneMoteChoice) => void;
  onDismiss: () => void;
}

export function SkjebneMoteModal({ quest, isChief, selectedChoiceId, onChoose, onDismiss }: Props) {
  const [showOutcome, setShowOutcome] = useState(!!selectedChoiceId);
  const chosen = quest.choices.find((c) => c.id === selectedChoiceId);

  // Når høvdingen velger lokalt
  const handlePick = (choice: SkjebneMoteChoice) => {
    if (!isChief) return;
    setShowOutcome(true);
    onChoose(choice);
  };

  // Hvis et valg allerede er satt (synket fra høvding), vis utfall
  if (selectedChoiceId && !showOutcome) setShowOutcome(true);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-viking-darkblue/90 p-4 backdrop-blur-sm"
        data-testid="skjebnemote-modal"
      >
        <motion.div
          initial={{ y: 30, scale: 0.95 }}
          animate={{ y: 0, scale: 1 }}
          transition={{ type: 'spring', damping: 18 }}
          className="max-w-lg rounded-lg border-2 border-viking-gold/60 bg-viking-surface p-6 shadow-2xl"
        >
          <p className="mb-1 font-cinzel text-xs uppercase tracking-widest text-viking-gold/70">
            Skjebnemøte
          </p>
          <h2 className="mb-4 font-cinzel text-2xl text-viking-gold" data-testid="skjebnemote-title">
            {quest.title}
          </h2>

          <p
            className="mb-5 whitespace-pre-line border-l-4 border-viking-gold/50 pl-4 font-inter italic leading-relaxed text-viking-paper/90"
            data-testid="skjebnemote-scene"
          >
            {quest.scene}
          </p>

          {!showOutcome && (
            <div className="space-y-2" data-testid="skjebnemote-choices">
              {quest.choices.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handlePick(c)}
                  disabled={!isChief}
                  data-testid={`skjebnemote-choice-${c.id}`}
                  className="block w-full rounded-md border border-viking-gold/40 bg-viking-darkblue/60 px-4 py-3 text-left font-inter text-sm text-viking-paper transition hover:border-viking-gold hover:bg-viking-darkblue/80 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {c.label}
                </button>
              ))}
              {!isChief && (
                <p className="pt-2 text-center font-cinzel text-xs italic text-viking-gold-soft/70">
                  Høvdingen velger for skipet…
                </p>
              )}
            </div>
          )}

          {showOutcome && chosen && (
            <div data-testid="skjebnemote-outcome">
              <div className="mb-4 rounded-md border border-viking-gold/40 bg-viking-darkblue/40 p-4">
                <p className="mb-2 font-cinzel text-xs uppercase tracking-widest text-viking-gold-soft">
                  Utfall
                </p>
                <p className="whitespace-pre-line font-inter italic leading-relaxed text-viking-paper/90">
                  {chosen.outcome}
                </p>
                {chosen.effects && Object.keys(chosen.effects).length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2" data-testid="skjebnemote-effects">
                    {Object.entries(chosen.effects).map(([k, v]) => {
                      const label =
                        k === 'culturalUnderstanding' ? 'Kulturforståelse' :
                        k === 'tradeGain' ? 'Handel' : 'Rykte';
                      const sign = (v as number) > 0 ? '+' : '';
                      return (
                        <li
                          key={k}
                          className="rounded-full border border-viking-gold/40 bg-viking-darkblue/60 px-3 py-1 font-cinzel text-xs text-viking-gold-soft"
                        >
                          {label} {sign}{v}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              {isChief ? (
                <button
                  onClick={onDismiss}
                  data-testid="skjebnemote-dismiss"
                  className="w-full rounded-md border-2 border-viking-gold bg-viking-gold/20 px-4 py-2 font-cinzel text-sm text-viking-gold transition hover:bg-viking-gold/30"
                >
                  Seil videre →
                </button>
              ) : (
                <p className="text-center font-cinzel text-xs italic text-viking-gold-soft/70">
                  Høvdingen leder skipet videre…
                </p>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
