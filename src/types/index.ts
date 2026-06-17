/**
 * VIKINGSPILL TYPEDEFINISJON
 * 
 * Alle datatyper for spillet, basert på JSON-strukturene fra:
 * - vikingspill_data.json (destinasjoner, valg, utfall)
 * - vikingspill_quiz.json (quiz-spørsmål per ferdighet)
 * - vikingspill_innhold_v2.json (episke kulturmøter, stedsquiz, mekanikk) — når filen lages
 */

// ========================
// FERDIGHETER & ARKETYPE
// ========================

export type SkillKey = 'språk' | 'sjømannskap' | 'krigskunst' | 'diplomati' | 'tro';

// Skipssymbol elevene velger ved gruppeoppsett (§9.1).
export type ShipSymbol = 'drage' | 'ulv' | 'ravn';

export interface SkillTier {
  name: string;
  desc: string;
}

export interface SkillBranch {
  name: string;
  icon: string;
  color: string;
  tiers: SkillTier[]; // 3 nivåer: [0]=startferdighet, [1]=tier2, [2]=tier3
}

export type SkillTree = {
  [key in SkillKey]: SkillBranch;
};

/** Kompetansebevis per domene: høyeste beståtte svenneprøve.
 *  0 = ingen · 1 = sveinn · 2 = mester. Stiger IKKE som et ferdighetsnivå. */
export type Svennebrev = {
  [key in SkillKey]: 0 | 1 | 2;
};

// ========================
// DESTINASJONER & OPPGAVER
// ========================

// v3-oppgavetyper (§4.1). De gamle (movement/photo/timed/creative) er erstattet
// av de nye, skole-baserte typene som ligger i vikingspill_innhold_v2.json.
export type TaskType = 'foto' | 'innspilling' | 'geoguesser';

export interface Task {
  type: TaskType;
  icon: string;
  typeLabel: string;
  title: string;
  desc: string;
  rationale: string;
}

// ========================
// VALG & UTFALL
// ========================

export type ChoiceTag = 'respect' | 'trade' | 'aggressive';

export interface RollOdds {
  bad: number;     // Katastrofe (terning)
  mid: number;     // Middels resultat
  good: number;    // Bra resultat
  crit: number;    // Trumf (best possible)
}

export interface RollOutcome {
  und: number;     // Kulturforståelse-endring
  trade: number;   // Handelsutbytte-endring
  rep: number;     // Rykte-endring
  text: string;    // Narrativ beskrivelse av hva som skjer
}

// Utfallstekst pr. terningresultat. Prototypen definerer kun grenene som faktisk
// kan inntreffe (der baseRoll > 0), så alle fire er valgfrie.
export interface RollOutcomeMap {
  bad?: RollOutcome;
  mid?: RollOutcome;
  good?: RollOutcome;
  crit?: RollOutcome;
}

export interface Choice {
  id: string;           // Unik innen denne destinasjonen
  title: string;        // Valgknapp-tekst
  desc: string;         // Kort beskrivelse
  tag: ChoiceTag;
  baseRoll: RollOdds;   // Sannsynligheter før modifikatorer
  outcomes: RollOutcomeMap;
  lesson: string;       // Historisk/pedagogisk lærepoint etter terningkast
  locks?: string[];     // Liste over destinasjons-IDer som låses hvis dette valget velges
}

// ========================
// DESTINASJON (steddata)
// ========================

export type Difficulty = 'trygg' | 'middels' | 'farlig';

export interface Destination {
  id: string;
  name: string;

  // Basisfelt fra vikingspill_data.json (komplett for alle 12 destinasjoner):
  region: string;
  color: string;           // Hex-farge for visuell identitet
  difficulty: Difficulty;
  image: string;           // Stemningsbilde av ankomsten (public/steder/sted-<id>.jpg), vist øverst i historie-steget
  history: string;         // Førsteperson-fortelling av ankomsten
  funFact: string;
  famousPerson: string;
  choices: Choice[];       // valg → terning → utfall

