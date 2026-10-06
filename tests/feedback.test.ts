import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { FeedbackSchema, FEEDBACK_SIGNALS } from "../src/domain/feedback";
import {
  FEEDBACK_STORAGE_KEY,
  feedbackFor,
  loadFeedback,
  storeFeedback,
} from "../src/lib/feedback";
import type { FeedbackEntry } from "../src/lib/feedback";
import { feedbackCsv } from "../src/classroom/files";

const post = () => ({
  id: randomUUID(),
  category: "forslag" as const,
  comment: "Færre oppgaver.",
  screen: "tasks",
  at: Date.now(),
  okt: "",
});
function memory() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}
const entry = (): FeedbackEntry => ({
  post: post(),
  code: "TEST",
  uid: "pupil",
  status: "pending",
});

test("quick feedback requires no writing; free text can be short", () => {
  for (const s of FEEDBACK_SIGNALS)
    assert.ok(
      FeedbackSchema.safeParse({
        ...post(),
        signal: s.id,
        category: s.category,
        comment: "",
      }).success,
    );
  assert.ok(FeedbackSchema.safeParse({ ...post(), comment: "Ok" }).success);
  for (const bad of [
    { ...post(), comment: "   " },
    { ...post(), signal: "rules", category: "likte", comment: "" },
    { ...post(), comment: "x".repeat(2001) },
    { ...post(), studentName: "Not collected" },
  ])
    assert.equal(FeedbackSchema.safeParse(bad).success, false);
});
test("the durable outbox is scoped to the original classroom and identity", () => {
  const storage = memory();
  const first = entry();
  const second = { ...entry(), uid: "other" };
  const otherClass = { ...entry(), code: "NEXT" };
  const solo = { ...entry(), code: null, uid: null, status: "local" as const };
  for (const e of [first, second, otherClass, solo]) storeFeedback(e, storage);
  assert.deepEqual(feedbackFor(loadFeedback(storage), "TEST", "pupil"), [
    first,
  ]);
  assert.deepEqual(feedbackFor(loadFeedback(storage)), [solo]);
  storeFeedback({ ...first, status: "sent" }, storage);
  assert.equal(loadFeedback(storage).length, 4);
  assert.equal(
    feedbackFor(loadFeedback(storage), "TEST", "pupil")[0].status,
    "sent",
  );
});
test("a full or damaged queue never silently discards unsent messages", () => {
  const storage = memory();
  for (let i = 0; i < 200; i++) storeFeedback(entry(), storage);
  const before = storage.getItem(FEEDBACK_STORAGE_KEY);
  assert.throws(() => storeFeedback(entry(), storage));
  assert.equal(storage.getItem(FEEDBACK_STORAGE_KEY), before);
  storeFeedback({ ...loadFeedback(storage)[0], status: "sent" }, storage);
  storeFeedback(entry(), storage);
  assert.equal(loadFeedback(storage).length, 200);
  assert.ok(loadFeedback(storage).every((e) => e.status === "pending"));
  storage.setItem(FEEDBACK_STORAGE_KEY, "damaged");
  assert.throws(() => storeFeedback(entry(), storage));
  assert.equal(storage.getItem(FEEDBACK_STORAGE_KEY), "damaged");
});
test("feedback export includes context, quotes text and neutralizes spreadsheet formulas", () => {
  const csv = feedbackCsv([
    {
      ...post(),
      comment: '=HYPERLINK("example")',
      destId: "lindisfarne",
      receivedAt: Date.now(),
    },
  ]);
  assert.ok(csv.includes("Lindisfarne"));
  assert.ok(csv.includes("Oppgavene"));
  assert.ok(csv.includes("'="));
  assert.ok(csv.includes('""example""'));
});
