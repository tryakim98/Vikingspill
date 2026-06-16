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
import type { SyncedEncounter, CouncilAdvice } from '../../lib/gameSync';
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
import { playMusicForDestination } from '../../lib/music';
import { playAmbienceForDestination, stopAmbience } from '../../lib/ambience';
import QuestionCard from '../quiz/QuestionCard';
import DiceRoll from '../dice/DiceRoll';
import Icon from '../decor/Icon';
import { BraidDivider } from '../decor';

type Step = 'history' | 'kulturmote' | 'oppgave' | 'transition' | 'quiz' | 'perspektiv' | 'radslagning' | 'valg' | 'saga' | 'roll' | 'rolling' | 'resultat' | 'refleksjon';

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
  /** Lærer-styrt: krev en saga-begrunnelse mellom valg og terningkast. */
  requireSaga?: boolean;
  /** Lærer-styrt: krev perspektivskifte før valg på destinasjoner som har prompts. */
  requirePerspective?: boolean;
  /** Lærer-styrt: bro til i dag — refleksjon etter utfallet på destinasjoner med modernBridge. */
  requireBridge?: boolean;
  /** Lærer-styrt: stedsquizen må fullføres før valgene — ingen «Hopp til valgene». */
  requireQuiz?: boolean;
  /** Lærer-styrt: rådslagning — alle medlemmer må gi råd før høvdingens valgknapper låses opp. */
  requireCouncil?: boolean;
  /** Multi-enhet: denne enhetens medlem-id (for å skrive/lese eget råd). */
  myMemberId?: string;
  /** Multi-enhet: alle koblede medlemmer i gruppa (for å telle råd: «3 av 4»). */
  memberIds?: string[];
  /** Multi-enhet: skriv DENNE enhetens råd. Åpen for alle medlemmer, ikke bare høvdingen. */
  onGiveAdvice?: (advice: { choiceId?: string | null; note?: string }) => void;
  /** Hvilken tekstlengde å rendre for historie + kulturmøte (differensiering). */
  textLength?: 'full' | 'short';
  /** Individuell tekstlengde: bytter KUN denne enhetens visning (lagret per elev). */
  onToggleTextLength?: () => void;
}

const DIFFICULTY_COLOR: Record<string, string> = {
  trygg: '#5B7553',
  middels: '#CDC3AD',
  farlig: '#8B2929',
};

const skillName = (s: SkillKey) => skillTreeData[s].name;

