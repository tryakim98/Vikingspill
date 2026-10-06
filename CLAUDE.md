# Arbeidsregler og arkitektur

React 19, TypeScript, Vite, Tailwind, Firebase RTDB og callable Functions.
Se README for utvikling, verifikasjon og produksjonsoppsett.

## Arbeidsmåte

- Svar på norsk. Vis plan ved større endringer; vent der det uttrykkelig bes om det.
- Fokuserte commits; `npm run check` skal passere før push.
- Sanntidsendringer testes med lærer og uavhengige elevinnlogginger:
  `npm run test:integration`.
- Bekreft at en fil er ureferert før sletting. Ikke endre bilder/teksturer i public
  uten beskjed. Ikke omformater de tre originale JSON-kildene.

## Arkitektur

- `src/domain/model.ts`: runtime-schema for tilstand, kommandoer og visninger.
- `src/domain/engine.ts`: ren applyCommand; samme motor for solo/server. Klokke,
  seed, identitet og tilstedeværelse injiseres. `replay.ts` gjenspiller fanget kontekst.
- `functions/src/index.ts`: autentiserte callables, autorisasjon og RTDB-transaksjon
  på hele spillet. Hold cache-lytter under eksisterende spilltransaksjoner.
- `src/classroom/store.ts`: én abonnementsflate, validert lokal økt og varig kø.
  Kommando-ID beholdes ved retry; runde/prøve-ID hindrer at gamle handlinger treffer
  ny runde. Ingen optimistisk poengskriving.
- `remote.ts` laster Firebase først når klasserommet brukes.
- `database.rules.json`: klienten skriver bare egen tilstedeværelse. Elever leser
  eget skip/egne private felt. Læreren leser grupper, ikke private stemmer.
- RTDB-visninger er JSON-strenger for å bevare tomme arrays/objekter. Autoritativ
  tilstand, kvitteringer og replaylogg er skjermet fra klienten.

## Regler som skal bevares

- Hver elev har eget fagbidrag og én stemme. Flertallet binder avgjørelsen; høvdingen
  bryter bare likhet. Privat kort/stemme skal ikke finnes i gruppevisningen.
- Rundens mannskap, valg og krav fastsettes ved avreise. Lærer kan frita et fraværende
  medlem med begrunnelse. Endrede krav gjelder neste kulturmøte.
- Saga opprettes alltid ved oppgjør. Kast/varer/poeng/besøkt/saga er én transaksjon.
  Reload, retry og varselkvitteringer deler aldri ut nye belønninger.
- Terning endrer handel/rykte. Faglig vurdering kommer bare fra rubrikk. Historisk
  samsvar er grunnlag for refleksjon, ikke moralsk fasit eller bonus.
- 3/4 quizrette hos alle aktive medlemmer, eller lærergodkjenning, gir beste av to
  kast. Fordeler stables ikke. UI-odds og server bruker samme enumererte regel.
  Paris etter plyndring har myk −1, aldri stenging av hovedsporet.
- Svennebrev 0/1/2 kommer bare fra teori og vurdert praksis. Skjebne, kjøp og
  interludier påvirker midlertidig tilstand, ikke beståtte kompetansebevis.
- Handel kontrollerer begge beholdninger ved aksept. Læreren bekrefter
  konkurransevinner; eleven kan ikke sende egen belønning.
- Høvdingfravær har 60 sekunders frist. Ting avgjøres i motoren. Prøvesvar og
  lukking tilhører den som startet prøven.

## Innhold og uttrykk

Canonical havnepakker: `src/content/packs.json`, validering i `validate.ts`.
`legacyDestinations.ts` bevares bare som migreringskilde. Stedsquiz og prøvebank
holdes separate. Kilder, fakta/tolkning/perspektiv og dramatisering skal være synlig.
Ikke fjern historiske usikkerhetsmerknader uten kildegrunnlag.

Svart-hvitt-gravyr, matt bronse, SVG/PNG-ikoner; ingen emoji i UI. Behold
Cinzel/Inter/JetBrains Mono, lesbar tekst, fokusmarkering og reduced motion.
