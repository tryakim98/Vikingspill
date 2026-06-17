/**
 * gameSync.ts
 * Sanntidssync mot Firebase Realtime Database (modulær v9+ API).
 * Datamodell:  /games/{gameCode}/meta            { createdAt }
 *              /games/{gameCode}/groups/{groupId} SyncedGroup
 *
 * Elevene SKRIVER sin egen gruppe; lærerskjermen LYTTER på alle grupper.
 * Alle skriv er «best effort» — feiler de (offline), beholder appen localStorage.
 */

import { ref, set, get, remove, update, runTransaction, onValue, type Unsubscribe } from 'firebase/database';
import { db } from './firebase';
import type { SkillKey, TradeGoodId, SagaEntry, Svennebrev } from '../types';
import type { FateEffect } from '../data/fateCards';
import type { KeyCardLogEntry } from './keyCards';

export interface GroupMember {
  joinedAt: number;
  /** Mannskapsrolle (§2.3) — unik per gruppe. Velges ved innmelding. Ingen odds-effekt. */
  role?: SkillKey;
}

export type EncounterStep = 'history' | 'kulturmote' | 'oppgave' | 'transition' | 'quiz' | 'perspektiv' | 'radslagning' | 'valg' | 'saga' | 'roll' | 'rolling' | 'resultat' | 'refleksjon';

/** Ett medlems STEMME i rådslagningen før et valg (§3): `choiceId` er medlemmets
 *  bindende stemme på et alternativ (kjernevalg eller opplåst bonus), `note` er en
 *  valgfri kort begrunnelse ved siden av. Online telles stemmene opp og avgjør valget
 *  (høvdingen bryter kun ved likhet — bygges i 3.3). Samme felt som før; tidligere var
 *  dette reint rådgivende. */
export interface CouncilAdvice {
  choiceId?: string | null;
  note?: string;
  at: number;
}

export interface SyncedEncounter {
  destId: string;
  step: EncounterStep;
  approvalSent?: boolean;
  kmAnswer?: number | null;
  quizIdx?: number;
  quizCorrect?: number;
  quizAnswer?: number | null;
  quizBonus?: number;
  choiceId?: string | null;
  roll?: { raw: number; effective: number; modifier: number; tier: string } | null;
  reason?: string; // saga-tekst som høvdingen skriver før terningen kastes
  // Nøkkelkort (§3 trinn 1): hvem som fikk det private kortet denne runden + kort-id.
  // Settes av høvdingen ved møte-start; innholdet vises KUN på holderens skjerm.
  keyCard?: { holderId: string; cardId: string } | null;
  vikingPerspective?: string;   // perspektivskifte: vikingenes side
  otherPerspective?: string;    // perspektivskifte: de andres side
  bridgeReflection?: string;    // bro til i dag: refleksjonstekst
  advice?: Record<string, CouncilAdvice>; // rådslagning: ett råd per memberId (nullstilles per destinasjon)
}

