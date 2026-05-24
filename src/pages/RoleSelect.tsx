/**
 * RoleSelect.tsx
 * Startskjerm med rollevalg: Lærer eller Elev
 * 
 * Designet som vikingestetisk velg-side med to store knappar.
 * Lærerkjermen vises på delt storskjerm som alle ser → viktig å huske rollen.
 * localStorage lagrer valget slik at enheten husker rollen ved refresh.
 */

import { Navigate, useNavigate } from 'react-router-dom';
import { useRole } from '../hooks/useRole';

export default function RoleSelect() {
  const navigate = useNavigate();
  const { role, setRole } = useRole();

  // Hvis rolle er allerede valgt, gå direkte videre
  if (role === 'teacher') {
    return <Navigate to="/teacher" replace />;
  }
  if (role === 'student') {
    return <Navigate to="/student" replace />;
  }

  const handleTeacher = () => {
    setRole('teacher');
    navigate('/teacher');
  };

  const handleStudent = () => {
    setRole('student');
    navigate('/student');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-viking-darkblue to-viking-surface text-viking-paper flex flex-col items-center justify-center p-4">
      {/* Bakgrunns-dekorasjon: Runer */}
      <div className="absolute top-0 left-0 right-0 h-24 opacity-20 pointer-events-none text-4xl flex justify-around">
        <span>ᚦ</span>
        <span>ᚱ</span>
        <span>ᚦ</span>
        <span>ᚱ</span>
        <span>ᚦ</span>
      </div>

      {/* Tittel */}
      <div className="text-center mb-16 z-10">
        <h1 className="font-cinzel text-5xl md:text-6xl font-bold mb-4 text-viking-gold drop-shadow-lg">
          VIKINGENES<br />KULTURMØTER
        </h1>
        <p className="font-inter text-lg text-viking-gold-soft italic">
          Et klasseromsspill om handel, kultur og møter gjennom historie
        </p>
      </div>

      {/* Rollevalg-knapper */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl z-10">
        {/* LÆRER-KNAPP */}
        <button
          onClick={handleTeacher}
          className="group relative overflow-hidden rounded-lg bg-viking-rust border-4 border-viking-gold hover:border-viking-gold-soft transition-all duration-300 p-8 shadow-2xl hover:shadow-viking-gold/50 hover:scale-105 transform"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-viking-gold/10 to-transparent group-hover:from-viking-gold/20 group-hover:to-transparent transition-all"></div>
          <div className="relative">
            <div className="text-6xl mb-4">📜</div>
            <h2 className="font-cinzel text-3xl font-bold text-viking-paper mb-3">
              Lærer
            </h2>
            <p className="font-inter text-viking-paper/90 text-sm">
              Åpne spillmasterkonsollen. Se alle grupper, godkjenn oppgaver, og utløs Gudenes prøve.
            </p>
            <p className="font-inter text-viking-gold-soft text-xs mt-4 italic">
              ↳ Storskjerm: alle ser denne skjermen
            </p>
          </div>
        </button>

        {/* ELEV-KNAPP */}
        <button
          onClick={handleStudent}
          className="group relative overflow-hidden rounded-lg bg-viking-teal border-4 border-viking-gold hover:border-viking-gold-soft transition-all duration-300 p-8 shadow-2xl hover:shadow-viking-gold/50 hover:scale-105 transform"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-viking-gold/10 to-transparent group-hover:from-viking-gold/20 group-hover:to-transparent transition-all"></div>
          <div className="relative">
            <div className="text-6xl mb-4">⛵</div>
            <h2 className="font-cinzel text-3xl font-bold text-viking-paper mb-3">
              Elev
            </h2>
            <p className="font-inter text-viking-paper/90 text-sm">
              Velg skip, styr gjennom 12 destinasjoner, gjør oppgaver, og ta valg som påvirker historien.
            </p>
            <p className="font-inter text-viking-gold-soft text-xs mt-4 italic">
              ↳ Mobiltelefon/iPad: hver gruppe sin private skjerm
            </p>
          </div>
        </button>
      </div>

      {/* Utvikler-info (nederst, diskret) */}
      <div className="absolute bottom-4 right-4 text-xs text-viking-gold-soft/50 font-mono z-10">
        <p>Fase 1 — Rolle lagret i localStorage</p>
        <p>Klikk <span className="text-viking-gold-soft/75">to ganger</span> for å bytte rolle</p>
      </div>

      {/* Bakgrunns-dekorasjon: nedre runer */}
      <div className="absolute bottom-0 left-0 right-0 h-24 opacity-20 pointer-events-none text-4xl flex justify-around">
        <span>ᚾ</span>
        <span>ᛏ</span>
        <span>ᚾ</span>
        <span>ᛏ</span>
        <span>ᚾ</span>
      </div>
    </div>
  );
}
