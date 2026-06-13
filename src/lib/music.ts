/**
 * music.ts
 * To lange bakgrunnsspor (§10) som crossfader mykt når eleven skifter kontekst:
 *  - 'adventure'  (background-sea.mp3, sjøsang) under seiling/kart/dashboard — det eventyrlige
 *  - 'reflective' (background.mp3, vikingfolk)   under kulturmøtet og oppgavesiden — det reflekterende
 *
 * Begge looper på lavt volum. De dempes (duck) under Gudenes prøve / skjebne-kort, som har
 * egne effektlyder. Global mute (lib/sound.ts → Howler.mute) demper også musikken.
 * `html5: true` streamer de lange filene i stedet for å laste alt i minnet.
 */

import { Howl } from 'howler';

export type MusicTrack = 'adventure' | 'reflective';

const FILES: Record<MusicTrack, string> = {
  adventure: 'background-sea.mp3',
  reflective: 'background.mp3',
};

const FULL_VOLUME = 0.25; // lavt bakgrunnsnivå (20–30 %)
const DUCK_VOLUME = 0.06; // dempet når en annen lyd har fokus
const FADE_MS = 1200;     // crossfade-lengde

const BASE = `${import.meta.env.BASE_URL}sounds/`;
const howls = new Map<MusicTrack, Howl>();
let current: MusicTrack | null = null;
let ducked = false;

// Nettlesere blokkerer .play() før første brukerinteraksjon. Vi venter på første
// klikk/tast og kjører eventuelt kømlagt spor først DA. Ellers ville musikken
// dø stille hvis en elev lastet siden direkte inn på dashboardet (med lagret økt).
let unlocked = false;
let pendingTrack: MusicTrack | null = null;

function unlock() {
  if (unlocked) return;
  unlocked = true;
  document.removeEventListener('pointerdown', unlock);
  document.removeEventListener('keydown', unlock);
  document.removeEventListener('touchstart', unlock);
  if (pendingTrack) {
    const t = pendingTrack;
    pendingTrack = null;
    playMusic(t);
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', unlock);
  document.addEventListener('keydown', unlock);
  document.addEventListener('touchstart', unlock);
}

function instance(track: MusicTrack): Howl {
  let howl = howls.get(track);
  if (!howl) {
    howl = new Howl({
      src: [BASE + FILES[track]],
      loop: true,
      volume: 0,
      html5: true,
      onloaderror: () => { /* fil mangler ennå — stille uten å krasje */ },
      onplayerror: () => { /* f.eks. blokkert autoplay før interaksjon */ },
    });
    howls.set(track, howl);
  }
  return howl;
}

const targetVolume = () => (ducked ? DUCK_VOLUME : FULL_VOLUME);

/** Bytt til et spor med mykt crossfade. Idempotent for sporet som allerede spiller. */
export function playMusic(track: MusicTrack): void {
  if (!unlocked) { pendingTrack = track; return; }
  if (current === track) {
    const h = instance(track);
    if (!h.playing()) { h.volume(0); h.play(); h.fade(0, targetVolume(), FADE_MS); }
    return;
  }
  const prevTrack = current;
  current = track;

  const next = instance(track);
  if (!next.playing()) { next.volume(0); next.play(); }
  next.fade(next.volume(), targetVolume(), FADE_MS);

  if (prevTrack) {
    const prev = instance(prevTrack);
    prev.fade(prev.volume(), 0, FADE_MS);
    // Pause det gamle sporet etter at det har tonet ut — men bare hvis vi ikke har byttet tilbake.
    window.setTimeout(() => { if (current !== prevTrack) prev.pause(); }, FADE_MS + 80);
  }
}

/** Demp (true) eller gjenopprett (false) bakgrunnsmusikken — f.eks. under Gudenes prøve. */
export function duckMusic(on: boolean): void {
  if (ducked === on) return;
  ducked = on;
  if (current) {
    const h = instance(current);
    h.fade(h.volume(), targetVolume(), 400);
  }
}

/** Stopp all musikk (f.eks. når eleven forlater spillet / dashboardet avmonteres). */
export function stopMusic(): void {
  for (const h of howls.values()) h.stop();
  current = null;
  ducked = false;
  pendingTrack = null;
}
