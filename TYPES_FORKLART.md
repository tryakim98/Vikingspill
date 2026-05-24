# 📋 TYPESYSTEM FOR VIKINGSPILL — OPPSUMMERING

## Hva har vi bygget?

Jeg har satt opp et komplett **React + TypeScript + Vite + Tailwind CSS**-prosjekt med:

1. **Rollevalg-system** med localStorage-persistens
2. **To separate ruter**: `/teacher` for lærer, `/student` for elev
3. **TypeScript-typer** for all spilldata
4. **Data-moduler** som importerer fra JSON-filene

---

## 🎯 TYPENE — FORKLART PÅ NORSK

### 1. **FERDIGHETER (Skills)**

```typescript
type SkillKey = 'språk' | 'sjømannskap' | 'krigskunst' | 'diplomati' | 'tro';
```

**Forklaring:**
- En `SkillKey` er nøkkelen til en av fem ferdighetsgrener
- Hver ferdighet har et **ikonikon** (🗣️, ⛵, ⚔️, 🤝, 🌳) og **tre nivåer**:
  1. **Nivå 1** (starter): Alle begynner med 1 i en valgt ferdighet
  2. **Nivå 2** (tier2): Låses opp ved å bestå ferdighetstre-quiz (2 av 3 riktig)
  3. **Nivå 3** (tier3): Låses opp ved å bestå harder quiz + fysisk handling

```typescript
interface SkillTier {
  name: string;           // "Grunnleggende språkforståelse"
  desc: string;          // Beskrivelse av hva nivået gir
}

interface SkillBranch {
  name: string;          // "Språk"
  icon: string;          // "🗣️"
  color: string;         // "#2B6B6B"
  tiers: SkillTier[];    // [3 nivåer]
}
```

**Eksempel:**
```
Språk (🗣️)
├─ Nivå 1: Grunnleggende språkforståelse — «Dere kan si hilsener»
├─ Nivå 2: Tolk — «Dere forstår hva fremmede sier»
└─ Nivå 3: Polyglot — «Dere snakker tre språk flytende»
```

---

### 2. **DESTINASJONER (Locations)**

```typescript
interface Destination {
  id: string;                    // "lindisfarne"
  name: string;                  // "Lindisfarne"
  region: string;                // "Nordøst-England, 793"
  color: string;                 // "#8B2929" (hex)
  difficulty: 'trygg' | 'middels' | 'farlig';
  
  // Stedets innhold
  history: string;               // Førsteperson-fortelling
  funFact: string;               // Interessant faktum
  famousPerson: string;          // Historisk person fra stedet
  
  // Oppgave
  task: Task;
  
  // Valg
  choices: Choice[];
  
  // V2-innhold (kommer senere)
  episkeKulturmote?: EpiskeKulturmote;
  stedsquiz?: StedsQuizQuestion[];
}
```

**Forklaring:**
- Hver destinasjon er ett sted elevene reiser til (Lindisfarne, Hedeby, Dublin, osv.)
- Den har tekst som vises `history`, og tre `choices` som elevene kan gjøre

---

### 3. **OPPGAVER (Tasks)**

```typescript
type TaskType = 'movement' | 'photo' | 'timed' | 'creative' 
              | 'foto' | 'innspilling' | 'geoguesser';

interface Task {
  type: TaskType;        // Hvilken type oppgave
  icon: string;          // Emoji-ikon
  typeLabel: string;     // "Bevegelse", "Fotografi", osv.
  title: string;         // "Stormløpet"
  desc: string;          // Detaljert beskrivelse av oppgaven
  rationale: string;     // Hvorfor denne oppgaven passer til stedet
}
```

**Forklaring:**
- Hver destinasjon har ÉN oppgave
- Oppgavetyper er:
  - **movement** / **geoguesser**: Fysiske oppgaver eller navigasjonsoppgaver
  - **photo**: Ta bilder
  - **innspilling**: Spill inn video/lyd
  - **creative**: Kreative oppgaver (tegning, dikting, osv.)

**Eksempel:**
```
Lindisfarne oppgave: "Stormløpet"
→ Type: movement
→ Hele gruppen løper så fort som mulig rundt en bygning
→ Poenget: Kjenne farten og stresset på kroppen som vikingene opplevde
```

---

### 4. **VALG & UTFALL (Choices & Outcomes)**