export interface SyncedGroup {
  shipName: string;
  shipSymbol: string;
  shipColor: string;
  scores: { culturalUnderstanding: number; tradeGain: number; reputation: number };
  svennebrev: Svennebrev;
  visited: string[];
  locked: string[];
  goods?: Partial<Record<TradeGoodId, number>>;
  unlockedSides?: string[];
  performedActions?: string[];
  saga?: SagaEntry[];
  textLength?: 'full' | 'short'; // brukes når lærer har satt textLength='group'
  updatedAt: number;
  // Multi-enhet-felt (§ multi-enhet med høvding-rolle):
  chiefId?: string;                     // memberId til høvdingen
  members?: Record<string, GroupMember>; // alle koblede enheter i gruppa
  activeDestId?: string | null;          // hvilken destinasjon høvdingen er på
  activeSkillKey?: SkillKey | null;      // svenneprøve aktiv?
  showCeremony?: boolean;                // sluttseremoni vises?
  encounter?: SyncedEncounter | null;    // encounter-state synket til alle medlemmer
  previewDestId?: string | null;         // destinasjonen høvdingen har valgt på kartet
  sailingTo?: string | null;             // pågående seilas-animasjon mot dette stedet
  // Skjebnemøter (valgfrie ekstra-oppdrag under seiling) — §Skjebnemøter
  activeSkjebne?: ActiveSkjebne | null;  // pågående Skjebnemøte (sett av høvdingen)
  seenSkjebne?: string[];                // Skjebnemøte-ID-er gruppa har sett før
  lastSkjebneAtVisited?: number;         // visited.length da forrige ble utløst
  forceSkjebneNextSail?: boolean;        // settes av Skjebnehjulet — tvinger Skjebnemøte ved neste seilas
  seenHints?: string[];                  // førstegangs-forklaringer gruppa har sett (HintKey)
  keyCardHistory?: KeyCardLogEntry[];    // §3 trinn 1: hvem fikk hvilket nøkkelkort hvor (fairness + saga-avsløring)
  // Tinget — gruppa kan stemme fram en ny høvding (§Tinget):
  ting?: TingSession | null;             // pågående/avsluttet ting (avstemning om høvding)
  lastTingAt?: number;                   // tidspunkt forrige ting ble kalt inn (3-min cooldown)
  summon?: GroupSummon | null;           // lærer-varsel «kom til meg» (§8 klasseromsstyring)
}

/** Lærer-varsel til én gruppe — «kom til læreren». Vises som overlay på alle gruppas
 *  enheter til en av dem kvitterer («Vi er på vei!»), så læreren ser at det er mottatt. */
export interface GroupSummon {
  id: string;
  message: string;
  at: number;
  acked?: boolean;   // en elev har kvittert «på vei»
}

/** Tinget: en avstemning der gruppa kan velge en ny høvding. Kalles inn av et hvilket
 *  som helst medlem, som foreslår én kandidat. Alle medlemmer stemmer (kandidat vs.
 *  sittende). Flertall for kandidaten overfører roret; uavgjort beholder sittende. */
export interface TingSession {
  id: string;
  calledBy: string;        // memberId som kalte inn
  candidateId: string;     // foreslått ny høvding
  incumbentId: string;     // sittende høvding da tinget ble kalt
  startedAt: number;
  status: 'open' | 'resolved';
  votes?: Record<string, string>; // memberId -> memberId det stemmes på (candidateId el. incumbentId)
  resultChiefId?: string;  // hvem som holder roret etter avgjørelsen (for resultatvisning)
  resolvedAt?: number;
}

/** Skjebnemøte i pågående tilstand. Høvdingen skriver choiceId; alle ser. */
export interface ActiveSkjebne {
  id: string;
  pendingDestId: string; // destinasjonen høvdingen seilte mot
  choiceId?: string;     // satt når høvdingen velger
  rollResult?: { roll: number; bonus: number; total: number; won: boolean }; // for terningvalg
}

/** Spillets metadata. `createdAt` settes én gang; `lastActiveAt` bumpes hver gang
 *  læreren åpner/gjenopptar spillet, så «tidligere spill»-oversikten kan vise alder. */
export interface GameMeta {
  createdAt: number;
  lastActiveAt?: number;
}

/** Lærer: opprett et nytt spill. */
export function createGame(code: string): Promise<void> {
  const now = Date.now();
  return set(ref(db, `games/${code}/meta`), { createdAt: now, lastActiveAt: now });
}

/** Lærer: marker spillet som nylig aktivt (kalles når konsollen åpnes/gjenopptas).
 *  Best effort — feiler den (offline), er det ufarlig. */
export function touchGame(code: string): Promise<void> {
  return update(ref(db, `games/${code}/meta`), { lastActiveAt: Date.now() });
}

