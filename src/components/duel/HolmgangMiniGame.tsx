/**
 * HolmgangMiniGame.tsx
 * In-app holmgang-aktiviteter. Tre raske, avgjørbare utfordringer:
 *  - tapping:   flest skjermtrykk på 10 sek
 *  - reaksjon:  raskest reaksjonstid når skjermen blir grønn
 *  - regning:   flest riktige hoderegninger på 20 sek
 * Hver forkjemper spiller på sin egen enhet. Resultatet sendes til Firebase via
 * `submitChampionResult` (kalleren). Når begge er ferdige, kårer SeaBattle vinneren.
 */

import { useEffect, useRef, useState } from 'react';
import type { DuelChampionResult } from '../../lib/gameSync';
import { playSound } from '../../lib/sound';

type Kind = 'tapping' | 'reaksjon' | 'regning';

interface Props {
  kind: Kind;
  onDone: (result: Omit<DuelChampionResult, 'finishedAt'>) => void;
}

export default function HolmgangMiniGame({ kind, onDone }: Props) {
  // Forkjemperen går inn på holmen — duell-signal (§7.2).
  useEffect(() => { playSound('duel'); }, []);
  if (kind === 'tapping') return <TappingGame onDone={onDone} />;
  if (kind === 'reaksjon') return <ReactionGame onDone={onDone} />;
  return <MathGame onDone={onDone} />;
}

// ── Tapping ──────────────────────────────────────────────────────────────────
function TappingGame({ onDone }: { onDone: Props['onDone'] }) {
  const [phase, setPhase] = useState<'ready' | 'go' | 'done'>('ready');
  const [score, setScore] = useState(0);
  const [remainingMs, setRemainingMs] = useState(10000);
  const sentRef = useRef(false);

  useEffect(() => {
    if (phase !== 'go') return;
    const start = Date.now();
    const t = setInterval(() => {
      const left = Math.max(0, 10000 - (Date.now() - start));
      setRemainingMs(left);
      if (left === 0) { clearInterval(t); setPhase('done'); }
    }, 60);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase === 'done' && !sentRef.current) {
      sentRef.current = true;
      onDone({ score });
    }
  }, [phase, score, onDone]);

  if (phase === 'ready') {
    return (
      <div className="text-center">
        <p className="font-cinzel text-lg text-viking-gold">Tapping-konkurranse</p>
        <p className="mt-2 mb-4 font-inter text-sm text-viking-paper/85">Trykk så fort du kan i 10 sekunder. Klar?</p>
        <button
          onClick={() => setPhase('go')}
          data-testid="minigame-start"
          className="rounded-md border-2 border-viking-gold bg-viking-gold px-7 py-2 font-saga font-bold text-viking-darkblue hover:bg-viking-gold-soft"
        >
          Start
        </button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="font-mono text-xs text-viking-gold-soft">{(remainingMs / 1000).toFixed(1)} s</p>
      <button
        onPointerDown={() => phase === 'go' && setScore((s) => s + 1)}
        disabled={phase === 'done'}
        data-testid="tap-button"
        className="my-3 h-32 w-full select-none touch-manipulation rounded-lg border-2 border-viking-gold bg-viking-gold/20 font-cinzel text-2xl text-viking-gold transition-transform active:scale-95 disabled:opacity-50"
      >
        ⚔ TRYKK!
      </button>
      <p className="font-cinzel text-4xl font-bold text-viking-gold" data-testid="tap-count">{score}</p>
      {phase === 'done' && <p className="mt-2 font-inter text-sm text-viking-gold-soft">Sender resultat …</p>}
    </div>
  );
}

