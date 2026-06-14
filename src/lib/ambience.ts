/**
 * ambience.ts
 * Et subtilt miljølag (§10) som legger seg UNDER stedsmusikken under det episke
 * kulturmøtet — lyden av stedet man har kommet til: et kloster, et marked, en basar,
 * havet, en leir, eller arktisk vind. Hver destinasjon peker på ett av seks soundscapes;
 * flere steder med samme miljø deler lyd.
 *
 *   kloster   ambience-kloster.mp3   lindisfarne
 *   marked    ambience-marked.mp3    hedeby, dublin
 *   leir      ambience-leir.mp3      paris, novgorod
 *   hav       ambience-hav.mp3       hebridene, færøyene, vinland
 *   vind-sno  ambience-vind-sno.mp3  sameland, island
 *   basar     ambience-basar.mp3     bagdad, miklagard
 *
 * Laget looper på lavt volum og toner mykt inn/ut. Det spiller sammen med
 * stedsmusikken (lib/music.ts), ikke i stedet for. Mangler en fil, feiler den stille.
 * Global mute (lib/sound.ts → Howler.mute) demper også dette laget.
 * `html5: true` streamer filene i stedet for å laste alt i minnet.
 */

import { Howl } from 'howler';

export type AmbienceKey = 'kloster' | 'marked' | 'leir' | 'hav' | 'vind-sno' | 'basar';

const FILES: Record<AmbienceKey, string> = {
  kloster: 'ambience-kloster.mp3',
  marked: 'ambience-marked.mp3',
  leir: 'ambience-leir.mp3',
  hav: 'ambience-hav.mp3',
  'vind-sno': 'ambience-vind-sno.mp3',
  basar: 'ambience-basar.mp3',
};

// Destinasjons-id → miljø. Steder uten oppføring får ingen ambience (stille lag).
const DEST_AMBIENCE: Record<string, AmbienceKey> = {
  lindisfarne: 'kloster',
  hedeby: 'marked',
  dublin: 'marked',
  paris: 'leir',
  novgorod: 'leir',
  hebrides: 'hav',
  faroyene: 'hav',
  vinland: 'hav',
  sameland: 'vind-sno',
  island: 'vind-sno',
  baghdad: 'basar',
  miklagard: 'basar',
};

/** Hvilket miljø en destinasjon har — eller null hvis ingen passer. */
export function ambienceForDestination(destId: string): AmbienceKey | null {
  return DEST_AMBIENCE[destId] ?? null;
}

const FULL_VOLUME = 0.18; // subtilt — skal ligge under musikken, ikke konkurrere
const FADE_MS = 1500;     // mykt inn/ut

const BASE = `${import.meta.env.BASE_URL}sounds/`;
const howls = new Map<AmbienceKey, Howl>();
let current: AmbienceKey | null = null;

// Som musikken: nettlesere blokkerer .play() før første brukerinteraksjon. Ambience
// starter normalt langt inne i en økt (audio er låst opp), men en synket enhet kan
// lastes rett inn på kulturmøte-steget — da venter vi på første interaksjon.
let unlocked = false;
let pendingKey: AmbienceKey | null = null;

function unlock() {
  if (unlocked) return;
  unlocked = true;
  document.removeEventListener('pointerdown', unlock);
  document.removeEventListener('keydown', unlock);
  document.removeEventListener('touchstart', unlock);
  if (pendingKey) { const k = pendingKey; pendingKey = null; playAmbience(k); }
}

if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', unlock);
  document.addEventListener('keydown', unlock);
  document.addEventListener('touchstart', unlock);
}

function instance(key: AmbienceKey): Howl {
  let howl = howls.get(key);
  if (!howl) {
    howl = new Howl({
      src: [BASE + FILES[key]],
      loop: true,
      volume: 0,
      html5: true,
      onloaderror: () => { /* fil mangler ennå — stille uten å krasje */ },
      onplayerror: () => { /* f.eks. blokkert autoplay før interaksjon */ },
    });
    howls.set(key, howl);
  }
  return howl;
}

/** Start (eller bytt til) et miljølag med mykt innfade. Idempotent for laget som spiller. */
export function playAmbience(key: AmbienceKey): void {
  if (!unlocked) { pendingKey = key; return; }
  if (current === key) {
    const h = instance(key);
    if (!h.playing()) { h.volume(0); h.play(); h.fade(0, FULL_VOLUME, FADE_MS); }
    return;
  }
  const prevKey = current;
  current = key;

  const next = instance(key);
  if (!next.playing()) { next.volume(0); next.play(); }
  next.fade(next.volume(), FULL_VOLUME, FADE_MS);

  if (prevKey) {
    const prev = instance(prevKey);
    prev.fade(prev.volume(), 0, FADE_MS);
    window.setTimeout(() => { if (current !== prevKey) prev.pause(); }, FADE_MS + 80);
  }
}

/** Spill miljøet for en destinasjon. Har stedet ingen ambience, stoppes laget. */
export function playAmbienceForDestination(destId: string): void {
  const key = ambienceForDestination(destId);
  if (key) playAmbience(key);
  else stopAmbience();
}

/** Ton ut og stopp miljølaget (f.eks. når kulturmøtet er over). */
export function stopAmbience(): void {
  pendingKey = null;
  if (!current) return;
  const prev = current;
  current = null;
  const h = instance(prev);
  h.fade(h.volume(), 0, FADE_MS);
  window.setTimeout(() => { if (current === null) h.pause(); }, FADE_MS + 80);
}
