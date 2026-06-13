/**
 * archetypes.ts
 * Arketypen som avsløres i sluttseremonien (§8.6). Bestemmes primært av HVORDAN gruppa
 * spilte — fordelingen av valg-tags i saga-en — og ikke av høyest poengsum. Tre tags
 * fra prototypen kartlegges slik:
 *   respect    → kulturforståelse / fredelige løsninger
 *   aggressive → kamp / plyndring
 *   trade      → handel / forhandling / ære gjennom avtale
 *
 * Et heders-emblem («Handelsbroens vokter») slås på når gruppa har vært en aktiv
 * brobygger på handelstorget. Hvis sagaen er tom (offline / ingen begrunnelser
 * skrevet), faller vi tilbake til score-basert kategori.
 */

import type { SkillKey, SagaEntry, Destination, Choice } from '../types';
import { skillTreeData } from './skillTree';

export interface Honor {
  label: string;
  blurb: string;
}

export interface Archetype {
  id: string;
  title: string;
  icon: string;
  blurb: string;
  values: string;
  honor?: Honor;
}

interface Scores {
  culturalUnderstanding: number;
  tradeGain: number;
  reputation: number;
}

const ARCHETYPES = {
  brobygger: {
    id: 'brobygger',
    title: 'Brobyggeren',
    icon: '🕊️',
    blurb: 'Dere så mennesker, ikke fiender. På hver kyst lyttet dere før dere svingte sverdet — og verden ble større for det. Skaldene skriver lite om sånne reiser. Etterkommerne lever av dem.',
    values: 'Verdier dere viste: nysgjerrighet, respekt for det fremmede, viljen til å lære av andre kulturer.',
  },
  plyndrer: {
    id: 'plyndrer',
    title: 'Plyndreren',
    icon: '⚔️',
    blurb: 'Halve Europa lærte å frykte navnet deres. Dere tok det dere ville ha, og lot ingen være i tvil om hvem som hersket. Det ga rikdom — og kostet venner. Ingen kunne snu ryggen til dere uten å se seg over skulderen.',
    values: 'Verdier dere viste: styrke, øyeblikkelig vinning, ære gjennom kamp. Også: lite tålmodighet med dem som var annerledes.',
  },
  hovding: {
    id: 'hovding',
    title: 'Høvdingen',
    icon: '👑',
    blurb: 'Diplomati, allianse og rettferdig handel ble deres signatur. Dere bygde nettverk som varte etter at skipet la til kai for siste gang — sølv som rant, ja, men også ord som holdt.',
    values: 'Verdier dere viste: ære i avtaler, langsiktig tenking, evnen til å se mellommennesker, ikke bare bytte.',
  },
  klok: {
    id: 'klok',
    title: 'Den Kloke',
    icon: '🌳',
    blurb: 'Verken sverd, sølv eller bønn alene. Dere leste hver situasjon for seg — sjelden helhjertet, ofte rett. Andre vil aldri helt forstå dere, og det er greit.',
    values: 'Verdier dere viste: tilpasningsevne, situasjonsforståelse, ydmykhet overfor det dere ikke vet.',
  },
  vagehals: {
    id: 'vagehals',
    title: 'Vågehalsen',
    icon: '🔥',
    blurb: 'Dere lukket øynene og kastet terningen — for når seier kommer slik, blir den stor. Andre kalte dere uvettige. Skaldene kaller dere modige. Sannheten ligger et sted imellom.',
    values: 'Verdier dere viste: dristighet, viljen til å tape stort for sjansen til å vinne stort, ringe respekt for trygge veier.',
  },
} as const;

const HONOR_BRIDGE_KEEPER: Honor = {
  label: '🤝 Handelsbroens vokter',
  blurb: 'Andre skip seilte trygt fordi dere holdt handelsveiene åpne. Uten dere ville flere strandet alene med varer ingen ville kjøpe.',
};

function tagOf(choice: Choice | undefined): string {
  return (choice?.tag ?? '').toLowerCase();
}

/** Et valg telles som «risikofylt» når et godt utfall er marginalt: minst 50 %
 *  sjanse for «Middels» eller dårligere, og lite trumf-potensial. */
