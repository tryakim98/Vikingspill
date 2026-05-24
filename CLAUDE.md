# VIKINGENES KULTURMØTER — Produktdokument & Spillbibel v3

> Den komplette visjonen for spillet, skrevet for å brukes som kontekst (CLAUDE.md) for en AI-agent (Claude Code) som bygger spillet som et React-prosjekt. Agenten skal ta selvstendige valg innenfor disse rammene.
>
> **Nytt i v3 (les dette først):**
> - **Én app, to roller.** Spillet åpner med ett rollevalg — lærer eller elev — som leder til to ruter i samme app, koblet via delt sanntidstilstand. Se §1.1.
> - **Ny encounter-flyt** med episk kulturmøte-fortelling og quiz som skjuler fakta. Se §6.6.
> - **Skole-baserte oppgaver** (foto, innspilling, GeoGuessr-navigasjon) i stedet for gruppe-mot-gruppe-forhandling. Se §4.
> - **«Gudenes prøve»**: lærertrigget konkurranse der læreren KUN bestemmer når — alt annet er tilfeldig og likt for alle. Se §3.4 og §8.5.
> - **Sjøslag som forkjemper-dueller** (morsomme aktiviteter), ikke forhandling. Se §7.2.
> - **Stedsquiz vs. ferdighetstre-quiz** — to ulike quiz-systemer. Se §6.4.
> - All ny tekst, oppgaver, quiz og mekanikk ligger i `vikingspill_innhold_v2.json`. Se §14.

---

## 1. KONSEPT

Nettbasert klasseromsspill for VG2 yrkesfag (samfunnskunnskap / kulturmøter). 3–10 grupper à 3–5 elever styrer hvert sitt vikingskip gjennom 12 historiske destinasjoner. Spillet kombinerer historisk rike kulturmøter, morsomme fysiske oppgaver, taktisk ferdighetsbygging, terningbaserte utfall, sanntidskonkurranse på lærerens storskjerm, og en storyline der valg får konsekvenser.

**Spilletid:** 75–120 min (justerbar). **Plattform:** Nettleser (mobil/iPad/laptop), ingen installasjon. **Teknologi:** React + TypeScript (Vite) + Firebase sanntid.

**Kjerneprinsipp:** Det skal ikke finnes én «riktig» strategi. Spillet skal ha en treveis-spenning mellom det *moralske*, det *taktiske* og det *historiske*. Å være flink betyr å lese situasjonen — ikke å alltid være snill.

### 1.1 Én app, to roller

Spillet er ÉN React-app. Det åpner med ett tydelig **rollevalg**: «Jeg er lærer» eller «Jeg er elev». Valget leder til to ruter (`pages/TeacherPanel.tsx` og `pages/StudentGame.tsx`) som deler samme spilltilstand via Firebase.

- **Lærer** → oppretter et spill → får en spillkode (f.eks. `VIKING-2024`) → ser game master-konsollen (kart, leaderboard, godkjenning, «Gudenes prøve»-knappen). Vises typisk på delt storskjerm/projektor.
- **Elev** → taster inn koden → velger skip → spiller encounter-flyten på sin egen enhet. Flere grupper deler samme kode og er alle synlige på lærerens kart.

**Viktig:** Lærerskjermen er ofte en delt storskjerm alle ser, mens elevskjermer er private. Rollevalget skal derfor være «låsbart»: lagre valgt rolle i localStorage så en enhet husker rollen sin og ikke ved et uhell havner i feil modus. Gi en diskré «bytt rolle»-mulighet for utvikling/testing.

**Bygg rollevalget tidlig** (i fase 1), selv om lærerruten først får ekte innhold i fase 2. Da bygges alt på rett plass fra start.

---

## 2. SPILLOPPLEVELSE — Slik skal det FØLES

