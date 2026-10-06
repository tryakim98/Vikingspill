# Vikingenes kulturmøter

Klasseromsspill om kulturmøter for videregående. Mannskapet besøker 12 havner,
undersøker kilder, drøfter valg og reflekterer over utfall. Denne branchen bygger om
originalspillet før Ludus. Gravyr, skip, sjøkart, musikk og holmgang er beholdt.

## Spillforløp

1. Læreren velger Odin, oppretter en økt og deler en firebokstavskode.
2. Elevene velger Flerspiller, blir med i samme skip og velger hver sin rolle.
3. Høvdingen velger havn. Alle leverer egne fakta, kilde, tolkning, perspektiv og
   quizsvar. Læreren kan frita et fraværende medlem med begrunnelse.
4. Etter samtalen stemmer alle hemmelig. Flertallet bestemmer; høvdingen bryter
   bare likhet og skriver begrunnelsen før terningen kastes.
5. Serveren gjør hele oppgjøret én gang. Gruppen sammenligner med kildene og
   skriver etterarbeid. Sagaen lagres også når begrunnelse ikke er påkrevd.
6. Læreren vurderer begrunnelse, kildebruk og perspektiv på en egen skala.
   Terning, rikdom og historisk samsvar gir ingen faglig vurdering.

Tor / Alene bruker samme motor, med NPC-mannskap og tydelig egenvurdering.
Økten lagres på enheten, også under seilas og svenneprøve. Innstillinger gjelder fra
neste møte. Beregn 45 minutter til 2–3 møter og 10 minutter etterarbeid, eller
90 minutter til flere møter og 20 minutter etterarbeid.

## Lærerskjermen

Odin har fire områder: **Oversikt**, **Oppgaver og vurdering**, **Hendelser** og
**Økt og innstillinger**. Spillkode, veiledende tid, tilkoblet mannskap og skip som
trenger oppfølging vises øverst. Oversikten viser kart, fremdrift og direkte veier
til gruppene som venter. Vurdering samler ett skip om gangen; elevbidrag åpnes under
navn og rolle. Ulagrede vurderingsutkast beholdes når du bytter skip eller visning
innenfor samme sideøkt. Innstillinger har eksport, sikkerhetskopi og avslutning av økten.

**Vis på storskjerm** åpner kart, kode, tid og skipenes status uten individuelle
elevnavn, fagbidrag eller tilbakemeldinger. **Esc** går tilbake til regipulten.

## Utvikling og kontroller

Bruk Node 22 og Java 21; Java trengs bare til Firebase-emulatoren.

```sh
npm ci
npm ci --prefix functions
npm run dev
```

Øving fungerer uten Firebase-konfigurasjon. For lokalt klasserom:

```sh
npm run build:functions
npx firebase emulators:start --only auth,database,functions --project demo-vikingspill
```

Start Vite i en annen terminal: `VITE_FIREBASE_EMULATORS=true npm run dev`.
Auth bruker 9099, database 9000 og functions 5001. Begge sider bruker namespace
`demo-vikingspill-default-rtdb`.

```sh
npm run check
npx playwright install --with-deps chromium
npm run test:integration
```

`check` kjører lint, streng typing for tester/server, innholdsvalidering, motortester
og begge produksjonsbyggene. Integrasjonstesten kjører databaserettigheter, ekte
callable-funksjoner og lærer med fire separate elevinnlogginger i nettleseren.
Fem ekstra autentiserte mannskaper prøver en flåte på seks skip. Lærerens navigasjon,
innstillinger, vurdering etter lukking, skjermdeling og mobiloppsett kontrolleres også.
Skjermbilder og demo-backup legges i `test-results/`. GitHub Actions kjører samme
kontroller på branchen og PR-er. En eksisterende Chromium-binær kan angis med
`VIKING_BROWSER_PATH`. Ny kode kan sjekkes med `npm run format:check`.

## Produksjon og backup

Klasserommet krever ny backend sammen med frontend. Denne branchen deployer ikke
Firebase automatisk og endrer ikke eksisterende produksjon. Deploy ikke bare
frontend til en klasseøkt.

1. Koble riktig Firebase-prosjekt, aktiver anonym Authentication og RTDB. Prosjektet
   må kunne kjøre Node 22 Cloud Functions.
2. Kopier `.env.example` til `.env` og fyll inn prosjektets offentlige webkonfigurasjon.
3. Installer funksjonsavhengigheter, bygg og deploy til det uttrykkelig valgte prosjektet:

   ```sh
   npm ci --prefix functions
   npm run build:functions
   npx firebase deploy --only functions:vikingspill,database --project DITT_PROSJEKT
   ```

4. Bygg frontend med samme prosjekt. Callable-funksjonene ligger i `europe-west1`.
5. Kontroller lærer og separate elevnettlesere før klassen bruker utgaven.

Databasereglene lukker tidligere `games/`-stier. Bruk et eget prosjekt til utprøving
hvis originalen skal kjøre samtidig.
Lærerrollen bindes til den anonyme innloggingen i nettleseren som opprettet spillet.
Koden gir ikke lærertilgang. Ta backup før du bytter/nullstiller nettleser.
Full backup inneholder også private stemmer og rollekort og er for læreren.
Gjenoppretting validerer hele tilstanden og lager ny kode. Bare backupformat v2
støttes; gamle v1-filer og lokale økter konverteres ikke automatisk.
CSV-eksporten har saga, elevbidrag, quiz og faglig tilbakemelding.

## Kode og innhold

Se [arkitektur og forbedringer](docs/forbedringer.md) og [arbeidsregler](CLAUDE.md).
Havnepakker ligger i `src/content/packs.json`. De originale JSON-kildene er bevart
uten omformatering. Schema, svarnøkler, odds og referanser valideres før bygg.

Fortellingene er dramatiserte undervisningsopplegg. Pakkene har kilder,
perspektivoppgaver og konkrete merknader om usikkerhet og tidssammenblanding.
Alle er merket for videre historiefaglig gjennomgang; ikke alle detaljer i
originalfortellingene er påstandsvis faktasjekket.
