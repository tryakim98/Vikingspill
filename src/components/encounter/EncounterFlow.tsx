/**
 * EncounterFlow.tsx
 * Møtet med én destinasjon (§6.6), i fast rekkefølge:
 *   1) Historie      — narrativ faktatekst
 *   2) Episk kulturmøte — dramatisk scene + ett kulturmøte-spørsmål
 *   3) Oppgaveside   — funFact, kjent person og oppgaven
 *   4) Quiz-overgang — fakta forsegles bak runer → stedsquiz (gir terningbonus)
 *   5) Valg → terning → utfall — odds-bar, modifikatorer, terningkast, lesson
 */

import { useState, useEffect, type ReactNode } from 'react';
import { motion } from 'motion/react';
import type { Destination, Choice, RollOdds, SkillKey } from '../../types';
import type { SyncedEncounter } from '../../lib/gameSync';
import { skillTreeData } from '../../data';
import {
  rollDice,
  oddsPercent,
  skillBonusForChoice,
  meetsRequirement,
  lateGamePenalty,
  TIER_LABEL,
  TIER_COLOR,
  TIER_ORDER,
  type RollResult,
} from '../../lib/oddsEngine';
import type { OutcomeApply } from '../../hooks/useGameState';
import { playSound } from '../../lib/sound';
import { playMusic } from '../../lib/music';
import QuestionCard from '../quiz/QuestionCard';
import DiceRoll from '../dice/DiceRoll';

type Step = 'history' | 'kulturmote' | 'oppgave' | 'transition' | 'quiz' | 'valg' | 'roll' | 'rolling' | 'resultat';

interface EncounterFlowProps {
  destination: Destination;
  skills: Record<SkillKey, number>;
  onComplete: (apply: OutcomeApply) => void;
  onExit: () => void;
  /** Sett kun når online — viser «Be om godkjenning» på oppgavesiden (§8.3). */
  onRequestApproval?: (destId: string, taskTitle: string) => void;
  /** Multi-enhet: når satt, leses state fra Firebase i stedet for lokal useState,
   *  og setterne skriver via onUpdateEncounter. Ikke-høvding ser banner i stedet for knapper. */
  isChief?: boolean;
  syncedEncounter?: SyncedEncounter | null;
  onUpdateEncounter?: (partial: Partial<SyncedEncounter>) => void;
  /** Sent i spillet (§3.3): valg som krever en ferdighet gruppa mangler blir
   *  tilgjengelige med −2 straff i stedet for å være låst. */
  lateGame?: boolean;
}

const DIFFICULTY_COLOR: Record<string, string> = {
  trygg: '#5B7553',
  middels: '#D4A843',
  farlig: '#8B2929',
};

const skillName = (s: SkillKey) => skillTreeData[s].name;

