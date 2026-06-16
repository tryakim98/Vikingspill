/**
 * SkillTrial.tsx
 * Verdighetsprøven (§3.2) for å låse opp ferdighetsnivå:
 *   - Lærlingeprøven (1→2): 3 ferdighetstre-spørsmål om besøkte steder, 2 må være rette.
 *   - Mesterprøven (2→3): 4 spørsmål, 3 rette + en ferdighetsspesifikk handling læreren godkjenner.
 * Spørsmålene kommer fra ferdighetstre-quizen (vikingspill_quiz.json), filtrert på
 * besøkte destinasjoner — IKKE stedsquizen.
 */

import { useState, useEffect, type ReactNode } from 'react';
import { motion } from 'motion/react';
import type { SkillKey } from '../../types';
import { skillTreeData, getQuizQuestionsForSkill, isQuizPassed } from '../../data';
import { playSound } from '../../lib/sound';
import QuestionCard from '../quiz/QuestionCard';
import NorseIcon, { SKILL_PNG } from '../decor/NorseIcon';

const MASTER_ACTION: Record<SkillKey, string> = {
  språk: 'Lær en hel setning på et fremmedspråk (norrønt, arabisk eller gresk) og fremfør den for læreren.',
  sjømannskap: 'Tegn en korrekt navigasjonsrute mellom to destinasjoner dere har besøkt, og forklar den for læreren.',
  krigskunst: 'Demonstrer en skjoldborg-formasjon med hele gruppen — fysisk, for læreren.',
  diplomati: 'Forhandle frem en «avtale» med en medelev eller noen på biblioteket, live.',
  tro: 'Fremfør et selvlaget skaldekvad på fire linjer om reisen deres.',
};

type Phase = 'quiz' | 'failed' | 'action' | 'passed';

function TrialShell({ title, iconName, onClose, children }: { title: string; iconName?: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="min-h-screen viking-screen text-viking-paper">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between border-b-2 border-viking-gold/40 pb-3">
          <h2 className="inline-flex items-center gap-2 font-cinzel text-xl text-viking-gold">
            {iconName && <NorseIcon name={iconName} size={22} className="text-viking-gold-soft" />}{title}
          </h2>
          <button onClick={onClose} className="font-inter text-xs text-viking-gold-soft/70 hover:text-viking-gold-soft">✕ Lukk</button>
        </div>
        {children}
      </div>
    </div>
  );
}

interface Props {
  skill: SkillKey;
  level: number;
  visited: string[];
  onPass: (newLevel: number) => void;
  onClose: () => void;
}

