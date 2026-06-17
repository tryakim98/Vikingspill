/**
 * GameDashboard.tsx
 * Lett fase-1-dashbord: poeng (kulturforståelse/handel/rykte), ferdigheter, og en
 * destinasjonsliste som inngang til encounter-flyten. Fullt kart + animasjoner
 * (§8.1) kommer senere. Rendres kun med en gyldig gruppe (gyldig hooks-bruk).
 */

import { useState, useEffect, useRef, type ReactNode } from 'react';
import type { Destination, SkillKey } from '../../types';
import { dealPrivateCard, shouldDealKeyCard, agendaAllowed } from '../../lib/keyCards';
import { AGENDA_CARDS } from '../../data/agendaCards';
import { deriveHonors } from '../../lib/council';
import { destinations, skillTreeData } from '../../data';
import { useGameState } from '../../hooks/useGameState';
import type { GroupSetup } from '../../hooks/useGroupSetup';
import { EngravedShip, BraidDivider } from '../decor';
import MaterialPanel from '../decor/MaterialPanel';
import EncounterFlow from '../encounter/EncounterFlow';
import Svenneprove from '../skilltree/Svenneprove';
import EndCeremony from '../ceremony/EndCeremony';
import SeaJourney, { SAILING_DURATION_S } from './SeaJourney';
import TradeGoodsPanel from './TradeGoodsPanel';
import SvennepoverPanel from './SvennepoverPanel';
import HintToast from './HintToast';
import HvaKanViGjorePanel from './HvaKanViGjorePanel';
import { HINTS, type HintKey } from '../../data/firstTimeHints';
import { isAccessible } from '../../lib/unlocks';
import TradeMarket from './TradeMarket';
import type { Session } from '../../hooks/useSession';
import { removeGroup, requestApproval, subscribeApproval, ackSummon, subscribeGroup, subscribeGroups, patchGroup, transferChief, setEncounterAdvice, callTing, castTingVote, resolveTing, clearTing, subscribeTrial, subscribeTrialResult, subscribeFate, subscribeWheelSpin, subscribeRagnarok, subscribeTrades, createTradeOffer, acceptTrade, declineTrade, cancelTrade, subscribeGameSettings, type SyncedGroup, type TingSession, type Trial, type TrialResult, type FateEvent, type WheelSpin, type RagnarokEvent, type TradeOffer, type GameSettings, type ApprovalRequest } from '../../lib/gameSync';
import TingOverlay from '../ting/TingOverlay';
import Icon from '../decor/Icon';
import NorseIcon, { SKILL_PNG, TRADE_PNG } from '../decor/NorseIcon';
import SagaReader from '../saga/SagaReader';
import SummonOverlay from '../summon/SummonOverlay';
import GudenesProveOverlay from '../trial/GudenesProveOverlay';
import SeaBattle from '../duel/SeaBattle';
import FateCardOverlay from '../fate/FateCardOverlay';
import WheelSpinOverlay from '../fate/WheelSpinOverlay';
import RagnarokOverlay from '../ragnarok/RagnarokOverlay';
import LoadingScreen from '../common/LoadingScreen';
import ConnectionBanner from '../common/ConnectionBanner';
import { playMusic, duckMusic, stopMusic } from '../../lib/music';
import { playSound } from '../../lib/sound';
import { SkjebneMoteModal } from '../skjebnemote/SkjebneMoteModal';
import { shouldTriggerSkjebneMote, pickSkjebneMote, getSkjebneMoteById, rollSkjebne, type SkjebneMoteChoice, type SkjebneEffects, type RollResult } from '../../data/skjebnemoter';

const SKILL_KEYS: SkillKey[] = ['språk', 'sjømannskap', 'krigskunst', 'diplomati', 'tro'];
const SYMBOL_LABEL: Record<string, string> = { drage: 'Drage', ulv: 'Ulv', ravn: 'Ravn' };

interface Props {
  setup: GroupSetup;
  session: Session;
  onResetSetup: () => void;
  onLeaveGame: () => void;
  onSwitchRole: () => void;
}

