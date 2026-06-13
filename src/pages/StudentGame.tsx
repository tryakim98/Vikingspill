/**
 * StudentGame.tsx
 * Elev-skjermen med multi-enhet-flyt:
 *  - Ingen økt           → JoinGame (tast kode eller spill offline).
 *  - Online uten gruppe  → GroupPicker (opprett ny eller bli med eksisterende).
 *  - Online, ny gruppe   → SetupFlow (chief rigger skipet, skriver til Firebase).
 *  - Online, eksisterende gruppe → GameDashboard (les setup fra Firebase).
 *  - Offline             → SetupFlow (lokal) → GameDashboard (lokal).
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '../hooks/useRole';
import { useSession } from '../hooks/useSession';
import { useGroupSetup } from '../hooks/useGroupSetup';
import JoinGame from '../components/session/JoinGame';
import GroupPicker from '../components/group/GroupPicker';
import SetupFlow from '../components/setup/SetupFlow';
import GameDashboard from '../components/dashboard/GameDashboard';
import LoadingScreen from '../components/common/LoadingScreen';
import MuteButton from '../components/common/MuteButton';
import { joinGroupAsMember, leaveGroupAsMember, subscribeGroup, writeGroup, type SyncedGroup } from '../lib/gameSync';

const SKILL_KEYS = ['språk', 'sjømannskap', 'krigskunst', 'diplomati', 'tro'] as const;

function newGroupId(): string {
  return 'g-' + Math.random().toString(36).slice(2, 8);
}

export default function StudentGame() {
  const navigate = useNavigate();
  const { clearRole } = useRole();
  const { session, loaded: sLoaded, join, setGroupId, playOffline, leave } = useSession();
  const { setup, loaded: gLoaded, saveSetup, clearSetup } = useGroupSetup();

  // Når vi er online med en valgt groupId, sjekker vi om Firebase-gruppa
  // allerede har et setup (= eksisterende gruppe vi har blitt med i).
  // null = ennå ikke avgjort. undefined = ingen gruppe i Firebase ennå (ny).
  const [remoteGroup, setRemoteGroup] = useState<SyncedGroup | null | undefined>(undefined);

  useEffect(() => {
    if (!session || session.mode !== 'online' || !session.groupId) {
      setRemoteGroup(undefined);
      return;
    }
    const unsub = subscribeGroup(session.gameCode, session.groupId, (g) => setRemoteGroup(g));
    return () => unsub();
  }, [session]);

  if (!sLoaded || !gLoaded) return <LoadingScreen />;

  const handleSwitchRole = () => {
    clearRole();
    navigate('/', { replace: true });
  };

  // 1) Ingen økt → JoinGame
  if (!session) {
    return <JoinGame onJoin={join} onOffline={playOffline} onSwitchRole={handleSwitchRole} />;
  }

  // 2) Online uten valgt gruppe → GroupPicker
  if (session.mode === 'online' && !session.groupId) {
    return (
      <GroupPicker
        gameCode={session.gameCode}
        myMemberId={session.memberId}
        onCreateNew={() => setGroupId(newGroupId())}
        onJoinExisting={async (groupId) => {
          await joinGroupAsMember(session.gameCode, groupId, session.memberId).catch(() => {});
          setGroupId(groupId);
        }}
        onLeave={leave}
      />
    );
  }

  // 3) Online + groupId men ingen Firebase-gruppe ennå → SetupFlow (chief rigger)
  if (session.mode === 'online' && session.groupId && remoteGroup === null) {
    return (
      <SetupFlow
        onComplete={async (s) => {
          if (!session.groupId) return;
          // Seed gruppen i Firebase med alle felt — denne enheten blir høvding.
          await writeGroup(session.gameCode, session.groupId, {
            shipName: s.shipName,
            shipSymbol: s.shipSymbol,
            shipColor: s.shipColor,
            startSkill: s.startSkill,
            scores: { culturalUnderstanding: 0, tradeGain: 0, reputation: 0 },
            skills: Object.fromEntries(SKILL_KEYS.map((k) => [k, k === s.startSkill ? 1 : 0])) as SyncedGroup['skills'],
            visited: [],
            locked: [],
            updatedAt: Date.now(),
            chiefId: session.memberId,
            members: { [session.memberId]: { joinedAt: Date.now() } },
          }).catch(() => {});
          // Beholder lokal kopi for offline-fallback under sesjonen
          saveSetup(s);
        }}
      />
    );
  }

  // 4) Online + eksisterende gruppe i Firebase → Dashboard
  if (session.mode === 'online' && session.groupId && remoteGroup) {
    // Sørg for å være registrert som medlem (idempotent)
    return (
      <>
        <GameDashboard
          setup={{
            shipName: remoteGroup.shipName,
            shipSymbol: remoteGroup.shipSymbol as 'drage' | 'ulv' | 'ravn',
            shipColor: remoteGroup.shipColor,
            startSkill: remoteGroup.startSkill,
          }}
          session={session}
          onResetSetup={clearSetup}
          onLeaveGame={async () => {
            if (session.groupId) await leaveGroupAsMember(session.gameCode, session.groupId, session.memberId).catch(() => {});
            leave();
          }}
          onSwitchRole={handleSwitchRole}
        />
        <MuteButton />
      </>
    );
  }

  // 5) Offline-flyt (uendret): localStorage-basert
  if (session.mode === 'offline') {
    if (!setup) return <SetupFlow onComplete={saveSetup} />;
    return (
      <>
        <GameDashboard
          setup={setup}
          session={session}
          onResetSetup={clearSetup}
          onLeaveGame={leave}
          onSwitchRole={handleSwitchRole}
        />
        <MuteButton />
      </>
    );
  }

  // Online, fortsatt å undersøke Firebase
  return <LoadingScreen text="Forbereder skipets logg …" />;
}
