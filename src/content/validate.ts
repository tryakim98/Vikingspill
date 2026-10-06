import { z } from "zod";
import { GOODS, SKILLS, Id } from "../domain/model";
import type { Content, ContentPack } from "../domain/model";

const text = z.string().min(1);
const quiz = z
  .object({
    q: text,
    opts: z.array(text).min(2).max(6),
    correct: z.number().int().min(0),
    feedback: text,
  })
  .refine(
    (q) => q.correct < q.opts.length,
    "Svarnøkkelen må peke på et alternativ.",
  );
const outcome = z.object({
  und: z.number().int(),
  trade: z.number().int(),
  rep: z.number().int(),
  text,
});
const choice = z
  .object({
    id: Id,
    title: text,
    desc: text,
    tag: z.enum(["respect", "trade", "aggressive"]),
    baseRoll: z.object({
      bad: z.number().int().min(0),
      mid: z.number().int().min(0),
      good: z.number().int().min(0),
      crit: z.number().int().min(0),
    }),
    outcomes: z.object({
      bad: outcome.optional(),
      mid: outcome.optional(),
      good: outcome.optional(),
      crit: outcome.optional(),
    }),
    lesson: text,
    locks: z.array(Id).optional(),
  })
  .superRefine((c, ctx) => {
    if (Object.values(c.baseRoll).reduce((a, b) => a + b, 0) !== 6)
      ctx.addIssue({
        code: "custom",
        message: "Terningfordelingen må ha nøyaktig seks sider.",
      });
    for (const tier of ["bad", "mid", "good", "crit"] as const)
      if (c.baseRoll[tier] > 0 && !c.outcomes[tier])
        ctx.addIssue({
          code: "custom",
          message: `Mangler oppnåelig utfall: ${tier}.`,
        });
  });
const requirement = z.union([
  z.object({
    type: z.literal("svenneprove"),
    skill: z.enum(SKILLS),
    nivå: z.union([z.literal(1), z.literal(2)]),
  }),
  z.object({
    type: z.literal("score"),
    key: z.enum(["culturalUnderstanding", "tradeGain", "reputation"]),
    min: z.number().int(),
  }),
  z.object({
    type: z.literal("goods"),
    goods: z.partialRecord(z.enum(GOODS), z.number().int().positive()),
  }),
]);
const packSchema = z.object({
  version: z.literal(1),
  port: z.object({
    id: Id,
    name: text,
    region: text,
    color: text,
    difficulty: z.enum(["trygg", "middels", "farlig"]),
    image: text,
    history: text,
    funFact: text,
    famousPerson: text,
    choices: z.array(choice).min(3),
    task: z.object({
      type: z.enum(["foto", "innspilling", "geoguesser"]),
      icon: text,
      typeLabel: text,
      title: text,
      desc: text,
      rationale: text,
    }),
    episkeKulturmote: z.object({
      tittel: text,
      scene: text,
      kulturmøteSpørsmål: quiz,
    }),
    stedsquiz: z.array(quiz).length(4),
    goodsReward: z.array(z.enum(GOODS)),
    route: z.enum(["main", "side"]),
    unlocks: z.array(requirement).optional(),
    historicalChoiceId: Id.optional(),
    hiddenChoice: z
      .object({
        unlock: z.object({
          skill: z.enum(SKILLS),
          nivå: z.union([z.literal(1), z.literal(2)]).optional(),
        }),
        choice,
      })
      .optional(),
    perspectivePrompt: z
      .object({ vikingQuestion: text, otherQuestion: text, otherLabel: text })
      .optional(),
    modernBridge: z
      .object({
        topic: text,
        context: text,
        prompt: text,
        options: z.array(text),
      })
      .optional(),
    historyShort: text.optional(),
    kulturmoteSceneShort: text.optional(),
    governance: z
      .object({ styreform: text, makthaver: text, body: text })
      .optional(),
  }),
  sources: z
    .array(
      z.object({
        id: Id,
        title: text,
        url: z.url().startsWith("https://"),
        scope: text,
      }),
    )
    .min(1),
  editorial: z.object({
    scenes: z.literal("dramatized"),
    reviewStatus: z.literal("needs-historical-review"),
    caution: text,
    historicalComparison: text,
  }),
  roleTasks: z.object(
    Object.fromEntries(SKILLS.map((k) => [k, text])) as Record<
      (typeof SKILLS)[number],
      typeof text
    >,
  ),
});
export function validateContent(rawPacks: unknown, rawQuiz: unknown): Content {
  const ports = z.array(packSchema).length(12).parse(rawPacks) as ContentPack[];
  const ids = new Set(ports.map((p) => p.port.id));
  if (ids.size !== ports.length) throw new Error("Havne-ID-er må være unike.");
  for (const { port, sources } of ports) {
    const choices = [
      ...port.choices,
      ...(port.hiddenChoice ? [port.hiddenChoice.choice] : []),
    ];
    if (new Set(choices.map((c) => c.id)).size !== choices.length)
      throw new Error(`Duplikatvalg i ${port.id}.`);
    if (
      port.historicalChoiceId &&
      !choices.some((c) => c.id === port.historicalChoiceId)
    )
      throw new Error(`Ugyldig historisk referanse i ${port.id}.`);
    if (new Set(sources.map((s) => s.id)).size !== sources.length)
      throw new Error(`Duplikatkilde i ${port.id}.`);
    for (const c of choices)
      for (const lock of c.locks ?? [])
        if (!ids.has(lock)) throw new Error(`Ukjent havnereferanse: ${lock}.`);
  }
  const skillQuiz = quiz.and(z.object({ source: z.array(Id).min(1) }));
  const bank = z
    .object(
      Object.fromEntries(
        SKILLS.map((k) => [
          k,
          z.object({ tier2: z.array(skillQuiz), tier3: z.array(skillQuiz) }),
        ]),
      ) as Record<
        (typeof SKILLS)[number],
        z.ZodObject<{
          tier2: z.ZodArray<typeof skillQuiz>;
          tier3: z.ZodArray<typeof skillQuiz>;
        }>
      >,
    )
    .parse(rawQuiz);
  for (const skill of SKILLS)
    for (const questions of Object.values(bank[skill]))
      for (const q of questions)
        for (const id of q.source)
          if (!ids.has(id)) throw new Error(`Ukjent quiz-referanse: ${id}.`);
  return { ports, skillQuestions: bank };
}