```typescript
interface Choice {
  id: string;                          // "plunder" (unik innen denne destinasjonen)
  title: string;                       // "Plyndre klosteret — alt eller intet"
  desc: string;                        // Kort forklaring
  
  tag: 'respect' | 'trade' | 'aggressive';  // Valg-type
  
  skillReq: SkillRequirement | null;   // Må du ha visse ferdigheter?
  skillReward: SkillReward | null;     // Får du ferdighetspunkter?
  
  baseRoll: RollOdds;                  // Sannsynligheter før bonuser
  outcomes: RollOutcomeMap;            // Resultater (bad/mid/good/crit)
  
  lesson: string;                      // Historisk lærepoint
  locks?: string[];                    // Steder som stenges hvis du velger dette
}
```

**Detaljert:**

```typescript
interface RollOdds {
  bad: 1,    // Katastrofe (terning 1)
  mid: 2,    // Middels (terning 2-3)
  good: 2,   // Bra (terning 4-5)
  crit: 1    // Trumf (terning 6)
}

interface RollOutcome {
  und: number;     // Endring i kulturforståelse
  trade: number;   // Endring i handelsutbytte
  rep: number;     // Endring i rykte
  text: string;    // Narrativ beskrivelse
}
```

**Eksempel:**
```
Valg: "Plyndre klosteret"
├─ Tag: aggressive
├─ Krav: Ingen
├─ Bonus: +1 krigskunst
├─ Odds: 1/2/2/1 (sjansene)
└─ Resultat ved "crit":
   └─ und: -2 (dere blir mindre respektert)
   └─ trade: +8 (masse sølv!)
   └─ rep: -4 (halve Europa hater dere)
   └─ text: "Dere finner det hemmelige skattkammeret..."
```

---

### 5. **QUIZ — TO SYSTEMER**

#### **A) Ferdighetstre-Quiz** (for opplåsing)

```typescript
interface FerdighetsTreeQuestion {
  q: string;                    // "Hva betyr «As-salamu alaykum»?"
  opts: string[];               // [4 svaralternativer]
  correct: number;              // 0-3 (indeks av riktig svar)
  feedback: string;             // Forklaring når du svarer
  source: string[];             // ["baghdad", "miklagard"] (hvilke steder handler om)
}
```

**Bruk:**
- Tier 2-opplåsing: **2 av 3 spørsmål** riktig
- Tier 3-opplåsing: **3 av 4 spørsmål** riktig + ferdighetsspesifikk handling
- Spørsmålene filtreres slik at gruppen kun får spørsmål om steder de har besøkt

#### **B) Stedsquiz** (for bonus-poeng)

```typescript
interface StedsQuizQuestion {
  q: string;               // "Hva betyr «Miklagard»?"
  opts: string[];          // [4 alternativer]
  correct: number;         // 0-3
  feedback: string;        // Forklaring
}
```

**Bruk:**
- Vises rett etter at elevene har lest historien på et sted
- **All tekst blir skjult** når de starter quizen (for å teste hukommelse, ikke avskrift)
- +1 poeng per riktig svar (maks +2 bonuspoeng)

---

### 6. **EPISK KULTURMØTE** (v2)

```typescript
interface EpiskeKulturmote {
  tittel: string;           // "Møtet med munken"
  scene: string;            // Dramatisk fortelling av møtet
  
  kulturmøteSpørsmål: {
    q: string;              // Ett spørsmål innebygd i scenen
    opts: string[];
    correct: number;
  };
}
```

**Forklaring:**
- Kort dramatisk scene fra encounter-flyten
- Elevene leser den, deretter svarer på ett kulturmøte-spørsmål
- Svar er integrert i narrativet, ikke en separat quiz

**Eksempel:**
```
Scene: "Vi rodde inn mot Lindisfarne i grålysningen. 
En enslig munk sto på stranda og vinket — han trodde vi var venner 
med handelsvarer..."

Spørsmål: "Hva trodde munken at vi var?"
a) Kristne pilegrimmer
b) Handelsfolk
c) Danske vikinger
d) Irske munker
```

---

### 7. **GRUPPETILSTAND (GameState)**

```typescript
interface GroupState {
  groupId: string;                     // "group-1"
  shipName: string;                    // "Dragen"
  shipSymbol: 'drage' | 'ulv' | 'ravn';
  shipColor: string;                   // "#FF6B6B"
  
  // Poeng
  culturalUnderstanding: number;       // 0-50 (respekt)
  tradeGain: number;                   // 0-100 (rikdom)
  reputation: number;                  // -20 til +20
  
  // Ferdigheter
  skills: {
    språk: 0 | 1 | 2 | 3,             // 0=låst, 1=starter, 2-3=oppgradert
    sjømannskap: 0 | 1 | 2 | 3,
    krigskunst: 0 | 1 | 2 | 3,
    diplomati: 0 | 1 | 2 | 3,
    tro: 0 | 1 | 2 | 3
  };
  
  // Progresjon
  visitedDestinations: string[];       // ["lindisfarne", "hedeby"]
  completedDestinations: string[];     // Ferdig med oppgave
  
  // Historikk
  log: GameEvent[];                    // Alle hendelser
}
```