function Shell({ name, onExit, children }: { name: string; onExit: () => void; children: ReactNode }) {
  return (
    <div className="relative min-h-screen viking-screen text-viking-paper">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="flex items-center justify-between pb-2">
          <h2 className="font-saga text-2xl text-viking-gold">{name}</h2>
          <button onClick={onExit} className="font-inter text-xs text-viking-gold-soft/70 hover:text-viking-gold-soft">✕ Avbryt</button>
        </div>
        <BraidDivider className="mb-6" />
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

/** Oppsummering av gruppas råd: hvor mange stemte på hvert alternativ + frie setninger.
 *  Vises til høvdingen når alle har gitt råd, og over valgkortene. */
function AdviceSummary({ advice, memberIds, choices }: {
  advice: Record<string, CouncilAdvice>;
  memberIds: string[];
  choices: { id: string; title: string }[];
}) {
  const given = memberIds.map((id) => advice[id]).filter(Boolean) as CouncilAdvice[];
  const tally = choices.map((c) => ({ ...c, n: given.filter((a) => a.choiceId === c.id).length }));
  const notes = given.filter((a) => a.note).map((a) => a.note as string);
  return (
    <div className="mb-4 rounded-lg border-2 border-viking-teal/50 bg-viking-teal/10 p-4" data-testid="advice-summary">
      <p className="mb-2 inline-flex items-center gap-2 font-cinzel text-sm text-viking-gold-soft"><Icon name="tiwaz" size={14} /> Gruppas råd ({given.length})</p>
      <div className="space-y-1">
        {tally.map((t) => (
          <div key={t.id} className="flex items-center gap-2 font-inter text-sm text-viking-paper/90">
            <span className="w-8 text-right font-mono text-viking-gold">{t.n}×</span>
            <span>{t.title}</span>
          </div>
        ))}
      </div>
      {notes.length > 0 && (
        <ul className="mt-2 space-y-1 border-t border-viking-teal/30 pt-2">
          {notes.map((nt, i) => (
            <li key={i} className="flex items-center gap-1.5 font-inter text-xs italic text-viking-paper/80"><Icon name="chat" size={12} /> «{nt}»</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function EncounterFlow({
  destination, skills, onComplete, onExit, onRequestApproval,
  isChief = true, syncedEncounter = null, onUpdateEncounter,
  lateGame = false, requireSaga = false, requirePerspective = false, requireBridge = false, requireQuiz = false,
  requireCouncil = false, myMemberId, memberIds = [], onGiveAdvice, textLength = 'full', onToggleTextLength,
}: EncounterFlowProps) {
  const d = destination;
  const syncMode = !!syncedEncounter;

  /** Diskret, personlig tekstlengde-bryter — endrer kun denne elevens visning. */
  const TextLenToggle = () => onToggleTextLength ? (
    <div className="mb-3 flex justify-end">
      <button
        onClick={onToggleTextLength}
        data-testid="personal-textlen-toggle"
        title="Endrer bare din egen skjerm"
        className="inline-flex items-center gap-1.5 rounded-full border border-viking-gold/30 px-2.5 py-0.5 font-inter text-[11px] text-viking-gold-soft/80 transition-colors hover:border-viking-gold hover:text-viking-gold-soft"
      >
        <Icon name="book" size={12} /> {textLength === 'short' ? 'Vis full tekst' : 'Forkort teksten'}
      </button>
    </div>
  ) : null;

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
  const [_reason, _setReason] = useState('');
  const [_hiddenAnswered, _setHiddenAnswered] = useState(false);
  const [_hiddenCorrect, _setHiddenCorrect] = useState(false);
  const [_hiddenAnswerIdx, _setHiddenAnswerIdx] = useState<number | undefined>(undefined);
  const [_vikingPerspective, _setVikingPerspective] = useState('');
  const [_otherPerspective, _setOtherPerspective] = useState('');
  const [_bridgeReflection, _setBridgeReflection] = useState('');
  const [councilNote, setCouncilNote] = useState(''); // lokal input for ett kort råd (ikke synket)

  // Alle valg å slå opp i når et choice-id må mappes til Choice-objekt — inkluderer
  // det skjulte valget hvis destinasjonen har et og lesetesten ble svart riktig på.
  const allChoices = d.hiddenChoice ? [...d.choices, d.hiddenChoice.choice] : d.choices;

  const step = syncMode ? (syncedEncounter?.step ?? 'history') : _step;
  const approvalSent = syncMode ? (syncedEncounter?.approvalSent ?? false) : _approvalSent;
  const kmAnswer = syncMode ? (syncedEncounter?.kmAnswer ?? null) : _kmAnswer;
  const quizIdx = syncMode ? (syncedEncounter?.quizIdx ?? 0) : _quizIdx;
  const quizCorrect = syncMode ? (syncedEncounter?.quizCorrect ?? 0) : _quizCorrect;
  const quizAnswer = syncMode ? (syncedEncounter?.quizAnswer ?? null) : _quizAnswer;
  const quizBonus = syncMode ? (syncedEncounter?.quizBonus ?? 0) : _quizBonus;
  const choiceId = syncMode ? (syncedEncounter?.choiceId ?? null) : (_choice?.id ?? null);
  const choice = choiceId ? allChoices.find((c) => c.id === choiceId) ?? null : null;
  const rollSync = syncMode ? syncedEncounter?.roll ?? null : null;
  const roll: RollResult | null = syncMode
    ? (rollSync ? { raw: rollSync.raw, effective: rollSync.effective, modifier: rollSync.modifier, tier: rollSync.tier as RollResult['tier'] } : null)
    : _roll;
  const reason = syncMode ? (syncedEncounter?.reason ?? '') : _reason;
  const setReason = (v: string) => syncMode ? onUpdateEncounter?.({ reason: v }) : _setReason(v);
  const hiddenAnswered = syncMode ? !!syncedEncounter?.hiddenAnswered : _hiddenAnswered;
  const hiddenCorrect = syncMode ? !!syncedEncounter?.hiddenCorrect : _hiddenCorrect;
  const hiddenAnswerIdx = syncMode ? syncedEncounter?.hiddenAnswerIdx : _hiddenAnswerIdx;
  const vikingPerspective = syncMode ? (syncedEncounter?.vikingPerspective ?? '') : _vikingPerspective;
  const otherPerspective = syncMode ? (syncedEncounter?.otherPerspective ?? '') : _otherPerspective;
  const setVikingPerspective = (v: string) => syncMode ? onUpdateEncounter?.({ vikingPerspective: v }) : _setVikingPerspective(v);
  const setOtherPerspective = (v: string) => syncMode ? onUpdateEncounter?.({ otherPerspective: v }) : _setOtherPerspective(v);
  const bridgeReflection = syncMode ? (syncedEncounter?.bridgeReflection ?? '') : _bridgeReflection;
  const setBridgeReflection = (v: string) => syncMode ? onUpdateEncounter?.({ bridgeReflection: v }) : _setBridgeReflection(v);

  // Rådslagning (§ multi-enhet): alle medlemmer gir råd FØR høvdingen velger. Bare
  // meningsfull i synkmodus med minst to medlemmer (offline/solo hopper vi over).
  const councilEnabled = requireCouncil && syncMode && memberIds.length >= 2;
  const advice: Record<string, CouncilAdvice> = syncMode ? (syncedEncounter?.advice ?? {}) : {};
  const adviceCount = memberIds.filter((id) => advice[id]).length;
  const allAdvised = memberIds.length > 0 && adviceCount >= memberIds.length;
  const myAdvice = myMemberId ? advice[myMemberId] : undefined;

  // Hvor skal vi gå når vi er ferdige med oppgave/quiz og inn mot valgene?
  // Rådslagning skytes inn rett før valg-steget når den er på.
  const valgEntryStep: Step = councilEnabled ? 'radslagning' : 'valg';
  const preValgStep: Step = (requirePerspective && d.perspectivePrompt) ? 'perspektiv' : valgEntryStep;

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
      const c = partial.choiceId ? allChoices.find((ch) => ch.id === partial.choiceId) ?? null : null;
      _setChoice(c);
    }
    if (partial.roll !== undefined) {
      _setRoll(partial.roll ? { raw: partial.roll.raw, effective: partial.roll.effective, modifier: partial.roll.modifier, tier: partial.roll.tier as RollResult['tier'] } : null);
    }
    if (partial.hiddenAnswered !== undefined) _setHiddenAnswered(partial.hiddenAnswered);
    if (partial.hiddenCorrect !== undefined) _setHiddenCorrect(partial.hiddenCorrect);
    if (partial.hiddenAnswerIdx !== undefined) _setHiddenAnswerIdx(partial.hiddenAnswerIdx);
    if (partial.vikingPerspective !== undefined) _setVikingPerspective(partial.vikingPerspective);
    if (partial.otherPerspective !== undefined) _setOtherPerspective(partial.otherPerspective);
    if (partial.bridgeReflection !== undefined) _setBridgeReflection(partial.bridgeReflection);
  };

  // Kort bølgeeffekt idet vi seiler inn til destinasjonen (§10).
  useEffect(() => { playSound('waves'); }, []);

  // Stedsmusikk (§10): når gruppa ankommer en havn spiller kulturens eget spor
  // gjennom hele møtet. lib/music.ts crossfader mykt fra forrige spor (seilas/forrige havn).
  useEffect(() => {
    playMusicForDestination(d.id);
  }, [d.id]);

  // Miljølyd (§10): under det episke kulturmøtet legger stedets soundscape (kloster,
  // marked, basar, hav, leir, vind) seg subtilt UNDER musikken. Toner ut når møtet er
  // over (andre steg) og når flyten avmonteres.
  useEffect(() => {
    if (step === 'kulturmote') playAmbienceForDestination(d.id);
    else stopAmbience();
  }, [step, d.id]);
  useEffect(() => () => stopAmbience(), []);

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
<Icon name="anchor" size={13} className="mr-1 inline" /> Høvdingen styrer skipet — dere ser med
    </p>
  );

  // 1) HISTORIE
  if (step === 'history') {
    return (
      <Shell name={d.name} onExit={onExit}>
        {/* Stemningsbilde av ankomsten (public/steder/sted-<id>.jpg). Beskåret til et
            bredt banner; en mørk gradient nederst lar tittelen hvile mot bildet. Skjuler
            seg selv om filen mangler, så historie-steget aldri viser et brukket bilde. */}
        <div
          className="relative mb-5 overflow-hidden rounded-lg border-2 border-viking-gold/40 shadow-[0_4px_20px_rgba(0,0,0,0.45)]"
          style={{ aspectRatio: '16 / 9' }}
        >
          <img
            src={d.image}
            alt={`Ankomst til ${d.name}`}
            loading="lazy"
            onError={(e) => { (e.currentTarget.closest('div') as HTMLElement).style.display = 'none'; }}
            className="h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-viking-darkblue/80 via-transparent to-transparent" />
        </div>
        <div className="mb-2 flex items-center gap-3">
          <span className="rounded-full px-3 py-0.5 font-mono text-xs text-viking-darkblue" style={{ backgroundColor: DIFFICULTY_COLOR[d.difficulty ?? 'middels'] }}>{d.difficulty}</span>
          <span className="font-inter text-sm text-viking-gold-soft">{d.region}</span>
        </div>
        <h1 className="mb-4 font-saga text-5xl text-viking-gold">{d.name}</h1>
        <TextLenToggle />
        <Html html={(textLength === 'short' && d.historyShort ? d.historyShort : d.history) ?? ''} className="block font-inter leading-relaxed text-viking-paper/90 [&_strong]:text-viking-gold-soft" data-testid={textLength === 'short' && d.historyShort ? 'history-short' : 'history-full'} />
        {isChief ? (
          <button onClick={() => { playSound('page'); setStep('kulturmote'); }} className="mt-8 rounded-md border-2 border-viking-gold bg-viking-gold px-8 py-2 font-saga font-bold text-viking-darkblue hover:bg-viking-gold-soft">Videre →</button>
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
        <h1 className="mb-2 font-saga text-3xl text-viking-gold">{km.tittel}</h1>
        <TextLenToggle />
        {/* Kulturmøte-scenen rammes inn av den dekorerte flettverksrammen
            (public/ornamenter/ramme-kulturmote.png — bearbeidet til transparent midte).
            Rammen ligger som et bakgrunnslag BAK et eget tekstfelt — den legges aldri
            oppå teksten. Den transparente midten slipper treteksturen gjennom; ingen
            svart eller lys firkant. Tekstfeltet har rikelig inset (18.5% sider, 22/24%
            topp/bunn) med ekstra klaring til de tykke hjørne-flettverkene. Faste
            rammeproporsjoner: korte scener sentreres, svært lange scroller innenfor
            rammen, så teksten aldri treffer eller går utenfor kanten. */}
        <div
          className="relative mx-auto mb-6 w-full max-w-2xl"
          style={{ aspectRatio: '1536 / 1180' }}
          data-testid="runepinne"
        >
          <img
            src={`${import.meta.env.BASE_URL}ornamenter/ramme-kulturmote.png`}
            alt="" aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full"
            style={{ objectFit: 'fill' }}
          />
          {/* km-scroll reserverer en fast kolonne for scrollbaren (scrollbar-gutter:
              stable) og gjør den tynn + bronse. pr-3 gir teksten ekstra høyremarg
              så siste bokstav i hver linje aldri kommer bak/under scrollefeltet. */}
          <div
            className="km-scroll absolute flex flex-col overflow-y-auto pr-3 [justify-content:safe_center]"
            style={{ top: '22%', bottom: '24%', left: '18.5%', right: '18.5%' }}
          >
            <p
              className="whitespace-pre-line font-inter text-sm italic leading-relaxed text-viking-parchment [text-shadow:0_1px_3px_rgba(0,0,0,0.85)]"
              data-testid={textLength === 'short' && d.kulturmoteSceneShort ? 'scene-short' : 'scene-full'}
            >
              {textLength === 'short' && d.kulturmoteSceneShort ? d.kulturmoteSceneShort : km.scene}
            </p>
          </div>
        </div>
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
          <button onClick={() => { playSound('page'); setStep('oppgave'); }} className="mt-6 rounded-md border-2 border-viking-gold bg-viking-gold px-8 py-2 font-saga font-bold text-viking-darkblue hover:bg-viking-gold-soft">Videre →</button>
        ) : <ChiefBanner />)}
      </Shell>
    );
  }

  // 3) OPPGAVESIDE
  if (step === 'oppgave') {
    return (
      <Shell name={d.name} onExit={onExit}>
        <h1 className="mb-5 font-saga text-3xl text-viking-gold">På stedet</h1>
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
                  <p className="inline-flex items-center gap-1.5 font-inter text-sm text-viking-moss"><Icon name="hand" size={14} /> Sendt til læreren — venter på godkjenning</p>
                ) : (
                  <button
                    onClick={() => { onRequestApproval(d.id, d.task.title); setApprovalSent(true); }}
                    className="rounded-md border-2 border-viking-gold/60 px-4 py-1.5 font-cinzel text-sm text-viking-gold-soft hover:border-viking-gold"
                  >
                    <span className="inline-flex items-center gap-1.5"><Icon name="hand" size={14} /> Be læreren om godkjenning</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        {isChief ? (
          <>
            <div className="mt-7 flex flex-wrap gap-3">
              <button onClick={() => setStep('transition')} className="rounded-md border-2 border-viking-gold bg-viking-gold px-7 py-2 font-saga font-bold text-viking-darkblue hover:bg-viking-gold-soft">Start stedsquiz →</button>
              {/* «Hopp til valgene» skjules når quizen er obligatorisk — men beholdes defensivt
                  hvis destinasjonen mangler en stedsquiz, så flyten ikke låser seg. */}
              {(!requireQuiz || (d.stedsquiz?.length ?? 0) === 0) && (
                <button onClick={() => updateMany({ quizBonus: 0, step: preValgStep })} data-testid="skip-quiz" className="rounded-md border-2 border-viking-gold/50 px-6 py-2 font-cinzel text-viking-gold-soft hover:border-viking-gold">Hopp til valgene</button>
              )}
            </div>
            {requireQuiz && (d.stedsquiz?.length ?? 0) > 0 && (
              <p className="mt-2 font-inter text-xs italic text-viking-gold-soft/70" data-testid="quiz-mandatory-note">Stedsquizen er obligatorisk denne runden — den må fullføres før dere kan velge.</p>
            )}
          </>
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
          className="relative text-viking-gold"
        >
          <Icon name="shield" size={96} strokeWidth={1.2} />
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
              playSound('page');
              if (last) updateMany({ quizBonus: Math.min(2, quizCorrect), step: preValgStep });
              else updateMany({ quizIdx: quizIdx + 1, quizAnswer: null });
            }}
            className="mt-6 rounded-md border-2 border-viking-gold bg-viking-gold px-8 py-2 font-saga font-bold text-viking-darkblue hover:bg-viking-gold-soft"
          >
            {last ? 'Til valgene →' : 'Neste spørsmål →'}
          </button>
        ) : <ChiefBanner />)}
      </Shell>
    );
  }

  // 5a-i) PERSPEKTIVSKIFTE (lærer-styrt, 4 utvalgte destinasjoner)
  if (step === 'perspektiv' && d.perspectivePrompt) {
    const p = d.perspectivePrompt;
    const canContinue = vikingPerspective.trim().length > 0 && otherPerspective.trim().length > 0;
    const Pergament = ({ children, ...rest }: React.PropsWithChildren<{ 'data-testid'?: string }>) => (
      <div className="viking-parchment rounded-lg p-3" {...rest}>{children}</div>
    );
    return (
      <Shell name={d.name} onExit={onExit}>
        <p className="font-cinzel text-xs uppercase tracking-widest text-viking-gold-soft/80">Perspektivskifte</p>
        <h1 className="mb-2 inline-flex items-center gap-2 font-cinzel text-2xl font-bold text-viking-gold"><Icon name="window" size={22} /> To sider av samme strand</h1>
        <p className="mb-4 font-inter text-sm italic text-viking-paper/75">Skriv kort — bare 1–2 setninger på hvert spørsmål.</p>

        <p className="mb-1 inline-flex items-center gap-1.5 font-cinzel text-sm text-viking-gold-soft"><Icon name="axe" size={13} /> {p.vikingQuestion}</p>
        <Pergament data-testid="viking-pergament">
          <textarea
            value={vikingPerspective}
            onChange={(e) => isChief && setVikingPerspective(e.target.value.slice(0, 600))}
            placeholder={isChief ? 'Skriv vikingenes egen begrunnelse …' : 'Høvdingen skriver …'}
            readOnly={!isChief}
            rows={3}
            data-testid="viking-perspective"
            className="w-full resize-none bg-transparent font-inter text-sm leading-relaxed text-viking-darkblue placeholder:italic placeholder:text-viking-darkblue/40 focus:outline-none"
            style={{ fontFamily: 'serif' }}
          />
        </Pergament>

        <p className="mb-1 mt-4 inline-flex items-center gap-1.5 font-cinzel text-sm text-viking-gold-soft"><Icon name="eye" size={13} /> {p.otherQuestion}</p>
        <Pergament data-testid="other-pergament">
          <textarea
            value={otherPerspective}
            onChange={(e) => isChief && setOtherPerspective(e.target.value.slice(0, 600))}
            placeholder={isChief ? `Skriv hvordan ${p.otherLabel} kanskje opplever det …` : 'Høvdingen skriver …'}
            readOnly={!isChief}
            rows={3}
            data-testid="other-perspective"
            className="w-full resize-none bg-transparent font-inter text-sm leading-relaxed text-viking-darkblue placeholder:italic placeholder:text-viking-darkblue/40 focus:outline-none"
            style={{ fontFamily: 'serif' }}
          />
        </Pergament>

        {isChief ? (
          <button
            onClick={() => updateMany({ step: valgEntryStep })}
            disabled={!canContinue}
            data-testid="perspective-continue"
            className="mt-5 rounded-md border-2 border-viking-gold bg-viking-gold px-7 py-2 font-saga font-bold text-viking-darkblue hover:bg-viking-gold-soft disabled:cursor-not-allowed disabled:opacity-40"
          >
            Til valgene →
          </button>
        ) : (
          <ChiefBanner />
        )}
      </Shell>
    );
  }

  // 5a-iii) RÅDSLAGNING — alle medlemmer gir råd FØR høvdingen får velge.
  // Dette er det ENE steget der ikke-høvdinger har en interaktiv kontroll.
  if (step === 'radslagning') {
    const giveChoice = (id: string) => onGiveAdvice?.({ choiceId: id });
    const sendNote = () => { if (councilNote.trim()) { onGiveAdvice?.({ note: councilNote }); setCouncilNote(''); } };
    return (
      <Shell name={d.name} onExit={onExit}>
        <p className="font-cinzel text-xs uppercase tracking-widest text-viking-gold-soft/80">Rådslagning</p>
        <h1 className="mb-2 inline-flex items-center gap-2 font-cinzel text-2xl font-bold text-viking-gold"><Icon name="ansuz" size={22} /> Hva mener mannskapet?</h1>
        <p className="mb-4 font-inter text-sm italic text-viking-paper/75">
          Hver i mannskapet gir sitt råd på egen enhet før høvdingen bestemmer — trykk på alternativet du helst vil, eller skriv én kort setning.
        </p>

        {/* Teller */}
        <div className="mb-4 flex items-center gap-3 rounded-md border-2 border-viking-gold/40 bg-viking-darkblue/50 px-4 py-2" data-testid="advice-counter">
          <span className="font-cinzel text-lg text-viking-gold">{adviceCount} av {memberIds.length}</span>
          <span className="font-inter text-sm text-viking-gold-soft">har gitt råd</span>
        </div>

        {/* Gi råd: trykk på et alternativ */}
        <div className="space-y-2" data-testid="advice-options">
          {d.choices.map((c) => {
            const mine = myAdvice?.choiceId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => giveChoice(c.id)}
                data-testid={`advice-pick-${c.id}`}
                className={`w-full rounded-md border-2 px-4 py-2.5 text-left font-inter text-sm transition-all ${mine ? 'border-viking-gold bg-viking-gold/20 text-viking-paper' : 'border-viking-gold/30 text-viking-paper/85 hover:border-viking-gold/70'}`}
              >
                <span className="font-cinzel text-viking-gold">{mine ? '✓ ' : ''}{c.title}</span>
                <span className="ml-2 rounded bg-viking-darkblue/70 px-1.5 py-0.5 font-mono text-[10px] uppercase text-viking-gold-soft/80">{c.tag}</span>
              </button>
            );
          })}
        </div>

        {/* … eller skriv én kort setning */}
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={councilNote}
            onChange={(e) => setCouncilNote(e.target.value.slice(0, 120))}
            onKeyDown={(e) => { if (e.key === 'Enter') sendNote(); }}
            placeholder="… eller skriv ett kort råd"
            maxLength={120}
            data-testid="advice-note-input"
            className="flex-1 rounded-md border-2 border-viking-gold/40 bg-viking-darkblue/60 px-3 py-2 font-inter text-sm text-viking-paper placeholder:text-viking-paper/30 focus:border-viking-gold focus:outline-none"
          />
          <button onClick={sendNote} disabled={!councilNote.trim()} data-testid="advice-note-send" className="rounded-md border-2 border-viking-gold/60 px-4 font-cinzel text-sm text-viking-gold-soft hover:border-viking-gold disabled:opacity-40">Send råd</button>
        </div>

        {myAdvice && (
          <p className="mt-2 font-inter text-xs text-viking-moss" data-testid="advice-mine">
            ✓ Du har gitt ditt råd{myAdvice.note ? `: «${myAdvice.note}»` : ''} — du kan endre det til høvdingen velger.
          </p>
        )}

        {/* Når alle har bidratt: oppsummering + høvdingen går videre */}
        {allAdvised ? (
          <div className="mt-6">
            <AdviceSummary advice={advice} memberIds={memberIds} choices={d.choices} />
            {isChief ? (
              <button
                onClick={() => updateMany({ step: 'valg' })}
                data-testid="council-continue"
                className="rounded-md border-2 border-viking-gold bg-viking-gold px-8 py-2 font-saga font-bold text-viking-darkblue hover:bg-viking-gold-soft"
              >
                Til den endelige avgjørelsen →
              </button>
            ) : (
              <p className="text-center font-cinzel text-viking-gold-soft" data-testid="council-wait-chief"><Icon name="anchor" size={13} className="mr-1 inline" /> Alle har gitt råd — høvdingen tar den endelige avgjørelsen.</p>
            )}
          </div>
        ) : (
          <p className="mt-6 text-center font-inter text-sm italic text-viking-gold-soft/70" data-testid="council-waiting">
            Venter på resten av mannskapet …{isChief ? ' Du kan velge når alle har gitt råd.' : ''}
          </p>
        )}
      </Shell>
    );
  }

  // 5a) VALG
  if (step === 'valg') {
    const hidden = d.hiddenChoice;
    const test = hidden?.test;
    const renderChoiceCard = (c: typeof d.choices[number], isHidden = false) => {
      const meets = meetsRequirement(c, skills);
      const lateAvailable = lateGame && !meets;
      const available = meets || lateAvailable;
      const reqText = c.skillReq
        ? (Object.entries(c.skillReq) as [SkillKey, number][]).map(([s, n]) => `${skillName(s)} ${n}`).join(', ')
        : null;
      const cardCls = isHidden
        ? 'border-viking-gold bg-viking-gold/10 ring-2 ring-viking-gold/50 shadow-[0_0_18px_rgba(205,195,173,0.25)]'
        : !available ? 'border-viking-crimson/40 bg-viking-darkblue/40 opacity-70'
        : lateAvailable ? 'border-viking-gold-soft/70 bg-viking-surface ring-2 ring-viking-gold-soft/20'
        : 'border-viking-gold/40 bg-viking-surface';
      return (
        <div key={c.id} className={`rounded-lg border-2 p-4 ${cardCls}`} data-testid={`valg-${c.id}`}>
          <div className="mb-1 flex items-center gap-2">
            {isHidden && <span className="inline-flex items-center gap-1 bg-viking-gold px-2 py-0.5 font-mono text-[10px] uppercase text-viking-darkblue"><Icon name="book" size={11} /> Skjult valg</span>}
            <h3 className="font-cinzel text-lg text-viking-gold">{c.title}</h3>
            <span className="rounded bg-viking-darkblue/70 px-2 py-0.5 font-mono text-[10px] uppercase text-viking-gold-soft/80">{c.tag}</span>
          </div>
          <p className="mb-3 font-inter text-sm text-viking-paper/85">{c.desc}</p>
          {reqText && (
            meets ? (
              <p className="mb-2 font-mono text-xs text-viking-moss">✓ Krever {reqText}</p>
            ) : lateAvailable ? (
              <p className="mb-2 font-mono text-xs text-viking-gold-soft" data-testid={`late-warning-${c.id}`}>
                Krever {reqText} — dere mangler den, og det straffer seg sent i reisen (−2 på terningen).
              </p>
            ) : (
              <p className="mb-2 font-mono text-xs text-viking-crimson">Krever {reqText}</p>
            )
          )}
          <OddsBar baseRoll={c.baseRoll} />
          {isChief ? (
            <button
              disabled={!available}
              onClick={() => { playSound('click'); updateMany({ choiceId: c.id, roll: null, step: requireSaga ? 'saga' : 'roll', reason: '' }); }}
              data-testid={`pick-${c.id}`}
              className="mt-3 rounded-md border-2 border-viking-gold bg-viking-gold px-5 py-1.5 font-saga text-sm font-bold text-viking-darkblue hover:bg-viking-gold-soft disabled:cursor-not-allowed disabled:opacity-40"
            >
              Velg dette
            </button>
          ) : null}
        </div>
      );
    };

    return (
      <Shell name={d.name} onExit={onExit}>
        <h1 className="mb-1 font-cinzel text-2xl font-bold text-viking-gold">Hva gjør dere?</h1>
        <p className="mb-3 font-inter text-sm text-viking-gold-soft">
          Terningbonus fra quiz: <strong className="text-viking-gold">+{quizBonus}</strong>
        </p>

        {/* Gruppas råd fra rådslagningen — så høvdingen ser mannskapets stemme mens hun velger */}
        {councilEnabled && adviceCount > 0 && (
          <AdviceSummary advice={advice} memberIds={memberIds} choices={d.choices} />
        )}

        {/* Lesetest for skjult valg — kun hvis destinasjonen har et og ikke er forsøkt */}
        {hidden && test && !hiddenAnswered && (
          <div className="mb-5 rounded-lg border-2 border-viking-gold/60 bg-viking-darkblue/60 p-4" data-testid="reading-test">
            <p className="mb-1 inline-flex items-center gap-1.5 font-cinzel text-sm text-viking-gold-soft"><Icon name="book" size={13} /> Et skjult valg venter</p>
            <p className="mb-3 font-inter text-base text-viking-paper">{test.q}</p>
            <div className="grid gap-2">
              {test.opts.map((opt, i) => (
                <button
                  key={i}
                  disabled={!isChief}
                  onClick={() => updateMany({ hiddenAnswered: true, hiddenCorrect: i === test.correct, hiddenAnswerIdx: i })}
                  data-testid={`reading-opt-${i}`}
                  className="rounded-md border-2 border-viking-gold/40 bg-viking-surface px-3 py-2 text-left font-inter text-sm text-viking-paper hover:border-viking-gold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {opt}
                </button>
              ))}
            </div>
            {!isChief && <p className="mt-2 text-center font-cinzel text-xs text-viking-gold-soft"><Icon name="anchor" size={11} className="mr-1 inline" /> Høvdingen svarer for gruppa.</p>}
          </div>
        )}

        {/* Resultat av lesetesten — to varianter */}
        {hidden && hiddenAnswered && hiddenCorrect && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            className="mb-5 rounded-md border-2 border-viking-gold bg-viking-gold/15 px-3 py-2"
            data-testid="reading-unlocked"
          >
            <p className="inline-flex items-center gap-1.5 font-cinzel text-sm text-viking-gold"><Icon name="book" size={13} /> Fordi dere leste nøye, ser dere en vei de andre ikke ser.</p>
            {test?.feedback && <p className="mt-0.5 font-inter text-xs italic text-viking-paper/80">{test.feedback}</p>}
          </motion.div>
        )}
        {hidden && hiddenAnswered && !hiddenCorrect && (
          <div className="mb-5 rounded-md border border-viking-gold/30 bg-viking-darkblue/40 px-3 py-2" data-testid="reading-missed">
            <p className="font-inter text-sm text-viking-paper/85">
              Standardvalgene gjelder denne gangen — ingen straff.
              {hiddenAnswerIdx !== undefined && test && (
                <span className="ml-1 text-viking-gold-soft">Riktig svar var: <strong>{test.opts[test.correct]}</strong>.</span>
              )}
            </p>
          </div>
        )}

        <div className="space-y-4">
          {hidden && hiddenAnswered && hiddenCorrect && renderChoiceCard(hidden.choice, true)}
          {d.choices.map((c) => renderChoiceCard(c, false))}
        </div>
        {!isChief && <ChiefBanner />}
      </Shell>
    );
  }

  // 5a-ii) SAGA — gruppens begrunnelse før terningen kastes
  if (step === 'saga' && choice) {
    const canContinue = reason.trim().length > 0;
    return (
      <Shell name={d.name} onExit={onExit}>
        <div className="mb-4">
          <p className="font-cinzel text-xs uppercase tracking-widest text-viking-gold-soft/80">Sagaen skrives</p>
          <h1 className="inline-flex items-center gap-2 font-cinzel text-2xl font-bold text-viking-gold"><Icon name="scroll" size={20} /> Hvorfor valgte dere dette?</h1>
        </div>
        <div className="mb-4 rounded-md border-2 border-viking-gold/40 bg-viking-darkblue/40 p-3">
          <p className="font-mono text-xs text-viking-gold-soft">Valget:</p>
          <p className="font-cinzel text-lg text-viking-gold">{choice.title}</p>
          <p className="font-inter text-sm italic text-viking-paper/85">{choice.desc}</p>
        </div>
        {/* Pergamentinspirert tekstområde */}
        <div className="viking-parchment mb-3 rounded-lg p-3">
          <textarea
            value={reason}
            onChange={(e) => isChief && setReason(e.target.value.slice(0, 600))}
            placeholder={isChief ? 'Skriv 1–2 setninger om hvorfor gruppen valgte dette …' : 'Høvdingen skriver i sagaen …'}
            readOnly={!isChief}
            rows={5}
            data-testid="saga-textarea"
            className="w-full resize-none bg-transparent font-inter text-base leading-relaxed text-viking-darkblue placeholder:italic placeholder:text-viking-darkblue/40 focus:outline-none"
            style={{ fontFamily: 'serif' }}
          />
          <p className="mt-1 text-right font-mono text-[10px] text-viking-darkblue/50">{reason.length}/600</p>
        </div>
        {isChief ? (
          <button
            onClick={() => updateMany({ step: 'roll' })}
            disabled={!canContinue}
            data-testid="saga-continue"
            className="rounded-md border-2 border-viking-gold bg-viking-gold px-7 py-2 font-saga font-bold text-viking-darkblue hover:bg-viking-gold-soft disabled:cursor-not-allowed disabled:opacity-40"
          >
            Til terningkastet →
          </button>
        ) : (
          <ChiefBanner />
        )}
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
                Sen-spill-straff (mangler ferdighet): {choiceLatePenalty}
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
            className="mt-7 rounded-md border-2 border-viking-gold bg-viking-gold px-10 py-2.5 font-saga text-lg font-bold text-viking-darkblue hover:bg-viking-gold-soft"
          >
<span className="inline-flex items-center gap-2"><Icon name="die" size={18} /> Kast terningen</span>
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
            className="viking-metal flex h-16 w-16 items-center justify-center rounded-lg border-4 font-cinzel text-3xl font-bold text-viking-gold"
            style={{ borderColor: TIER_COLOR[roll.tier] }}
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
            <p className="inline-flex items-center gap-1.5 font-cinzel text-sm text-viking-gold"><Icon name="scroll" size={13} /> Historisk klokt — dette ligner det vikingene faktisk gjorde.</p>
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
          requireBridge && d.modernBridge ? (
            <button
              onClick={() => updateMany({ step: 'refleksjon' })}
              data-testid="to-refleksjon"
              className="mt-7 rounded-md border-2 border-viking-gold bg-viking-gold px-10 py-2.5 font-saga text-lg font-bold text-viking-darkblue hover:bg-viking-gold-soft"
            >
<span className="inline-flex items-center gap-1.5"><Icon name="bridge" size={14} /> Til refleksjonen →</span>
            </button>
          ) : (
            <button
              onClick={() => onComplete({
                destId: d.id,
                deltas: { und: undWithBonus, trade: outcome.trade, rep: outcome.rep },
                skillReward: choice.skillReward,
                locks: choice.locks ?? [],
                goodsReward: d.goodsReward,
                sagaEntry: (reason.trim() || vikingPerspective.trim() || otherPerspective.trim()) ? {
                  destId: d.id, destName: d.name,
                  choiceId: choice.id, choiceTitle: choice.title,
                  reason: reason.trim(), at: Date.now(),
                  ...(vikingPerspective.trim() ? { vikingPerspective: vikingPerspective.trim() } : {}),
                  ...(otherPerspective.trim() ? { otherPerspective: otherPerspective.trim() } : {}),
                  ...(d.perspectivePrompt ? { otherLabel: d.perspectivePrompt.otherLabel } : {}),
                } : undefined,
              })}
              className="mt-7 rounded-md border-2 border-viking-gold bg-viking-gold px-10 py-2.5 font-saga text-lg font-bold text-viking-darkblue hover:bg-viking-gold-soft"
            >
              <span className="inline-flex items-center gap-2"><Icon name="sail" size={16} /> Seil videre</span>
            </button>
          )
        ) : <ChiefBanner />}
      </Shell>
    );
  }

  // 6) BRO TIL I DAG — kort refleksjon som kobler kulturmøtet til samtiden
  if (step === 'refleksjon' && choice && roll && outcome && d.modernBridge) {
    const br = d.modernBridge;
    const canContinue = bridgeReflection.trim().length > 0;
    // Samme historisk-bonus som vises i resultat-steget
    const refIsHistorical = !!d.historicalChoiceId && d.historicalChoiceId === choice.id;
    const undWithBonus = outcome.und + (refIsHistorical ? 2 : 0);
    return (
      <Shell name={d.name} onExit={onExit}>
        <p className="font-cinzel text-xs uppercase tracking-widest text-viking-gold-soft/80">Bro til i dag</p>
        <h1 className="mb-2 inline-flex items-center gap-2 font-cinzel text-2xl font-bold text-viking-gold"><Icon name="bridge" size={22} /> {br.topic}</h1>
        <p className="mb-4 font-inter text-sm leading-relaxed text-viking-paper/90">{br.context}</p>

        <div className="mb-3 rounded-md border-2 border-viking-gold/40 bg-viking-darkblue/40 p-3">
          <p className="font-cinzel text-sm text-viking-gold-soft">Refleksjonsspørsmål:</p>
          <p className="mt-1 font-inter text-base text-viking-paper">{br.prompt}</p>
        </div>

        {isChief && (
          <div className="mb-3 space-y-1.5" data-testid="bridge-options">
            <p className="font-cinzel text-xs text-viking-gold-soft/80">Velg en ferdig refleksjon eller skriv egen:</p>
            {br.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => setBridgeReflection(opt)}
                data-testid={`bridge-option-${i}`}
                className="block w-full rounded-md border-2 border-viking-gold/30 bg-viking-surface/60 px-3 py-2 text-left font-inter text-sm text-viking-paper/90 hover:border-viking-gold hover:bg-viking-surface"
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        <div
          className="mb-3 rounded-lg border-4 border-viking-gold/60 p-3 shadow-[0_0_18px_rgba(205,195,173,0.18)]"
          style={{
            background: 'linear-gradient(135deg, #FDFBF6 0%, #F4EDDC 100%)',
            backgroundImage: 'repeating-linear-gradient(0deg, transparent 0 23px, rgba(160,82,45,0.07) 23px 24px)',
          }}
        >
          <textarea
            value={bridgeReflection}
            onChange={(e) => isChief && setBridgeReflection(e.target.value.slice(0, 600))}
            placeholder={isChief ? 'Skriv en refleksjon, eller klikk én av forslagene over for å starte …' : 'Høvdingen skriver refleksjonen …'}
            readOnly={!isChief}
            rows={4}
            data-testid="bridge-textarea"
            className="w-full resize-none bg-transparent font-inter text-sm leading-relaxed text-viking-darkblue placeholder:italic placeholder:text-viking-darkblue/40 focus:outline-none"
            style={{ fontFamily: 'serif' }}
          />
        </div>

        {isChief ? (
          <button
            onClick={() => onComplete({
              destId: d.id,
              deltas: { und: undWithBonus, trade: outcome.trade, rep: outcome.rep },
              skillReward: choice.skillReward,
              locks: choice.locks ?? [],
              goodsReward: d.goodsReward,
              sagaEntry: (reason.trim() || vikingPerspective.trim() || otherPerspective.trim() || bridgeReflection.trim()) ? {
                destId: d.id, destName: d.name,
                choiceId: choice.id, choiceTitle: choice.title,
                reason: reason.trim(), at: Date.now(),
                ...(vikingPerspective.trim() ? { vikingPerspective: vikingPerspective.trim() } : {}),
                ...(otherPerspective.trim() ? { otherPerspective: otherPerspective.trim() } : {}),
                ...(d.perspectivePrompt ? { otherLabel: d.perspectivePrompt.otherLabel } : {}),
                ...(bridgeReflection.trim() ? { bridgeReflection: bridgeReflection.trim(), bridgeTopic: br.topic } : {}),
              } : undefined,
            })}
            disabled={!canContinue}
            data-testid="bridge-continue"
            className="rounded-md border-2 border-viking-gold bg-viking-gold px-9 py-2.5 font-saga text-lg font-bold text-viking-darkblue hover:bg-viking-gold-soft disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="inline-flex items-center gap-2"><Icon name="sail" size={16} /> Seil videre</span>
          </button>
        ) : <ChiefBanner />}
      </Shell>
    );
  }

  return null;
}
