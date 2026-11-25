import { useState } from "react";
import { PRACTICES, HARBOURS } from "../../content/balder";
import { approvedCount, balderPoints } from "../../domain/balder";
import type { GroupView } from "../../domain/model";
import type { GameStore, Snapshot } from "../store";
import { Button, Field, Panel, Shell, SyncStatus } from "../ui";
import FeedbackInbox from "../teacher/FeedbackInbox";
import type { FeedbackInboxState } from "../teacher/useFeedbackInbox";
import "./balder.css";

export default function BalderTeacher({
  state,
  store,
  onHome,
  inbox,
}: {
  state: Snapshot;
  store: GameStore;
  onHome: () => void;
  inbox: FeedbackInboxState;
}) {
  const view = state.public!;
  const groups = Object.values(state.groups);
  const pending = groups.flatMap((g) =>
    PRACTICES.flatMap((t) =>
      g.balder?.trials[t.id]?.status === "pending" ? [{ g, t }] : [],
    ),
  );
  return (
    <Shell
      className="bd bd-teacher"
      title="Balder · læreroversikt"
      action={
        <Button secondary onClick={onHome}>
          Hovedmeny
        </Button>
      }
    >
      <Panel
        title={view.closed ? "Økten er avsluttet" : "Vis koden til klassen"}
      >
        <div className="bd-teacher-code">
          <strong className="bd-code">{view.code}</strong>
          {!view.closed && (
            <p>
              <a
                className="bd-board-link"
                href={"/balder?tavle=" + view.code}
                target="_blank"
                rel="noreferrer"
              >
                Vis spillkoden i et eget vindu
              </a>
            </p>
          )}
        </div>
        <p>
          Elevene velger <b>Balder</b> i hovedmenyen og taster koden. Én
          oppretter skipet, resten velger det samme skipet på sin mobil eller
          PC.
        </p>
      </Panel>
      <SyncStatus state={state} store={store} solo={false} />
      <Panel title={`Svenneprøver til godkjenning (${pending.length})`}>
        {!pending.length && (
          <p>Her dukker gruppenes dokumentasjon opp når de leverer.</p>
        )}
        {pending.map(({ g, t }) => (
          <Review
            key={g.balder!.trials[t.id].id}
            group={g}
            trial={t}
            store={store}
            busy={!!state.pending || view.closed}
          />
        ))}
      </Panel>
      <Panel title="Skipene">
        {!groups.length && <p>Venter på det første skipet.</p>}
        {groups.map((g) => (
          <details key={g.id}>
            <summary>
              {g.shipName} · {g.visited.length}/12 havner · {balderPoints(g)}{" "}
              poeng
            </summary>
            <p>
              {g.balder ? approvedCount(g.balder) : 0} av 3 prøver godkjent.
            </p>
            {Object.entries(g.balder?.visits ?? {}).map(([id, v]) => (
              <p key={id}>
                <b>{HARBOURS[id]?.title}</b> ·{" "}
                {v.reflection || "Leser i havna."}{" "}
                {v.answers && ` · Quiz ${v.correct}/3`}
              </p>
            ))}
          </details>
        ))}
      </Panel>
      <details className="cg-help">
        <summary>Tilbakemeldinger om spillet</summary>
        <FeedbackInbox code={view.code} inbox={inbox} />
      </details>
      {!view.closed && (
        <details className="cg-help">
          <summary>Avslutt klasseøkten</summary>
          <p>
            Alle skip får se sluttsummen sin. Behandle ventende prøver først.
          </p>
          <Button
            disabled={!!state.pending || pending.length > 0}
            onClick={() => void store.send({ type: "close_game" })}
          >
            Avslutt Balder for alle
          </Button>
        </details>
      )}
    </Shell>
  );
}
function Review({
  group,
  trial,
  store,
  busy,
}: {
  group: GroupView;
  trial: (typeof PRACTICES)[number];
  store: GameStore;
  busy: boolean;
}) {
  const [feedback, setFeedback] = useState("");
  const entry = group.balder!.trials[trial.id];
  function review(approved: boolean) {
    void store.send({
      type: "balder",
      groupId: group.id,
      action: {
        kind: "review",
        trial: trial.id,
        submission: entry.id,
        approved,
        feedback,
      },
    });
  }
  return (
    <article className="bd-review">
      <div className="bd-review-head">
        <img
          src={`/game/balder/${trial.id}.webp`}
          alt=""
          width={78}
          height={52}
          loading="lazy"
        />
        <h3>
          {group.shipName} · {trial.title}
        </h3>
      </div>
      <p>{trial.proof}</p>
      <blockquote>{entry.text}</blockquote>
      <div className="cg-actions">
        <Button disabled={busy} onClick={() => review(true)}>
          Godkjenn prøven
        </Button>
      </div>
      <details>
        <summary>Be om en endring</summary>
        <Field
          label="Hva skal gruppa endre?"
          value={feedback}
          onChange={setFeedback}
          maxLength={300}
        />
        <Button
          secondary
          disabled={busy || feedback.trim().length < 3}
          onClick={() => review(false)}
        >
          Send tilbake
        </Button>
      </details>
    </article>
  );
}
