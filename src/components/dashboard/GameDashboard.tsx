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
import type { Session } from '../../hooks/useSession';
import { removeGroup, requestApproval, subscribeTrial, subscribeFate, subscribeTideTurn, subscribeRagnarok, type Trial, type FateEvent, type TideTurn, type RagnarokEvent } from '../../lib/gameSync';
import { chapters, chapterCompleted } from '../../data/chapters';
import GudenesProveOverlay from '../trial/GudenesProveOverlay';
import SeaBattle from '../duel/SeaBattle';
import FateCardOverlay from '../fate/FateCardOverlay';
import TideBanner from '../tide/TideBanner';
import TideTurnOverlay from '../tide/TideTurnOverlay';
import RagnarokOverlay from '../ragnarok/RagnarokOverlay';

const SKILL_KEYS: SkillKey[] = ['språk', 'sjømannskap', 'krigskunst', 'diplomati', 'tro'];
const SYMBOL_LABEL: Record<string, string> = { drage: '🐉 Drage', ulv: '🐺 Ulv', ravn: '🐦‍⬛ Ravn' };
const DIFFICULTY_COLOR: Record<string, string> = { trygg: '#5B7553', middels: '#D4A843', farlig: '#8B2929' };

interface Props {
  setup: GroupSetup;
  session: Session;
  onResetSetup: () => void;
  onLeaveGame: () => void;
  onSwitchRole: () => void;
}

