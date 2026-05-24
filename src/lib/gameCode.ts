/**
 * gameCode.ts
 * Genererer en kort, lesbar spillkode (f.eks. «VIKING-7K2P»). Utelater tegn som lett
 * forveksles (I, O, 0, 1) så koden er enkel å lese opp i klasserommet.
 */

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateGameCode(): string {
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return `VIKING-${suffix}`;
}

/** Normaliser brukerinput (store bokstaver, uten mellomrom). */
export function normalizeGameCode(input: string): string {
  return input.trim().toUpperCase();
}