---

### 8. **SPILLHENDELSER (Game Events)**

```typescript
type GameEventType = 
  | 'choice_made'         // Elevene gjorde et valg
  | 'dice_rolled'         // Terning kastet
  | 'skill_unlocked'      // Ferdighet oppgradert
  | 'destination_reached' // Ankom et nytt sted
  | 'task_submitted'      // Oppgave levert
  | 'task_approved'       // Læreren godkjente
  | 'duel_initiated'      // Sjøslag startet
  | 'prophecy_triggered'; // Gudenes prøve utløst

interface GameEvent {
  type: GameEventType;
  timestamp: number;       // Unix timestamp
  destinationId?: string;
  choiceId?: string;
  details: Record<string, any>;  // Ekstra data
}
```

---

## 📁 PROJEKTSTRUKTUR

```
src/
├─ types/
│  └─ index.ts                    ← Alle typedefinisjonene
├─ data/
│  ├─ index.ts                    ← Central export
│  ├─ skillTree.ts                ← Ferdighetstre-data
│  ├─ destinations.ts             ← Alle 12 destinasjoner
│  └─ quizBank.ts                 ← Quiz-spørsmål
├─ hooks/
│  └─ useRole.ts                  ← Role-management hook
├─ pages/
│  ├─ RoleSelect.tsx              ← Rollevalg (startskjerm)
│  ├─ TeacherPanel.tsx            ← Lærerkonsoll (placeholder fase 1)
│  └─ StudentGame.tsx             ← Elevspill (placeholder fase 1)
├─ App.tsx                        ← React Router setup
├─ App.css                        ← Tailwind imports
├─ main.tsx                       ← React entrypoint
└─ index.css                      ← Global styles

public/data/
├─ vikingspill_data.json          ← Destinasjon-data
└─ vikingspill_quiz.json          ← Quiz-data
```

---

## 🔄 HVORDAN DATAEN FLYTER

```
JSON-filer (public/data/)
    ↓
src/data/*.ts (TypeScript-moduler)
    ↓
import { destinations, skillTreeData } from '../data'
    ↓
React-komponenter bruker dataen
```

**Eksempel:**
```typescript
// I en React-komponent
import { destinations, getDestinationById } from '../data';

const currentDest = getDestinationById('lindisfarne');
console.log(currentDest.history);  // Viser historien
```

---

## 🎮 ROLLEVALG MED LOCALSTORAGE

Når brukeren velger lærer eller elev:

1. **localStorage er satt:** `localStorage.setItem('vikingspill_role', 'teacher')`
2. **Navigerer til ruten:** `/teacher` eller `/student`
3. **Ved refresh:** Siden leser `localStorage` og går direkte til riktig rute

**Hvorfor?**
- Lærerskjermen er på en delt storskjerm (alle ser den) — viktig at den ikke bytter til elevmodus ved uhell
- Hvis lærer refresher, er de fortsatt i lærermodus

**Bytteknapp:**
- Nederst på hver side er en "Bytt rolle"-knapp for testing
- Klikk den for å gå tilbake til rollevalg

---

## 🚀 NESTE STEG (ikke laget ennå)

- **Fase 1.1** — Setup-flyten (skip-valg, animerte bølger, gruppeinformasjon)
- **Fase 1.2** — Encounter-flyt (historie → kulturmøte → oppgave → quiz → valg → terning → resultat)
- **Fase 2** — Firebase-sanntid (lærere ser alle grupper på kart, sanntidssynk)
- **Fase 3** — Mekanikker (Gudenes prøve, sjøslag, skjebne-kort, allianser)

---

## ✅ SJEKKLISTE — HVA ER FERDIG?

- ✅ TypeScript-typer for all spilldata
- ✅ Data-moduler (skillTree, destinations, quizBank)
- ✅ Rollevalg-side med localStorage
- ✅ React Router setup (3 ruter)
- ✅ Tailwind CSS konfigurert
- ✅ Plassholderkomponenter for lærer og elev
- ✅ Dev server kjører på localhost:5173

**Neste:** Gå til http://localhost:5173 og test rollevalget! 🎮
