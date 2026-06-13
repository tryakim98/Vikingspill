# Vikingenes kulturmøter ⚔️🛡️

Et nettbasert klasseromsspill for VG2 yrkesfag (samfunnskunnskap / kulturmøter). 3–10
grupper styrer hvert sitt vikingskip gjennom 12 historiske destinasjoner — Lindisfarne,
Hedeby, Bagdad, Miklagard m.fl. Underveis møter de episke kulturmøter, gjør morsomme
skoleoppgaver, bygger ferdigheter, kaster terning på valg med konsekvenser, og kappes på
lærerens storskjerm i sanntid.

Spilletid: ca. 75–120 min. Plattform: nettleser (telefon, iPad, laptop, projektor) — ingen
installasjon for elevene.

> Hele spillvisjonen og reglene ligger i [`CLAUDE.md`](./CLAUDE.md).

## Én app, to roller

Spillet er **én app** som åpner med et rollevalg:

- **Lærer** 👩‍🏫 — oppretter et spill og får en **4-bokstavs spillkode** (f.eks. `RAVN`). Får
  spillmasterkonsollen: sjøkart med alle skip, leaderboard, oppgavegodkjenning, tidevannstimer,
  «Gudenes prøve», skjebne-kort og Ragnarok. Vises typisk på **projektor/storskjerm**.
- **Elev** 🧑‍🤝‍🧑 — taster inn spillkoden, velger og rigger skip, og spiller møte-flyten på
  **egen telefon/iPad**. Flere grupper deler samme kode og vises alle på lærerens kart.

Rollen huskes i `localStorage`. «Bytt rolle» finnes nederst på begge skjermene.

## Slik kobler lærer og elever sammen

1. **Læreren** åpner spillet → «Jeg er lærer» → **Opprett spill**. En spillkode vises øverst
   på storskjermen.
2. **Elevene** åpner samme nettadresse på sine enheter → «Jeg er elev» → taster inn
   spillkoden → **Bli med**.
3. Hver gruppe velger skip (farge, navn, symbol) og en startferdighet, og begynner seilasen.
   Alle gruppene dukker opp på lærerens sjøkart i sanntid.

> Uten nett kan elever velge **«Spill offline»** og spille lokalt (uten sanntidssync mot
> lærerens skjerm).

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

> ⚠️ **Før deploy:** Realtime Database-reglene må settes til skikkelige sikkerhetsregler.
> Test-modus er åpent for alle og utløper automatisk.

### Lyd (valgfritt)

Spillet fungerer uten lyd. For full opplevelse: legg åtte `.mp3`-filer i
[`public/sounds/`](./public/sounds/) — se `public/sounds/README.md` for nøyaktige filnavn og
forslag til gratis lydkilder. Lyd kan slås av/på med 🔊-knappen i spillet.

## Teknologi

React 19 · TypeScript · Vite · Tailwind CSS · Firebase Realtime Database ·
Howler.js (lyd) · Motion (animasjon) · React Router.

## Lisens / opphav

Laget av T. Ulriksen, lektor i norsk og samfunnskunnskap, i samarbeid med Claude (Anthropic).
