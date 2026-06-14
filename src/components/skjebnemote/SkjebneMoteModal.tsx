/**
 * SKJEBNEMØTE-MODAL
 *
 * Stemningsfullt avbrekk som vises midt i seilasen. Bare høvdingen kan velge;
 * de andre medlemmene ser scenen og venter. Etter valget vises utfallsteksten,
 * deretter lukker høvdingen og seilasen fortsetter til encounter.
 *
 * Noen valg er terningavhengige: høvdingen sender med et RollResult, og modalen
 * viser kastet før utfallet.
 */

import { motion, AnimatePresence } from 'motion/react';
import type { SkjebneMote, SkjebneMoteChoice, SkjebneEffects } from '../../data/skjebnemoter';
import { DEFAULT_ROLL_THRESHOLD } from '../../data/skjebnemoter';

interface Props {
  quest: SkjebneMote;
  isChief: boolean;
  selectedChoiceId: string | undefined;
  rollResult: { roll: number; bonus: number; total: number; won: boolean } | undefined;
  onChoose: (choice: SkjebneMoteChoice) => void;
  onDismiss: () => void;
}

const SKILL_LABEL: Record<string, string> = {
  språk: 'Språk', sjømannskap: 'Sjømannskap', krigskunst: 'Krigskunst',
  diplomati: 'Diplomati', tro: 'Tro',
};

function EffectChips({ effects }: { effects?: SkjebneEffects }) {
  if (!effects) return null;
  const items: { key: string; label: string; v: number }[] = [];
  if (effects.culturalUnderstanding) items.push({ key: 'und', label: 'Kulturforståelse', v: effects.culturalUnderstanding });
  if (effects.tradeGain) items.push({ key: 'trade', label: 'Handel', v: effects.tradeGain });
  if (effects.reputation) items.push({ key: 'rep', label: 'Rykte', v: effects.reputation });
  if (effects.skill) items.push({ key: 'skill', label: SKILL_LABEL[effects.skill.key] ?? effects.skill.key, v: effects.skill.delta });
  if (items.length === 0) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-2" data-testid="skjebnemote-effects">
      {items.map((it) => {
        const sign = it.v > 0 ? '+' : '';
        return (
          <li key={it.key} className="rounded-full border border-viking-gold/40 bg-viking-darkblue/60 px-3 py-1 font-cinzel text-xs text-viking-gold-soft">
            {it.label} {sign}{it.v}
          </li>
        );
      })}
    </ul>
  );
}

export function SkjebneMoteModal({ quest, isChief, selectedChoiceId, rollResult, onChoose, onDismiss }: Props) {
  const chosen = quest.choices.find((c) => c.id === selectedChoiceId);
  const showOutcome = !!chosen;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-viking-darkblue/90 p-4"
        data-testid="skjebnemote-modal"
      >
        <motion.div
          initial={{ y: 30, scale: 0.95 }}
          animate={{ y: 0, scale: 1 }}
          transition={{ type: 'spring', damping: 18 }}
          className="max-w-lg rounded-lg border-2 border-viking-gold/60 bg-viking-surface p-6 shadow-2xl"
        >
          <p className="mb-1 font-cinzel text-xs uppercase tracking-widest text-viking-gold/70">Skjebnemøte</p>
          <h2 className="mb-4 font-cinzel text-2xl text-viking-gold" data-testid="skjebnemote-title">{quest.title}</h2>

          <p
            className="mb-5 whitespace-pre-line border-l-4 border-viking-gold/50 pl-4 font-inter italic leading-relaxed text-viking-paper/90"
            data-testid="skjebnemote-scene"
          >
            {quest.scene}
          </p>

          {!showOutcome && (
            <div className="space-y-2" data-testid="skjebnemote-choices">
              {quest.choices.map((c) => {
                const t = c.roll?.threshold ?? DEFAULT_ROLL_THRESHOLD;
                const hint = c.roll
                  ? c.roll.skill
                    ? `🎲 Terning + ${SKILL_LABEL[c.roll.skill] ?? c.roll.skill} (≥ ${t})`
                    : `🎲 Terning (≥ ${t})`
                  : null;
                return (
                  <button
                    key={c.id}
                    onClick={() => isChief && onChoose(c)}
                    disabled={!isChief}
                    data-testid={`skjebnemote-choice-${c.id}`}
                    className="block w-full rounded-md border border-viking-gold/40 bg-viking-darkblue/60 px-4 py-3 text-left font-inter text-sm text-viking-paper transition hover:border-viking-gold hover:bg-viking-darkblue/80 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="block">{c.label}</span>
                    {hint && <span className="mt-1 block font-cinzel text-xs text-viking-gold-soft/80">{hint}</span>}
                  </button>
                );
              })}
              {!isChief && (
                <p className="pt-2 text-center font-cinzel text-xs italic text-viking-gold-soft/70">
                  Høvdingen velger for skipet…
                </p>
              )}
            </div>
          )}

          {showOutcome && chosen && (
            <div data-testid="skjebnemote-outcome">
              {/* Terningkast vises hvis valget er terningavhengig */}
              {chosen.roll && rollResult && (
                <div
                  className={`mb-3 flex items-center justify-between rounded-md border px-4 py-3 ${rollResult.won ? 'border-viking-gold/60 bg-viking-gold/10' : 'border-viking-crimson/60 bg-viking-crimson/10'}`}
                  data-testid="skjebnemote-roll"
                >
                  <span className="font-cinzel text-sm text-viking-gold-soft">
                    🎲 {rollResult.roll}{rollResult.bonus ? ` + ${rollResult.bonus}` : ''} = <strong className="text-viking-gold">{rollResult.total}</strong>
                  </span>
                  <span className={`font-cinzel text-sm ${rollResult.won ? 'text-viking-gold' : 'text-viking-crimson'}`}>
                    {rollResult.won ? 'Seier' : 'Tap'}
                  </span>
                </div>
              )}

              <div className="mb-4 rounded-md border border-viking-gold/40 bg-viking-darkblue/40 p-4">
                <p className="mb-2 font-cinzel text-xs uppercase tracking-widest text-viking-gold-soft">Utfall</p>
                <p className="whitespace-pre-line font-inter italic leading-relaxed text-viking-paper/90">
                  {chosen.roll
                    ? (rollResult?.won ? chosen.roll.win.outcome : chosen.roll.lose.outcome)
                    : chosen.outcome}
                </p>
                <EffectChips effects={chosen.roll
                  ? (rollResult?.won ? chosen.roll.win.effects : chosen.roll.lose.effects)
                  : chosen.effects}
                />
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
