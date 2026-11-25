import { z } from "zod";

export const FEEDBACK_SIGNALS = [
  { id: "rules", category: "forvirrende", label: "For mange regler" },
  { id: "next_step", category: "forvirrende", label: "Usikker på neste steg" },
  { id: "bug", category: "bug", label: "Noe virker ikke" },
  { id: "liked", category: "likte", label: "Dette likte jeg" },
] as const;
export type FeedbackSignal = (typeof FEEDBACK_SIGNALS)[number]["id"];
export const FEEDBACK_CATEGORIES = {
  bug: "Noe virker ikke",
  forvirrende: "Vanskelig eller forvirrende",
  forslag: "Forslag",
  likte: "Dette fungerte godt",
} as const;
export const FEEDBACK_SCREENS: Record<string, string> = {
  mannskap: "Velge mannskap",
  sjøkart: "Sjøkartet",
  sailing: "Seilasen",
  reading: "Fortellingen",
  tasks: "Oppgavene",
  council: "Rådslagningen",
  decision: "Valget",
  result: "Utfallet",
  reflection: "Etterarbeidet",
  prøve: "Svenneprøven",
  avsluttet: "Etter økten",
  lærer: "Lærerskjermen",
};
const fields = {
  id: z.string().uuid(),
  category: z.enum(["bug", "forvirrende", "forslag", "likte"]),
  comment: z.string().trim().max(2000),
  screen: z.string().trim().min(1).max(120),
  at: z.number().int().nonnegative().max(8640000000000000),
  okt: z.string().max(40),
  signal: z.enum(["rules", "next_step", "bug", "liked"]).optional(),
  destId: z.string().min(1).max(80).optional(),
  encounterId: z.string().min(1).max(120).optional(),
};
function useful(post: { comment: string; signal?: FeedbackSignal }) {
  return !!post.signal || post.comment.length > 0;
}
function consistent(post: {
  category: keyof typeof FEEDBACK_CATEGORIES;
  signal?: FeedbackSignal;
}) {
  return (
    !post.signal ||
    FEEDBACK_SIGNALS.find((s) => s.id === post.signal)?.category ===
      post.category
  );
}
export const FeedbackSchema = z
  .object(fields)
  .strict()
  .refine(useful, "Velg en tilbakemelding eller skriv en setning.")
  .refine(consistent, "Type og hurtigvalg må stemme overens.");
export const ReceivedFeedbackSchema = z
  .object({
    ...fields,
    receivedAt: z.number().int().nonnegative().max(8640000000000000),
  })
  .strict()
  .refine(useful)
  .refine(consistent);
export type FeedbackPost = z.infer<typeof FeedbackSchema>;
export type ReceivedFeedback = z.infer<typeof ReceivedFeedbackSchema>;
export function feedbackLabel(post: FeedbackPost) {
  return (
    FEEDBACK_SIGNALS.find((s) => s.id === post.signal)?.label ??
    FEEDBACK_CATEGORIES[post.category]
  );
}
