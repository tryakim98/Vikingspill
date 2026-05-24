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

export type GroupSkills = {
  [key in SkillKey]: number; // 0 = låst, 1 = starter nivå, 2 = tier 2, 3 = tier 3 (meister)
};

// ========================
// DESTINASJONER & OPPGAVER
// ========================

export type TaskType = 'movement' | 'photo' | 'timed' | 'creative' | 'foto' | 'innspilling' | 'geoguesser';

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

export type SkillRequirement = {
  [key in SkillKey]?: number;
};

export type SkillReward = {
  [key in SkillKey]?: number;
};

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

export interface RollOutcomeMap {
  bad: RollOutcome;
  mid: RollOutcome;
  good: RollOutcome;
  crit: RollOutcome;
}

export interface Choice {
  id: string;           // Unik innen denne destinasjonen
  title: string;        // Valgknapp-tekst
  desc: string;         // Kort beskrivelse
  tag: ChoiceTag;
  skillReq: SkillRequirement | null;  // Må ha disse ferdigheter for å velge
  skillReward: SkillReward | null;    // Bonus ferdighetspunkter
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
  region: string;
  color: string;        // Hex-farge for visuell identitet
  difficulty: Difficulty;
  history: string;      // Førsteperson-fortelling av ankomsten
  funFact: string;
  famousPerson: string;
  task: Task;
  choices: Choice[];
  
  // Disse kommer fra v2-innhold (legges til senere):
  episkeKulturmote?: EpiskeKulturmote;
  stedsquiz?: StedsQuizQuestion[];
}

// ========================
// EPISK KULTURMØTE (v2)
// ========================

export interface EpiskeKulturmote {
  tittel: string;
  scene: string;
  kulturmøteSpørsmål: {
    q: string;
    opts: string[];
    correct: number;
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
  shipSymbol: 'drage' | 'ulv' | 'ravn';
  shipColor: string;
  
  // Poeng
  culturalUnderstanding: number;
  tradeGain: number;
  reputation: number;
  
  // Ferdigheter
  skills: GroupSkills;
  
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

export interface GudsensProveChallenge {
  challengeType: string;
  skill: SkillKey;
  activity: string;
  description: string;
}

export interface HolmgangDuel {
  activity: string;
  description: string;
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