export default function GameDashboard({ setup, session, onResetSetup, onLeaveGame, onSwitchRole }: Props) {
  const { state, applyOutcome, setSkillLevel, addReward, resetProgress } = useGameState(setup, session);
  const [activeDest, setActiveDest] = useState<Destination | null>(null);
  const [activeSkill, setActiveSkill] = useState<SkillKey | null>(null);
  const [showCeremony, setShowCeremony] = useState(false);
  const [activeTrial, setActiveTrial] = useState<Trial | null>(null);
  const seenTrial = useRef<string | null>(null);
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
      if (trial && trial.id !== seenTrial.current) { seenTrial.current = trial.id; setActiveTrial(trial); }
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

  if (!state) return null;

  if (activeTrial) {
    return (
      <GudenesProveOverlay
        navn={activeTrial.navn}
        desc={activeTrial.desc}
        skill={activeTrial.skill}
        skillLevel={state.skills[activeTrial.skill] ?? 0}
        onDone={() => {
          addReward({ und: 0, trade: 0, rep: 1 + (state.skills[activeTrial.skill] ?? 0) });
          setActiveTrial(null);
        }}
      />
    );
  }

  if (activeFate) {
    const affected = activeFate.targetMode === 'group'
      ? activeFate.targetGroupId === session.groupId
      : (state.skills[activeFate.condition?.skill ?? 'tro'] ?? 0) < (activeFate.condition?.below ?? 0);
    return (
      <FateCardOverlay
        event={activeFate}
        affected={affected}
        onDone={() => {
          if (affected) {
            if (activeFate.effect.kind === 'score') {
              addReward({ und: activeFate.effect.und ?? 0, trade: activeFate.effect.trade ?? 0, rep: activeFate.effect.rep ?? 0 });
            } else {
              setSkillLevel(activeFate.effect.skill, Math.max(0, (state.skills[activeFate.effect.skill] ?? 0) + activeFate.effect.delta));
            }
          }
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

  if (activeDest) {
    return (
      <EncounterFlow
        destination={activeDest}
        skills={state.skills}
        onComplete={(apply) => { applyOutcome(apply); setActiveDest(null); }}
        onExit={() => setActiveDest(null)}
        onRequestApproval={session.mode === 'online'
          ? (destId, taskTitle) => requestApproval(session.gameCode, session.groupId, { destId, taskTitle, shipName: setup.shipName }).catch(() => {})
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
    return (
      <EndCeremony
        setup={setup}
        scores={state.scores}
        skills={state.skills}
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
      <div className="mx-auto max-w-3xl">
        {/* §6.5 Tidevanns-nedtelling (kun online — læreren styrer timeren) */}
        {session.mode === 'online' && <TideBanner code={session.gameCode} />}

        {/* Header */}
        <div className="mb-6 flex items-center gap-4 border-b-4 border-viking-gold pb-5">
          <VikingShip color={setup.shipColor} symbol={setup.shipSymbol} size={96} />
          <div>
            <h1 className="font-cinzel text-3xl text-viking-gold">{setup.shipName}</h1>
            <p className="font-inter text-sm text-viking-gold-soft">{SYMBOL_LABEL[setup.shipSymbol]} · {state.visited.length}/{destinations.length} destinasjoner besøkt</p>
            <p className="mt-1 font-mono text-xs text-viking-gold-soft/70">
              {session.mode === 'online' ? `🟢 Tilkoblet · ${session.gameCode}` : '⚪ Offline-modus'}
            </p>
          </div>
        </div>

        {/* Poeng */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border-2 border-viking-gold/40 bg-viking-surface p-3 text-center">
              <p className="font-mono text-xs text-viking-gold-soft">{s.label}</p>
              <p className="font-cinzel text-3xl font-bold text-viking-gold">{s.v}</p>
            </div>
          ))}
        </div>

        {/* Ferdigheter — trykk en på nivå 1–2 for å ta verdighetsprøven (§3.2) */}
        <p className="mb-2 font-inter text-xs text-viking-gold-soft/70">Ferdigheter — trykk en med ⚔ for å ta verdighetsprøven</p>
        <div className="mb-6 flex flex-wrap gap-2">
          {SKILL_KEYS.map((key) => {
            const lvl = state.skills[key] ?? 0;
            const eligible = lvl === 1 || lvl === 2;
            return (
              <button
                key={key}
                disabled={!eligible}
                onClick={() => setActiveSkill(key)}
                title={eligible ? 'Ta verdighetsprøven' : lvl >= 3 ? 'Mester (maks nivå)' : 'Ikke låst opp ennå'}
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

        {/* Destinasjoner */}
        <h2 className="mb-3 font-cinzel text-xl text-viking-gold">Seilas</h2>
        <div className="mb-8 grid gap-2 sm:grid-cols-2">
          {destinations.map((dest) => {
            const visited = state.visited.includes(dest.id);
            const locked = state.locked.includes(dest.id);
            return (
              <button
                key={dest.id}
                disabled={locked}
                onClick={() => setActiveDest(dest)}
                className={`flex items-center justify-between rounded-lg border-2 px-4 py-3 text-left transition-all ${locked ? 'cursor-not-allowed border-viking-crimson/30 opacity-50' : visited ? 'border-viking-moss/60 bg-viking-moss/10 hover:border-viking-moss' : 'border-viking-gold/40 bg-viking-surface hover:border-viking-gold hover:scale-[1.02]'}`}
              >
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: DIFFICULTY_COLOR[dest.difficulty ?? 'middels'] }} />
                  <span className="font-cinzel text-viking-paper">{dest.name}</span>
                </span>
                <span className="font-mono text-xs text-viking-gold-soft">{locked ? '🔒' : visited ? '✓ besøkt' : '→'}</span>
              </button>
            );
          })}
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
            <SeaBattle code={session.gameCode} myGroupId={session.groupId} myShipName={setup.shipName} mySkills={state.skills} onResult={addReward} />
          </div>
        )}

        {/* Dev-modus */}
        <div className="rounded-lg border-2 border-viking-plum/60 bg-viking-plum/15 p-5">
          <h3 className="mb-3 font-cinzel text-lg text-viking-plum">👨‍💻 Utvikler-modus</h3>
          <div className="flex flex-wrap gap-3">
            <button onClick={resetProgress} className="rounded border-2 border-viking-gold bg-viking-teal px-4 py-2 text-sm font-bold text-viking-paper hover:bg-viking-teal/80">Nullstill reise</button>
            <button onClick={() => setShowCeremony(true)} className="rounded border-2 border-viking-gold bg-viking-gold/80 px-4 py-2 text-sm font-bold text-viking-darkblue hover:bg-viking-gold">Sluttseremoni</button>
            <button onClick={onResetSetup} className="rounded border-2 border-viking-gold bg-viking-rust px-4 py-2 text-sm font-bold text-viking-paper hover:bg-viking-rust/80">Start oppsett på nytt</button>
            <button onClick={() => { if (session.mode === 'online') removeGroup(session.gameCode, session.groupId).catch(() => {}); onLeaveGame(); }} className="rounded border-2 border-viking-gold bg-viking-crimson px-4 py-2 text-sm font-bold text-viking-paper hover:bg-viking-crimson/80">Forlat spill</button>
            <button onClick={onSwitchRole} className="rounded border-2 border-viking-gold bg-viking-plum px-4 py-2 text-sm font-bold text-viking-paper hover:bg-viking-plum/80">Bytt rolle</button>
          </div>
        </div>
      </div>
    </div>
  );
}
