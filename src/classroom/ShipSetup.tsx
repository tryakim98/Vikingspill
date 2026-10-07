import { useState } from "react";
import type { PublicView } from "../domain/model";
import type { ShipSymbol } from "../types";
import VikingShip from "../components/ship/VikingShip";
import { Button, Field, Panel } from "./ui";
import type { Intent } from "./store";
export default function ShipSetup({
  groups,
  busy,
  send,
  onBack,
}: {
  groups: PublicView["groups"];
  busy: boolean;
  send: (intent: Intent) => Promise<void>;
  onBack?: () => void;
}) {
  const [groupId, setGroupId] = useState("");
  const [shipName, setShipName] = useState("");
  const [label, setLabel] = useState("");
  const [symbol, setSymbol] = useState<ShipSymbol>("drage");
  const [color, setColor] = useState("#2B6B6B");
  const group = groups[groupId];
  return (
    <Panel title="Finn mannskapet ditt">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send(
            group
              ? { type: "join_ship", groupId, label }
              : {
                  type: "create_ship",
                  groupId: `g-${crypto.randomUUID()}`,
                  shipName,
                  shipSymbol: symbol,
                  shipColor: color,
                  label,
                },
          );
        }}
      >
        <label className="cg-field">
          Skip
          <select
            aria-label="Skip"
            value={groupId}
            onChange={(event) => setGroupId(event.target.value)}
          >
            <option value="">Opprett et nytt skip</option>
            {Object.values(groups).map((g) => (
              <option key={g.id} value={g.id}>
                {g.shipName} · {Object.keys(g.members).length} medlemmer
              </option>
            ))}
          </select>
        </label>
        {!group && (
          <>
            <Field
              label="Skipets navn"
              value={shipName}
              onChange={setShipName}
              maxLength={60}
            />
            <div className="cg-grid">
              <label className="cg-field">
                Seilsymbol
                <select
                  value={symbol}
                  onChange={(event) =>
                    setSymbol(event.target.value as ShipSymbol)
                  }
                >
                  <option value="drage">Drage</option>
                  <option value="ulv">Ulv</option>
                  <option value="ravn">Ravn</option>
                </select>
              </label>
              <label className="cg-field">
                Skipets farge
                <input
                  type="color"
                  value={color}
                  onChange={(event) => setColor(event.target.value)}
                />
              </label>
            </div>
            <VikingShip color={color} symbol={symbol} size={150} />
          </>
        )}
        <Field
          label="Ditt visningsnavn eller kallenavn"
          value={label}
          onChange={setLabel}
          maxLength={60}
        />
        <p>
          Alle bidrar til oppgavene og laglekene. Den som har roret, åpner
          stegene for laget.
        </p>
        <div className="cg-actions">
          <Button
            type="submit"
            disabled={
              busy ||
              label.trim().length < 2 ||
              (!group && shipName.trim().length < 2)
            }
          >
            {group ? "Bli med ombord" : "Opprett skipet og bli høvding"}
          </Button>
          {onBack && (
            <Button type="button" secondary disabled={busy} onClick={onBack}>
              ← Tilbake til spillstart
            </Button>
          )}
        </div>
      </form>
    </Panel>
  );
}
