/**
 * MuteButton.tsx
 * Flytende lyd av/på-knapp i hjørnet (§10). Husker valget i localStorage (lib/sound.ts),
 * og demper både effektlyder og bakgrunnsmusikk (Howler.mute). Synlig over alle elev-skjermer.
 */

import { useMute } from '../../hooks/useMute';
import NorseIcon from '../decor/NorseIcon';

export default function MuteButton() {
  const { muted, toggle } = useMute();
  return (
    <button
      onClick={toggle}
      aria-label={muted ? 'Slå på lyd' : 'Slå av lyd'}
      title={muted ? 'Slå på lyd' : 'Slå av lyd'}
      className="fixed bottom-4 right-4 z-[70] flex h-12 w-12 items-center justify-center rounded-full border-2 border-viking-gold/70 bg-viking-surface text-viking-gold-soft transition-colors hover:border-viking-gold hover:text-viking-gold"
    >
      <NorseIcon name={muted ? 'ikon-lyd-av' : 'ikon-lyd-pa'} size={26} />
    </button>
  );
}