/** Les spillets metadata (om det finnes). */
export async function getGameMeta(code: string): Promise<GameMeta | null> {
  const snap = await get(ref(db, `games/${code}/meta`));
  return (snap.val() as GameMeta | null) ?? null;
}

/** Hent et fullstendig øyeblikksbilde av HELE spillet — brukes til sikkerhetskopi
 *  (læreren laster ned en JSON-fil) så et pågående spill aldri kan gå tapt mellom
 *  to skoletimer, selv om Firebase-data skulle bli slettet eller utløpe. */
export async function exportGame(code: string): Promise<unknown | null> {
  const snap = await get(ref(db, `games/${code}`));
  return snap.exists() ? snap.val() : null;
}

/** Gjenopprett et helt spill fra en sikkerhetskopi (skriver tilbake under samme kode).
 *  Overskriver det som ligger der fra før. Brukes hvis Firebase-data er borte. */
export function importGame(code: string, data: unknown): Promise<void> {
  return set(ref(db, `games/${code}`), data);
}

/** Slett et spill for godt fra Firebase (lærerens «avslutt for godt»). */
export function deleteGame(code: string): Promise<void> {
  return remove(ref(db, `games/${code}`));
}

// === Spillinnstillinger (lærer-styrt) ============================================

export type TextLength = 'full' | 'short' | 'group';

export interface GameSettings {
  requireSaga?: boolean;
  requirePerspective?: boolean;
  requireBridge?: boolean;
  requireQuiz?: boolean;   // stedsquizen må fullføres før valgene (default på)
  requireCouncil?: boolean; // rådslagning: alle medlemmer må gi råd før høvdingen velger (default på)
  textLength?: TextLength; // 'full' = alle, 'short' = alle, 'group' = la hver gruppe velge
  showHints?: boolean;     // førstegangs-forklaringer på/av (default på)
  keyCards?: boolean;      // §3 trinn 1: del ut private nøkkelkort ved ~1/3 av møtene (default på)
}

export function setGameSettings(code: string, settings: Partial<GameSettings>): Promise<void> {
  return update(ref(db, `games/${code}/settings`), settings);
}

export function subscribeGameSettings(code: string, callback: (s: GameSettings) => void): Unsubscribe {
  return onValue(ref(db, `games/${code}/settings`), (snap) => {
    callback((snap.val() as GameSettings | null) ?? {});
  });
}

/** Elev: sjekk at spillkoden finnes før tilkobling. */
export async function gameExists(code: string): Promise<boolean> {
  const snap = await get(ref(db, `games/${code}/meta`));
  return snap.exists();
}

/** Elev: skriv (overskriv) gruppens tilstand. */
export function writeGroup(code: string, groupId: string, data: SyncedGroup): Promise<void> {
  return set(ref(db, `games/${code}/groups/${groupId}`), data);
}

/** Elev: fjern gruppen (når de forlater spillet). */
export function removeGroup(code: string, groupId: string): Promise<void> {
  return remove(ref(db, `games/${code}/groups/${groupId}`));
}

/** Patch et delsett av gruppens felter (scores/svennebrev/visited/locked/UI-state). */
export function patchGroup(code: string, groupId: string, patch: Partial<SyncedGroup>): Promise<void> {
  return update(ref(db, `games/${code}/groups/${groupId}`), { ...patch, updatedAt: Date.now() });
}

/** Lytt på én gruppe — brukes av alle medlemmer for sanntidssync. */
export function subscribeGroup(
  code: string, groupId: string, callback: (group: SyncedGroup | null) => void,
): Unsubscribe {
  return onValue(ref(db, `games/${code}/groups/${groupId}`), (snap) => {
    const g = snap.val() as SyncedGroup | null;
    if (g) {
      g.visited = g.visited ?? [];
      g.locked = g.locked ?? [];
    }
    callback(g);
  });
}

// === Medlemmer + høvding (multi-enhet med høvding-rolle) =========================

