/**
 * specialActions.ts
 * Spesialhandlinger på utvalgte destinasjoner. Høvdingen kan bruke gruppens
 * ressurser (rykte / handel / ferdighet / varer) til å låse opp konkrete
 * fordeler — fra å skremme seg fram til verdfulle gjenstander til å finansiere
 * en ekspedisjon som åpner et sidested.
 *
 * Hver handling viser tydelig HVA DEN KOSTER og HVA DEN GIR før utførelse, og
 * er engangs (loggføres i `performedActions`). Gruppens prioriteringer underveis
 * får dermed reelle konsekvenser for hvilke muligheter de har senere.
 */

import type { SkillKey, TradeGoodId } from '../types';

export type ActionCategory = 'rykte' | 'handel' | 'diplomati';

export interface ActionCost {
  rep?: number;
  trade?: number;
  und?: number;
  goods?: Partial<Record<TradeGoodId, number>>;
}

export interface ActionRequires extends ActionCost {
  skill?: { key: SkillKey; min: number };
}

export interface ActionEffect {
  rep?: number;
  trade?: number;
  und?: number;
  goods?: Partial<Record<TradeGoodId, number>>;
  skill?: { key: SkillKey; delta: number };
  unlocks?: string[];
}

export interface SpecialAction {
  id: string;
  destId: string;
  category: ActionCategory;
  label: string;
  description: string;
  requires?: ActionRequires;
  cost?: ActionCost;
  effect: ActionEffect;
}

export const SPECIAL_ACTIONS: SpecialAction[] = [
  {
    id: 'lindisfarne-skremme',
    destId: 'lindisfarne',
    category: 'rykte',
    label: 'Skremme munkene til å hente skjult sølv',
    description: 'Ryktet deres rekker foran skipet. De svake munkene gir villig fra seg det de gjemmer for å sleppe verre skader.',
    requires: { rep: 5 },
    cost: { rep: 3 },
    effect: { goods: { solv: 2 } },
  },
  {
    id: 'hedeby-marked-rav',
    destId: 'hedeby',
    category: 'handel',
    label: 'Marked: kjøpe rav',
    description: 'Hedeby er Østersjøens største rav-marked. Bondejentene har samlet harpiks-stykker hele sommeren.',
    requires: { trade: 3 },
    cost: { trade: 3 },
    effect: { goods: { rav: 2 } },
  },
  {
    id: 'hedeby-marked-jern',
    destId: 'hedeby',
    category: 'handel',
    label: 'Marked: kjøpe jern fra smieverkstedet',
    description: 'Smedene i Hedeby er kjent for hard, elastisk stål — perfekt til sverd og nagler.',
    requires: { trade: 3 },
    cost: { trade: 3 },
    effect: { goods: { jern: 2 } },
  },
  {
    id: 'hedeby-finansier-bagdad',
    destId: 'hedeby',
    category: 'handel',
    label: 'Finansier handelsekspedisjon til Bagdad',
    description: 'Erfarne langfererere kjenner Volgaveien. De krever betaling, men åpner en helt ny rute.',
    requires: { goods: { solv: 4 } },
    cost: { goods: { solv: 4 } },
    effect: { unlocks: ['baghdad'] },
  },
  {
    id: 'dublin-bestikke',
    destId: 'dublin',
    category: 'handel',
    label: 'Bestikke vakt — fredelig avgang',
    description: 'En liten gave til riktig mann sparer en blodig konflikt og lokal vrede.',
    requires: { trade: 3 },
    cost: { trade: 3 },
    effect: { rep: 3 },
  },
  {
    id: 'paris-danegeld',
    destId: 'paris',
    category: 'diplomati',
    label: 'Forhandle danegeld fredelig',
    description: 'Frankerne betaler heller enn å slåss. En dyktig forhandler henter ut langt mer enn råe plyndringer.',
    requires: { skill: { key: 'diplomati', min: 2 } },
    effect: { trade: 5 },
  },
  {
    id: 'sameland-verve-veiviser',
    destId: 'sameland',
    category: 'rykte',
    label: 'Verve samisk veiviser',
    description: 'En noaidi som kjenner både fjell og kyst kan guide skipet over farvann ingen andre tør.',
    requires: { rep: 4 },
    cost: { rep: 4 },
    effect: { skill: { key: 'sjømannskap', delta: 1 } },
  },
  {
    id: 'hebrides-allianse',
    destId: 'hebrides',
    category: 'diplomati',
    label: 'Inngå allianse med lokale jarls',
    description: 'De norrøne kolonistene tar imot dere som familie. Båndet vil holde gjennom mange seilas.',
    requires: { skill: { key: 'diplomati', min: 2 } },
    effect: { rep: 3, skill: { key: 'diplomati', delta: 1 } },
  },
  {
    id: 'faroyene-hyre-navigator',
    destId: 'faroyene',
    category: 'handel',
    label: 'Hyre Atlanteren-navigatør',
    description: 'En sjøgammel mann som har seilt til Vinland og tilbake — kunnskapen hans er verdt sin vekt i sølv.',
    requires: { trade: 5 },
    cost: { trade: 5 },
    effect: { skill: { key: 'sjømannskap', delta: 1 } },
  },
];

export const ACTIONS_BY_DEST: Record<string, SpecialAction[]> = SPECIAL_ACTIONS.reduce((acc, a) => {
  (acc[a.destId] ??= []).push(a);
  return acc;
}, {} as Record<string, SpecialAction[]>);
