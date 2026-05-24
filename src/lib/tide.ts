/**
 * tide.ts
 * Små hjelpere for tidevannstimeren (§6.5): regn ut gjenstående tid fra timer-
 * tilstanden, og formatér som m:ss. Deles av lærerkontroll og elev-banner.
 */

import type { TideState } from './gameSync';

/** Gjenstående millisekunder gitt tilstand og «nå». Frosset når pauset. */
export function tideRemainingMs(tide: TideState | null, now: number): number {
  if (!tide) return 0;
  if (tide.status === 'running' && tide.endsAt != null) return Math.max(0, tide.endsAt - now);
  return Math.max(0, tide.remainingMs);
}

/** Formatér millisekunder som m:ss. */
export function formatMs(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
