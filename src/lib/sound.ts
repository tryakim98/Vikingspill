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
  | 'waves'    // kort bølgeeffekt ved ankomst til en destinasjon
  | 'horn'     // krigshorn ved quiz-overgang (fakta forsegles)
  | 'dice'     // terning mot trebord
  | 'silver'   // sølvklirr ved bra utfall
  | 'thunder'  // torden ved katastrofe / skjebne-kort
  | 'trial'    // torden + varsel ved Gudenes prøve
  | 'fanfare'  // episk fanfare ved trumf
  | 'bell'     // klokkeklang ved ny ferdighet
  | 'wheel-tick'  // tikkende/knirkende lyd mens skjebnehjulet snurrer (loopes)
  | 'wheel-klakk' // skarpt klakk når hjulet lander
  | 'correct'     // riktig quiz-svar
  | 'wrong'       // feil quiz-svar (dempet, ikke straffende)
  | 'page'        // bla til neste side/steg i encounter-flyten
  | 'click'       // treklikk når et skip/valg velges
  | 'coin'        // mynt samles inn ved handel
  | 'unlock'      // sted låses opp (svenneprøve bestått)
  | 'sail'        // skipet legger fra havn (bekreftet seilas)
  | 'duel'        // holmgang-duell starter
  | 'storm'       // tidevannet snur — stormen kommer
  | 'summon'      // kongen kaller flåten hjem (sluttseremoni)
  | 'fate-reveal' // skjebne-kort avsløres
  | 'archetype'   // arketypen avsløres i seremonien
  | 'victory';    // konkurransesignal når en gruppe tar ledelsen

// NB: background-sea.mp3 (sjøsang) og background.mp3 (vikingfolk) er de lange
// bakgrunnssporene — håndteres av lib/music.ts, ikke her.

interface SoundDef { file: string; volume: number; loop?: boolean }

const SOUNDS: Record<SoundKey, SoundDef> = {
  waves:         { file: 'waves.mp3',        volume: 0.5 },
  horn:          { file: 'war-horn.mp3',     volume: 0.7 },
  dice:          { file: 'dice-roll.mp3',    volume: 0.7 },
  silver:        { file: 'silver-clink.mp3', volume: 0.7 },
  thunder:       { file: 'thunder.mp3',      volume: 0.8 },
  trial:         { file: 'gods-trial.mp3',   volume: 0.85 },
  fanfare:       { file: 'fanfare.mp3',      volume: 0.8 },
  bell:          { file: 'bell.mp3',         volume: 0.7 },
  'wheel-tick':  { file: 'wheel-tick.mp3',   volume: 0.55, loop: true },
  'wheel-klakk': { file: 'wheel-klakk.mp3',  volume: 0.85 },
  correct:       { file: 'riktig-svar.mp3',     volume: 0.6 },
  wrong:         { file: 'feil-dempet.mp3',     volume: 0.5 },
  page:          { file: 'bla-side.mp3',        volume: 0.45 },
  click:         { file: 'klikk-tre.mp3',       volume: 0.45 },
  coin:          { file: 'mynt-samle.mp3',      volume: 0.6 },
  unlock:        { file: 'laas-opp.mp3',        volume: 0.7 },
  sail:          { file: 'seil-avgang.mp3',     volume: 0.6 },
  duel:          { file: 'holmgang-start.mp3',  volume: 0.7 },
  storm:         { file: 'storm.mp3',           volume: 0.7 },
  summon:        { file: 'ting-kalt.mp3',       volume: 0.7 },
  'fate-reveal': { file: 'skjebne-avslor.mp3',  volume: 0.8 },
  archetype:     { file: 'arketype-avslor.mp3', volume: 0.85 },
  victory:       { file: 'seier-fanfare.mp3',   volume: 0.8 },
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
