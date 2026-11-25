# Ombygging av originalspillet

Utgangspunkt: c96163165e8c636586ebc3e1ebe7e7b1fc5c350a i tryakim98/Vikingspill.
Branch: forbedringer/felles-spillmotor. Originalen og Ludus er separate prosjekter.

| Problem | Endring | Kontroll |
| --- | --- | --- |
| Regler i React-handlere og flere lagringsspor | Felles ren spillmotor og hensiktskommandoer | Motor/replay |
| Klienten kunne skrive poeng og utfall | Autentisert backend, lærerautorisasjon, transaksjoner | RTDB-regler og callables |
| Private stemmer/kort lå i gruppefelt | Privat projeksjon per UID, skjermet servertilstand | Visninger og rettigheter |
| Gjentatte hendelser/reload kunne gi nye belønninger | ID, kvitteringer, atomisk oppgjør | Retry, saga, varer, handel, Ragnarok |
| Frakobling og prøvefaser mistet tilstand | Validert snapshot, varig kø, runde/prøve-ID | Reload og frakobling |
| Mange elever bare så på | Individuelle bidrag, rolleoppgaver, quiz og stemmer | Lærer + fire elevøkter |
| Flaks/historisk samsvar ga fagpoeng | Separat rubrikk for begrunnelse/kildebruk/perspektiv | Vurdering og odds |
| Prøve/ting avhang av feil enhet | Prøveeier, motorstyrt ting, takeover med frist | Rettigheter og fravær |
| Uvaliderte koblinger og usikker historie | Versjonerte pakker, schema, kilder og merknader | Alle 12 havner og prøvebank |
| Uoversiktlig UI og lærerflyt | Tydelige steg, leselengde, elevstatus, vurdering, 45/90 min | Desktop/mobil |
| Svakt etterarbeidsgrunnlag | Saga alltid, sammenligning, elevbidrag, CSV/JSON | Eksport og backup |
| Ingen samlet regresjonskontroll | Lint, typing, motor, regler, backend og nettleser i CI | check og test:integration |

## Lærerskjermens designrunde

`src/classroom/teacher/` skiller oversikt, vurdering og øktkontroller. Egen CSS under
`.cg-teacher` holder utformingen samlet og avgrenser den fra elevsidene.

| Behov i klasserommet | Utforming |
| --- | --- |
| Se det viktigste raskt | Fremhevet kode, tid, antall skip, tilkoblet mannskap og skip som trenger oppfølging |
| Finne gruppen som venter | Handlingsliste og flåtekort med direkte åpning av valgt skip |
| Lese fagarbeid uten en lang vegg av tekst | Søkbart skipsvalg, filter for ventende vurderinger, sammenleggbare møter og navngitte elevbidrag |
| Veksle mellom oppfølging og skjermdeling | Vurderingsutkast og gruppebeskjeder beholdes ved bytte av skip/visning i samme sideøkt; bare lagrede vurderinger sendes til spillet |
| Skille undervisningsinnstillinger fra oppfølging | Egne områder for hendelser og øktoppsett, eksport og etterarbeid |
| Vise reisen til klassen | Egen storskjermvisning med kart, kode, tid og skipenes fremdrift; elevnavn, bidrag, vurderinger og tilbakemeldinger rendres ikke |
| Bruke tastatur og mobil | Tydelig aktiv navigasjon, merkede felt, fokusmarkering, Esc med retur til knappen og responsivt oppsett |

Den utvidede nettlesertesten prøver lærerflyten med seks skip, individuell vurdering,
innstillingsendring, eksport, bevarte vurderingsutkast, skjermdeling og fire lærerområder
på 390 pikslers skjerm. Mobil bruker et kompakt skipsvalg.
Storskjermkontrollen undersøker DOM-en for å bekrefte at elevnavn, tilbakemeldinger og
vurderingskontroller er utelatt. Skjermbilder lastes opp som CI-artefakter.

## Tilbakemeldinger før videre forenkling