### For elevene
Du åpner telefonen og velger «elev». Et mørkt, gyllent vikingunivers møter deg. Du velger gruppe ved å trykke på et **realistisk vikingskip** som gynger på bølgene — ikke en knapp, et skip. Du gir det navn, velger skipssymbol (drage/ulv/ravn) og farge, og én startferdighet. Kartet viser 12 destinasjoner. Du seiler til Lindisfarne. Først ruller historien frem. Så kommer det **episke kulturmøtet** — en levende scene: «Vi rodde inn mot Lindisfarne i grålysningen. På stranda sto en enslig munk og vinket — han trodde vi var venner med varer...» Du svarer på ett kulturmøte-spørsmål. På oppgavesiden møter du fun fact, kjent person og oppgaven: «Finn noe verdifullt som står helt ubeskyttet på skolen, og ta et bilde.» Dere gjør det. Så trykker dere «Start quiz» — og all faktatekst forsegles bak et skjold som glir over skjermen, så dere må huske det dere leste. Riktige svar gir terningbonus. Tre valg dukker opp med synlige odds. Dere velger. Terningen ruller — animert, med hornlyd. Utfallet endrer alt. På storskjermen ser dere skipet deres bevege seg, og at gruppe 4 nettopp seilte forbi.

### For læreren
Du velger «lærer» og sitter ved tavlen som **spillets game master**. Storskjermen viser et levende vikingkart med alle skipene. Du ser hvem som leder. Du godkjenner oppgaver med ett trykk. Du kan trigge **«Gudenes prøve»** — og her er kjernen: du bestemmer KUN *når* den inntreffer. Spillet trekker selv en tilfeldig utfordring og en tilfeldig ferdighet, likt for alle grupper samtidig. En gruppe som har satset alt på krigskunst knuser en kamp-utfordring — men sliter når gudene tilfeldig sender en *språk*-utfordring. Ingen gruppe er god på alt, og verken du eller de vet hva som kommer. Det skaper ekte, rettferdig uforutsigbarhet.

---

## 3. FERDIGHETSTRE — Nå spillets RYGGRAD

Dette er den største endringen fra v1. Ferdigheter er ikke lenger pynt — de er et **gate-system** som bestemmer hva du kan gjøre, og en kilde til både styrke og sårbarhet.

### 3.1 De fem grenene
| Ferdighet | Ikon | Domene |
|-----------|------|--------|
| Språk | 🗣️ | Tolking, hilsener, forhandling, kulturforståelse |
| Sjømannskap | ⛵ | Navigasjon, lange reiser, vær, geografi |
| Krigskunst | ⚔️ | Kamp, leiesoldat-tjeneste, taktikk |
| Diplomati | 🤝 | Avtaler, allianser, gaver, ekteskap |
| Tro & visdom | 🌳 | Ritualer, skaldekunst, synkretisme, sagaer |

### 3.2 «Verdighetsprøven» — opplåsing krever bevis
For å låse opp nivå 2 og 3 i en ferdighet må gruppen **bevise at de er verdige**. Dette er ikke en passiv quiz — det er en prøve:

**Nivå 1 → 2 (Lærlingeprøven):** Svar riktig på 2 av 3 spørsmål fra ferdighetstre-quizen om steder dere har besøkt (kilde: `vikingspill_quiz.json`, se §6.4). Integrert i reisen, ikke som separat modul.

**Nivå 2 → 3 (Mesterprøven):** En todelt prøve:
1. Svar riktig på 3 av 4 vanskelige spørsmål fra ferdighetstre-quizen
2. Fullfør en **ferdighetsspesifikk handling** som beviser mestring:
   - *Språk:* Lær en hel setning på et fremmedspråk (norrønt/arabisk/gresk) og fremfør for læreren
   - *Sjømannskap:* Tegn en korrekt navigasjonsrute mellom to destinasjoner
   - *Krigskunst:* Demonstrer en skjoldborg-formasjon med gruppa (fysisk)
   - *Diplomati:* Forhandle frem en «avtale» med en medelev eller en på biblioteket (live, i skole-konteksten)
   - *Tro:* Fremfør et selvlaget skaldekvad (4 linjer) om reisen

Læreren godkjenner mesterhandlingen. Dette gjør opplåsing til en **prestasjon** som føles fortjent.

### 3.3 Ferdigheter gir reell fordel — og fravær gir reelle problemer
- **Låste valg:** Mange av de beste valgene krever et ferdighetsnivå. Uten Diplomati 2 kan du ikke inngå Rollos avtale i Paris. Uten Sjømannskap 2 kan du ikke nå Vinland.
- **Terningmodifikatorer:** Ferdigheter over kravet gir +1 per nivå.
- **Sårbarhet:** Hvis du IKKE har låst opp nok ferdigheter innen visse punkter, blir senere destinasjoner vanskeligere. Eksempel: kommer du til Bagdad (sent i spillet) med Språk 0, får alle valg der -2 på terningen («dere forstår ingenting og blir lurt»).

