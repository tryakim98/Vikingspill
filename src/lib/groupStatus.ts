import type { GroupView, Encounter } from '../domain/model';
import { destinations } from '../data';
export const PHASE_LABEL: Record<Encounter['phase'], string> = { sailing: 'Seilas', reading: 'Kulturmøte', tasks: 'Mannskapets bidrag', council: 'Rådslagning', decision: 'Avgjørelse', result: 'Utfall', reflection: 'Etterarbeid' };
export function groupStatus(g: GroupView) {
  const locationId = g.encounter?.destId ?? g.visited.at(-1) ?? null;
  const name = destinations.find(d => d.id === locationId)?.name;
  const text = g.encounter ? `${PHASE_LABEL[g.encounter.phase]} · ${name}` : g.trial ? 'Svenneprøve' : name ? `Velger neste havn · sist ${name}` : 'Velger første havn';
  return { locationId, text, memberCount: Object.keys(g.members).length, inEncounter: !!g.encounter, noMembers: !Object.keys(g.members).length };
}
