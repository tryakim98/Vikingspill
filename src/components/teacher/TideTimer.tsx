/**
 * TideTimer.tsx
 * Lærerens tidevannstimer (§6.5). Læreren styrer én timer pr. kapittel:
 * start, pause/fortsett, forleng (+1 min) og kort inn (−1 min). Når tidevannet snur
 * (timeren når 0, eller læreren trykker «Snu tidevannet nå»), kringkastes en tideTurn
 * og grupper som ikke har besøkt alle stedene i kapitlet mister handelspoeng.
 *
 * Tilstanden eies av Firebase (TideState); komponenten lytter selv og skriver tilbake
 * via setTide. En 1s-tikk (useNow) driver nedtellingen og auto-utløser snuingen.
 */

import { useEffect, useRef, useState } from 'react';
import { chapters, chapterCompleted } from '../../data/chapters';
import {
  setTide,
  subscribeTide,
  triggerTideTurn,
  type TideState,
  type SyncedGroup,
} from '../../lib/gameSync';
import { tideRemainingMs, formatMs } from '../../lib/tide';
import { useNow } from '../../hooks/useNow';

const TIDE_PENALTY = 3; // handelspoeng tapt av grupper som ikke rakk i havn

function idleTide(chapterIndex: number): TideState {
  const mins = chapters[chapterIndex]?.defaultMinutes ?? 20;
  const durationMs = mins * 60_000;
  return { chapterIndex, status: 'idle', endsAt: null, remainingMs: durationMs, durationMs };
}