function Shell({ name, onExit, children }: { name: string; onExit: () => void; children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-viking-darkblue to-viking-surface text-viking-paper">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between border-b-2 border-viking-gold/40 pb-3">
          <h2 className="font-cinzel text-xl text-viking-gold">{name}</h2>
          <button onClick={onExit} className="font-inter text-xs text-viking-gold-soft/70 hover:text-viking-gold-soft">✕ Avbryt</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Html({ html, className }: { html: string; className?: string }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

function OddsBar({ baseRoll }: { baseRoll: RollOdds }) {
  const pct = oddsPercent(baseRoll);
  return (
    <div>
      <div className="flex h-2.5 overflow-hidden rounded-full border border-viking-darkblue/50">
        {TIER_ORDER.map((t) =>
          (baseRoll[t] ?? 0) > 0 ? (
            <div key={t} style={{ width: `${pct[t]}%`, backgroundColor: TIER_COLOR[t] }} title={`${TIER_LABEL[t]} ${pct[t]}%`} />
          ) : null,
        )}
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 text-[10px] font-mono text-viking-paper/60">
        {TIER_ORDER.map((t) => ((baseRoll[t] ?? 0) > 0 ? <span key={t}>{TIER_LABEL[t]} {pct[t]}%</span> : null))}
      </div>
    </div>
  );
}

export default function EncounterFlow({
  destination, skills, onComplete, onExit, onRequestApproval,
  isChief = true, syncedEncounter = null, onUpdateEncounter,
  lateGame = false,
}: EncounterFlowProps) {
  const d = destination;
  const syncMode = !!syncedEncounter;

  // Synket eller lokal state — én og samme variabel for resten av komponenten.
  const [_step, _setStep] = useState<Step>('history');
  const [_approvalSent, _setApprovalSent] = useState(false);
  const [_kmAnswer, _setKmAnswer] = useState<number | null>(null);
  const [_quizIdx, _setQuizIdx] = useState(0);
  const [_quizCorrect, _setQuizCorrect] = useState(0);
  const [_quizAnswer, _setQuizAnswer] = useState<number | null>(null);
  const [_quizBonus, _setQuizBonus] = useState(0);
  const [_choice, _setChoice] = useState<Choice | null>(null);
  const [_roll, _setRoll] = useState<RollResult | null>(null);

  const step = syncMode ? (syncedEncounter?.step ?? 'history') : _step;
  const approvalSent = syncMode ? (syncedEncounter?.approvalSent ?? false) : _approvalSent;
  const kmAnswer = syncMode ? (syncedEncounter?.kmAnswer ?? null) : _kmAnswer;
  const quizIdx = syncMode ? (syncedEncounter?.quizIdx ?? 0) : _quizIdx;
  const quizCorrect = syncMode ? (syncedEncounter?.quizCorrect ?? 0) : _quizCorrect;
  const quizAnswer = syncMode ? (syncedEncounter?.quizAnswer ?? null) : _quizAnswer;
  const quizBonus = syncMode ? (syncedEncounter?.quizBonus ?? 0) : _quizBonus;
  const choiceId = syncMode ? (syncedEncounter?.choiceId ?? null) : (_choice?.id ?? null);
  const choice = choiceId ? d.choices.find((c) => c.id === choiceId) ?? null : null;
  const rollSync = syncMode ? syncedEncounter?.roll ?? null : null;
  const roll: RollResult | null = syncMode
    ? (rollSync ? { raw: rollSync.raw, effective: rollSync.effective, modifier: rollSync.modifier, tier: rollSync.tier as RollResult['tier'] } : null)
    : _roll;

  // Setter-wrappere: skriver til Firebase i synkmodus, ellers oppdaterer lokal state.
  // Ikke-høvding må uansett ikke trigge skriv — vi gater på UI-nivå.
  const setStep = (v: Step) => syncMode ? onUpdateEncounter?.({ step: v }) : _setStep(v);
  const setApprovalSent = (v: boolean) => syncMode ? onUpdateEncounter?.({ approvalSent: v }) : _setApprovalSent(v);
  const setKmAnswer = (v: number | null) => syncMode ? onUpdateEncounter?.({ kmAnswer: v }) : _setKmAnswer(v);

  // Når flere felter skal endres i én og samme handler (f.eks. «Hopp til valgene»
  // setter både quizBonus og step), MÅ vi gjøre ett samlet skriv — to separate
  // patchGroup-kall raser mot hverandre (samme syncedGroup-snapshot i begge closures)
  // og det siste skrivet overskriver det første.
  const updateMany = (partial: Partial<SyncedEncounter>) => {
    if (syncMode) { onUpdateEncounter?.(partial); return; }
    if (partial.step !== undefined) _setStep(partial.step);
    if (partial.approvalSent !== undefined) _setApprovalSent(partial.approvalSent);
    if (partial.kmAnswer !== undefined) _setKmAnswer(partial.kmAnswer);
    if (partial.quizIdx !== undefined) _setQuizIdx(partial.quizIdx);
    if (partial.quizCorrect !== undefined) _setQuizCorrect(partial.quizCorrect);
    if (partial.quizAnswer !== undefined) _setQuizAnswer(partial.quizAnswer);
    if (partial.quizBonus !== undefined) _setQuizBonus(partial.quizBonus);
    if (partial.choiceId !== undefined) {
      const c = partial.choiceId ? d.choices.find((ch) => ch.id === partial.choiceId) ?? null : null;
      _setChoice(c);
    }
    if (partial.roll !== undefined) {
      _setRoll(partial.roll ? { raw: partial.roll.raw, effective: partial.roll.effective, modifier: partial.roll.modifier, tier: partial.roll.tier as RollResult['tier'] } : null);
    }
  };

  // Kort bølgeeffekt idet vi seiler inn til destinasjonen (§10).
  useEffect(() => { playSound('waves'); }, []);

  // Bakgrunnsmusikk per kontekst (§10): reflekterende under kulturmøte/oppgave/quiz,
  // ellers det eventyrlige seilas-sporet. lib/music.ts crossfader mykt mellom dem.
  useEffect(() => {
    const reflective = step === 'kulturmote' || step === 'oppgave' || step === 'transition' || step === 'quiz';
    playMusic(reflective ? 'reflective' : 'adventure');
  }, [step]);

  // Quiz-overgang: krigshorn + fakta forsegles, så vises quizen. Kun høvdingen
  // utløser tids-overgangen til 'quiz' (alle får oppdateringen via Firebase-echo).
  useEffect(() => {
    if (step !== 'transition') return;
    playSound('horn');
    if (!isChief) return;
    const t = setTimeout(() => setStep('quiz'), 1500);
    return () => clearTimeout(t);
  }, [step, isChief]); // eslint-disable-line react-hooks/exhaustive-deps

  const choiceLatePenalty = choice ? lateGamePenalty(choice, skills, lateGame) : 0;
  const modifier = choice ? quizBonus + skillBonusForChoice(choice, skills) + choiceLatePenalty : 0;
  const outcome = choice && roll ? choice.outcomes[roll.tier] : null;

  const ChiefBanner = () => (
    <p className="mt-8 text-center font-cinzel text-viking-gold-soft" data-testid="encounter-spectator-banner">
      ⚓ Høvdingen styrer skipet — dere ser med
    </p>
  );

  // 1) HISTORIE
  if (step === 'history') {
    return (
      <Shell name={d.name} onExit={onExit}>
        <div className="mb-2 flex items-center gap-3">
          <span className="rounded-full px-3 py-0.5 font-mono text-xs text-viking-darkblue" style={{ backgroundColor: DIFFICULTY_COLOR[d.difficulty ?? 'middels'] }}>{d.difficulty}</span>
          <span className="font-inter text-sm text-viking-gold-soft">{d.region}</span>
        </div>
        <h1 className="mb-4 font-cinzel text-3xl font-bold text-viking-gold">{d.name}</h1>
        <Html html={d.history ?? ''} className="block font-inter leading-relaxed text-viking-paper/90 [&_strong]:text-viking-gold-soft" />
        {isChief ? (
          <button onClick={() => setStep('kulturmote')} className="mt-8 rounded-md border-2 border-viking-gold bg-viking-gold px-8 py-2 font-cinzel font-bold text-viking-darkblue hover:bg-viking-gold-soft">Videre →</button>
        ) : <ChiefBanner />}
      </Shell>
    );
  }

  // 2) EPISK KULTURMØTE
  if (step === 'kulturmote') {
    const km = d.episkeKulturmote;
    return (
      <Shell name={d.name} onExit={onExit}>
        <p className="mb-1 font-inter text-xs uppercase tracking-widest text-viking-gold-soft/70">Episk kulturmøte</p>
        <h1 className="mb-4 font-cinzel text-2xl font-bold text-viking-gold">{km.tittel}</h1>
        <p className="mb-6 whitespace-pre-line border-l-4 border-viking-gold/50 pl-4 font-inter italic leading-relaxed text-viking-paper/90">{km.scene}</p>
        <div className="rounded-lg border-2 border-viking-gold/40 bg-viking-darkblue/50 p-5">
          <QuestionCard
            q={km.kulturmøteSpørsmål.q}
            opts={km.kulturmøteSpørsmål.opts}
            correct={km.kulturmøteSpørsmål.correct}
            feedback={km.kulturmøteSpørsmål.feedback}
            answer={kmAnswer}
            onAnswer={isChief ? setKmAnswer : () => {}}
          />
        </div>
        {kmAnswer !== null && (isChief ? (
          <button onClick={() => setStep('oppgave')} className="mt-6 rounded-md border-2 border-viking-gold bg-viking-gold px-8 py-2 font-cinzel font-bold text-viking-darkblue hover:bg-viking-gold-soft">Videre →</button>
        ) : <ChiefBanner />)}
      </Shell>
    );
  }

  // 3) OPPGAVESIDE
  if (step === 'oppgave') {
    return (
      <Shell name={d.name} onExit={onExit}>
        <h1 className="mb-5 font-cinzel text-2xl font-bold text-viking-gold">På stedet</h1>
        <div className="space-y-4">
          <div className="rounded-lg border-2 border-viking-teal/50 bg-viking-teal/10 p-4">
            <p className="mb-1 font-cinzel text-sm text-viking-gold-soft">Visste du?</p>
            <Html html={d.funFact ?? ''} className="font-inter text-sm text-viking-paper/90 [&_strong]:text-viking-gold-soft" />
          </div>
          <div className="rounded-lg border-2 border-viking-plum/50 bg-viking-plum/10 p-4">
            <p className="mb-1 font-cinzel text-sm text-viking-gold-soft">Kjent person</p>
            <Html html={d.famousPerson ?? ''} className="font-inter text-sm text-viking-paper/90 [&_strong]:text-viking-gold-soft" />
          </div>
          <div className="rounded-lg border-2 border-viking-gold bg-viking-surface p-5">
            <p className="mb-1 font-mono text-xs text-viking-gold-soft">{d.task.icon} {d.task.typeLabel}</p>
            <h3 className="mb-2 font-cinzel text-xl text-viking-gold">{d.task.title}</h3>
            <p className="mb-3 font-inter text-sm text-viking-paper/90">{d.task.desc}</p>
            <p className="font-inter text-xs italic text-viking-paper/60">{d.task.rationale}</p>
            {onRequestApproval && (
              <div className="mt-4 border-t border-viking-gold/20 pt-3">
                {approvalSent ? (
                  <p className="font-inter text-sm text-viking-moss">✋ Sendt til læreren — venter på godkjenning</p>
                ) : (
                  <button
                    onClick={() => { onRequestApproval(d.id, d.task.title); setApprovalSent(true); }}
                    className="rounded-md border-2 border-viking-gold/60 px-4 py-1.5 font-cinzel text-sm text-viking-gold-soft hover:border-viking-gold"
                  >
                    ✋ Be læreren om godkjenning
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        {isChief ? (
          <div className="mt-7 flex flex-wrap gap-3">
            <button onClick={() => setStep('transition')} className="rounded-md border-2 border-viking-gold bg-viking-gold px-7 py-2 font-cinzel font-bold text-viking-darkblue hover:bg-viking-gold-soft">Start stedsquiz →</button>
            <button onClick={() => updateMany({ quizBonus: 0, step: 'valg' })} className="rounded-md border-2 border-viking-gold/50 px-6 py-2 font-cinzel text-viking-gold-soft hover:border-viking-gold">Hopp til valgene</button>
          </div>
        ) : <ChiefBanner />}
      </Shell>
    );
  }

  // 4a) QUIZ-OVERGANG (fakta forsegles bak skjold + sjøtåke, §6.6/§10)
  if (step === 'transition') {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-viking-darkblue text-viking-gold">
        {/* Sjøtåke som legger seg over faktaene */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.1 }}
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-viking-surface via-viking-surface/60 to-transparent"
        />
        {/* Skjold som glir inn ovenfra og forsegler */}
        <motion.div
          initial={{ y: '-130%', rotate: -25, opacity: 0 }}
          animate={{ y: 0, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 90, damping: 11 }}
          className="relative text-8xl drop-shadow-[0_0_28px_rgba(212,168,67,0.65)]"
        >
          🛡️
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="relative mt-6 font-cinzel text-2xl tracking-widest"
        >
          ᚦ Fakta forsegles ᚱ
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="relative mt-2 font-inter text-sm italic text-viking-gold-soft/70"
        >
          Nå tester vi hva dere husker …
        </motion.p>
      </div>
    );
  }

  // 4b) STEDSQUIZ
  if (step === 'quiz') {
    const q = d.stedsquiz[quizIdx];
    const last = quizIdx === d.stedsquiz.length - 1;
    return (
      <Shell name={d.name} onExit={onExit}>
        <div className="mb-4 flex items-center justify-between">
          <p className="font-cinzel text-sm text-viking-gold-soft">Stedsquiz {quizIdx + 1}/{d.stedsquiz.length}</p>
          <p className="font-mono text-xs text-viking-gold-soft">Riktige: {quizCorrect}</p>
        </div>
        <div className="rounded-lg border-2 border-viking-gold/40 bg-viking-darkblue/50 p-5">
          <QuestionCard
            q={q.q}
            opts={q.opts}
            correct={q.correct}
            feedback={q.feedback}
            answer={quizAnswer}
            onAnswer={isChief ? ((i) => updateMany({ quizAnswer: i, ...(i === q.correct ? { quizCorrect: quizCorrect + 1 } : {}) })) : () => {}}
          />
        </div>
        {quizAnswer !== null && (isChief ? (
          <button
            onClick={() => {
              if (last) updateMany({ quizBonus: Math.min(2, quizCorrect), step: 'valg' });
              else updateMany({ quizIdx: quizIdx + 1, quizAnswer: null });
            }}
            className="mt-6 rounded-md border-2 border-viking-gold bg-viking-gold px-8 py-2 font-cinzel font-bold text-viking-darkblue hover:bg-viking-gold-soft"
          >
            {last ? 'Til valgene →' : 'Neste spørsmål →'}
          </button>
        ) : <ChiefBanner />)}
      </Shell>
    );
  }

  // 5a) VALG
  if (step === 'valg') {
    return (
      <Shell name={d.name} onExit={onExit}>
        <h1 className="mb-1 font-cinzel text-2xl font-bold text-viking-gold">Hva gjør dere?</h1>
        <p className="mb-5 font-inter text-sm text-viking-gold-soft">
          Terningbonus fra quiz: <strong className="text-viking-gold">+{quizBonus}</strong>
        </p>
        <div className="space-y-4">
          {d.choices.map((c) => {
            const meets = meetsRequirement(c, skills);
            const lateAvailable = lateGame && !meets;
            const available = meets || lateAvailable;
            const reqText = c.skillReq
              ? (Object.entries(c.skillReq) as [SkillKey, number][]).map(([s, n]) => `${skillName(s)} ${n}`).join(', ')
              : null;
            const cardCls =
              !available ? 'border-viking-crimson/40 bg-viking-darkblue/40 opacity-70' :
              lateAvailable ? 'border-viking-gold-soft/70 bg-viking-surface ring-2 ring-viking-gold-soft/20' :
              'border-viking-gold/40 bg-viking-surface';
            return (
              <div key={c.id} className={`rounded-lg border-2 p-4 ${cardCls}`} data-testid={`valg-${c.id}`}>
                <div className="mb-1 flex items-center gap-2">
                  <h3 className="font-cinzel text-lg text-viking-gold">{c.title}</h3>
                  <span className="rounded bg-viking-darkblue/70 px-2 py-0.5 font-mono text-[10px] uppercase text-viking-gold-soft/80">{c.tag}</span>
                </div>
                <p className="mb-3 font-inter text-sm text-viking-paper/85">{c.desc}</p>
                {reqText && (
                  meets ? (
                    <p className="mb-2 font-mono text-xs text-viking-moss">✓ Krever {reqText}</p>
                  ) : lateAvailable ? (
                    <p className="mb-2 font-mono text-xs text-viking-gold-soft" data-testid={`late-warning-${c.id}`}>
                      ⚠ Krever {reqText} — dere mangler den, og det straffer seg sent i reisen (−2 på terningen).
                    </p>
                  ) : (
                    <p className="mb-2 font-mono text-xs text-viking-crimson">🔒 Krever {reqText}</p>
                  )
                )}
                <OddsBar baseRoll={c.baseRoll} />
                {isChief ? (
                  <button
                    disabled={!available}
                    onClick={() => updateMany({ choiceId: c.id, roll: null, step: 'roll' })}
                    data-testid={`pick-${c.id}`}
                    className="mt-3 rounded-md border-2 border-viking-gold bg-viking-gold px-5 py-1.5 font-cinzel text-sm font-bold text-viking-darkblue hover:bg-viking-gold-soft disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Velg dette
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
        {!isChief && <ChiefBanner />}
      </Shell>
    );
  }

  // 5b) TERNINGKAST
  if (step === 'roll' && choice) {
    const skillBonus = skillBonusForChoice(choice, skills);
    return (
      <Shell name={d.name} onExit={onExit}>
        <h1 className="mb-4 font-cinzel text-2xl font-bold text-viking-gold">{choice.title}</h1>
        <div className="rounded-lg border-2 border-viking-gold/40 bg-viking-surface p-5">
          <OddsBar baseRoll={choice.baseRoll} />
          <div className="mt-4 font-mono text-sm text-viking-paper/80">
            <p>Quizbonus: +{quizBonus}</p>
            <p>Ferdighet over krav: +{skillBonus}</p>
            {choiceLatePenalty < 0 && (
              <p className="text-viking-crimson" data-testid="late-penalty-line">
                ⚠ Sen-spill-straff (mangler ferdighet): {choiceLatePenalty}
              </p>
            )}
            <p className="mt-1 text-viking-gold">Terningmodifikator: {modifier >= 0 ? '+' : ''}{modifier}</p>
          </div>
        </div>
        {isChief ? (
          <button
            onClick={() => {
              const r = rollDice(choice.baseRoll, modifier);
              playSound('dice');
              updateMany({ roll: { raw: r.raw, effective: r.effective, modifier: r.modifier, tier: r.tier }, step: 'rolling' });
            }}
            className="mt-7 rounded-md border-2 border-viking-gold bg-viking-gold px-10 py-2.5 font-cinzel text-lg font-bold text-viking-darkblue hover:bg-viking-gold-soft"
          >
            ⚄ Kast terningen
          </button>
        ) : <ChiefBanner />}
      </Shell>
    );
  }

  // 5b-ii) TERNINGRULL-ANIMASJON → utfallslyd → resultat
  if (step === 'rolling' && roll) {
    return (
      <DiceRoll
        value={roll.effective}
        onDone={() => {
          const s = roll.tier === 'crit' ? 'fanfare' : roll.tier === 'good' ? 'silver' : roll.tier === 'bad' ? 'thunder' : null;
          if (s) playSound(s);
          setStep('resultat');
        }}
      />
    );
  }

  // 5c) RESULTAT
  if (step === 'resultat' && choice && roll && outcome) {
    // Historisk-nøyaktighet-bonus (§6.1): +2 kulturforståelse hvis dette valget
    // ligner det vikingene faktisk gjorde — flagget i destinasjons-dataen.
    const isHistorical = !!d.historicalChoiceId && d.historicalChoiceId === choice.id;
    const undWithBonus = outcome.und + (isHistorical ? 2 : 0);
    const deltas: { label: string; v: number }[] = [
      { label: 'Kulturforståelse', v: undWithBonus },
      { label: 'Handelsutbytte', v: outcome.trade },
      { label: 'Rykte', v: outcome.rep },
    ];
    return (
      <Shell name={d.name} onExit={onExit}>
        <div className="mb-5 flex items-center gap-4">
          <motion.div
            initial={{ scale: 0.3, rotate: -25, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 14 }}
            className="flex h-16 w-16 items-center justify-center rounded-lg border-4 font-cinzel text-3xl font-bold text-viking-gold"
            style={{ borderColor: TIER_COLOR[roll.tier], backgroundColor: '#0B1426' }}
          >
            {roll.effective}
          </motion.div>
          <div>
            <p className="font-mono text-xs text-viking-paper/60">Terning {roll.raw} {roll.modifier ? `(+${roll.modifier})` : ''}</p>
            <p className="font-cinzel text-2xl font-bold" style={{ color: TIER_COLOR[roll.tier] }}>{TIER_LABEL[roll.tier]}</p>
          </div>
        </div>
        <p className="mb-5 font-inter leading-relaxed text-viking-paper/90">{outcome.text}</p>

        {isHistorical && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-5 rounded-md border-2 border-viking-gold bg-viking-gold/15 px-3 py-2"
            data-testid="historical-bonus"
          >
            <p className="font-cinzel text-sm text-viking-gold">📜 Historisk klokt — dette ligner det vikingene faktisk gjorde.</p>
            <p className="mt-0.5 font-inter text-xs italic text-viking-paper/85">+2 kulturforståelse i bonus.</p>
          </motion.div>
        )}

        <div className="mb-5 grid grid-cols-3 gap-3">
          {deltas.map((x) => (
            <div key={x.label} className="rounded-lg border-2 border-viking-gold/30 bg-viking-darkblue/50 p-3 text-center">
              <p className="font-mono text-xs text-viking-gold-soft">{x.label}</p>
              <p className={`font-cinzel text-2xl font-bold ${x.v > 0 ? 'text-viking-moss' : x.v < 0 ? 'text-viking-crimson' : 'text-viking-paper/70'}`}>{x.v > 0 ? `+${x.v}` : x.v}</p>
            </div>
          ))}
        </div>
        <div className="rounded-lg border-l-4 border-viking-gold bg-viking-surface p-4">
          <p className="mb-1 font-cinzel text-sm text-viking-gold-soft">Lærdom</p>
          <p className="font-inter text-sm italic text-viking-paper/90">{choice.lesson}</p>
        </div>
        {isChief ? (
          <button
            onClick={() => onComplete({
              destId: d.id,
              deltas: { und: undWithBonus, trade: outcome.trade, rep: outcome.rep },
              skillReward: choice.skillReward,
              locks: choice.locks ?? [],
              goodsReward: d.goodsReward,
            })}
            className="mt-7 rounded-md border-2 border-viking-gold bg-viking-gold px-10 py-2.5 font-cinzel text-lg font-bold text-viking-darkblue hover:bg-viking-gold-soft"
          >
            ⛵ Seil videre
          </button>
        ) : <ChiefBanner />}
      </Shell>
    );
  }

  return null;
}
