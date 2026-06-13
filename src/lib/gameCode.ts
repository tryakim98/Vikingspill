/**
 * gameCode.ts
 * Genererer en kort, lesbar spillkode på 4 store bokstaver (f.eks. «RAVN», «ULVR»).
 * Bokstavene I og O er utelatt for å unngå forveksling med tall 1 og 0.
 * Tall er heller ikke med — koden er ren bokstavmagi.
 */

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // 24 bokstaver: alle minus I og O
const CODE_LENGTH = 4;
const CODE_PATTERN = new RegExp(`^[${CHARS}]{${CODE_LENGTH}}$`);

function randomCode(): string {
  let out = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return out;
}

/** Genererer en spillkode (4 store bokstaver, uten I/O). Ingen kollisjonssjekk. */
export function generateGameCode(): string {
  return randomCode();
}

/** Genererer en spillkode som er garantert ledig blant eksisterende spill.
 *  `isTaken` sjekker mot lageret (Firebase). Prøver inntil 12 ganger; etter det
 *  gir vi opp og returnerer en kandidat — kollisjon er statistisk ekstremt usannsynlig
 *  (24^4 ≈ 332 000 koder), men vi spinner ikke i det uendelige om tjenesten er nede. */
export async function generateUniqueGameCode(
  isTaken: (code: string) => Promise<boolean>,
): Promise<string> {
  for (let i = 0; i < 12; i++) {
    const c = randomCode();
    try {
      if (!(await isTaken(c))) return c;
    } catch {
      return c; // sjekken feilet (offline) — la oppretterren håndtere det
    }
  }
  return randomCode();
}

/** Sann hvis strengen er en gyldig spillkode (4 store bokstaver, ikke I/O). */
export function isValidGameCode(code: string): boolean {
  return CODE_PATTERN.test(code);
}

/** Renser brukerinput: bare bokstaver, store, maks 4 tegn. */
export function normalizeGameCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z]/g, '').slice(0, CODE_LENGTH);
}

export { CODE_LENGTH };
