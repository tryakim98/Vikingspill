/**
 * TeacherPanel.tsx
 * Lærerens game master-konsoll (fase 2, §8.1–8.2):
 *  - Opprett et spill → få en spillkode elevene taster inn.
 *  - Sanntids-leaderboard over alle gruppene som er koblet til (via Firebase).
 * Vises typisk på delt storskjerm. Kart med animerte skip / godkjenning kommer senere.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '../hooks/useRole';
import { generateGameCode } from '../lib/gameCode';
import { createGame, subscribeGroups, type SyncedGroup } from '../lib/gameSync';
import VikingShip from '../components/ship/VikingShip';
import type { ShipSymbol } from '../types';

const CODE_KEY = 'vikingspill_teacher_code';
const total = (g: SyncedGroup) => g.scores.culturalUnderstanding + g.scores.tradeGain + g.scores.reputation;

export default function TeacherPanel() {
  const navigate = useNavigate();
  const { clearRole } = useRole();
  const [code, setCode] = useState<string | null>(() => localStorage.getItem(CODE_KEY));
  const [groups, setGroups] = useState<Record<string, SyncedGroup>>({});

  // Lytt på alle grupper i spillet i sanntid
  useEffect(() => {
    if (!code) { setGroups({}); return; }
    const unsubscribe = subscribeGroups(code, setGroups);
    return () => unsubscribe();
  }, [code]);

  const createNew = async () => {
    const c = generateGameCode();
    try { await createGame(c); } catch { /* vis koden uansett; sync er best effort */ }
    localStorage.setItem(CODE_KEY, c);
    setCode(c);
  };

  const endGame = () => { localStorage.removeItem(CODE_KEY); setCode(null); };
  const switchRole = () => { clearRole(); navigate('/', { replace: true }); };

  const ranked = Object.entries(groups)
    .map(([id, g]) => ({ id, g }))
    .sort((a, b) => total(b.g) - total(a.g));

  return (
    <div className="min-h-screen bg-viking-darkblue text-viking-paper p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 border-b-4 border-viking-gold pb-5">
          <h1 className="font-cinzel text-4xl text-viking-gold">📜 Spillmasterkonsoll</h1>
          <p className="font-inter italic text-viking-gold-soft">Storskjerm — elevene ser denne</p>
        </div>

        {!code ? (
          /* Ingen aktivt spill → opprett */
          <div className="rounded-lg border-2 border-viking-gold bg-viking-surface p-10 text-center">
            <h2 className="mb-3 font-cinzel text-2xl text-viking-gold">Start et nytt spill</h2>
            <p className="mb-8 font-inter text-viking-paper/85">Du får en spillkode som elevene taster inn for å bli med.</p>
            <button onClick={() => void createNew()} className="rounded-md border-2 border-viking-gold bg-viking-gold px-10 py-3 font-cinzel text-lg font-bold text-viking-darkblue hover:bg-viking-gold-soft">Opprett spill</button>
          </div>
        ) : (
          <>
            {/* Spillkoden */}
            <div className="mb-8 rounded-lg border-2 border-viking-gold bg-viking-surface p-6 text-center">
              <p className="font-cinzel text-sm uppercase tracking-widest text-viking-gold-soft">Spillkode</p>
              <p className="my-2 font-mono text-5xl font-bold tracking-[0.2em] text-viking-gold">{code}</p>
              <p className="font-inter text-sm text-viking-paper/80">Elevene velger «Jeg er elev» og taster inn denne koden.</p>
            </div>

            {/* Leaderboard */}
            <div className="mb-8">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="font-cinzel text-2xl text-viking-gold">Leaderboard</h2>
                <span className="font-mono text-sm text-viking-gold-soft">{ranked.length} {ranked.length === 1 ? 'gruppe' : 'grupper'}</span>
              </div>
              {ranked.length === 0 ? (
                <p className="rounded-lg border-2 border-dashed border-viking-gold/30 p-8 text-center font-inter italic text-viking-paper/60">Venter på at grupper kobler til …</p>
              ) : (
                <div className="space-y-2">
                  {ranked.map(({ id, g }, i) => (
                    <div key={id} className="flex items-center gap-4 rounded-lg border-2 border-viking-gold/40 bg-viking-surface p-3">
                      <span className="w-6 text-center font-cinzel text-xl text-viking-gold">{i + 1}</span>
                      <VikingShip color={g.shipColor} symbol={g.shipSymbol as ShipSymbol} size={56} />
                      <div className="flex-1">
                        <p className="font-cinzel text-lg text-viking-paper">{g.shipName}</p>
                        <p className="font-mono text-xs text-viking-gold-soft">{g.visited.length}/12 steder besøkt</p>
                      </div>
                      <div className="text-right">
                        <p className="font-cinzel text-3xl font-bold text-viking-gold">{total(g)}</p>
                        <p className="font-mono text-[10px] text-viking-paper/60">U {g.scores.culturalUnderstanding} · H {g.scores.tradeGain} · R {g.scores.reputation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button onClick={endGame} className="rounded border-2 border-viking-gold bg-viking-rust px-5 py-2 font-bold text-viking-paper hover:bg-viking-rust/80">Avslutt spill</button>
              <button onClick={switchRole} className="rounded border-2 border-viking-gold bg-viking-plum px-5 py-2 font-bold text-viking-paper hover:bg-viking-plum/80">Bytt rolle</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
