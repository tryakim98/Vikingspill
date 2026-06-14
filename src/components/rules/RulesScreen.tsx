/**
 * RulesScreen.tsx
 * Vikingestetisk regelside som vises etter rollevalg (før spill opprettes/blir med i).
 * Innholdet er tilpasset rollen — lærer eller elev — og oppsummerer det viktigste
 * de trenger å vite før kampanjen starter. «Jeg er klar ⚔️»-knappen lukker siden.
 * Senere kan «?»-knappen i spillet åpne den igjen.
 */

import { motion } from 'motion/react';
import type { UserRole } from '../../hooks/useRole';

interface Props {
  role: UserRole;
  onDone: () => void;
}

interface Section {
  icon: string;
  title: string;
  body: string;
}

const TEACHER_SECTIONS: Section[] = [
  {
    icon: '📜',
    title: 'Du er game master',
    body: 'Storskjermen er din konsoll, og det er den klassen ser. Du sitter ved tavla og holder rede på hele kampanjen.',
  },
  {
    icon: '🎯',
    title: 'Opprett spill, del koden',
    body: 'Klikk «Opprett spill» og få en kort 4-bokstavskode (f.eks. RAVN). Skriv den på tavla. Elevene taster den inn og blir med på sine enheter.',
  },
  {
    icon: '🗺',
    title: 'Storskjermen viser …',
    body: 'Sjøkartet med alle skipene, leaderboard rangert etter totalpoeng (kulturforståelse + handel + rykte), og oppgaver som venter på godkjenning.',
  },
  {
    icon: '✋',
    title: 'Godkjenning av oppgaver',
    body: 'Når en gruppe gjør en fysisk oppgave (foto, innspilling, GeoGuessr-stil), godkjenner du med ett trykk: Godkjenn / Delvis / Avvis.',
  },
  {
    icon: '⚡',
    title: 'Skjebnehjulet — du bestemmer NÅR',
    body: 'Gudenes prøve og skjebne-kort utløses av deg. Men utfordringen, ferdigheten og hvem som rammes velges tilfeldig av spillet. Du favoriserer ingen — du bestemmer kun tidspunktet.',
  },
  {
    icon: '🏆',
    title: 'Kåre vinner etter Gudenes prøve',
    body: 'Når klassen har gjort utfordringen fysisk, velger du vinner (og evt. 2.-plass) fra mannskapslisten. Vinner: +5 rykte · 2.-plass: +3 · resten: +1 i trøst.',
  },
];

const STUDENT_SECTIONS: Section[] = [
  {
    icon: '⛵',
    title: 'Gruppen styrer skipet sammen',
    body: 'Hver gruppe har én høvding som trykker. Resten av gruppa ser samme skjerm på sin enhet og er med på reisen. Høvdingen kan gi roret videre når som helst.',
  },
  {
    icon: '🚢',
    title: 'Bli med eller opprett',
    body: 'Tast 4-bokstavskoden læreren viser. Velg et eksisterende skip i lista for å bli med en gruppe, eller opprett et nytt skip — da blir du første medlem og høvding.',
  },
  {
    icon: '🗺',
    title: 'Reisen — 12 destinasjoner',
    body: 'Hver destinasjon: en historie, et episk kulturmøte, en oppgave i klasserommet, en stedsquiz, og et valg som ruller terningen. Det dere velger får konsekvenser.',
  },
  {
    icon: '📜',
    title: 'Quiz gir terningbonus',
    body: 'Stedsquizen tester hva dere husker fra historien — flere riktige svar = bedre sjanse for et godt utfall når terningen rulles.',
  },
  {
    icon: '🌳',
    title: 'Ferdigheter bygges underveis',
    body: 'Språk, Sjømannskap, Krigskunst, Diplomati, Tro & visdom. Når en ferdighet er på nivå 1 eller 2, kan dere ta verdighetsprøven og låse opp neste nivå.',
  },
  {
    icon: '⚔️',
    title: 'Holmgang på bølgene',
    body: 'Utfordre et annet skip til en rask duell — tapping, reaksjon, hoderegning, eller noe læreren dømmer. Hver gruppe utnevner én holmgangsmann.',
  },
];

export default function RulesScreen({ role, onDone }: Props) {
  const isTeacher = role === 'teacher';
  const sections = isTeacher ? TEACHER_SECTIONS : STUDENT_SECTIONS;
  const title = isTeacher ? 'Lærer — game master' : 'Elev — vikingmannskap';
  const subtitle = isTeacher
    ? 'Slik styrer du klassens reise'
    : 'Slik fungerer kampanjen for dere';

  return (
    <div className="relative min-h-screen overflow-y-auto viking-screen px-4 py-8 text-viking-paper">
      {/* Runer øverst og nederst */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex h-20 justify-around text-3xl opacity-20">
        <span>ᚠ</span><span>ᚢ</span><span>ᚦ</span><span>ᚱ</span><span>ᚦ</span><span>ᚢ</span><span>ᚠ</span>
      </div>

      <div className="relative mx-auto w-full max-w-2xl" data-testid={`rules-${role}`}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <p className="font-cinzel text-xs uppercase tracking-[0.3em] text-viking-gold-soft/70">{subtitle}</p>
          <h1 className="mt-2 font-cinzel text-3xl font-bold text-viking-gold drop-shadow-lg sm:text-4xl">{title}</h1>
        </motion.div>

        <div className="mt-8 space-y-4">
          {sections.map((s, i) => (
            <motion.section
              key={s.title}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.08 * i }}
              className="flex gap-4 rounded-lg border-2 border-viking-gold/40 bg-viking-surface p-4"
            >
              <div className="shrink-0 text-3xl drop-shadow">{s.icon}</div>
              <div>
                <h2 className="font-cinzel text-lg text-viking-gold">{s.title}</h2>
                <p className="mt-1 font-inter text-sm leading-relaxed text-viking-paper/90">{s.body}</p>
              </div>
            </motion.section>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10 text-center"
        >
          <button
            onClick={onDone}
            data-testid="rules-ready"
            className="rounded-md border-2 border-viking-gold bg-viking-gold px-10 py-3 font-cinzel text-lg font-bold text-viking-darkblue shadow-[0_0_24px_rgba(212,168,67,0.35)] hover:bg-viking-gold-soft"
          >
            Jeg er klar ⚔️
          </button>
          <p className="mt-3 font-inter text-xs italic text-viking-gold-soft/70">
            Du kan åpne reglene igjen senere med <span className="font-cinzel">?</span>-knappen.
          </p>
        </motion.div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-20 justify-around text-3xl opacity-20">
        <span>ᚾ</span><span>ᛁ</span><span>ᛏ</span><span>ᚱ</span><span>ᛏ</span><span>ᛁ</span><span>ᚾ</span>
      </div>
    </div>
  );
}
