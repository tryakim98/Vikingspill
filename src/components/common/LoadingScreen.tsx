/**
 * LoadingScreen.tsx
 * Viking-tema lasteskjerm (§13). Brukes der vi venter på localStorage/Firebase i stedet
 * for å vise en blank skjerm et øyeblikk.
 */

import VikingShip from '../ship/VikingShip';

export default function LoadingScreen({ text = 'Setter seil …' }: { text?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 viking-screen text-viking-gold">
      <VikingShip color="#CDC3AD" symbol="drage" size={110} bob />
      <p className="font-cinzel text-xl tracking-widest text-viking-gold-soft">{text}</p>
      <div className="flex gap-2 text-2xl text-viking-gold/70" aria-hidden>
        <span className="animate-pulse">ᚦ</span>
        <span className="animate-pulse [animation-delay:0.2s]">ᚱ</span>
        <span className="animate-pulse [animation-delay:0.4s]">ᚾ</span>
      </div>
    </div>
  );
}
