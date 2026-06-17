/**
 * council.ts
 * Ren logikk for solo-rådslagningen (§3.2). `npcVotes()` regner ut hvordan
 * NPC-mannskapets roller ville stemt mellom valgene, basert på rollenes
 * `leansToward` vs. valgenes `tag`. Ingen UI, ingen side-effekter, deterministisk.
 * Solo-stemmepanelet (§3.4) bygger på dette; selve avgjørelsen tar spilleren.
 */

import type { Choice, ChoiceTag, SkillKey } from '../types';
import { CREW_ROLES } from '../data/crewRoles';

/** Ett medlems stemme (delen av CouncilAdvice vi bryr oss om her). */
export interface VoteLike {
  choiceId?: string | null;
}

export interface VoteTally {
  /** Antall stemmer per choiceId (kun valg som har minst én stemme). */
  counts: Record<string, number>;
  /** choiceId-ene som deler flest stemmer (1 = klar vinner, >1 = likhet). */
  topIds: string[];
  /** Hvor mange medlemmer som har avgitt en bindende stemme (choiceId). */
  votedCount: number;
}

/**
 * Tell opp bindende stemmer (§3.3). Ren funksjon. Kun `choiceId` teller som stemme —
 * `note` er ren begrunnelse og telles ikke. `choiceIds` er de gyldige alternativene
 * (kjernevalg + opplåst bonus), i visningsrekkefølge; `topIds` returneres i den samme
 * rekkefølgen så likhets-visning blir deterministisk.
 */
export function tallyVotes(
  advice: Record<string, VoteLike>,
  memberIds: string[],
  choiceIds: string[],
): VoteTally {
  const valid = new Set(choiceIds);
  const counts: Record<string, number> = {};
  let votedCount = 0;
  for (const id of memberIds) {
    const cid = advice[id]?.choiceId;
    if (cid && valid.has(cid)) {
      counts[cid] = (counts[cid] ?? 0) + 1;
      votedCount++;
    }
  }
  let max = 0;
  for (const id of choiceIds) if ((counts[id] ?? 0) > max) max = counts[id];
  const topIds = max > 0 ? choiceIds.filter((id) => (counts[id] ?? 0) === max) : [];
  return { counts, topIds, votedCount };
}

export interface NpcVote {
  role: SkillKey;
  choiceId: string;
}

/** Hvor «dristig» et valg er: andelen av oddsen som ligger i ytterpunktene
 *  (stort fall ELLER stor gevinst). Et trygt mid/good-valg gir lav verdi; et
 *  høy-crit/høy-bad-gamble gir høy. 0 når baseRoll-summen er 0. */
export function boldness(c: Choice): number {
  const b = c.baseRoll;
  const total = (b.bad ?? 0) + (b.mid ?? 0) + (b.good ?? 0) + (b.crit ?? 0);
  if (total <= 0) return 0;
  return ((b.bad ?? 0) + (b.crit ?? 0)) / total;
}

/** Fallback-rekkefølge per tag-holdning: primær-tag først, så de «nærmeste» — så
 *  rollen alltid avgir en meningsfull stemme selv når primær-tagen mangler på havna. */
const TAG_PREFERENCE: Record<ChoiceTag, ChoiceTag[]> = {
  aggressive: ['aggressive', 'trade', 'respect'],
  trade:      ['trade', 'respect', 'aggressive'],
  respect:    ['respect', 'trade', 'aggressive'],
};

/** Velg det dristigste valget i en liste; tiebreak: foretrekk `respect`, så
 *  laveste indeks (input-rekkefølgen). Forutsetter ikke-tom liste. */
function boldestPreferRespect(choices: Choice[]): Choice {
  return choices.reduce((best, c) => {
    const db = boldness(c) - boldness(best);
    if (db > 1e-9) return c;
    if (db < -1e-9) return best;
    // likhet i boldness → respect vinner, ellers behold (laveste indeks)
    if (c.tag === 'respect' && best.tag !== 'respect') return c;
    return best;
  }, choices[0]);
}

/** Hvilket valg én rolle ville stemt på. */
function voteForRole(role: SkillKey, choices: Choice[]): Choice {
  const lean = CREW_ROLES[role].leansToward;
  if (lean === 'bold') return boldestPreferRespect(choices);
  // Tag-lener: gå gjennom preferanse-rekkefølgen, første tag med treff vinner,
  // og blant treffene velges det dristigste (tiebreak respect/indeks).
  for (const tag of TAG_PREFERENCE[lean]) {
    const matches = choices.filter((c) => c.tag === tag);
    if (matches.length > 0) return boldestPreferRespect(matches);
  }
  // Skulle ingen tag finnes (alle valg utags-et e.l.) — fall til dristigst totalt.
  return boldestPreferRespect(choices);
}

/**
 * Hvordan hvert NPC-mannskapsmedlem ville stemt mellom `choices`.
 * Ren funksjon: samme input → samme output. Rekkefølgen følger `roles`.
 * Tom `choices` (eller ukjent rolle) gir ingen stemme for den rollen.
 */
export function npcVotes(choices: Choice[], roles: SkillKey[]): NpcVote[] {
  if (choices.length === 0) return [];
  const out: NpcVote[] = [];
  for (const role of roles) {
    if (!CREW_ROLES[role]) continue;
    out.push({ role, choiceId: voteForRole(role, choices).id });
  }
  return out;
}

// === SABOTØR-ÆRE (§3 trinn 2) =====================================================
// Per-elev «ære» AVLEDES av gruppas agendaLog — ingen skriv til medlemsnoden, ingen ny
// per-elev-poengakse. Ren funksjon; kalleren filtrerer + setter etiketter.

export interface AgendaOutcome { agentId: string; succeeded: boolean; vigilantIds: string[]; }
export interface MemberHonor { id: string; vigilant: number; agentWins: number; }

/** Tell per medlem: hvor mange ganger de gjennomskuet en agenda (stemte mot push), og
 *  hvor mange ganger de SELV lyktes som skjult agent. Returnerer én rad per memberId. */
export function deriveHonors(agendaLog: AgendaOutcome[], memberIds: string[]): MemberHonor[] {
  return memberIds.map((id) => ({
    id,
    vigilant: agendaLog.filter((e) => (e.vigilantIds ?? []).includes(id)).length,
    agentWins: agendaLog.filter((e) => e.agentId === id && e.succeeded).length,
  }));
}