### 3.4 «Gudenes prøve» — lærertrigget konkurranse, spesialisering blir et tveegget sverd
Læreren kan når som helst utløse **«Gudenes prøve»** fra konsollen. Dette er den sentrale tilfeldighetsmekanikken, og den følger én streng regel:

**Læreren bestemmer KUN *når*. Alt annet er tilfeldig og likt for alle.** Læreren velger ikke gruppe, ikke utfordringstype, ikke ferdighet, ikke utfall.

Når prøven utløses:
1. Alle gruppers skjermer avbrytes samtidig med en dramatisk varsling (torden, Odins øye).
2. Spillet trekker TILFELDIG én utfordringstype (se `vikingspill_innhold_v2.json` → `_mekanikk.lærertriggetKonkurranse.utfordringstyper`) og knytter den til ÉN tilfeldig ferdighet. Samme for alle grupper.
3. Alle grupper gjør den samme kjappe fysiske/kreative utfordringen (f.eks. flaskeflipp, balanse på ett ben, 4-linjers skaldekvad, hilsestafett på flere språk).
4. Ferdighetsnivå i den trukne ferdigheten gir bonus i konkurransen.
5. Rangering avgjør uttelling: vinneren får mest, ingen taper alt.

- En gruppe med Krigskunst 3 men Språk 0 kan tilfeldig få en *språk-utfordring* og slite, fordi de satset alt på sverd.
- Samme gruppe kan senere få en *krigskunst-utfordring* og knuse den.

Dette er det **tilfeldige elementet** brukeren ønsket: spesialisering gjør deg sterk på noe og svak på annet, og verken læreren eller gruppene vet hvilken utfordring som kommer. Det er rettferdig fordi læreren ikke kan favorisere eller straffe noen — bare bestemme tidspunktet. Det belønner balanse OG dristig spesialisering på ulike måter.

---

## 4. OPPGAVER — Morsomme, delbare, relevante

Oppgavene skal være gøy nok til at elevene vil gjøre dem frivillig, og knyttet til stedets kultur. **De nye oppgavene ligger ferdig i `vikingspill_innhold_v2.json` (én per destinasjon) og skal brukes** — de erstatter de gamle oppgavene i `vikingspill_data.json`.

**To viktige prinsipper for v3:**
1. **Ingen gruppe-mot-gruppe-oppgaver.** Oppgaver der grupper forhandler med hverandre er fjernet. Interaksjon skjer i stedet med skole-konteksten (medelever i gangene, biblioteket, fellesareal) eller løses i gruppen selv.
2. **Mer foto og innspilling.** Tyngdepunktet ligger på oppgaver elevene kan ta bilde av eller spille inn (video/lyd), pluss en ny GeoGuessr-aktig navigasjonstype.

### 4.1 Oppgavetyper
| Type | Beskrivelse | Eksempel |
|------|-------------|----------|
| **Foto-oppdrag** (`foto`) | Finn/iscenesett noe på skolen, ta ett bilde | «Finn noe verdifullt som står helt ubeskyttet på skolen, og fotografer gruppen som vokter det» (Lindisfarne) |
| **Innspilling** (`innspilling`) | Spill inn video eller lyd | «Lag en kort rap/sang om reisen og spill den inn» (Hedeby); «Formidle en beskjed uten ord på video» (Vinland) |
| **Navigasjon** (`geoguesser`) | Bruk nett/kart til et GeoGuessr-aktig oppdrag | «Finn tre steder i verden med norrøne stedsnavn-endelser» (Hebridene); «Følg Volga på kartet til Det kaspiske hav» (Novgorod) |

Disse erstatter de gamle typene (`movement`, `creative`, `timed`, `photo`). Behold gjerne `task.type` som felt, men bruk de nye verdiene.

### 4.2 Skole-baserte interaksjoner (erstatter gruppe-mot-gruppe)
Der den gamle versjonen ba grupper forhandle med hverandre, bruker v3 skole-konteksten:
- Interaksjon med medelever i gangene eller på biblioteket
- Iscenesatte foto rundt om på skolen
- Oppgaver gruppen løser sammen og spiller inn