/** Bli med i en eksisterende gruppe som nytt medlem. Hvis det ikke finnes en høvding
 *  ennå (transaksjon mot chiefId), blir denne medlemmen høvding. */
export async function joinGroupAsMember(code: string, groupId: string, memberId: string): Promise<void> {
  await set(ref(db, `games/${code}/groups/${groupId}/members/${memberId}`), { joinedAt: Date.now() });
  await runTransaction(ref(db, `games/${code}/groups/${groupId}/chiefId`), (current) => current ?? memberId);
}

/** Forlat gruppen — fjern medlem-noden. Hvis du er høvding, gi roret videre om mulig. */
export async function leaveGroupAsMember(code: string, groupId: string, memberId: string): Promise<void> {
  // Hvis jeg var høvdingen, gi roret til neste medlem (om noen finnes)
  await runTransaction(ref(db, `games/${code}/groups/${groupId}`), (g) => {
    if (!g) return g;
    const members = { ...(g.members ?? {}) };
    delete members[memberId];
    if (g.chiefId === memberId) {
      const next = Object.keys(members)[0];
      g.chiefId = next ?? null;
    }
    g.members = members;
    return g;
  });
}

/** Sett (eller endre) et medlems mannskapsrolle (§2.3). Egen leaf — race-trygt mot
 *  andre medlemmers skriv. Frontend gråer ut roller som allerede er tatt i gruppa. */
export function setMemberRole(code: string, groupId: string, memberId: string, role: SkillKey): Promise<void> {
  return set(ref(db, `games/${code}/groups/${groupId}/members/${memberId}/role`), role);
}

/** Høvdingen gir roret til et annet medlem. Frontend bør gate dette til chief. */
export function transferChief(code: string, groupId: string, newChiefId: string): Promise<void> {
  return set(ref(db, `games/${code}/groups/${groupId}/chiefId`), newChiefId);
}

/** Tinget: kall inn en avstemning (hvem som helst). Skriver hele sesjonen + cooldown-stempel. */
export function callTing(code: string, groupId: string, ting: TingSession): Promise<void> {
  return update(ref(db, `games/${code}/groups/${groupId}`), { ting, lastTingAt: ting.startedAt });
}

/** Tinget: et medlem avgir sin stemme (egen leaf, race-trygt). */
export function castTingVote(code: string, groupId: string, memberId: string, votedFor: string): Promise<void> {
  return set(ref(db, `games/${code}/groups/${groupId}/ting/votes/${memberId}`), votedFor);
}

/** Tinget: avslutt avstemningen med resultat (skrives av sittende høvding). */
export function resolveTing(code: string, groupId: string, resultChiefId: string, resolvedAt: number): Promise<void> {
  return update(ref(db, `games/${code}/groups/${groupId}/ting`), { status: 'resolved', resultChiefId, resolvedAt });
}

/** Tinget: rydd bort sesjonen når resultatet er lest. */
export function clearTing(code: string, groupId: string): Promise<void> {
  return set(ref(db, `games/${code}/groups/${groupId}/ting`), null);
}

/** Rådslagning: et medlem (hvem som helst, ikke bare høvdingen) gir sitt råd før valget.
 *  Skriver kun sin egen leaf under encounter/advice/{memberId}, så det ikke raser mot
 *  høvdingens encounter-skriv eller andre medlemmers råd. Tomme felt utelates (Firebase
 *  tåler ikke undefined). */
export function setEncounterAdvice(
  code: string, groupId: string, memberId: string,
  advice: { choiceId?: string | null; note?: string },
): Promise<void> {
  const clean: CouncilAdvice = { at: Date.now() };
  if (advice.choiceId != null) clean.choiceId = advice.choiceId;
  if (advice.note && advice.note.trim()) clean.note = advice.note.trim().slice(0, 120);
  return set(ref(db, `games/${code}/groups/${groupId}/encounter/advice/${memberId}`), clean);
}

