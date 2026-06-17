/**
 * Svenneprove.tsx
 * Den ENE svenneprøve-flyten per domene — TODELT (begge deler kreves):
 *   DEL 1 (teori): ferdighetstre-quiz om besøkte steder (sveinn: 3 spm/2 rette,
 *                  mester: 4 spm/3 rette). Quiz fra vikingspill_quiz.json.
 *   DEL 2 (praksis): en domene-spesifikk, aktiv oppgave (SkillPractice).
 * Bestått sveinn → svennebrev[domene]=1; bestått mester (vanskeligere) → =2.
 * Opplåsingen (havn/evne) avledes av svennebrev via SIDE_UNLOCKS/isAccessible.
 */

import { useState, useEffect, type ReactNode } from 'react';
import { motion } from 'motion/react';
import type { SkillKey } from '../../types';
import { skillTreeData, getQuizQuestionsForSkill, isQuizPassed } from '../../data';
import { playSound } from '../../lib/sound';
import QuestionCard from '../quiz/QuestionCard';
import NorseIcon, { SKILL_PNG } from '../decor/NorseIcon';
import MaterialPanel from '../decor/MaterialPanel';
import SkillPractice from './SkillPractice';

type Phase = 'quiz' | 'failed' | 'practice' | 'passed';

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
  /** Gjeldende svennebrev i domenet: 0 = ingen, 1 = sveinn. (2 = mester → ikke åpne.) */
  brev: 0 | 1 | 2;
  visited: string[];
  isChief: boolean;
  onPass: (newBrev: 0 | 1 | 2) => void;
  onClose: () => void;
}

export default function Svenneprove({ skill, brev, visited, isChief, onPass, onClose }: Props) {
  const branch = skillTreeData[skill];
  // brev 0 → sveinn-prøven (lettere quiz); brev 1 → mester-prøven (vanskeligere).
  const isMester = brev >= 1;
  const targetBrev: 1 | 2 = isMester ? 2 : 1;
  const tier: 2 | 3 = isMester ? 3 : 2;           // quiz-vanskelighet fra ferdighetstreet
  const count = tier === 2 ? 3 : 4;
  const passNeeded = tier === 2 ? 2 : 3;
  const proveName = isMester ? 'Mester' : 'Sveinn';
  const targetTierName = branch.tiers[tier - 1].name; // tiers[1]/[2] = opplåsings-beskrivelsen
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
    // DEL 1 bestått → videre til praksis (DEL 2). Ferdigheten heves først når begge er klart.
    if (isQuizPassed(tier, correct)) setPhase('practice');
    else setPhase('failed');
  };

  if (phase === 'quiz') {
    const q = questions[idx];
    const last = idx === questions.length - 1;
    return (
      <TrialShell title={title} iconName={SKILL_PNG[skill]} onClose={onClose}>
        <div className="mb-4 flex items-center justify-between">
          <p className="font-cinzel text-sm text-viking-gold-soft">DEL 1 (teori) · Spørsmål {idx + 1}/{count} · trenger {passNeeded} rette</p>
          <p className="font-mono text-xs text-viking-gold-soft">Riktige: {correct}</p>
        </div>
        <MaterialPanel material="jern" className="p-5">
          <QuestionCard
            q={q.q}
            opts={q.opts}
            correct={q.correct}
            feedback={q.feedback}
            answer={answer}
            onAnswer={(i) => { setAnswer(i); if (i === q.correct) setCorrect((c) => c + 1); }}
          />
        </MaterialPanel>
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
        <p className="mb-6 font-inter text-viking-paper/90">Dere fullførte både teori (DEL 1) og praksis (DEL 2) — <strong className="text-viking-gold-soft">{proveName} i {branch.name}</strong> er bestått ({targetTierName}).</p>
        <button onClick={() => onPass(targetBrev)} className="rounded-md border-2 border-viking-gold bg-viking-gold px-9 py-2.5 font-saga text-lg font-bold text-viking-darkblue hover:bg-viking-gold-soft">Fullfør</button>
      </TrialShell>
    );
  }

  // phase === 'practice' (DEL 2) — ferdighetsspesifikk, aktiv oppgave (begge nivå)
  return (
    <TrialShell title={title} iconName={SKILL_PNG[skill]} onClose={onClose}>
      <SkillPractice skill={skill} isChief={isChief} onDone={() => setPhase('passed')} />
      <div className="mt-7">
        <button onClick={onClose} className="rounded-md border-2 border-viking-gold/50 px-6 py-2 font-cinzel text-viking-gold-soft hover:border-viking-gold">Avbryt</button>
      </div>
    </TrialShell>
  );
}
