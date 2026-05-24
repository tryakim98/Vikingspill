/**
 * StudentGame.tsx
 * Elev-skjermen. Fase 1:
 *  - Ingen gruppe lagret → kjør gruppeoppsettet (SetupFlow, §9.1).
 *  - Gruppe lagret → vis dashbordet med encounter-flyten (GameDashboard).
 */

import { useNavigate } from 'react-router-dom';
import { useRole } from '../hooks/useRole';
import { useGroupSetup } from '../hooks/useGroupSetup';
import SetupFlow from '../components/setup/SetupFlow';
import GameDashboard from '../components/dashboard/GameDashboard';

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

  return (
    <GameDashboard
      setup={setup}
      onResetSetup={clearSetup}
      onSwitchRole={handleSwitchRole}
    />
  );
}
