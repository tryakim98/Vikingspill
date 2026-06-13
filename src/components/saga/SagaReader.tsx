/**
 * SagaReader.tsx
 * Vikingestetisk fullskjerm-leser av en eller flere gruppers sagaer. Brukes:
 *  - i dashboardet til at gruppen kan lese sin egen reisefortelling
 *  - i lærerkonsollen til etterarbeid og vurdering
 * Hver oppføring er gruppens valg på en destinasjon + begrunnelsen.
 */

import { motion } from 'motion/react';
import type { SagaEntry } from '../../types';

interface SagaGroup {
  shipName: string;
  shipSymbol?: string;
  entries: SagaEntry[];
}

interface Props {
  groups: SagaGroup[];
  title?: string;
  onClose: () => void;
}

export default function SagaReader({ groups, title = 'Sagaen', onClose }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-viking-darkblue to-viking-surface px-4 py-6 text-viking-paper" data-testid="saga-reader">
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 flex items-center justify-between border-b-2 border-viking-gold/40 pb-3">
          <h1 className="font-cinzel text-3xl font-bold text-viking-gold">📜 {title}</h1>
          <button onClick={onClose} className="rounded border-2 border-viking-gold/50 px-3 py-1 font-cinzel text-sm text-viking-gold-soft hover:border-viking-gold">✕ Lukk</button>
        </div>

        {groups.length === 0 ? (
          <p className="font-inter italic text-viking-paper/60">Ingen sagaer skrevet ennå.</p>
        ) : groups.map((g, gi) => (
          <motion.section
            key={`${g.shipName}-${gi}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: gi * 0.05, duration: 0.4 }}
            className="mb-8"
            data-testid={`saga-of-${g.shipName}`}
          >
            <div className="mb-3 flex items-baseline gap-3 border-b border-viking-gold/30 pb-1.5">
              <span className="font-cinzel text-2xl text-viking-gold">{g.shipName}</span>
              <span className="font-mono text-xs text-viking-gold-soft/70">{g.entries.length} {g.entries.length === 1 ? 'kapittel' : 'kapitler'}</span>
            </div>
            {g.entries.length === 0 ? (
              <p className="font-inter italic text-viking-paper/55">Skipet har enda ikke skrevet noe i sagaen.</p>
            ) : (
              <ol className="space-y-3">
                {g.entries.map((e, i) => (
                  <li key={`${e.destId}-${e.at}-${i}`}>
                    <div
                      className="rounded-lg border-4 border-viking-gold/50 p-4 shadow-[0_0_18px_rgba(212,168,67,0.15)]"
                      style={{
                        background: 'linear-gradient(135deg, #FDFBF6 0%, #F4EDDC 100%)',
                        backgroundImage: 'repeating-linear-gradient(0deg, transparent 0 24px, rgba(160,82,45,0.06) 24px 25px)',
                      }}
                    >
                      <p className="font-cinzel text-xs uppercase tracking-widest text-viking-rust">Kapittel {i + 1} — {e.destName}</p>
                      <p className="mt-1 font-cinzel text-lg text-viking-darkblue">«{e.choiceTitle}»</p>
                      <p
                        className="mt-2 whitespace-pre-wrap text-base leading-relaxed text-viking-darkblue"
                        style={{ fontFamily: 'serif' }}
                        data-testid="saga-reason"
                      >
                        {e.reason}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </motion.section>
        ))}

        <p className="mt-6 text-center font-cinzel text-xs italic text-viking-gold-soft/60">Sagaen huskes — selv lenge etter skipet ikke lenger seiler. ⚓</p>
      </div>
    </div>
  );
}
