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
import type { Destination, ShipSymbol } from '../../types';
import VikingShip from '../ship/VikingShip';

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
  ship: { color: string; symbol: ShipSymbol; name: string };
  isChief: boolean;
  previewDestId: string | null;
  sailingTo: string | null;
  onSelect: (destId: string | null) => void;
  onConfirm: (destId: string) => void;
}

export default function SeaJourney({ destinations, visited, locked, ship, isChief, previewDestId, sailingTo, onSelect, onConfirm }: Props) {
  const previewDest = previewDestId ? destinations.find((d) => d.id === previewDestId) ?? null : null;
  const lastVisited = visited[visited.length - 1];
  const shipStart = (lastVisited && MAP_POS[lastVisited]) || HOME;
  const sailingDest = sailingTo ? destinations.find((d) => d.id === sailingTo) ?? null : null;
  const sailingPos = sailingDest ? MAP_POS[sailingDest.id] : null;

  const stationaryShipPos = shipStart;

  const previewStatus = (d: Destination) =>
    locked.includes(d.id) ? { label: '🔒 Låst', color: 'text-viking-crimson' } :
    visited.includes(d.id) ? { label: '✓ Besøkt', color: 'text-viking-moss' } :
    { label: '⛵ Tilgjengelig', color: 'text-viking-gold' };

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
          const isSelected = previewDestId === d.id;
          const dotColor =
            isSelected ? '#E8C97A' :
            isVisited ? '#5B7553' :
            isLocked ? '#3a4d54' :
            '#D4A843';
          const dotShadow = isLocked ? 'none' : (isSelected ? '0 0 14px 4px rgba(232,201,122,0.85)' : '0 0 8px 2px rgba(212,168,67,0.55)');
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
                animate={isLocked ? { scale: 1 } : (isSelected ? { scale: [1, 1.25, 1.1] } : { scale: [1, 1.12, 1] })}
                transition={isLocked ? { duration: 0 } : { duration: isSelected ? 0.6 : 2.2, repeat: Infinity, ease: 'easeInOut' }}
                className="relative flex h-3.5 w-3.5 items-center justify-center rounded-full"
                style={{ backgroundColor: dotColor, boxShadow: dotShadow }}
              >
                {isLocked && <span className="absolute -top-3 text-[10px]">🔒</span>}
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

        {/* Seilende skip (animasjon fra siste posisjon til mål) */}
        {sailingTo && sailingPos && (
          <motion.div
            key={sailingTo}
            initial={{ left: `${shipStart.x}%`, top: `${shipStart.y}%`, opacity: 0.95 }}
            animate={{ left: `${sailingPos.x}%`, top: `${sailingPos.y}%`, opacity: 1 }}
            transition={{ duration: 1.6, ease: 'easeInOut' }}
            className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2"
            data-testid="sailing-ship"
          >
            <VikingShip color={ship.color} symbol={ship.symbol} size={44} bob />
          </motion.div>
        )}
      </div>

      {/* Info-kort */}
      {previewDest && (
        <div className="mt-3 rounded-lg border-2 border-viking-gold bg-viking-surface p-4" data-testid="dest-info-card">
          <div className="mb-1 flex items-center justify-between">
            <div>
              <h3 className="font-cinzel text-xl text-viking-gold">{previewDest.name}</h3>
              <p className="font-inter text-xs text-viking-gold-soft/80">{previewDest.region}</p>
            </div>
            <p className={`font-mono text-xs ${previewStatus(previewDest).color}`}>{previewStatus(previewDest).label}</p>
          </div>
          <p className="mt-2 font-inter text-sm italic leading-relaxed text-viking-paper/85">«{makeTeaser(previewDest.history)}»</p>
          <div className="mt-3 flex gap-2">
            {isChief && !locked.includes(previewDest.id) && !sailingTo ? (
              <button
                onClick={() => onConfirm(previewDest.id)}
                data-testid="confirm-sailing"
                className="rounded-md border-2 border-viking-gold bg-viking-gold px-5 py-1.5 font-cinzel font-bold text-viking-darkblue hover:bg-viking-gold-soft"
              >
                ⚓ Bekreft seilas →
              </button>
            ) : isChief && locked.includes(previewDest.id) ? (
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
      )}
    </div>
  );
}
