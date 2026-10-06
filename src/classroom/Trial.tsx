import { useState } from "react";
import type { GroupView } from "../domain/model";
import { PRACTICE_PROMPTS } from "../domain/engine";
import { CREW_ROLES } from "../data/crewRoles";
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
  const [answers, setAnswers] = useState<number[]>([]);
  const [practice, setPractice] = useState("");
  const owner = uid === trial.ownerId;
  return (
    <Panel
      title={`${CREW_ROLES[trial.skill].title} · ${trial.level === 1 ? "Sveinn" : "Mester"}`}
    >
      <p>
        Teori og praksis må begge bestås. Prøven og steget er lagret, og
        overlever oppfriskning av siden.
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
              {q.opts.map((option, i) => (
                <label key={option}>
                  <input
                    type="radio"
                    name={`trial-${index}`}
                    checked={answers[index] === i}
                    disabled={!owner}
                    required
                    onChange={() =>
                      setAnswers((old) => {
                        const next = [...old];
                        next[index] = i;
                        return next;
                      })
                    }
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
                ).some((a) => a === undefined)
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
          <p className="cg-note">{PRACTICE_PROMPTS[trial.skill]}</p>
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
    </Panel>
  );
}
