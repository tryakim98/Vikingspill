/**
 * SeaJourney.tsx
 * Elev-versjon av sjøkartet — bytter ut destinasjonslisten med interaktivt kart.
 * Bygger på samme håndplasserte koordinater som lærerens SeaMap.
 *
 *  - Klikk på en destinasjon → infokort med navn, region, teaser og status.
 *  - Tilgjengelige steder glør i gull; besøkte er grønne ✓; låste er nedtonet med 🔒.
 *  - Høvdingen klikker «Bekreft seilas» — skipet glir fra siste posisjon mot målet
 *    (motion-animasjon på alle medlemmers skjermer) før encounter-flyten åpner.
 *  - Preview-valg + sailing-state er synket via Firebase, så alle ser samme bilde.
 */

import { motion } from 'motion/react';
import type { Destination, ShipSymbol, SkillKey, TradeGoodId } from '../../types';
import VikingShip from '../ship/VikingShip';
import { isAccessible, describeRequirement, missingForRequirement, meetsRequirement, haveForRequirement } from '../../lib/unlocks';
import { ACTIONS_BY_DEST, type SpecialAction, type ActionCategory } from '../../data/specialActions';
import { evaluateAction, describeCost, describeEffect } from '../../lib/specialActions';
import { skillTreeData } from '../../data/skillTree';

const MAP_POS: Record<string, { x: number; y: number }> = {
  vinland: { x: 8, y: 40 },
  island: { x: 21, y: 22 },
  faroyene: { x: 31, y: 30 },
  hebrides: { x: 37, y: 35 },
  dublin: { x: 32, y: 43 },
  lindisfarne: { x: 41, y: 41 },
  hedeby: { x: 50, y: 37 },
  sameland: { x: 55, y: 12 },
  paris: { x: 44, y: 51 },
  novgorod: { x: 66, y: 27 },
  miklagard: { x: 66, y: 62 },
  baghdad: { x: 78, y: 74 },
};
const HOME = { x: 52, y: 22 }; // Avaldsnes

/** Varighet i sekunder for seilas-animasjonen. GameDashboard's setTimeout ligger
 *  litt over dette så vi rekker å se animasjonen ferdig før encounter åpner. */
export const SAILING_DURATION_S = 3.0;

/** Samples 13 punkter langs en kvadratisk bezier-kurve fra (x1,y1) til (x2,y2)
 *  med en kontrollpunkt som ligger litt over midten — gir et buet, naturlig spor. */
function bezierKeyframes(x1: number, y1: number, x2: number, y2: number, lift = 10, steps = 12) {
  const cx = (x1 + x2) / 2;
  const cy = Math.min(y1, y2) - lift;
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const omt = 1 - t;
    xs.push(omt * omt * x1 + 2 * omt * t * cx + t * t * x2);
    ys.push(omt * omt * y1 + 2 * omt * t * cy + t * t * y2);
  }
  return { xs, ys, cx, cy };
}

/** Lager en kort teaser-tekst fra førsteperson-historien. */
function makeTeaser(history: string): string {
  const stripped = history.replace(/<[^>]+>/g, '').trim();
  const firstSentence = stripped.split(/(?<=[.!?])\s/)[0] ?? stripped;
  const limited = firstSentence.length > 140 ? firstSentence.slice(0, 140).trim() + '…' : firstSentence;
  return limited;
}

interface Props {
  destinations: Destination[];
  visited: string[];
  locked: string[];
  goods: Partial<Record<TradeGoodId, number>>;
  skills: Record<SkillKey, number>;
  scores: { culturalUnderstanding: number; tradeGain: number; reputation: number };
  unlockedSides: string[];
  performedActions: string[];
  ship: { color: string; symbol: ShipSymbol; name: string };
  isChief: boolean;
  previewDestId: string | null;
  sailingTo: string | null;
  onSelect: (destId: string | null) => void;
  onConfirm: (destId: string) => void;
  onStartSvenneprove: (destId: string, skill: SkillKey) => void;
  onPerformAction: (action: SpecialAction) => void;
}

const CATEGORY_LABEL: Record<ActionCategory, string> = {
  rykte: 'RYKTE',
  handel: 'HANDEL',
  diplomati: 'DIPLOMATI',
};
const CATEGORY_COLOR: Record<ActionCategory, string> = {
  rykte: 'text-viking-crimson',
  handel: 'text-viking-gold',
  diplomati: 'text-viking-teal',
};

