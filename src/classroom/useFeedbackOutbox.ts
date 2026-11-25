import { useCallback, useEffect, useRef, useState } from "react";
import {
  createFeedback,
  feedbackFor,
  loadFeedback,
  storeFeedback,
} from "../lib/feedback";
import type { FeedbackEntry, FeedbackPost } from "../lib/feedback";
import { getRemote } from "./remote";

export function useFeedbackOutbox(code?: string, uid?: string) {
  const [entries, setEntries] = useState<FeedbackEntry[]>(() => {
    try {
      return feedbackFor(loadFeedback(), code, uid);
    } catch {
      return [];
    }
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const running = useRef(false);
  const refresh = useCallback(() => {
    setEntries(feedbackFor(loadFeedback(), code, uid));
  }, [code, uid]);
  const flush = useCallback(async () => {
    if (!code || !uid || running.current || !navigator.onLine) return;
    try {
      if (
        !feedbackFor(loadFeedback(), code, uid).some(
          (e) => e.status === "pending",
        )
      )
        return;
    } catch {
      return;
    }
    running.current = true;
    try {
      const remote = await getRemote();
      setBusy(true);
      setError("");
      if (remote.uid !== uid)
        throw new Error(
          "Åpne den samme spilløkten for å sende tilbakemeldingen.",
        );
      // Re-read after each batch so a message queued during connection setup
      // is sent by this same drain, too.
      while (navigator.onLine) {
        const pending = feedbackFor(loadFeedback(), code, uid).filter(
          (e) => e.status === "pending",
        );
        if (!pending.length) break;
        for (const entry of pending) {
          await remote.call("submitFeedback", { code, post: entry.post });
          storeFeedback({ ...entry, status: "sent" });
          refresh();
        }
      }
    } catch {
      setError(
        "Kunne ikke sende nå. Lagrede meldinger prøves igjen når nettet er tilbake, eller når du åpner denne økten igjen.",
      );
    } finally {
      running.current = false;
      setBusy(false);
    }
  }, [code, uid, refresh]);
  useEffect(() => {
    let active = true;
    let stop: (() => void) | undefined;
    // A restored Firebase connection also retries queued reports when the
    // browser never emitted an offline/online event.
    if (code && uid)
      void getRemote()
        .then((remote) => {
          if (!active || remote.uid !== uid) return;
          stop = remote.connected(
            (connected) => {
              if (connected) void flush();
            },
            () => {},
          );
        })
        .catch(() => {
          /* The game connection already explains connection errors. */
        });
    const reconnect = () => {
      void flush();
    };
    const changed = () => {
      try {
        refresh();
      } catch {
        /* Preserve visible receipts if storage is blocked. */
      }
    };
    window.addEventListener("online", reconnect);
    window.addEventListener("storage", changed);
    return () => {
      active = false;
      stop?.();
      window.removeEventListener("online", reconnect);
      window.removeEventListener("storage", changed);
    };
  }, [code, uid, flush, refresh]);
  const submit = async (input: Omit<FeedbackPost, "at" | "id" | "okt">) => {
    setError("");
    const entry: FeedbackEntry = {
      post: createFeedback(input),
      code: code ?? null,
      uid: code ? (uid ?? null) : null,
      status: code && uid ? "pending" : "local",
    };
    try {
      storeFeedback(entry);
      refresh();
    } catch {
      // A blocked/full/damaged store must not prevent an online report.
      if (!code || !uid || !navigator.onLine) {
        setError(
          "Kunne ikke lagre på enheten. Behold teksten og prøv igjen når lagring eller nett er tilgjengelig.",
        );
        return null;
      }
      setBusy(true);
      try {
        const remote = await getRemote();
        if (remote.uid !== uid) throw new Error("Innloggingen er endret.");
        await remote.call("submitFeedback", { code, post: entry.post });
        setEntries((old) => [...old, { ...entry, status: "sent" }]);
        return entry.post.id;
      } catch {
        setError(
          "Kunne ikke lagre eller sende. Teksten er beholdt her; prøv igjen.",
        );
        return null;
      } finally {
        setBusy(false);
      }
    }
    await flush();
    return entry.post.id;
  };
  return { entries, busy, error, submit, retry: flush };
}