Se de ferdige oppgavene i `vikingspill_innhold_v2.json` for nøyaktig formulering per destinasjon. Agenten kan utvide i samme ånd, men skal ikke gjeninnføre forhandling mellom spillgrupper som oppgave.

### 4.3 Oppgaver kobler til gameplay (ikke frakoblet)
Hver oppgave gir terningbonus og kan låse opp et **spesifikt valg**. F.eks. kan Bagdad-renselsen låse opp kalif-audiens. Det gjør oppgaven til en del av historien.

**Respekt for samisk kultur:** Sameland-oppgaven parodierer IKKE joik eller runebomme. I stedet anerkjenner gruppen noe de respekterer ved en kultur som er ulik deres egen. Se §13.

---

## 5. STEDSINNHOLD — Kulturen i sentrum

Brukerens eksplisitte ønske: **legg all vekt på stedenes kultur og kulturuttrykk.** Hver destinasjon skal presenteres som en førsteperson-opplevelse av å komme dit som viking for første gang.

### 5.1 Struktur for hver destinasjon (omskriving av eksisterende data)
Hver destinasjon skal ha:

1. **Ankomstfortelling (førsteperson):** En levende «snakk» av opplevelsen å komme hit for første gang som viking. «Da vi rodde inn i Miklagards havn, måtte vi legge nakken bakover for å se toppen av Hagia Sofia. Ingen av oss trodde mennesker kunne bygge så høyt...»

2. **Hvordan de måtte tilpasse seg:** Hva krevde stedet av dem? Hvilke skikker måtte de respektere? «Vi lærte raskt at man ikke bærer våpen inn for keiseren, og at man bukker på en bestemt måte.»

3. **Hva de ble forbløffet over:** Det kulturelle sjokket. «Vi hadde aldri sett folk vaske seg fem ganger om dagen. Og de drakk noe svart og bittert de kalte qahwa.»

4. **Kulturuttrykk:** Konkret om stedets kunst, arkitektur, musikk, klær, mat, tro, språk. Dette er hovedfokus.

5. **Minst én fun fact:** Overraskende, minneverdig.

6. **Kjent person:** En historisk skikkelse knyttet til stedet.

7. **Episk kulturmøte (`episkeKulturmote`):** En utvidet, levende scene av selve kulturmøtet — fortalt som en dramatisk førsteperson-historie underveis på reisen. Har en `tittel`, en `scene`-tekst, og ett innebygd `kulturmøteSpørsmål`. Ligger ferdig i `vikingspill_innhold_v2.json`.

8. **Stedsquiz (`stedsquiz`):** Minst 6 spørsmål per destinasjon som tester innholdet i historien, det episke kulturmøtet, fun fact og kjent person. Ligger ferdig i `vikingspill_innhold_v2.json`.

Eksisterende `vikingspill_data.json` har punktene 1–6 — agenten skal **berike** kulturfokuset, ikke fjerne fakta. Punktene 7–8 hentes fra `vikingspill_innhold_v2.json` og flettes inn per destinasjon (matchet på `id`).

### 5.2 De 12 destinasjonene
Lindisfarne (793), Hedeby (850), Dublin (841), Paris (845/885), Hebridene (800-t), Sameland (890), Færøyene (825), Island/Þingvellir (930), Vinland (1021), Novgorod (862), Bagdad (921), Miklagard (900-t). Hemmelig 13.: Jorvik/York.

---

## 6. SPILLMEKANIKK

### 6.1 Tre poengtyper (INGEN vekting — ren sum)
- **Kulturforståelse** — respekt, læring, tilpasning
- **Handelsutbytte** — varer, sølv, rikdom
- **Rykte** — hvordan andre folk ser dere

Pluss en **skjult historisk-nøyaktighet-bonus:** valg som matcher det som faktisk skjedde historisk gir +2 (avsløres i resultatet: «Dette var akkurat det vikingene gjorde — +2 historisk innsikt»). Dette skaper treveis-spenning moralsk/taktisk/historisk.

### 6.2 Terning og odds
Visuell D6, fire utfall (Katastrofe/Middels/Bra/Trumf), odds-bar vises FØR kast. Modifikatorer synlige: oppgavebonus (+2/+1/0/−1), ferdigheter over krav (+1/nivå), rykte-effekter, manglende ferdigheter (−2 hvis du mangler påkrevd ferdighet sent i spillet).

