/**
 * archetypes.ts
 * Arketypen som avsløres i sluttseremonien (§8.6). Bestemmes av hvilken av de tre
 * poengsøylene gruppen lente seg på — med egne tilfeller for lavt rykte («Den
 * fryktede») og jevn balanse («Den fullkomne viking»). Topp-ferdigheten brukes som
 * flavor-tittel i seremonien (se EndCeremony).
 */

import type { SkillKey } from '../types';
import { skillTreeData } from './skillTree';

export interface Archetype {
  title: string;
  icon: string;
  blurb: string;
}

interface Scores {
  culturalUnderstanding: number;
  tradeGain: number;
  reputation: number;
}

export function determineArchetype(scores: Scores): Archetype {
  const und = scores.culturalUnderstanding;
  const trade = scores.tradeGain;
  const rep = scores.reputation;

  if (rep <= -3) {
    return { title: 'Den fryktede', icon: '🐺', blurb: 'Halve Europa skjelver ved navnet ditt — du tok det du ville ha.' };
  }

  const max = Math.max(und, trade, rep);
  if (max <= 0) {
    return { title: 'Den prøvede', icon: '🌫️', blurb: 'Reisen var hard og lærdommen dyrekjøpt — men dere fant veien hjem.' };
  }

  const spread = max - Math.min(und, trade, rep);
  if (spread <= 2 && und > 0 && trade > 0 && rep > 0) {
    return { title: 'Den fullkomne viking', icon: '👑', blurb: 'Du mestret både sverd, sølv og samtale — en sjelden balanse.' };
  }

  if (und === max) {
    return { title: 'Brobyggeren', icon: '🕊️', blurb: 'Du så mennesket bak fremmede skikker, og verden ble større.' };
  }
  if (trade === max) {
    return { title: 'Handelsfyrsten', icon: '⚖️', blurb: 'Sølvet fulgte deg fra Lindisfarne til Miklagard.' };
  }
  return { title: 'Sagahelten', icon: '⚔️', blurb: 'Skaldene vil synge om ditt navn i hundre vintre.' };
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
