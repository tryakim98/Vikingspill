/**
 * RoleSelect.tsx
 * Startskjerm med rollevalg: Tor (lærer) eller viking (elev).
 *
 * Designet rammes inn av norrøn mytologi:
 *   - Yggdrasil bak tittelen (verdenstreet bærer scenen)
 *   - Ravnene Hugin & Munin flankerer tittelen
 *   - Mjølner på Tor-knappen, dragehode på viking-knappen
 *   - Runebånd som divider, knutemønster langs panelene
 */

import { Navigate, useNavigate } from 'react-router-dom';
import { useRole } from '../hooks/useRole';
import { Yggdrasil, Raven, ThorHammer, DragonHead, RuneDivider, KnotBorder, Vegvisir } from '../components/decor';

export default function RoleSelect() {
  const navigate = useNavigate();
  const { role, setRole } = useRole();

  if (role === 'teacher') return <Navigate to="/teacher" replace />;
  if (role === 'student') return <Navigate to="/student" replace />;

  const handleTeacher = () => { setRole('teacher'); navigate('/teacher'); };
  const handleStudent = () => { setRole('student'); navigate('/student'); };

  return (
    <div className="viking-screen relative min-h-screen overflow-hidden text-viking-paper">
      {/* Yggdrasil forskjøvet mot høyre — bevisst usentrert (asymmetri) */}
      <div className="pointer-events-none absolute -right-24 top-1/2 -translate-y-1/2 opacity-[0.06]">
        <Yggdrasil size={760} />
      </div>
      {/* Ett runebånd langs venstre kant — vertikalt, ikke symmetrisk topp/bunn */}
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden flex-col justify-center gap-6 pl-3 font-cinzel text-2xl text-viking-gold/20 sm:flex" style={{ letterSpacing: '0.3em' }}>
        <span>ᚦ</span><span>ᚱ</span><span>ᚾ</span><span>ᛏ</span><span>ᛚ</span><span>ᛟ</span><span>ᚱ</span>
      </div>

      {/* Venstrestilt innhold, strammere luft */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6 py-10 sm:px-10">
        {/* Tittel — venstrejustert, med én ravn (ikke flankerende par) */}
        <div className="mb-1 flex items-end gap-4">
          <Raven size={52} facing="right" color="#A8862F" className="mb-2 hidden sm:block" />
          <h1 className="font-saga text-5xl font-black leading-[0.95] viking-engraved-large md:text-7xl">
            VIKINGENES<br/>KULTURMØTER
          </h1>
        </div>
        <p className="mb-5 max-w-lg font-inter italic text-viking-gold-soft">
          Et klasseromsspill om handel, kultur og møter gjennom historien
        </p>
        <RuneDivider className="mb-7 w-full max-w-md" />

        {/* Rollevalg — likeverdige kort: samme bredde (flex-1) og høyde (items-stretch), side ved side */}
        <div className="flex w-full flex-col gap-5 md:flex-row md:items-stretch">

          {/* TOR — lærer */}
          <button
            onClick={handleTeacher}
            className="viking-card-wood group relative overflow-hidden p-7 text-left transition-transform duration-150 hover:-translate-y-0.5 md:flex-1"
          >
            <CornerOrnaments />
            <div className="relative">
              <div className="mb-3 flex items-center gap-4">
                <ThorHammer size={56} color="#A8862F" />
                <h2 className="font-saga text-3xl font-bold text-viking-gold md:text-4xl viking-engraved">
                  Jeg er Tor ⚡
                </h2>
              </div>
              <p className="max-w-md font-inter text-viking-paper/90">
                Våk over flåten fra Åsgard. Følg med på de dødelige vikingenes ferd, gi din velsignelse, og slipp Skjebnehjulet løs når tiden er moden.
              </p>
              <p className="mt-3 font-cinzel text-xs italic text-viking-gold-soft">
                ↳ Tors utsyn over Midgard — vises på storskjermen
              </p>
              <KnotBorder width={240} height={20} className="mt-5 opacity-60" />
            </div>
          </button>

          {/* VIKING — elev */}
          <button
            onClick={handleStudent}
            className="viking-card-leather group relative overflow-hidden p-7 text-left transition-transform duration-150 hover:-translate-y-0.5 md:flex-1"
          >
            <CornerOrnaments />
            <div className="relative">
              <div className="mb-3 flex items-center gap-4">
                <DragonHead size={56} color="#A8862F" facing="right" />
                <h2 className="font-saga text-3xl font-bold text-viking-gold md:text-4xl viking-engraved">
                  Jeg er viking
                </h2>
              </div>
              <p className="max-w-md font-inter text-viking-paper/90">
                Bli én av Midgards dødelige sjøfarere. Velg skip, styr gjennom 12 land, og håp at Tor våker over dere.
              </p>
              <p className="mt-3 font-cinzel text-xs italic text-viking-gold-soft">
                ↳ Mobil/iPad: hver gruppe sin private skjerm
              </p>
              <KnotBorder width={240} height={20} className="mt-5 opacity-60" />
            </div>
          </button>
        </div>

        {/* Bunnlinje — venstrestilt, ikke sentrert vannmerke */}
        <div className="mt-8 flex items-center gap-3 opacity-60">
          <Vegvisir size={44} color="#A8862F" />
          <p className="font-cinzel text-xs uppercase tracking-[0.3em] text-viking-gold-soft">Velg din ferd</p>
        </div>
        <p className="mt-3 font-mono text-[10px] text-viking-gold-soft/50">
          Rolle lagres lokalt — klikk to ganger for å bytte
        </p>
      </div>
    </div>
  );
}

/** Fire gullhjørner — gir paneler et håndsmidd preg. */
function CornerOrnaments() {
  return (
    <>
      <Corner pos="tl" />
      <Corner pos="tr" />
      <Corner pos="bl" />
      <Corner pos="br" />
    </>
  );
}
function Corner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const cls =
    pos === 'tl' ? 'top-2 left-2' :
    pos === 'tr' ? 'top-2 right-2 scale-x-[-1]' :
    pos === 'bl' ? 'bottom-2 left-2 scale-y-[-1]' :
                   'bottom-2 right-2 scale-x-[-1] scale-y-[-1]';
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" className={`pointer-events-none absolute ${cls}`} aria-hidden="true">
      <path d="M 2 2 L 26 2 L 26 6 L 6 6 L 6 26 L 2 26 Z" fill="#9C8138" />
      <circle cx="2" cy="2" r="3" fill="#9C8138" />
      <circle cx="2" cy="2" r="1.5" fill="#3a1f0d" />
    </svg>
  );
}