Spillerne kan gi fire konkrete signaler uten å skrive. Valgfri fritekst gir plass
til forklaring eller forslag. Sted, steg og møte-ID følger meldingen automatisk;
navn, roller, elevbidrag og hemmelige felt fanges ikke. Etter øktens slutt inviterer
den samme inngangen til en frivillig tilbakemelding, uten et nytt obligatorisk steg.

`domain/feedback.ts` validerer både tidligere fritekstmeldinger og nye hurtigvalg.
`lib/feedback.ts` lagrer en validert kø med UID/kode; `useFeedbackOutbox.ts` sender
samme ID ved retry, og beholder ventende meldinger ved reload. Køen er avgrenset til
200 lokale poster og beskyttes mot overskriving ved skadet lagring. Sending direkte
til serveren kan fortsatt fungere ved blokkert lokal lagring. UI skiller mellom
lagret på enheten og mottatt, og tilbyr manuell retry og lokal eksport.

`teacher/FeedbackInbox.tsx` viser hurtigvalgenes antall og mottatte meldinger med
kategorifilter og CSV/JSON-eksport. Ingen elevnavn eller UID-er legges til i listen
eller eksporten; innloggings-ID brukes internt på serveren. Meldingene ligger utenfor
spilltilstand, faglig vurdering og spillbackup. Bare eieren av økten kan lese dem,
og storskjermvisningen utelater hele oversikten fra DOM-en.

Fire tester dekker datavalidering, køisolasjon, kapasitetsgrense/skadet lagring og
trygg CSV. Databasetest og ekte callables kontrollerer lærerens lesetilgang,
uautoriserte/ugyldige meldinger og uforanderlig mottak ved retry. Nettleserflyten
prøver skriveløst hurtigvalg, flere meldinger, nettbrudd/reload, filter/eksport,
feedback etter lukking og lokal feedback i alenespill. Den tidligere verifikasjonen
mot produksjonsdatabasen er erstattet av isolerte demo-emulatorer.

## Drift og avgrensninger

Urefererte, erstattede skjermer/hooks og de gamle skrive-API-ene er fjernet.
Gravyr/teksturer, havner, sjøkart, skip, kort/rollebanker, skjebneinnhold og musikk
beholdes. Holmgang spilles lokalt; læreren bekrefter konkurransepoengene.
Ny backend/regler må deployes sammen med frontend. Ingen produksjon deployes av
branch-arbeidet. Anonymous Auth binder lærerrollen til nettleseren; bruk backup
ved bytte. V1-backup migreres ikke automatisk. Full backup inneholder hemmelige
felt og er for læreren; saga og CSV er etterarbeidsgrunnlaget som kan deles.

Historien er fortsatt dramatisering. Merknader rydder blant annet i Somerleds tid,
Ottars perspektiv, Vinland-arkeologi og Ibn Fadlans reisested. En full påstandsvis
faktasjekk av originalfortellingene gjenstår. Kodevalidering gjør ikke dette fagarbeidet.

## Kontroll i dette arbeidsmiljøet

Se GitHub Actions for resultat på siste commit. Testene bruker et isolert
Firebase-demo-prosjekt og virkelige SDK-er, aldri produksjonsdata.

Functions-emulatorens interne Unix-socket ble lokalt erstattet med en listener på
127.0.0.1 fordi dette kjørearbeidsmiljøet ikke tillater slike sockets. Bare
installerte filer i node_modules ble tilpasset; dette ligger ikke i git og er ikke
nødvendig på vanlige maskiner/GitHub-runneren. Testet funksjonskode og autorisasjon
er uendret. Playwright brukes når agent-browser-daemonen ikke kan starte her.

Kontrollert 6. oktober 2026: 35 motortester, 4 tilbakemeldingstester og 8 databaserettighetstester passerer.
Ekte serverkall for autorisasjon, retry, backup/import og tilbakemelding passerer.
Nettleserflyt med lærer + fire elever, hemmelig stemme, varig frakoblingskø,
reload uten ekstra belønning, etterarbeid, vurdering, eksport, mobil og solo passerer.
Lint, strenge typekontroller, innholdsvalidering, formatering og begge bygg passerer.
