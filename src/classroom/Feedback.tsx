import { useState } from "react";
import { saveFeedback } from "../lib/feedback";
import type { FeedbackPost } from "../lib/feedback";
import { Button, Download, Field } from "./ui";
import { getRemote } from "./remote";
export default function Feedback({
  code,
  screen,
}: {
  code?: string;
  screen: string;
}) {
  const [category, setCategory] = useState<FeedbackPost["category"]>("forslag");
  const [comment, setComment] = useState("");
  const [post, setPost] = useState<FeedbackPost | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <details className="cg-help">
      <summary>Gi tilbakemelding om spillet</summary>
      <label className="cg-field">
        Type tilbakemelding
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as typeof category)}
        >
          {["bug", "forvirrende", "forslag", "likte"].map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </label>
      <Field
        label="Hva fungerte, eller hva bør forbedres?"
        value={comment}
        onChange={setComment}
        multiline
      />
      <Button
        disabled={busy || comment.trim().length < 5}
        onClick={async () => {
          setBusy(true);
          try {
            const value = post ?? saveFeedback({ category, comment, screen });
            setPost(value);
            setStatus("Tilbakemeldingen er lagret på denne enheten.");
            if (code) {
              const remote = await getRemote();
              await remote.call("submitFeedback", { code, post: value });
              setStatus("Tilbakemeldingen er lagret og mottatt på serveren.");
            }
          } catch (e) {
            setStatus(
              `Sendingen feilet: ${e instanceof Error ? e.message : "ukjent feil"}. Last ned den lokale kopien eller prøv igjen.`,
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        Lagre og {code ? "send" : "behold"} tilbakemelding
      </Button>
      {status && <p role="status">{status}</p>}
      {post && (
        <Download filename="vikingspill-tilbakemelding.json" value={post}>
          Last ned tilbakemeldingen
        </Download>
      )}
    </details>
  );
}
