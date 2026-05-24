/**
 * sound.ts
 * Lett lydlag (§10) bygget på Howler.js. Hver lyd lastes lat (én Howl-instans, cachet)
 * fra /public/sounds/. Mangler filen ennå, feiler den stille (onloaderror) — appen
 * fungerer uten lyd til læreren legger inn mp3-ene. Global mute lagres i localStorage.
 *
 * Filnavnene under er kontrakten mot /public/sounds/ (se public/sounds/README.md).
 */

import { Howl, Howler } from 'howler';

export type SoundKey =
  | 'waves'    // bølger ved seiling
  | 'horn'     // krigshorn ved quiz-overgang (fakta forsegles)
  | 'dice'     // terning mot trebord
  | 'silver'   // sølvklirr ved bra utfall
  | 'thunder'  // torden ved katastrofe
  | 'trial'    // torden + varsel ved Gudenes prøve
  | 'fanfare'  // episk fanfare ved trumf
  | 'bell';    // klokkeklang ved ny ferdighet

interface SoundDef { file: string; volume: number; loop?: boolean }

const SOUNDS: Record<SoundKey, SoundDef> = {
  waves:   { file: 'waves.mp3',        volume: 0.35 },
  horn:    { file: 'war-horn.mp3',     volume: 0.7 },
  dice:    { file: 'dice-roll.mp3',    volume: 0.7 },
  silver:  { file: 'silver-clink.mp3', volume: 0.7 },
  thunder: { file: 'thunder.mp3',      volume: 0.8 },
  trial:   { file: 'gods-trial.mp3',   volume: 0.85 },
  fanfare: { file: 'fanfare.mp3',      volume: 0.8 },
  bell:    { file: 'bell.mp3',         volume: 0.7 },
};

const BASE = `${import.meta.env.BASE_URL}sounds/`;
const cache = new Map<SoundKey, Howl>();
const MUTE_KEY = 'vikingspill_muted';
const listeners = new Set<() => void>();

let muted = ((): boolean => {
  try { return localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; }
})();

function instance(key: SoundKey): Howl {
  let howl = cache.get(key);
  if (!howl) {
    const def = SOUNDS[key];
    howl = new Howl({
      src: [BASE + def.file],
      volume: def.volume,
      loop: def.loop ?? false,
      preload: true,
      onloaderror: () => { /* fil mangler ennå — spill stille uten å krasje */ },
      onplayerror: () => { /* f.eks. blokkert autoplay før interaksjon */ },
    });
    cache.set(key, howl);
  }
  return howl;
}

/** Spill av en lyd (no-op ved mute eller manglende fil). */
export function playSound(key: SoundKey): void {
  if (muted) return;
  try { instance(key).play(); } catch { /* ignorer */ }
}

/** Stopp en lyd (f.eks. en loop). */
export function stopSound(key: SoundKey): void {
  try { cache.get(key)?.stop(); } catch { /* ignorer */ }
}

export function isMuted(): boolean { return muted; }

export function setMuted(value: boolean): void {
  muted = value;
  try { localStorage.setItem(MUTE_KEY, value ? '1' : '0'); } catch { /* ignorer */ }
  Howler.mute(value); // demp også lyder som allerede spilles
  listeners.forEach((fn) => fn());
}

/** Abonner på mute-endringer (for useSyncExternalStore). */
export function subscribeMute(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

// Sørg for at Howler starter i riktig mute-tilstand.
Howler.mute(muted);