/** Lærer: lytt på alle grupper i et spill. Returnerer en avmeldingsfunksjon. */
export function subscribeGroups(
  code: string,
  callback: (groups: Record<string, SyncedGroup>) => void,
): Unsubscribe {
  return onValue(ref(db, `games/${code}/groups`), (snap) => {
    const groups = (snap.val() as Record<string, SyncedGroup> | null) ?? {};
    // Firebase utelater tomme arrays/objekter ved lagring → fyll inn defaults
    // så konsumenter (leaderboard m.m.) alltid kan lese .length trygt.
    for (const g of Object.values(groups)) {
      g.visited = g.visited ?? [];
      g.locked = g.locked ?? [];
    }
    callback(groups);
  });
}

/** Engangs-snapshot av alle grupper i spillet (brukes av GroupPicker). */
export async function listGroups(code: string): Promise<Record<string, SyncedGroup>> {
  const snap = await get(ref(db, `games/${code}/groups`));
  return (snap.val() as Record<string, SyncedGroup> | null) ?? {};
}

// === Oppgavegodkjenning (§8.3) ====================================================
// Egen node /games/{code}/approvals/{groupId} så elevens group-skriv ikke overskriver den.

export type ApprovalStatus = 'pending' | 'approved' | 'partial' | 'rejected';

export interface ApprovalRequest {
  destId: string;
  taskTitle: string;
  shipName: string;
  status: ApprovalStatus;
  requestedAt: number;
}

/** Elev: be læreren om å godkjenne oppgaven. */
export function requestApproval(
  code: string,
  groupId: string,
  data: { destId: string; taskTitle: string; shipName: string },
): Promise<void> {
  return set(ref(db, `games/${code}/approvals/${groupId}`), {
    ...data,
    status: 'pending' as ApprovalStatus,
    requestedAt: Date.now(),
  });
}

/** Lærer: sett resultat (godkjent/delvis/avvist). */
export function setApprovalStatus(code: string, groupId: string, status: ApprovalStatus): Promise<void> {
  return update(ref(db, `games/${code}/approvals/${groupId}`), { status });
}

/** Lærer: lytt på alle godkjenningsforespørsler. */
export function subscribeApprovals(
  code: string,
  callback: (approvals: Record<string, ApprovalRequest>) => void,
): Unsubscribe {
  return onValue(ref(db, `games/${code}/approvals`), (snap) => {
    callback((snap.val() as Record<string, ApprovalRequest> | null) ?? {});
  });
}

/** Elev: lytt på egen gruppes godkjenningsstatus, så eleven ser lærerens svar (og får
 *  terningbonusen for oppgaven, §6.2) uten å måtte spørre på nytt. */
export function subscribeApproval(
  code: string,
  groupId: string,
  callback: (approval: ApprovalRequest | null) => void,
): Unsubscribe {
  return onValue(ref(db, `games/${code}/approvals/${groupId}`), (snap) => {
    callback((snap.val() as ApprovalRequest | null) ?? null);
  });
}

/** Terningbonus fra oppgavegodkjenning (§6.2): godkjent +2 · delvis +1 · forkastet −1 ·
 *  uavklart/ikke bedt om 0. Brukes både i elevflyten og i odds-visningen. */
export function taskBonusForApproval(status: ApprovalStatus | undefined | null): number {
  switch (status) {
    case 'approved': return 2;
    case 'partial': return 1;
    case 'rejected': return -1;
    default: return 0;
  }
}

// === Lærer-varsel «kom til meg» (§8 klasseromsstyring) ============================

/** Lærer: kall en gruppe hit. Skriver et ferskt varsel (ny id) til gruppa. */
export function sendSummon(code: string, groupId: string, message: string): Promise<void> {
  const summon: GroupSummon = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, message, at: Date.now(), acked: false };
  return patchGroup(code, groupId, { summon });
}

