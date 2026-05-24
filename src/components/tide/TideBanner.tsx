/**
 * TideBanner.tsx
 * Kompakt tidevanns-nedtelling øverst på elevskjermen (§6.5). Leser samme TideState som
 * lærerskjermen, så gruppene kjenner presset: nå alle stedene i kapitlet før tidevannet
 * snur. Vises kun mens timeren går eller er pauset.
 */

import { useEffect, useState } from 'react';
import { subscribeTide, type TideState } from '../../lib/gameSync';
import { chapters } from '../../data/chapters';
import { tideRemainingMs, formatMs } from '../../lib/tide';
import { useNow } from '../../hooks/useNow';

export default function TideBanner({ code }: { code: string }) {
  const [tide, setTide] = useState<TideState | null>(null);
  useEffect(() => {
    const unsub = subscribeTide(code, setTide);
    return () => unsub();
  }, [code]);

  const running = tide?.status === 'running';
  const now = useNow(running);

  if (!tide || (tide.status !== 'running' && tide.status !== 'paused')) return null;

  const chapter = chapters[tide.chapterIndex];
  const remaining = tideRemainingMs(tide, now);
  const low = running && remaining <= 60_000;

  return (
    <div className={`mb-4 flex items-center justify-between gap-3 rounded-lg border-2 px-4 py-2 ${low ? 'border-viking-crimson bg-viking-crimson/15' : 'border-viking-teal/60 bg-viking-teal/15'}`}>
      <div>
        <p className="font-cinzel text-sm text-viking-gold">🌊 Tidevannet — {chapter?.navn}</p>
        <p className="font-inter text-xs text-viking-paper/70">Nå alle stedene i kapitlet før tidevannet snur!</p>
      </div>
      <span className={`font-mono text-2xl font-bold ${low ? 'animate-pulse text-viking-crimson' : 'text-viking-gold'}`}>
        {tide.status === 'paused' ? `⏸ ${formatMs(remaining)}` : formatMs(remaining)}
      </span>
    </div>
  );
}
