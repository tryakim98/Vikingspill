import type { Challenge } from "./model";
export const PARTY_IDS = [
  "tapping",
  "signal",
  "freeze",
  "mime",
  "pose",
] as const;
export type PartyId = (typeof PARTY_IDS)[number];
export const PARTY_GAMES: Record<
  PartyId,
  { title: string; instructions: string; duration: number; digital: boolean }
> = {
  tapping: {
    title: "Tors tromme",
    instructions:
      "Alle bruker sin egen mobil. Trykk så mange ganger dere kan på trommen i 20 sekunder. Lagets snitt per deltakende medlem avgjør. Én skjerm og ett resultat per person; ingen automatiske klikk.",
    duration: 20,
    digital: true,
  },
  signal: {
    title: "Lokes lysknep",
    instructions:
      "Alle spiller på egen mobil i 20 sekunder. Trykk når ravnen viser KLIKK. Vent når den viser VENT. Hvert riktig trykk gir ett poeng; feil trykk trekker to. Lagets snitt avgjør. Teksten gir samme signal som fargen.",
    duration: 20,
    digital: true,
  },
  freeze: {
    title: "Bifrost-statuene",
    instructions:
      "To lag prøver å få hverandre til å le. Først står eller sitter det ene laget som statuer i 15 sekunder mens det andre lager ansikter og ufarlige lyder. Bytt deretter i 15 sekunder. Ingen berøring. Alle bidrar begge veier. Læreren velger best felles gjennomføring.",
    duration: 30,
    digital: false,
  },
  mime: {
    title: "Den usynlige åren",
    instructions:
      "Laget mimer én usynlig, enorm åre som sendes videre. Hver person må ta imot den, oppdage et komisk problem og sende den videre i løpet av 30 sekunder. Ingen ord eller forkunnskaper. Læreren velger den morsomste sammenhengende kjeden.",
    duration: 30,
    digital: false,
  },
  pose: {
    title: "Skipet i stormen",
    instructions:
      "Lag tre felles stillbilder på 30 sekunder: «alt er rolig», «en fisk lander om bord», «kapteinen mistet hatten». Alle må bidra i hvert bilde, som figur, lyd eller regissør. Vis direkte; bilde på mobil er valgfritt og skal ikke lastes opp. Læreren velger best lagspill.",
    duration: 30,
    digital: false,
  },
};
export function partyMembers(challenge: Challenge, groupId: string) {
  return (challenge.roster[groupId] ?? []).filter(
    (uid) => !challenge.excused[uid],
  );
}
export function partyScores(challenge: Challenge) {
  return challenge.groups.map((groupId) => {
    const members = partyMembers(challenge, groupId);
    const submitted = members.filter((uid) =>
      Object.hasOwn(challenge.results, uid),
    );
    const total = members.reduce(
      (sum, uid) => sum + (challenge.results[uid] ?? 0),
      0,
    );
    return {
      groupId,
      count: members.length,
      submitted: submitted.length,
      total,
      average: members.length ? total / members.length : 0,
      complete: members.length > 0 && submitted.length === members.length,
    };
  });
}
export function partyWinners(challenge: Challenge) {
  const scores = partyScores(challenge);
  if (scores.some((s) => !s.complete)) return [];
  const max = Math.max(...scores.map((s) => s.average));
  return scores
    .filter((s) => Math.abs(s.average - max) < 1e-9)
    .map((s) => s.groupId);
}
// The signal is shared and deterministic. Scorekeeping is local during play;
// one authenticated, bounded result is submitted after the common server deadline.
export function clickSignal(seed: number, elapsed: number) {
  const slot = Math.floor(Math.max(0, elapsed) / 900);
  const mixed = Math.imul(slot + 1, 0x45d9f3b) ^ seed;
  return ((mixed ^ (mixed >>> 16)) >>> 0) % 5 < 3;
}
