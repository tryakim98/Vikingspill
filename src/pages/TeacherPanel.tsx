/**
 * TeacherPanel.tsx
 * Lærerens game master-konsoll (fase 2, §8):
 *  §8.1 Sjøkart med alle gruppers skip (SeaMap)
 *  §8.2 Sanntids-leaderboard
 *  §8.3 Godkjenning av oppgaver med ett trykk (Godkjenn / Delvis / Avvis)
 * Vises typisk på delt storskjerm.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '../hooks/useRole';
import { generateUniqueGameCode } from '../lib/gameCode';
import {
  createGame,
  gameExists,
  subscribeGroups,
  subscribeApprovals,
  setApprovalStatus,
  triggerTrial,
  subscribeTrial,
  triggerTrialResult,
  subscribeTrialResult,
  triggerFate,
  subscribeFate,
  triggerRagnarok,
  type SyncedGroup,
  type ApprovalRequest,
  type ApprovalStatus,
  type Trial,
  type TrialResult,
  type FateEvent,
} from '../lib/gameSync';
import { gudenesProveChallenges, fateCards } from '../data';
import SeaMap from '../components/teacher/SeaMap';
import TideTimer from '../components/teacher/TideTimer';
import ConnectionBanner from '../components/common/ConnectionBanner';
import VikingShip from '../components/ship/VikingShip';
import RulesScreen from '../components/rules/RulesScreen';
import HelpButton from '../components/rules/HelpButton';
import type { ShipSymbol } from '../types';

const RULES_KEY = 'vikingspill_rules_seen_teacher';

const CODE_KEY = 'vikingspill_teacher_code';
const total = (g: SyncedGroup) => g.scores.culturalUnderstanding + g.scores.tradeGain + g.scores.reputation;

export default function TeacherPanel() {
  const navigate = useNavigate();
  const { clearRole } = useRole();
  const [code, setCode] = useState<string | null>(() => localStorage.getItem(CODE_KEY));
  const [groups, setGroups] = useState<Record<string, SyncedGroup>>({});
  const [approvals, setApprovals] = useState<Record<string, ApprovalRequest>>({});
  const [showRules, setShowRules] = useState(() => {
    try { return !localStorage.getItem(RULES_KEY); } catch { return true; }
  });
  const dismissRules = () => {
    try { localStorage.setItem(RULES_KEY, '1'); } catch { /* ignore */ }
    setShowRules(false);
  };

  const [trial, setTrial] = useState<Trial | null>(null);
  const [trialResult, setTrialResult] = useState<TrialResult | null>(null);
  const [trialWinner, setTrialWinner] = useState<string | null>(null);
  const [trialRunnerUp, setTrialRunnerUp] = useState<string | null>(null);
  const [fate, setFate] = useState<FateEvent | null>(null);

  useEffect(() => {
    if (!code) { setGroups({}); setApprovals({}); setTrial(null); setTrialResult(null); setFate(null); return; }
    const unsubG = subscribeGroups(code, setGroups);
    const unsubA = subscribeApprovals(code, setApprovals);
    const unsubT = subscribeTrial(code, setTrial);
    const unsubR = subscribeTrialResult(code, setTrialResult);
    const unsubF = subscribeFate(code, setFate);
    return () => { unsubG(); unsubA(); unsubT(); unsubR(); unsubF(); };
  }, [code]);

  // Nullstill kåringsvalg når en ny prøve utløses, så fjorårets valg ikke henger igjen.
  useEffect(() => { setTrialWinner(null); setTrialRunnerUp(null); }, [trial?.id]);

  const triggerGudenesProve = () => {
    if (!code) return;
    const c = gudenesProveChallenges[Math.floor(Math.random() * gudenesProveChallenges.length)];
    triggerTrial(code, {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      challengeId: c.id,
      navn: c.navn,
      desc: c.desc,
      skill: c.ferdighet,
      at: Date.now(),
    }).catch(() => {});
  };

  const settleTrial = () => {
    if (!code || !trial || !trialWinner) return;
    const winnerGroup = groups[trialWinner];
    if (!winnerGroup) return;
    const runnerUpGroup = trialRunnerUp ? groups[trialRunnerUp] : undefined;
    const result: TrialResult = {
      trialId: trial.id,
      winnerId: trialWinner,
      winnerName: winnerGroup.shipName,
      at: Date.now(),
      ...(runnerUpGroup ? { runnerUpId: trialRunnerUp!, runnerUpName: runnerUpGroup.shipName } : {}),
    };
    triggerTrialResult(code, result).catch(() => {});
  };

  const triggerSkjebne = () => {
    if (!code) return;
    const card = fateCards[Math.floor(Math.random() * fateCards.length)];
    const ev: FateEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      icon: card.icon,
      title: card.title,
      text: card.text,
      targetMode: card.targetMode,
      effect: card.effect,
      at: Date.now(),
    };
    if (card.targetMode === 'group') {
      const ids = Object.keys(groups);
      if (ids.length === 0) return; // ingen grupper å ramme ennå
      const tid = ids[Math.floor(Math.random() * ids.length)];
      ev.targetGroupId = tid;
      ev.targetName = groups[tid].shipName;
    } else if (card.condition) {
      ev.condition = { skill: card.condition.skill, below: card.condition.below };
      ev.conditionLabel = card.condition.label;
    }
    triggerFate(code, ev).catch(() => {});
  };

  const triggerRagnarokNow = () => {
    if (!code) return;
    triggerRagnarok(code, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, at: Date.now() }).catch(() => {});
  };

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(false);

  const createNew = async () => {
    setCreating(true);
    setCreateError(false);
    try {
      // Generer en kode som ikke alt er tatt av et annet aktivt spill.
      const c = await generateUniqueGameCode(gameExists);
      // Firebase køer skriv når man er offline (løses aldri før nett er tilbake), så vi
      // gir opp etter 6 s og lar læreren prøve igjen i stedet for å spinne i det uendelige.
      await Promise.race([
        createGame(c), // må lykkes for at elevene skal kunne koble til
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 6000)),
      ]);
      localStorage.setItem(CODE_KEY, c);
      setCode(c);
    } catch {
      setCreateError(true); // ingen kontakt med Firebase — la læreren prøve igjen
    } finally {
      setCreating(false);
    }
  };
  const endGame = () => { localStorage.removeItem(CODE_KEY); setCode(null); };
  const switchRole = () => { clearRole(); navigate('/', { replace: true }); };
  const resolve = (groupId: string, status: ApprovalStatus) => {
    if (code) setApprovalStatus(code, groupId, status).catch(() => {});
  };

  if (showRules) return <RulesScreen role="teacher" onDone={dismissRules} />;

  const ranked = Object.entries(groups).sort((a, b) => total(b[1]) - total(a[1]));
  const pending = Object.entries(approvals).filter(([, a]) => a.status === 'pending');
  // §6.3 Ragnarok blir tilgjengelig når avstanden mellom 1. og siste gruppe > 15 poeng.
  const leadGap = ranked.length >= 2 ? total(ranked[0][1]) - total(ranked[ranked.length - 1][1]) : 0;
  const ragnarokReady = ranked.length >= 2 && leadGap > 15;

  if (!code) {
    return (
      <div className="relative min-h-screen bg-viking-darkblue p-6 text-viking-paper">
        <HelpButton onClick={() => setShowRules(true)} className="absolute right-4 top-4" />
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-2 font-cinzel text-4xl text-viking-gold">📜 Spillmasterkonsoll</h1>
          <p className="mb-8 font-inter italic text-viking-gold-soft">Storskjerm — elevene ser denne</p>
          <div className="rounded-lg border-2 border-viking-gold bg-viking-surface p-10 text-center">
            <h2 className="mb-3 font-cinzel text-2xl text-viking-gold">Start et nytt spill</h2>
            <p className="mb-8 font-inter text-viking-paper/85">Du får en spillkode som elevene taster inn for å bli med.</p>
            <button
              onClick={() => void createNew()}
              disabled={creating}
              className="rounded-md border-2 border-viking-gold bg-viking-gold px-10 py-3 font-cinzel text-lg font-bold text-viking-darkblue hover:bg-viking-gold-soft disabled:cursor-wait disabled:opacity-60"
            >
              {creating ? 'Oppretter spill …' : 'Opprett spill'}
            </button>
            {createError && (
              <p className="mt-5 rounded-md border-2 border-viking-crimson bg-viking-crimson/15 p-3 font-inter text-sm text-viking-paper">
                Fikk ikke kontakt med spilltjeneren. Sjekk nettet og prøv igjen.
              </p>
            )}
          </div>
          <button onClick={switchRole} className="mt-6 rounded border-2 border-viking-gold/50 px-5 py-2 font-cinzel text-viking-gold-soft hover:border-viking-gold">Bytt rolle</button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-viking-darkblue p-4 text-viking-paper sm:p-6 xl:p-8">
      <ConnectionBanner active={!!code} />
      <HelpButton onClick={() => setShowRules(true)} className="absolute right-4 top-4 z-20" />
      <div className="mx-auto w-full max-w-5xl xl:max-w-[1700px]">
        {/* Spillkode */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 border-viking-gold bg-viking-surface px-5 py-3 sm:px-6">
          <div>
            <span className="font-cinzel text-xs uppercase tracking-widest text-viking-gold-soft">Spillkode</span>
            <p className="font-mono text-3xl font-bold tracking-[0.2em] text-viking-gold xl:text-4xl 2xl:text-5xl">{code}</p>
          </div>
          <p className="max-w-xs font-inter text-sm text-viking-paper/80">Elevene velger «Jeg er elev» og taster inn koden.</p>
        </div>

        {/* Projektor: kart + leaderboard til venstre, kontroller til høyre på store skjermer; stables ellers. */}
        <div className="xl:grid xl:grid-cols-[1.7fr_1fr] xl:items-start xl:gap-6">
          {/* VENSTRE — det klassen ser: sjøkart + leaderboard */}
          <div>
            {/* §8.1 Sjøkart */}
            <div className="mb-6">
              <SeaMap groups={groups} />
            </div>

            {/* §8.2 Leaderboard */}
            <div>
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="font-cinzel text-2xl text-viking-gold xl:text-3xl">Leaderboard</h2>
                <span className="font-mono text-sm text-viking-gold-soft">{ranked.length} {ranked.length === 1 ? 'gruppe' : 'grupper'}</span>
              </div>
              {ranked.length === 0 ? (
                <p className="rounded-lg border-2 border-dashed border-viking-gold/30 p-6 text-center font-inter italic text-viking-paper/60">Venter på grupper …</p>
              ) : (
                <div className="space-y-2">
                  {ranked.map(([id, g], i) => (
                    <div key={id} className="flex items-center gap-3 rounded-lg border-2 border-viking-gold/40 bg-viking-surface p-2.5">
                      <span className="w-5 text-center font-cinzel text-lg text-viking-gold">{i + 1}</span>
                      <VikingShip color={g.shipColor} symbol={g.shipSymbol as ShipSymbol} size={44} />
                      <div className="flex-1">
                        <p className="font-cinzel text-viking-paper xl:text-lg">{g.shipName}</p>
                        <p className="font-mono text-[10px] text-viking-gold-soft">{g.visited.length}/12 steder</p>
                      </div>
                      <p className="font-cinzel text-2xl font-bold text-viking-gold xl:text-3xl">{total(g)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* HØYRE — lærerens kontroller + godkjenning */}
          <div className="mt-6 space-y-6 xl:mt-0">
            {/* §6.5 Tidevannstimer — læreren styrer rammene pr. kapittel */}
            <TideTimer code={code} groups={groups} />

        {/* §3.4/§8.5 Gudenes prøve — læreren bestemmer KUN når, og kårer vinner etter at klassen har gjort utfordringen fysisk */}
        <div className="rounded-lg border-2 border-viking-plum/60 bg-viking-plum/15 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-cinzel text-xl text-viking-gold">⚡ Gudenes prøve</h2>
              <p className="font-inter text-sm text-viking-paper/80">Du bestemmer kun <strong>når</strong>. Spillet trekker utfordring og ferdighet — likt for alle grupper.</p>
            </div>
            <button onClick={triggerGudenesProve} className="rounded-md border-2 border-viking-gold bg-viking-gold px-6 py-3 font-cinzel font-bold text-viking-darkblue hover:bg-viking-gold-soft">
              {trial ? '⚡ Utløs ny prøve' : '⚡ Utløs Gudenes prøve'}
            </button>
          </div>

          {trial && (
            <div className="mt-4 rounded-md border border-viking-gold/40 bg-viking-darkblue/40 p-4">
              <p className="font-cinzel text-viking-gold">{trial.navn}</p>
              <p className="mt-1 font-inter text-sm text-viking-paper/80">{trial.desc}</p>
              <p className="mt-1 font-mono text-xs text-viking-gold-soft">Ferdighet som teller: {trial.skill}</p>
            </div>
          )}

          {/* Kåring etter den fysiske utfordringen */}
          {trial && trialResult?.trialId !== trial.id && (
            <div className="mt-4" data-testid="trial-settle">
              <p className="mb-2 font-cinzel text-sm text-viking-gold-soft">Kåre vinner</p>
              {Object.keys(groups).length === 0 ? (
                <p className="rounded-md border-2 border-dashed border-viking-gold/30 p-4 font-inter text-sm italic text-viking-paper/60">Ingen grupper å kåre fra ennå.</p>
              ) : (
                <>
                  <div className="space-y-1.5">
                    {ranked.map(([id, g]) => {
                      const isWinner = trialWinner === id;
                      const isRunnerUp = trialRunnerUp === id;
                      return (
                        <div key={id} className={`flex items-center gap-2 rounded-md border-2 p-2 transition-all ${isWinner ? 'border-viking-gold bg-viking-gold/20' : isRunnerUp ? 'border-viking-gold-soft bg-viking-gold-soft/15' : 'border-viking-gold/20 bg-viking-surface/40'}`}>
                          <VikingShip color={g.shipColor} symbol={g.shipSymbol as ShipSymbol} size={28} />
                          <span className="flex-1 font-cinzel text-sm text-viking-paper">{g.shipName}</span>
                          <button
                            onClick={() => { setTrialWinner(id); if (trialRunnerUp === id) setTrialRunnerUp(null); }}
                            data-testid={`pick-winner-${id}`}
                            className={`rounded px-2 py-1 font-cinzel text-xs ${isWinner ? 'bg-viking-gold text-viking-darkblue' : 'border border-viking-gold/40 text-viking-gold-soft hover:border-viking-gold'}`}
                          >🏆 Vinner</button>
                          <button
                            onClick={() => { setTrialRunnerUp(isRunnerUp ? null : id); if (trialWinner === id) setTrialWinner(null); }}
                            disabled={trialWinner === id}
                            className={`rounded px-2 py-1 font-cinzel text-xs ${isRunnerUp ? 'bg-viking-gold-soft text-viking-darkblue' : 'border border-viking-gold/40 text-viking-gold-soft hover:border-viking-gold disabled:opacity-30'}`}
                          >🥈 2.</button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="font-mono text-xs text-viking-gold-soft/80">Belønning: vinner +5 rykte · 2.-plass +3 · andre +1</p>
                    <button
                      onClick={settleTrial}
                      disabled={!trialWinner}
                      data-testid="trial-settle-button"
                      className="rounded-md border-2 border-viking-gold bg-viking-gold px-5 py-2 font-cinzel text-sm font-bold text-viking-darkblue hover:bg-viking-gold-soft disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Avgjør prøven
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Avgjort */}
          {trial && trialResult?.trialId === trial.id && (
            <div className="mt-4 rounded-md border-2 border-viking-moss/60 bg-viking-moss/15 p-3" data-testid="trial-resolved">
              <p className="font-cinzel text-sm text-viking-gold-soft">Avgjort — belønningen er sendt til alle skip</p>
              <p className="mt-1 font-inter text-sm text-viking-paper">
                🏆 Vinner: <strong>{trialResult.winnerName}</strong>
                {trialResult.runnerUpName && <> · 🥈 2. plass: <strong>{trialResult.runnerUpName}</strong></>}
              </p>
            </div>
          )}
        </div>

        {/* §8.4 Skjebne-kort — læreren bestemmer KUN når */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 border-viking-rust/60 bg-viking-rust/15 p-4">
          <div>
            <h2 className="font-cinzel text-xl text-viking-gold">🎴 Skjebne-kort</h2>
            <p className="font-inter text-sm text-viking-paper/80">Du bestemmer kun <strong>når</strong>. Spillet trekker kort og hvem som rammes — tilfeldig.</p>
            {fate && <p className="mt-1 font-mono text-xs text-viking-gold-soft">Sist: {fate.title} → {fate.targetMode === 'group' ? fate.targetName : fate.conditionLabel}</p>}
          </div>
          <button onClick={triggerSkjebne} className="rounded-md border-2 border-viking-gold bg-viking-gold px-6 py-3 font-cinzel font-bold text-viking-darkblue hover:bg-viking-gold-soft">🎴 Utløs skjebne-kort</button>
        </div>

        {/* §6.3 Ragnarok — catch-up når avstanden blir for stor (> 15 poeng) */}
        <div className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 p-4 ${ragnarokReady ? 'border-viking-crimson bg-viking-crimson/15' : 'border-viking-gold/20 bg-viking-surface/40 opacity-70'}`}>
          <div>
            <h2 className="font-cinzel text-xl text-viking-gold">⚡ Ragnarok</h2>
            <p className="font-inter text-sm text-viking-paper/80">
              Når avstanden mellom 1. og siste gruppe passerer <strong>15 poeng</strong> kan du slippe Ragnarok løs — alle mister halve handelspoeng.
            </p>
            <p className="mt-1 font-mono text-xs text-viking-gold-soft">
              Største avstand nå: {leadGap} poeng {ragnarokReady ? '— gudene er rasende!' : '(under 15 — feltet er jevnt)'}
            </p>
          </div>
          <button
            onClick={triggerRagnarokNow}
            disabled={!ragnarokReady}
            className="rounded-md border-2 border-viking-gold bg-viking-crimson px-6 py-3 font-cinzel font-bold text-viking-paper hover:bg-viking-crimson/80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ⚡ Slipp Ragnarok løs
          </button>
        </div>

            {/* §8.3 Godkjenning */}
            <div>
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="font-cinzel text-2xl text-viking-gold xl:text-3xl">Godkjenning</h2>
              {pending.length > 0 && <span className="rounded-full bg-viking-crimson px-2 py-0.5 font-mono text-xs text-viking-paper">{pending.length} venter</span>}
            </div>
            {pending.length === 0 ? (
              <p className="rounded-lg border-2 border-dashed border-viking-gold/30 p-6 text-center font-inter italic text-viking-paper/60">Ingen oppgaver til godkjenning</p>
            ) : (
              <div className="space-y-2">
                {pending.map(([groupId, a]) => (
                  <div key={groupId} className="rounded-lg border-2 border-viking-gold/40 bg-viking-surface p-3">
                    <p className="font-cinzel text-viking-gold">{a.shipName}</p>
                    <p className="mb-3 font-inter text-sm text-viking-paper/85">{a.taskTitle}</p>
                    <div className="flex gap-2">
                      <button onClick={() => resolve(groupId, 'approved')} className="flex-1 rounded border-2 border-viking-moss bg-viking-moss/30 px-2 py-1.5 font-cinzel text-sm font-bold text-viking-paper hover:bg-viking-moss/50">Godkjenn</button>
                      <button onClick={() => resolve(groupId, 'partial')} className="flex-1 rounded border-2 border-viking-gold bg-viking-gold/20 px-2 py-1.5 font-cinzel text-sm font-bold text-viking-paper hover:bg-viking-gold/40">Delvis</button>
                      <button onClick={() => resolve(groupId, 'rejected')} className="flex-1 rounded border-2 border-viking-crimson bg-viking-crimson/30 px-2 py-1.5 font-cinzel text-sm font-bold text-viking-paper hover:bg-viking-crimson/50">Avvis</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          </div>{/* HØYRE-kolonne slutt */}
        </div>{/* to-kolonners grid slutt */}

        <div className="mt-8 flex flex-wrap gap-3">
          <button onClick={endGame} className="rounded border-2 border-viking-gold bg-viking-rust px-5 py-2 font-bold text-viking-paper hover:bg-viking-rust/80">Avslutt spill</button>
          <button onClick={switchRole} className="rounded border-2 border-viking-gold bg-viking-plum px-5 py-2 font-bold text-viking-paper hover:bg-viking-plum/80">Bytt rolle</button>
        </div>
      </div>
    </div>
  );
}
