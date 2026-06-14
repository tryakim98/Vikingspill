/**
 * GameDashboard.tsx
 * Lett fase-1-dashbord: poeng (kulturforståelse/handel/rykte), ferdigheter, og en
 * destinasjonsliste som inngang til encounter-flyten. Fullt kart + animasjoner
 * (§8.1) kommer senere. Rendres kun med en gyldig gruppe (gyldig hooks-bruk).
 */

import { useState, useEffect, useRef } from 'react';
import type { Destination, SkillKey } from '../../types';
import { destinations, skillTreeData } from '../../data';
import { useGameState } from '../../hooks/useGameState';
import type { GroupSetup } from '../../hooks/useGroupSetup';
import VikingShip from '../ship/VikingShip';
import EncounterFlow from '../encounter/EncounterFlow';
import SkillTrial from '../skilltree/SkillTrial';
import EndCeremony from '../ceremony/EndCeremony';
import SeaJourney, { SAILING_DURATION_S } from './SeaJourney';
import TradeGoodsPanel from './TradeGoodsPanel';
import SvenneproveTrial from './SvenneproveTrial';
import SvennepoverPanel from './SvennepoverPanel';
import HintToast from './HintToast';
import HvaKanViGjorePanel from './HvaKanViGjorePanel';
import { HINTS, type HintKey } from '../../data/firstTimeHints';
import { isAccessible } from '../../lib/unlocks';
import TradeMarket from './TradeMarket';
import type { Session } from '../../hooks/useSession';
import { removeGroup, requestApproval, subscribeGroup, subscribeGroups, patchGroup, transferChief, subscribeTrial, subscribeTrialResult, subscribeFate, subscribeTideTurn, subscribeRagnarok, subscribeTrades, createTradeOffer, acceptTrade, declineTrade, cancelTrade, subscribeGameSettings, type SyncedGroup, type Trial, type TrialResult, type FateEvent, type TideTurn, type RagnarokEvent, type TradeOffer, type GameSettings } from '../../lib/gameSync';
import SagaReader from '../saga/SagaReader';
import { chapters, chapterCompleted } from '../../data/chapters';
import GudenesProveOverlay from '../trial/GudenesProveOverlay';
import SeaBattle from '../duel/SeaBattle';
import FateCardOverlay from '../fate/FateCardOverlay';
import TideBanner from '../tide/TideBanner';
import TideTurnOverlay from '../tide/TideTurnOverlay';
import RagnarokOverlay from '../ragnarok/RagnarokOverlay';
import LoadingScreen from '../common/LoadingScreen';
import ConnectionBanner from '../common/ConnectionBanner';
import { playMusic, duckMusic, stopMusic } from '../../lib/music';
import { playSound } from '../../lib/sound';
import { SkjebneMoteModal } from '../skjebnemote/SkjebneMoteModal';
import { shouldTriggerSkjebneMote, pickSkjebneMote, getSkjebneMoteById, rollSkjebne, type SkjebneMoteChoice, type SkjebneEffects, type RollResult } from '../../data/skjebnemoter';

const SKILL_KEYS: SkillKey[] = ['språk', 'sjømannskap', 'krigskunst', 'diplomati', 'tro'];
const SYMBOL_LABEL: Record<string, string> = { drage: '🐉 Drage', ulv: '🐺 Ulv', ravn: '🐦‍⬛ Ravn' };

interface Props {
  setup: GroupSetup;
  session: Session;
  onResetSetup: () => void;
  onLeaveGame: () => void;
  onSwitchRole: () => void;
}

