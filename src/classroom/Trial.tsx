import type { GroupView } from "../domain/model";
import { TOPIC_LABEL } from "../domain/trials";
import { content } from "../content";
import { useAnswerDraft, useTextDraft } from "./drafts";
import { Button, Field, Panel } from "./ui";
import type { Intent } from "./store";
export default function Trial({
  group,
  uid,
  solo,
  busy,
  send,
}: {
  group: GroupView;
  uid: string;
  solo: boolean;
  busy: boolean;
  send: (intent: Intent) => Promise<void>;
}) {
  const trial = group.trial!;
  const [answers, setAnswers] = useAnswerDraft(
    `${trial.id}:${uid}:trial-answers`,
  );
  const [practice, setPractice] = useTextDraft(
    `${trial.id}:${uid}:practice`,
    trial.practice,
  );
  const owner = uid === trial.ownerId;
  return (
    <Panel
      title={`${TOPIC_LABEL[trial.skill]} · ${trial.level === 1 ? "Svenneprøve" : "Mesterprøve"}`}
    >
      <p>
        Bruk det dere lærte på reisen. Diskuter sammen;{" "}
        {group.members[trial.ownerId]?.label} leverer lagets svar og praksis.
        Notatene fra fullførte besøk er tilgjengelige under spørsmålene.
      </p>
      {!owner && (
        <p>
          {group.members[trial.ownerId]?.label} utfører prøven. Den som startet
          prøven, eier svarene og kan avslutte den.
        </p>
      )}
      {trial.phase === "quiz" && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void send({ type: "answer_trial", answers });
          }}
        >
          {trial.questions.map((q, index) => (
            <fieldset key={q.q} className="cg-choice">
              <legend>{q.q}</legend>
              <p className="cg-small">
                Fra reisen:{" "}
                {q.source
                  .map(
                    (id) =>
                      content.ports.find((p) => p.port.id === id)?.port.name,
                  )
                  .join(" og ")}
              </p>
              {q.opts.map((option, i) => (
                <label key={option}>
                  <input
                    type="radio"
                    name={`trial-${index}`}
                    checked={answers[index] === i}
                    disabled={!owner}
                    required
                    onChange={() => {
                      const next = Array.from(
                        { length: trial.questions.length },
                        (_, i) => answers[i] ?? -1,
                      );
                      next[index] = i;
                      setAnswers(next);
                    }}
                  />
                  {option}
                </label>
              ))}
            </fieldset>
          ))}
          {owner && (
            <Button
              type="submit"
              disabled={
                busy ||
                Array.from(
                  { length: trial.questions.length },
                  (_, i) => answers[i],
                ).some((a) => a === undefined || a < 0)
              }
            >
              Lever teoriprøven
            </Button>
          )}
        </form>
      )}
      {trial.phase === "practice" && (
        <>
          <p>{trial.feedback}</p>
          <h3>{trial.practiceTitle}</h3>
          <p className="cg-note">{trial.practicePrompt}</p>
          {owner && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void send({ type: "practice", text: practice });
              }}
            >
              <Field
                label="Vis hva dere kan. Beskriv utførelsen og den faglige begrunnelsen."
                value={practice}
                onChange={setPractice}
                multiline
              />
              <Button
                type="submit"
                disabled={busy || practice.trim().length < 20}
              >
                Lever praksis til vurdering
              </Button>
            </form>
          )}
        </>
      )}
      {trial.phase === "pending" && (
        <>
          <p>{trial.practice}</p>
          <p>
            Praksis venter på{" "}
            {solo ? "din egen vurdering i øvingsmodus" : "lærerens vurdering"}.
          </p>
          {solo && (
            <div className="cg-actions">
              <Button
                disabled={busy}
                onClick={() => {
                  void send({
                    type: "approve_trial",
                    approved: true,
                    feedback:
                      "Egenvurdering i øvingsmodus: praksisen er gjennomført og begrunnet.",
                  });
                }}
              >
                Jeg har gjennomført og kan forklare oppgaven
              </Button>
              <Button
                secondary
                disabled={busy}
                onClick={() => {
                  void send({
                    type: "approve_trial",
                    approved: false,
                    feedback: "Egenvurdering: jeg trenger mer øving.",
                  });
                }}
              >
                Jeg trenger mer øving
              </Button>
            </div>
          )}
        </>
      )}
      {["passed", "failed"].includes(trial.phase) && (
        <>
          <h3>{trial.phase === "passed" ? "Bestått" : "Øv videre"}</h3>
          <p>{trial.feedback}</p>
          {owner && (
            <Button
              disabled={busy}
              onClick={() => {
                void send({ type: "close_trial" });
              }}
            >
              Tilbake til sjøkartet
            </Button>
          )}
        </>
      )}
      {trial.phase !== "quiz" && (
        <details className="cg-help">
          <summary>Se spørsmålene med forklaringer</summary>
          {trial.questions.map((q) => (
            <p key={q.q}>
              <strong>{q.q}</strong>
              <br />
              {q.feedback}
            </p>
          ))}
        </details>
      )}
      <details className="cg-help">
        <summary>Reiseboken · opplysninger fra besøkte havner</summary>
        {(trial.requiredPorts.length ? trial.requiredPorts : group.visited).map(
          (id) => (
            <div key={id}>
              <h3>{content.ports.find((p) => p.port.id === id)?.port.name}</h3>
              <ul>
                {content.journey[id].notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          ),
        )}
      </details>
    </Panel>
  );
}
