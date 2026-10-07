# Vikingenes kulturmøter

Klasseromsspill om kulturmøter for videregående. Mannskapet besøker 12 havner,
undersøker kilder, drøfter valg og reflekterer over utfall. Dette er det selvstendige
Vikingspillet — **ikke Ludus**. Produktene kan dele historikk og ideer, men skal ikke
dele offentlig URL, navigasjon eller deployment. Kanonisk offentlig adresse er
`https://vikingspill.vercel.app`, og produksjonsbackend er Firebase-prosjektet
`vikingspill-2b754`. Gravyr, skip, sjøkart, musikk og holmgang er beholdt.

## Spillforløp

1. Læreren velger Odin, oppretter en økt og deler en firebokstavskode.
2. Elevene velger Flerspiller og blir med i samme skip. Alle bidrar uten faste roller.
3. Høvdingen velger havn. Alle leverer egne fakta, kilde, tolkning, perspektiv og
   quizsvar. Læreren kan frita et fraværende medlem med begrunnelse.
4. Etter samtalen stemmer alle hemmelig. Flertallet bestemmer; høvdingen bryter
   bare likhet og skriver begrunnelsen før terningen kastes.
5. Serveren gjør hele oppgjøret én gang. Gruppen sammenligner med kildene og
   skriver etterarbeid. Sagaen lagres også når begrunnelse ikke er påkrevd.
6. Læreren vurderer begrunnelse, kildebruk og perspektiv på en egen skala.
   Terning, rikdom og historisk samsvar gir ingen faglig vurdering.

Tor / Alene bruker samme motor, med diskusjonsspørsmål og tydelig egenvurdering.
Økten lagres på enheten, også under seilas og svenneprøve. Innstillinger gjelder fra
neste møte. Beregn 45 minutter til 2–3 møter og 10 minutter etterarbeid, eller
90 minutter til flere møter og 20 minutter etterarbeid.

## Lærerskjermen

Odin har fire områder: **Oversikt**, **Oppgaver og vurdering**, **Hendelser** og
**Økt og innstillinger**. Spillkode, veiledende tid, tilkoblet mannskap og skip som
trenger oppfølging vises øverst. Oversikten viser kart, fremdrift og direkte veier
til gruppene som venter. Vurdering samler ett skip om gangen; elevbidrag åpnes under
navn. Ulagrede vurderingsutkast beholdes når du bytter skip eller visning
innenfor samme sideøkt. Innstillinger har eksport, sikkerhetskopi og avslutning av økten.

**Vis på storskjerm** åpner kart, kode, tid og skipenes status uten individuelle
elevnavn, fagbidrag eller tilbakemeldinger. Skjebnehjul og lagresultater kan også vises.
**Esc** går tilbake til regipulten.

## Reiseboken, prøver og lagleker

Hver havn har et eget lagverksted og to reisenotater. Elevene lærer opplysningene
under kulturmøtet, og samler dem i reiseboken etter fullført besøk. De kan slå opp
notatene igjen i sjøkartet og under en prøve. Svenneprøvene viser hvilke havner som
gjenstår, og serveren avviser prøver uten alle nødvendige besøk. Alle aktuelle
havner blir representert i teorien; praksisen bruker erfaringer fra de samme stedene.
Lagets svar leveres av den som startet prøven, og læreren vurderer praksisen.

| Prøve | Første nivå | Andre nivå |
|---|---|---|
| Språk og kilder | Hedeby, Hebridene | Hedeby, Hebridene, Novgorod |
| Seilas og ruter | Hebridene, Færøyene | Hebridene, Færøyene, Island |
| Makt og konflikt | Lindisfarne, Paris | Lindisfarne, Paris, Dublin |
| Handel og avtaler | Hedeby, Paris | Hedeby, Paris, Dublin |
| Tro og perspektiver | Lindisfarne, Sápmi | Lindisfarne, Sápmi, Dublin |

Gudenes prøve og holmgang er **lagleker uten faglig vurdering**: Tors tromme,
Lokes lysknep, Bifrost-statuene, Den usynlige åren og Skipet i stormen. Deltakerlisten
fastsettes når leken åpnes. Alle gjør seg klare på sin egen skjerm. Holmgang starter
når begge lag er klare; læreren starter Gudenes prøve. Fem sekunder nedtelling og
en felles tidsfrist kommer fra serveren, med synkronisert nettleserklokke.
I alenespill starter nedtellingen når spilleren er klar, og øvingsleken kan
avsluttes eller avlyses uten lærer.

