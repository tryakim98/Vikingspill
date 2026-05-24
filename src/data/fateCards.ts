/**
 * fateCards.ts
 * Skjebne-kort (§8.4). Læreren bestemmer KUN når et kort utløses — spillet trekker
 * selv kort OG (for gruppe-kort) hvilken gruppe som rammes, tilfeldig.
 *  - targetMode 'group'     → én tilfeldig gruppe rammes
 *  - targetMode 'condition' → alle grupper som oppfyller betingelsen rammes
 */

import type { SkillKey } from '../types';

export type FateEffect =
  | { kind: 'score'; und?: number; trade?: number; rep?: number }
  | { kind: 'skill'; skill: SkillKey; delta: number };

export interface FateCard {
  id: string;
  icon: string;
  title: string;
  text: string;
  targetMode: 'group' | 'condition';
  condition?: { skill: SkillKey; below: number; label: string };
  effect: FateEffect;
  effectLabel: string;
}

export const fateCards: FateCard[] = [
  {
    id: 'storm', icon: '🌊', title: 'Storm i Nordsjøen',
    text: 'En voldsom storm slår inn — mast og årer settes på prøve.',
    targetMode: 'group', effect: { kind: 'skill', skill: 'sjømannskap', delta: -2 }, effectLabel: '−2 sjømannskap',
  },
  {
    id: 'handelsmann', icon: '💰', title: 'Arabisk handelsmann',
    text: 'En rik handelsmann tilbyr en sjelden vare til en heldig gruppe.',
    targetMode: 'group', effect: { kind: 'score', trade: 3 }, effectLabel: '+3 handelsutbytte',
  },
  {
    id: 'gunstig-vind', icon: '🍃', title: 'Gunstig vind',
    text: 'Gudene sender medvind og gode varsler.',
    targetMode: 'group', effect: { kind: 'score', rep: 2 }, effectLabel: '+2 rykte',
  },
  {
    id: 'grunnstoting', icon: '⚓', title: 'Grunnstøting',
    text: 'Skipet går på et skjær, og verdifull last går tapt.',
    targetMode: 'group', effect: { kind: 'score', trade: -2 }, effectLabel: '−2 handelsutbytte',
  },
  {
    id: 'pest', icon: '🦠', title: 'Pest',
    text: 'Sykdom herjer langs kysten. De uten sterk tro rammes hardest.',
    targetMode: 'condition', condition: { skill: 'tro', below: 2, label: 'alle skip med Tro under 2' },
    effect: { kind: 'score', rep: -1 }, effectLabel: '−1 rykte',
  },
];
