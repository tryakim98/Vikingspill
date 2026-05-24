/**
 * TeacherPanel.tsx
 * Lærerskjermen — Game Master-konsoll
 * 
 * FASE 1: Plassholder som viser at vi er i lærermodus
 * FASE 2+: Skal vise kart med skip, leaderboard, godkjenning, Gudenes prøve-knapp
 */

import { useRole } from '../hooks/useRole';
import { useNavigate } from 'react-router-dom';

export default function TeacherPanel() {
  const navigate = useNavigate();
  const { clearRole } = useRole();

  const handleSwitchRole = () => {
    clearRole();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-viking-darkblue text-viking-paper p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="border-b-4 border-viking-gold pb-6 mb-8">
          <h1 className="font-cinzel text-4xl text-viking-gold mb-2">📜 SPILLMASTERKONSOLL</h1>
          <p className="text-viking-gold-soft italic">Fase 1: Placeholder</p>
        </div>

        {/* Innhold */}
        <div className="bg-viking-surface border-2 border-viking-gold rounded-lg p-8 mb-8">
          <h2 className="font-cinzel text-2xl text-viking-gold mb-4">Fase 2 − kommer snart</h2>
          <ul className="font-inter text-viking-paper/90 space-y-3 list-disc list-inside">
            <li><strong>Vikingkart:</strong> Se alle grupper seile animert</li>
            <li><strong>Leaderboard:</strong> Sanntids rangering</li>
            <li><strong>Godkjenning:</strong> Approver oppgaver med en knapp</li>
            <li><strong>Gudenes prøve:</strong> Utløs tilfeldige konkurrancer for alle</li>
            <li><strong>Tidevannstimer:</strong> Styr tiden per kapittel</li>
          </ul>
        </div>

        {/* Info-boks */}
        <div className="bg-viking-teal/30 border-2 border-viking-teal rounded-lg p-6 mb-8">
          <h3 className="font-cinzel text-lg text-viking-gold mb-3">Om lærerskjermen</h3>
          <p className="font-inter text-viking-paper/90 mb-4">
            Denne skjermen vises typisk på en <strong>delt storskjerm/projektor</strong> som alle elevene ser.
          </p>
          <p className="font-inter text-viking-paper/90">
            For å unngå at enheten ved et uhell bytter til elevmodus, er rollen lagret i <code className="bg-viking-darkblue px-2 py-1 rounded">localStorage</code>.
            Du kan bytte rolle nedenfor (utvikler-modus).
          </p>
        </div>

        {/* Utvikler-seksjonen */}
        <div className="bg-viking-rust/20 border-2 border-viking-rust rounded-lg p-6">
          <h3 className="font-cinzel text-lg text-viking-rust mb-4">👨‍💻 Utvikler-modus</h3>
          <button
            onClick={handleSwitchRole}
            className="bg-viking-rust hover:bg-viking-crimson text-viking-paper font-bold py-2 px-6 rounded border-2 border-viking-gold transition-colors"
          >
            Bytt rolle (gå tilbake til rollevalg)
          </button>
          <p className="font-mono text-sm text-viking-gold-soft mt-4">
            localStorage.getItem('vikingspill_role') = 'teacher'
          </p>
        </div>
      </div>
    </div>
  );
}
