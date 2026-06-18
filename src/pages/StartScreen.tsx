/**
 * StartScreen.tsx
 * Tre-veis startskjerm — ett innrammet gravyr-kort per spor, koblet til de
 * EKSISTERENDE inngangene (ingen ny spill-logikk, bare ruting):
 *
 *   ODIN  — «Læreren»     → /teacher           (regipult/storskjerm)
 *   VIKING — «Flerspiller» → /student (online)  → JoinGame tar spillkoden
 *   TOR   — «Alene»        → /student (offline)  → playOffline() seeder økten
 *
 * Returnerende brukere med lagret rolle hoppes rett videre (samme som før).
 * Visuelt: svart-hvitt gravyr, hugget flettverksramme (.viking-frame) + material
 * per kort, matt gull kun som sjelden aksent. Ingen runding/skygge/glow.
 */

import type { ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useRole } from '../hooks/useRole';
import { useSession } from '../hooks/useSession';
import NorseIcon from '../components/decor/NorseIcon';
import Icon from '../components/decor/Icon';
import { Yggdrasil, Raven, RuneDivider, Vegvisir, ThorHammer } from '../components/decor';

type Material = 'stein' | 'tre' | 'skinn';

interface PathCard {
  key: string;
  motif: ReactNode;     // blikkfang: maskert ornament-PNG eller monokrom decor-SVG
  name: string;
  role: string;
  desc: string;
  cta: string;
  material: Material;
  onSelect: () => void;
}

export default function StartScreen() {
  const navigate = useNavigate();
  const { role, setRole } = useRole();
  const { playOffline } = useSession();

  // Returnerende bruker: hopp rett til sitt spor (StudentGame gjenoppretter økten).
  if (role === 'teacher') return <Navigate to="/teacher" replace />;
  if (role === 'student') return <Navigate to="/student" replace />;

  const cards: PathCard[] = [
    {
      key: 'odin',
      motif: <NorseIcon name="motiv-gudeoye" size={96} className="text-viking-gold-soft" />,
      name: 'Odin',
      role: 'Læreren',
      desc: 'Allfaderens utsyn fra Åsgard. Styr spillet fra storskjermen — følg flåten, gi velsignelser og slipp Skjebnehjulet løs.',
      cta: 'Åpne regipulten',
      material: 'stein',
      onSelect: () => { setRole('teacher'); navigate('/teacher'); },
    },
    {
      key: 'viking',
      motif: <NorseIcon name="gallion-drage" size={96} className="text-viking-gold-soft" />,
      name: 'Viking',
      role: 'Flerspiller',
      desc: 'Bli med i lærerens spill med spillkoden fra storskjermen. Dere seiler i sanntid sammen med resten av klassen.',
      cta: 'Tast spillkode',
      material: 'tre',
      onSelect: () => { setRole('student'); navigate('/student'); },
    },
    {
      key: 'tor',
      motif: <ThorHammer size={88} color="#CDC3AD" />,
      name: 'Tor',
      role: 'Alene',
      desc: 'Seil på egen hånd, offline. Ingen kode, ingen lærer — bare reisen gjennom de tolv havnene, i ditt eget tempo.',
      cta: 'Sett seil alene',
      material: 'skinn',
      onSelect: () => { setRole('student'); playOffline(); navigate('/student'); },
    },
  ];

  return (
    <div className="viking-screen relative min-h-screen overflow-hidden text-viking-paper">
      {/* Yggdrasil forskjøvet mot høyre — bevisst usentrert bakteppe (samme språk som før). */}
      <div className="pointer-events-none absolute -right-24 top-1/2 -translate-y-1/2 opacity-[0.06]">
        <Yggdrasil size={760} />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-10 sm:px-10">
        {/* Tittel — venstrejustert med én ravn, som RoleSelect før. */}
        <div className="mb-1 flex items-end gap-4">
          <Raven size={52} facing="right" color="#CDC3AD" className="mb-2 hidden sm:block" />
          <h1 className="font-saga text-5xl font-black leading-[0.95] viking-engraved-large md:text-7xl">
            VIKINGENES<br />KULTURMØTER
          </h1>
        </div>
        <p className="mb-5 max-w-lg font-inter italic text-viking-gold-soft">
          Velg din ferd — tre veier inn i det samme havet
        </p>
        <RuneDivider className="mb-7 w-full max-w-md" />

        {/* Tre likeverdige spor — side om side på bred skjerm, stablet ned mot 360px. */}
        <div className="flex w-full flex-col gap-5 md:flex-row md:items-stretch">
          {cards.map((c) => (
            <button
              key={c.key}
              onClick={c.onSelect}
              aria-label={`${c.name} — ${c.role}`}
              data-testid={`start-${c.key}`}
              className={`mat mat-${c.material} viking-frame group flex flex-col items-center p-6 text-center transition-transform duration-150 hover:-translate-y-0.5 md:flex-1`}
            >
              <span className="flex h-24 items-center justify-center">{c.motif}</span>
              <h2 className="mt-4 font-saga text-4xl font-bold text-viking-gold viking-engraved">{c.name}</h2>
              <p className="mt-1 font-cinzel text-xs uppercase tracking-[0.3em] text-viking-gold-soft">{c.role}</p>
              <p className="mt-3 font-inter text-sm leading-relaxed text-viking-paper/90">{c.desc}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 font-cinzel text-sm text-viking-gold-soft group-hover:text-viking-gold">
                {c.cta} <Icon name="sail" size={14} />
              </span>
            </button>
          ))}
        </div>

        {/* Bunnlinje — venstrestilt, ikke sentrert vannmerke. */}
        <div className="mt-8 flex items-center gap-3 opacity-60">
          <Vegvisir size={44} color="#CDC3AD" />
          <p className="font-cinzel text-xs uppercase tracking-[0.3em] text-viking-gold-soft">Rolle lagres lokalt — klikk to ganger for å bytte</p>
        </div>
      </div>
    </div>
  );
}