export default function GameDashboard({ setup, session, onResetSetup, onLeaveGame, onSwitchRole }: Props) {
  const { state, applyOutcome, setSkillLevel, addReward, applyFateEffect, unlockSide, performAction, resetProgress } = useGameState(setup, session);
  const [svenneprove, setSvenneprove] = useState<{ destId: string; skill: SkillKey } | null>(null);

  // I online-modus er gruppe-tilstanden delt blant alle medlemmer. Vi lytter på hele
  // gruppe-noden her (parallelt med useGameState) for å få chief-status, medlemsliste
  // og synket UI-tilstand (aktiv destinasjon m.m.).
  const isOnline = session.mode === 'online' && !!session.groupId;
  const myGroupId = session.groupId ?? '';

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
  const requireSaga = !!gameSettings.requireSaga;
  const requirePerspective = !!gameSettings.requirePerspective;
  const requireBridge = !!gameSettings.requireBridge;
  const requireQuiz = gameSettings.requireQuiz !== false; // default PÅ — stedsquizen er obligatorisk
  const [showOwnSaga, setShowOwnSaga] = useState(false);

  const [syncedGroup, setSyncedGroup] = useState<SyncedGroup | null>(null);

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
  const chiefId = syncedGroup?.chiefId;
  const isChief = !isOnline || chiefId === myMemberId || !chiefId;
  const members = syncedGroup?.members ?? {};
  const memberIds = Object.keys(members);

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
        patchGroup(session.gameCode, myGroupId, {
          activeDestId: destId,
          encounter: { destId, step: 'history' },
          sailingTo: null,
        }).catch(() => {});
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
      const skillLevel = choice.roll.skill ? (state?.skills[choice.roll.skill] ?? 0) : 0;
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

  // Aktiv verdighetsprøve og sluttseremoni: synket i online, lokal ellers.
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
  const [activeFate, setActiveFate] = useState<FateEvent | null>(null);
  const seenFate = useRef<string | null>(null);
  const [activeTideTurn, setActiveTideTurn] = useState<TideTurn | null>(null);
  const seenTideTurn = useRef<string | null>(null);
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

  // Tidevannet snur (§6.5): grupper som ikke har fullført kapitlet mister handelspoeng.
  useEffect(() => {
    if (session.mode !== 'online') return;
    let first = true;
    const unsub = subscribeTideTurn(session.gameCode, (turn) => {
      if (first) { first = false; seenTideTurn.current = turn?.id ?? null; return; }
      if (turn && turn.id !== seenTideTurn.current) { seenTideTurn.current = turn.id; setActiveTideTurn(turn); }
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
    const anySkill = Object.values(state.skills).some((lvl) => (lvl ?? 0) > 0);
    if (anySkill) triggerHint('reward-skill');
    const anyGoods = Object.values(state.goods ?? {}).some((n) => (n ?? 0) > 0);
    if (anyGoods) triggerHint('reward-goods');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.scores.culturalUnderstanding, state?.scores.tradeGain, state?.scores.reputation, JSON.stringify(state?.skills), JSON.stringify(state?.goods)]);

  // Locked-system hint: utløses første gang gruppa preview-er et sidested de IKKE
  // har tilgang til ennå.
  useEffect(() => {
    if (!state || !previewDestId) return;
    const dest = destinations.find((d) => d.id === previewDestId);
    if (!dest) return;
    if (dest.route === 'side' && !isAccessible(dest, { scores: state.scores, skills: state.skills, goods: state.goods ?? {}, locked: state.locked, unlockedSides: state.unlockedSides ?? [] })) {
      triggerHint('locked-system');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewDestId]);

  if (!state) return <LoadingScreen text="Henter skipets logg …" />;

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

  if (svenneprove) {
    const dest = destinations.find((d) => d.id === svenneprove.destId);
    return (
      <SvenneproveTrial
        skill={svenneprove.skill}
        destName={dest?.name ?? svenneprove.destId}
        visited={state.visited}
        isChief={isChief}
        onPass={() => { unlockSide(svenneprove.destId); setSvenneprove(null); }}
        onClose={() => setSvenneprove(null)}
      />
    );
  }

  if (activeTrial) {
    // Vis bare dommen hvis den matcher den aktive prøven (ellers er det en gammel rest).
    const matchedResult = trialResult && trialResult.trialId === activeTrial.id ? trialResult : null;
    return (
      <GudenesProveOverlay
        navn={activeTrial.navn}
        desc={activeTrial.desc}
        skill={activeTrial.skill}
        skillLevel={state.skills[activeTrial.skill] ?? 0}
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
      : (state.skills[activeFate.condition?.skill ?? 'tro'] ?? 0) < (activeFate.condition?.below ?? 0);
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

  if (activeTideTurn) {
    const affected = !chapterCompleted(activeTideTurn.chapterIndex, state.visited);
    return (
      <TideTurnOverlay
        chapterNavn={chapters[activeTideTurn.chapterIndex]?.navn ?? ''}
        affected={affected}
        penalty={activeTideTurn.penaltyTrade}
        onDone={() => {
          if (affected) addReward({ und: 0, trade: -activeTideTurn.penaltyTrade, rep: 0 });
          setActiveTideTurn(null);
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

  if (activeDest) {
    return (
      <EncounterFlow
        destination={activeDest}
        skills={state.skills}
        onComplete={(apply) => { applyOutcome(apply); setActiveDest(null); }}
        onExit={() => isChief && setActiveDest(null)}
        onRequestApproval={session.mode === 'online'
          ? (destId, taskTitle) => requestApproval(session.gameCode, myGroupId, { destId, taskTitle, shipName: setup.shipName }).catch(() => {})
          : undefined}
        isChief={isChief}
        lateGame={state.visited.length >= 6}
        requireSaga={requireSaga}
        requirePerspective={requirePerspective}
        requireBridge={requireBridge}
        requireQuiz={requireQuiz}
        textLength={effectiveTextLength}
        syncedEncounter={isOnline ? syncedGroup?.encounter ?? null : null}
        onUpdateEncounter={isOnline && isChief
          ? (partial) => {
              const merged = { ...(syncedGroup?.encounter ?? { destId: activeDest.id, step: 'history' as const }), ...partial };
              patchGroup(session.gameCode, myGroupId, { encounter: merged }).catch(() => {});
            }
          : undefined}
      />
    );
  }

  if (activeSkill) {
    return (
      <SkillTrial
        skill={activeSkill}
        level={state.skills[activeSkill] ?? 0}
        visited={state.visited}
        onPass={(lvl) => { setSkillLevel(activeSkill, lvl); setActiveSkill(null); }}
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
        skills={state.skills}
        saga={state.saga ?? []}
        destinations={destinations}
        acceptedTradesCount={acceptedTradesCount}
        onClose={() => setShowCeremony(false)}
      />
    );
  }

  const stats = [
    { label: 'Kulturforståelse', v: state.scores.culturalUnderstanding },
    { label: 'Handelsutbytte', v: state.scores.tradeGain },
    { label: 'Rykte', v: state.scores.reputation },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-viking-darkblue to-viking-surface text-viking-paper p-6">
      <ConnectionBanner active={session.mode === 'online'} />
      <div className="mx-auto max-w-3xl">
        {/* §6.5 Tidevanns-nedtelling (kun online — læreren styrer timeren) */}
        {session.mode === 'online' && <TideBanner code={session.gameCode} />}

        {/* Header */}
        <div className="mb-6 flex items-center gap-4 border-b-4 border-viking-gold pb-5">
          <VikingShip color={setup.shipColor} symbol={setup.shipSymbol} size={96} />
          <div className="flex-1">
            <h1 className="font-cinzel text-3xl text-viking-gold">{setup.shipName}</h1>
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
                      {isThisChief && <span className="ml-2 rounded bg-viking-gold/20 px-1.5 py-0.5 font-mono text-[10px] uppercase text-viking-gold" data-testid={`chief-badge-${mid}`}>⚓ Høvding</span>}
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
                ⚓ Høvdingen styrer skipet — dere ser med
              </p>
            )}
          </div>
        )}

        {/* Poeng */}
        <div className="mb-4 grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border-2 border-viking-gold/40 bg-viking-surface p-3 text-center">
              <p className="font-mono text-xs text-viking-gold-soft">{s.label}</p>
              <p className="font-cinzel text-3xl font-bold text-viking-gold">{s.v}</p>
            </div>
          ))}
        </div>

        {/* Handelsvarer — lag oppå poengene */}
        <div className="mb-6">
          <TradeGoodsPanel goods={state.goods ?? {}} />
        </div>

        {/* Svenneprøver — fast panel så funksjonen er synlig og lett å finne */}
        <SvennepoverPanel
          destinations={destinations}
          unlockedSides={state.unlockedSides ?? []}
          isChief={isChief}
          onStartSvenneprove={(destId, skill) => setSvenneprove({ destId, skill })}
        />

        {/* "Hva kan vi gjøre?"-panel — forklarer ressurser og viser muligheter */}
        <HvaKanViGjorePanel
          destinations={destinations}
          scores={state.scores}
          skills={state.skills}
          goods={state.goods ?? {}}
          visited={state.visited}
          locked={state.locked}
          unlockedSides={state.unlockedSides ?? []}
        />

        {/* Ferdigheter — trykk en på nivå 1–2 for å ta verdighetsprøven (§3.2) */}
        <p className="mb-2 font-inter text-xs text-viking-gold-soft/70">Ferdigheter{isChief ? ' — trykk en med ⚔ for å ta verdighetsprøven' : ''}</p>
        <div className="mb-6 flex flex-wrap gap-2">
          {SKILL_KEYS.map((key) => {
            const lvl = state.skills[key] ?? 0;
            const eligible = (lvl === 1 || lvl === 2) && isChief;
            return (
              <button
                key={key}
                disabled={!eligible}
                onClick={() => setActiveSkill(key)}
                title={eligible ? 'Ta verdighetsprøven' : lvl >= 3 ? 'Mester (maks nivå)' : !isChief ? 'Kun høvdingen kan starte prøven' : 'Ikke låst opp ennå'}
                className={`flex items-center gap-2 rounded-full border-2 px-3 py-1 transition-all ${lvl > 0 ? 'border-viking-gold/60 bg-viking-gold/10' : 'border-viking-gold/20 opacity-60'} ${eligible ? 'cursor-pointer hover:border-viking-gold hover:bg-viking-gold/20' : 'cursor-default'}`}
              >
                <span style={{ color: skillTreeData[key].color }}>{skillTreeData[key].icon}</span>
                <span className="font-inter text-xs text-viking-paper/90">{skillTreeData[key].name}</span>
                <span className="font-mono text-xs text-viking-gold">{lvl}</span>
                {eligible && <span className="text-xs">⚔</span>}
              </button>
            );
          })}
        </div>

        {/* Gruppe-styrt tekstlengde — vises bare når lærer har valgt "La gruppene velge" */}
        {isOnline && teacherTextLength === 'group' && (
          <div className="mb-3 flex items-center justify-between rounded-md border border-viking-gold/40 bg-viking-darkblue/40 px-3 py-2" data-testid="group-text-length">
            <span className="font-cinzel text-xs text-viking-gold-soft">📖 Tekstlengde:</span>
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
              className="w-full rounded-lg border-2 border-viking-gold/60 bg-viking-darkblue/60 px-4 py-2 font-cinzel text-viking-gold-soft hover:border-viking-gold hover:text-viking-gold"
            >
              📜 Les vår saga ({state.saga.length} {state.saga.length === 1 ? 'kapittel' : 'kapitler'})
            </button>
          </div>
        )}

        {/* Handelstorg-knapp (kun online — krever andre grupper) */}
        {isOnline && (
          <div className="mb-4">
            <button
              onClick={() => setShowTradeMarket(true)}
              data-testid="open-trade-market"
              className="relative w-full rounded-lg border-2 border-viking-gold/60 bg-viking-darkblue/60 px-4 py-2.5 font-cinzel text-viking-gold hover:border-viking-gold hover:bg-viking-darkblue/80"
            >
              🏛 Handelstorg — bytt varer med andre skip
              {incomingPending > 0 && (
                <span data-testid="incoming-badge" className="ml-2 rounded-full bg-viking-crimson px-2 py-0.5 font-mono text-xs text-viking-paper">
                  {incomingPending} nye tilbud
                </span>
              )}
            </button>
          </div>
        )}

        {/* Interaktivt sjøkart erstatter destinasjonslisten */}
        <div className="mb-8">
          <SeaJourney
            destinations={destinations}
            visited={state.visited}
            locked={state.locked}
            goods={state.goods ?? {}}
            skills={state.skills}
            scores={state.scores}
            unlockedSides={state.unlockedSides ?? []}
            performedActions={state.performedActions ?? []}
            ship={{ color: setup.shipColor, symbol: setup.shipSymbol, name: setup.shipName }}
            isChief={isChief}
            previewDestId={previewDestId}
            sailingTo={sailingTo}
            onSelect={setPreviewDestId}
            onConfirm={confirmSailingTo}
            onStartSvenneprove={(destId, skill) => setSvenneprove({ destId, skill })}
            onPerformAction={performAction}
          />
        </div>

        {/* Sluttseremoni når hele reisen er fullført */}
        {state.visited.length === destinations.length && (
          <button
            onClick={() => setShowCeremony(true)}
            className="mb-8 w-full rounded-lg border-2 border-viking-gold bg-viking-gold px-6 py-4 font-cinzel text-xl font-bold text-viking-darkblue transition-all hover:bg-viking-gold-soft hover:scale-[1.01]"
          >
            ⚓ Seil hjem til Avaldsnes
          </button>
        )}

        {/* §7.2 Sjøslag (kun online — krever andre grupper) */}
        {session.mode === 'online' && (
          <div className="mb-8">
            <SeaBattle code={session.gameCode} myGroupId={myGroupId} myShipName={setup.shipName} mySkills={state.skills} onResult={addReward} />
          </div>
        )}

        {/* Dev-modus */}
        <div className="rounded-lg border-2 border-viking-plum/60 bg-viking-plum/15 p-5">
          <h3 className="mb-3 font-cinzel text-lg text-viking-plum">👨‍💻 Utvikler-modus</h3>
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