// ── Reaksjon ─────────────────────────────────────────────────────────────────
function ReactionGame({ onDone }: { onDone: Props['onDone'] }) {
  const [phase, setPhase] = useState<'ready' | 'wait' | 'go' | 'done' | 'too-early'>('ready');
  const goAtRef = useRef(0);
  const [ms, setMs] = useState(0);
  const sentRef = useRef(false);

  useEffect(() => {
    if (phase !== 'wait') return;
    const delay = 1500 + Math.random() * 2500;
    const t = setTimeout(() => { goAtRef.current = Date.now(); setPhase('go'); }, delay);
    return () => clearTimeout(t);
  }, [phase]);

  // Send resultat etter en kort visnings-pause så spilleren ser tiden sin.
  useEffect(() => {
    if ((phase === 'done' || phase === 'too-early') && !sentRef.current) {
      sentRef.current = true;
      const t = setTimeout(() => onDone({ reactionMs: ms }), 1200);
      return () => clearTimeout(t);
    }
  }, [phase, ms, onDone]);

  const click = () => {
    if (phase === 'wait') { setMs(5000); setPhase('too-early'); return; } // straff: 5000 ms
    if (phase === 'go') { setMs(Date.now() - goAtRef.current); setPhase('done'); }
  };

  if (phase === 'ready') {
    return (
      <div className="text-center">
        <p className="font-cinzel text-lg text-viking-gold">Reaksjonstest</p>
        <p className="mt-2 mb-4 font-inter text-sm text-viking-paper/85">Vent — trykk så fort skjermen blir GRØNN. For tidlig = 5000 ms straff.</p>
        <button
          onClick={() => setPhase('wait')}
          data-testid="minigame-start"
          className="rounded-md border-2 border-viking-gold bg-viking-gold px-7 py-2 font-saga font-bold text-viking-darkblue hover:bg-viking-gold-soft"
        >
          Start
        </button>
      </div>
    );
  }

  const bg =
    phase === 'go' ? 'bg-viking-moss' :
    phase === 'too-early' ? 'bg-viking-crimson' :
    'bg-viking-darkblue/60';
  const label =
    phase === 'wait' ? 'Vent …' :
    phase === 'go' ? 'TRYKK!' :
    phase === 'too-early' ? `For tidlig — 5000 ms straff` :
    `${ms} ms`;

  return (
    <button
      onPointerDown={click}
      disabled={phase === 'done' || phase === 'too-early'}
      data-testid="react-button"
      className={`h-40 w-full rounded-lg border-2 border-viking-gold ${bg} font-cinzel text-3xl text-viking-paper transition-colors`}
    >
      {label}
    </button>
  );
}

// ── Hoderegning ──────────────────────────────────────────────────────────────
function MathGame({ onDone }: { onDone: Props['onDone'] }) {
  const [phase, setPhase] = useState<'ready' | 'go' | 'done'>('ready');
  const [score, setScore] = useState(0);
  const [remainingMs, setRemainingMs] = useState(20000);
  const [q, setQ] = useState<{ a: number; b: number; op: '+' | '−' | '×' }>({ a: 0, b: 0, op: '+' });
  const [answer, setAnswer] = useState('');
  const sentRef = useRef(false);

  const newQuestion = () => {
    const ops: Array<'+' | '−' | '×'> = ['+', '−', '×'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a = 1 + Math.floor(Math.random() * 12);
    let b = 1 + Math.floor(Math.random() * 12);
    if (op === '−' && b > a) [a, b] = [b, a]; // unngå negative svar
    setQ({ a, b, op });
    setAnswer('');
  };

  useEffect(() => {
    if (phase !== 'go') return;
    newQuestion();
    const start = Date.now();
    const t = setInterval(() => {
      const left = Math.max(0, 20000 - (Date.now() - start));
      setRemainingMs(left);
      if (left === 0) { clearInterval(t); setPhase('done'); }
    }, 100);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase === 'done' && !sentRef.current) { sentRef.current = true; onDone({ score }); }
  }, [phase, score, onDone]);

  const submit = () => {
    if (phase !== 'go') return;
    const expected = q.op === '+' ? q.a + q.b : q.op === '−' ? q.a - q.b : q.a * q.b;
    if (parseInt(answer, 10) === expected) setScore((s) => s + 1);
    newQuestion();
  };

  if (phase === 'ready') {
    return (
      <div className="text-center">
        <p className="font-cinzel text-lg text-viking-gold">Hurtig hoderegning</p>
        <p className="mt-2 mb-4 font-inter text-sm text-viking-paper/85">Flest riktige svar på 20 sekunder. Skriv tallet og trykk Enter (eller Svar).</p>
        <button
          onClick={() => setPhase('go')}
          data-testid="minigame-start"
          className="rounded-md border-2 border-viking-gold bg-viking-gold px-7 py-2 font-saga font-bold text-viking-darkblue hover:bg-viking-gold-soft"
        >
          Start
        </button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="font-mono text-xs text-viking-gold-soft">{(remainingMs / 1000).toFixed(1)} s · Riktige: {score}</p>
      <p className="my-4 font-cinzel text-4xl text-viking-paper">{q.a} {q.op} {q.b} = ?</p>
      <input
        type="text"
        inputMode="numeric"
        value={answer}
        autoFocus
        onChange={(e) => setAnswer(e.target.value.replace(/[^-0-9]/g, ''))}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
        disabled={phase === 'done'}
        data-testid="math-input"
        className="w-32 rounded-md border-2 border-viking-gold/60 bg-viking-darkblue/60 px-4 py-2 text-center font-mono text-2xl text-viking-paper focus:border-viking-gold focus:outline-none"
      />
      <button
        onClick={submit}
        disabled={phase === 'done' || answer === ''}
        data-testid="math-submit"
        className="ml-2 rounded-md border-2 border-viking-gold bg-viking-gold px-5 py-2 font-saga font-bold text-viking-darkblue hover:bg-viking-gold-soft disabled:opacity-40"
      >
        Svar
      </button>
      {phase === 'done' && <p className="mt-3 font-inter text-sm text-viking-gold-soft">Sender resultat …</p>}
    </div>
  );
}
