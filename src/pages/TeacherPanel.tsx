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
  subscribeTrades,
  subscribeGameSettings,
  setGameSettings,
  type SyncedGroup,
  type ApprovalRequest,
  type ApprovalStatus,
  type Trial,
  type TrialResult,
  type FateEvent,
  type TradeOffer,
  type GameSettings,
} from '../lib/gameSync';
import SagaReader from '../components/saga/SagaReader';
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
  const [trades, setTrades] = useState<Record<string, TradeOffer>>({});
  const [settings, setSettings] = useState<GameSettings>({});
  const [showSagas, setShowSagas] = useState(false);

  useEffect(() => {
    if (!code) { setGroups({}); setApprovals({}); setTrial(null); setTrialResult(null); setFate(null); setTrades({}); setSettings({}); return; }
    const unsubG = subscribeGroups(code, setGroups);
    const unsubA = subscribeApprovals(code, setApprovals);
    const unsubT = subscribeTrial(code, setTrial);
    const unsubR = subscribeTrialResult(code, setTrialResult);
    const unsubF = subscribeFate(code, setFate);
    const unsubTr = subscribeTrades(code, setTrades);
    const unsubS = subscribeGameSettings(code, setSettings);
    return () => { unsubG(); unsubA(); unsubT(); unsubR(); unsubF(); unsubTr(); unsubS(); };
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

  if (showSagas) {
    const sagaGroups = Object.values(groups)
      .filter((g) => (g.saga?.length ?? 0) > 0)
      .map((g) => ({ shipName: g.shipName, shipSymbol: g.shipSymbol, entries: g.saga ?? [] }));
    return <SagaReader title="Klassens sagaer" groups={sagaGroups} onClose={() => setShowSagas(false)} />;
  }

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
          <h1 className="mb-2 font-cinzel text-4xl text-viking-gold">⚡ Tors utsyn over Midgard</h1>
          <p className="mb-8 font-inter italic text-viking-gold-soft">Fra Åsgard ser tordenguden ut over flåten — storskjerm for hele klassen</p>
          <div className="rounded-lg border-2 border-viking-gold bg-viking-surface p-10 text-center">
            <h2 className="mb-3 font-cinzel text-2xl text-viking-gold">Slipp en ny flåte på sjøen</h2>
            <p className="mb-8 font-inter text-viking-paper/85">Du får et runeord vikingene taster inn for å bli sett av deg.</p>
            <button
              onClick={() => void createNew()}
              disabled={creating}
              className="rounded-md border-2 border-viking-gold bg-viking-gold px-10 py-3 font-cinzel text-lg font-bold text-viking-darkblue hover:bg-viking-gold-soft disabled:cursor-wait disabled:opacity-60"
            >
              {creating ? 'Reiser Åsgards porter …' : 'Åpne Åsgards porter ⚡'}
            </button>
            {createError && (
              <p className="mt-5 rounded-md border-2 border-viking-crimson bg-viking-crimson/15 p-3 font-inter text-sm text-viking-paper">
                Bifrost svarer ikke — broen mellom Åsgard og Midgard er tåkete. Sjekk nettet og prøv igjen.
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
            <span className="font-cinzel text-xs uppercase tracking-widest text-viking-gold-soft">Tors runeord</span>
            <p className="font-mono text-3xl font-bold tracking-[0.2em] text-viking-gold xl:text-4xl 2xl:text-5xl">{code}</p>
          </div>
          <p className="max-w-xs font-inter text-sm text-viking-paper/80">Vikingene velger «Jeg er viking» og taster inn runeordet.</p>
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
              <p className="font-inter text-sm text-viking-paper/80">Du bestemmer kun <strong>når</strong>. Gudene trekker utfordring og ferdighet — likt for alle skip.</p>
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

        {/* Saga-innstilling + lese-knapp */}
        <div className="rounded-lg border-2 border-viking-rust/60 bg-viking-rust/15 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-cinzel text-xl text-viking-gold">📜 Saga-logg</h2>
              <p className="font-inter text-sm text-viking-paper/80">Gruppene begrunner valgene sine før terningen kastes. Brukes til etterarbeid og vurdering.</p>
            </div>
            <button
              onClick={() => setShowSagas(true)}
              data-testid="open-sagas"
              className="rounded-md border-2 border-viking-gold bg-viking-gold px-6 py-2 font-cinzel font-bold text-viking-darkblue hover:bg-viking-gold-soft"
            >
              📖 Les sagaer
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={!!settings.requireSaga}
                onChange={(e) => { if (code) setGameSettings(code, { requireSaga: e.target.checked }).catch(() => {}); }}
                data-testid="require-saga-toggle"
                className="h-4 w-4 accent-viking-gold"
              />
              <span className="font-cinzel text-sm text-viking-gold-soft">Krev begrunnelse: <strong>{settings.requireSaga ? 'PÅ' : 'AV'}</strong></span>
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={!!settings.requirePerspective}
                onChange={(e) => { if (code) setGameSettings(code, { requirePerspective: e.target.checked }).catch(() => {}); }}
                data-testid="require-perspective-toggle"
                className="h-4 w-4 accent-viking-gold"
              />
              <span className="font-cinzel text-sm text-viking-gold-soft">Krev perspektivskifte: <strong>{settings.requirePerspective ? 'PÅ' : 'AV'}</strong></span>
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={!!settings.requireBridge}
                onChange={(e) => { if (code) setGameSettings(code, { requireBridge: e.target.checked }).catch(() => {}); }}
                data-testid="require-bridge-toggle"
                className="h-4 w-4 accent-viking-gold"
              />
              <span className="font-cinzel text-sm text-viking-gold-soft">Bro til i dag: <strong>{settings.requireBridge ? 'PÅ' : 'AV'}</strong></span>
            </label>
          </div>

          {/* Tekstlengde — differensiering for yrkesfag */}
          <div className="mt-4 border-t border-viking-rust/30 pt-3" data-testid="text-length-controls">
            <p className="mb-1 font-cinzel text-sm text-viking-gold-soft">📖 Tekstmengde for klassen</p>
            <p className="mb-2 font-inter text-xs text-viking-paper/65">Kortversjon = 2–3 setninger per historie og kulturmøte, beholder handlingen.</p>
            <div className="flex flex-wrap gap-2">
              {(['full', 'short', 'group'] as const).map((v) => {
                const label = v === 'full' ? 'Full tekst' : v === 'short' ? 'Kortversjon' : 'La gruppene velge';
                const current = (settings.textLength ?? 'full') === v;
                return (
                  <button
                    key={v}
                    onClick={() => { if (code) setGameSettings(code, { textLength: v }).catch(() => {}); }}
                    data-testid={`text-length-${v}`}
                    className={`rounded-md border-2 px-3 py-1 font-cinzel text-xs ${current ? 'border-viking-gold bg-viking-gold/20 text-viking-gold' : 'border-viking-gold/40 text-viking-gold-soft hover:border-viking-gold'}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Handelstorg — kompakt aktivitetspanel */}
        <div className="rounded-lg border-2 border-viking-teal/60 bg-viking-teal/15 p-4" data-testid="teacher-trade-panel">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-cinzel text-xl text-viking-gold">🏛 Handelstorg</h2>
            <p className="font-mono text-xs text-viking-gold-soft">
              {Object.values(trades).filter((t) => t.status === 'pending').length} ventende ·{' '}
              {Object.values(trades).filter((t) => t.status === 'accepted').length} akseptert
            </p>
          </div>
          {Object.keys(trades).length === 0 ? (
            <p className="font-inter text-sm italic text-viking-paper/60">Ingen handler så langt.</p>
          ) : (
            <ul className="max-h-40 space-y-1 overflow-y-auto" data-testid="teacher-trade-list">
              {Object.values(trades)
                .sort((a, b) => (b.resolvedAt ?? b.createdAt) - (a.resolvedAt ?? a.createdAt))
                .slice(0, 8)
                .map((t) => {
                  const sym = t.status === 'accepted' ? '✓' : t.status === 'declined' ? '✕' : t.status === 'cancelled' ? '↩' : '⏳';
                  const summary = (g: TradeOffer['giving']) =>
                    Object.entries(g).map(([k, n]) => `${n}× ${k}`).join(', ');
                  return (
                    <li key={t.id} className="font-inter text-xs text-viking-paper/90">
                      <span className="mr-1 font-mono">{sym}</span>
                      <strong>{t.fromGroupName}</strong> → <strong>{t.toGroupName}</strong>:{' '}
                      <span className="text-viking-moss">{summary(t.giving)}</span>{' '}
                      <span className="text-viking-gold-soft/70">↔</span>{' '}
                      <span className="text-viking-gold-soft">{summary(t.receiving)}</span>
                    </li>
                  );
                })}
            </ul>
          )}
        </div>

        {/* §8.4 Skjebne-kort — læreren bestemmer KUN når */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 border-viking-rust/60 bg-viking-rust/15 p-4">
          <div>
            <h2 className="font-cinzel text-xl text-viking-gold">🎴 Tors inngripen</h2>
            <p className="font-inter text-sm text-viking-paper/80">Du bestemmer kun <strong>når</strong> du griper inn. Nornene trekker hva som skjer og hvilket skip det rammer — tilfeldig.</p>
            {fate && <p className="mt-1 font-mono text-xs text-viking-gold-soft">Sist gripe: {fate.title} → {fate.targetMode === 'group' ? fate.targetName : fate.conditionLabel}</p>}
          </div>
          <button onClick={triggerSkjebne} className="rounded-md border-2 border-viking-gold bg-viking-gold px-6 py-3 font-cinzel font-bold text-viking-darkblue hover:bg-viking-gold-soft">🎴 Grip inn i flåtens skjebne</button>
        </div>

        {/* §6.3 Ragnarok — catch-up når avstanden blir for stor (> 15 poeng) */}
        <div className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 p-4 ${ragnarokReady ? 'border-viking-crimson bg-viking-crimson/15' : 'border-viking-gold/20 bg-viking-surface/40 opacity-70'}`}>
          <div>
            <h2 className="font-cinzel text-xl text-viking-gold">⚡ Ragnarok</h2>
            <p className="font-inter text-sm text-viking-paper/80">
              Når avstanden mellom 1. og siste skip passerer <strong>15 poeng</strong> kan du la Tors vrede ramme alle — halve handelspoeng forsvinner.
            </p>
            <p className="mt-1 font-mono text-xs text-viking-gold-soft">
              Største avstand nå: {leadGap} poeng {ragnarokReady ? '— Tor er rasende!' : '(under 15 — flåten er jevn)'}
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
                <h2 className="font-cinzel text-2xl text-viking-gold xl:text-3xl">Tors velsignelse</h2>
              {pending.length > 0 && <span className="rounded-full bg-viking-crimson px-2 py-0.5 font-mono text-xs text-viking-paper">{pending.length} venter</span>}
            </div>
            {pending.length === 0 ? (
              <p className="rounded-lg border-2 border-dashed border-viking-gold/30 p-6 text-center font-inter italic text-viking-paper/60">Ingen skip ber om velsignelse</p>
            ) : (
              <div className="space-y-2">
                {pending.map(([groupId, a]) => (
                  <div key={groupId} className="rounded-lg border-2 border-viking-gold/40 bg-viking-surface p-3">
                    <p className="font-cinzel text-viking-gold">{a.shipName}</p>
                    <p className="mb-3 font-inter text-sm text-viking-paper/85">{a.taskTitle}</p>
                    <div className="flex gap-2">
                      <button onClick={() => resolve(groupId, 'approved')} className="flex-1 rounded border-2 border-viking-moss bg-viking-moss/30 px-2 py-1.5 font-cinzel text-sm font-bold text-viking-paper hover:bg-viking-moss/50">Velsign ⚡</button>
                      <button onClick={() => resolve(groupId, 'partial')} className="flex-1 rounded border-2 border-viking-gold bg-viking-gold/20 px-2 py-1.5 font-cinzel text-sm font-bold text-viking-paper hover:bg-viking-gold/40">Delvis nåde</button>
                      <button onClick={() => resolve(groupId, 'rejected')} className="flex-1 rounded border-2 border-viking-crimson bg-viking-crimson/30 px-2 py-1.5 font-cinzel text-sm font-bold text-viking-paper hover:bg-viking-crimson/50">Forkast</button>
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
