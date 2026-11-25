import { useEffect, useState } from "react";
import { ReceivedFeedbackSchema } from "../../domain/feedback";
import type { ReceivedFeedback } from "../../domain/feedback";
import { getRemote } from "../remote";

export function useFeedbackInbox(code: string) {
  const [posts, setPosts] = useState<ReceivedFeedback[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    let stop: (() => void) | undefined;
    const fail = () => {
      if (active)
        setError(
          "Kunne ikke hente tilbakemeldingene. Prøv igjen når nettet er tilbake.",
        );
    };
    void getRemote()
      .then((remote) => {
        if (!active) return;
        stop = remote.listen<Record<string, Record<string, unknown>>>(
          `v2/feedback/${code}`,
          (value) => {
            if (!active) return;
            const received: ReceivedFeedback[] = [];
            let invalid = 0;
            for (const bucket of Object.values(value ?? {})) {
              if (!bucket || typeof bucket !== "object") {
                invalid++;
                continue;
              }
              for (const raw of Object.values(bucket)) {
                const parsed = ReceivedFeedbackSchema.safeParse(raw);
                if (parsed.success) received.push(parsed.data);
                else invalid++;
              }
            }
            setPosts(received.sort((a, b) => b.receivedAt - a.receivedAt));
            setReady(true);
            setError(
              invalid ? `${invalid} tilbakemelding(er) kunne ikke leses.` : "",
            );
          },
          fail,
          false,
        );
      })
      .catch(fail);
    return () => {
      active = false;
      stop?.();
    };
  }, [code, attempt]);
  return { posts, ready, error, retry: () => setAttempt((n) => n + 1) };
}
export type FeedbackInboxState = ReturnType<typeof useFeedbackInbox>;
