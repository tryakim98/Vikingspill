/**
 * SvenneproveTrial.tsx
 * «Ferdsbrev» — en ADGANG som låser opp et sidested (ikke en ferdighets-prøve).
 * 3 spørsmål fra ferdighetstre-quizen for valgt ferdighet, filtrert til besøkte
 * destinasjoner. 2/3 rette = bestått og sidestedet låses opp permanent.
 *
 * NB: filnavn, props og data-testid-er beholder «svenneprove» (intern logikk);
 * kun synlig UI-tekst sier «ferdsbrev». Vi gjenbruker tier-2-spørsmålssettet.
 */

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { SkillKey } from '../../types';
import { skillTreeData, getQuizQuestionsForSkill, isQuizPassed } from '../../data';
import QuestionCard from '../quiz/QuestionCard';
import { playSound } from '../../lib/sound';
import MaterialPanel from '../decor/MaterialPanel';
import { AutoIcon } from '../decor/NorseIcon';

interface Props {
  skill: SkillKey;
  destName: string;
  visited: string[];
  isChief: boolean;
  onPass: () => void;
  onClose: () => void;
}

type Phase = 'quiz' | 'passed' | 'failed';

const COUNT = 3;
const PASS_NEEDED = 2;

export default function SvenneproveTrial({ skill, destName, visited, isChief, onPass, onClose }: Props) {
  const branch = skillTreeData[skill];
  const [questions, setQuestions] = useState(() => getQuizQuestionsForSkill(skill, 2, visited, COUNT));
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('quiz');

  // Klang når sjøstedet faktisk låses opp (§3.2).
  useEffect(() => { if (phase === 'passed') playSound('unlock'); }, [phase]);

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen viking-screen text-viking-paper">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between border-b-2 border-viking-gold/40 pb-3">
          <h2 className="inline-flex items-center gap-2 font-cinzel text-xl text-viking-gold"><AutoIcon name={branch.icon} size={20} /> Ferdsbrev — {branch.name}</h2>
          <button onClick={onClose} className="font-inter text-xs text-viking-gold-soft/70 hover:text-viking-gold-soft">✕ Avbryt</button>
        </div>
        <p className="mb-4 font-inter italic text-viking-gold-soft">For å låse opp <strong>{destName}</strong></p>
        {children}
      </div>
    </div>
  );

  // Ikke nok spørsmål om besøkte steder (§6.4)
  if (questions.length < COUNT) {
    return (
      <Shell>
        <p className="font-cinzel text-2xl text-viking-gold mb-4">Du har ikke sett nok av verden</p>
        <p className="font-inter text-viking-paper/90">
          Ferdsbrevet krever {COUNT} spørsmål om steder dere har besøkt, men dere har bare {questions.length} tilgjengelig.
          Seil til flere destinasjoner og kom tilbake.
        </p>
        <button onClick={onClose} className="mt-8 rounded-md border-2 border-viking-gold bg-viking-gold px-8 py-2 font-saga font-bold text-viking-darkblue hover:bg-viking-gold-soft">Tilbake</button>
      </Shell>
    );
  }

  const finishQuiz = () => {
    if (isQuizPassed(2, correct)) setPhase('passed');
    else setPhase('failed');
  };

  const restart = () => {
    setQuestions(getQuizQuestionsForSkill(skill, 2, visited, COUNT));
    setIdx(0);
    setCorrect(0);
    setAnswer(null);
    setPhase('quiz');
  };

  if (phase === 'quiz') {
    const q = questions[idx];
    const last = idx === questions.length - 1;
    return (
      <Shell>
        <div className="mb-4 flex items-center justify-between">
          <p className="font-cinzel text-sm text-viking-gold-soft">Spørsmål {idx + 1}/{COUNT} · trenger {PASS_NEEDED} rette</p>
          <p className="font-mono text-xs text-viking-gold-soft">Riktige: {correct}</p>
        </div>
        <MaterialPanel material="jern" className="p-5">
          <QuestionCard
            q={q.q}
            opts={q.opts}
            correct={q.correct}
            feedback={q.feedback}
            answer={answer}
            onAnswer={isChief ? ((i) => { setAnswer(i); if (i === q.correct) setCorrect(correct + 1); }) : () => {}}
          />
        </MaterialPanel>
        {answer !== null && (isChief ? (
          <button
            onClick={() => { if (last) finishQuiz(); else { setIdx(idx + 1); setAnswer(null); } }}
            className="mt-6 rounded-md border-2 border-viking-gold bg-viking-gold px-8 py-2 font-saga font-bold text-viking-darkblue hover:bg-viking-gold-soft"
          >
            {last ? 'Fullfør prøven' : 'Neste spørsmål →'}
          </button>
        ) : (
          <p className="mt-6 inline-flex w-full items-center justify-center gap-1.5 text-center font-cinzel text-viking-gold-soft"><AutoIcon name="anchor" size={16} /> Høvdingen styrer skipet — dere ser med</p>
        ))}
      </Shell>
    );
  }

  if (phase === 'failed') {
    return (
      <Shell>
        <p className="mb-3 font-cinzel text-2xl text-viking-crimson">Ikke bestått</p>
        <p className="mb-6 font-inter text-viking-paper/90">Dere fikk <strong>{correct} av {COUNT}</strong> riktige — trenger {PASS_NEEDED}. Sjøstedet forblir låst. Prøv igjen eller finn en annen vei.</p>
        <div className="flex gap-3">
          {isChief && <button onClick={restart} data-testid="svenneprove-retry" className="rounded-md border-2 border-viking-gold bg-viking-gold px-7 py-2 font-saga font-bold text-viking-darkblue hover:bg-viking-gold-soft">Prøv igjen</button>}
          <button onClick={onClose} className="rounded-md border-2 border-viking-gold/50 px-6 py-2 font-cinzel text-viking-gold-soft hover:border-viking-gold">Lukk</button>
        </div>
      </Shell>
    );
  }

  // passed
  return (
    <Shell>
      <motion.p
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1, textShadow: ['0 0 0 transparent', '0 0 26px rgba(205,195,173,0.9)', '0 0 10px rgba(205,195,173,0.5)'] }}
        transition={{ duration: 1.1, type: 'spring', stiffness: 180, damping: 12 }}
        className="mb-3 font-cinzel text-3xl text-viking-gold"
      >
        ✦ Bestått!
      </motion.p>
      <p className="mb-6 font-inter text-viking-paper/90">
        Dere fikk {correct} av {COUNT} riktige. <strong className="text-viking-gold-soft">{destName}</strong> er nå åpent — seil dit når dere er klar.
      </p>
      {isChief && (
        <button onClick={onPass} data-testid="svenneprove-claim" className="rounded-md border-2 border-viking-gold bg-viking-gold px-9 py-2.5 font-saga text-lg font-bold text-viking-darkblue hover:bg-viking-gold-soft">
          Lås opp og fortsett
        </button>
      )}
    </Shell>
  );
}