/** Elev: kvitter «vi er på vei» — varselet blir stående til læreren fjerner det,
 *  så læreren ser at gruppa har sett det. */
export function ackSummon(code: string, groupId: string, summon: GroupSummon): Promise<void> {
  return patchGroup(code, groupId, { summon: { ...summon, acked: true } });
}

/** Lærer: fjern varselet (etter at gruppa har kommet). */
export function clearSummon(code: string, groupId: string): Promise<void> {
  return patchGroup(code, groupId, { summon: null });
}

// === Gudenes prøve (§3.4 / §8.5) ==================================================
// Lærer trykker én knapp; spillet trekker utfordring + ferdighet og kringkaster den
// likt til alle grupper via /games/{code}/trial (overskrives ved hver utløsning).

export interface Trial {
  id: string;          // unik pr. utløsning, så elevene vet når en NY prøve kommer
  challengeId: string;
  navn: string;
  desc: string;
  skill: SkillKey;     // ferdigheten som gir bonus
  at: number;
}

/** Læreren utløser ny prøve. Vi rydder samtidig bort eventuelt gammelt resultat,
 *  så elevene ikke ved et uhell viser fjorårets dom på en fersk prøve. */
export function triggerTrial(code: string, trial: Trial): Promise<void> {
  return update(ref(db, `games/${code}`), { trial, trialResult: null });
}

export function subscribeTrial(code: string, callback: (trial: Trial | null) => void): Unsubscribe {
  return onValue(ref(db, `games/${code}/trial`), (snap) => {
    callback((snap.val() as Trial | null) ?? null);
  });
}

/** Lærerens dom etter at klassen har gjort utfordringen fysisk. Elevene leser
 *  resultatet og avgjør plassering (vinner/2.-plass/trøst) for egen gruppe. */
export interface TrialResult {
  trialId: string;            // matcher Trial.id — så stale resultater ignoreres
  winnerId: string;
  winnerName: string;
  runnerUpId?: string;
  runnerUpName?: string;
  at: number;
}

export function triggerTrialResult(code: string, result: TrialResult): Promise<void> {
  return set(ref(db, `games/${code}/trialResult`), result);
}

export function subscribeTrialResult(code: string, callback: (result: TrialResult | null) => void): Unsubscribe {
  return onValue(ref(db, `games/${code}/trialResult`), (snap) => {
    callback((snap.val() as TrialResult | null) ?? null);
  });
}

// === Handelstorg — varebytte mellom skip ==========================================
// Et tilbud beskriver hva gruppe A gir bort til gruppe B og hva A vil ha tilbake.
// Begge gruppene må fortsatt ha varene de skal gi når B aksepterer (vi sjekker idet
// tilbudet godtas, ikke ved opprettelse) — ellers feiler skriving og B får beskjed.

export interface TradeOffer {
  id: string;
  fromGroupId: string;
  fromGroupName: string;
  toGroupId: string;
  toGroupName: string;
  giving: Partial<Record<TradeGoodId, number>>;
  receiving: Partial<Record<TradeGoodId, number>>;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  createdAt: number;
  resolvedAt?: number;
}

export function createTradeOffer(code: string, offer: TradeOffer): Promise<void> {
  return set(ref(db, `games/${code}/trades/${offer.id}`), offer);
}

export function subscribeTrades(
  code: string,
  callback: (trades: Record<string, TradeOffer>) => void,
): Unsubscribe {
  return onValue(ref(db, `games/${code}/trades`), (snap) => {
    callback((snap.val() as Record<string, TradeOffer> | null) ?? {});
  });
}

export type AcceptTradeResult =
  | { ok: true }
  | { ok: false; reason: string };

/** Aksepter et tilbud: sjekker varebeholdning på begge sider, flytter varene
 *  i én atomisk multi-path-skriving og markerer tilbudet som accepted. */
