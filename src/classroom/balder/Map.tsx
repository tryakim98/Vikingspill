import { useEffect, useRef } from "react";
import { content } from "../../content";
import { GATES } from "../../content/balder";
import { Button, Panel } from "../ui";

// Positions in the enlarged North Atlantic / Eurasia crop of kart-bakgrunn.jpg.
const spots: Record<string, [number, number]> = {
  vinland: [8, 35],
  island: [35, 16],
  faroyene: [42, 28],
  hebrides: [45, 40],
  dublin: [40, 51],
  lindisfarne: [51, 48],
  hedeby: [62, 44],
  sameland: [70, 13],
  paris: [55, 61],
  novgorod: [81, 29],
  miklagard: [78, 75],
  baghdad: [93, 89],
};
import { harbourName } from "./harbours";
export default function Map({
  visited,
  approved,
  onPick,
}: {
  visited: string[];
  approved: number;
  onPick: (id: string) => void;
}) {
  const frame = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = frame.current;
    if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) * 0.52;
  }, []);
  const status = (id: string) =>
    visited.includes(id)
      ? "Besøkt"
      : (GATES[id] ?? 0) > approved
        ? `Låst · ${GATES[id]} prøver`.replace("1 prøver", "1 prøve")
        : "Åpen";
  return (
    <Panel title="Sjøkartet">
      <p>
        Velg en havn. På mobil kan dere dra kartet sidelengs eller velge fra
        lista under.
      </p>
      <div
        ref={frame}
        className="bd-chart-frame"
        tabIndex={0}
        role="region"
        aria-label="Sjøkart med tolv havner"
      >
        <div className="bd-chart">
          {content.ports.map(({ port: p }, i) => (
            <button
              key={p.id}
              type="button"
              className="bd-pin"
              data-state={status(p.id).split(" ")[0]}
              style={{ left: spots[p.id][0] + "%", top: spots[p.id][1] + "%" }}
              aria-label={`${harbourName(p.id)} · ${status(p.id)}`}
              onClick={() => onPick(p.id)}
            >
              {i + 1}
              <span>{harbourName(p.id)}</span>
            </button>
          ))}
        </div>
      </div>
      <details>
        <summary>Velg havn fra liste</summary>
        <div className="cg-actions">
          {content.ports.map(({ port: p }) => (
            <Button secondary key={p.id} onClick={() => onPick(p.id)}>
              {harbourName(p.id)} · {status(p.id)}
            </Button>
          ))}
        </div>
      </details>
    </Panel>
  );
}
