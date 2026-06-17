/**
 * council.ts
 * Ren logikk for solo-rådslagningen (§3.2). `npcVotes()` regner ut hvordan
 * NPC-mannskapets roller ville stemt mellom valgene, basert på rollenes
 * `leansToward` vs. valgenes `tag`. Ingen UI, ingen side-effekter, deterministisk.
 * Solo-stemmepanelet (§3.4) bygger på dette; selve avgjørelsen tar spilleren.
 */

import type { Choice, ChoiceTag, SkillKey } from '../types';
import { CREW_ROLES } from '../data/crewRoles';

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
