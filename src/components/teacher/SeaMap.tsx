/**
 * SeaMap.tsx
 * Stilisert sjøkart (§8.1, §9.2) for lærerskjermen: 12 destinasjoner plassert på et
 * gammelt-kart-aktig hav, og hver gruppes vikingskip plassert ved siste besøkte sted.
 * Skipene glir (CSS-transition) når en gruppe seiler videre, og gynger på bølgene.
 *
 * Koordinatene er håndplassert (prototypen har ikke geografiske koordinater) for å gi
 * et gjenkjennelig kart: vest = Vinland, nord = Sameland/Island, øst = Novgorod, sør = Miklagard/Bagdad.
 */

import { motion } from 'motion/react';
import type { SyncedGroup } from '../../lib/gameSync';
import type { ShipSymbol } from '../../types';
import { destinations } from '../../data';
import VikingShip from '../ship/VikingShip';
import Icon from '../decor/Icon';
import { groupStatus } from '../../lib/groupStatus';

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
const HOME = { x: 52, y: 22 }; // Avaldsnes — startpunkt før første seilas

const NAME: Record<string, string> = Object.fromEntries(destinations.map((d) => [d.id, d.name]));

export default function SeaMap({ groups }: { groups: Record<string, SyncedGroup> }) {
  // Plasser skipene der gruppa ER NÅ (pågående seilas → aktiv destinasjon → siste
  // besøkte), ikke bare ved siste besøkte sted. Spre skip som står på samme punkt.
  const counts: Record<string, number> = {};
  const ships = Object.entries(groups).map(([id, g]) => {
    const st = groupStatus(g);
    const p = (st.locationId && MAP_POS[st.locationId]) || HOME;
    const key = `${p.x},${p.y}`;
    const n = counts[key] ?? 0;
    counts[key] = n + 1;
    return { id, g, st, x: p.x + ((n % 3) - 1) * 3.5, y: p.y + Math.floor(n / 3) * 5 };
  });

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg border-4 border-viking-gold/70 bg-[#14110b]"
      style={{ aspectRatio: '16 / 9', backgroundImage: 'repeating-linear-gradient(0deg, rgba(205,195,173,0.05) 0 1px, transparent 1px 40px), repeating-linear-gradient(90deg, rgba(205,195,173,0.05) 0 1px, transparent 1px 40px)' }}
    >
      {/* Dekorative landmasser (grovt, lav opasitet) */}
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

      {/* Destinasjoner */}
      {Object.entries(MAP_POS).map(([id, p]) => (
        <div key={id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
          <div className="h-2.5 w-2.5 rounded-full bg-viking-gold shadow-[0_0_8px_2px_rgba(205,195,173,0.6)]" />
          <span className="absolute left-1/2 top-3 -translate-x-1/2 whitespace-nowrap font-inter text-[9px] text-viking-gold-soft/70">{NAME[id] ?? id}</span>
        </div>
      ))}

      {/* Skip (glir mykt mellom posisjoner langs rutene, §8.1/§10). Et glødende ring
          markerer skip som er midt i et kulturmøte; navnelappen viser hva de gjør nå. */}
      {ships.map((s) => (
        <motion.div
          key={s.id}
          className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
          initial={false}
          animate={{ left: `${s.x}%`, top: `${s.y}%` }}
          transition={{ type: 'spring', stiffness: 38, damping: 14 }}
          title={`${s.g.shipName} — ${s.st.text}`}
        >
          {s.st.inEncounter && (
            <span className="absolute left-1/2 top-1/2 -z-10 h-12 w-12 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-viking-gold/30" />
          )}
          <VikingShip color={s.g.shipColor} symbol={s.g.shipSymbol as ShipSymbol} size={44} bob />
          <span className="absolute left-1/2 top-full mt-0.5 -translate-x-1/2 whitespace-nowrap rounded bg-viking-darkblue/85 px-1.5 py-px text-center font-cinzel text-[10px] leading-tight text-viking-paper">
            {s.g.shipName}
            {s.st.noMembers && <Icon name="warn" size={12} className="ml-1 inline-block align-[-1px] text-viking-crimson" title="Ingen påkoblede enheter" />}
            <span className="block font-inter text-[8px] not-italic text-viking-gold-soft/80">{s.st.text}</span>
          </span>
        </motion.div>
      ))}

      {ships.length === 0 && (
        <p className="absolute inset-0 flex items-center justify-center font-inter italic text-viking-paper/40">Ingen skip på havet ennå …</p>
      )}
    </div>
  );
}
