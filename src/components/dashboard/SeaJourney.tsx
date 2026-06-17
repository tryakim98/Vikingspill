/**
 * SeaJourney.tsx
 * Elev-versjon av sjøkartet — bytter ut destinasjonslisten med interaktivt kart.
 * Bygger på samme håndplasserte koordinater som lærerens SeaMap.
 *
 *  - Klikk på en destinasjon → infokort med navn, region, teaser og status.
 *  - Tilgjengelige steder glør i gull; besøkte er grønne ✓; låste er nedtonet og merket med en lås-glyf.
 *  - Høvdingen klikker «Bekreft seilas» — skipet glir fra siste posisjon mot målet
 *    (motion-animasjon på alle medlemmers skjermer) før encounter-flyten åpner.
 *  - Preview-valg + sailing-state er synket via Firebase, så alle ser samme bilde.
 */

import { motion } from 'motion/react';
import type { Destination, ShipSymbol, SkillKey, TradeGoodId } from '../../types';
import { EngravedShip } from '../decor';
import Icon from '../decor/Icon';
import { isAccessible, describeRequirement, missingForRequirement, meetsRequirement, haveForRequirement } from '../../lib/unlocks';
import { ACTIONS_BY_DEST, type SpecialAction, type ActionCategory } from '../../data/specialActions';
import { evaluateAction, describeCost, describeEffect } from '../../lib/specialActions';
import { skillTreeData } from '../../data/skillTree';

// Posisjoner i prosent (x = bredde, y = høyde) plassert omtrent geografisk riktig
// oppå det ekte verdenskartet i public/textures/kart-bakgrunn.jpg.
const MAP_POS: Record<string, { x: number; y: number }> = {
  vinland: { x: 26, y: 31 },     // Newfoundland, øst i Nord-Amerika
  island: { x: 39, y: 24 },      // Island
  faroyene: { x: 43, y: 29 },    // Færøyene
  hebrides: { x: 44.5, y: 31.5 },// Hebridene, N-Skottland
  dublin: { x: 42, y: 35 },      // Irland
  lindisfarne: { x: 46, y: 33 }, // NØ-England
  hedeby: { x: 50, y: 32.5 },    // Danmark/Slesvig
  sameland: { x: 54, y: 21 },    // Sápmi, N-Skandinavia
  paris: { x: 47.5, y: 39 },     // Frankrike
  novgorod: { x: 57.5, y: 27 },  // NV-Russland
  miklagard: { x: 56.5, y: 45 }, // Konstantinopel
  baghdad: { x: 63, y: 51 },     // Bagdad
};
const HOME = { x: 50.5, y: 28.5 }; // Avaldsnes, SV-Norge

// Etikett-plassering for de tett pakkede stedene rundt Nordsjøen, så navnene ikke
// stables oppå hverandre. above = navnet over punktet, dx = liten vannrett nudge (px).
const LABEL: Record<string, { above?: boolean; dx?: number }> = {
  island: { above: true, dx: -6 },
  faroyene: { above: true, dx: 6 },
  hebrides: { dx: -20 },
  dublin: { dx: -10 },
  lindisfarne: { dx: 18 },
  hedeby: { dx: 16 },
  sameland: { above: true },
  novgorod: { dx: 20 },
  miklagard: { dx: 18 },
  vinland: { dx: 0 },
};

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
  svennebrev: Record<SkillKey, number>;
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

