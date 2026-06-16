# Statusrapport til Claude — Vikingspill

*Oppdatert 2026-06-16 (ettermiddag). Gi denne til Claude ved oppstart av neste økt.*

## Hva er prosjektet
Nettbasert klasseromsspill for VG2 (kulturmøter/vikingtid). React + TypeScript + Vite + Tailwind v4 + Firebase Realtime Database. Full spec ligger i `CLAUDE.md` (v3) i repo-roten. **Live:** https://vikingspill.vercel.app/ (dette er den ENESTE delelenken til elever).

## Status: fase 1–4 er ferdig og deployet
Hele spillet er bygget og i drift:
- Datalag (12 destinasjoner flettet fra `vikingspill_data.json` + `vikingspill_innhold_v2.json`, 67 quiz-spørsmål).
- Rollevalg + ruting, gruppeoppsett (vikingskip-SVG), dashboard, encounter-flyt (§6.6), verdighetsprøver (§3.2), sluttseremoni + arketype.
- Sanntid via Firebase (`lib/gameSync.ts`) + lærerskjerm (`TeacherPanel`: sjøkart, leaderboard, oppgavegodkjenning, Gudenes prøve, sjøslag-dueller, skjebne-kort, Ragnarok).
- Lyd (Howler, 10 mp3-er + bakgrunnsmusikk med crossfade), animasjon (motion), responsivitet, error boundaries.
- Lagre/gjenoppta spill over flere økter (pause + fortsett med kode, sikkerhetskopi til fil). Firebase RTDB-prosjekt `vikingspill-2b754` (europe-west1), regler deployet til prod.

## Det SISTE jeg jobbet med (2026-06-16 ettermiddag)
**Stedsbilder koblet inn + alle tunge bilder komprimert.**
- `68d0c5f` Ryddet opp mediefiler: de 12 stedsbildene var feilplassert i `steder/steder/` med dobbel `.png.png`-endelse + rot i `textures/textures/`. Flyttet på plass, slettet rot og to ubrukte ornament-rester (`ikoner-ark.png`, `ramme-kulturmote-original.png`).
- `3688806` **Stemningsbilde av stedet i historiesteget** (§5.1 ankomst). Nytt `image`-felt på `Destination`, fylt med `sted-<id>.jpg`. Vises som beskåret 16:9-banner øverst i `EncounterFlow` historie-steget, med gradient ned mot tittelen og defensiv `onError` (skjuler seg om filen mangler).
- **To navne-avvik rettet** så id = filnavn: `bagdad`→`baghdad`, `hebridene`→`hebrides`.
- **Komprimering** (kun Pillow tilgjengelig i codespace — ikke pngquant/cwebp/imagemagick): 12 stedsbilder fra 2,9–4,1 MB → **363–535 KB** (JPEG, maks 1500–1600 px, 4:2:0). Tunge textures også: `mose-stein` 5,9 MB→538 KB, `kart-bakgrunn` (→.jpg) 3,4 MB→486 KB, `tre-gammelt` 1,2 MB→431 KB. Textures **med alfakanal** (`jern-smidd`, `mosaikk-gull`, `reinskinn`) beholdt PNG + transparens, men ble octree-kvantisert (174–286 KB). `public/steder/` gikk fra ~40 MB → 5,4 MB. **Verifisert i nettleser:** banner laster og ser skarpt ut, ingen synlige JPEG-artefakter.
- Sti-endringer pga. format: `steder/*.png`→`.jpg` (i `data/destinations.ts`) og `kart-bakgrunn.png`→`.jpg` (i `SeaJourney.tsx`). `index.css` var uberørt. Skjermbilde-skript: `scripts/shot-historie.mjs`.
- **Ikke pushet ennå** — ligger lokalt på `main`, ikke på live.

### Tidligere samme dag (2026-06-15 kveld → 2026-06-16 morgen)
To deler: én funksjonell, og en stor **visuell identitets-omgang**.

**Funksjonelt (verifisert):**
- `87c511d` Fikset synk av skjebnehjulet til elevskjermene (elevene ser nå samme trekning som lærerskjermen).
- `373727c` **Fjernet tidevann-funksjonen** helt. ⚠️ Merk: `CLAUDE.md` §6.5/§8 beskriver fortsatt «tidevannstimer» — dette er en bevisst divergens etter brukerens ønske, ikke en feil. Ikke gjeninnfør den uten å spørre.

**Visuell identitet (subjektivt — KREVER brukerens øyne, se sjekkliste under):**
- `4e76c4d` + `e4f5c76` Erstattet emoji med norrøne ikoner; ikon-arket delt i 11 separate transparente filer.
- `27ae5c2` + `242bfa5` Flettede rammer (vikingfletteborder) erstatter tynne panel-kanter; flettebord + vikingskip koblet inn.
- `8dea702` + `458d179` Ny overskriftsfont: Cinzel-inskripsjon på titler (fjernet Grenze Gotisch).
- `78d3db0` + `fdf303b` + `da7bdf3` Dempet palett: gull som sjelden, matt bronse-aktig aksent, ellers nær monokromt. Tynnere flettebord.
- `3c710e8` Lik størrelse på Tor- og viking-boksene i hovedmenyen.
- `3bdf56f` Individuell tekstlengde per elev.

