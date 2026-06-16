/**
 * DESTINASJONER
 *
 * Bygger alle 12 destinasjoner ved å flette sammen to kilder (CLAUDE.md §5.1 / §14):
 *  - BASISDATA (region, color, difficulty, history, funFact, famousPerson, choices):
 *    fra vikingspill_data.json. Den komplette dataen for alle 12 destinasjoner er
 *    hentet ut fra prototypen (Vikingspill_v3-html → GAME_DATA.destinations).
 *  - V3-INNHOLD (episkeKulturmote, task, stedsquiz): fra vikingspill_innhold_v2.json,
 *    matchet på destinasjons-id. v2-oppgaven ERSTATTER prototypens gamle oppgave (§14).
 *
 * Rekkefølgen følger basisdataen (reiserekkefølge).
 */

import type { Destination, Choice, Difficulty } from '../types';
import { v2Destinasjoner } from './v2Content';
import baseRaw from './vikingspill_data.json';
import { GOODS_BY_DEST } from './tradeGoods';
import { MAIN_ROUTE, SIDE_UNLOCKS } from './routes';
import { HIDDEN_CHOICES } from './hiddenChoices';
import { PERSPECTIVE_PROMPTS } from './perspectives';
import { MODERN_BRIDGES } from './modernBridges';
import { SHORT_TEXTS } from './shortTexts';

/** Hvilket valg på hver destinasjon som er historisk korrekt — det vikingene faktisk
 *  gjorde. Gir +2 kulturforståelse som bonus (§6.1). Bevisst utelatt: Vinland (de
 *  faktisk dro derfra, ingen utfall var spesielt klokt) og Bagdad (kulturmøtet er
 *  fokuset, ikke et «riktig svar»). */
const HISTORICAL_CHOICES: Record<string, string> = {
  lindisfarne: 'plunder',     // 8. juni 793 — første store vikingangrep, plyndret klosteret
  hedeby:      'merchant',    // Hedeby = vikingtidens største handelsby
  dublin:      'marriage',    // 200 år med norrønt-gælisk slekt + assimilering
  paris:       'normandy',    // Rollo fikk Normandie i 911, ble normannere — det varigste utfallet
  hebrides:    'hybrid',      // Gall-Gàidheal — norrønt-gælisk blanding faktisk skjedde
  sameland:    'reciprocity', // Ottars beretning beskriver bytte i gjensidig respekt
  faroyene:    'settle',      // Norrøne bosatte øyene; etterkommerne bor der ennå
  island:      'lawspeaker',  // Alltinget 930 — verdens eldste parlament, lovsigemann sentralt
  novgorod:    'rule',        // Rurik aksepterte invitasjonen 862 og grunnla Rus-dynastiet
  miklagard:   'guard',       // Væringgarden i Bysants — vikinger som keiserens livvakt
};

/** Basisdata pr. destinasjon (prototypens `task` ignoreres — v2-oppgaven vinner, §14). */
interface BaseDestination {
  id: string;
  name: string;
  region: string;
  color: string;
  difficulty: Difficulty;
  history: string;
  funFact: string;
  famousPerson: string;
  choices: Choice[];
}

// JSON-import castes via unknown fordi JSON-literalen inferes med brede typer
// (f.eks. tag/difficulty som string i stedet for våre union-typer). Validert kildedata.
const baseDestinations = (baseRaw as unknown as { destinations: BaseDestination[] }).destinations;

/** De 12 destinasjonene, ferdig flettet og i reiserekkefølge. */
export const destinations: Destination[] = baseDestinations.map((base): Destination => {
  const v2 = v2Destinasjoner[base.id];
  if (!v2) {
    throw new Error(`Mangler v3-innhold (vikingspill_innhold_v2.json) for destinasjon: ${base.id}`);
  }
  return {
    id: base.id,
    name: base.name,
    region: base.region,
    color: base.color,
    difficulty: base.difficulty,
    image: `${import.meta.env.BASE_URL}steder/sted-${base.id}.jpg`,
    history: base.history,
    funFact: base.funFact,
    famousPerson: base.famousPerson,
    choices: base.choices,
    task: v2.task,               // v2-oppgave erstatter prototypens gamle oppgave (§14)
    episkeKulturmote: v2.episkeKulturmote,
    // Stedsquizen er NØYAKTIG 4 spørsmål: kulturmøte-spørsmålet (som før lå som et eget
    // steg etter scenen) er nå første spørsmål, etterfulgt av tre stedsquiz-spørsmål.
    // (Selve utvalget av de tre er midlertidig — riktig innhold per havn kommer i del 3.)
    stedsquiz: [v2.episkeKulturmote.kulturmøteSpørsmål, ...v2.stedsquiz].slice(0, 4),
    goodsReward: GOODS_BY_DEST[base.id] ?? [],
    route: MAIN_ROUTE.has(base.id) ? 'main' : 'side',
    unlocks: SIDE_UNLOCKS[base.id],
    historicalChoiceId: HISTORICAL_CHOICES[base.id],
    hiddenChoice: HIDDEN_CHOICES[base.id],
    perspectivePrompt: PERSPECTIVE_PROMPTS[base.id],
    modernBridge: MODERN_BRIDGES[base.id],
    historyShort: SHORT_TEXTS[base.id]?.historyShort,
    kulturmoteSceneShort: SHORT_TEXTS[base.id]?.kulturmoteSceneShort,
  };
});

/** Hent destinasjon etter id. */
export function getDestinationById(id: string): Destination | undefined {
  return destinations.find((dest) => dest.id === id);
}

/** Hent alle destinasjoner i reiserekkefølge. */
export function getAllDestinations(): Destination[] {
  return destinations;
}

/** Hent en tilfeldig destinasjon (for testing). */
export function getRandomDestination(): Destination {
  return destinations[Math.floor(Math.random() * destinations.length)];
}
