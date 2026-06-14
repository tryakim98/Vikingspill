/**
 * TideTurnOverlay.tsx
 * Full-skjerm avbrudd når tidevannet snur (§6.5). Alle grupper ser det; de som ikke
 * rakk å besøke alle stedene i kapitlet mister handelspoeng «til stormen», resten nådde
 * havn i tide.
 */

import { useEffect } from 'react';
import { playSound } from '../../lib/sound';

interface Props {
  chapterNavn: string;
  affected: boolean;
  penalty: number;
  onDone: () => void;
}

export default function TideTurnOverlay({ chapterNavn, affected, penalty, onDone }: Props) {
  useEffect(() => { playSound('storm'); }, []); // stormen reiser seg når tidevannet snur (§6.5)
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-viking-darkblue/95 px-4 text-center text-viking-paper">
      <p className="font-cinzel text-sm uppercase tracking-[0.3em] text-viking-gold-soft/70">Tidevannet snur</p>
      <div className="mt-3 animate-bob text-7xl">🌊</div>
      <h1 className="mt-3 font-cinzel text-4xl font-bold text-viking-gold drop-shadow-lg md:text-5xl">Stormen kommer</h1>
      <p className="mt-2 max-w-md font-inter italic text-viking-paper/90">
        Kapitlet «{chapterNavn}» er over — havet reiser seg og skip som ennå er på åpent vann tas av stormen.
      </p>

      <div className={`mt-6 rounded-lg border-2 p-5 ${affected ? 'border-viking-crimson bg-viking-crimson/15' : 'border-viking-moss/60 bg-viking-moss/15'}`}>
        {affected ? (
          <p className="font-cinzel text-xl text-viking-gold">Dere rakk ikke i havn: −{penalty} handelsutbytte</p>
        ) : (
          <p className="font-cinzel text-xl text-viking-gold">Dere nådde havn i tide — stormen rørte dere ikke.</p>
        )}
      </div>

      <button
        onClick={onDone}
        className="mt-8 rounded-md border-2 border-viking-gold bg-viking-gold px-9 py-3 font-cinzel text-lg font-bold text-viking-darkblue hover:bg-viking-gold-soft"
      >
        Seil videre
      </button>
    </div>
  );
}