## ⚠️ Hva som IKKE er bekreftet ennå — det du må vurdere
Det funksjonelle (logikk, synk, lagring) er teknisk i orden og verifisert. Men de siste ~10 commit-ene er **estetikk** — om det «er som du vil» kan bare DU avgjøre ved å se på det. Dev-server kjører på http://localhost:5173/. Gå gjennom denne sjekklisten i nettleseren:

- [ ] **Fonten på titler** (Cinzel-inskripsjon): lesbar og passer stemningen?
- [ ] **Fargene** (dempet/nær monokromt med sjelden gull-aksent): for mørkt/grått, eller akkurat passe stramt?
- [ ] **Flettede rammer** rundt paneler: pynter de, eller blir det rotete/for tykt?
- [ ] **De norrøne ikonene** (erstattet emoji): tydelige nok til at elever skjønner hva de betyr?
- [ ] **Hovedmeny** (Tor- vs viking-boks i lik størrelse): balansert?
- [ ] **Stedsbilde-banner** øverst i historiesteget (nytt 2026-06-16): banneret er verifisert at det laster og ser skarpt ut etter komprimering, men se gjerne over alle 12 om beskjæringen (16:9) treffer fint på hvert sted.
- [ ] Sjekk både **elevflyt** (velg elev → skip → seil til et sted → encounter) og **lærerskjerm** (storskjerm-perspektiv).
- [ ] Sjekk på **mobil/iPad-bredde** også, ikke bare laptop.

Si fra hva du vil endre — så fikser neste Claude det. Ingenting av dette er deployet til live før du eventuelt ber om push (se under).

## Hva gjenstår / mulige neste steg
Ingenting er strengt nødvendig — spillet er komplett og i bruk. Valgfrie forbedringer:
1. **Utsatte fase-1-mekanikker** (bruker har OK'd å utsette): historisk-nøyaktighet-bonus (§6.1) og sen-spill-straff for manglende ferdigheter (§3.3).
2. **Hardere Firebase-sikkerhet:** Anonymous Auth + per-gruppe-eierskap. Iboende begrensning i dagens no-auth-modell: alle med en gyldig spillkode kan lese/skrive det spillet.
3. **Klasseromstesting:** kjøre spillet med en hel klasse og samle erfaringer (ytelse med mange grupper, mobilbrukervennlighet).

## Slik vil brukeren at du jobber (VIKTIG)
- **Svar på norsk.**
- **Én commit per ferdig funksjon, rett på `main`.** Brukeren dikterer commit-meldingen (norsk). **Vent på klarsignal før du committer.**
- **Verifiser i nettleser før en UI-funksjon erklæres ferdig** («vis meg i nettleseren»). Playwright er devDependency; screenshots via headless-Chromium (bruk `domcontentloaded`, ikke `networkidle` — Vite HMR sin websocket brekker det).
- **Fase for fase per `CLAUDE.md` §12**, pause for godkjenning mellom funksjoner.
- Følg kjerneprinsippene: gjennomgående vikingtema (ingen generisk «skoleprogramvare»-look), læreren bestemmer KUN *når* ved Gudenes prøve/skjebne-kort (aldri hvem), ingen gruppe-mot-gruppe-forhandling, respekt for samisk kultur.

## Nyttig kontekst
- **Pre-push-hook** kjører `npm run build` (commit `f80d27f`) — bygget må være grønt for å pushe. (Push = deploy til live via Vercel.)
- **Firebase CLI** er globalt installert i codespace (v15.20.0). Interaktiv `firebase login` MÅ kjøres i ekte TTY (ikke `!`-prefiks). `firebase deploy --only database` går fint fra vanlig terminal.
- **Spillkode-format:** 4 store bokstaver, ingen I/O, ingen tall (f.eks. `RAVN`). Regler tillater både nytt format og legacy `VIKING-XXXX`.
- QR-kode + ferdig elevtekst ligger i `del-med-elever/`.
- **Bildekomprimering:** kun Pillow finnes i codespace (ingen pngquant/cwebp/imagemagick). Mønster: JPEG q83–88 + 4:2:0 + maks 1500–1600 px for ugjennomsiktige bilder; octree-kvantisert PNG for bilder med alfakanal. `scripts/shot-historie.mjs` viser hvordan man skjermbilder historiesteget.
- **Upushede commits på `main`:** `68d0c5f` + `3688806` (mediefiler + stedsbilder) ligger lokalt, ikke deployet til live. Push utløser pre-push-bygg + Vercel-deploy.
- **Lokale, ucommittede endringer akkurat nå:** kun denne rapporten (`RAPPORT-TIL-CLAUDE.md`, untracked). Alt annet er committet på `main`.
