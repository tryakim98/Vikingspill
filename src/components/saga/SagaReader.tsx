/**
 * SagaReader.tsx
 * Vikingestetisk fullskjerm-leser av en eller flere gruppers sagaer. Brukes:
 *  - i dashboardet til at gruppen kan lese sin egen reisefortelling
 *  - i lærerkonsollen til etterarbeid og vurdering
 * Hver oppføring er gruppens valg på en destinasjon + begrunnelsen.
 */

import { motion } from 'motion/react';
import type { SagaEntry } from '../../types';
import MaterialPanel from '../decor/MaterialPanel';
import Icon from '../decor/Icon';

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
    <div className="min-h-screen viking-screen px-4 py-6 text-viking-paper" data-testid="saga-reader">
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 flex items-center justify-between border-b-2 border-viking-gold/40 pb-3">
          <h1 className="inline-flex items-center gap-2 font-cinzel text-3xl font-bold text-viking-gold"><Icon name="scroll" size={28} /> {title}</h1>
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
                    <MaterialPanel material="pergament" className="p-4">
                      <p className="font-cinzel text-xs uppercase tracking-widest text-viking-rust">Kapittel {i + 1} — {e.destName}</p>
                      <p className="mt-1 font-cinzel text-lg text-viking-darkblue">«{e.choiceTitle}»</p>
                      {e.reason && (
                        <p
                          className="mt-2 whitespace-pre-wrap text-base leading-relaxed text-viking-darkblue"
                          style={{ fontFamily: 'serif' }}
                          data-testid="saga-reason"
                        >
                          {e.reason}
                        </p>
                      )}
                      {(e.vikingPerspective || e.otherPerspective) && (
                        <div className="mt-3 space-y-1.5 border-t border-viking-rust/30 pt-2" data-testid="saga-perspectives">
                          {e.vikingPerspective && (
                            <p className="text-sm text-viking-darkblue" style={{ fontFamily: 'serif' }}>
                              <span className="inline-flex items-center gap-1 font-cinzel text-xs text-viking-rust"><Icon name="axe" size={13} /> Vikingenes side:</span> {e.vikingPerspective}
                            </p>
                          )}
                          {e.otherPerspective && (
                            <p className="text-sm text-viking-darkblue" style={{ fontFamily: 'serif' }}>
                              <span className="inline-flex items-center gap-1 font-cinzel text-xs text-viking-rust"><Icon name="eye" size={13} /> {e.otherLabel ?? 'De andres'} side:</span> {e.otherPerspective}
                            </p>
                          )}
                        </div>
                      )}
                      {e.keyCardText && (
                        <div className="mt-3 border-t border-viking-rust/30 pt-2" data-testid="saga-keycard">
                          <p className="text-sm text-viking-darkblue" style={{ fontFamily: 'serif' }}>
                            <span className="inline-flex items-center gap-1 font-cinzel text-xs text-viking-rust"><Icon name="book" size={13} /> Nøkkelinfo{e.keyCardHolderLabel ? ` (${e.keyCardHolderLabel})` : ''}:</span> {e.keyCardText}
                          </p>
                        </div>
                      )}
                      {e.bridgeReflection && (
                        <div className="mt-3 border-t border-viking-rust/30 pt-2" data-testid="saga-bridge">
                          <p className="text-sm text-viking-darkblue" style={{ fontFamily: 'serif' }}>
                            <span className="inline-flex items-center gap-1 font-cinzel text-xs text-viking-rust"><Icon name="bridge" size={13} /> Bro til i dag{e.bridgeTopic ? ` (${e.bridgeTopic})` : ''}:</span> {e.bridgeReflection}
                          </p>
                        </div>
                      )}
                    </MaterialPanel>
                  </li>
                ))}
              </ol>
            )}
          </motion.section>
        ))}

        <p className="mt-6 inline-flex w-full items-center justify-center gap-1.5 text-center font-cinzel text-xs italic text-viking-gold-soft/60">Sagaen huskes — selv lenge etter skipet ikke lenger seiler. <Icon name="anchor" size={13} /></p>
      </div>
    </div>
  );
}
