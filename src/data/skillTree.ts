/**
 * FERDIGHETSTRE
 * Importer av skillTree fra vikingspill_data.json
 */

import type { SkillTree } from '../types';

// Importert direkte fra data
export const skillTreeData: SkillTree = {
  språk: {
    name: 'Språk',
    icon: '🗣️',
    color: '#2B6B6B',
    tiers: [
      { name: 'Grunnleggende språkforståelse', desc: 'Dere kan si hilsener og takk på flere språk. +1 i fredelige handelssituasjoner.' },
      { name: 'Tolk', desc: 'Dere forstår hva fremmede sier. Låser opp valg som krever forhandling.' },
      { name: 'Polyglot', desc: 'Dere snakker tre språk flytende. +2 i alle kulturmøter.' }
    ]
  },
  sjømannskap: {
    name: 'Sjømannskap',
    icon: '⛵',
    color: '#1A4F7A',
    tiers: [
      { name: 'Kystnavigasjon', desc: 'Dere kan seile langs kjente kyster. +1 mot uvær.' },
      { name: 'Åpent hav', desc: 'Dere våger åpne strekninger. Låser opp Færøyene, Island, Vinland.' },
      { name: 'Stjernenavigasjon', desc: 'Dere navigerer etter stjerner og solstein. +2 på lange reiser.' }
    ]
  },
  krigskunst: {
    name: 'Krigskunst',
    icon: '⚔️',
    color: '#8B2929',
    tiers: [
      { name: 'Skjoldborg', desc: 'Dere kan slåss i formasjon. +1 i kamp.' },
      { name: 'Strategi', desc: 'Dere ser kampens helhet. Låser opp leiesoldat-roller (f.eks. Væringgarden).' },
      { name: 'Berserkergang', desc: 'Dere kan gå i kampraseri. +3 i kamp, men −1 kulturforståelse hver gang.' }
    ]
  },
  diplomati: {
    name: 'Diplomati',
    icon: '🤝',
    color: '#5B7553',
    tiers: [
      { name: 'Gavekultur', desc: 'Dere forstår norrøn gaveseremoni. +1 ved første møte med fremmede.' },
      { name: 'Forhandling', desc: 'Dere kan forhandle traktater. Låser opp avtale-valg.' },
      { name: 'Allianse', desc: 'Varig +1 i én valgt kultur, og dere kan be andre grupper om hjelp.' }
    ]
  },
  tro: {
    name: 'Tro & visdom',
    icon: '🌳',
    color: '#6B3FA0',
    tiers: [
      { name: 'Runelesning', desc: 'Dere kan tolke runer og varsler. +1 i åndelige situasjoner.' },
      { name: 'Skaldekunst', desc: 'Dere kan dikte og synge. Låser opp kreative valg ved hoff.' },
      { name: 'Synkretisme', desc: 'Dere kombinerer tro fra flere kulturer. Klarer både kristne og hedenske møter.' }
    ]
  }
};

// HJELPEFUNKSJON: Hent navn på ferdighet
export function getSkillName(skillKey: string): string {
  return skillTreeData[skillKey as keyof SkillTree]?.name || 'Ukjent ferdighet';
}

// HJELPEFUNKSJON: Hent ikon
export function getSkillIcon(skillKey: string): string {
  return skillTreeData[skillKey as keyof SkillTree]?.icon || '?';
}