function isRiskyChoice(c: Choice): boolean {
  const total = (c.baseRoll.bad ?? 0) + (c.baseRoll.mid ?? 0) + (c.baseRoll.good ?? 0) + (c.baseRoll.crit ?? 0) || 1;
  const badShare = (c.baseRoll.bad ?? 0) / total;
  const critShare = (c.baseRoll.crit ?? 0) / total;
  // Høy bad-andel = risiko; alternativt høy crit MEN også høy bad (volatilt)
  return badShare >= 0.33 || (critShare >= 0.33 && badShare >= 0.16);
}

export interface ArchetypeInputs {
  saga: SagaEntry[];
  destinations: Destination[];
  acceptedTradesCount: number;
  scores: Scores;
}

export function determineArchetype(inputs: ArchetypeInputs): Archetype {
  const { saga, destinations, acceptedTradesCount, scores } = inputs;

  // Fallback: ingen saga (offline, eller lærer slo ikke på begrunnelse).
  if (saga.length === 0) {
    const a = legacyFromScores(scores);
    return acceptedTradesCount >= 3 ? { ...a, honor: HONOR_BRIDGE_KEEPER } : a;
  }

  let respect = 0, aggressive = 0, trade = 0, risky = 0;
  for (const e of saga) {
    const dest = destinations.find((d) => d.id === e.destId);
    const choice = dest?.choices.find((c) => c.id === e.choiceId);
    const t = tagOf(choice);
    if (t === 'respect') respect++;
    else if (t === 'aggressive') aggressive++;
    else if (t === 'trade') trade++;
    if (choice && isRiskyChoice(choice)) risky++;
  }
  const total = saga.length;
  const respectShare = respect / total;
  const aggressiveShare = aggressive / total;
  const tradeShare = trade / total;
  const riskyShare = risky / total;

  // Strict majority (> 0.5) for de tre konsekvente arketypene. Ved likt forhold
  // (f.eks. respect == aggressive == 0.5) faller vi gjennom til vågehals/klok-grenen.
  let primary: Archetype;
  if (respectShare > 0.5) primary = { ...ARCHETYPES.brobygger };
  else if (aggressiveShare > 0.5) primary = { ...ARCHETYPES.plyndrer };
  else if (tradeShare > 0.5) primary = { ...ARCHETYPES.hovding };
  else if (riskyShare >= 0.4 || aggressiveShare >= 0.4) primary = { ...ARCHETYPES.vagehals };
  else primary = { ...ARCHETYPES.klok };

  if (acceptedTradesCount >= 3) primary.honor = HONOR_BRIDGE_KEEPER;
  return primary;
}

/** Brukes når saga er tom — beholder den gamle score-baserte logikken som fallback. */
function legacyFromScores(scores: Scores): Archetype {
  const { culturalUnderstanding: und, tradeGain: trade, reputation: rep } = scores;
  if (rep <= -3) {
    return { ...ARCHETYPES.plyndrer, blurb: 'Halve Europa skjelver ved navnet deres — dere tok det dere ville ha.' };
  }
  const max = Math.max(und, trade, rep);
  if (max <= 0) {
    return { ...ARCHETYPES.klok, blurb: 'Reisen var hard og lærdommen dyrekjøpt — men dere fant veien hjem.' };
  }
  if (und === max) return { ...ARCHETYPES.brobygger };
  if (trade === max) return { ...ARCHETYPES.hovding };
  return { ...ARCHETYPES.vagehals };
}

/** Topp-ferdigheten (høyeste nivå; språk vinner ved likhet) som flavor-tittel. */
export function topSkillTitle(skills: Record<SkillKey, number>): { name: string; icon: string; level: number } | null {
  const order: SkillKey[] = ['språk', 'sjømannskap', 'krigskunst', 'diplomati', 'tro'];
  let best: SkillKey | null = null;
  for (const k of order) {
    if (skills[k] > 0 && (best === null || skills[k] > skills[best])) best = k;
  }
  if (!best) return null;
  return { name: skillTreeData[best].name, icon: skillTreeData[best].icon, level: skills[best] };
}
