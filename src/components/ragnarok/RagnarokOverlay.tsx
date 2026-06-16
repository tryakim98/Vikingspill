/**
 * RagnarokOverlay.tsx
 * Full-skjerm avbrudd når læreren slipper Ragnarok løs (§6.3). Catch-up-mekanikk: ALLE
 * mister halve handelspoeng («gudene straffer hybris»). Rammer likt, så ledende grupper
 * mister mest og feltet jevnes ut.
 */

import Icon from '../decor/Icon';

interface Props {
  lost: number;
  onDone: () => void;
}

export default function RagnarokOverlay({ lost, onDone }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-viking-crimson/30 px-4 text-center text-viking-paper">
      <div className="absolute inset-0 bg-viking-darkblue/85" />
      <div className="relative flex flex-col items-center">
        <p className="font-cinzel text-sm uppercase tracking-[0.3em] text-viking-crimson">Gudene straffer hybris</p>
        <div className="mt-3 flex animate-pulse items-center gap-3 text-viking-gold"><Icon name="bolt" size={56} /><Icon name="wolf" size={64} /><Icon name="bolt" size={56} /></div>
        <h1 className="mt-3 font-cinzel text-5xl font-bold tracking-widest text-viking-gold drop-shadow-lg md:text-6xl">RAGNAROK</h1>
        <p className="mt-2 max-w-md font-inter italic text-viking-paper/90">
          Avstanden mellom skipene ble for stor. Gudene jevner feltet — alle mister halve handelspoeng.
        </p>

        <div className="mt-6 rounded-lg border-2 border-viking-crimson bg-viking-crimson/20 p-5">
          {lost > 0 ? (
            <p className="font-cinzel text-xl text-viking-gold">Dere mister {lost} handelsutbytte</p>
          ) : (
            <p className="font-cinzel text-xl text-viking-gold">Dere hadde lite å miste denne gang.</p>
          )}
        </div>

        <button
          onClick={onDone}
          className="mt-8 rounded-md border-2 border-viking-gold bg-viking-gold px-9 py-3 font-saga text-lg font-bold text-viking-darkblue hover:bg-viking-gold-soft"
        >
          Bøy hodet for skjebnen
        </button>
      </div>
    </div>
  );
}