### 6.3 Storyline og konsekvenser
- Plyndre Lindisfarne → Paris stengt
- Slavehandel i Dublin → Miklagard stengt
- Rykte < −5 → alle respekt-valg +1 vanskeligere
- Rykte > +5 → spesielle diplomati-valg åpnes
- Alle ferdigheter ≥ 2 → hemmelig 13. destinasjon (Jorvik)
- **Ragnarok-hendelse:** når forskjellen mellom 1. og siste gruppe > 15 poeng, mister alle halve handelspoeng («gudene straffer hybris») — catch-up-mekanikk

### 6.4 To quiz-systemer — stedsquiz vs. ferdighetstre-quiz
Quiz er IKKE én separat modul. Det finnes to ulike quiz-systemer med ulike formål:

| | **Stedsquiz** | **Ferdighetstre-quiz** |
|---|---|---|
| Hva | Minst 6 spørsmål om ÉN destinasjon | Oppsummerende quiz om alle 12 land |
| Når | I encounter-flyten, rett etter du leste stedet | Ved verdighetsprøve / ferdighetsoppgradering (§3.2) |
| Formål | Belønne lesing → terningbonus | Låse opp ferdighetsnivå 2 og 3 |
| Kilde | `vikingspill_innhold_v2.json` → `destinasjoner.<id>.stedsquiz` | `vikingspill_quiz.json` (de 67 spørsmålene) |
| Straff ved feil | Ingen — bare feedback | Ikke bestått = ikke oppgradert |
| Terningeffekt | +1 per riktig svar (maks +2) | Ingen direkte; låser opp ferdighet |

**Viktig om stedsquizen:** Når eleven trykker «Start quiz», skal ALL faktatekst (historie, episk kulturmøte, fun fact, kjent person) skjules i en kul viking-overgang (se §6.6), slik at quizen tester reell lesing og hukommelse — ikke avskrift.

### 6.5 Tidevannstimer
Hvert kapittel (3–4 destinasjoner) har en tidsfrist synlig på lærerskjermen. Grupper som ikke er ferdige når tidevannet snur, mister handelspoeng til stormen. Læreren styrer timeren (pause/forleng/kort inn).

### 6.6 Encounter-flyt (rekkefølge per destinasjon)
Dette er den faste rekkefølgen når en gruppe ankommer et sted:

1. **Historien** — `history`-teksten. Det narrative, faktabaserte.
2. **Episk kulturmøte** — `episkeKulturmote`: tittel + scene som ruller frem som en levende fortelling, deretter det ene `kulturmøteSpørsmål`-et.
3. **Oppgavesiden** — tre tekstbokser som før: fun fact, kjent person, og oppgaven (`task`). Her gjør gruppen en fysisk/kreativ oppgave OG/ELLER stedsquizen.
4. **Quiz-overgang** — når gruppen trykker «Start quiz», skjules ALL faktatekst i en kul viking-overgang (skjold som glir over skjermen, sjøtåke som legger seg, eller runer som forsegler teksten — gjerne med lav krigshorn-tone). Deretter vises stedsquizen (minst 6 spørsmål) uten synlig fasit.
5. **Valg → terning → utfall** — `choices` med synlige odds, terningkast (med stedsquiz-bonus lagt til), så utfallstekst + `lesson`.

Detaljer om overgangsanimasjon og lyd ligger i `vikingspill_innhold_v2.json` → `_encounterFlyt`.

---

## 7. INTER-GRUPPE-MEKANIKK

### 7.1 Elevinitiert diplomati
Grupper sender forespørsler til hverandre via spillet: «Gruppe 3 tilbyr handelsallianse.» Mottaker aksepterer/avslår. Læreren ser alt og kan vetoe.

### 7.2 Sjøslag — «Holmgang på bølgene» (forkjemper-dueller)
Sjøslag avgjøres IKKE av forhandling, men av **morsomme forkjemper-dueller**. Hver gruppe utnevner en **holmgangsmann** (en forkjemper — vikingvarianten av en ridder) som dyster på vegne av gruppen.

