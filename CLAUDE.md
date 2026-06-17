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
- **Deliberasjons-ryggraden (ferdig) — dobbeltspor, felles utgang:** valget avgjøres i
  `radslagning`-steget og føres ALLTID gjennom `commitDecision()` → saga → roll →
  resultat → onComplete (identisk konsekvens/avsløring/saga i begge spor).
  - *Online (bindende):* hvert medlems `CouncilAdvice.choiceId` er en STEMME (`note` =
    valgfri begrunnelse). Hemmelig votering (kun «X av Y» til alle har stemt), så låses
    stemmene, `tallyVotes()` avgjør — flertall vinner, **høvding teller som én stemme og
    bryter KUN ved likhet** (ingen vetorett). Online hopper over `valg`-steget.
  - *Solo (offline):* mannskapsrollene er NPC-stemmer som argumenterer ulikt via
    `npcVotes()` (lib/council.ts) + `crewRoles.argues`; spilleren leser «Kildene», hører
    stemmene, og velger + begrunner i `valg`→`saga`.
- **Nøkkelkort (trinn 1, ærlige — `data/keyCards.ts` + `lib/keyCards.ts`):** ved ~1/3
  av møtene (lærerbryter `keyCards`) deler høvdingen ut ÉT privat, beslutningsrelevant
  kort til ÉN elev (online), VEKTET mot den som har fått færrest (`pickCardHolder`).
  Holderen ser kortet privat, andre ser nøytral banner; avsløres i resultat + saga. Solo
  leser de samme «Kildene» (ulogget kontekst). Kortet OPPLYSER, binder ikke.
- **Progresjonsmodell:** ÉN tallakse — `svennebrev` `0|1|2` per domene (0=ingen,
  1=sveinn, 2=mester). **Svenneprøven er eneste opplåsing** (hever ett domene ett
  hakk). Det finnes IKKE et eget «ferdighetsnivå». Arketypen er en **rolle/stemme**
  (`data/crewRoles.ts`, 1:1 med domenene), ikke et tall — den gir ingen odds-bonus.
- **`hiddenChoice` (bonus-valg):** ett ekstra valg på 5 havner, åpnet av svennebrev-
  grad i et domene (sveinn/mester) ELLER en matchende mannskapsrolle ombord. Det
  UTVIDER kjernevalgene — kommer alltid I TILLEGG, aldri i stedet, og manglende
  opplåsing gir ingen straff. Kjernevalg (3 per havn) er ALLTID valgbare.
- **Odds = grunnsjanse (`baseRoll`) + stedsquiz-bonus + lærer-godkjenning + svidd
  mottakelse.** Svennebrev/rolle påvirker IKKE terningen — de åpner havner/bonus-valg,
  ikke utfall. Ingen ferdighets-gating av valg, ingen sen-spill-straff.
- **`textLength` per elev:** hver elev kan veksle `full`/`short` på historie- og
  kulturmøte-tekst; lærer setter standard (`full`/`short`/`group`).
- **Tilgang & konsekvenser:** Hovedsporet (7 havner, `MAIN_ROUTE`) er **alltid åpent**
  — alle får f.eks. Paris-møtet uansett tidligere valg. Sidesteder (5, `SIDE_UNLOCKS`)
  er gated på svennebrev-grad + score/goods (aldri et rått ferdighetstall), og hver har
  ≥1 vei som ikke krever ett bestemt domene (varer eller rykte). Valg-konsekvenser
  *forgrener* — en «svidd mottakelse» ved en senere havn (`data/consequences.ts`, myk
  −2 + banner, f.eks. Lindisfarne-plyndring → kaldt Paris) — de **amputerer aldri** en
  havn.
- **Solo-prinsippet (samme valg, to spor):** online = bindende individuell stemme
  (høvding bryter likhet); solo (offline) = mannskapet som NPC-arketyp-stemmer,
  spilleren velger + begrunner. Felles konsekvens og saga-logg.

Nøkkelfiler: `lib/gameSync.ts` (Firebase + typer), `hooks/useGameState.ts`
(poeng/svennebrev), `lib/oddsEngine.ts` (terning/modifikatorer), `lib/unlocks.ts` +
`data/routes.ts` (sidested-gating), `data/crewRoles.ts` (mannskapsroller),
`data/consequences.ts` (svidd mottakelse), `data/destinations.ts` (fletter alle 12 havner).

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
praksis); prøve-navn ryddet — **svenneprøve** hever svennebrev, **ferdsbrev** låser
opp sidested. **Mannskapsroller** (2.3, `crewRoles.ts`): unik rolle per medlem ved
innmelding, ingen odds-effekt. **Valg-gating ferdig** (2.4): kjernevalg alltid
valgbare; bonus-valg åpnes av svennebrev/rolle; sidesteder på svennebrev+score/goods;
Paris (hovedspor) alltid åpent — Lindisfarne-plyndring gir myk svidd mottakelse, ikke
stenging. **Deliberasjons-ryggraden ferdig** (3.1–3.5): dobbeltspor med felles utgang —
online bindende stemme (høvding som tie-break, ingen vetorett) / solo NPC-stemmer via
`npcVotes`; nøkkelkort (trinn 1, ærlige) med vektet utdeling; alt gjennom
`commitDecision()` så konsekvens/avsløring/saga er identisk i begge spor.

**Neste (påbygg, ikke startet):** **sabotøren** (trinn 2 — ekte elev online med hemmelig
agenda + per-elev belønning for å lure/gjennomskue, NPC i solo, sjelden/lærerstyrt/helt
avskrubar) og **«belønn årvåkenhet»**; **styresett-atlas**; **definisjonsmakt**.
