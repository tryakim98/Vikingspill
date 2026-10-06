import { useState } from "react";
import HolmgangMiniGame from "../components/duel/HolmgangMiniGame";
import { Button, Panel } from "./ui";

export default function Holmgang() {
  const [kind, setKind] = useState<"tapping" | "reaksjon" | "regning">(
    "reaksjon",
  );
  const [round, setRound] = useState(0);
  const [result, setResult] = useState("");
  return (
    <details className="cg-help">
      <summary>Holmgang · en rask mannskapsutfordring</summary>
      <Panel>
        <p>
          Avtal aktivitet og spill på hver deres enhet. Vis resultatet til
          læreren hvis dette er en avtalt konkurranse mellom skip.
        </p>
        <label className="cg-field">
          Aktivitet
          <select
            value={kind}
            onChange={(e) => {
              setKind(e.target.value as typeof kind);
              setResult("");
            }}
          >
            {[
              ["reaksjon", "Reaksjon"],
              ["tapping", "Flest trykk"],
              ["regning", "Hoderegning"],
            ].map(([id, title]) => (
              <option key={id} value={id}>
                {title}
              </option>
            ))}
          </select>
        </label>
        <HolmgangMiniGame
          key={`${kind}:${round}`}
          kind={kind}
          onDone={(r) =>
            setResult(
              r.reactionMs === undefined
                ? `${r.score} poeng`
                : `${r.reactionMs} ms`,
            )
          }
        />
        {result && <p role="status">Resultat: {result}</p>}
        <Button
          secondary
          onClick={() => {
            setRound((n) => n + 1);
            setResult("");
          }}
        >
          Ny runde
        </Button>
      </Panel>
    </details>
  );
}