export default function GameDashboard({ setup, session, onResetSetup, onLeaveGame, onSwitchRole }: Props) {
  const { state, applyOutcome, setSkillLevel, addReward, applyFateEffect, performAction, resetProgress } = useGameState(setup, session);

  // I online-modus er gruppe-tilstanden delt blant alle medlemmer. Vi lytter på hele
  // gruppe-noden her (parallelt med useGameState) for å få chief-status, medlemsliste
  // og synket UI-tilstand (aktiv destinasjon m.m.).
  const isOnline = session.mode === 'online' && !!session.groupId;
  const myGroupId = session.groupId ?? '';
  // Trygt avledet spillkode: gameCode finnes kun på online-økter. Brukes i Ting-
  // håndtererne der TS ikke klarer å snevre inn union-typen i callbacks/dep-arrays.
  const gameCode = session.mode === 'online' ? session.gameCode : '';

  // Handelstorg — andre grupper + tilbud, synket fra Firebase.
  const [showTradeMarket, setShowTradeMarket] = useState(false);
  const [allGroups, setAllGroups] = useState<Record<string, SyncedGroup>>({});
  const [trades, setTrades] = useState<Record<string, TradeOffer>>({});
  useEffect(() => {
    if (!isOnline) return;
    const unsubG = subscribeGroups(session.gameCode, setAllGroups);
    const unsubT = subscribeTrades(session.gameCode, setTrades);
    return () => { unsubG(); unsubT(); };
  }, [isOnline, session]);
  const incomingPending = Object.values(trades).filter((t) => t.status === 'pending' && t.toGroupId === myGroupId).length;

  // Spillinnstillinger (lærer-styrt). Saga-krav default av.
  const [gameSettings, setGameSettings] = useState<GameSettings>({});
  useEffect(() => {
    if (!isOnline) return;
    const unsub = subscribeGameSettings(session.gameCode, setGameSettings);
    return () => unsub();
  }, [isOnline, session]);
  // Kjernepedagogikken er PÅ som standard online (default !== false) — læreren kan skru av
  // for korte økter. I solo/offline finnes ingen lærer-UI; de tvungne fritekst-feltene
  // (saga, perspektiv, bro) ville bare blokkere en førstegangs-elev på en grået-ut knapp,
  // så de er AV i solo (krever eksplisitt online). Quiz + rådslagning står på i begge spor.
  const requireSaga = isOnline && gameSettings.requireSaga !== false;
  const requirePerspective = isOnline && gameSettings.requirePerspective !== false;
  const requireBridge = isOnline && gameSettings.requireBridge !== false;
  const requireQuiz = gameSettings.requireQuiz !== false; // default PÅ — stedsquizen er obligatorisk
  const requireCouncil = gameSettings.requireCouncil !== false; // default PÅ — rådslagning før valg
  const [showOwnSaga, setShowOwnSaga] = useState(false);

  const [syncedGroup, setSyncedGroup] = useState<SyncedGroup | null>(null);

  // Egen gruppes godkjenningsstatus (§8.3) — så eleven ser lærerens svar og får
  // oppgavebonusen (§6.2) inn i terningkastet. Kun online.
  const [myApproval, setMyApproval] = useState<ApprovalRequest | null>(null);
  useEffect(() => {
    if (!isOnline) { setMyApproval(null); return; }
    const unsub = subscribeApproval(session.gameCode, myGroupId, setMyApproval);
    return () => unsub();
  }, [isOnline, myGroupId, session]);

  // Tekstlengde — lærer styrer (full/short), eller velger 'group' så hver gruppe velger
  const teacherTextLength = gameSettings.textLength ?? 'full';
  const groupTextLength = (syncedGroup?.textLength ?? 'full') as 'full' | 'short';
  const effectiveTextLength: 'full' | 'short' = teacherTextLength === 'group' ? groupTextLength : (teacherTextLength === 'short' ? 'short' : 'full');
  const setGroupTextLength = (v: 'full' | 'short') => {
    if (!isOnline) return;
    patchGroup(session.gameCode, myGroupId, { textLength: v }).catch(() => {});
  };
  useEffect(() => {
    if (!isOnline) return;
    const unsub = subscribeGroup(session.gameCode, myGroupId, setSyncedGroup);
    return () => unsub();
  }, [isOnline, myGroupId, session]);

  const myMemberId = session.mode === 'online' ? session.memberId : session.memberId;

  // Individuell tekstlengde — hver elev kan forkorte/forlenge teksten KUN på sin egen
  // enhet (lagret lokalt per spill+elev). null = følg gruppas felles tekstlengde, så
  // gruppa ser samme tekst som standard; en svakere leser kan velge kortere uten at det
  // påvirker eller synes for de andre.
  const personalTextKey = `vikingspill_textlen_${gameCode || 'offline'}_${myMemberId}`;
  const [personalTextLength, setPersonalTextLength] = useState<'full' | 'short' | null>(() => {
    try { const v = localStorage.getItem(personalTextKey); return v === 'full' || v === 'short' ? v : null; } catch { return null; }
  });
  const displayTextLength: 'full' | 'short' = personalTextLength ?? effectiveTextLength;
  const togglePersonalTextLength = () => {
    const next: 'full' | 'short' = displayTextLength === 'short' ? 'full' : 'short';
    setPersonalTextLength(next);
    try { localStorage.setItem(personalTextKey, next); } catch { /* ignore */ }
  };

  const chiefId = syncedGroup?.chiefId;
  const isChief = !isOnline || chiefId === myMemberId || !chiefId;
  const members = syncedGroup?.members ?? {};
  const memberIds = Object.keys(members);
  // Mannskapets roller (§2.4): online fra medlemsnodene, solo fra setup. Brukes til å
  // åpne bonus-valg i encounter (en matchende rolle teller som opplåsing).
  const crewRoles: SkillKey[] = isOnline
    ? Object.values(members).map((m) => m.role).filter((r): r is SkillKey => !!r)
    : (setup.role ? [setup.role] : []);
  const memberLabel = (mid: string) => mid === myMemberId ? 'Du' : `Medlem ${mid.slice(2, 6)}`;

  // Tinget (§Tinget): avstemning om ny høvding. Sesjonen ligger på syncedGroup.ting.
  const ting = isOnline ? (syncedGroup?.ting ?? null) : null;
  const [proposingTing, setProposingTing] = useState(false);
  const TING_COOLDOWN_MS = 180_000; // 3 min
  const rollInProgress = syncedGroup?.encounter?.step === 'roll' || syncedGroup?.encounter?.step === 'rolling';
  const tingCooldownLeft = Math.max(0, TING_COOLDOWN_MS - (Date.now() - (syncedGroup?.lastTingAt ?? 0)));
  const startTing = (candidateId: string) => {
    const now = Date.now();
    const t: TingSession = {
      id: `${now}-${myMemberId}`,
      calledBy: myMemberId,
      candidateId,
      incumbentId: chiefId ?? myMemberId,
      startedAt: now,
      status: 'open',
    };
    callTing(gameCode, myGroupId, t).catch(() => {});
    setProposingTing(false);
  };

  // Aktiv destinasjon: synket i online, lokal ellers.
  const [localActiveDestId, setLocalActiveDestId] = useState<string | null>(null);
  const activeDestId = isOnline ? syncedGroup?.activeDestId ?? null : localActiveDestId;
  const activeDest = activeDestId ? destinations.find((d) => d.id === activeDestId) ?? null : null;
  const setActiveDest = (d: Destination | null) => {
    if (isOnline) {
      patchGroup(session.gameCode, myGroupId, {
        activeDestId: d?.id ?? null,
        // Initialiser/rydd encounter-state slik at alle medlemmer ser samme første steg.
        encounter: d ? { destId: d.id, step: 'history' } : null,
      }).catch(() => {});
    } else {
      setLocalActiveDestId(d?.id ?? null);
    }
  };

  // Preview-valg + seilas-animasjon — synket online, lokal offline.
  const [localPreviewDestId, setLocalPreviewDestId] = useState<string | null>(null);
  const [localSailingTo, setLocalSailingTo] = useState<string | null>(null);
  const previewDestId = isOnline ? syncedGroup?.previewDestId ?? null : localPreviewDestId;
  const sailingTo = isOnline ? syncedGroup?.sailingTo ?? null : localSailingTo;
  const setPreviewDestId = (id: string | null) => {
    if (isOnline) {
      patchGroup(session.gameCode, myGroupId, { previewDestId: id }).catch(() => {});
    } else {
      setLocalPreviewDestId(id);
    }
  };

  // Førstegangs-forklaringer — engangs-bobler første gang gruppa møter et nytt konsept.
  // Synket pr. gruppe (alle medlemmer ser samme historikk) eller lokal i offline.
  const showHints = gameSettings.showHints !== false; // default på
  const [localSeenHints, setLocalSeenHints] = useState<string[]>([]);
  const seenHints = isOnline ? (syncedGroup?.seenHints ?? []) : localSeenHints;
  const [activeHint, setActiveHint] = useState<HintKey | null>(null);
  const triggerHint = (key: HintKey) => {
    if (!showHints) return;
    if (seenHints.includes(key)) return;
    if (activeHint) return; // én av gangen
    setActiveHint(key);
    const nextSeen = Array.from(new Set([...seenHints, key]));
    if (isOnline) {
      patchGroup(session.gameCode, myGroupId, { seenHints: nextSeen }).catch(() => {});
    } else {
      setLocalSeenHints(nextSeen);
    }
  };

  // Skjebnemøter — valgfri quest under seiling. Synket online via SyncedGroup.
  const [localActiveSkjebne, setLocalActiveSkjebne] = useState<{ id: string; pendingDestId: string; choiceId?: string; rollResult?: RollResult } | null>(null);
  const [localSeenSkjebne, setLocalSeenSkjebne] = useState<string[]>([]);
  const [localLastSkjebneAtVisited, setLocalLastSkjebneAtVisited] = useState<number | undefined>(undefined);
  const activeSkjebne = isOnline ? (syncedGroup?.activeSkjebne ?? null) : localActiveSkjebne;
  const seenSkjebne = isOnline ? (syncedGroup?.seenSkjebne ?? []) : localSeenSkjebne;
  const lastSkjebneAtVisited = isOnline ? syncedGroup?.lastSkjebneAtVisited : localLastSkjebneAtVisited;

  // Start seilas-animasjon, vent til den er ferdig, så åpne encounter (eller utløs Skjebnemøte).
  // Bare høvdingen utløser denne flyten — alle medlemmer ser animasjonen via synket sailingTo.
  const confirmSailingTo = (destId: string) => {
    const dest = destinations.find((d) => d.id === destId);
    if (!dest) return;
    playSound('sail'); // skipet legger fra havn
    if (isOnline) {
      patchGroup(session.gameCode, myGroupId, { sailingTo: destId, previewDestId: null }).catch(() => {});
    } else {
      setLocalSailingTo(destId);
      setLocalPreviewDestId(null);
    }
    window.setTimeout(() => {
      // Vurder Skjebnemøte før encounter åpnes. Bare høvdingen trekker; alle andre ser via sync.
      // Skjebnehjulet kan ha tvunget frem en — flagget forceSkjebneNextSail overstyrer cooldown + rng.
      const visitedCount = (state?.visited ?? []).length;
      const forced = isOnline ? !!syncedGroup?.forceSkjebneNextSail : false;
      const trigger = forced || shouldTriggerSkjebneMote(visitedCount, lastSkjebneAtVisited);
      const quest = trigger ? pickSkjebneMote(seenSkjebne) : null;
      if (quest) {
        const skj = { id: quest.id, pendingDestId: destId };
        if (isOnline) {
          patchGroup(session.gameCode, myGroupId, { sailingTo: null, activeSkjebne: skj, forceSkjebneNextSail: false }).catch(() => {});
        } else {
          setLocalSailingTo(null);
          setLocalActiveSkjebne(skj);
        }
        return;
      }
      // Selv om vi ikke fant en quest å vise, må vi kvittere det forsterkede flagget
      // så det ikke utløses ved neste seilas.
      if (forced && isOnline) {
        patchGroup(session.gameCode, myGroupId, { forceSkjebneNextSail: false }).catch(() => {});
      }
      if (isOnline) {
        // Privat kort: ved ~1/3 av møtene deles ett privat kort til ÉN elev (vektet mot
        // den som har fått færrest). Krever ≥2 medlemmer. SJELDEN, og kun når lærer-
        // bryteren `saboteur` er på, er kortet et skjult agenda-kort (§3 trinn 2) — med
        // min-gap regnet fra forrige agenda i `agendaLog` vs. besøkte havner.
        const dealEnabled = gameSettings.keyCards !== false && memberIds.length >= 2;
        const visited = state?.visited ?? [];
        const aLog = syncedGroup?.agendaLog ?? [];
        let roundsSinceAgenda = Infinity;
        if (aLog.length) { const idx = visited.indexOf(aLog[aLog.length - 1].destId); if (idx >= 0) roundsSinceAgenda = visited.length - idx; }
        const deal = dealEnabled && shouldDealKeyCard()
          ? dealPrivateCard(destId, memberIds, syncedGroup?.keyCardHistory ?? [], { saboteur: gameSettings.saboteur === true, canAgenda: agendaAllowed(roundsSinceAgenda) })
          : null;
        const patch: Partial<SyncedGroup> = {
          activeDestId: destId,
          encounter: { destId, step: 'history' as const, ...(deal ? { keyCard: deal } : {}) },
          sailingTo: null,
        };
        if (deal) patch.keyCardHistory = [...(syncedGroup?.keyCardHistory ?? []), { destId, memberId: deal.holderId, cardId: deal.cardId }];
        patchGroup(session.gameCode, myGroupId, patch).catch(() => {});
      } else {
        setLocalSailingTo(null);
        setLocalActiveDestId(destId);
      }
    }, SAILING_DURATION_S * 1000 + 200); // 200 ms buffer så animasjonen rekker å fullføre
  };

  // Skjebnemøte — høvdingen velger; alle ser via sync.
  const applySkjebneEffects = (e: SkjebneEffects | undefined) => {
    if (!e) return;
    addReward({
      und:   e.culturalUnderstanding ?? 0,
      trade: e.tradeGain ?? 0,
      rep:   e.reputation ?? 0,
    });
    if (e.skill) {
      applyFateEffect({ skill: e.skill });
    }
  };
  const handleSkjebneChoose = (choice: SkjebneMoteChoice) => {
    if (!activeSkjebne) return;
    let rollResult: RollResult | undefined;
    if (choice.roll) {
      const skillLevel = choice.roll.skill ? (state?.svennebrev[choice.roll.skill] ?? 0) : 0;
      rollResult = rollSkjebne(choice.roll, skillLevel);
      const branch = rollResult.won ? choice.roll.win : choice.roll.lose;
      applySkjebneEffects(branch.effects);
    } else {
      applySkjebneEffects(choice.effects);
    }
    const next = { ...activeSkjebne, choiceId: choice.id, ...(rollResult ? { rollResult } : {}) };
    if (isOnline) {
      patchGroup(session.gameCode, myGroupId, { activeSkjebne: next }).catch(() => {});
    } else {
      setLocalActiveSkjebne(next);
    }
  };
  const handleSkjebneDismiss = () => {
    if (!activeSkjebne) return;
    const destId = activeSkjebne.pendingDestId;
    const visitedCount = (state?.visited ?? []).length;
    const nextSeen = Array.from(new Set([...(seenSkjebne ?? []), activeSkjebne.id]));
    if (isOnline) {
      patchGroup(session.gameCode, myGroupId, {
        activeSkjebne: null,
        seenSkjebne: nextSeen,
        lastSkjebneAtVisited: visitedCount,
        activeDestId: destId,
        encounter: { destId, step: 'history' },
      }).catch(() => {});
    } else {
      setLocalActiveSkjebne(null);
      setLocalSeenSkjebne(nextSeen);
      setLocalLastSkjebneAtVisited(visitedCount);
      setLocalActiveDestId(destId);
    }
  };

  // Aktiv svenneprøve og sluttseremoni: synket i online, lokal ellers.
  const [localActiveSkill, setLocalActiveSkill] = useState<SkillKey | null>(null);
  const activeSkill = isOnline ? (syncedGroup?.activeSkillKey ?? null) : localActiveSkill;
  const setActiveSkill = (s: SkillKey | null) => {
    if (isOnline) {
      patchGroup(session.gameCode, myGroupId, { activeSkillKey: s }).catch(() => {});
    } else {
      setLocalActiveSkill(s);
    }
  };

  const [localShowCeremony, setLocalShowCeremony] = useState(false);
  const showCeremony = isOnline ? !!syncedGroup?.showCeremony : localShowCeremony;
  const setShowCeremony = (b: boolean) => {
    if (isOnline) {
      patchGroup(session.gameCode, myGroupId, { showCeremony: b }).catch(() => {});
    } else {
      setLocalShowCeremony(b);
    }
  };
  const [activeTrial, setActiveTrial] = useState<Trial | null>(null);
  const seenTrial = useRef<string | null>(null);
  const [trialResult, setTrialResult] = useState<TrialResult | null>(null);

  // Tinget — kan ikke kalles inn midt i terningkast/Gudenes prøve, ikke når en ting alt
  // pågår, ikke oftere enn hvert 3. min, og krever minst to medlemmer.
  const canCallTing = isOnline && memberIds.length >= 2 && !ting && !activeTrial && !rollInProgress && tingCooldownLeft <= 0;

  // Avgjør tinget når alle har stemt — KUN sittende høvding skriver resultatet (én resolver,
  // race-trygt). Flertall for kandidaten overfører roret; uavgjort beholder sittende.
  const resolvedTingRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isOnline || !ting || ting.status !== 'open') return;
    if (myMemberId !== ting.incumbentId) return;
    const votes = ting.votes ?? {};
    if (memberIds.length === 0 || memberIds.filter((id) => votes[id]).length < memberIds.length) return;
    if (resolvedTingRef.current === ting.id) return;
    resolvedTingRef.current = ting.id;
    const forCandidate = memberIds.filter((id) => votes[id] === ting.candidateId).length;
    const forIncumbent = memberIds.filter((id) => votes[id] === ting.incumbentId).length;
    const newChief = forCandidate > forIncumbent ? ting.candidateId : ting.incumbentId;
    (async () => {
      if (newChief !== ting.incumbentId) await transferChief(session.gameCode, myGroupId, newChief).catch(() => {});
      await resolveTing(gameCode, myGroupId, newChief, Date.now()).catch(() => {});
    })();
  }, [ting, memberIds, isOnline, myMemberId, gameCode, myGroupId]);
  const [activeFate, setActiveFate] = useState<FateEvent | null>(null);
  const seenFate = useRef<string | null>(null);
  const [activeWheelSpin, setActiveWheelSpin] = useState<WheelSpin | null>(null);
  const seenWheelSpin = useRef<string | null>(null);
  const [activeRagnarok, setActiveRagnarok] = useState<RagnarokEvent | null>(null);
  const seenRagnarok = useRef<string | null>(null);

  // Gudenes prøve (§3.4): lytt på utløsning og avbryt skjermen for alle online-grupper.
  useEffect(() => {
    if (session.mode !== 'online') return;
    let first = true;
    const unsub = subscribeTrial(session.gameCode, (trial) => {
      if (first) { first = false; seenTrial.current = trial?.id ?? null; return; } // ignorer prøve som finnes ved oppkobling
      if (trial && trial.id !== seenTrial.current) { seenTrial.current = trial.id; setActiveTrial(trial); setTrialResult(null); }
    });
    return () => unsub();
  }, [session]);

  // Dommen fra læreren (§3.4): når den kommer, viser overlayen plassering + belønning.
  useEffect(() => {
    if (session.mode !== 'online') return;
    const unsub = subscribeTrialResult(session.gameCode, (result) => {
      setTrialResult(result);
    });
    return () => unsub();
  }, [session]);

  // Skjebne-kort (§8.4): lytt på utløsning og avbryt skjermen.
  useEffect(() => {
    if (session.mode !== 'online') return;
    let first = true;
    const unsub = subscribeFate(session.gameCode, (fate) => {
      if (first) { first = false; seenFate.current = fate?.id ?? null; return; }
      if (fate && fate.id !== seenFate.current) { seenFate.current = fate.id; setActiveFate(fate); }
    });
    return () => unsub();
  }, [session]);

  // Skjebnehjulet (§8.4/§8.5): når læreren spinner, vises hjulet og spinner synkront her.
  useEffect(() => {
    if (session.mode !== 'online') return;
    let first = true;
    const unsub = subscribeWheelSpin(session.gameCode, (spin) => {
      if (first) { first = false; seenWheelSpin.current = spin?.id ?? null; return; }
      if (spin && spin.id !== seenWheelSpin.current) { seenWheelSpin.current = spin.id; setActiveWheelSpin(spin); }
    });
    return () => unsub();
  }, [session]);

  // Ragnarok (§6.3): alle mister halve handelspoeng når læreren slipper den løs.
  useEffect(() => {
    if (session.mode !== 'online') return;
    let first = true;
    const unsub = subscribeRagnarok(session.gameCode, (ev) => {
      if (first) { first = false; seenRagnarok.current = ev?.id ?? null; return; }
      if (ev && ev.id !== seenRagnarok.current) { seenRagnarok.current = ev.id; setActiveRagnarok(ev); }
    });
    return () => unsub();
  }, [session]);

  // §10 Bakgrunnsmusikk: demp under Gudenes prøve / skjebne-kort (de har egne lyder).
  useEffect(() => { duckMusic(Boolean(activeTrial || activeFate)); }, [activeTrial, activeFate]);
  // Mellom havnene (kart/dashboard) spiller seilas-sporet; encounter-flyten styrer sin egen stedsmusikk.
  useEffect(() => { if (!activeDest) playMusic('sailing'); }, [activeDest]);
  // Stopp musikken når dashboardet avmonteres (eleven forlater spillet / bytter rolle).
  useEffect(() => () => stopMusic(), []);

  // Førstegangs-forklaringer: utløses når en ressurs blir > 0 første gang,
  // eller når gruppa preview-er et låst sidested for første gang.
  useEffect(() => {
    if (!state) return;
    if (state.scores.culturalUnderstanding > 0) triggerHint('reward-und');
    if (state.scores.tradeGain > 0)             triggerHint('reward-trade');
    if (state.scores.reputation > 0)            triggerHint('reward-rep');
    const anySkill = Object.values(state.svennebrev).some((lvl) => (lvl ?? 0) > 0);
    if (anySkill) triggerHint('reward-skill');
    const anyGoods = Object.values(state.goods ?? {}).some((n) => (n ?? 0) > 0);
    if (anyGoods) triggerHint('reward-goods');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.scores.culturalUnderstanding, state?.scores.tradeGain, state?.scores.reputation, JSON.stringify(state?.svennebrev), JSON.stringify(state?.goods)]);

  // Locked-system hint: utløses første gang gruppa preview-er et sidested de IKKE
  // har tilgang til ennå.
  useEffect(() => {
    if (!state || !previewDestId) return;
    const dest = destinations.find((d) => d.id === previewDestId);
    if (!dest) return;
    if (dest.route === 'side' && !isAccessible(dest, { scores: state.scores, svennebrev: state.svennebrev, goods: state.goods ?? {}, locked: state.locked, unlockedSides: state.unlockedSides ?? [] })) {
      triggerHint('locked-system');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewDestId]);

  if (!state) return <LoadingScreen text="Henter skipets logg …" />;

  // Lærer-varsel «kom til meg» (§8) — tar over skjermen på alle gruppas enheter til
  // en elev kvitterer. Høyest prioritet, så det aldri drukner i et kulturmøte.
  const summon = isOnline ? (syncedGroup?.summon ?? null) : null;
  if (summon && !summon.acked) {
    return (
      <SummonOverlay
        message={summon.message}
        onAck={() => ackSummon(gameCode, myGroupId, summon).catch(() => {})}
      />
    );
  }

  if (showOwnSaga) {
    return (
      <SagaReader
        title={`${setup.shipName}s saga`}
        groups={[{ shipName: setup.shipName, shipSymbol: setup.shipSymbol, entries: state.saga ?? [] }]}
        onClose={() => setShowOwnSaga(false)}
      />
    );
  }

  if (showTradeMarket && isOnline) {
    return (
      <TradeMarket
        myGroupId={myGroupId}
        myGoods={state.goods ?? {}}
        groups={allGroups}
        trades={trades}
        isChief={isChief}
        onSendOffer={async (toGroupId, toGroupName, giving, receiving) => {
          const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          const offer: TradeOffer = {
            id, fromGroupId: myGroupId, fromGroupName: setup.shipName,
            toGroupId, toGroupName, giving, receiving,
            status: 'pending', createdAt: Date.now(),
          };
          await createTradeOffer(session.gameCode, offer);
        }}
        onAccept={async (offer) => {
          const aGoods = allGroups[offer.fromGroupId]?.goods ?? {};
          const bGoods = allGroups[offer.toGroupId]?.goods ?? {};
          return await acceptTrade(session.gameCode, offer, aGoods, bGoods);
        }}
        onDecline={async (id) => { await declineTrade(session.gameCode, id); }}
        onCancel={async (id) => { await cancelTrade(session.gameCode, id); }}
        onClose={() => setShowTradeMarket(false)}
      />
    );
  }

  // Skjebnehjulet vises og spinner synkront når læreren spinner. Når det lander, kommer
  // selve effekten (storm/gave/ragnarok/prøve) som egne overlays rett etterpå.
  if (activeWheelSpin) {
    return <WheelSpinOverlay spin={activeWheelSpin} onDone={() => setActiveWheelSpin(null)} />;
  }

  if (activeTrial) {
    // Vis bare dommen hvis den matcher den aktive prøven (ellers er det en gammel rest).
    const matchedResult = trialResult && trialResult.trialId === activeTrial.id ? trialResult : null;
    return (
      <GudenesProveOverlay
        navn={activeTrial.navn}
        desc={activeTrial.desc}
        skill={activeTrial.skill}
        skillLevel={state.svennebrev[activeTrial.skill] ?? 0}
        result={matchedResult}
        myGroupId={myGroupId}
        onClose={(reward) => {
          addReward({ und: 0, trade: 0, rep: reward.rep });
          setActiveTrial(null);
        }}
      />
    );
  }

  if (activeFate) {
    const affected = activeFate.targetMode === 'group'
      ? activeFate.targetGroupId === myGroupId
      : (state.svennebrev[activeFate.condition?.skill ?? 'tro'] ?? 0) < (activeFate.condition?.below ?? 0);
    return (
      <FateCardOverlay
        event={activeFate}
        affected={affected}
        onDone={() => {
          if (affected) applyFateEffect(activeFate.effect);
          setActiveFate(null);
        }}
      />
    );
  }

  if (activeRagnarok) {
    const lost = state.scores.tradeGain > 0 ? Math.floor(state.scores.tradeGain / 2) : 0;
    return (
      <RagnarokOverlay
        lost={lost}
        onDone={() => {
          if (lost > 0) addReward({ und: 0, trade: -lost, rep: 0 });
          setActiveRagnarok(null);
        }}
      />
    );
  }

  if (activeSkjebne) {
    const quest = getSkjebneMoteById(activeSkjebne.id);
    if (quest) {
      return (
        <SkjebneMoteModal
          quest={quest}
          isChief={isChief}
          selectedChoiceId={activeSkjebne.choiceId}
          rollResult={activeSkjebne.rollResult}
          onChoose={handleSkjebneChoose}
          onDismiss={handleSkjebneDismiss}
        />
      );
    }
  }

  // Tinget — avstemning om ny høvding. Vises på ALLE enheter, uansett hvilken skjerm de er på.
  if (ting) {
    return (
      <TingOverlay
        ting={ting}
        myMemberId={myMemberId}
        memberIds={memberIds}
        memberLabel={memberLabel}
        onVote={(votedFor) => castTingVote(gameCode, myGroupId, myMemberId, votedFor).catch(() => {})}
        onDismiss={() => clearTing(gameCode, myGroupId).catch(() => {})}
      />
    );
  }

  // Kandidatvelger når et medlem kaller inn Tinget (vises kun for den som kaller inn).
  if (proposingTing) {
    const candidates = memberIds.filter((mid) => mid !== chiefId);
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-viking-darkblue/95 px-4 text-center text-viking-paper" data-testid="ting-call-modal">
        <p className="font-cinzel text-sm uppercase tracking-[0.3em] text-viking-gold-soft/70">Kall inn Tinget</p>
        <div className="mt-2 flex justify-center text-viking-gold"><Icon name="tiwaz" size={60} /></div>
        <h1 className="mt-2 mb-1 font-cinzel text-2xl font-bold text-viking-gold">Hvem foreslår du som ny høvding?</h1>
        <p className="mb-6 max-w-md font-inter text-sm italic text-viking-paper/80">Alle får stemme. Får kandidaten flertall, overtar hen roret.</p>
        <div className="w-full max-w-sm space-y-2">
          {candidates.map((mid) => (
            <button key={mid} onClick={() => startTing(mid)} data-testid={`ting-candidate-${mid}`}
              className="w-full rounded-lg border-2 border-viking-gold/40 px-5 py-3 font-cinzel text-viking-gold hover:border-viking-gold hover:bg-viking-gold/10">
              {memberLabel(mid)}
            </button>
          ))}
        </div>
        <button onClick={() => setProposingTing(false)} className="mt-6 font-inter text-sm text-viking-gold-soft/70 hover:text-viking-gold-soft">Avbryt</button>
      </div>
    );
  }

  // Flytende «Kall inn Tinget»-knapp — også tilgjengelig midt i et kulturmøte (men ikke under terningkast).
  const tingFab = isOnline && memberIds.length >= 2 ? (
    <button
      onClick={() => setProposingTing(true)}
      disabled={!canCallTing}
      data-testid="ting-call-fab"
      title={canCallTing ? 'Kall inn Tinget' : (tingCooldownLeft > 0 ? `Tinget kan kalles inn igjen om ${Math.ceil(tingCooldownLeft / 60000)} min` : rollInProgress ? 'Ikke midt i et terningkast' : 'Ikke akkurat nå')}
      className="fixed bottom-5 left-5 z-40 rounded-full border-2 border-viking-gold bg-viking-surface px-4 py-2 font-cinzel text-sm text-viking-gold shadow-lg hover:bg-viking-gold/15 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span className="inline-flex items-center gap-1.5"><Icon name="tiwaz" size={14} /> Tinget</span>
    </button>
  ) : null;

  if (activeDest) {
    return (
      <>
      <EncounterFlow
        destination={activeDest}
        onComplete={(apply) => {
          applyOutcome(apply);
          // Sabotør (§3 trinn 2): logg agenda-utfallet ved forsegling (kun høvding, online).
          // Per-elev-ære AVLEDES av denne loggen — ingen skriv til medlemsnoden.
          if (isOnline && isChief) {
            const enc = syncedGroup?.encounter;
            if (enc?.keyCard?.kind === 'agenda') {
              const ag = (AGENDA_CARDS[enc.destId] ?? []).find((c) => c.id === enc.keyCard!.cardId);
              if (ag) {
                const adv = enc.advice ?? {};
                const vigilantIds = memberIds.filter((id) => { const c = adv[id]?.choiceId; return !!c && c !== ag.pushChoiceId; });
                const entry = { destId: enc.destId, agentId: enc.keyCard.holderId, pushChoiceId: ag.pushChoiceId, succeeded: enc.choiceId === ag.pushChoiceId, vigilantIds };
                patchGroup(session.gameCode, myGroupId, { agendaLog: [...(syncedGroup?.agendaLog ?? []), entry] }).catch(() => {});
              }
            }
          }
          setActiveDest(null);
        }}
        onExit={() => isChief && setActiveDest(null)}
        onRequestApproval={session.mode === 'online'
          ? (destId, taskTitle) => requestApproval(session.gameCode, myGroupId, { destId, taskTitle, shipName: setup.shipName }).catch(() => {})
          : undefined}
        approval={isOnline ? myApproval : null}
        isChief={isChief}
        requireSaga={requireSaga}
        requirePerspective={requirePerspective}
        requireBridge={requireBridge}
        requireQuiz={requireQuiz}
        requireCouncil={requireCouncil}
        myMemberId={myMemberId}
        memberIds={memberIds}
        onGiveAdvice={isOnline ? (advice) => setEncounterAdvice(session.gameCode, myGroupId, myMemberId, advice).catch(() => {}) : undefined}
        textLength={displayTextLength}
        onToggleTextLength={togglePersonalTextLength}
        saga={state.saga ?? []}
        svennebrev={state.svennebrev}
        crewRoles={crewRoles}
        syncedEncounter={isOnline ? syncedGroup?.encounter ?? null : null}
        onUpdateEncounter={isOnline && isChief
          ? (partial) => {
              const merged = { ...(syncedGroup?.encounter ?? { destId: activeDest.id, step: 'history' as const }), ...partial };
              patchGroup(session.gameCode, myGroupId, { encounter: merged }).catch(() => {});
            }
          : undefined}
      />
      {tingFab}
      </>
    );
  }

  if (activeSkill) {
    return (
      <Svenneprove
        skill={activeSkill}
        brev={state.svennebrev[activeSkill] ?? 0}
        visited={state.visited}
        isChief={isChief}
        onPass={(brev) => { setSkillLevel(activeSkill, brev); setActiveSkill(null); }}
        onClose={() => setActiveSkill(null)}
      />
    );
  }

  if (showCeremony) {
    const acceptedTradesCount = Object.values(trades).filter(
      (t) => t.status === 'accepted' && (t.fromGroupId === myGroupId || t.toGroupId === myGroupId),
    ).length;
    return (
      <EndCeremony
        setup={setup}
        scores={state.scores}
        svennebrev={state.svennebrev}
        saga={state.saga ?? []}
        destinations={destinations}
        acceptedTradesCount={acceptedTradesCount}
        honors={deriveHonors(syncedGroup?.agendaLog ?? [], memberIds)
          .filter((h) => h.vigilant > 0 || h.agentWins > 0)
          .map((h) => ({ label: memberLabel(h.id), vigilant: h.vigilant, agentWins: h.agentWins }))}
        onClose={() => setShowCeremony(false)}
      />
    );
  }

  // Sekundærtallene står ved siden av kjernestatusen (Kulturforståelse) — bevisst hierarki.
  const secondaryStats = [
    { label: 'Handelsutbytte', v: state.scores.tradeGain, icon: TRADE_PNG, material: 'tre' as const },
    { label: 'Rykte', v: state.scores.reputation, icon: 'ikon-rykte', material: 'jern' as const },
  ];

  return (
    <div className="min-h-screen viking-screen-sea text-viking-paper p-6">
      <ConnectionBanner active={session.mode === 'online'} />
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4 pb-4">
          <EngravedShip name="skip-avatar" size={120} />
          <div className="flex-1">
            <h1 className="font-saga text-4xl leading-tight text-viking-brass">{setup.shipName}</h1>
            <p className="font-inter text-sm text-viking-gold-soft">{SYMBOL_LABEL[setup.shipSymbol]} · {state.visited.length}/{destinations.length} destinasjoner besøkt</p>
            <p className="mt-1.5">
              {session.mode === 'online' ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-viking-moss/60 bg-viking-moss/15 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-viking-moss" data-testid="mode-badge">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-viking-moss" />
                  Online · {session.gameCode}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-viking-gold-soft/40 bg-viking-darkblue/40 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-viking-gold-soft/80" data-testid="mode-badge">
                  <span className="h-1.5 w-1.5 rounded-full bg-viking-gold-soft/60" />
                  Offline-modus
                </span>
              )}
            </p>
          </div>
        </div>
        <BraidDivider className="mb-6" height={11} />

        {/* Mannskapet — kun online, med høvding-badge og «Gi roret»-knapper */}
        {isOnline && memberIds.length > 0 && (
          <div className="mb-6 rounded-lg border-2 border-viking-gold/40 bg-viking-surface p-4" data-testid="crew-panel">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-cinzel text-sm text-viking-gold-soft">Mannskapet ombord</p>
              <p className="font-mono text-xs text-viking-gold-soft" data-testid="crew-count">{memberIds.length} {memberIds.length === 1 ? 'medlem' : 'medlemmer'}</p>
            </div>
            <ul className="space-y-1">
              {memberIds.map((mid) => {
                const isThisChief = chiefId === mid;
                const isMe = mid === myMemberId;
                return (
                  <li key={mid} className="flex items-center justify-between rounded border border-viking-gold/20 bg-viking-darkblue/30 px-2 py-1.5">
                    <span className="font-inter text-sm text-viking-paper">
                      {isMe ? 'Du' : `Medlem ${mid.slice(2, 6)}`}
                      {isThisChief && <span className="ml-2 inline-flex items-center gap-1 bg-viking-gold/20 px-1.5 py-0.5 font-mono text-[10px] uppercase text-viking-gold" data-testid={`chief-badge-${mid}`}><Icon name="anchor" size={10} /> Høvding</span>}
                    </span>
                    {isChief && !isThisChief && (
                      <button
                        onClick={() => transferChief(session.gameCode, myGroupId, mid).catch(() => {})}
                        data-testid={`give-roret-${mid}`}
                        className="rounded border border-viking-gold/40 px-2 py-0.5 font-cinzel text-xs text-viking-gold-soft hover:border-viking-gold hover:text-viking-gold"
                      >
                        Gi roret
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
            {!isChief && (
              <p className="mt-2 text-center font-cinzel text-xs text-viking-gold-soft" data-testid="spectator-banner">
                <Icon name="anchor" size={12} className="mr-1 inline" /> Høvdingen styrer skipet — dere ser med
              </p>
            )}
            {/* Tinget: hvilket som helst medlem kan kalle inn en avstemning om ny høvding */}
            <div className="mt-3 border-t border-viking-gold/20 pt-3 text-center">
              <button
                onClick={() => setProposingTing(true)}
                disabled={!canCallTing}
                data-testid="ting-call-button"
                className="rounded-md border-2 border-viking-gold/60 px-4 py-1.5 font-cinzel text-sm text-viking-gold-soft hover:border-viking-gold hover:text-viking-gold disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="inline-flex items-center gap-1.5">Kall inn Tinget <Icon name="tiwaz" size={13} /></span>
              </button>
              {!canCallTing && (
                <p className="mt-1 font-inter text-[11px] italic text-viking-gold-soft/60">
                  {tingCooldownLeft > 0 ? `Kan kalles inn igjen om ${Math.ceil(tingCooldownLeft / 60000)} min`
                    : rollInProgress ? 'Ikke midt i et terningkast'
                    : activeTrial ? 'Ikke under Gudenes prøve'
                    : 'Krever minst to medlemmer'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Poeng — bevisst asymmetri: kjernestatusen (Kulturforståelse) dominerer,
            sekundærtallene står mindre ved siden av. Ikke en jevn 3-kolonners grid. */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-stretch">
          {/* Hero: Kulturforståelse — spillets pedagogiske kjerne på pergament (kunnskap),
              med mørk blekk-tekst. Størst vekt, venstrejustert. */}
          <MaterialPanel material="pergament" framed className="relative flex-1 overflow-hidden p-5 sm:flex-[1.8]" data-testid="stat-hero">
            <span aria-hidden className="pointer-events-none absolute -right-5 -top-4 text-viking-rust/15">
              <NorseIcon name="ikon-kultur" size={132} />
            </span>
            <p className="font-saga text-base uppercase tracking-[0.18em] text-viking-rust">Kulturforståelse</p>
            <p className="mt-1 font-cinzel text-6xl font-bold leading-none text-[#5C3E22]">{state.scores.culturalUnderstanding}</p>
            <p className="mt-2 max-w-[22ch] font-inter text-[11px] italic leading-snug text-viking-darkblue/70">Respekt, læring og tilpasning — reisens egentlige mål.</p>
          </MaterialPanel>
          {/* Sekundærtall: handel (tre) + rykte (jern) — materiale per innholdstype */}
          <div className="flex gap-3 sm:flex-1 sm:flex-col">
            {secondaryStats.map((s) => (
              <MaterialPanel key={s.label} material={s.material} className="flex flex-1 items-baseline justify-between gap-2 px-3 py-2.5 sm:flex-col sm:items-start sm:justify-center" data-testid="stat-secondary">
                <p className="inline-flex items-center gap-1.5 font-saga text-sm uppercase tracking-wide text-viking-gold-soft">
                  <NorseIcon name={s.icon} size={14} /> {s.label}
                </p>
                <p className="font-cinzel text-3xl font-bold leading-none text-viking-gold">{s.v}</p>
              </MaterialPanel>
            ))}
          </div>
        </div>

        {/* Handelsvarer — smalere lag-stripe oppå poengene, venstrestilt (ikke full bredde) */}
        <div className="mb-6 sm:max-w-md">
          <TradeGoodsPanel goods={state.goods ?? {}} />
        </div>

        {/* Svenneprøver — fast panel så funksjonen er synlig og lett å finne */}
        <SvennepoverPanel
          destinations={destinations}
          svennebrev={state.svennebrev}
          isChief={isChief}
          onStartSvenneprove={(_destId, skill) => setActiveSkill(skill)}
        />

        {/* "Hva kan vi gjøre?"-panel — forklarer ressurser og viser muligheter */}
        <HvaKanViGjorePanel
          destinations={destinations}
          scores={state.scores}
          svennebrev={state.svennebrev}
          goods={state.goods ?? {}}
          visited={state.visited}
          locked={state.locked}
          unlockedSides={state.unlockedSides ?? []}
        />

        {/* Domener (jern) — trykk for å ta svenneprøven (sveinn → mester) */}
        <MaterialPanel material="jern" framed className="mb-6 p-3">
        <p className="mb-2 font-inter text-xs text-viking-gold-soft">Svennebrev{isChief ? ' — trykk et domene for å ta svenneprøven' : ''}</p>
        <div className="flex flex-wrap gap-2">
          {SKILL_KEYS.map((key) => {
            const brev = state.svennebrev[key] ?? 0;
            const eligible = (brev === 0 || brev === 1) && isChief;
            return (
              <button
                key={key}
                disabled={!eligible}
                onClick={() => setActiveSkill(key)}
                title={eligible ? (brev === 0 ? 'Ta sveinn-svenneprøven' : 'Ta mester-svenneprøven') : brev >= 2 ? 'Mester (fullført)' : !isChief ? 'Kun høvdingen kan starte prøven' : 'Ikke tilgjengelig'}
                className={`flex items-center gap-2 rounded-full border-2 px-3 py-1 transition-all ${brev > 0 ? 'border-viking-gold/60 bg-viking-gold/10' : 'border-viking-gold/20 opacity-60'} ${eligible ? 'cursor-pointer hover:border-viking-gold hover:bg-viking-gold/20' : 'cursor-default'}`}
              >
                <NorseIcon name={SKILL_PNG[key]} size={16} className="text-viking-gold-soft" />
                <span className="font-inter text-xs text-viking-paper/90">{skillTreeData[key].name}</span>
                <span className="font-mono text-xs text-viking-gold">{brev === 0 ? '—' : brev === 1 ? 'sveinn' : 'mester'}</span>
                {eligible && <Icon name="axe" size={12} className="text-viking-gold" />}
              </button>
            );
          })}
        </div>
        </MaterialPanel>

        {/* Gruppe-styrt tekstlengde — vises bare når lærer har valgt "La gruppene velge" */}
        {isOnline && teacherTextLength === 'group' && (
          <div className="mb-3 flex items-center justify-between rounded-md border border-viking-gold/40 bg-viking-darkblue/40 px-3 py-2" data-testid="group-text-length">
            <span className="inline-flex items-center gap-1.5 font-cinzel text-xs text-viking-gold-soft"><Icon name="book" size={13} /> Tekstlengde:</span>
            <div className="flex gap-1">
              <button
                onClick={() => setGroupTextLength('full')}
                disabled={!isChief}
                data-testid="set-text-full"
                className={`rounded px-2 py-0.5 font-cinzel text-xs ${effectiveTextLength === 'full' ? 'bg-viking-gold text-viking-darkblue' : 'border border-viking-gold/40 text-viking-gold-soft hover:border-viking-gold disabled:opacity-50'}`}
              >Full</button>
              <button
                onClick={() => setGroupTextLength('short')}
                disabled={!isChief}
                data-testid="set-text-short"
                className={`rounded px-2 py-0.5 font-cinzel text-xs ${effectiveTextLength === 'short' ? 'bg-viking-gold text-viking-darkblue' : 'border border-viking-gold/40 text-viking-gold-soft hover:border-viking-gold disabled:opacity-50'}`}
              >Kort</button>
            </div>
          </div>
        )}

        {/* Saga-knapp — les vår egen reisefortelling så langt */}
        {(state.saga?.length ?? 0) > 0 && (
          <div className="mb-3">
            <button
              onClick={() => setShowOwnSaga(true)}
              data-testid="open-own-saga"
              className="inline-flex w-full items-center justify-center gap-2 border-2 border-viking-gold/60 bg-viking-darkblue/60 px-4 py-2 font-cinzel text-viking-gold-soft hover:border-viking-gold hover:text-viking-gold"
            >
              <Icon name="scroll" size={16} /> Les vår saga ({state.saga.length} {state.saga.length === 1 ? 'kapittel' : 'kapitler'})
            </button>
          </div>
        )}

        {/* Handelstorg-knapp (kun online — krever andre grupper) */}
        {isOnline && (
          <div className="mb-4">
            <button
              onClick={() => setShowTradeMarket(true)}
              data-testid="open-trade-market"
              className="relative inline-flex w-full items-center justify-center gap-2 border-2 border-viking-gold/60 bg-viking-darkblue/60 px-4 py-2.5 font-cinzel text-viking-gold hover:border-viking-gold hover:bg-viking-darkblue/80"
            >
              <Icon name="market" size={16} /> Handelstorg — bytt varer med andre skip
              {incomingPending > 0 && (
                <span data-testid="incoming-badge" className="ml-2 rounded-full bg-viking-crimson px-2 py-0.5 font-mono text-xs text-viking-paper">
                  {incomingPending} nye tilbud
                </span>
              )}
            </button>
          </div>
        )}

        {/* Sjøkartet er reisens midtpunkt — venstrestilt overskrift + kortet bryter
            ut bredere enn de øvrige panelene, så tyngden ligger her (tilsiktet hierarki). */}
        <SectionEyebrow>Sjøkartet — velg neste havn</SectionEyebrow>
        <div className="mb-8 -mx-2 sm:-mx-6">
          <SeaJourney
            destinations={destinations}
            visited={state.visited}
            locked={state.locked}
            goods={state.goods ?? {}}
            svennebrev={state.svennebrev}
            scores={state.scores}
            unlockedSides={state.unlockedSides ?? []}
            performedActions={state.performedActions ?? []}
            ship={{ color: setup.shipColor, symbol: setup.shipSymbol, name: setup.shipName }}
            isChief={isChief}
            previewDestId={previewDestId}
            sailingTo={sailingTo}
            onSelect={setPreviewDestId}
            onConfirm={confirmSailingTo}
            onStartSvenneprove={(_destId, skill) => setActiveSkill(skill)}
            onPerformAction={performAction}
          />
        </div>

        {/* Sluttseremoni når hele reisen er fullført */}
        {state.visited.length === destinations.length && (
          <button
            onClick={() => setShowCeremony(true)}
            className="mb-8 inline-flex w-full items-center justify-center gap-2 border-2 border-viking-gold bg-viking-gold px-6 py-4 font-saga text-xl font-bold text-viking-darkblue transition-all hover:bg-viking-gold-soft hover:scale-[1.01]"
          >
            <Icon name="anchor" size={22} /> Seil hjem til Avaldsnes
          </button>
        )}

        {/* §7.2 Sjøslag (kun online — krever andre grupper) */}
        {session.mode === 'online' && (
          <div className="mb-8">
            <SeaBattle code={session.gameCode} myGroupId={myGroupId} myShipName={setup.shipName} mySkills={state.svennebrev} onResult={addReward} />
          </div>
        )}

        {/* Dev-modus */}
        <div className="rounded-lg border-2 border-viking-plum/60 bg-viking-plum/15 p-5">
          <h3 className="mb-3 font-cinzel text-lg text-viking-plum">Utvikler-modus</h3>
          <div className="flex flex-wrap gap-3">
            <button onClick={resetProgress} className="rounded border-2 border-viking-gold bg-viking-teal px-4 py-2 text-sm font-bold text-viking-paper hover:bg-viking-teal/80">Nullstill reise</button>
            <button onClick={() => setShowCeremony(true)} className="rounded border-2 border-viking-gold bg-viking-gold/80 px-4 py-2 text-sm font-bold text-viking-darkblue hover:bg-viking-gold">Sluttseremoni</button>
            <button onClick={onResetSetup} className="rounded border-2 border-viking-gold bg-viking-rust px-4 py-2 text-sm font-bold text-viking-paper hover:bg-viking-rust/80">Start oppsett på nytt</button>
            <button onClick={() => { if (session.mode === 'online' && session.groupId && isChief && memberIds.length <= 1) removeGroup(session.gameCode, session.groupId).catch(() => {}); onLeaveGame(); }} className="rounded border-2 border-viking-gold bg-viking-crimson px-4 py-2 text-sm font-bold text-viking-paper hover:bg-viking-crimson/80">Forlat spill</button>
            <button onClick={onSwitchRole} className="rounded border-2 border-viking-gold bg-viking-plum px-4 py-2 text-sm font-bold text-viking-paper hover:bg-viking-plum/80">Bytt rolle</button>
          </div>
        </div>
      </div>

      {/* Engangs-forklaringer — bobler nederst når gruppa møter et nytt konsept */}
      <HintToast hint={activeHint ? HINTS[activeHint] : null} onDismiss={() => setActiveHint(null)} />
    </div>
  );
}

/**
 * Venstrejustert seksjonsoverskrift med en vertikal gull-runesøyle. Bryter opp den
 * sentrerte, jevne stablingen og gir tilsiktet hierarki uten å bli støyende.
 */
function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-2.5">
      <span aria-hidden className="h-5 w-1 rounded-full bg-viking-gold/70" />
      <h2 className="font-cinzel text-sm uppercase tracking-[0.18em] text-viking-gold-soft">{children}</h2>
    </div>
  );
}
