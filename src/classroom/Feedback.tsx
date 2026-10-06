import { useState } from "react";
import { content } from "../content";
import { FEEDBACK_SIGNALS, FEEDBACK_SCREENS } from "../domain/feedback";
import type { FeedbackSignal } from "../domain/feedback";
import { Button, Download, Field } from "./ui";
import { useFeedbackOutbox } from "./useFeedbackOutbox";

export default function Feedback({
  code,
  uid,
  screen,
  destId,
  encounterId,
  endOfSession = false,
}: {
  code?: string;
  uid?: string;
  screen: string;
  destId?: string;
  encounterId?: string;
  endOfSession?: boolean;
}) {
  const [signal, setSignal] = useState<FeedbackSignal | null>(null);
  const [comment, setComment] = useState("");
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const { entries, busy, error, submit, retry } = useFeedbackOutbox(code, uid);
  const post = entries.find((e) => e.post.id === submittedId);
  const pending = entries.filter((e) => e.status === "pending");
  const port = content.ports.find((p) => p.port.id === destId)?.port.name;
  return (
    <details className="cg-feedback">
      <summary>
        {endOfSession
          ? "Før dere går: gi tilbakemelding om spillet"
          : "Gi tilbakemelding om spillet"}
      </summary>
      <div className="cg-feedback-body">
        {post ? (
          <div role="status">
            <p className="cg-feedback-thanks">Takk for tilbakemeldingen!</p>
            <p>
              {post.status === "sent"
                ? "Mottatt. Læreren kan lese den."
                : post.status === "local"
                  ? "Lagret på denne enheten. Last ned og del den med læreren eller den som utvikler spillet."
                  : busy
                    ? "Lagret på enheten. Sender …"
                    : "Lagret på enheten. Sendes når nettet er tilbake i denne økten."}
            </p>
            <Button
              secondary
              disabled={busy}
              onClick={() => {
                setSubmittedId(null);
                setSignal(null);
                setComment("");
              }}
            >
              Gi en tilbakemelding til
            </Button>
          </div>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const selected = FEEDBACK_SIGNALS.find((s) => s.id === signal);
              void submit({
                category: selected?.category ?? "forslag",
                comment,
                screen,
                ...(signal ? { signal } : {}),
                ...(destId ? { destId } : {}),
                ...(encounterId ? { encounterId } : {}),
              }).then((id) => {
                if (id) setSubmittedId(id);
              });
            }}
          >
            <p>Velg én ting og send. Du trenger ikke skrive.</p>
            <div
              className="cg-feedback-choices"
              role="group"
              aria-label="Hva vil du si om spillet?"
            >
              {FEEDBACK_SIGNALS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="cg-button cg-secondary"
                  aria-pressed={signal === s.id}
                  disabled={busy}
                  onClick={() => setSignal(signal === s.id ? null : s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <details className="cg-feedback-extra">
              <summary>Skriv en setning eller et forslag (valgfritt)</summary>
              <Field
                label="Hva vil du fortelle? (valgfritt)"
                value={comment}
                onChange={setComment}
                multiline
                required={false}
              />
            </details>
            <p className="cg-small">
              Gjelder:{" "}
              {[port, FEEDBACK_SCREENS[screen] ?? screen]
                .filter(Boolean)
                .join(" · ")}
              . Sted og steg tas med automatisk.
            </p>
            <Button
              type="submit"
              disabled={busy || (!signal && !comment.trim())}
            >
              {busy ? "Sender …" : "Send tilbakemelding"}
            </Button>
            <p className="cg-feedback-privacy">
              {code
                ? "Læreren kan lese dette. Det påvirker ikke vurderingen."
                : "Lagres på denne enheten, og kan lastes ned og deles."}{" "}
              Ikke skriv navn.
            </p>
          </form>
        )}
        {pending.length > 0 && (
          <div className="cg-feedback-pending" role="status">
            <span>
              {pending.length} tilbakemelding{pending.length === 1 ? "" : "er"}{" "}
              venter på sending.
            </span>
            <Button
              secondary
              disabled={busy}
              onClick={() => {
                void retry();
              }}
            >
              Prøv å sende igjen
            </Button>
          </div>
        )}
        {error && <p role="alert">{error}</p>}
        {(post || pending.length > 0) && (
          <Download
            filename="vikingspill-tilbakemeldinger.json"
            value={{ version: 3, feedback: entries.map((e) => e.post) }}
          >
            Last ned tilbakemeldinger
          </Download>
        )}
      </div>
    </details>
  );
}
