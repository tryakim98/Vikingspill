/**
 * StudentGame.tsx
 * Elev-skjermen. Fase 1:
 *  - Ingen gruppe lagret → kjør gruppeoppsettet (SetupFlow, §9.1).
 *  - Gruppe lagret → vis en dashboard-plassholder (kart/stats/logg kommer i neste steg).
 * Valget huskes i localStorage via useGroupSetup.
 */

import { useNavigate } from 'react-router-dom';
import { useRole } from '../hooks/useRole';
import { useGroupSetup } from '../hooks/useGroupSetup';
import { skillTreeData } from '../data';
import VikingShip from '../components/ship/VikingShip';
import SetupFlow from '../components/setup/SetupFlow';

const SYMBOL_LABEL: Record<string, string> = { drage: '🐉 Drage', ulv: '🐺 Ulv', ravn: '🐦‍⬛ Ravn' };

export default function StudentGame() {
  const navigate = useNavigate();
  const { clearRole } = useRole();
  const { setup, loaded, saveSetup, clearSetup } = useGroupSetup();

  // Unngå flimmer mens localStorage leses
  if (!loaded) return null;

  // Gruppe ikke satt opp ennå → kjør oppsettsflyten
  if (!setup) {
    return <SetupFlow onComplete={saveSetup} />;
  }

  const handleSwitchRole = () => {
    clearRole();
    navigate('/', { replace: true });
  };

  // Gruppe klar → dashboard-plassholder
  return (
    <div className="min-h-screen bg-gradient-to-b from-viking-darkblue to-viking-surface text-viking-paper p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center gap-4 border-b-4 border-viking-gold pb-6">
          <VikingShip color={setup.shipColor} symbol={setup.shipSymbol} size={110} />
          <div>
            <h1 className="font-cinzel text-3xl text-viking-gold">{setup.shipName}</h1>
            <p className="font-inter text-viking-gold-soft">
              {SYMBOL_LABEL[setup.shipSymbol]} · Startferdighet: {skillTreeData[setup.startSkill].icon} {skillTreeData[setup.startSkill].name}
            </p>
          </div>
        </div>

        <div className="mb-8 rounded-lg border-2 border-viking-gold bg-viking-surface p-8">
          <h2 className="mb-4 font-cinzel text-2xl text-viking-gold">Neste steg: Dashbordet</h2>
          <ul className="list-inside list-disc space-y-3 font-inter text-viking-paper/90">
            <li><strong>Kart:</strong> Seil mellom de 12 destinasjonene</li>
            <li><strong>Stats:</strong> Kulturforståelse, handelsutbytte og rykte</li>
            <li><strong>Logg:</strong> Valgene og terningkastene deres</li>
            <li><strong>Encounter-flyt:</strong> Historie → kulturmøte → oppgave → quiz → valg → terning</li>
          </ul>
        </div>

        <div className="rounded-lg border-2 border-viking-plum/60 bg-viking-plum/15 p-6">
          <h3 className="mb-4 font-cinzel text-lg text-viking-plum">👨‍💻 Utvikler-modus</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={clearSetup}
              className="rounded border-2 border-viking-gold bg-viking-teal px-5 py-2 font-bold text-viking-paper transition-colors hover:bg-viking-teal/80"
            >
              Start oppsett på nytt
            </button>
            <button
              onClick={handleSwitchRole}
              className="rounded border-2 border-viking-gold bg-viking-plum px-5 py-2 font-bold text-viking-paper transition-colors hover:bg-viking-plum/80"
            >
              Bytt rolle
            </button>
          </div>
          <p className="mt-4 font-mono text-sm text-viking-gold-soft">
            localStorage: vikingspill_role='student', vikingspill_group=&#123;…&#125;
          </p>
        </div>
      </div>
    </div>
  );
}
