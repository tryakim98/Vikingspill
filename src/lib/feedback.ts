import { z } from "zod";
import { Code, Id } from "../domain/model";
import { FeedbackSchema } from "../domain/feedback";
import type { FeedbackPost } from "../domain/feedback";
export type { FeedbackPost } from "../domain/feedback";

export const FEEDBACK_STORAGE_KEY = "vikingspill_feedback_v3";
const EntrySchema = z
  .object({
    post: FeedbackSchema,
    code: Code.nullable(),
    uid: Id.nullable(),
    status: z.enum(["pending", "sent", "local"]),
  })
  .strict()
  .refine((entry) =>
    entry.status === "local"
      ? entry.code === null && entry.uid === null
      : !!entry.code && !!entry.uid,
  );
export type FeedbackEntry = z.infer<typeof EntrySchema>;
type StorageLike = Pick<Storage, "getItem" | "setItem">;

export function captureFeedbackOkt() {
  const value = new URLSearchParams(location.search).get("okt");
  if (value) {
    try {
      localStorage.setItem(
        "vikingspill_feedback_okt",
        value.trim().slice(0, 40),
      );
    } catch {
      /* The optional label is not needed to play. */
    }
  }
}
export function createFeedback(
  input: Omit<FeedbackPost, "at" | "id" | "okt">,
): FeedbackPost {
  let okt = "";
  try {
    okt = localStorage.getItem("vikingspill_feedback_okt") ?? "";
  } catch {
    /* Sending online is still possible without local storage. */
  }
  return FeedbackSchema.parse({
    ...input,
    id: crypto.randomUUID(),
    at: Date.now(),
    okt: okt.slice(0, 40),
  });
}
export function loadFeedback(
  storage: StorageLike = localStorage,
): FeedbackEntry[] {
  const raw = storage.getItem(FEEDBACK_STORAGE_KEY);
  // Never replace a damaged queue with an empty one or claim it was saved.
  return raw ? z.array(EntrySchema).max(200).parse(JSON.parse(raw)) : [];
}
export function storeFeedback(
  entry: FeedbackEntry,
  storage: StorageLike = localStorage,
) {
  const value = EntrySchema.parse(entry);
  const entries = loadFeedback(storage).filter(
    (e) => e.post.id !== value.post.id,
  );
  // Preserve unsent messages; only old sent/local copies may be pruned.
  while (entries.length >= 200) {
    const disposable = entries.findIndex((e) => e.status !== "pending");
    if (disposable < 0)
      throw new Error("Send ventende tilbakemeldinger før du lagrer flere.");
    entries.splice(disposable, 1);
  }
  storage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify([...entries, value]));
}
export function feedbackFor(
  entries: FeedbackEntry[],
  code?: string,
  uid?: string,
) {
  return entries.filter((e) =>
    code && uid
      ? e.code === code && e.uid === uid
      : e.code === null && e.uid === null,
  );
}
