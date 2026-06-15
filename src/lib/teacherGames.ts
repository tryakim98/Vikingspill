/**
 * teacherGames.ts
 * Lærerens lokale register over spill hen har opprettet/gjenopptatt, lagret i
 * localStorage. Brukes til «Fortsett tidligere spill»-oversikten (§ lagre/gjenoppta):
 * selv om læreren lukker fanen eller PC-en mellom to skoletimer, ligger spillkodene
 * her så hen finner igjen spillet uten å måtte huske koden utenat.
 *
 * Merk: dette er KUN en bekvemmelighets-snarvei. Selve spillet lever i Firebase under
 * koden, og kan alltid gjenopptas ved å skrive inn koden manuelt — også på en helt ny
 * enhet der dette registeret er tomt.
 */

const KEY = 'vikingspill_teacher_games';
const MAX = 20; // hold lista kort — eldste faller av

export interface TeacherGame {
  code: string;
  createdAt: number;   // da læreren først så koden på denne enheten
  lastSeenAt: number;  // sist hen åpnet/gjenopptok spillet herfra
}

function read(): TeacherGame[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TeacherGame[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((g) => g && typeof g.code === 'string');
  } catch {
    return [];
  }
}

function write(games: TeacherGame[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(games.slice(0, MAX)));
  } catch {
    /* ignore — privat modus e.l. */
  }
}

/** Tidligere spill, nyeste først. */
export function listTeacherGames(): TeacherGame[] {
  return read().sort((a, b) => b.lastSeenAt - a.lastSeenAt);
}

/** Legg til (eller oppdater) et spill i registeret og marker det som nettopp sett. */
export function rememberTeacherGame(code: string): void {
  const now = Date.now();
  const games = read();
  const existing = games.find((g) => g.code === code);
  if (existing) {
    existing.lastSeenAt = now;
  } else {
    games.push({ code, createdAt: now, lastSeenAt: now });
  }
  write(games);
}

/** Fjern et spill fra registeret (når læreren sletter det for godt). */
export function forgetTeacherGame(code: string): void {
  write(read().filter((g) => g.code !== code));
}