export default function SeaJourney({ destinations, visited, locked, goods, svennebrev, scores, unlockedSides, performedActions, isChief, previewDestId, sailingTo, onSelect, onConfirm, onStartSvenneprove, onPerformAction }: Props) {
  const previewDest = previewDestId ? destinations.find((d) => d.id === previewDestId) ?? null : null;
  const lastVisited = visited[visited.length - 1];
  const shipStart = (lastVisited && MAP_POS[lastVisited]) || HOME;
  const sailingDest = sailingTo ? destinations.find((d) => d.id === sailingTo) ?? null : null;
  const sailingPos = sailingDest ? MAP_POS[sailingDest.id] : null;

  const stationaryShipPos = shipStart;
  const stateForLogic = { scores, svennebrev, goods, locked, unlockedSides };

  const accessibleNow = (d: Destination) => isAccessible(d, stateForLogic);
  const isSideLocked = (d: Destination) => d.route === 'side' && !accessibleNow(d) && !locked.includes(d.id);

  const previewStatus = (d: Destination) =>
    locked.includes(d.id) ? { label: 'Stengt', color: 'text-viking-crimson' } :
    visited.includes(d.id) ? { label: '✓ Besøkt', color: 'text-viking-moss' } :
    isSideLocked(d) ? { label: 'Sidested — låst', color: 'text-viking-gold-soft' } :
    d.route === 'side' && unlockedSides.includes(d.id) ? { label: 'Låst opp', color: 'text-viking-moss' } :
    d.route === 'side' ? { label: 'Sidested — åpent', color: 'text-viking-gold' } :
    { label: 'Hovedrute', color: 'text-viking-gold' };

  return (
    <div className="viking-panel-stone rounded-lg p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-cinzel text-xl text-viking-gold">Sjøkartet</h2>
        <p className="font-mono text-xs text-viking-gold-soft/80">{visited.length}/{destinations.length} besøkt</p>
      </div>
      <p className="mb-3 font-inter text-xs text-viking-gold-soft/70">
        {isChief ? 'Klikk på et lysende sted for å bestemme neste seilas.' : 'Høvdingen velger neste seilas — du ser med på kartet.'}
      </p>

      <div
        className="relative w-full overflow-hidden rounded-lg border-4 border-viking-gold/70 bg-[#1a140d] shadow-inner"
        style={{ aspectRatio: '16 / 9' }}
        data-testid="sea-journey-map"
      >
        {/* Ekte gammelt verdenskart som bakgrunn */}
        <img
          src="/textures/kart-bakgrunn.jpg"
          alt="Gammelt verdenskart"
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
          draggable={false}
        />
        {/* Lett vignett — demper kantene så punkter og ruter løfter seg fra det detaljrike kartet */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 50% 42%, rgba(11,20,38,0) 48%, rgba(11,20,38,0.45) 100%)' }}
        />

        {/* Tittel-plakett — mørk bakgrunn for lesbarhet mot kartet */}
        <p className="absolute left-3 top-2 z-10 rounded bg-viking-darkblue/75 px-2 py-0.5 font-cinzel text-xs tracking-widest text-viking-gold-soft shadow-md">VIKINGENES VERDEN</p>

        {/* Linje mellom siste posisjon og forhåndsvist destinasjon — mørk underlinje + gull for kontrast */}
        {previewDest && MAP_POS[previewDest.id] && !sailingTo && !locked.includes(previewDest.id) && (
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line
              x1={stationaryShipPos.x} y1={stationaryShipPos.y}
              x2={MAP_POS[previewDest.id].x} y2={MAP_POS[previewDest.id].y}
              stroke="rgba(0,0,0,0.55)" strokeWidth="1.1" strokeLinecap="round"
            />
            <line
              x1={stationaryShipPos.x} y1={stationaryShipPos.y}
              x2={MAP_POS[previewDest.id].x} y2={MAP_POS[previewDest.id].y}
              stroke="#A9A08D" strokeWidth="0.5" strokeDasharray="1.4 1.2" strokeLinecap="round" opacity="0.95"
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
            isSelected ? '#A9A08D' :
            isVisited ? '#7FA06B' :
            isLocked ? '#5a727d' :
            sideLocked ? '#8a734d' :
            '#F0BE4A';
          const dotShadow = dimmed ? '0 0 0 1px rgba(0,0,0,0.5)' : (isSelected ? '0 0 16px 5px rgba(232,201,122,0.9)' : '0 0 10px 3px rgba(240,190,74,0.7)');
          return (
            <button
              key={d.id}
              onClick={() => isChief && onSelect(isSelected ? null : d.id)}
              disabled={!isChief}
              aria-label={`${d.name} — ${isVisited ? 'besøkt' : isLocked ? 'låst' : 'tilgjengelig'}`}
              data-testid={`map-dest-${d.id}`}
              className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 ${isChief ? 'cursor-pointer' : 'cursor-default'}`}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              <motion.div
                animate={dimmed ? { scale: 1 } : (isSelected ? { scale: [1, 1.25, 1.1] } : { scale: [1, 1.12, 1] })}
                transition={dimmed ? { duration: 0 } : { duration: isSelected ? 0.6 : 2.2, repeat: Infinity, ease: 'easeInOut' }}
                className="relative flex h-5 w-5 items-center justify-center rounded-full"
              >
                {/* Mørk medaljong bak prikken — løfter den fra det detaljrike kartet */}
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'rgba(11,20,38,0.6)', border: '1px solid rgba(205,195,173,0.55)' }}
                />
                {/* Selve prikken */}
                <span
                  aria-hidden
                  className="relative h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: dotColor, boxShadow: dotShadow, border: '1px solid rgba(253,251,246,0.8)', opacity: dimmed && !isSelected ? 0.85 : 1 }}
                />
                {(isLocked || sideLocked) && <span className="absolute -left-1 -top-3.5 rounded bg-viking-darkblue/80 px-1 font-mono text-[8px] font-bold text-viking-crimson">LÅST</span>}
                {isVisited && <span className="absolute -top-3.5 rounded-full bg-viking-darkblue/80 px-1 text-[9px] text-viking-moss">✓</span>}
              </motion.div>
              <span
                className={`pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded px-1 py-px font-inter text-[10px] font-medium leading-tight shadow-md ${(LABEL[d.id]?.above) ? 'bottom-5' : 'top-5'} ${isSelected ? 'bg-viking-gold text-viking-darkblue' : 'bg-viking-darkblue/75 text-viking-gold-soft'}`}
                style={{ marginLeft: LABEL[d.id]?.dx ?? 0 }}
              >
                {d.name}
              </span>
            </button>
          );
        })}

        {/* Stasjonært skip ved siste posisjon (skjult når seiling pågår) */}
        {!sailingTo && (
          <div
            className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_2px_3px_rgba(0,0,0,0.6)]"
            style={{ left: `${stationaryShipPos.x}%`, top: `${stationaryShipPos.y}%` }}
          >
            <EngravedShip name="skip-kart" size={48} bob />
          </div>
        )}

        {/* Seilende skip + kjølvann (kurvet bane fra siste posisjon mot målet) */}
        {sailingTo && sailingPos && (() => {
          const bz = bezierKeyframes(shipStart.x, shipStart.y, sailingPos.x, sailingPos.y);
          const path = `M ${shipStart.x} ${shipStart.y} Q ${bz.cx} ${bz.cy} ${sailingPos.x} ${sailingPos.y}`;
          return (
            <>
              {/* Animert kjølvann — SVG-bane som tegnes etterhvert som skipet seiler.
                  Mørk underbane + lys overbane så sporet synes mot det detaljrike kartet. */}
              <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <motion.path
                  d={path} fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth={1.1} strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0.7 }}
                  animate={{ pathLength: 1, opacity: 0.45 }}
                  transition={{ duration: SAILING_DURATION_S, ease: 'easeInOut' }}
                />
                <motion.path
                  d={path}
                  fill="none"
                  stroke="rgba(255,255,255,0.7)"
                  strokeWidth={0.5}
                  strokeDasharray="1.5 1"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0.85 }}
                  animate={{ pathLength: 1, opacity: 0.55 }}
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
                className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_2px_3px_rgba(0,0,0,0.6)]"
                data-testid="sailing-ship"
              >
                <EngravedShip name="skip-kart" size={52} bob />
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
                  <Icon name="anchor" size={13} className="mr-1 inline-block align-[-1px]" /> Seiler mot {sailingDest.name} …
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
                    const av = evaluateAction(a, { scores, svennebrev, goods }, performedActions);
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
                          <span className="shrink-0">{satisfied ? '✓' : '·'}</span>
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
                      <Icon name="scroll" size={15} className="mr-1 inline-block align-[-2px]" /> Ta ferdsbrevet i {skillTreeData[svenneReq.skill].name} →
                    </button>
                  )}
                  {svenneReq && svenneReq.type === 'svenneprove' && !isChief && (
                    <p className="mt-3 rounded-md border border-viking-gold/30 bg-viking-darkblue/40 px-3 py-2 font-cinzel text-xs italic text-viking-gold-soft/80">
                      Høvdingen kan ta ferdsbrevet i {skillTreeData[svenneReq.skill].name}
                    </p>
                  )}
                </div>
              );
            })()}

            {/* "Låst opp!"-merke når sidestedet ER låst opp men ikke besøkt */}
            {dest.route === 'side' && unlockedSides.includes(dest.id) && !visited.includes(dest.id) && !locked.includes(dest.id) && (
              <div className="mt-3 rounded-md border-2 border-viking-moss/60 bg-viking-moss/15 p-3 text-center" data-testid="just-unlocked">
                <p className="font-cinzel text-sm font-bold text-viking-moss">Låst opp!</p>
                <p className="mt-0.5 font-inter text-xs text-viking-paper/85">Sidestedet er tilgjengelig — bekreft seilas under.</p>
              </div>
            )}

            <div className="mt-3 flex gap-2">
              {isChief && kanSeile ? (
                <button
                  onClick={() => onConfirm(dest.id)}
                  data-testid="confirm-sailing"
                  className="rounded-md border-2 border-viking-gold bg-viking-gold px-5 py-1.5 font-saga font-bold text-viking-darkblue hover:bg-viking-gold-soft"
                >
                  <Icon name="anchor" size={15} className="mr-1 inline-block align-[-2px]" /> Bekreft seilas →
                </button>
              ) : isChief && stedStengt ? (
                <p className="font-inter text-sm italic text-viking-crimson">Stedet er stengt for dere — tidligere valg har låst det.</p>
              ) : !isChief ? (
                <p className="font-inter text-sm text-viking-gold-soft/70"><Icon name="anchor" size={13} className="mr-1 inline-block align-[-1px]" /> Høvdingen bestemmer om dere skal seile dit.</p>
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
