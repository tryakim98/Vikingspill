/**
 * SeaBattle.tsx
 * Sjøslag — «Holmgang på bølgene» (§7.2). To-sidig forkjemper-duell:
 *   A utfordrer B → B aksepterer/avslår → tilfeldig duell-aktivitet → vinner rapporteres.
 *   Utfall: vinner +3 handel, taper −2 handel, begge −1 rykte.
 * Hver gruppe anvender sitt eget utfall én gang (de-dupes via localStorage).
 * Ferdighetsnivå i aktivitetens ferdighet vises som forkjemperens fordel.
 */

import { useEffect, useRef, useState } from 'react';
import type { SkillKey } from '../../types';
import { skillTreeData, holmgangDueller } from '../../data';
import { subscribeGroups, subscribeDuels, createDuel, updateDuel, type SyncedGroup, type Duel } from '../../lib/gameSync';

const APPLIED_KEY = 'vikingspill_applied_duels';

interface Props {
  code: string;
  myGroupId: string;
  myShipName: string;
  mySkills: Record<SkillKey, number>;
  onResult: (delta: { und: number; trade: number; rep: number }) => void;
}

export default function SeaBattle({ code, myGroupId, myShipName, mySkills, onResult }: Props) {
  const [groups, setGroups] = useState<Record<string, SyncedGroup>>({});
  const [duels, setDuels] = useState<Record<string, Duel>>({});
  const applied = useRef<Set<string>>(new Set());

  useEffect(() => {
    try { applied.current = new Set(JSON.parse(localStorage.getItem(APPLIED_KEY) || '[]')); } catch { /* */ }
    const u1 = subscribeGroups(code, setGroups);
    const u2 = subscribeDuels(code, setDuels);
    return () => { u1(); u2(); };
  }, [code]);

  // Anvend utfall når en duell er avgjort (én gang per gruppe).
  useEffect(() => {
    for (const [id, d] of Object.entries(duels)) {
      if (d.status !== 'resolved') continue;
      if (d.challengerId !== myGroupId && d.defenderId !== myGroupId) continue;
      if (applied.current.has(id)) continue;
      applied.current.add(id);
      localStorage.setItem(APPLIED_KEY, JSON.stringify([...applied.current]));
      onResult({ und: 0, trade: d.winnerId === myGroupId ? 3 : -2, rep: -1 });
    }
  }, [duels]); // eslint-disable-line react-hooks/exhaustive-deps

  const challenge = (defenderId: string, defenderName: string) => {
    const a = holmgangDueller[Math.floor(Math.random() * holmgangDueller.length)];
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    createDuel(code, {
      id, challengerId: myGroupId, challengerName: myShipName,
      defenderId, defenderName, activity: a, status: 'pending', at: Date.now(),
    }).catch(() => {});
  };

  const opponents = Object.entries(groups).filter(([id]) => id !== myGroupId);
  const incoming = Object.entries(duels).filter(([, d]) => d.defenderId === myGroupId && d.status === 'pending');
  const active = Object.entries(duels).filter(([, d]) => (d.challengerId === myGroupId || d.defenderId === myGroupId) && d.status === 'active');
  const pendingOut = Object.entries(duels).filter(([, d]) => d.challengerId === myGroupId && d.status === 'pending');

  return (
    <div className="rounded-lg border-2 border-viking-crimson/50 bg-viking-surface p-5">
      <h2 className="mb-1 font-cinzel text-2xl text-viking-gold">⚔️ Sjøslag — Holmgang på bølgene</h2>
      <p className="mb-4 font-inter text-sm text-viking-paper/75">Utfordre et annet skip. Hver gruppe utnevner en holmgangsmann. Vinner: +3 handel · taper: −2 · begge: −1 rykte.</p>

      {active.map(([id, d]) => {
        const other = d.challengerId === myGroupId ? d.defenderName : d.challengerName;
        const otherId = d.challengerId === myGroupId ? d.defenderId : d.challengerId;
        return (
          <div key={id} className="mb-3 rounded-lg border-2 border-viking-gold bg-viking-darkblue/60 p-4">
            <p className="font-cinzel text-lg text-viking-gold">Holmgang mot {other}</p>
            <p className="font-cinzel text-viking-paper">{d.activity.navn}</p>
            <p className="mb-2 font-inter text-sm text-viking-paper/85">{d.activity.desc}</p>
            <p className="mb-3 font-mono text-xs text-viking-gold-soft">Utnevn en holmgangsmann. Deres fordel i {skillTreeData[d.activity.ferdighet].name}: +{mySkills[d.activity.ferdighet] ?? 0}</p>
            <p className="mb-2 font-inter text-sm text-viking-gold-soft">Hvem vant duellen?</p>
            <div className="flex gap-2">
              <button onClick={() => updateDuel(code, id, { status: 'resolved', winnerId: myGroupId }).catch(() => {})} className="flex-1 rounded border-2 border-viking-moss bg-viking-moss/30 px-2 py-1.5 font-cinzel text-sm font-bold text-viking-paper hover:bg-viking-moss/50">Vi vant</button>
              <button onClick={() => updateDuel(code, id, { status: 'resolved', winnerId: otherId }).catch(() => {})} className="flex-1 rounded border-2 border-viking-crimson bg-viking-crimson/30 px-2 py-1.5 font-cinzel text-sm font-bold text-viking-paper hover:bg-viking-crimson/50">{other} vant</button>
            </div>
          </div>
        );
      })}

      {incoming.map(([id, d]) => (
        <div key={id} className="mb-3 rounded-lg border-2 border-viking-gold/50 bg-viking-darkblue/60 p-4">
          <p className="font-cinzel text-viking-gold">{d.challengerName} utfordrer dere til holmgang!</p>
          <p className="mb-3 font-inter text-sm text-viking-paper/85">{d.activity.navn} — {d.activity.desc}</p>
          <div className="flex gap-2">
            <button onClick={() => updateDuel(code, id, { status: 'active' }).catch(() => {})} className="flex-1 rounded border-2 border-viking-gold bg-viking-gold px-2 py-1.5 font-cinzel text-sm font-bold text-viking-darkblue hover:bg-viking-gold-soft">Aksepter</button>
            <button onClick={() => updateDuel(code, id, { status: 'declined' }).catch(() => {})} className="flex-1 rounded border-2 border-viking-gold/40 px-2 py-1.5 font-cinzel text-sm text-viking-gold-soft hover:border-viking-gold">Avslå</button>
          </div>
        </div>
      ))}

      {opponents.length === 0 ? (
        <p className="font-inter text-sm italic text-viking-paper/50">Ingen andre skip å utfordre ennå.</p>
      ) : (
        <div className="space-y-2">
          {opponents.map(([id, g]) => {
            const sent = pendingOut.some(([, d]) => d.defenderId === id);
            return (
              <div key={id} className="flex items-center justify-between rounded border border-viking-gold/30 px-3 py-2">
                <span className="font-cinzel text-viking-paper">{g.shipName}</span>
                <button
                  disabled={sent}
                  onClick={() => challenge(id, g.shipName)}
                  className="rounded border-2 border-viking-crimson bg-viking-crimson/30 px-3 py-1 font-cinzel text-sm text-viking-paper hover:bg-viking-crimson/50 disabled:opacity-40"
                >
                  {sent ? 'Sendt …' : 'Utfordre'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
