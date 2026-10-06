import { useState } from "react";
import { SKILLS } from "../domain/model";
import type { PublicView } from "../domain/model";
import type { SkillKey, ShipSymbol } from "../types";
import { CREW_ROLES } from "../data/crewRoles";
import VikingShip from "../components/ship/VikingShip";
import { Button, Field, Panel } from "./ui";
import type { Intent } from "./store";
export default function ShipSetup({
  groups,
  busy,
  send,
}: {
  groups: PublicView["groups"];
  busy: boolean;
  send: (intent: Intent) => Promise<void>;
}) {
  const [groupId, setGroupId] = useState("");
  const [shipName, setShipName] = useState("");
  const [label, setLabel] = useState("");
  const [role, setRole] = useState<SkillKey>("språk");
  const [symbol, setSymbol] = useState<ShipSymbol>("drage");
  const [color, setColor] = useState("#2B6B6B");
  const group = groups[groupId];
  const taken = group ? Object.values(group.members).map((m) => m.role) : [];
  return (
    <Panel title="Finn mannskapet ditt">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send(
            group
              ? { type: "join_ship", groupId, role, label }
              : {
                  type: "create_ship",
                  groupId: `g-${crypto.randomUUID()}`,
                  shipName,
                  shipSymbol: symbol,
                  shipColor: color,
                  role,
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
                {g.shipName} · {Object.keys(g.members).length}/5 roller
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
        <label className="cg-field">
          Din rolle
          <select
            aria-label="Din rolle"
            value={role}
            onChange={(event) => setRole(event.target.value as SkillKey)}
          >
            {SKILLS.map((k) => (
              <option key={k} value={k} disabled={taken.includes(k)}>
                {CREW_ROLES[k].title}
                {taken.includes(k) ? " · tatt" : ""}
              </option>
            ))}
          </select>
        </label>
        <p>{CREW_ROLES[role].blurb} Du får en egen fagoppgave ved hver havn.</p>
        <Button
          type="submit"
          disabled={
            busy ||
            label.trim().length < 2 ||
            (!group && shipName.trim().length < 2) ||
            taken.includes(role)
          }
        >
          {group ? "Bli med ombord" : "Opprett skipet og bli høvding"}
        </Button>
      </form>
    </Panel>
  );
}
