/**
 * FateCardOverlay.tsx
 * Full-skjerm avbrudd når læreren utløser et skjebne-kort (§8.4). Viser kortet (likt
 * for alle), hvem som rammes, og om DENNE gruppa rammes. Effekten anvendes først når
 * gruppa godtar skjebnen.
 */

import { useEffect } from 'react';
import type { FateEvent } from '../../lib/gameSync';
import { playSound } from '../../lib/sound';

interface Props {
  event: FateEvent;
  affected: boolean;
  onDone: () => void;
}

export default function FateCardOverlay({ event, affected, onDone }: Props) {
  // Torden idet skjebnen slår til (§10) — musikken dempes samtidig (styres i GameDashboard).
  useEffect(() => { playSound('thunder'); }, []);
  const whoLabel = event.targetMode === 'group' ? event.targetName : event.conditionLabel;
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-viking-darkblue/95 px-4 text-center text-viking-paper">
      <p className="font-cinzel text-sm uppercase tracking-[0.3em] text-viking-gold-soft/70">Skjebnen har talt</p>
      <div className="mt-3 text-7xl">{event.icon}</div>
      <h1 className="mt-3 font-cinzel text-4xl font-bold text-viking-gold drop-shadow-lg md:text-5xl">{event.title}</h1>
      <p className="mt-2 max-w-md font-inter italic text-viking-paper/90">{event.text}</p>
      <p className="mt-4 font-inter text-sm text-viking-gold-soft">Rammer: {whoLabel}</p>

      <div className={`mt-6 rounded-lg border-2 p-5 ${affected ? 'border-viking-crimson bg-viking-crimson/15' : 'border-viking-gold/30'}`}>
        {affected ? (
          <p className="font-cinzel text-xl text-viking-gold">Dette rammer DERE: {event.effectLabel}</p>
        ) : (
          <p className="font-inter text-viking-paper/70">Dere slapp unna denne gang.</p>
        )}
      </div>

      <button
        onClick={onDone}
        className="mt-8 rounded-md border-2 border-viking-gold bg-viking-gold px-9 py-3 font-cinzel text-lg font-bold text-viking-darkblue hover:bg-viking-gold-soft"
      >
        Godta skjebnen
      </button>
    </div>
  );
}