export async function acceptTrade(
  code: string,
  offer: TradeOffer,
  aGoods: Partial<Record<TradeGoodId, number>>,
  bGoods: Partial<Record<TradeGoodId, number>>,
): Promise<AcceptTradeResult> {
  for (const [g, n] of Object.entries(offer.giving)) {
    if ((aGoods[g as TradeGoodId] ?? 0) < (n ?? 0)) {
      return { ok: false, reason: `${offer.fromGroupName} har ikke lenger ${n}× ${g}` };
    }
  }
  for (const [g, n] of Object.entries(offer.receiving)) {
    if ((bGoods[g as TradeGoodId] ?? 0) < (n ?? 0)) {
      return { ok: false, reason: `Dere har ikke nok ${g} (${n} kreves)` };
    }
  }

  const newA: Partial<Record<TradeGoodId, number>> = { ...aGoods };
  const newB: Partial<Record<TradeGoodId, number>> = { ...bGoods };
  for (const [g, n] of Object.entries(offer.giving)) {
    const k = g as TradeGoodId;
    newA[k] = (newA[k] ?? 0) - (n ?? 0);
    newB[k] = (newB[k] ?? 0) + (n ?? 0);
  }
  for (const [g, n] of Object.entries(offer.receiving)) {
    const k = g as TradeGoodId;
    newB[k] = (newB[k] ?? 0) - (n ?? 0);
    newA[k] = (newA[k] ?? 0) + (n ?? 0);
  }
  // Strip 0-verdier — Firebase vil ellers lagre tomme nøkler som kan rote til UI-tellingen
  (Object.keys(newA) as TradeGoodId[]).forEach((k) => { if ((newA[k] ?? 0) === 0) delete newA[k]; });
  (Object.keys(newB) as TradeGoodId[]).forEach((k) => { if ((newB[k] ?? 0) === 0) delete newB[k]; });

  await update(ref(db), {
    [`games/${code}/groups/${offer.fromGroupId}/goods`]: newA,
    [`games/${code}/groups/${offer.toGroupId}/goods`]: newB,
    [`games/${code}/trades/${offer.id}/status`]: 'accepted',
    [`games/${code}/trades/${offer.id}/resolvedAt`]: Date.now(),
  });
  return { ok: true };
}

export function declineTrade(code: string, tradeId: string): Promise<void> {
  return update(ref(db, `games/${code}/trades/${tradeId}`), { status: 'declined', resolvedAt: Date.now() });
}

export function cancelTrade(code: string, tradeId: string): Promise<void> {
  return update(ref(db, `games/${code}/trades/${tradeId}`), { status: 'cancelled', resolvedAt: Date.now() });
}

// === Sjøslag — «Holmgang på bølgene» (§7.2) =======================================
// To-sidig: A utfordrer B → B aksepterer → vinner rapporteres → begge får utfall.

export interface DuelActivity {
  navn: string;
  desc: string;
  ferdighet: SkillKey;
  kind?: 'manuell' | 'tapping' | 'reaksjon' | 'regning'; // valgfri for backward compat
}

/** Resultat fra én forkjemper i en in-app duell. Skrives under
 *  /games/{code}/duels/{duelId}/championResults/{groupId}. */
export interface DuelChampionResult {
  score?: number;      // tapping (klikk), regning (riktige svar)
  reactionMs?: number; // reaksjon (lavere er bedre)
  finishedAt: number;
}

export interface Duel {
  id: string;
  challengerId: string;
  challengerName: string;
  defenderId: string;
  defenderName: string;
  activity: DuelActivity;
  status: 'pending' | 'active' | 'resolved' | 'declined';
  winnerId?: string;
  championResults?: Record<string, DuelChampionResult>;
  at: number;
}

export function submitChampionResult(
  code: string, duelId: string, groupId: string, result: DuelChampionResult,
): Promise<void> {
  return set(ref(db, `games/${code}/duels/${duelId}/championResults/${groupId}`), result);
}

