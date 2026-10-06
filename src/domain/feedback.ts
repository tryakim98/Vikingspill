import { z } from "zod";
export const FeedbackSchema = z
  .object({
    id: z.string().uuid(),
    category: z.enum(["bug", "forvirrende", "forslag", "likte"]),
    comment: z.string().trim().min(5).max(2000),
    screen: z.string().max(120),
    at: z.number().int(),
    okt: z.string().max(40),
  })
  .strict();
export type FeedbackPost = z.infer<typeof FeedbackSchema>;
