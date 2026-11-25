import { motion, useReducedMotion } from "motion/react";
import type { GroupView } from "../../domain/model";
import { destinations } from "../../data";
import VikingShip from "../ship/VikingShip";
import Icon from "../decor/Icon";
import { groupStatus } from "../../lib/groupStatus";

// Stilisert rutekart: punktene er spredt for lesbarhet, ikke geografiske koordinater.
const MAP_POS: Record<string, { x: number; y: number }> = {
  vinland: { x: 10, y: 45 },
  island: { x: 25, y: 19 },
  faroyene: { x: 36, y: 33 },
  hebrides: { x: 26, y: 47 },
  dublin: { x: 29, y: 66 },
  lindisfarne: { x: 43, y: 56 },
  hedeby: { x: 57, y: 47 },
  sameland: { x: 57, y: 16 },
  paris: { x: 45, y: 77 },
  novgorod: { x: 75, y: 29 },
  miklagard: { x: 71, y: 69 },
  baghdad: { x: 87, y: 84 },
};
const HOME = { x: 49, y: 31 };
const NAME = Object.fromEntries(destinations.map((d) => [d.id, d.name]));

export default function SeaMap({
  groups,
}: {
  groups: Record<string, GroupView>;
}) {
  const reducedMotion = useReducedMotion();
  const counts: Record<string, number> = {};
  const locations = Object.values(groups).map((group) => {
    const status = groupStatus(group);
    const point = (status.locationId && MAP_POS[status.locationId]) || HOME;
    return { group, status, point };
  });
  const totals: Record<string, number> = {};
  for (const { point } of locations) {
    const key = `${point.x},${point.y}`;
    totals[key] = (totals[key] ?? 0) + 1;
  }
  const ships = locations.map(({ group, status, point }) => {
    const key = `${point.x},${point.y}`;
    const n = counts[key] ?? 0;
    counts[key] = n + 1;
    const columns = Math.min(3, totals[key]);
    return {
      group,
      status,
      x: Math.max(
        6,
        Math.min(94, point.x + ((n % columns) - (columns - 1) / 2) * 12),
      ),
      y: Math.max(8, Math.min(87, point.y - 12 + Math.floor(n / columns) * 11)),
    };
  });
  return (
    <div
      className="td-sea-map"
      role="img"
      aria-label={`Sjøkart med ${ships.length} skip. ${ships.map((s) => `${s.group.shipName}: ${s.status.text}`).join(". ")}`}
    >
      <svg
        className="td-map-land"
        viewBox="0 0 100 62.5"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <g
          fill="#96865d"
          fillOpacity=".15"
          stroke="#c1ae7b"
          strokeOpacity=".28"
          strokeWidth=".2"
        >
          <path d="M3,18 Q7,13 14,18 L18,26 15,39 11,42 6,36Z" />
          <path d="M19,9 Q24,6 28,10 L29,15 23,18 18,14Z" />
          <path d="M34,25 L39,21 43,24 44,32 40,39 36,36 35,30Z" />
          <path d="M51,7 Q56,4 61,6 L64,14 60,22 56,28 51,24 52,16Z" />
          <path d="M48,32 L59,29 70,21 81,18 94,24 97,39 90,43 88,48 81,45 76,53 71,50 67,41 59,38 58,44 52,43 45,47 39,43 42,36Z" />
          <path d="M66,54 Q74,47 82,52 L92,56 93,62 66,62Z" />
        </g>
        <g
          fill="none"
          stroke="#d5bb7a"
          strokeOpacity=".2"
          strokeWidth=".2"
          strokeDasharray=".8 1.2"
        >
          <path d="M49,19 Q22,1 10,28 M49,19 Q23,32 29,41 M49,19 Q45,32 45,48 M49,19 Q57,25 71,43 Q81,49 87,52" />
        </g>
      </svg>
      <p className="td-map-title">VIKINGENES VERDEN</p>
      <Icon name="compass" size={44} className="td-map-compass" />
      {Object.entries(MAP_POS).map(([id, p]) => (
        <div
          className="td-map-port"
          key={id}
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
        >
          <span />
          <span>{NAME[id] ?? id}</span>
        </div>
      ))}
      {ships.map(({ group, status, x, y }) => (
        <motion.div
          className="td-map-ship"
          key={group.id}
          initial={false}
          animate={{ left: `${x}%`, top: `${y}%` }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { type: "spring", stiffness: 38, damping: 14 }
          }
          title={`${group.shipName} · ${status.text}`}
        >
          <VikingShip
            color={group.shipColor}
            symbol={group.shipSymbol}
            size={48}
            bob={!reducedMotion}
          />
          <span className="td-map-ship-name">{group.shipName}</span>
        </motion.div>
      ))}
      {!ships.length && (
        <div className="td-map-empty">
          <span>Flåten samles når mannskapene blir med</span>
        </div>
      )}
    </div>
  );
}
