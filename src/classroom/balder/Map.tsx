import { useEffect, useRef } from "react";
import { content } from "../../content";
import { GATES } from "../../content/balder";
import { Button, Panel } from "../ui";
import { harbourName } from "./harbours";

// The coastline plate uses a north-up Mercator crop in this 1160 × 600 frame.
// A leader connects each offset label to the actual place, including close neighbours.
const width = 1160,
  height = 600;
type Site = { place: [number, number]; label: [number, number] };
const sites: Record<string, Site> = {
  vinland: { place: [93, 366], label: [133, 388] },
  island: { place: [423, 176], label: [373, 116] },
  faroyene: { place: [572, 213], label: [512, 193] },
  hebrides: { place: [576, 275], label: [475, 269] },
  dublin: { place: [577, 343], label: [491, 350] },
  lindisfarne: { place: [621, 311], label: [674, 256] },
  hedeby: { place: [733, 328], label: [800, 335] },
  sameland: { place: [836, 79], label: [889, 63] },
  paris: { place: [662, 400], label: [634, 436] },
  novgorod: { place: [946, 270], label: [1009, 242] },
  miklagard: { place: [924, 488], label: [864, 504] },
  baghdad: { place: [1075, 564], label: [1040, 541] },
};

type HarbourState = "open" | "visited" | "locked";
const stateLabels = { open: "Åpen", visited: "Besøkt", locked: "Låst" };
const markerPaths = {
  open: "M8 1.6 14.4 8 8 14.4 1.6 8Z",
  visited: "m2.2 8 4.1 4.2 7.5-8.6",
  locked: "M3.3 7.5h9.4v6.7H3.3z M5.2 7.4V5a2.8 2.8 0 0 1 5.6 0v2.4",
};

function Mark({ state }: { state: HarbourState }) {
  return (
    <svg className="bd-mark" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d={markerPaths[state]}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill={state === "open" ? "currentColor" : "none"}
      />
    </svg>
  );
}

export default function Map({
  visited,
  approved,
  selected,
  busy,
  onPick,
}: {
  visited: string[];
  approved: number;
  selected: string | null;
  busy: boolean;
  onPick: (id: string) => void;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const last = visited.at(-1) ?? "hedeby";
  useEffect(() => {
    const el = frame.current;
    if (el)
      el.scrollLeft =
        (el.scrollWidth * sites[last].label[0]) / width - el.clientWidth / 2;
  }, [last]);
  function state(id: string): HarbourState {
    if (visited.includes(id)) return "visited";
    return (GATES[id] ?? 0) > approved ? "locked" : "open";
  }
  function describe(id: string) {
    const s = state(id);
    return s === "locked"
      ? `Låst · ${GATES[id]} ${GATES[id] === 1 ? "prøve" : "prøver"}`
      : stateLabels[s];
  }
  return (
    <Panel title="Sjøkartet">
      <div className="bd-chart-intro">
        <p>
          {visited.length === content.ports.length
            ? "Dere har besøkt alle havnene. Velg en havn for å lese skipets svar."
            : !visited.length
              ? "Begynn gjerne i Hedeby. Der åpner dere den første svenneprøven."
              : "Velg neste havn, eller gå tilbake til svarene fra en tidligere seilas."}
        </p>
        {!visited.length && (
          <Button disabled={busy} onClick={() => onPick("hedeby")}>
            Seil til Hedeby
          </Button>
        )}
      </div>
      <div className="bd-chart-key" aria-label="Karttegn">
        {(["open", "visited", "locked"] as const).map((s) => (
          <span key={s} data-state={s}>
            <Mark state={s} />
            {stateLabels[s]}
          </span>
        ))}
        <span className="bd-count">
          {visited.length} av {content.ports.length} besøkt
        </span>
      </div>
      <div
        ref={frame}
        className="bd-chart-frame"
        tabIndex={0}
        role="region"
        aria-label="Sjøkart med tolv havner"
      >
        <div className="bd-chart">
          <svg
            className="bd-leaders"
            viewBox={`0 0 ${width} ${height}`}
            aria-hidden="true"
          >
            {content.ports.map(({ port: { id } }) => {
              const {
                place: [x, y],
                label: [lx, ly],
              } = sites[id];
              return (
                <g key={id}>
                  <path d={`M${x} ${y}L${lx} ${ly}`} />
                  <circle cx={x} cy={y} r={3.2} />
                </g>
              );
            })}
          </svg>
          {content.ports.map(({ port: { id } }) => {
            const [x, y] = sites[id].label;
            return (
              <button
                key={id}
                type="button"
                className="bd-pin"
                data-state={state(id)}
                style={{
                  left: (x / width) * 100 + "%",
                  top: (y / height) * 100 + "%",
                }}
                aria-label={`${harbourName(id)} · ${describe(id)}`}
                disabled={busy}
                onClick={() => onPick(id)}
              >
                <span className="bd-pin-face">
                  <Mark state={state(id)} />
                  {harbourName(id)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <p className="bd-pan-hint">
        Dra kartet sidelengs, eller velg fra havnelista.
      </p>
      {selected && state(selected) === "locked" && (
        <p role="status" className="cg-note">
          {harbourName(selected)} åpner når dere har fått {GATES[selected]}{" "}
          {GATES[selected] === 1
            ? "svenneprøve godkjent"
            : "svenneprøver godkjent"}
          . Dere har {approved}. Velg en åpen havn eller en svenneprøve
          nedenfor.
        </p>
      )}
      <details className="bd-port-list">
        <summary>Velg havn fra liste</summary>
        <div className="bd-list-grid">
          {content.ports.map(({ port: { id } }) => (
            <button
              key={id}
              type="button"
              disabled={busy}
              data-state={state(id)}
              onClick={() => onPick(id)}
            >
              <Mark state={state(id)} />
              <span>
                {harbourName(id)}
                <small>{describe(id)}</small>
              </span>
            </button>
          ))}
        </div>
      </details>
    </Panel>
  );
}
