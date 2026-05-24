/**
 * StudentGame.tsx
 * Elev-skjermen. Fase 1+2:
 *  - Ingen økt → JoinGame (tast spillkode, eller spill offline).
 *  - Økt, men ingen gruppe → SetupFlow (§9.1).
 *  - Gruppe klar → GameDashboard (med encounter-flyt + sanntidssync når online).
 */

import { useNavigate } from 'react-router-dom';
import { useRole } from '../hooks/useRole';
import { useSession } from '../hooks/useSession';
import { useGroupSetup } from '../hooks/useGroupSetup';
import JoinGame from '../components/session/JoinGame';
import SetupFlow from '../components/setup/SetupFlow';
import GameDashboard from '../components/dashboard/GameDashboard';

export default function StudentGame() {
  const navigate = useNavigate();
  const { clearRole } = useRole();
  const { session, loaded: sLoaded, join, playOffline, leave } = useSession();
  const { setup, loaded: gLoaded, saveSetup, clearSetup } = useGroupSetup();

  // Unngå flimmer mens localStorage leses
  if (!sLoaded || !gLoaded) return null;

  if (!session) {
    return <JoinGame onJoin={join} onOffline={playOffline} />;
  }

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
      session={session}
      onResetSetup={clearSetup}
      onLeaveGame={leave}
      onSwitchRole={handleSwitchRole}
    />
  );
}