export function createDuel(code: string, duel: Duel): Promise<void> {
  return set(ref(db, `games/${code}/duels/${duel.id}`), duel);
}

export function updateDuel(code: string, duelId: string, partial: Partial<Duel>): Promise<void> {
  return update(ref(db, `games/${code}/duels/${duelId}`), partial);
}

export function subscribeDuels(code: string, callback: (duels: Record<string, Duel>) => void): Unsubscribe {
  return onValue(ref(db, `games/${code}/duels`), (snap) => {
    callback((snap.val() as Record<string, Duel> | null) ?? {});
  });
}

// === Skjebne-kort (§8.4) ==========================================================
// Læreren bestemmer kun NÅR; kort + (for gruppe-kort) tilfeldig gruppe trekkes i koden
// og kringkastes via /games/{code}/fate. Hver elev avgjør selv om de rammes.

export interface FateEvent {
  id: string;
  icon: string;
  title: string;
  text: string;
  targetMode: 'group' | 'condition';
  targetGroupId?: string;
  targetName?: string;
  condition?: { skill: SkillKey; below: number };
  conditionLabel?: string;
  effect: FateEffect;
  at: number;
}

export function triggerFate(code: string, event: FateEvent): Promise<void> {
  return set(ref(db, `games/${code}/fate`), event);
}

export function subscribeFate(code: string, callback: (event: FateEvent | null) => void): Unsubscribe {
  return onValue(ref(db, `games/${code}/fate`), (snap) => {
    callback((snap.val() as FateEvent | null) ?? null);
  });
}

// === Skjebnehjul-synk (§8.4/§8.5) =================================================
// Selve hjul-snurringen kringkastes så den vises og spinner synkront på alle
// elevskjermer når læreren spinner. Læreren skriver resultatfeltet (resultIndex) i det
// hjulet settes i gang; alle klienter animerer til samme felt. De faktiske effektene
// (storm/gave/ragnarok/prøve/skjebnemøte) sendes som før via egne noder når hjulet lander.

export interface WheelSpin {
  id: string;
  resultIndex: number; // indeks i WHEEL_FIELDS som hjulet lander på
  at: number;
}

export function triggerWheelSpin(code: string, spin: WheelSpin): Promise<void> {
  return set(ref(db, `games/${code}/wheelSpin`), spin);
}

export function subscribeWheelSpin(code: string, callback: (spin: WheelSpin | null) => void): Unsubscribe {
  return onValue(ref(db, `games/${code}/wheelSpin`), (snap) => {
    callback((snap.val() as WheelSpin | null) ?? null);
  });
}

// === Ragnarok (§6.3) ==============================================================
// Catch-up-mekanikk: når forskjellen mellom 1. og siste gruppe > 15 poeng kan læreren
// slippe Ragnarok løs — ALLE mister halve handelspoeng («gudene straffer hybris»).
// Rammer likt for alle, så det favoriserer ingen.

export interface RagnarokEvent {
  id: string;
  at: number;
}

export function triggerRagnarok(code: string, ev: RagnarokEvent): Promise<void> {
  return set(ref(db, `games/${code}/ragnarok`), ev);
}

export function subscribeRagnarok(code: string, callback: (ev: RagnarokEvent | null) => void): Unsubscribe {
  return onValue(ref(db, `games/${code}/ragnarok`), (snap) => {
    callback((snap.val() as RagnarokEvent | null) ?? null);
  });
}

// === Tilkoblingsstatus ============================================================
// Firebase RTDB eksponerer en spesiell `.info/connected`-node som er true når klienten
// har kontakt med serveren. Brukes til å varsle ved tapt nett (§13 error states).

export function subscribeConnection(callback: (connected: boolean) => void): Unsubscribe {
  return onValue(ref(db, '.info/connected'), (snap) => callback(snap.val() === true));
}
