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

Kontrollert 6. oktober 2026: 35 motortester og 7 databaserettighetstester passerer.
Ekte serverkall for autorisasjon, retry, backup/import og tilbakemelding passerer.
Nettleserflyt med lærer + fire elever, hemmelig stemme, varig frakoblingskø,
reload uten ekstra belønning, etterarbeid, vurdering, eksport, mobil og solo passerer.
Lint, strenge typekontroller, innholdsvalidering, formatering og begge bygg passerer.