  // v3-innhold flettet inn fra vikingspill_innhold_v2.json (matchet på id):
  task: Task;              // v2-oppgave (erstatter gammel task, §14)
  episkeKulturmote: EpiskeKulturmote;
  stedsquiz: StedsQuizQuestion[];

  // Handelsvarer som tildeles ved fullføring (1-2 per destinasjon, tematisk autentiske).
  // IKKE inkludert: mennesker/treller/slaver — bare materielle varer (se data/tradeGoods.ts).
  goodsReward: TradeGoodId[];

  // Hovedrute (alltid åpen) eller sidested (låst, krever en av flere veier — se data/routes.ts).
  route: RouteKind;
  unlocks?: UnlockRequirement[];

  // Historisk korrekte valg (§6.1). ID-en til det av destinasjonens choices som ligner
  // det vikingene faktisk gjorde her. Når gruppa velger det får de +2 kulturforståelse
  // og en note i utfallet. Mangler på destinasjoner der ingen klar historisk fasit fins.
  historicalChoiceId?: string;

  // Bonus-valg som låses opp av svennebrev-grad (sveinn=1/mester=2) i et domene
  // ELLER en matchende mannskapsrolle (rollene er 1:1 med domenene, se data/crewRoles.ts).
  // Kommer I TILLEGG til kjernevalgene — erstatter dem aldri. Se data/hiddenChoices.ts.
  hiddenChoice?: {
    unlock: { skill: SkillKey; nivå?: 1 | 2 };
    choice: Choice;
  };

  // Perspektivskifte før valget (4 utvalgte steder). Lærer-styrt via requirePerspective.
  perspectivePrompt?: {
    vikingQuestion: string;
    otherQuestion: string;
    otherLabel: string;
  };

  // Bro til i dag — kobler kulturmøtet til en samtidssak. Lærer-styrt via requireBridge.
  modernBridge?: {
    topic: string;
    context: string;
    prompt: string;
    options: string[];
  };

  // Kortversjoner (2-3 setninger) for differensiering. Lærer-styrt via textLength.
  historyShort?: string;
  kulturmoteSceneShort?: string;
}

export type TradeGoodId =
  | 'pelsverk' | 'solv' | 'jern' | 'rav'
  | 'silke' | 'hvalrosstann' | 'krydder' | 'salt';

export type RouteKind = 'main' | 'side';
export type ScoreKey = 'culturalUnderstanding' | 'tradeGain' | 'reputation';

/** Saga-oppføring: gruppens begrunnelse for et valg på en destinasjon.
 *  Skrevet av høvdingen før utfallet vises, vises på slutten som en sammenhengende
 *  reisefortelling og kan leses av læreren til etterarbeid. */
export interface SagaEntry {
  destId: string;
  destName: string;
  choiceId: string;
  choiceTitle: string;
  reason: string;
  at: number;
  vikingPerspective?: string;
  otherPerspective?: string;
  otherLabel?: string;       // hvem «de andre» var (munkene, irene, samene, araberne)
  bridgeTopic?: string;      // navnet på samtidsbroen (f.eks. «Sannhetskommisjonen»)
  bridgeReflection?: string; // gruppens refleksjon
}

/** Én vei å låse opp et sidested. Et sidested har FLERE slike — gruppa velger
 *  den de har forutsetning for. */
export type UnlockRequirement =
  | { type: 'svenneprove'; skill: SkillKey; nivå: 1 | 2 } // 1 = sveinn, 2 = mester
  | { type: 'score'; key: ScoreKey; min: number }
  | { type: 'goods'; goods: Partial<Record<TradeGoodId, number>> };

// ========================
// EPISK KULTURMØTE (v2)
// ========================

export interface EpiskeKulturmote {
  tittel: string;
  scene: string;
  kulturmøteSpørsmål: {
    q: string;
    opts: string[];
    correct: number;        // 0-3, indeks i opts-array
    feedback: string;       // forklaring etter svar
  };
}

