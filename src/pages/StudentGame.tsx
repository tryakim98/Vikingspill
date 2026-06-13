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
import RulesScreen from '../components/rules/RulesScreen';
import HelpButton from '../components/rules/HelpButton';
import { joinGroupAsMember, leaveGroupAsMember, subscribeGroup, writeGroup, type SyncedGroup } from '../lib/gameSync';

const RULES_KEY = 'vikingspill_rules_seen_student';

const SKILL_KEYS = ['språk', 'sjømannskap', 'krigskunst', 'diplomati', 'tro'] as const;

function newGroupId(): string {
  return 'g-' + Math.random().toString(36).slice(2, 8);
}

export default function StudentGame() {
  const navigate = useNavigate();
  const { clearRole } = useRole();
  const { session, loaded: sLoaded, join, setGroupId, playOffline, leave } = useSession();
  const { setup, loaded: gLoaded, saveSetup, clearSetup } = useGroupSetup();

  const [showRules, setShowRules] = useState(() => {
    try { return !localStorage.getItem(RULES_KEY); } catch { return true; }
  });
  const dismissRules = () => {
    try { localStorage.setItem(RULES_KEY, '1'); } catch { /* ignore */ }
    setShowRules(false);
  };

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
  if (showRules) return <RulesScreen role="student" onDone={dismissRules} />;

  const handleSwitchRole = () => {
    clearRole();
    navigate('/', { replace: true });
  };

  let content: import('react').ReactNode;

  if (!session) {
    content = <JoinGame onJoin={join} onOffline={playOffline} onSwitchRole={handleSwitchRole} />;
  } else if (session.mode === 'online' && !session.groupId) {
    content = (
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
  } else if (session.mode === 'online' && session.groupId && remoteGroup === null) {
    content = (
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
          saveSetup(s);
        }}
      />
    );
  } else if (session.mode === 'online' && session.groupId && remoteGroup) {
    content = (
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
    );
  } else if (session.mode === 'offline') {
    if (!setup) {
      content = <SetupFlow onComplete={saveSetup} />;
    } else {
      content = (
        <GameDashboard
          setup={setup}
          session={session}
          onResetSetup={clearSetup}
          onLeaveGame={leave}
          onSwitchRole={handleSwitchRole}
        />
      );
    }
  } else {
    content = <LoadingScreen text="Forbereder skipets logg …" />;
  }

  return (
    <>
      {content}
      <HelpButton onClick={() => setShowRules(true)} className="fixed right-4 top-4 z-[70]" />
      <MuteButton />
    </>
  );
}
