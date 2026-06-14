/**
 * music.ts
 * Stedsmusikk per havn (§10): hver destinasjon har et bakgrunnsspor som farges av
 * kulturen den representerer. Flere havner som deler kultur gjenbruker samme spor.
 * Mellom havnene (kart/dashboard) spiller seilas-sporet. Alt crossfader mykt (~1,2 s)
 * når gruppa reiser til en ny kultur.
 *
 *   home      background.mp3       hjemme/start, færøyene, island
 *   sailing   background-sea.mp3   under seiling mellom havner (kart/dashboard)
 *   hedeby    music-hedeby.mp3     hedeby
 *   sameland  music-sameland.mp3   sameland, vinland
 *   bagdad    music-bagdad.mp3     bagdad
 *   miklagard music-miklagard.mp3  miklagard
 *   dublin    music-dublin.mp3     dublin, hebridene
 *   novgorod  music-novgorod.mp3   novgorod
 *   vesten    music-vesten.mp3     lindisfarne, paris
 *
 * Mangler en stedsfil (onloaderror), faller vi tilbake til home (background.mp3)
 * uten å krasje. Alle looper på lavt volum og dempes (duck) under Gudenes prøve /
 * skjebne-kort. Global mute (lib/sound.ts → Howler.mute) demper også musikken.
 * `html5: true` streamer de lange filene i stedet for å laste alt i minnet.
 */

import { Howl } from 'howler';

export type MusicTrack =
  | 'home'
  | 'sailing'
  | 'hedeby'
  | 'sameland'
  | 'bagdad'
  | 'miklagard'
  | 'dublin'
  | 'novgorod'
  | 'vesten';

const FILES: Record<MusicTrack, string> = {
  home: 'background.mp3',
  sailing: 'background-sea.mp3',
  hedeby: 'music-hedeby.mp3',
  sameland: 'music-sameland.mp3',
  bagdad: 'music-bagdad.mp3',
  miklagard: 'music-miklagard.mp3',
  dublin: 'music-dublin.mp3',
  novgorod: 'music-novgorod.mp3',
  vesten: 'music-vesten.mp3',
};

// Destinasjons-id → spor. Havner som deler kultur peker på samme spor.
// Ukjent id (eller hjemmehavnene) faller til 'home'.
const DEST_TRACK: Record<string, MusicTrack> = {
  lindisfarne: 'vesten',
  paris: 'vesten',
  hedeby: 'hedeby',
  dublin: 'dublin',
  hebrides: 'dublin',
  sameland: 'sameland',
  vinland: 'sameland',
  faroyene: 'home',
  island: 'home',
  baghdad: 'bagdad',
  miklagard: 'miklagard',
  novgorod: 'novgorod',
};

/** Hvilket spor en destinasjon skal spille. Fallback til hjemmesporet. */
export function musicForDestination(destId: string): MusicTrack {
  return DEST_TRACK[destId] ?? 'home';
}

const FULL_VOLUME = 0.25; // lavt bakgrunnsnivå (~25 %)
const DUCK_VOLUME = 0.06; // dempet når en annen lyd har fokus
const FADE_MS = 1200;     // crossfade-lengde (~1,2 s)

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
      onloaderror: () => {
        // Filen mangler/feilet å laste. Er dette sporet vi faktisk vil spille nå,
        // bytt mykt til hjemmesporet. 'home' faller aldri tilbake (unngår løkke).
        if (track !== 'home' && current === track) playMusic('home');
      },
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

/** Spill stedsmusikken for en destinasjon (crossfader fra forrige spor). */
export function playMusicForDestination(destId: string): void {
  playMusic(musicForDestination(destId));
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
