# Lydfiler — public/sounds/

Appen laster filene herfra (`/sounds/<filnavn>`). Mangler en fil, spilles den bare ikke —
appen krasjer ikke. Bruk royalty-frie / CC0-lyder.

## Bakgrunnsmusikk (to lange spor som crossfader, styres av `src/lib/music.ts`)

| Filnavn | Når | Forslag til søk |
|---|---|---|
| `waves.mp3` | «Eventyr»-sporet — under seiling/kart/dashboard. Bør være langt (~3–4 min) | «sea / ocean ambient music» |
| `background.mp3` | «Reflekterende» sporet — under kulturmøtet, oppgavesiden og stedsquizen (~2–3 min) | «viking folk ambient» |

Begge looper, spiller på lavt volum (~25 %), crossfader mykt ved kontekstskifte, og dempes
under Gudenes prøve / skjebne-kort.

## Effektlyder (korte, 1–4 sek — styres av `src/lib/sound.ts`)

| Filnavn | Når den spilles | Forslag til søk |
|---|---|---|
| `war-horn.mp3` | Quiz-overgangen (når fakta forsegles) | «viking war horn» |
| `dice-roll.mp3` | Terning mot trebord | «dice roll wood» |
| `silver-clink.mp3` | «Bra» utfall | «coins clink» |
| `thunder.mp3` | «Katastrofe»-utfall og skjebne-kort | «thunder clap» |
| `gods-trial.mp3` | Gudenes prøve utløses | «dramatic thunder impact» |
| `fanfare.mp3` | «Trumf» (beste utfall) | «epic fanfare» |
| `bell.mp3` | Ferdighet låses opp | «bell ding / chime» |

Volum per lyd justeres i `src/lib/sound.ts` / `src/lib/music.ts`.
Lyd kan slås av/på med 🔊-knappen i hjørnet (lagres i localStorage).
