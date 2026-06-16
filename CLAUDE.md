# CLAUDE.md — Vikingenes kulturmøter

Praktisk arbeidsdokument: hva man må vite for å jobbe riktig i DETTE repoet uten å
ødelegge noe. (Visjon, feature-lister og fremtidsplaner hører hjemme andre steder.)

## 1. Hva det er + stack
Nettbasert klasseromsspill (VG2 yrkesfag, kulturmøter): grupper styrer hvert sitt
vikingskip gjennom 12 historiske havner — leser kulturmøtet, tar en kort stedsquiz,
og gjør terningbaserte valg med konsekvenser. Én React-app, to roller (lærer/elev).

**Stack:** React 19 + TypeScript + Vite · Tailwind · Firebase Realtime Database
(sanntid) · `motion` (animasjon) · Howler (lyd). Pre-push-hook kjører
`tsc -b && vite build` — ikke push hvis build feiler.

## 2. Arkitektur-sømmer (må kjennes)
- **Roller/ruter:** `RoleSelect` → `pages/TeacherPanel.tsx` (game master, storskjerm)
  eller `pages/StudentGame.tsx` (elev). Rolle huskes i localStorage (`useRole`).
- **Øktmodus (`hooks/useSession.ts`):** `online` `{gameCode, memberId, groupId}` =
  delt spill via Firebase (`lib/gameSync.ts`), flere enheter i samme gruppe; eller
  `offline` `{groupId, memberId}` = solo/øving i localStorage. `isOnline` gater alt
  sanntid.
- **`GameDashboard`** er den FELLES play-flaten for elev (samme komponent online og
  offline). Eier dashbord + kart (`SeaJourney`) og rendrer overlays: encounter,
  svenneprøve, ferdsbrev, ting, sluttseremoni.
- **`EncounterFlow` = en Step-maskin.** `Step = history | kulturmote | oppgave |
  transition | quiz | perspektiv | radslagning | valg | saga | roll | rolling |
  resultat | refleksjon`. Hvilke steg som er med styres av lærer-settings.
- **`syncMode = !!syncedEncounter`.** Online: steg + quiz-state leses/skrives til
  Firebase via `onUpdateEncounter`. Offline: lokal `useState`. Skal flere felt endres
  i én handler, bruk `updateMany` (ett samlet skriv — to separate patcher racer).
- **Høvding-modell:** bare høvdingen har interaktive kontroller i encounter; andre
  «ser med» (synket). Eneste unntak: rådslagning.
- **Rådslagning (`CouncilAdvice` / `onGiveAdvice`):** når `requireCouncil` er på, gir
  HVERT medlem et råd (trykk et alternativ → `choiceId`, eller skriv `note`) før
  høvdingens valgknapper åpnes.
- **`hiddenChoice`:** ett ekstra valg på utvalgte havner, låst opp ved et lese-
  spørsmål (ikke ferdighet). Det UTVIDER kjernevalgene. Kjernevalg er alltid
  valgbare — ferdigheter forbedrer/straffer odds, men låser dem aldri.
- **`textLength` per elev:** hver elev kan veksle `full`/`short` på historie- og
  kulturmøte-tekst; lærer setter standard (`full`/`short`/`group`).
- **Tilgang & konsekvenser:** Hovedsporet (7 havner, `MAIN_ROUTE`) er alltid åpent.
  Sidesteder (5, `SIDE_UNLOCKS`) er gated, men hver har ≥1 vei som ikke krever en
  bestemt ferdighet (varer eller ferdsbrev). Valg-konsekvenser *forgrener* — en
  «svidd mottakelse» ved en senere havn (`data/consequences.ts`, myk −2 + banner) —
  de **amputerer aldri** en havn.
- **Solo-prinsippet (samme valg, to spor):** online = bindende individuell stemme
  (høvding bryter likhet); solo (offline) = mannskapet som NPC-arketyp-stemmer,
  spilleren velger + begrunner. Felles konsekvens og saga-logg.

Nøkkelfiler: `lib/gameSync.ts` (Firebase + typer), `hooks/useGameState.ts`
(poeng/ferdigheter), `lib/oddsEngine.ts` (terning/modifikatorer),
`data/destinations.ts` (fletter alle 12 havner).

## 3. Estetikk-regler (ikke bryt)
- **Svart-hvitt-gravyr** som grunnuttrykk; **matt gull/bronse** som SJELDEN aksent
  (ikke skinnende «KI-gull»).
- **INGEN emoji i UI.** Bruk `<Icon name=…>` (SVG-strekglyfer, arver `currentColor`)
  eller `<NorseIcon name=…>` (PNG-maske fra `public/ornamenter/`, fylles med
  `currentColor`). `AutoIcon` velger familie (`ikon-*` → PNG, ellers SVG-glyf).
  Behold typografiske tegn: → ← · ✦ ✓ ✕.
- Teksturer i **`public/textures/`** (kobles via `.mat-*`/`.viking-*` i
  `src/index.css`); ikoner og rammer i **`public/ornamenter/`**.
- Fonter: Cinzel (titler), Inter (brødtekst), JetBrains Mono (tall).

## 4. Datakilder (ikke bland systemene)
| Fil | Innhold |
|-----|---------|
| `vikingspill_data.json` | 12 havner: historie, **valg + utfall** |
| `vikingspill_innhold_v2.json` | **Stedsquiz-kilden** + episke kulturmøter + oppgaver. `destinations.ts` fletter inn; `STEDSQUIZ_PICK` velger 3 + kulturmøte-spm = **4 per havn** |
| `vikingspill_quiz.json` (`quizBank.ts`) | **ADSKILT system:** ferdighetstre-/svenneprøve-quiz (ferdighetstagget). Brukes KUN av `SkillTrial`/`SvenneproveTrial`. Bland ALDRI med stedsquiz |

## 5. Arbeidsmåte
- Svar på **norsk**.
- **Vis plan før ikke-trivielle endringer**; vent på ok der det bes om det.
- **Små, fokuserte commits.** Test før «ferdig».
- **Del lange oppgaver i små steg og commit underveis** — hvis en 529 stopper midt i,
  kan økten gjenopptas uten å miste arbeid.
- **Test multi-enhet** ved sanntids-endringer: to nettlesere (vanlig + inkognito) i
  samme `gameCode` simulerer to elever / lærer + elev.
- **Ikke rør bilder/teksturer** i `public/` uten beskjed. Behandle JSON-kildefilene
  som data — ikke reformater hele fila.
- **Ikke gjør:** ikke lag tomme commits for å vise aktivitet; ikke slett filer uten å
  bekrefte i koden at de er ubrukte; ikke gjenskap `public/_chatgpt/`.

## 6. Status
**Ferdig:** emoji → monokrome ikoner (Icon/NorseIcon); ny estetikk koblet inn
(teksturer, ornament-ikoner, flettverksrammer); stedsquiz omstrukturert til 4 spm
(kulturmøte-spm som spm 1); todelt svenneprøve (teori-quiz + ferdighetsspesifikk
praksis); prøve-navn ryddet — **svenneprøve** hever ferdighet, **ferdsbrev** låser
opp sidested.

**Bygges nå:** valg-gating — kjernevalg ved hver havn er alltid valgbare
(ferdigheter forbedrer/straffer odds, låser ikke). **Neste:** deliberasjons-
ryggraden — dobbeltspor online (flere enheter) + solo, så diskusjonen/rådslagningen
bærer spillet.
