/**
 * chapters.ts
 * Tidevannskapitler (§6.5): de 12 destinasjonene delt i 4 kapitler à 3. Hvert kapittel
 * har en tidevannstimer på lærerskjermen. Grupper som ikke har besøkt alle stedene i
 * kapitlet når tidevannet snur, mister handelspoeng «til stormen».
 */

export interface Chapter {
  navn: string;
  destIds: string[];
  defaultMinutes: number; // foreslått varighet for tidevannstimeren
}

export const chapters: Chapter[] = [
  { navn: 'Vesterhavets tokt', destIds: ['lindisfarne', 'hedeby', 'dublin'], defaultMinutes: 20 },
  { navn: 'Mot fremmede kyster', destIds: ['paris', 'hebrides', 'sameland'], defaultMinutes: 20 },
  { navn: 'Ut i ytterhavet', destIds: ['faroyene', 'island', 'vinland'], defaultMinutes: 25 },
  { navn: 'Austerveg til Miklagard', destIds: ['novgorod', 'baghdad', 'miklagard'], defaultMinutes: 25 },
];

/** Har gruppa besøkt alle stedene i kapitlet? */
export function chapterCompleted(chapterIndex: number, visited: string[]): boolean {
  const ch = chapters[chapterIndex];
  if (!ch) return true;
  return ch.destIds.every((id) => visited.includes(id));
}
