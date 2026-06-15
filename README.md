# Vikingenes kulturmøter ⚔️🛡️

Et nettbasert klasseromsspill for **VG2 yrkesfag (samfunnskunnskap)**, bygget rundt
kompetansemålene om **kulturmøter**. 3–10 elevgrupper styrer hvert sitt vikingskip gjennom
12 historiske destinasjoner — Lindisfarne, Hedeby, Dublin, Paris, Sameland, Island,
Vinland, Novgorod, Bagdad, Miklagard m.fl. Underveis leser de levende kulturmøter i
førsteperson, gjør quiz og morsomme skoleoppgaver, tar valg med konsekvenser, kaster terning
og bygger ferdigheter — mens de kappes på lærerens storskjerm i sanntid.

Spilletid: ca. 75–120 min. Plattform: nettleser (telefon, iPad, laptop, projektor) — ingen
installasjon for elevene.

> Hele spillvisjonen og de detaljerte reglene ligger i [`CLAUDE.md`](./CLAUDE.md).

**Live:** [vikingspill.vercel.app](https://vikingspill.vercel.app)

---

## Hva slags spill er det?

Spillet er ikke en quiz med ett riktig svar. Det er bygget på en **treveis-spenning** mellom
det *moralske*, det *taktiske* og det *historiske*: å plyndre kan gi rikdom, men koster rykte
og stenger dører senere; å være diplomatisk åpner allianser, men krever ferdigheter du må ha
bygget opp. Å være «flink» betyr å lese situasjonen — ikke å alltid være snill.

Hver gruppe samler tre poengtyper — **kulturforståelse**, **handelsutbytte** og **rykte** —
pluss en skjult bonus for valg som matcher det vikingene faktisk gjorde historisk.

---

## Én app, to roller

Spillet er **én app** som åpner med et rollevalg:

- **Lærer** 👩‍🏫 — oppretter et spill og får en **4-bokstavs spillkode** (f.eks. `RAVN`). Får
  spillmasterkonsollen: sjøkart med alle skip i sanntid, leaderboard, oppgavegodkjenning,
  tidevannstimer, «Gudenes prøve», skjebnehjul/skjebne-kort, holmgang og Ragnarok. Vises
  typisk på **projektor/storskjerm**.
- **Elev** 🧑‍🤝‍🧑 — taster inn spillkoden, velger og rigger skip, og spiller møte-flyten på
  **egen telefon/iPad**. Flere grupper deler samme kode og vises alle på lærerens kart.

Rollen huskes i `localStorage`. «Bytt rolle» finnes nederst på begge skjermene.

---

## Hovedfunksjoner

- **Rollevalg** — lærer eller elev, husket på enheten.
- **Skipsvalg og rigging** — eleven trykker på et vikingskip som gynger på bølgene, gir det
  navn, symbol (drage/ulv/ravn) og farge, og velger en startferdighet.
- **Sjøkart med seiling** — 12 destinasjoner; skipene beveger seg animert langs rutene,
  synlig for alle på lærerskjermen.
- **Encounter-flyt** per destinasjon: *historie → episk kulturmøte → oppgaveside → quiz-overgang
  (faktateksten forsegles bak et skjold) → stedsquiz → valg med synlige odds → terningkast → utfall*.
- **Ferdighetstre** med fem grener (Språk, Sjømannskap, Krigskunst, Diplomati, Tro & visdom)
  som låser opp valg og gir terningbonus.
- **Svenneprøver (verdighetsprøver)** — for å låse opp høyere ferdighetsnivå må gruppen bevise
  seg gjennom quiz og en ferdighetsspesifikk handling læreren godkjenner.
- **Handelsvarer** — varer gruppene kan samle og bruke underveis.
- **Saga-logg** — gruppens reise skrives ut som en fortelling de kan se tilbake på.
- **Skjebnehjul og skjebne-kort** — tilfeldige hendelser. Læreren bestemmer *når*; spillet
  trekker selv kort og (tilfeldig) hvilken gruppe det rammer.
- **«Gudenes prøve»** — lærertrigget felleskonkurranse for alle grupper samtidig. Læreren
  velger kun tidspunkt; utfordringstype, ferdighet og utfall er tilfeldig og likt for alle.
- **Holmgang på bølgene** — sjøslag avgjort som morsomme forkjemper-dueller, ikke forhandling.
- **Perspektivskifte** — øyeblikk der eleven ser kulturmøtet fra den andre kulturens ståsted.
- **Bro til samtiden** — koblinger fra det historiske kulturmøtet til kulturmøter i dag.
- **Sluttseremoni med arketyper** — animert opprulling av rangeringen, og hver gruppe får en
  arketype-tittel basert på hvordan de spilte.
- **Lagre og fortsette over flere økter** — alt lagres fortløpende i skyen under spillkoden, så
  spillet kan settes på pause og gjenopptas en annen dag. Læreren kan også laste ned en
  sikkerhetskopi og gjenopprette spillet hvis dataene skulle gå tapt. Se egen seksjon under.

---

## Pedagogisk forankring

- **Spillbasert læring** — elevene tar valg, ser konsekvenser og lærer gjennom å handle, ikke
  bare lese.
- **Historisk empati** — perspektivskifte og førsteperson-kulturmøter lar elevene se en
  fremmed kultur innenfra, og sin egen kultur utenfra.
- **Primærkilder og fakta** — quizene belønner faktisk lesing av det historiske innholdet, og
  en skjult bonus belønner valg som matcher det som faktisk skjedde.
- **Bro til samtiden** — kulturmøtene knyttes eksplisitt til kulturmøter elevene møter i dag.

---

## Kort lærerveiledning

1. **Læreren** åpner spillet → «Jeg er lærer» → **Opprett spill**. En 4-bokstavs spillkode
   vises øverst på storskjermen.
2. **Elevene** åpner samme nettadresse på sine enheter → «Jeg er elev» → taster inn
   spillkoden → **Bli med**, og velger/rigger skip.
3. Alle gruppene dukker opp på lærerens sjøkart i sanntid og begynner seilasen.
4. **Læreren styrer tempoet**: setter tidevannstimere, godkjenner (eller delvis godkjenner /
   avviser) oppgaver med ett trykk, og utløser «Gudenes prøve», skjebnehjul og Ragnarok når
   det passer.
5. Etter siste destinasjon kjører **sluttseremonien** med opprulling og arketyper.

En fyldigere lærerveiledning ligger inne i appen (siden «For lærere»).

---

## Lagre og fortsette over flere skoletimer

Et spill trenger ofte mer enn én time. Spillet er bygget for å settes på pause og gjenopptas
en annen dag — uten at noe går tapt.

**Slik fungerer det**

- **Alt lagres fortløpende i skyen (Firebase) under spillkoden.** Hver gang en gruppe gjør et
  trekk — seiler, svarer på quiz, tar et valg, kaster terning, låser opp en ferdighet — skrives
  hele tilstanden (poeng, ferdigheter, besøkte steder, varer, saga-logg, *og hvor i møte-flyten
  gruppa står*) til Firebase. Det finnes ingen egen «lagre»-knapp fordi lagringen skjer av seg
  selv, hele tiden.
- **Spillkoden er nøkkelen.** Så lenge dere bruker samme kode, gjenopptas spillet nøyaktig der
  klassen slapp.

**Slik bruker læreren det i praksis**

1. **Ny time, samme spill:** Åpne konsollen → «Fortsett et tidligere spill» → skriv inn koden
   (eller velg den fra lista «Spill fra denne enheten»). Konsollen kobler seg rett på det
   pågående spillet. Samme enhet husker også den siste koden automatisk.
2. **Gi elevene samme kode igjen.** De velger «Jeg er elev» → taster koden → og finner gruppa
   si akkurat slik den var. Brukte de samme enhet sist, kobles de på automatisk.
3. **Pause vs. avslutte:** Knappen **«Sett på pause (kan gjenopptas)»** kobler bare konsollen
   fra — spillet lever videre i skyen og koden blir liggende i lista. **«Avslutt for godt»**
   sletter spillet permanent (med en bekreftelse først).

**Hvis skyen skulle svikte — sikkerhetskopi**

Firebase sletter ikke data av seg selv; et spill blir liggende til noen aktivt sletter det.
Men for å være helt trygg på at et pågående spill aldri forsvinner mellom to timer, kan læreren
ta en **sikkerhetskopi**:

- Trykk **«⬇️ Last ned sikkerhetskopi»** nederst i konsollen. Du får en `.json`-fil med hele
  spillet (alle grupper og all fremgang). Ta denne før en lang pause.
- Skulle data forsvinne (utløpt prosjekt, slettet database, feil kode), velg
  **«Gjenopprett fra sikkerhetskopi»** på startskjermen og last opp filen. Hele spillet våkner
  til live igjen under samme kode, og elevene kobler seg på som før.

> Tips: skriv ned spillkoden (eller ta et bilde av storskjermen) ved timeslutt. Da finner dere
> alltid tilbake til spillet, også fra en annen PC enn den dere brukte sist.

---

## Kom i gang (utvikling)

Krever **Node 20.19+ eller 22+**.

```bash
npm install          # installer avhengigheter
cp .env.example .env # opprett miljøfil for Firebase (se under)
npm run dev          # start utviklingsserver (http://localhost:5173)
```

Andre kommandoer:

```bash
npm run build    # produksjonsbygg (TypeScript-sjekk + Vite) → dist/
npm run preview  # forhåndsvis produksjonsbygget lokalt
npm run lint     # ESLint
```

### Firebase (sanntidssync)

Sanntidssync mellom lærer og elever bruker **Firebase Realtime Database**. Fyll inn dine egne
verdier i `.env` (mal i [`.env.example`](./.env.example)) — hentes fra Firebase-konsollen under
*Prosjektinnstillinger → Dine apper → web-app*. `.env` er gitignorert og lastes aldri opp.

> Uten nett kan elever velge **«Spill offline»** og spille lokalt (uten sanntidssync mot
> lærerens skjerm).

### Lyd (valgfritt)

Spillet fungerer uten lyd. For full opplevelse: legg `.mp3`-filer i
[`public/sounds/`](./public/sounds/) — se `public/sounds/README.md` for nøyaktige filnavn og
forslag til gratis lydkilder. Lyd kan slås av/på med 🔊-knappen i spillet.

---

## Teknologi

React 19 · TypeScript · Vite · Tailwind CSS · Firebase Realtime Database ·
Howler.js (lyd) · Motion (animasjon) · React Router.

Sanntids-multiplayer: lærerskjerm og elevgrupper kobles sammen via en 4-bokstavs spillkode og
deler samme spilltilstand i Firebase Realtime Database (med `localStorage` som offline-fallback).

---

## Lisens / opphav

Laget av T. Ulriksen, lektor i norsk og samfunnskunnskap, i samarbeid med Claude (Anthropic).
</content>
</invoke>
