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
    <div className="relative min-h-screen overflow-hidden bg-viking-coal text-viking-paper">
      {/* Bakgrunn — dyp gradient + Yggdrasil sentralt */}
      <div className="absolute inset-0 bg-gradient-to-b from-viking-coal via-viking-darkblue to-viking-surface" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.07]">
        <Yggdrasil size={780} />
      </div>

      {/* Stjernepunkter */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 60 }).map((_, i) => {
          const x = (i * 137) % 100;
          const y = (i * 91) % 100;
          const s = (i % 3) + 1;
          return <div key={i} className="absolute rounded-full bg-viking-gold-soft opacity-30" style={{ left: `${x}%`, top: `${y}%`, width: s, height: s }} />;
        })}
      </div>

      {/* Runebånd øverst */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-around py-4 font-cinzel text-3xl text-viking-gold opacity-25" style={{ letterSpacing: '0.5em' }}>
        <span>ᚦ</span><span>ᚱ</span><span>ᚾ</span><span>ᛏ</span><span>ᛚ</span><span>ᛟ</span><span>ᚱ</span><span>ᚦ</span>
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        {/* Tittel med ravner som flankerer */}
        <div className="mb-3 flex items-center gap-6 sm:gap-10">
          <Raven size={64} facing="right" color="#D4A843" className="-mt-4 hidden sm:block" />
          <div className="text-center">
            <h1 className="font-saga text-5xl font-black leading-tight viking-engraved-large md:text-7xl">
              VIKINGENES<br/>KULTURMØTER
            </h1>
            <p className="mt-3 font-cinzel text-sm uppercase tracking-[0.4em] text-viking-gold-soft">
              ᚦ ᚱ ᚾ ᛏ
            </p>
          </div>
          <Raven size={64} facing="left" color="#D4A843" className="-mt-4 hidden sm:block" />
        </div>

        <p className="mb-2 max-w-xl text-center font-inter italic text-viking-gold-soft md:text-lg">
          Et klasseromsspill om handel, kultur og møter gjennom historien
        </p>

        <RuneDivider className="mb-8 mt-4 w-full max-w-2xl" />

        {/* Rollevalg */}
        <div className="grid w-full max-w-3xl grid-cols-1 gap-8 md:grid-cols-2">

          {/* TOR — lærer */}
          <button
            onClick={handleTeacher}
            className="viking-card-wood group relative overflow-hidden rounded-lg p-8 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-viking-gold/30"
          >
            {/* Gylne hjørner */}
            <CornerOrnaments />
            <div className="relative">
              <div className="mb-4 flex items-center gap-4">
                <ThorHammer size={56} color="#D4A843" />
                <h2 className="font-saga text-3xl font-bold text-viking-gold md:text-4xl viking-engraved">
                  Jeg er Tor ⚡
                </h2>
              </div>
              <p className="font-inter text-viking-paper/90">
                Våk over flåten fra Åsgard. Følg med på de dødelige vikingenes ferd, gi din velsignelse, og slipp Skjebnehjulet løs når tiden er moden.
              </p>
              <p className="mt-4 font-cinzel text-xs italic text-viking-gold-soft">
                ↳ Tors utsyn over Midgard — vises på storskjermen
              </p>
              <KnotBorder width={240} height={20} className="mt-5 opacity-70" />
            </div>
          </button>

          {/* VIKING — elev */}
          <button
            onClick={handleStudent}
            className="viking-card-leather group relative overflow-hidden rounded-lg p-8 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-viking-gold/30"
          >
            <CornerOrnaments />
            <div className="relative">
              <div className="mb-4 flex items-center gap-4">
                <DragonHead size={64} color="#D4A843" facing="right" />
                <h2 className="font-saga text-3xl font-bold text-viking-gold md:text-4xl viking-engraved">
                  Jeg er viking
                </h2>
              </div>
              <p className="font-inter text-viking-paper/90">
                Bli én av Midgards dødelige sjøfarere. Velg skip, styr gjennom 12 land, og håp at Tor våker over dere.
              </p>
              <p className="mt-4 font-cinzel text-xs italic text-viking-gold-soft">
                ↳ Mobiltelefon/iPad: hver gruppe sin private skjerm
              </p>
              <KnotBorder width={240} height={20} className="mt-5 opacity-70" />
            </div>
          </button>
        </div>

        {/* Vegvisir-vannmerke nederst */}
        <div className="mt-12 flex items-center gap-6 opacity-60">
          <Vegvisir size={56} color="#D4A843" />
          <p className="font-cinzel text-xs uppercase tracking-[0.3em] text-viking-gold-soft">
            Velg din ferd
          </p>
          <Vegvisir size={56} color="#D4A843" />
        </div>

        <p className="mt-4 font-mono text-[10px] text-viking-gold-soft/50">
          Rolle lagres lokalt — klikk to ganger for å bytte
        </p>
      </div>

      {/* Runebånd nederst */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-around py-4 font-cinzel text-3xl text-viking-gold opacity-25" style={{ letterSpacing: '0.5em' }}>
        <span>ᚷ</span><span>ᚹ</span><span>ᛟ</span><span>ᛚ</span><span>ᛏ</span><span>ᚾ</span><span>ᚱ</span><span>ᚦ</span>
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
      <path d="M 2 2 L 26 2 L 26 6 L 6 6 L 6 26 L 2 26 Z" fill="#D4A843" />
      <circle cx="2" cy="2" r="3" fill="#D4A843" />
      <circle cx="2" cy="2" r="1.5" fill="#3a1f0d" />
    </svg>
  );
}
