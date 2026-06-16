/**
 * groupStatus.ts
 * Oversetter en gruppes synkede sanntidstilstand til noe læreren kan lese på ett blikk:
 *  - hvor gruppa ER nå (for kartet): pågående seilas → aktiv destinasjon → siste besøkte
 *  - hva gruppa GJØR nå (encounter-steget), i klartekst
 *  - om gruppa kan stå fast (lenge på samme steg / ingen påkoblede medlemmer)
 *
 * Dataene finnes allerede på SyncedGroup (encounter.step, activeDestId, sailingTo,
 * members) — dette samler bare tolkningen ett sted så lærerskjermen kan vise den.
 */

import type { SyncedGroup, EncounterStep } from './gameSync';
import { destinations } from '../data';

const NAME: Record<string, string> = Object.fromEntries(destinations.map((d) => [d.id, d.name]));

/** Encounter-steg → kort klartekst for læreren. */
const STEP_LABEL: Record<EncounterStep, string> = {
  history: 'leser historien',
  kulturmote: 'i kulturmøtet',
  oppgave: 'på oppgaven',
  transition: 'starter quiz',
  quiz: 'tar stedsquiz',
  perspektiv: 'perspektivskifte',
  radslagning: 'rådslår',
  valg: 'velger hva de skal gjøre',
  saga: 'skriver i sagaen',
  roll: 'skal kaste terning',
  rolling: 'kaster terning',
  resultat: 'ser utfallet',
  refleksjon: 'reflekterer',
};

export interface GroupStatus {
  /** Destinasjons-id å plassere skipet på (kartet). null = hjemme/Avaldsnes. */
  locationId: string | null;
  /** Kort tekst: «I kulturmøtet på Island», «Seiler mot Bagdad», «Velger neste havn». */
  text: string;
  /** Antall påkoblede medlemmer (multi-enhet). */
  memberCount: number;
  /** True hvis gruppa er midt i et kulturmøte (aktivt i en encounter). */
  inEncounter: boolean;
  /** True hvis ingen enheter er koblet til — gruppa kan stå fast/forlatt. */
  noMembers: boolean;
}

export function groupStatus(g: SyncedGroup): GroupStatus {
  const memberCount = g.members ? Object.keys(g.members).length : 0;
  const lastVisited = g.visited.length ? g.visited[g.visited.length - 1] : null;
  const sailingTo = g.sailingTo ?? null;
  const activeDestId = g.activeDestId ?? null;
  const step = g.encounter?.step ?? null;

  let locationId: string | null;
  let text: string;

  if (sailingTo) {
    locationId = sailingTo;
    text = `Seiler mot ${NAME[sailingTo] ?? sailingTo}`;
  } else if (activeDestId && step) {
    locationId = activeDestId;
    text = `${capitalize(STEP_LABEL[step])} — ${NAME[activeDestId] ?? activeDestId}`;
  } else if (g.activeSkillKey) {
    locationId = lastVisited;
    text = 'Tar verdighetsprøve';
  } else if (g.showCeremony) {
    locationId = lastVisited;
    text = 'I sluttseremonien';
  } else {
    locationId = lastVisited;
    text = lastVisited
      ? `Velger neste havn (sist: ${NAME[lastVisited] ?? lastVisited})`
      : 'Velger første havn';
  }

  return {
    locationId,
    text,
    memberCount,
    inEncounter: !!(activeDestId && step),
    noMembers: memberCount === 0,
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
