/**
 * StudentGame.tsx
 * Elev-skjermen — hvor elevene spiller
 * 
 * FASE 1: Setup-modus med skip-valg (kommer i neste steg)
 * Viser foreløpig bare en plassholder
 */

import { useRole } from '../hooks/useRole';
import { useNavigate } from 'react-router-dom';

export default function StudentGame() {
  const navigate = useNavigate();
  const { clearRole } = useRole();

  const handleSwitchRole = () => {
    clearRole();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-viking-darkblue to-viking-surface text-viking-paper p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-cinzel text-4xl text-viking-gold mb-2">⛵ ELEVSPILLET</h1>
          <p className="text-viking-gold-soft italic">Fase 1: Setup og skip-valg kommer neste</p>
        </div>

        {/* Innhold */}
        <div className="bg-viking-surface border-2 border-viking-gold rounded-lg p-8 mb-8">
          <h2 className="font-cinzel text-2xl text-viking-gold mb-4">Neste steg: Setup-flyten</h2>
          <ul className="font-inter text-viking-paper/90 space-y-3 list-disc list-inside">
            <li><strong>Angi spillkode:</strong> Koble til samme spill som læreren (fase 2)</li>
            <li><strong>Skip-valg:</strong> Klikk på vikingskip som gynger på bølger</li>
            <li><strong>Gruppe-info:</strong> Gi skip navn, velg symbol (drage/ulv/ravn) og farge</li>
            <li><strong>Startferdighet:</strong> Velg første ferdighet (språk/sjømannskap/krigskunst/diplomati/tro)</li>
            <li><strong>Dashboard:</strong> Se stats, kart, og logg</li>
          </ul>
        </div>

        {/* Feature-liste */}
        <div className="bg-viking-teal/30 border-2 border-viking-teal rounded-lg p-6 mb-8">
          <h3 className="font-cinzel text-lg text-viking-gold mb-3">Spillmekanikk (kommer senere)</h3>
          <div className="grid grid-cols-2 gap-4 font-inter text-viking-paper/90 text-sm">
            <div>✓ 12 destinasjoner</div>
            <div>✓ Episke kulturmøter</div>
            <div>✓ Oppgaver (foto/innspilling/nav)</div>
            <div>✓ Quiz & terningkast</div>
            <div>✓ Valg med konsekvenser</div>
            <div>✓ Ferdighetstre (5 grener)</div>
          </div>
        </div>

        {/* Utvikler-seksjonen */}
        <div className="bg-viking-plum/20 border-2 border-viking-plum rounded-lg p-6">
          <h3 className="font-cinzel text-lg text-viking-plum mb-4">👨‍💻 Utvikler-modus</h3>
          <button
            onClick={handleSwitchRole}
            className="bg-viking-plum hover:bg-viking-plum/90 text-viking-paper font-bold py-2 px-6 rounded border-2 border-viking-gold transition-colors"
          >
            Bytt rolle (gå tilbake til rollevalg)
          </button>
          <p className="font-mono text-sm text-viking-gold-soft mt-4">
            localStorage.getItem('vikingspill_role') = 'student'
          </p>
        </div>
      </div>
    </div>
  );
}
