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
import type { Destination, Choice, RollOdds, SkillKey } from '../../types';
import { skillTreeData } from '../../data';
import {
  rollDice,
  oddsPercent,
  skillBonusForChoice,
  meetsRequirement,
  TIER_LABEL,
  TIER_COLOR,
  TIER_ORDER,
  type RollResult,
} from '../../lib/oddsEngine';
import type { OutcomeApply } from '../../hooks/useGameState';
import QuestionCard from '../quiz/QuestionCard';

type Step = 'history' | 'kulturmote' | 'oppgave' | 'transition' | 'quiz' | 'valg' | 'roll' | 'resultat';

interface EncounterFlowProps {
  destination: Destination;
  skills: Record<SkillKey, number>;
  onComplete: (apply: OutcomeApply) => void;
  onExit: () => void;
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

export default function EncounterFlow({ destination, skills, onComplete, onExit }: EncounterFlowProps) {
  const d = destination;
  const [step, setStep] = useState<Step>('history');
  const [kmAnswer, setKmAnswer] = useState<number | null>(null);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizCorrect, setQuizCorrect] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizBonus, setQuizBonus] = useState(0);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [roll, setRoll] = useState<RollResult | null>(null);

  // Quiz-overgang: fakta forsegles, så vises quizen
  useEffect(() => {
    if (step !== 'transition') return;
    const t = setTimeout(() => setStep('quiz'), 1300);
    return () => clearTimeout(t);
  }, [step]);

  const modifier = choice ? quizBonus + skillBonusForChoice(choice, skills) : 0;
  const outcome = choice && roll ? choice.outcomes[roll.tier] : null;

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
        <button onClick={() => setStep('kulturmote')} className="mt-8 rounded-md border-2 border-viking-gold bg-viking-gold px-8 py-2 font-cinzel font-bold text-viking-darkblue hover:bg-viking-gold-soft">Videre →</button>
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
            onAnswer={setKmAnswer}
          />
        </div>
        {kmAnswer !== null && (
          <button onClick={() => setStep('oppgave')} className="mt-6 rounded-md border-2 border-viking-gold bg-viking-gold px-8 py-2 font-cinzel font-bold text-viking-darkblue hover:bg-viking-gold-soft">Videre →</button>
        )}
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
          </div>
        </div>
        <div className="mt-7 flex flex-wrap gap-3">
          <button onClick={() => setStep('transition')} className="rounded-md border-2 border-viking-gold bg-viking-gold px-7 py-2 font-cinzel font-bold text-viking-darkblue hover:bg-viking-gold-soft">Start stedsquiz →</button>
          <button onClick={() => { setQuizBonus(0); setStep('valg'); }} className="rounded-md border-2 border-viking-gold/50 px-6 py-2 font-cinzel text-viking-gold-soft hover:border-viking-gold">Hopp til valgene</button>
        </div>
      </Shell>
    );
  }

  // 4a) QUIZ-OVERGANG (fakta forsegles)
  if (step === 'transition') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-viking-darkblue text-viking-gold">
        <div className="animate-bob text-7xl">🛡️</div>
        <p className="mt-6 font-cinzel text-2xl tracking-widest">ᚦ Fakta forsegles ᚱ</p>
        <p className="mt-2 font-inter text-sm italic text-viking-gold-soft/70">Nå tester vi hva dere husker …</p>
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
            onAnswer={(i) => { setQuizAnswer(i); if (i === q.correct) setQuizCorrect((c) => c + 1); }}
          />
        </div>
        {quizAnswer !== null && (
          <button
            onClick={() => {
              if (last) {
                setQuizBonus(Math.min(2, quizCorrect));
                setStep('valg');
              } else {
                setQuizIdx((n) => n + 1);
                setQuizAnswer(null);
              }
            }}
            className="mt-6 rounded-md border-2 border-viking-gold bg-viking-gold px-8 py-2 font-cinzel font-bold text-viking-darkblue hover:bg-viking-gold-soft"
          >
            {last ? 'Til valgene →' : 'Neste spørsmål →'}
          </button>
        )}
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
            const available = meetsRequirement(c, skills);
            const reqText = c.skillReq
              ? (Object.entries(c.skillReq) as [SkillKey, number][]).map(([s, n]) => `${skillName(s)} ${n}`).join(', ')
              : null;
            return (
              <div key={c.id} className={`rounded-lg border-2 p-4 ${available ? 'border-viking-gold/40 bg-viking-surface' : 'border-viking-crimson/40 bg-viking-darkblue/40 opacity-70'}`}>
                <div className="mb-1 flex items-center gap-2">
                  <h3 className="font-cinzel text-lg text-viking-gold">{c.title}</h3>
                  <span className="rounded bg-viking-darkblue/70 px-2 py-0.5 font-mono text-[10px] uppercase text-viking-gold-soft/80">{c.tag}</span>
                </div>
                <p className="mb-3 font-inter text-sm text-viking-paper/85">{c.desc}</p>
                {reqText && <p className="mb-2 font-mono text-xs text-viking-crimson">{available ? '✓' : '🔒'} Krever {reqText}</p>}
                <OddsBar baseRoll={c.baseRoll} />
                <button
                  disabled={!available}
                  onClick={() => { setChoice(c); setRoll(null); setStep('roll'); }}
                  className="mt-3 rounded-md border-2 border-viking-gold bg-viking-gold px-5 py-1.5 font-cinzel text-sm font-bold text-viking-darkblue hover:bg-viking-gold-soft disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Velg dette
                </button>
              </div>
            );
          })}
        </div>
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
            <p className="mt-1 text-viking-gold">Terningmodifikator: +{modifier}</p>
          </div>
        </div>
        <button
          onClick={() => { setRoll(rollDice(choice.baseRoll, modifier)); setStep('resultat'); }}
          className="mt-7 rounded-md border-2 border-viking-gold bg-viking-gold px-10 py-2.5 font-cinzel text-lg font-bold text-viking-darkblue hover:bg-viking-gold-soft"
        >
          ⚄ Kast terningen
        </button>
      </Shell>
    );
  }

  // 5c) RESULTAT
  if (step === 'resultat' && choice && roll && outcome) {
    const deltas: { label: string; v: number }[] = [
      { label: 'Kulturforståelse', v: outcome.und },
      { label: 'Handelsutbytte', v: outcome.trade },
      { label: 'Rykte', v: outcome.rep },
    ];
    return (
      <Shell name={d.name} onExit={onExit}>
        <div className="mb-5 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg border-4 border-viking-gold bg-viking-darkblue font-cinzel text-3xl font-bold text-viking-gold">{roll.effective}</div>
          <div>
            <p className="font-mono text-xs text-viking-paper/60">Terning {roll.raw} {roll.modifier ? `(+${roll.modifier})` : ''}</p>
            <p className="font-cinzel text-2xl font-bold" style={{ color: TIER_COLOR[roll.tier] }}>{TIER_LABEL[roll.tier]}</p>
          </div>
        </div>
        <p className="mb-5 font-inter leading-relaxed text-viking-paper/90">{outcome.text}</p>
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
        <button
          onClick={() => onComplete({
            destId: d.id,
            deltas: { und: outcome.und, trade: outcome.trade, rep: outcome.rep },
            skillReward: choice.skillReward,
            locks: choice.locks ?? [],
          })}
          className="mt-7 rounded-md border-2 border-viking-gold bg-viking-gold px-10 py-2.5 font-cinzel text-lg font-bold text-viking-darkblue hover:bg-viking-gold-soft"
        >
          ⛵ Seil videre
        </button>
      </Shell>
    );
  }

  return null;
}
