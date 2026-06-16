/**
 * fateCards.ts
 * Skjebne-kort (§8.4). Læreren bestemmer KUN når et kort utløses — spillet trekker
 * selv kort OG (for gruppe-kort) hvilken gruppe som rammes, tilfeldig.
 *  - targetMode 'group'     → én tilfeldig gruppe rammes
 *  - targetMode 'condition' → alle grupper som oppfyller betingelsen rammes
 *
 * Hvert kort har en kombinert effekt: poeng-deltas (synker til leaderboardet) og/eller
 * en ferdighetsendring. Magnitudene er ment å være TYDELIG MERKBARE — et skjebne-kort
 * skal flytte på rangeringen, ikke være en kosmetisk hilsen.
 */

import type { SkillKey } from '../types';

export interface FateEffect {
  und?: number;     // kulturforståelse
  trade?: number;   // handelsutbytte
  rep?: number;     // rykte
  skill?: { key: SkillKey; delta: number };
}

export interface FateCard {
  id: string;
  icon: string;
  title: string;
  text: string;
  targetMode: 'group' | 'condition';
  condition?: { skill: SkillKey; below: number; label: string };
  effect: FateEffect;
}

export const fateCards: FateCard[] = [
  {
    id: 'storm', icon: 'wave', title: 'Storm i Nordsjøen',
    text: 'En voldsom storm slår inn — last skylles på sjøen og rorsmannen blir skadet.',
    targetMode: 'group',
    effect: { trade: -3, skill: { key: 'sjømannskap', delta: -1 } },
  },
  {
    id: 'handelsmann', icon: 'coin', title: 'Arabisk handelsmann',
    text: 'En rik handelsmann tilbyr en sjelden silke til en heldig gruppe — den er verdt en formue.',
    targetMode: 'group',
    effect: { trade: 5 },
  },
  {
    id: 'gunstig-vind', icon: 'leaf', title: 'Gunstig vind',
    text: 'Gudene sender medvind og gode varsler. Reisen går trygt og ryktet om skipet sprer seg.',
    targetMode: 'group',
    effect: { rep: 3, skill: { key: 'sjømannskap', delta: 1 } },
  },
  {
    id: 'grunnstoting', icon: 'anchor', title: 'Grunnstøting',
    text: 'Skipet går på et skjær. Verdifull last går tapt, og lokalbefolkningen ler.',
    targetMode: 'group',
    effect: { trade: -4, und: -1 },
  },
  {
    id: 'plyndret', icon: 'horse', title: 'Plyndret på leiren',
    text: 'Lokale ryttere overrasker leiren om natten og stikker av med varer.',
    targetMode: 'group',
    effect: { trade: -3, rep: -2 },
  },
  {
    id: 'odins-ravner', icon: 'raven', title: 'Odins ravner',
    text: 'To svarte ravner sirkler over skipet og hvisker fra Allfader selv — et godt varsel.',
    targetMode: 'group',
    effect: { und: 3, rep: 2 },
  },
  {
    id: 'mjodfest', icon: 'horn', title: 'Mjødfest i havna',
    text: 'Et lokalt klanmiddag inviterer mannskapet til mjødfest. Bånd knyttes, sagaer byttes.',
    targetMode: 'group',
    effect: { rep: 3, skill: { key: 'krigskunst', delta: 1 } },
  },
  {
    id: 'gissel', icon: 'chains', title: 'Tatt som gissel',
    text: 'En lokal jarl tar gruppens beste mann som gissel. Utløsningen koster både sølv og ære.',
    targetMode: 'group',
    effect: { trade: -2, rep: -3 },
  },
  {
    id: 'pest', icon: 'skull', title: 'Pest',
    text: 'Sykdom herjer langs kysten. De uten sterk tro rammes hardest — bønnene holder den ikke unna.',
    targetMode: 'condition',
    condition: { skill: 'tro', below: 2, label: 'alle skip med Tro & visdom under 2' },
    effect: { rep: -3, und: -2 },
  },
  {
    id: 'munk-uten-tolk', icon: 'book', title: 'Munk uten tolk',
    text: 'En lærd munk forteller om Britannias konger på latin. Den som ikke kan språket går glipp av alt.',
    targetMode: 'condition',
    condition: { skill: 'språk', below: 2, label: 'alle skip med Språk under 2' },
    effect: { und: -3 },
  },
];

const SKILL_LABEL: Record<SkillKey, string> = {
  språk: 'språk',
  sjømannskap: 'sjømannskap',
  krigskunst: 'krigskunst',
  diplomati: 'diplomati',
  tro: 'tro & visdom',
};

const fmt = (n: number) => (n > 0 ? `+${n}` : `${n}`);

/** Bygger lesbare linjer fra en FateEffect, klare til visning i overlegget. */
export function fateEffectLines(effect: FateEffect): string[] {
  const lines: string[] = [];
  if (effect.und)   lines.push(`${fmt(effect.und)} kulturforståelse`);
  if (effect.trade) lines.push(`${fmt(effect.trade)} handelsutbytte`);
  if (effect.rep)   lines.push(`${fmt(effect.rep)} rykte`);
  if (effect.skill) lines.push(`${fmt(effect.skill.delta)} ${SKILL_LABEL[effect.skill.key]}`);
  return lines;
}