// ========================
// STEDSQUIZ & FERDIGHETSTRE-QUIZ
// ========================

export interface StedsQuizQuestion {
  q: string;
  opts: string[];
  correct: number;        // 0-3, indeks i opts-array
  feedback: string;
}

export interface FerdighetsTreeQuestion {
  q: string;
  opts: string[];
  correct: number;
  feedback: string;
  source: string[];       // Liste over destinasjons-IDer som må være besøkt
}

export type SkillQuizBank = {
  [key in SkillKey]: {
    tier2: FerdighetsTreeQuestion[];
    tier3: FerdighetsTreeQuestion[];
  };
};

// ========================
// GRUPPE / SPILLTILSTAND
// ========================

export interface GroupState {
  groupId: string;
  shipName: string;
  shipSymbol: ShipSymbol;
  shipColor: string;
  
  // Poeng
  culturalUnderstanding: number;
  tradeGain: number;
  reputation: number;
  
  // Ferdigheter
  svennebrev: Svennebrev;
  
  // Spill-progresjon
  visitedDestinations: string[];        // Liste over bes økt sted-IDer
  currentDestination?: string;
  completedDestinations: string[];
  
  // Oppgave-godkjenning
  taskApprovals: {
    [destinationId: string]: 'pending' | 'approved' | 'rejected';
  };
  
  // Verdighetssprøve-status
  skillProofStatus: {
    [skill in SkillKey]?: 'tier1' | 'tier2' | 'tier3';
  };
  
  // Historikk
  log: GameEvent[];
}

// ========================
// SPILLHENDELSER
// ========================

export type GameEventType = 
  | 'choice_made' 
  | 'dice_rolled' 
  | 'skill_unlocked' 
  | 'destination_reached'
  | 'task_submitted'
  | 'task_approved'
  | 'duel_initiated'
  | 'prophecy_triggered';

export interface GameEvent {
  type: GameEventType;
  timestamp: number;
  destinationId?: string;
  choiceId?: string;
  details: Record<string, unknown>;
}

// ========================
// FASE 2/3: MEKANIKKER (v2)
// ========================

// «Gudenes prøve» — lærertrigget konkurranse (§3.4 / §8.5).
// Kilde: vikingspill_innhold_v2.json → _mekanikk.lærertriggetKonkurranse.utfordringstyper
export interface GudenesProveChallenge {
  id: string;
  navn: string;
  ferdighet: SkillKey;            // ferdigheten som gir bonus i konkurransen
  desc: string;
  type: 'fysisk' | 'kreativ';
}

// Sjøslag — «Holmgang på bølgene» (§7.2).
// Kilde: vikingspill_innhold_v2.json → _mekanikk.sjøslag.duellAktiviteter
export type HolmgangKind =
  | 'manuell'   // lærer eller gruppene selv kårer vinner — eksisterende «Vi vant»-knapper
  | 'tapping'   // flest skjermtrykk på 10 sek
  | 'reaksjon'  // raskest reaksjonstid når skjermen blir grønn
  | 'regning';  // flest riktige hoderegninger på 20 sek

export interface HolmgangDuel {
  navn: string;
  desc: string;
  ferdighet: SkillKey;            // ferdigheten som gir bonus (vises som info)
  kind: HolmgangKind;
}

export interface FateCard {
  title: string;
  description: string;
  effect: {
    affectedGroups: 'random' | 'all';
    skillAffected?: SkillKey;
    pointModifier: number;
  };
}

// ========================
// GLOBALT SPILLTILSTAND (fase 2+)
// ========================

export interface GameState {
  gameCode: string;
  role: 'teacher' | 'student';
  groups: {
    [groupId: string]: GroupState;
  };
  currentChapter: number;
  timerState: {
    active: boolean;
    remainingTime: number;
  };
  // Lærer-spesifikt (fase 2+)
  teacherEventLog: GameEvent[];
}