Flyt:
1. Gruppe A utfordrer Gruppe B via spillet. B aksepterer eller avslår (læreren ser alt og kan vetoe).
2. Hver gruppe utnevner sin holmgangsmann.
3. Spillet trekker en tilfeldig duell-aktivitet (flaskeflipp-duell, stirrekamp, balansedyst, tungebrekker, eller «Sverd–Skjold–Seil» = vikingvariant av stein-saks-papir).
4. De to forkjemperne dyster. Ferdigheter gir bonus.
5. Vinner: +3 handel. Taper: −2 handel. Begge: −1 rykte (krig koster ære).

Aktivitetene ligger ferdig i `vikingspill_innhold_v2.json` → `_mekanikk.sjøslag.duellAktiviteter`. «Holmgang» var en historisk ekte tvekamp-form; her er den ufarlig og morsom.

### 7.3 Handelsallianse
Begge velger «samarbeid». Begge +2 handel, +1 rykte. Krever Diplomati ≥ 1 for begge.

### 7.4 Giftemål mellom skip
Permanent allianse: +1 på alle terningkast resten av spillet for begge. Krever Diplomati ≥ 2 for begge.

---

## 8. LÆRERSKJERMEN — Game Master-konsoll

### 8.1 Vikingkartet (hovedvisning)
Stilisert kart (Nord-Europa, Middelhavet, Nord-Amerika) med 12 lysende destinasjoner og **realistiske vikingskip-ikoner** (ett per gruppe, med gruppens farge + symbol) som beveger seg animert langs rutene.

### 8.2 Leaderboard
Sanntids rangering etter totalpoeng. Skipsnavn, symbol, poeng, antall stasjoner. Konfetti når noen tar ledelsen.

### 8.3 Godkjenning
Notifikasjon når gruppe ber om godkjenning. Lærer trykker Godkjenn/Delvis/Avvis. Kode sendes automatisk via Firebase.

### 8.4 Skjebne-kort (tilfeldige hendelser)
Læreren kan utløse et **skjebne-kort** — men i tråd med kjerneprinsippet (§3.4) bestemmer læreren KUN *når*. Spillet trekker selv kort OG hvilken gruppe (eller hvilke grupper) det rammer, tilfeldig. Eksempler på kort:
- «Storm i Nordsjøen — en tilfeldig gruppe mister 2 sjømannskap»
- «Arabisk handelsmann — en tilfeldig gruppe får en sjelden vare (+3 handel)»
- «Pest — alle med Tro < 2 mister 1 poeng»
- «Gullår i Hedeby — all handel der gir dobbelt denne runden»

Læreren skal IKKE kunne peke ut hvilken gruppe som favoriseres eller straffes. Dette holder spillet rettferdig og uforutsigbart, og er konsistent med «Gudenes prøve».

### 8.5 «Gudenes prøve» (§3.4)
Læreren utløser den felles konkurransen for alle grupper samtidig. Læreren bestemmer kun tidspunktet; utfordringstype, ferdighet og utfall er tilfeldig og likt for alle. Se §3.4 og `vikingspill_innhold_v2.json` → `_mekanikk.lærertriggetKonkurranse`.

### 8.6 Sluttseremoni
Etter siste destinasjon: «Kongen kaller alle hjem til Avaldsnes.» Animert opprulling av rangering (siste plass først, spenning oppover). Arketype avsløres som tittel med lyd og aurora-animasjon for vinneren.

---

## 9. ESTETIKK — Gjennomgående vikingtema

Brukerens eksplisitte ønske: **vikinglayout gjennomgående, med realistiske vikingskip å trykke på ved gruppevalg.**

### 9.1 Gruppevalg = trykk på et skip
Setup-skjermen viser 3–10 **realistiske vikingskip** (drakkar med dragehoder, stripete seil, skjold langs rekka) som gynger på animerte bølger. Eleven trykker på et skip for å velge gruppe. Hvert skip kan farges etter gruppens valg. Bruk SVG-illustrasjoner eller CSS-art — IKKE generiske knapper.

### 9.2 Gjennomgående tema
- Mørk nattblå bakgrunn med gull, som pergament og fakkellys
- Runer som dekorelementer (ekte futhark)
- Treverk- og metalltexturer
- Skjold, drager, ravner som ikonografi
- Kart tegnet som gammelt sjøkart
- Knapper formet som skjold eller treskilt der det passer

