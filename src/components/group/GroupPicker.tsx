/**
 * GroupPicker.tsx
 * Etter at eleven har koblet til spillkoden, velger de gruppe: enten opprett en ny
 * gruppe (blir første medlem → automatisk høvding) eller bli med i en eksisterende
 * gruppe på en annen enhet. Flere enheter kan dele samme gruppe.
 */

import { useEffect, useState } from 'react';
import { subscribeGroups, type SyncedGroup } from '../../lib/gameSync';
import VikingShip from '../ship/VikingShip';
import type { ShipSymbol } from '../../types';

interface Props {
  gameCode: string;
  myMemberId: string;
  onCreateNew: () => void;
  onJoinExisting: (groupId: string) => void;
  onLeave: () => void;
}

export default function GroupPicker({ gameCode, myMemberId, onCreateNew, onJoinExisting, onLeave }: Props) {
  const [groups, setGroups] = useState<Record<string, SyncedGroup>>({});

  useEffect(() => {
    const unsub = subscribeGroups(gameCode, setGroups);
    return () => unsub();
  }, [gameCode]);

  const entries = Object.entries(groups);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center viking-screen px-4 py-8 text-viking-paper">
      <div className="w-full max-w-md space-y-5">
        <div className="text-center">
          <h1 className="font-saga text-3xl viking-engraved-large sm:text-5xl">Velg skip</h1>
          <p className="mt-2 font-inter italic text-viking-gold-soft">Bli med i en eksisterende gruppe, eller opprett en ny.</p>
          <p className="mt-1 font-mono text-xs text-viking-gold-soft/70">Spillkode: {gameCode}</p>
        </div>

        {/* Eksisterende grupper */}
        <section className="rounded-lg border-2 border-viking-gold/40 bg-viking-surface p-4" data-testid="existing-groups">
          <h2 className="mb-3 font-cinzel text-lg text-viking-gold">Eksisterende skip</h2>
          {entries.length === 0 ? (
            <p className="font-inter text-sm italic text-viking-paper/60">Ingen skip har lagt fra land ennå.</p>
          ) : (
            <ul className="space-y-2">
              {entries.map(([id, g]) => {
                const memberCount = g.members ? Object.keys(g.members).length : 0;
                const iAmAlreadyMember = !!g.members?.[myMemberId];
                return (
                  <li key={id} className="flex items-center gap-3 rounded-md border border-viking-gold/30 bg-viking-darkblue/40 p-3">
                    <VikingShip color={g.shipColor} symbol={g.shipSymbol as ShipSymbol} size={40} />
                    <div className="flex-1">
                      <p className="font-cinzel text-viking-paper">{g.shipName}</p>
                      <p className="font-mono text-xs text-viking-gold-soft/80">{memberCount} ombord{iAmAlreadyMember ? ' · du er allerede med' : ''}</p>
                    </div>
                    <button
                      onClick={() => onJoinExisting(id)}
                      data-testid={`join-group-${id}`}
                      className="rounded border-2 border-viking-gold/60 px-3 py-1 font-cinzel text-sm text-viking-gold-soft hover:border-viking-gold hover:text-viking-gold"
                    >
                      {iAmAlreadyMember ? 'Fortsett' : 'Bli med'}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Nytt skip */}
        <section className="rounded-lg border-2 border-viking-gold bg-viking-surface p-4">
          <h2 className="mb-2 font-cinzel text-lg text-viking-gold">Opprett nytt skip</h2>
          <p className="mb-3 font-inter text-sm text-viking-paper/80">Du blir første medlem og høvding. Andre kan bli med senere med samme spillkode.</p>
          <button
            onClick={onCreateNew}
            data-testid="create-new-group"
            className="w-full rounded-md border-2 border-viking-gold bg-viking-gold px-6 py-2.5 font-saga font-bold text-viking-darkblue hover:bg-viking-gold-soft"
          >
            ⛵ Rigg et nytt skip
          </button>
        </section>

        <div className="text-center">
          <button onClick={onLeave} className="font-inter text-xs text-viking-gold-soft/60 hover:text-viking-gold-soft">← Forlat spillet</button>
        </div>
      </div>
    </div>
  );
}
