# Lydfiler — public/sounds/

Legg åtte mp3-filer her med **nøyaktig** disse navnene. Appen laster dem fra
`/sounds/<filnavn>` (se `src/lib/sound.ts`). Mangler en fil, spilles den bare ikke —
appen krasjer ikke. Hold dem korte (1–4 sek, untatt `waves`).

| Filnavn | Når den spilles | Forslag til søk (freesound.org / pixabay.com/sound-effects / mixkit.co) |
|---|---|---|
| `waves.mp3` | Bølger når dere seiler inn til en destinasjon | «ocean waves», «sea waves loop» |
| `war-horn.mp3` | Krigshorn ved quiz-overgangen (når fakta forsegles) | «viking war horn», «battle horn» |
| `dice-roll.mp3` | Terning som ruller mot trebord | «dice roll wood», «dice on table» |
| `silver-clink.mp3` | Sølvklirr ved «Bra» utfall | «coins clink», «silver coins drop» |
| `thunder.mp3` | Torden ved «Katastrofe» utfall | «thunder clap», «thunder rumble» |
| `gods-trial.mp3` | Torden + varsel når læreren utløser Gudenes prøve | «thunder strike impact», «dramatic boom alert» |
| `fanfare.mp3` | Episk fanfare ved «Trumf» (beste utfall) | «epic fanfare», «victory brass fanfare» |
| `bell.mp3` | Klokkeklang når en ferdighet låses opp | «bell ding», «magic chime bell» |

Bruk royalty-frie / CC0-lyder (oppgi kilde i prosjektets README hvis lisensen krever det).
Volum justeres per lyd i `src/lib/sound.ts` (`SOUNDS`-tabellen).
Lyd kan slås av/på i spillet med 🔊-knappen (lagres i localStorage).