### 9.3 Fargepalett
```
Bakgrunn #0B1426 · Overflate #182846 · Gull #D4A843 · Gull-soft #E8C97A
Papir #FDFBF6 · Rust #A0522D · Teal #2B6B6B · Moss #5B7553 · Plum #6B3FA0 · Crimson #8B2929
```

### 9.4 Typografi
Titler: Cinzel. Brødtekst: Inter/serif. Tall: JetBrains Mono.

---

## 10. LYD OG ANIMASJON

### Lyd (Howler.js) — filer i /public/sounds/
Bølger ved seiling, krigshorn ved oppgavestart, **krigshorn + tre-knirk ved quiz-overgangen (når faktaen forsegles)**, terning mot trebord, jubel + sølvklirr ved bra utfall, torden ved katastrofe, **torden + varsel når «Gudenes prøve» utløses**, episk fanfare ved trumf, klokkeklang ved ny ferdighet, konkurransesignal når noen tar ledelsen. Gratis kilder: freesound.org, pixabay.com/sound-effects, mixkit.co.

### Animasjon (Framer Motion)
3D-terningrull, poeng som teller opp/ned, skip som glir langs kartruter, odds-bar med fargeovergang, leaderboard-reorder, ferdighetsopplåsing med glow, sluttseremoni-opprulling, **quiz-overgang der et skjold/sjøtåke/runer forsegler faktateksten**, **dramatisk skjermavbrudd for alle ved «Gudenes prøve»**.

---

## 11. ARKITEKTUR

### Tech stack
React + TypeScript + Vite, Tailwind CSS, Firebase Realtime Database (sanntid), Vercel/Netlify (hosting), Howler.js (lyd), Framer Motion (animasjon).

### Firebase-datamodell
```
/games/{gameCode}/
  settings: { totalDestinations, chapterTimers, ... }
  groups/{groupId}/: { shipName, symbol, color, scores, skills, visited, log, status }
  events/{eventId}: { type, target: "random", timestamp }   // skjebne-kort, tilfeldig mål
  trials/{trialId}: { challengeType, skill, results, timestamp }  // Gudenes prøve, felles for alle
  duels/{duelId}: { challengerId, defenderId, activity, championA, championB, winner }
```
Lærer (rolle = `teacher`) oppretter spill med kode (f.eks. «VIKING-2024»). Elever (rolle = `student`) kobler til med koden. Sanntidssync via listeners. localStorage som offline-fallback OG for å huske enhetens valgte rolle (§1.1).

### Rollehåndtering
Appen åpner med rollevalg (§1.1). Valgt rolle lagres i localStorage så enheten husker den. `pages/TeacherPanel.tsx` og `pages/StudentGame.tsx` er de to rutene. Begge leser samme `/games/{gameCode}/`-tilstand.

### Deterministisk godkjenningskode (fallback når Firebase er nede)
```typescript
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
function approvalCodeFor(groupId: number, destId: string): string {
  return (simpleHash(`viking_v3_${groupId}_${destId}_task`) % 10000)
    .toString().padStart(4, '0');
}
function partialApprovalCodeFor(groupId: number, destId: string): string {
  const full = parseInt(approvalCodeFor(groupId, destId), 10);
  return ((full + 1) % 10000).toString().padStart(4, '0');
}
```

### Prosjektstruktur
```
src/
  components/  roleSelect/ setup/ dashboard/ encounter/ skillTree/ dice/ teacher/ ship/
  data/        destinations.ts quizBank.ts stedsquiz.ts episkeKulturmote.ts skillTree.ts archetypes.ts events.ts trials.ts duels.ts
  hooks/       useGameState.ts useDiceRoll.ts useTimer.ts useSound.ts useFirebase.ts useRole.ts
  lib/         approvalCodes.ts firebase.ts oddsEngine.ts random.ts
  pages/       RoleSelect.tsx StudentGame.tsx TeacherPanel.tsx
  types/       index.ts
public/
  sounds/      *.mp3
  ships/       *.svg (vikingskip-illustrasjoner)
  images/      destinations/ (stemningsbilder per sted)
```

---

## 12. PRIORITERT UTVIKLINGSPLAN