Mobil-lekene teller lokalt uten et nettverkskall per trykk. Lagets resultat er
**sum poeng / antall aktive medlemmer**, og alle må levere før resultatet kan
bekreftes. Likhet gir delt seier. Fysiske leker krever at alle bekrefter deltakelse;
læreren velger laget med best gjennomføring. Fravær avklares med begrunnelse før
start; en pågående lek kan avlyses. Poengene er spillresultater, ikke karakterer.
Dette er tillitsbaserte klasseromsleker; serveren kontrollerer identitet, tidsfrist,
grenser og engangslevering, men kan ikke bevise hvert fysisk trykk på en mobil.

Skjebnehjulet har seks felt, gravert bronseramme og ravnemedaljong. Serveren trekker
feltet og gjennomfører hendelsen én gang; animasjonen stopper på samme felt. Se
[assets og genereringsprompter](public/game/ASSETS.md). Ragnarok halverer bare positiv
handelsgevinst. Hendelser endrer ikke pågående besøk, fagbidrag, stemmer, prøvesvar,
sagaer eller kompetansebevis. Uleverte bidrag, prøvesvar og trykk lagres også som lokale
utkast. Det krever at nettleseren tillater lokal lagring.

Eksisterende v2-backuper beholder aktive prøver med sin opprinnelige spørsmålsbank
og dropper elevrollene. Nye prøver bruker den nye reisebanken. Gamle private kort i
en pågående runde bevares som ekstra opplysninger; nye runder deler ikke ut rollekort.

## Tilbakemeldinger fra spillerne

**Gi tilbakemelding om spillet** finnes øverst hos elevene, fra valg av mannskap til
øktens slutt. Fire hurtigvalg kan sendes uten tekst: **For mange regler**, **Usikker
på neste steg**, **Noe virker ikke** og **Dette likte jeg**. En valgfri setning kan
utdype valget; et skriftlig forslag kan også sendes alene. Havnen og steget følger
meldingen automatisk. Ingen skjemaer stopper spillet, og tilbakemelding påvirker
ikke faglig vurdering.

Klasseromsmeldinger lagres på enheten før sending. Nettbrudd og reload beholder
samme meldings-ID; sending prøves igjen ved gjenopprettet forbindelse, ved åpning
av samme økt eller med **Prøv å sende igjen**. Bare opprinnelig innlogging og
spillkode brukes til retry. Ved blokkert lokal lagring kan en tilkoblet enhet
fortsatt sende direkte; offline vises en feil, uten å hevde at meldingen er lagret.

Læreren velger **Se spillernes tilbakemeldinger** eller finner oversikten under
**Økt og innstillinger**. Opptelling, kategori, sted/steg og valgfri tekst kan leses
og eksporteres til CSV/JSON for utvikleren, også etter avsluttet økt. Elevnavn legges
ikke til, men anonym innloggings-ID brukes internt for autorisasjon og retry;
unngå navn i fritekst. Bare øktens lærer har lesetilgang. Meldingene rendres ikke
i storskjermvisningen og er adskilt fra spillbackup og fagarbeidseksport.

I alenespill lagres tilbakemeldinger lokalt og kan lastes ned og deles. De sendes
ikke til et klasserom. Eldre servermeldinger kan fortsatt leses i læreroversikten;
eldre lokale v2-kopier beholdes urørt. Nettleseren oppbevarer inntil 200 nye lokale
kopier; ventende meldinger slettes ikke for å gi plass til nye.

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
Hurtigvalg uten tekst, ekstra meldinger, automatisk kontekst, feedback etter nettbrudd
og reload, læreroversikt/filter/eksport, øktslutt og alenespill kontrolleres i samme flyt.
En ny lærer og tre separate spillere gjennomfører havnebesøk, låser opp en prøve,
leverer teori/praksis, spiller en felles mobil-lek og åpner holmgang. Ragnarok og
reload testes under fagarbeid, prøve og klikkonkurranse; et resultat leveres etter
nettbrudd. Nytt skjebnehjul testes på desktop og mobil.
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
   npx firebase deploy --only functions:vikingspill,database --project vikingspill-2b754
   ```

4. Bygg frontend med samme prosjekt. Callable-funksjonene ligger i `europe-west1`.
5. Kontroller lærer og separate elevnettlesere før klassen bruker utgaven.

Databasereglene lukker tidligere `games/`-stier. Ikke deploy denne appen eller
backend-endringer til Ludus-prosjektet `ludus-1903`. Bruk et eget testprosjekt hvis
produksjonen skal stå urørt.
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