export default function SkillTrial({ skill, level, visited, onPass, onClose }: Props) {
  const branch = skillTreeData[skill];
  const tier: 2 | 3 = level >= 2 ? 3 : 2;
  const count = tier === 2 ? 3 : 4;
  const passNeeded = tier === 2 ? 2 : 3;
  const proveName = tier === 2 ? 'Lærlingeprøven' : 'Mesterprøven';
  const targetTierName = branch.tiers[tier - 1].name; // tiers[1] = nivå 2, tiers[2] = nivå 3
  const title = `${branch.name} — ${proveName}`;

  const [questions, setQuestions] = useState(() => getQuizQuestionsForSkill(skill, tier, visited, count));
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('quiz');

  // Klokkeklang når nivå 2 er bestått (§10). Nivå 3 ringer ved lærergodkjenning under.
  useEffect(() => { if (phase === 'passed') playSound('bell'); }, [phase]);

  // Ikke nok spørsmål om besøkte steder (§6.4 filtreringsregel)
  if (questions.length < count) {
    return (
      <TrialShell title={title} iconName={SKILL_PNG[skill]} onClose={onClose}>
        <p className="font-cinzel text-2xl text-viking-gold mb-4">Gudene venter ennå</p>
        <p className="font-inter text-viking-paper/90">
          Dere har ikke besøkt nok steder til at {proveName.toLowerCase()} kan holdes i <strong>{branch.name}</strong> ennå
          (trenger {count} spørsmål om steder dere har vært, har {questions.length}).
          Seil til flere destinasjoner og kom tilbake.
        </p>
        <button onClick={onClose} className="mt-8 rounded-md border-2 border-viking-gold bg-viking-gold px-8 py-2 font-saga font-bold text-viking-darkblue hover:bg-viking-gold-soft">Tilbake</button>
      </TrialShell>
    );
  }

  const restart = () => {
    setQuestions(getQuizQuestionsForSkill(skill, tier, visited, count));
    setIdx(0);
    setCorrect(0);
    setAnswer(null);
    setPhase('quiz');
  };

  const finishQuiz = () => {
    if (isQuizPassed(tier, correct)) {
      setPhase(tier === 2 ? 'passed' : 'action');
    } else {
      setPhase('failed');
    }
  };

  if (phase === 'quiz') {
    const q = questions[idx];
    const last = idx === questions.length - 1;
    return (
      <TrialShell title={title} iconName={SKILL_PNG[skill]} onClose={onClose}>
        <div className="mb-4 flex items-center justify-between">
          <p className="font-cinzel text-sm text-viking-gold-soft">Spørsmål {idx + 1}/{count} · trenger {passNeeded} rette</p>
          <p className="font-mono text-xs text-viking-gold-soft">Riktige: {correct}</p>
        </div>
        <div className="rounded-lg border-2 border-viking-gold/40 bg-viking-darkblue/50 p-5">
          <QuestionCard
            q={q.q}
            opts={q.opts}
            correct={q.correct}
            feedback={q.feedback}
            answer={answer}
            onAnswer={(i) => { setAnswer(i); if (i === q.correct) setCorrect((c) => c + 1); }}
          />
        </div>
        {answer !== null && (
          <button
            onClick={() => { if (last) finishQuiz(); else { setIdx((n) => n + 1); setAnswer(null); } }}
            className="mt-6 rounded-md border-2 border-viking-gold bg-viking-gold px-8 py-2 font-saga font-bold text-viking-darkblue hover:bg-viking-gold-soft"
          >
            {last ? 'Fullfør prøven' : 'Neste spørsmål →'}
          </button>
        )}
      </TrialShell>
    );
  }

  if (phase === 'failed') {
    return (
      <TrialShell title={title} iconName={SKILL_PNG[skill]} onClose={onClose}>
        <p className="mb-3 font-cinzel text-2xl text-viking-crimson">Ikke bestått</p>
        <p className="mb-6 font-inter text-viking-paper/90">Dere fikk <strong>{correct} av {count}</strong> riktige — trenger {passNeeded}. Gudene gir dere en ny sjanse.</p>
        <div className="flex gap-3">
          <button onClick={restart} className="rounded-md border-2 border-viking-gold bg-viking-gold px-7 py-2 font-saga font-bold text-viking-darkblue hover:bg-viking-gold-soft">Prøv igjen</button>
          <button onClick={onClose} className="rounded-md border-2 border-viking-gold/50 px-6 py-2 font-cinzel text-viking-gold-soft hover:border-viking-gold">Lukk</button>
        </div>
      </TrialShell>
    );
  }

  if (phase === 'passed') {
    return (
      <TrialShell title={title} iconName={SKILL_PNG[skill]} onClose={onClose}>
        <motion.p
          initial={{ scale: 0.6, opacity: 0, textShadow: '0 0 0px rgba(205,195,173,0)' }}
          animate={{ scale: 1, opacity: 1, textShadow: ['0 0 0px rgba(205,195,173,0)', '0 0 26px rgba(205,195,173,0.9)', '0 0 10px rgba(205,195,173,0.5)'] }}
          transition={{ duration: 1.1, type: 'spring', stiffness: 180, damping: 12 }}
          className="mb-3 font-cinzel text-3xl text-viking-gold"
        >
          ✦ Bestått!
        </motion.p>
        <p className="mb-6 font-inter text-viking-paper/90">Dere fikk {correct} av {count} riktige og har låst opp <strong className="text-viking-gold-soft">{targetTierName}</strong> (nivå 2) i {branch.name}.</p>
        <button onClick={() => onPass(2)} className="rounded-md border-2 border-viking-gold bg-viking-gold px-9 py-2.5 font-saga text-lg font-bold text-viking-darkblue hover:bg-viking-gold-soft">Fullfør</button>
      </TrialShell>
    );
  }

  // phase === 'action' (mesterprøven, nivå 2→3)
  return (
    <TrialShell title={title} iconName={SKILL_PNG[skill]} onClose={onClose}>
      <p className="mb-2 font-cinzel text-2xl text-viking-gold">Quiz bestått — siste prøve</p>
      <p className="mb-5 font-inter text-viking-paper/90">Dere fikk {correct} av {count} riktige. For å bli <strong className="text-viking-gold-soft">{targetTierName}</strong> (nivå 3) må dere fullføre mesterhandlingen:</p>
      <div className="rounded-lg border-2 border-viking-gold bg-viking-surface p-5">
        <p className="mb-1 font-cinzel text-sm text-viking-gold-soft">Mesterhandling — {branch.name}</p>
        <p className="font-inter text-viking-paper/90">{MASTER_ACTION[skill]}</p>
      </div>
      <div className="mt-7 flex gap-3">
        <button onClick={() => { playSound('bell'); onPass(3); }} className="rounded-md border-2 border-viking-gold bg-viking-gold px-7 py-2.5 font-saga font-bold text-viking-darkblue hover:bg-viking-gold-soft">Læreren godkjenner ✓</button>
        <button onClick={onClose} className="rounded-md border-2 border-viking-gold/50 px-6 py-2 font-cinzel text-viking-gold-soft hover:border-viking-gold">Avbryt</button>
      </div>
    </TrialShell>
  );
}
