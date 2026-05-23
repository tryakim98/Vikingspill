# Vikingspill

Et Vite + React + TypeScript-prosjekt.

## Kom i gang

Krever Node.js 18.18+ (helst Node 20+).

```bash
npm install
npm run dev
```

Appen starter på http://localhost:5173.

## Skript

| Kommando            | Beskrivelse                                      |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | Starter Vite dev-server med HMR                  |
| `npm run build`     | Type-sjekker og bygger produksjon til `dist/`    |
| `npm run preview`   | Forhåndsviser produksjonsbygget lokalt           |
| `npm run lint`      | Kjører ESLint på prosjektet                      |
| `npm run typecheck` | Kjører TypeScript-kompilator i `--noEmit`-modus  |

## Mappestruktur

```
.
├── index.html                # Vite-inngangspunkt
├── public/                   # Statiske filer (serveres som rot)
├── src/
│   ├── assets/               # Bilder, fonter o.l. importert fra koden
│   ├── components/           # Gjenbrukbare UI-komponenter
│   ├── hooks/                # Egendefinerte React-hooks
│   ├── lib/                  # Hjelpefunksjoner / utils
│   ├── pages/                # Side-/skjermkomponenter
│   ├── styles/               # Globale stilark
│   ├── types/                # Delte TypeScript-typer
│   ├── App.tsx               # Rotkomponent
│   ├── main.tsx              # React-inngangspunkt
│   └── vite-env.d.ts         # Vite/TypeScript-typer
├── eslint.config.js          # ESLint flat-config
├── tsconfig.json             # TS-prosjektreferanser
├── tsconfig.app.json         # TS-konfig for app-kildekode
├── tsconfig.node.json        # TS-konfig for Vite-konfig m.m.
└── vite.config.ts            # Vite-konfigurasjon
```

## Importalias

`@/` peker til `src/`, slik at importer kan skrives `import { Button } from '@/components/Button'`.
Aliaset er konfigurert i både `vite.config.ts` og `tsconfig.app.json`.