### Fase 1 — Grunnmur
1. Vite + React + TS + Tailwind
2. Importer data fra alle tre JSON-filene, lag TS-typer
3. **Rollevalg (lærer/elev)** + to ruter (RoleSelect → StudentGame/TeacherPanel). Lærerruten er foreløpig plassholder.
4. Setup med **vikingskip-valg** (trykkbare skip på bølger) + symbol + farge + startferdighet
5. Dashboard: stats, kart, logg
6. Encounter-flyt (§6.6): historie → episk kulturmøte → oppgaveside → quiz-overgang (skjul fakta) → stedsquiz → valg → terning → resultat
7. Ferdighetstre med verdighetsprøver (ferdighetstre-quiz fra `vikingspill_quiz.json`)
8. Sluttseremoni med arketype

### Fase 2 — Sanntid
9. Firebase-oppsett, spillkode-system
10. Sanntidssync av alle grupper
11. Lærerskjerm (fyll plassholderen fra fase 1): kart med animerte skip, leaderboard, godkjenning

### Fase 3 — Engasjement
12. «Gudenes prøve» (lærer bestemmer kun *når*; resten tilfeldig og likt for alle) — §3.4
13. Skjebne-kort (tilfeldig mål) — §8.4
14. Sjøslag som forkjemper-dueller (§7.2) + allianser/giftemål (§7.3–7.4)
15. Tidevannstimer + Ragnarok-mekanikk
16. Lyd + animasjoner (inkl. quiz-overgangen)

### Fase 4 — Polering
17. Berik alle 12 episke kulturmøter og kulturfokuset
18. Responsivt (mobil/iPad/laptop/storskjerm)
19. Tilgjengelighet, error states, README, deploy (Vercel/Netlify)

---

## 13. AGENTENS RETNINGSLINJER

**Gjør:** Ta selvstendige valg. Moderne React (hooks, context). Streng TypeScript. Små, beskrivende commits. Test på mobil. Semantisk HTML/ARIA. Error boundaries + loading states. README med oppsett. Berik kulturinnholdet. Bruk det ferdige innholdet i `vikingspill_innhold_v2.json` (episke kulturmøter, oppgaver, stedsquiz, mekanikk).

**Ikke gjør:** Ikke fjern destinasjoner eller historiske fakta. Ikke endre quiz-spørsmål uten å spørre. Ikke gjør localStorage til eneste lagring (men bruk det til offline-fallback og rollehukommelse). Ikke lag features som krever mye manuelt lærerarbeid. Ikke bruk klassekomponenter. Ikke lag generisk «skoleprogramvare»-look — alt skal være gjennomgående viking. **Ikke la læreren velge hvilken gruppe som favoriseres/straffes** ved Gudenes prøve eller skjebne-kort (læreren bestemmer kun *når*). **Ikke gjeninnfør gruppe-mot-gruppe-forhandling som oppgave.** **Ikke la faktatekst være synlig under stedsquizen** — den skal skjules i overgangen.

**Respekt for samisk kultur:** Sameland-innhold må behandle samisk kultur (joik, noaidi, runebomme) med respekt. Sameland-oppgaven parodierer IKKE joik eller runebomme — gruppen anerkjenner i stedet noe de respekterer ved en annen kultur.

---

## 14. KILDEFILER (importeres i prosjektet)
| Fil | Innhold |
|-----|---------|
| `vikingspill_data.json` | 12 destinasjoner: historie, valg, utfall, opprinnelige oppgaver |
| `vikingspill_quiz.json` | 67 quiz-spørsmål — brukes til ferdighetstre-quizen (§6.4) |
| `vikingspill_innhold_v2.json` | **v3-innhold:** episke kulturmøter, nye skole-baserte oppgaver, stedsquiz (min. 6/sted), «Gudenes prøve» og sjøslag-dueller. Fletter inn på `id`. |
| `Vikingspill_v3.html` | Elev-prototype (referanse — ikke kopier direkte) |
| `Vikingspill_lærer.html` | Lærer-prototype (referanse) |

**Ved konflikt mellom filene:** `vikingspill_innhold_v2.json` har forrang for oppgaver og quiz. `vikingspill_data.json` beholdes for historie, valg og utfall.

---

*T. Ulriksen, lektor i norsk og samfunnskunnskap, i samarbeid med Claude (Anthropic). Oppdatert mai 2026 (v3).*