export default function SeaJourney({ destinations, visited, locked, goods, skills, scores, unlockedSides, performedActions, ship, isChief, previewDestId, sailingTo, onSelect, onConfirm, onStartSvenneprove, onPerformAction }: Props) {
  const previewDest = previewDestId ? destinations.find((d) => d.id === previewDestId) ?? null : null;
  const lastVisited = visited[visited.length - 1];
  const shipStart = (lastVisited && MAP_POS[lastVisited]) || HOME;
  const sailingDest = sailingTo ? destinations.find((d) => d.id === sailingTo) ?? null : null;
  const sailingPos = sailingDest ? MAP_POS[sailingDest.id] : null;

  const stationaryShipPos = shipStart;
  const stateForLogic = { scores, skills, goods, locked, unlockedSides };

  const accessibleNow = (d: Destination) => isAccessible(d, stateForLogic);
  const isSideLocked = (d: Destination) => d.route === 'side' && !accessibleNow(d) && !locked.includes(d.id);

  const previewStatus = (d: Destination) =>
    locked.includes(d.id) ? { label: '🔒 Stengt', color: 'text-viking-crimson' } :
    visited.includes(d.id) ? { label: '✓ Besøkt', color: 'text-viking-moss' } :
    isSideLocked(d) ? { label: '🔒 Sidested — låst', color: 'text-viking-gold-soft' } :
    d.route === 'side' && unlockedSides.includes(d.id) ? { label: '🔓 Låst opp!', color: 'text-viking-moss' } :
    d.route === 'side' ? { label: '⛵ Sidested — åpent', color: 'text-viking-gold' } :
    { label: '⛵ Hovedrute', color: 'text-viking-gold' };

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h2 className="font-cinzel text-xl text-viking-gold">Sjøkartet</h2>
        <p className="font-mono text-xs text-viking-gold-soft/80">{visited.length}/{destinations.length} besøkt</p>
      </div>
      <p className="mb-3 font-inter text-xs text-viking-gold-soft/70">
        {isChief ? 'Klikk på et lysende sted for å bestemme neste seilas.' : 'Høvdingen velger neste seilas — du ser med på kartet.'}
      </p>

      <div
        className="relative w-full overflow-hidden rounded-lg border-4 border-viking-gold/70 bg-gradient-to-br from-viking-darkblue to-[#0e2436]"
        style={{ aspectRatio: '16 / 9', backgroundImage: 'repeating-linear-gradient(0deg, rgba(212,168,67,0.05) 0 1px, transparent 1px 40px), repeating-linear-gradient(90deg, rgba(212,168,67,0.05) 0 1px, transparent 1px 40px)' }}
        data-testid="sea-journey-map"
      >
        {/* Dekorative landmasser */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 56" preserveAspectRatio="none">
          <g fill="#5B7553" opacity="0.18">
            <path d="M2,28 Q6,18 12,24 Q16,30 10,40 Q4,44 2,36 Z" />
            <path d="M30,8 Q44,2 60,10 Q72,16 70,30 Q60,26 50,30 Q40,26 34,30 Q26,22 30,8 Z" />
            <path d="M58,40 Q72,34 86,48 Q92,56 78,56 L60,56 Q54,48 58,40 Z" />
          </g>
        </svg>

        {/* Tittel + kompass */}
        <p className="absolute left-3 top-2 font-cinzel text-sm tracking-widest text-viking-gold-soft/80">VIKINGENES VERDEN</p>
        <div className="absolute bottom-3 right-3 flex h-12 w-12 items-center justify-center rounded-full border-2 border-viking-gold/50 text-viking-gold-soft/70">
          <span className="absolute top-0 text-[10px]">N</span>
          <span className="text-lg">✦</span>
        </div>

        {/* Linje mellom siste posisjon og forhåndsvist destinasjon */}
        {previewDest && MAP_POS[previewDest.id] && !sailingTo && !locked.includes(previewDest.id) && (
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 56" preserveAspectRatio="none">
            <line
              x1={stationaryShipPos.x} y1={stationaryShipPos.y}
              x2={MAP_POS[previewDest.id].x} y2={MAP_POS[previewDest.id].y}
              stroke="#D4A843" strokeWidth="0.3" strokeDasharray="1 1" opacity="0.6"
            />
          </svg>
        )}

        {/* Destinasjoner */}
        {destinations.map((d) => {
          const p = MAP_POS[d.id];
          if (!p) return null;
          const isVisited = visited.includes(d.id);
          const isLocked = locked.includes(d.id);
          const sideLocked = isSideLocked(d);
          const isSelected = previewDestId === d.id;
          const dimmed = isLocked || sideLocked;
          const dotColor =
            isSelected ? '#E8C97A' :
            isVisited ? '#5B7553' :
            isLocked ? '#3a4d54' :
            sideLocked ? '#594a35' :
            '#D4A843';
          const dotShadow = dimmed ? 'none' : (isSelected ? '0 0 14px 4px rgba(232,201,122,0.85)' : '0 0 8px 2px rgba(212,168,67,0.55)');
          return (
            <button
              key={d.id}
              onClick={() => isChief && onSelect(isSelected ? null : d.id)}
              disabled={!isChief}
              aria-label={`${d.name} — ${isVisited ? 'besøkt' : isLocked ? 'låst' : 'tilgjengelig'}`}
              data-testid={`map-dest-${d.id}`}
              className={`absolute -translate-x-1/2 -translate-y-1/2 ${isChief ? 'cursor-pointer' : 'cursor-default'}`}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              <motion.div
                animate={dimmed ? { scale: 1 } : (isSelected ? { scale: [1, 1.25, 1.1] } : { scale: [1, 1.12, 1] })}
                transition={dimmed ? { duration: 0 } : { duration: isSelected ? 0.6 : 2.2, repeat: Infinity, ease: 'easeInOut' }}
                className="relative flex h-3.5 w-3.5 items-center justify-center rounded-full"
                style={{ backgroundColor: dotColor, boxShadow: dotShadow, opacity: dimmed && !isSelected ? 0.7 : 1 }}
              >
                {(isLocked || sideLocked) && <span className="absolute -top-3 text-[10px]">🔒</span>}
                {isVisited && <span className="absolute -top-3 text-[9px]">✓</span>}
              </motion.div>
              <span className={`absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap font-inter text-[10px] ${isSelected ? 'text-viking-gold' : 'text-viking-gold-soft/80'}`}>
                {d.name}
              </span>
            </button>
          );
        })}

        {/* Stasjonært skip ved siste posisjon (skjult når seiling pågår) */}
        {!sailingTo && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${stationaryShipPos.x}%`, top: `${stationaryShipPos.y}%` }}
          >
            <VikingShip color={ship.color} symbol={ship.symbol} size={40} bob />
          </div>
        )}

        {/* Seilende skip + kjølvann (kurvet bane fra siste posisjon mot målet) */}
        {sailingTo && sailingPos && (() => {
          const bz = bezierKeyframes(shipStart.x, shipStart.y, sailingPos.x, sailingPos.y);
          const path = `M ${shipStart.x} ${shipStart.y} Q ${bz.cx} ${bz.cy} ${sailingPos.x} ${sailingPos.y}`;
          return (
            <>
              {/* Animert kjølvann — SVG-bane som tegnes etterhvert som skipet seiler */}
              <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 56" preserveAspectRatio="none">
                <motion.path
                  d={path}
                  fill="none"
                  stroke="rgba(255,255,255,0.55)"
                  strokeWidth={0.35}
                  strokeDasharray="1.5 1"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0.8 }}
                  animate={{ pathLength: 1, opacity: 0.5 }}
                  transition={{ duration: SAILING_DURATION_S, ease: 'easeInOut' }}
                />
              </svg>

              <motion.div
                key={sailingTo}
                initial={{ left: `${shipStart.x}%`, top: `${shipStart.y}%`, opacity: 0.95 }}
                animate={{
                  left: bz.xs.map((x) => `${x}%`),
                  top: bz.ys.map((y) => `${y}%`),
                  opacity: 1,
                  rotate: [0, -4, 3, -3, 2, 0],
                }}
                transition={{ duration: SAILING_DURATION_S, ease: 'easeInOut' }}
                className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2"
                data-testid="sailing-ship"
              >
                <VikingShip color={ship.color} symbol={ship.symbol} size={44} bob />
              </motion.div>

              {/* Tekstboble — «Seiler mot X …» — synket via sailingTo */}
              {sailingDest && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="pointer-events-none absolute left-1/2 top-2 z-30 -translate-x-1/2 rounded-md border border-viking-gold/60 bg-viking-darkblue/90 px-3 py-1 font-cinzel text-xs text-viking-gold shadow-lg sm:text-sm"
                  data-testid="sailing-bubble"
                >
                  ⚓ Seiler mot {sailingDest.name} …
                </motion.div>
              )}
            </>
          );
        })()}
      </div>

      {/* Info-kort */}
      {previewDest && (() => {
        const dest = previewDest;
        const sideLocked = isSideLocked(dest);
        const stedStengt = locked.includes(dest.id);
        const kanSeile = !stedStengt && !sideLocked && !sailingTo;
        return (
          <div className="mt-3 rounded-lg border-2 border-viking-gold bg-viking-surface p-4" data-testid="dest-info-card">
            <div className="mb-1 flex items-center justify-between">
              <div>
                <h3 className="font-cinzel text-xl text-viking-gold">{dest.name}</h3>
                <p className="font-inter text-xs text-viking-gold-soft/80">{dest.region}</p>
              </div>
              <p className={`font-mono text-xs ${previewStatus(dest).color}`} data-testid="dest-status">{previewStatus(dest).label}</p>
            </div>
            <p className="mt-2 font-inter text-sm italic leading-relaxed text-viking-paper/85">«{makeTeaser(dest.history)}»</p>

            {/* Spesialhandlinger — bruk ressurser her */}
            {ACTIONS_BY_DEST[dest.id]?.length > 0 && (
              <div className="mt-3 rounded-md border border-viking-gold-soft/40 bg-viking-darkblue/50 p-3" data-testid="special-actions">
                <p className="mb-2 font-cinzel text-xs text-viking-gold-soft">Spesielle handlinger her:</p>
                <ul className="space-y-2.5">
                  {ACTIONS_BY_DEST[dest.id].map((a) => {
                    const av = evaluateAction(a, { scores, skills, goods }, performedActions);
                    return (
                      <li key={a.id} className="rounded border border-viking-gold/30 bg-viking-surface/40 p-2.5" data-testid={`action-${a.id}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-cinzel text-sm text-viking-gold">
                              <span className={`mr-1.5 text-[10px] font-bold ${CATEGORY_COLOR[a.category]}`}>{CATEGORY_LABEL[a.category]}</span>
                              {a.label}
                            </p>
                            <p className="mt-0.5 font-inter text-xs italic text-viking-paper/75">{a.description}</p>
                            <p className="mt-1 font-mono text-[11px] text-viking-gold-soft/90">
                              <span className="text-viking-crimson/90">Koster:</span> <strong>{describeCost(a.cost)}</strong>
                              <span className="mx-1.5">·</span>
                              <span className="text-viking-moss">Gir:</span> <strong>{describeEffect(a.effect)}</strong>
                            </p>
                          </div>
                          <div className="shrink-0">
                            {av.performed ? (
                              <span className="rounded bg-viking-moss/20 px-2 py-0.5 font-cinzel text-xs text-viking-moss">✓ Utført</span>
                            ) : isChief && av.available ? (
                              <button
                                onClick={() => onPerformAction(a)}
                                data-testid={`do-action-${a.id}`}
                                className="rounded border-2 border-viking-gold bg-viking-gold/20 px-3 py-1 font-cinzel text-xs font-bold text-viking-gold hover:bg-viking-gold/40"
                              >
                                Utfør →
                              </button>
                            ) : (
                              <span className="block max-w-[16ch] text-right font-mono text-[10px] text-viking-crimson/90" title={av.missing.join(', ')}>
                                <span className="block">Mangler:</span>
                                <strong className="block">{av.missing.join(', ')}</strong>
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Opplåsingsveier for låste sidesteder */}
            {sideLocked && dest.unlocks && (() => {
              const svenneReq = dest.unlocks.find((r) => r.type === 'svenneprove');
              return (
                <div className="mt-3 rounded-md border border-viking-gold-soft/40 bg-viking-darkblue/50 p-3" data-testid="unlock-paths">
                  <p className="mb-2 font-cinzel text-xs text-viking-gold-soft">Krever (én er nok):</p>
                  <ul className="space-y-1.5">
                    {dest.unlocks.map((req, i) => {
                      const satisfied = req.type !== 'svenneprove' && meetsRequirement(req, stateForLogic);
                      const description = describeRequirement(req);
                      const missing = missingForRequirement(req, stateForLogic);
                      const have = haveForRequirement(req, stateForLogic);
                      return (
                        <li key={i} className="flex flex-wrap items-start gap-2 font-inter text-xs">
                          <span className="shrink-0">{satisfied ? '✅' : req.type === 'svenneprove' ? '📜' : '◻️'}</span>
                          <span className={`flex-1 ${satisfied ? 'text-viking-moss' : 'text-viking-paper/85'}`}>
                            <strong>{description}</strong>
                            {!satisfied && req.type !== 'svenneprove' && have && (
                              <span className="block text-[11px] text-viking-paper/65"><span className="text-viking-moss">Har:</span> {have}</span>
                            )}
                            {!satisfied && req.type !== 'svenneprove' && missing && (
                              <span className="block text-[11px] text-viking-crimson/85"><span className="text-viking-crimson">Mangler:</span> {missing}</span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  {/* Stor, tydelig knapp for å ta svenneprøven direkte */}
                  {svenneReq && svenneReq.type === 'svenneprove' && isChief && (
                    <button
                      onClick={() => onStartSvenneprove(dest.id, svenneReq.skill)}
                      data-testid={`take-svenneprove-${dest.id}`}
                      className="mt-3 w-full rounded-md border-2 border-viking-gold bg-viking-gold/15 px-4 py-2.5 font-cinzel text-sm font-bold text-viking-gold transition hover:bg-viking-gold hover:text-viking-darkblue"
                    >
                      📜 Ta svenneprøven i {skillTreeData[svenneReq.skill].name} →
                    </button>
                  )}
                  {svenneReq && svenneReq.type === 'svenneprove' && !isChief && (
                    <p className="mt-3 rounded-md border border-viking-gold/30 bg-viking-darkblue/40 px-3 py-2 font-cinzel text-xs italic text-viking-gold-soft/80">
                      📜 Høvdingen kan ta svenneprøven i {skillTreeData[svenneReq.skill].name}
                    </p>
                  )}
                </div>
              );
            })()}

            {/* "Låst opp!"-merke når sidestedet ER låst opp men ikke besøkt */}
            {dest.route === 'side' && unlockedSides.includes(dest.id) && !visited.includes(dest.id) && !locked.includes(dest.id) && (
              <div className="mt-3 rounded-md border-2 border-viking-moss/60 bg-viking-moss/15 p-3 text-center" data-testid="just-unlocked">
                <p className="font-cinzel text-sm font-bold text-viking-moss">🔓 Låst opp!</p>
                <p className="mt-0.5 font-inter text-xs text-viking-paper/85">Sidestedet er tilgjengelig — bekreft seilas under.</p>
              </div>
            )}

            <div className="mt-3 flex gap-2">
              {isChief && kanSeile ? (
                <button
                  onClick={() => onConfirm(dest.id)}
                  data-testid="confirm-sailing"
                  className="rounded-md border-2 border-viking-gold bg-viking-gold px-5 py-1.5 font-cinzel font-bold text-viking-darkblue hover:bg-viking-gold-soft"
                >
                  ⚓ Bekreft seilas →
                </button>
              ) : isChief && stedStengt ? (
                <p className="font-inter text-sm italic text-viking-crimson">Stedet er stengt for dere — tidligere valg har låst det.</p>
              ) : !isChief ? (
                <p className="font-inter text-sm text-viking-gold-soft/70">⚓ Høvdingen bestemmer om dere skal seile dit.</p>
              ) : null}
              {isChief && !sailingTo && (
                <button
                  onClick={() => onSelect(null)}
                  className="rounded-md border-2 border-viking-gold/50 px-4 py-1.5 font-cinzel text-sm text-viking-gold-soft hover:border-viking-gold"
                >
                  Lukk
                </button>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
