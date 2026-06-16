/**
 * Leaderboard.tsx
 * Lærerens sanntids-rangering (§8.2) — nå med per-gruppe-detalj læreren kan folde ut:
 *   - hva gruppa GJØR nå (encounter-steg + sted), så «henger de fast?» kan ses
 *   - de tre delpoengene hver for seg (kultur/handel/rykte)
 *   - ferdighetsnivåer, varer ombord, antall påkoblede medlemmer + høvding
 *   - en «fjern gruppe»-knapp for opprydding (tom/forlatt/duplikat)
 *
 * Bevisst valg (§3.4/§13): læreren får IKKE dele ut poeng eller favorisere en gruppe
 * herfra — bare se tilstanden og rydde. Rettferdigheten ligger fast.
 */

import { useState } from 'react';
import type { SyncedGroup } from '../../lib/gameSync';
import type { ShipSymbol, SkillKey, TradeGoodId } from '../../types';
import { skillTreeData, TRADE_GOODS } from '../../data';
import { groupStatus } from '../../lib/groupStatus';
import VikingShip from '../ship/VikingShip';
import NorseIcon, { SKILL_PNG } from '../decor/NorseIcon';

const SKILL_KEYS: SkillKey[] = ['språk', 'sjømannskap', 'krigskunst', 'diplomati', 'tro'];
const total = (g: SyncedGroup) => g.scores.culturalUnderstanding + g.scores.tradeGain + g.scores.reputation;

interface Props {
  ranked: [string, SyncedGroup][];
  onRemoveGroup: (groupId: string, shipName: string) => void;
}

export default function Leaderboard({ ranked, onRemoveGroup }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="viking-panel-mosaic rounded-lg p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-cinzel text-2xl text-viking-gold xl:text-3xl">Leaderboard</h2>
        <span className="font-mono text-sm text-viking-gold-soft">{ranked.length} {ranked.length === 1 ? 'gruppe' : 'grupper'}</span>
      </div>
      {ranked.length === 0 ? (
        <p className="rounded-lg border-2 border-dashed border-viking-gold/30 p-6 text-center font-inter italic text-viking-paper/60">Venter på grupper …</p>
      ) : (
        <div className="space-y-2">
          {ranked.map(([id, g], i) => {
            const st = groupStatus(g);
            const isOpen = expanded === id;
            return (
              <div key={id} className="overflow-hidden rounded-lg border-2 border-viking-gold/40 bg-viking-surface">
                {/* Sammenfellbar rad — alltid synlig status + medlemstall */}
                <button
                  onClick={() => setExpanded(isOpen ? null : id)}
                  data-testid={`leaderboard-row-${id}`}
                  className="flex w-full items-center gap-3 p-2.5 text-left hover:bg-viking-gold/5"
                >
                  <span className="w-5 text-center font-cinzel text-lg text-viking-gold">{i + 1}</span>
                  <VikingShip color={g.shipColor} symbol={g.shipSymbol as ShipSymbol} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-cinzel text-viking-paper xl:text-lg">{g.shipName}</p>
                    <p className="flex flex-wrap items-center gap-x-2 font-inter text-[11px] text-viking-gold-soft">
                      <span className="font-mono">{g.visited.length}/12 steder</span>
                      {st.noMembers
                        ? <span className="text-viking-crimson" title="Ingen påkoblede enheter">⚠ ingen pålogget</span>
                        : <span className="text-viking-gold-soft/70">· {st.memberCount} {st.memberCount === 1 ? 'enhet' : 'enheter'}</span>}
                      <span className="text-viking-gold-soft/90">· {st.text}</span>
                    </p>
                  </div>
                  <p className="font-cinzel text-2xl font-bold text-viking-gold xl:text-3xl">{total(g)}</p>
                  <span className="ml-1 font-mono text-xs text-viking-gold-soft/60">{isOpen ? '▲' : '▼'}</span>
                </button>

                {/* Detalj */}
                {isOpen && (
                  <div className="border-t border-viking-gold/20 bg-viking-darkblue/40 p-3" data-testid={`group-detail-${id}`}>
                    {/* Delpoeng */}
                    <div className="mb-3 grid grid-cols-3 gap-2 text-center">
                      {([['Kultur', g.scores.culturalUnderstanding], ['Handel', g.scores.tradeGain], ['Rykte', g.scores.reputation]] as const).map(([label, v]) => (
                        <div key={label} className="rounded border border-viking-gold/25 bg-viking-surface/50 py-1.5">
                          <p className="font-mono text-[10px] uppercase text-viking-gold-soft/80">{label}</p>
                          <p className="font-cinzel text-xl font-bold text-viking-gold">{v}</p>
                        </div>
                      ))}
                    </div>

                    {/* Ferdigheter */}
                    <div className="mb-3">
                      <p className="mb-1 font-cinzel text-[11px] uppercase tracking-wide text-viking-gold-soft/80">Ferdigheter</p>
                      <div className="flex flex-wrap gap-1.5">
                        {SKILL_KEYS.map((k) => {
                          const lvl = g.skills?.[k] ?? 0;
                          return (
                            <span key={k} title={skillTreeData[k].name} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${lvl > 0 ? 'border-viking-gold/50 bg-viking-gold/10' : 'border-viking-gold/15 opacity-50'}`}>
                              <NorseIcon name={SKILL_PNG[k]} size={13} className="text-viking-gold-soft" />
                              <span className="font-mono text-xs text-viking-gold">{lvl}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Varer */}
                    <div className="mb-3">
                      <p className="mb-1 font-cinzel text-[11px] uppercase tracking-wide text-viking-gold-soft/80">Varer ombord</p>
                      {goodsList(g.goods).length === 0 ? (
                        <p className="font-inter text-xs italic text-viking-paper/55">Lasterommet er tomt.</p>
                      ) : (
                        <p className="font-inter text-xs text-viking-paper/90">
                          {goodsList(g.goods).map(([k, n]) => `${TRADE_GOODS[k]?.icon ?? ''} ${TRADE_GOODS[k]?.name ?? k} ×${n}`).join('  ·  ')}
                        </p>
                      )}
                    </div>

                    {/* Status + opprydding */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-viking-gold/15 pt-2">
                      <p className="font-inter text-[11px] text-viking-gold-soft/80">
                        {st.text}{st.noMembers && ' · ingen enheter koblet til'}
                      </p>
                      <button
                        onClick={() => onRemoveGroup(id, g.shipName)}
                        data-testid={`remove-group-${id}`}
                        className="rounded border border-viking-crimson/50 px-2.5 py-1 font-cinzel text-[11px] text-viking-crimson hover:bg-viking-crimson/20"
                      >
                        Fjern gruppe
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function goodsList(goods: SyncedGroup['goods']): [TradeGoodId, number][] {
  if (!goods) return [];
  return (Object.entries(goods) as [TradeGoodId, number][]).filter(([, n]) => (n ?? 0) > 0);
}