export default function TideTimer({ code, groups }: { code: string; groups: Record<string, SyncedGroup> }) {
  const [tide, setTideLocal] = useState<TideState | null>(null);
  useEffect(() => {
    const unsub = subscribeTide(code, setTideLocal);
    return () => unsub();
  }, [code]);

  const running = tide?.status === 'running';
  const now = useNow(running);
  const firedFor = useRef<number | null>(null);

  // Før læreren starter finnes ingen tide-node ennå; vis kapittel 1 med full varighet.
  const view = tide ?? idleTide(0);
  const chapterIndex = view.chapterIndex;
  const chapter = chapters[chapterIndex];
  const status = view.status;
  const remaining = tideRemainingMs(view, now);
  const completedCount = Object.values(groups).filter((g) => chapterCompleted(chapterIndex, g.visited)).length;
  const groupCount = Object.keys(groups).length;

  // Snu tidevannet: kringkast straff til alle og marker kapitlet som snudd.
  const turnTide = (idx: number) => {
    firedFor.current = idx;
    triggerTideTurn(code, {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      chapterIndex: idx,
      penaltyTrade: TIDE_PENALTY,
      at: Date.now(),
    }).catch(() => {});
    const base = tide ?? idleTide(idx);
    setTide(code, { ...base, chapterIndex: idx, status: 'turned', endsAt: null, remainingMs: 0 }).catch(() => {});
  };

  // Auto-utløsning når nedtellingen treffer 0 (kun én gang pr. kapittel).
  useEffect(() => {
    if (!tide || tide.status !== 'running' || tide.endsAt == null) return;
    if (now >= tide.endsAt && firedFor.current !== tide.chapterIndex) {
      turnTide(tide.chapterIndex);
    }
  }, [now, tide]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = () => {
    const base = tide ?? idleTide(0);
    setTide(code, { ...base, status: 'running', endsAt: Date.now() + base.remainingMs }).catch(() => {});
  };
  const pause = () => {
    if (!tide || tide.endsAt == null) return;
    setTide(code, { ...tide, status: 'paused', endsAt: null, remainingMs: Math.max(0, tide.endsAt - Date.now()) }).catch(() => {});
  };
  const adjust = (deltaMs: number) => {
    const base = tide ?? idleTide(0);
    const newRemaining = Math.max(0, remaining + deltaMs);
    setTide(code, {
      ...base,
      remainingMs: newRemaining,
      endsAt: base.status === 'running' ? Date.now() + newRemaining : null,
    }).catch(() => {});
  };
  const nextChapter = () => {
    const next = Math.min(chapterIndex + 1, chapters.length - 1);
    firedFor.current = null;
    setTide(code, idleTide(next)).catch(() => {});
  };

  const lastChapter = chapterIndex >= chapters.length - 1;
  const pct = Math.max(0, Math.min(100, (remaining / view.durationMs) * 100));
  const low = status === 'running' && remaining <= 60_000;

  return (
    <div className="rounded-lg border-2 border-viking-teal/60 bg-viking-teal/15 p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-cinzel text-xl text-viking-gold">🌊 Tidevannstimer</h2>
        <span className="font-mono text-xs text-viking-gold-soft">
          Kapittel {chapterIndex + 1}/{chapters.length} · {chapter?.navn}
        </span>
      </div>

      <p className="mb-2 font-inter text-xs text-viking-paper/70">Stedene: {chapter?.destIds.join(' · ')}</p>

      {/* Nedtelling + progresjonslinje */}
      <div className="mb-3">
        <div className="flex items-end justify-between">
          <span className={`font-mono text-4xl font-bold ${low ? 'animate-pulse text-viking-crimson' : 'text-viking-gold'}`}>
            {status === 'turned' ? '0:00' : formatMs(remaining)}
          </span>
          <span className="font-inter text-sm text-viking-paper/80">
            {groupCount > 0 ? `${completedCount}/${groupCount} skip i havn` : 'ingen skip ennå'}
          </span>
        </div>
        <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-viking-darkblue/60">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${low ? 'bg-viking-crimson' : 'bg-viking-teal'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {status === 'turned' && (
        <p className="mb-3 rounded border-2 border-viking-crimson/60 bg-viking-crimson/15 p-2 font-cinzel text-sm text-viking-paper">
          🌊 Tidevannet snudde! Skip som ikke var i havn mistet {TIDE_PENALTY} handelspoeng til stormen.
        </p>
      )}

      {/* Kontroller */}
      <div className="flex flex-wrap gap-2">
        {(status === 'idle' || status === 'paused') && (
          <button onClick={start} className="rounded border-2 border-viking-gold bg-viking-gold px-4 py-2 font-cinzel text-sm font-bold text-viking-darkblue hover:bg-viking-gold-soft">
            {status === 'paused' ? '▶ Fortsett' : '▶ Start tidevannet'}
          </button>
        )}
        {status === 'running' && (
          <>
            <button onClick={pause} className="rounded border-2 border-viking-gold/70 bg-viking-surface px-4 py-2 font-cinzel text-sm font-bold text-viking-paper hover:border-viking-gold">⏸ Pause</button>
            <button onClick={() => turnTide(chapterIndex)} className="rounded border-2 border-viking-crimson bg-viking-crimson/30 px-4 py-2 font-cinzel text-sm font-bold text-viking-paper hover:bg-viking-crimson/50">🌊 Snu tidevannet nå</button>
          </>
        )}
        {status !== 'turned' && (
          <>
            <button onClick={() => adjust(60_000)} className="rounded border-2 border-viking-moss/70 bg-viking-moss/25 px-3 py-2 font-cinzel text-sm font-bold text-viking-paper hover:bg-viking-moss/45">+1 min (forleng)</button>
            <button onClick={() => adjust(-60_000)} className="rounded border-2 border-viking-rust/70 bg-viking-rust/25 px-3 py-2 font-cinzel text-sm font-bold text-viking-paper hover:bg-viking-rust/45">−1 min (kort inn)</button>
          </>
        )}
        {status === 'turned' && !lastChapter && (
          <button onClick={nextChapter} className="rounded border-2 border-viking-gold bg-viking-gold px-4 py-2 font-cinzel text-sm font-bold text-viking-darkblue hover:bg-viking-gold-soft">⛵ Neste kapittel →</button>
        )}
        {status === 'turned' && lastChapter && (
          <span className="self-center font-inter text-sm italic text-viking-gold-soft">Siste kapittel — reisen nærmer seg slutten.</span>
        )}
      </div>
    </div>
  );
}
