/**
 * useMute.ts
 * Liten hook for lyd-av/på-knappen. Leser global mute-tilstand (lib/sound.ts) via
 * useSyncExternalStore så alle knapper holder seg synkronisert.
 */

import { useSyncExternalStore } from 'react';
import { isMuted, setMuted, subscribeMute } from '../lib/sound';

export function useMute() {
  const muted = useSyncExternalStore(subscribeMute, isMuted, isMuted);
  return { muted, toggle: () => setMuted(!muted) };
}
