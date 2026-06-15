/**
 * gameBackup.ts
 * Sikkerhetskopi av et helt spill til/fra en nedlastbar JSON-fil. Dette er sikkerhetsnettet
 * for § «spillet skal ikke forsvinne mellom to skoletimer»: selv om Firebase-data skulle bli
 * slettet eller utløpe, kan læreren laste ned en fil mens spillet pågår og senere gjenopprette
 * hele spillet (alle grupper, poeng, ferdigheter, saga, posisjoner) under samme kode.
 *
 * Selve Firebase-lesningen/skrivingen ligger i gameSync (exportGame/importGame); her håndterer
 * vi bare fil-innpakningen og nettleser-nedlastingen.
 */

const MAGIC = 'vikingspill-backup';
const VERSION = 1;

export interface BackupFile {
  format: typeof MAGIC;
  version: number;
  code: string;
  exportedAt: number;
  data: unknown; // hele /games/{code}-treet
}

/** Pakk et spill-snapshot inn i et filobjekt. */
export function buildBackup(code: string, data: unknown): BackupFile {
  return { format: MAGIC, version: VERSION, code, exportedAt: Date.now(), data };
}

/** Last ned et spill-snapshot som en .json-fil i nettleseren. */
export function downloadBackup(code: string, data: unknown): void {
  const backup = buildBackup(code, data);
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date(backup.exportedAt).toISOString().slice(0, 16).replace(/[:T]/g, '-');
  a.href = url;
  a.download = `vikingspill-${code}-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export type ParseResult =
  | { ok: true; backup: BackupFile }
  | { ok: false; error: string };

/** Les og valider en opplastet sikkerhetskopi-fil. */
export function parseBackup(text: string): ParseResult {
  let obj: unknown;
  try {
    obj = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Filen er ikke gyldig JSON.' };
  }
  const b = obj as Partial<BackupFile>;
  if (!b || b.format !== MAGIC) {
    return { ok: false, error: 'Dette ser ikke ut som en Vikingspill-sikkerhetskopi.' };
  }
  if (typeof b.code !== 'string' || !b.code) {
    return { ok: false, error: 'Sikkerhetskopien mangler spillkode.' };
  }
  if (b.data == null) {
    return { ok: false, error: 'Sikkerhetskopien inneholder ingen spilldata.' };
  }
  return { ok: true, backup: b as BackupFile };
}
