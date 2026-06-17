/**
 * TeacherPanel.tsx
 * Lærerens game master-konsoll (fase 2, §8):
 *  §8.1 Sjøkart med alle gruppers skip (SeaMap)
 *  §8.2 Sanntids-leaderboard
 *  §8.3 Godkjenning av oppgaver med ett trykk (Godkjenn / Delvis / Avvis)
 * Vises typisk på delt storskjerm.
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '../hooks/useRole';
import { playSound } from '../lib/sound';
import { generateUniqueGameCode, isValidGameCode } from '../lib/gameCode';
import {
  createGame,
  gameExists,
  touchGame,
  exportGame,
  importGame,
  deleteGame,
  removeGroup,
  sendSummon,
  clearSummon,
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
  triggerWheelSpin,
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
import { STORM_FATE_IDS, GAVE_FATE_IDS, VIND_FATE_ID, type WheelFieldId } from '../data/wheelFields';
import { patchGroup } from '../lib/gameSync';
import SeaMap from '../components/teacher/SeaMap';
import Leaderboard from '../components/teacher/Leaderboard';
import LeadConfetti from '../components/teacher/LeadConfetti';
import SkjebneHjul from '../components/teacher/SkjebneHjul';
import TeacherLanding from '../components/teacher/TeacherLanding';
import { rememberTeacherGame, forgetTeacherGame } from '../lib/teacherGames';
import { downloadBackup } from '../lib/gameBackup';
import { Raven } from '../components/decor';
import Icon from '../components/decor/Icon';
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
  // Les en eventuell tidligere spillkode fra localStorage — men bare hvis den er i
  // gjeldende format (4 bokstaver, uten I/O). Et eldre cachet kode-format (f.eks. den
  // gamle «VIKING-XXXX») forkastes, så læreren genererer en frisk 4-bokstavskode som
  // elevenes inntastingsfelt faktisk godtar.
  const [code, setCode] = useState<string | null>(() => {
    const saved = localStorage.getItem(CODE_KEY);
    if (saved && isValidGameCode(saved)) return saved;
    if (saved) localStorage.removeItem(CODE_KEY); // ugyldig/utdatert kode — rydd vekk
    return null;
  });
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

  // Når et spill er aktivt: marker det som nylig brukt — både i Firebase (lastActiveAt,
  // så «tidligere spill» kan vise alder) og i lærerens lokale register (så koden er lett
  // å finne igjen neste skoletime, også etter at fanen er lukket).
  useEffect(() => {
    if (!code) return;
    rememberTeacherGame(code);
    touchGame(code).catch(() => {});
  }, [code]);

  // §8.2 Konkurransesignal når en NY gruppe tar ledelsen (krever ≥2 grupper og at
  // lederen faktisk har poeng). Ingen lyd ved første leder eller ved uendret ledelse.
  const prevLeaderRef = useRef<string | null>(null);
  const [confettiKey, setConfettiKey] = useState<number | null>(null);
  useEffect(() => {
    const r = Object.entries(groups).sort((a, b) => total(b[1]) - total(a[1]));
    if (r.length < 2 || total(r[0][1]) <= 0) { prevLeaderRef.current = r[0]?.[0] ?? null; return; }
    const leaderId = r[0][0];
    if (prevLeaderRef.current !== null && prevLeaderRef.current !== leaderId) {
      playSound('victory');
      setConfettiKey(Date.now()); // §8.2 konfetti ved nytt lederskifte
    }
    prevLeaderRef.current = leaderId;
  }, [groups]);

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

  /** Trekk fra en pool av fate-kort. For 'vind' rammer eventet skipet som ligger bakerst (catch-up). */
  const triggerFateFromPool = (pool: 'storm' | 'gave' | 'vind') => {
    if (!code) return;
    const ids = pool === 'storm' ? STORM_FATE_IDS : pool === 'gave' ? GAVE_FATE_IDS : [VIND_FATE_ID];
    const candidates = fateCards.filter((c) => ids.includes(c.id));
    if (candidates.length === 0) return;
    const card = candidates[Math.floor(Math.random() * candidates.length)];
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
      let tid: string | null = null;
      if (pool === 'vind') {
        // catch-up: skipet med lavest sum får medvind
        tid = ranked.length ? ranked[ranked.length - 1][0] : null;
      } else {
        const gids = Object.keys(groups);
        if (gids.length) tid = gids[Math.floor(Math.random() * gids.length)];
      }
      if (!tid) return;
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

  /** Skjebnehjulet landet på skjebnemøte-feltet — tving alle skip til en Skjebnemøte ved neste seilas. */
  const broadcastSkjebne = () => {
    if (!code) return;
    Object.keys(groups).forEach((gid) => {
      patchGroup(code, gid, { forceSkjebneNextSail: true }).catch(() => {});
    });
  };

  /** Kringkast selve spinnet i det hjulet settes i gang, så det vises og spinner
   *  synkront på alle elevskjermer (lander på samme felt = resultIndex). */
  const broadcastWheelSpin = (resultIndex: number) => {
    if (!code) return;
    triggerWheelSpin(code, {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      resultIndex,
      at: Date.now(),
    }).catch(() => {});
  };

  /** Hjul-utfallet dispatcher til riktig handler. Bevarer eksisterende event-systemer. */
  const handleWheelLanded = (field: WheelFieldId) => {
    switch (field) {
      case 'gudenes-prove': return triggerGudenesProve();
      case 'storm':         return triggerFateFromPool('storm');
      case 'gunstig-vind':  return triggerFateFromPool('vind');
      case 'ragnarok':      return triggerRagnarokNow();
      case 'gudenes-gave':  return triggerFateFromPool('gave');
      case 'skjebnemote':   return broadcastSkjebne();
    }
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
  /** Gjenoppta et eksisterende spill (fra kode-input eller «tidligere spill»-lista).
   *  Spillet ligger allerede i Firebase under koden — vi kobler bare konsollen til det. */
  const resumeGame = (c: string) => {
    localStorage.setItem(CODE_KEY, c);
    setCode(c);
  };

  /** Gjenopprett et helt spill fra en opplastet sikkerhetskopi, og koble til det. */
  const restoreGame = async (c: string, data: unknown) => {
    await importGame(c, data);
    resumeGame(c);
  };

  /** «Pause»: koble konsollen fra spillet, men la alt ligge trygt i Firebase så det kan
   *  gjenopptas senere. Koden blir igjen i lærerens «tidligere spill»-liste. */
  const pauseGame = () => { localStorage.removeItem(CODE_KEY); setCode(null); };

  /** Last ned en sikkerhetskopi av hele det aktive spillet som en JSON-fil. */
  const [backupBusy, setBackupBusy] = useState(false);
  const downloadGameBackup = async () => {
    if (!code) return;
    setBackupBusy(true);
    try {
      const data = await exportGame(code);
      if (data) downloadBackup(code, data);
    } catch { /* offline e.l. — knappen kan prøves igjen */ }
    finally { setBackupBusy(false); }
  };

  /** «Avslutt for godt»: slett spillet fra Firebase og glem koden. Krever bekreftelse. */
  const deleteGameForGood = async () => {
    if (!code) return;
    const c = code;
    if (!window.confirm(`Slette spillet ${c} for godt? Alle gruppers fremgang forsvinner og kan ikke gjenopptas (med mindre du har lastet ned en sikkerhetskopi). Avbryt for å heller sette spillet på pause.`)) return;
    await deleteGame(c).catch(() => {});
    forgetTeacherGame(c);
    localStorage.removeItem(CODE_KEY);
    setCode(null);
  };

  const switchRole = () => { clearRole(); navigate('/', { replace: true }); };
  const resolve = (groupId: string, status: ApprovalStatus) => {
    if (code) setApprovalStatus(code, groupId, status).catch(() => {});
  };
  /** Rydd vekk en tom/forlatt/duplikat-gruppe fra spillet (krever bekreftelse). */
  const removeGroupNow = (groupId: string, shipName: string) => {
    if (!code) return;
    if (!window.confirm(`Fjerne «${shipName}» fra spillet? Gruppas fremgang slettes. Dette kan ikke angres.`)) return;
    removeGroup(code, groupId).catch(() => {});
  };
  /** «Kom til meg» (§8): kall en gruppe til læreren med en valgfri kort beskjed. */
  const summonGroup = (groupId: string, shipName: string) => {
    if (!code) return;
    const msg = (window.prompt(`Beskjed til «${shipName}»:`, 'Kom til læreren ved kateteret') ?? '').trim();
    if (!msg) return; // avbrutt
    sendSummon(code, groupId, msg).catch(() => {});
  };
  const clearSummonNow = (groupId: string) => { if (code) clearSummon(code, groupId).catch(() => {}); };

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
      <div className="relative">
        <HelpButton onClick={() => setShowRules(true)} className="absolute right-4 top-4 z-20" />
        <TeacherLanding
          creating={creating}
          createError={createError}
          onCreateNew={() => void createNew()}
          onResume={resumeGame}
          onRestore={restoreGame}
          onSwitchRole={switchRole}
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-viking-darkblue p-4 text-viking-paper sm:p-6 xl:p-8">
      <ConnectionBanner active={!!code} />
      {confettiKey && <LeadConfetti key={confettiKey} onDone={() => setConfettiKey(null)} />}
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

            {/* §8.2 Leaderboard — med per-gruppe-detalj, live status og «kom til meg» */}
            <Leaderboard ranked={ranked} onRemoveGroup={removeGroupNow} onSummon={summonGroup} onClearSummon={clearSummonNow} />
          </div>

          {/* HØYRE — lærerens kontroller + godkjenning */}
          <div className="mt-6 space-y-6 xl:mt-0">

        {/* §8.3 Godkjenning — ØVERST: dette er den mest tidskritiske live-handlingen.
            Svaret gir nå reell terningbonus til gruppa (§6.2): Velsign +2 · Delvis +1 · Forkast −1. */}
        <div className={`rounded-lg border-2 p-4 ${pending.length > 0 ? 'border-viking-crimson bg-viking-crimson/10' : 'border-viking-gold/40 bg-viking-surface'}`} data-testid="approvals-panel">
          <div className="mb-1 flex items-baseline justify-between">
            <h2 className="inline-flex items-center gap-2 font-cinzel text-2xl text-viking-gold xl:text-3xl"><Icon name="bolt" size={24} /> Tors velsignelse</h2>
            {pending.length > 0 && <span className="animate-pulse rounded-full bg-viking-crimson px-2.5 py-0.5 font-mono text-xs text-viking-paper">{pending.length} venter</span>}
          </div>
          <p className="mb-3 font-inter text-xs text-viking-paper/70">Godkjenn oppgaver gruppene gjør. Svaret gir terningbonus: <strong className="text-viking-moss">Velsign +2</strong> · <strong className="text-viking-gold">Delvis +1</strong> · <strong className="text-viking-crimson">Forkast −1</strong>.</p>
          {pending.length === 0 ? (
            <p className="rounded-lg border-2 border-dashed border-viking-gold/30 p-4 text-center font-inter italic text-viking-paper/60">Ingen skip ber om velsignelse akkurat nå</p>
          ) : (
            <div className="space-y-2">
              {pending.map(([groupId, a]) => (
                <div key={groupId} className="rounded-lg border-2 border-viking-gold/40 bg-viking-surface p-3" data-testid={`approval-${groupId}`}>
                  <p className="font-cinzel text-viking-gold">{a.shipName}</p>
                  <p className="mb-3 font-inter text-sm text-viking-paper/85">{a.taskTitle}</p>
                  <div className="flex gap-2">
                    <button onClick={() => resolve(groupId, 'approved')} className="flex-1 rounded border-2 border-viking-moss bg-viking-moss/30 px-2 py-1.5 font-cinzel text-sm font-bold text-viking-paper hover:bg-viking-moss/50"><span className="inline-flex items-center gap-1">Velsign <Icon name="bolt" size={14} /> (+2)</span></button>
                    <button onClick={() => resolve(groupId, 'partial')} className="flex-1 rounded border-2 border-viking-gold bg-viking-gold/20 px-2 py-1.5 font-cinzel text-sm font-bold text-viking-paper hover:bg-viking-gold/40">Delvis (+1)</button>
                    <button onClick={() => resolve(groupId, 'rejected')} className="flex-1 rounded border-2 border-viking-crimson bg-viking-crimson/30 px-2 py-1.5 font-cinzel text-sm font-bold text-viking-paper hover:bg-viking-crimson/50">Forkast (−1)</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* §3.4/§8.5 Skjebnehjulet — én dramatisk mekanikk som erstatter de spredte trigger-knappene.
            Læreren bestemmer kun NÅR (spinner); hjulet avgjør HVA og HVEM. */}
        <div className="viking-card relative rounded-lg p-5" data-testid="wheel-panel">
          <div className="mb-3 text-center">
            <div className="mb-1 flex items-center justify-center gap-3">
              <Raven size={36} facing="right" color="#CDC3AD" />
              <h2 className="font-saga text-3xl viking-engraved">Skjebnehjulet</h2>
              <Raven size={36} facing="left" color="#CDC3AD" />
            </div>
            <p className="mx-auto mt-1 max-w-md font-inter text-sm italic text-viking-paper/80">
              Du bestemmer kun <strong>når</strong> du spinner. Nornene avgjør hvilken kraft som rammer flåten — og hvem.
            </p>
          </div>
          <SkjebneHjul onLanded={handleWheelLanded} onSpinStart={broadcastWheelSpin} disabled={!code} />
        </div>

        {/* Etterspill: kåring av Gudenes prøve, sist event, ragnarok-status */}
        <div className="rounded-lg border-2 border-viking-plum/60 bg-viking-plum/15 p-4">
          <h3 className="inline-flex items-center gap-2 font-cinzel text-lg text-viking-gold"><Icon name="bolt" size={18} /> Gudenes prøve — etterspill</h3>
          {!trial && (
            <p className="mt-1 font-inter text-sm italic text-viking-paper/65">Ingen aktiv prøve. Spinn skjebnehjulet for å utløse en.</p>
          )}

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
                          ><span className="inline-flex items-center gap-1"><Icon name="trophy" size={13} /> Vinner</span></button>
                          <button
                            onClick={() => { setTrialRunnerUp(isRunnerUp ? null : id); if (trialWinner === id) setTrialWinner(null); }}
                            disabled={trialWinner === id}
                            className={`rounded px-2 py-1 font-cinzel text-xs ${isRunnerUp ? 'bg-viking-gold-soft text-viking-darkblue' : 'border border-viking-gold/40 text-viking-gold-soft hover:border-viking-gold disabled:opacity-30'}`}
                          ><span className="inline-flex items-center gap-1"><Icon name="medal" size={13} /> 2.</span></button>
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
                      className="rounded-md border-2 border-viking-gold bg-viking-gold px-5 py-2 font-saga text-sm font-bold text-viking-darkblue hover:bg-viking-gold-soft disabled:cursor-not-allowed disabled:opacity-40"
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
              <p className="mt-1 inline-flex flex-wrap items-center gap-1.5 font-inter text-sm text-viking-paper">
                <Icon name="trophy" size={15} /> Vinner: <strong>{trialResult.winnerName}</strong>
                {trialResult.runnerUpName && <> · <Icon name="medal" size={15} /> 2. plass: <strong>{trialResult.runnerUpName}</strong></>}
              </p>
            </div>
          )}
        </div>

        {/* Saga-innstilling + lese-knapp */}
        <div className="rounded-lg border-2 border-viking-rust/60 bg-viking-rust/15 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="inline-flex items-center gap-2 font-cinzel text-xl text-viking-gold"><Icon name="scroll" size={20} /> Saga-logg</h2>
              <p className="font-inter text-sm text-viking-paper/80">Gruppene begrunner valgene sine før terningen kastes. Brukes til etterarbeid og vurdering.</p>
            </div>
            <button
              onClick={() => setShowSagas(true)}
              data-testid="open-sagas"
              className="rounded-md border-2 border-viking-gold bg-viking-gold px-6 py-2 font-saga font-bold text-viking-darkblue hover:bg-viking-gold-soft"
            >
              <span className="inline-flex items-center gap-2"><Icon name="book" size={16} /> Les sagaer</span>
            </button>
          </div>
          <div className="mt-4 border-t border-viking-rust/30 pt-3">
            <p className="mb-2 inline-flex items-center gap-1.5 font-cinzel text-sm text-viking-gold-soft"><Icon name="gear" size={15} /> Spillregler <span className="font-inter text-xs italic text-viking-paper/55">— settes vanligvis før timen</span></p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={settings.requireSaga !== false}
                onChange={(e) => { if (code) setGameSettings(code, { requireSaga: e.target.checked }).catch(() => {}); }}
                data-testid="require-saga-toggle"
                className="h-4 w-4 accent-viking-gold"
              />
              <span className="font-cinzel text-sm text-viking-gold-soft">Krev begrunnelse: <strong>{settings.requireSaga !== false ? 'PÅ' : 'AV'}</strong></span>
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={settings.requirePerspective !== false}
                onChange={(e) => { if (code) setGameSettings(code, { requirePerspective: e.target.checked }).catch(() => {}); }}
                data-testid="require-perspective-toggle"
                className="h-4 w-4 accent-viking-gold"
              />
              <span className="font-cinzel text-sm text-viking-gold-soft">Krev perspektivskifte: <strong>{settings.requirePerspective !== false ? 'PÅ' : 'AV'}</strong></span>
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={settings.requireBridge !== false}
                onChange={(e) => { if (code) setGameSettings(code, { requireBridge: e.target.checked }).catch(() => {}); }}
                data-testid="require-bridge-toggle"
                className="h-4 w-4 accent-viking-gold"
              />
              <span className="font-cinzel text-sm text-viking-gold-soft">Bro til i dag: <strong>{settings.requireBridge !== false ? 'PÅ' : 'AV'}</strong></span>
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2" title="Når på MÅ hvert medlem gi et råd (trykk på et alternativ eller én kort setning) før høvdingens valgknapper låses opp. Krever flere enheter i samme gruppe.">
              <input
                type="checkbox"
                checked={settings.requireCouncil !== false}
                onChange={(e) => { if (code) setGameSettings(code, { requireCouncil: e.target.checked }).catch(() => {}); }}
                data-testid="require-council-toggle"
                className="h-4 w-4 accent-viking-gold"
              />
              <span className="font-cinzel text-sm text-viking-gold-soft">Krev rådslagning: <strong>{settings.requireCouncil !== false ? 'PÅ' : 'AV'}</strong></span>
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2" title="Når på MÅ gruppa gjennom stedsquizen før de kan ta det endelige valget. Quizen gir fortsatt terningbonus.">
              <input
                type="checkbox"
                checked={settings.requireQuiz !== false}
                onChange={(e) => { if (code) setGameSettings(code, { requireQuiz: e.target.checked }).catch(() => {}); }}
                data-testid="require-quiz-toggle"
                className="h-4 w-4 accent-viking-gold"
              />
              <span className="font-cinzel text-sm text-viking-gold-soft">Obligatorisk quiz: <strong>{settings.requireQuiz !== false ? 'PÅ' : 'AV'}</strong></span>
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2" title="Engangs-bobler som forklarer ressurser og låste steder første gang gruppa møter dem. Skru av i korte økter.">
              <input
                type="checkbox"
                checked={settings.showHints !== false}
                onChange={(e) => { if (code) setGameSettings(code, { showHints: e.target.checked }).catch(() => {}); }}
                data-testid="show-hints-toggle"
                className="h-4 w-4 accent-viking-gold"
              />
              <span className="font-cinzel text-sm text-viking-gold-soft">Forklaringer: <strong>{settings.showHints !== false ? 'PÅ' : 'AV'}</strong></span>
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2" title="Ved ~1 av 3 møter får ÉN elev et privat nøkkelkort med beslutningsrelevant info de andre ikke ser — de må dele det og overbevise. Kortet fordeles jevnt over gruppa.">
              <input
                type="checkbox"
                checked={settings.keyCards !== false}
                onChange={(e) => { if (code) setGameSettings(code, { keyCards: e.target.checked }).catch(() => {}); }}
                data-testid="keycards-toggle"
                className="h-4 w-4 accent-viking-gold"
              />
              <span className="font-cinzel text-sm text-viking-gold-soft">Nøkkelkort: <strong>{settings.keyCards !== false ? 'PÅ' : 'AV'}</strong></span>
            </label>
          </div>

          {/* Tekstlengde — differensiering for yrkesfag */}
          <div className="mt-4 border-t border-viking-rust/30 pt-3" data-testid="text-length-controls">
            <p className="mb-1 inline-flex items-center gap-1.5 font-cinzel text-sm text-viking-gold-soft"><Icon name="book" size={15} /> Tekstmengde for klassen</p>
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
          </div>{/* Spillregler-seksjon slutt */}
        </div>

        {/* Handelstorg — kompakt aktivitetspanel */}
        <div className="rounded-lg border-2 border-viking-teal/60 bg-viking-teal/15 p-4" data-testid="teacher-trade-panel">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="inline-flex items-center gap-2 font-cinzel text-xl text-viking-gold"><Icon name="market" size={20} /> Handelstorg</h2>
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
                  const sym = t.status === 'accepted' ? '✓' : t.status === 'declined' ? '✕' : t.status === 'cancelled' ? '↩'
                    : <Icon name="hourglass" size={12} className="inline-block align-[-1px]" />;
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

        {/* Sist trukne fate-kort (vises bare når et er trukket) */}
        {fate && (
          <div className="rounded-lg border-2 border-viking-rust/60 bg-viking-rust/15 p-4">
            <h3 className="inline-flex items-center gap-2 font-cinzel text-lg text-viking-gold"><Icon name="die" size={18} /> Sist gripe fra gudene</h3>
            <p className="mt-1 font-mono text-xs text-viking-gold-soft">{fate.title} → {fate.targetMode === 'group' ? fate.targetName : fate.conditionLabel}</p>
          </div>
        )}

        {/* §6.3 Ragnarok-status (informasjon — selve utløsningen skjer fra hjulet) */}
        <div className={`rounded-lg border-2 p-4 ${ragnarokReady ? 'border-viking-crimson bg-viking-crimson/15' : 'border-viking-gold/20 bg-viking-surface/40 opacity-70'}`}>
          <h3 className="inline-flex items-center gap-2 font-cinzel text-lg text-viking-gold"><Icon name="urn" size={18} /> Ragnarok-status</h3>
          <p className="mt-1 font-mono text-xs text-viking-gold-soft">
            Største avstand: {leadGap} poeng {ragnarokReady
              ? <>— Tor er rasende! Hjulets <Icon name="urn" size={12} className="inline-block align-[-1px]" />-felt vil ramme hardt.</>
              : '(flåten er jevn — Ragnarok merkes lite)'}
          </p>
        </div>

          </div>{/* HØYRE-kolonne slutt */}
        </div>{/* to-kolonners grid slutt */}

        {/* Lagring / gjenopptaking — §lagre over flere økter */}
        <div className="mt-8 rounded-lg border-2 border-viking-gold/40 bg-viking-surface/60 p-4">
          <h3 className="mb-1 inline-flex items-center gap-2 font-cinzel text-lg text-viking-gold"><Icon name="save" size={18} /> Lagring & økter</h3>
          <p className="mb-3 font-inter text-sm text-viking-paper/80">
            Spillet lagres fortløpende under runeordet <strong className="font-mono text-viking-gold">{code}</strong>. Du kan trygt lukke
            fanen og gjenoppta senere med samme kode. Last gjerne ned en sikkerhetskopi før en lang pause.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => void downloadGameBackup()}
              disabled={backupBusy}
              data-testid="download-backup"
              className="rounded border-2 border-viking-gold bg-viking-gold/20 px-5 py-2 font-cinzel font-bold text-viking-gold hover:bg-viking-gold/40 disabled:opacity-50"
            >
              {backupBusy ? 'Lagrer …' : <span className="inline-flex items-center gap-2"><Icon name="download" size={16} /> Last ned sikkerhetskopi</span>}
            </button>
            <button onClick={pauseGame} data-testid="pause-game" className="rounded border-2 border-viking-gold bg-viking-plum px-5 py-2 font-bold text-viking-paper hover:bg-viking-plum/80">
              <span className="inline-flex items-center gap-2"><Icon name="pause" size={16} /> Sett på pause (kan gjenopptas)</span>
            </button>
            <button onClick={() => void deleteGameForGood()} data-testid="delete-game" className="rounded border-2 border-viking-crimson bg-viking-crimson/30 px-5 py-2 font-bold text-viking-paper hover:bg-viking-crimson/50">
              <span className="inline-flex items-center gap-2"><Icon name="trash" size={16} /> Avslutt for godt</span>
            </button>
            <button onClick={switchRole} className="rounded border-2 border-viking-gold/60 px-5 py-2 font-bold text-viking-gold-soft hover:border-viking-gold">Bytt rolle</button>
          </div>
        </div>
      </div>
    </div>
  );
}
