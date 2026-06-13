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
import type { SkillKey, TradeGoodId } from '../types';
import type { FateEffect } from '../data/fateCards';

export interface GroupMember {
  joinedAt: number;
}

export type EncounterStep = 'history' | 'kulturmote' | 'oppgave' | 'transition' | 'quiz' | 'valg' | 'roll' | 'rolling' | 'resultat';

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
}

export interface SyncedGroup {
  shipName: string;
  shipSymbol: string;
  shipColor: string;
  startSkill: SkillKey;
  scores: { culturalUnderstanding: number; tradeGain: number; reputation: number };
  skills: Record<SkillKey, number>;
  visited: string[];
  locked: string[];
  goods?: Partial<Record<TradeGoodId, number>>;
  unlockedSides?: string[];
  performedActions?: string[];
  updatedAt: number;
  // Multi-enhet-felt (§ multi-enhet med høvding-rolle):
  chiefId?: string;                     // memberId til høvdingen
  members?: Record<string, GroupMember>; // alle koblede enheter i gruppa
  activeDestId?: string | null;          // hvilken destinasjon høvdingen er på
  activeSkillKey?: SkillKey | null;      // verdighetsprøve aktiv?
  showCeremony?: boolean;                // sluttseremoni vises?
  encounter?: SyncedEncounter | null;    // encounter-state synket til alle medlemmer
  previewDestId?: string | null;         // destinasjonen høvdingen har valgt på kartet
  sailingTo?: string | null;             // pågående seilas-animasjon mot dette stedet
}

/** Lærer: opprett et nytt spill. */
export function createGame(code: string): Promise<void> {
  return set(ref(db, `games/${code}/meta`), { createdAt: Date.now() });
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

/** Patch et delsett av gruppens felter (scores/skills/visited/locked/UI-state). */
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

/** Høvdingen gir roret til et annet medlem. Frontend bør gate dette til chief. */
export function transferChief(code: string, groupId: string, newChiefId: string): Promise<void> {
  return set(ref(db, `games/${code}/groups/${groupId}/chiefId`), newChiefId);
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

// === Tidevannstimer (§6.5) ========================================================
// Læreren styrer én timer pr. kapittel (start / pause / forleng / kort inn). Tilstanden
// ligger på /games/{code}/tide og leses av alle. Når tidevannet snur, kringkastes en
// /games/{code}/tideTurn slik at grupper som ikke har fullført kapitlet mister
// handelspoeng «til stormen». Læreren bestemmer rammene; utfallet avgjøres av om hver
// gruppe rakk fram — ikke av at læreren peker ut noen.

export interface TideState {
  chapterIndex: number;                              // hvilket kapittel timeren gjelder
  status: 'idle' | 'running' | 'paused' | 'turned'; // idle = ikke startet, turned = snudd
  endsAt: number | null;                             // epoch ms når tidevannet snur (kun running)
  remainingMs: number;                               // gjeldende/frosset gjenstående tid
  durationMs: number;                                // kapitlets varighet (for progresjonslinjen)
}

export function setTide(code: string, tide: TideState): Promise<void> {
  return set(ref(db, `games/${code}/tide`), tide);
}

export function subscribeTide(code: string, callback: (tide: TideState | null) => void): Unsubscribe {
  return onValue(ref(db, `games/${code}/tide`), (snap) => {
    callback((snap.val() as TideState | null) ?? null);
  });
}

export interface TideTurn {
  id: string;
  chapterIndex: number;
  penaltyTrade: number; // handelspoeng tapt for grupper som ikke er ferdige
  at: number;
}

export function triggerTideTurn(code: string, turn: TideTurn): Promise<void> {
  return set(ref(db, `games/${code}/tideTurn`), turn);
}

export function subscribeTideTurn(code: string, callback: (turn: TideTurn | null) => void): Unsubscribe {
  return onValue(ref(db, `games/${code}/tideTurn`), (snap) => {
    callback((snap.val() as TideTurn | null) ?? null);
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
