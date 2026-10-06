import { learningCsv } from "./files";
import type { GroupView } from "../domain/model";
import { Button, Download, Panel } from "./ui";
import type { Intent } from "./store";
export default function Debrief({
  group,
  solo,
  send,
  busy,
}: {
  group: GroupView;
  solo: boolean;
  send: (intent: Intent) => Promise<void>;
  busy: boolean;
}) {
  return (
    <Panel title="Saga og etterarbeid">
      <p>
        Hva gjorde dere? Hva støttet kildene? Hvem opplevde møtet annerledes?
        Terningutfallet og det faglige arbeidet vises hver for seg.
      </p>
      <div className="cg-actions">
        <Download
          filename={`${group.id}-saga.json`}
          value={{ version: 2, shipName: group.shipName, saga: group.saga }}
        >
          Last ned saga
        </Download>
        <Download
          filename={`${group.id}-etterarbeid.csv`}
          value={learningCsv({ [group.id]: group })}
        >
          Last ned etterarbeid
        </Download>
      </div>
      {group.saga.length === 0 && (
        <p>Sagaen begynner ved første fullførte kulturmøte.</p>
      )}
      {group.saga.map((s) => (
        <details className="cg-help" key={s.id}>
          <summary>
            {s.destName} · {s.choiceTitle}
          </summary>
          <p>
            <strong>Avgjørelsen før kastet:</strong>{" "}
            {s.reason || "Ingen felles begrunnelse levert."}
          </p>
          <p>
            Kast {s.roll.dice.join("/")} · {s.roll.tier} · Handel {s.trade} ·
            Rykte {s.reputation}
          </p>
          {Object.entries(s.evidence).map(([id, v]) => (
            <div className="cg-note" key={id}>
              <strong>{group.members[id]?.label ?? "Tidligere medlem"}</strong>
              <p>{v.fact}</p>
              <p>{v.interpretation}</p>
              <p>{v.perspective}</p>
              <p>
                Kildereferanse: {v.sourceId}. Quiz: {s.quiz[id]?.correct ?? 0}{" "}
                av {s.quiz[id]?.total ?? 0}.
              </p>
            </div>
          ))}
          <p>
            <strong>Kilder og historie:</strong>{" "}
            {s.historicalComparison || "Etterarbeid pågår."}
          </p>
          <p>
            <strong>Bro til i dag:</strong> {s.reflection}
          </p>
          {s.cardReveal && <p>{s.cardReveal}</p>}
          {s.assessment ? (
            <p className="cg-note">
              {solo ? "Egenvurdering" : "Lærervurdering"}: begrunnelse{" "}
              {s.assessment.reasoning}/2 · kildebruk {s.assessment.sourceUse}/2
              · perspektiv {s.assessment.perspective}/2. {s.assessment.feedback}
            </p>
          ) : (
            <p>Fagbidraget er levert, men ikke vurdert ennå.</p>
          )}
          {solo && !s.assessment && (
            <Button
              secondary
              disabled={busy}
              onClick={() => {
                void send({
                  type: "assess",
                  sagaId: s.id,
                  rubric: {
                    reasoning: 1,
                    sourceUse: 1,
                    perspective: 1,
                    feedback:
                      "Egenvurdering i øvingsmodus: jeg har begrunnet, vist til kilde og undersøkt et annet perspektiv. Be en lærer vurdere kvaliteten.",
                  },
                });
              }}
            >
              Registrer gjennomført egenvurdering
            </Button>
          )}
        </details>
      ))}
    </Panel>
  );
}
