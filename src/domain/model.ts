import { z } from "zod";
import type { Choice, Destination, SkillKey } from "../types";

export const SKILLS = [
  "språk",
  "sjømannskap",
  "krigskunst",
  "diplomati",
  "tro",
] as const;
export const GOODS = [
  "pelsverk",
  "solv",
  "jern",
  "rav",
  "silke",
  "hvalrosstann",
  "krydder",
  "salt",
] as const;
export const Id = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);
export const Code = z.string().regex(/^[A-Z]{4}$/);
const ShortText = z.string().trim().min(2).max(80);
const Note = z.string().trim().min(20).max(2000);
const Skill = z.enum(SKILLS);
const GoodsMap = z.partialRecord(
  z.enum(GOODS),
  z.number().int().min(0).max(10000),
);
const Scores = z.object({
  culturalUnderstanding: z.number().int(),
  tradeGain: z.number().int(),
  reputation: z.number().int(),
});
export const SettingsSchema = z.object({
  minutes: z.union([z.literal(45), z.literal(90)]).default(45),
  textLength: z.enum(["short", "full", "group"]).default("group"),
  requireQuiz: z.boolean().default(true),
  requireCouncil: z.boolean().default(true),
  requireSaga: z.boolean().default(true),
  requirePerspective: z.boolean().default(true),
  requireBridge: z.boolean().default(true),
  keyCards: z.boolean().default(true),
  saboteur: z.boolean().default(false),
});
export type Settings = z.infer<typeof SettingsSchema>;
export const DEFAULT_SETTINGS = SettingsSchema.parse({});
export const EvidenceSchema = z.object({
  fact: Note,
  interpretation: Note,
  perspective: z.string().trim().max(2000),
  sourceId: Id,
});
export type Evidence = z.infer<typeof EvidenceSchema>;
export const RubricSchema = z.object({
  reasoning: z.number().int().min(0).max(2),
  sourceUse: z.number().int().min(0).max(2),
  perspective: z.number().int().min(0).max(2),
  feedback: z.string().trim().min(5).max(1000),
});
export type Rubric = z.infer<typeof RubricSchema>;
export const TierSchema = z.enum(["bad", "mid", "good", "crit"]);
export const RollSchema = z.object({
  dice: z.array(z.number().int().min(1).max(6)).min(1).max(2),
  raw: z.number().int().min(1).max(6),
  effective: z.number().int().min(1).max(6),
  penalty: z.number().int().min(-1).max(0),
  advantage: z.boolean(),
  tier: TierSchema,
});
export type Roll = z.infer<typeof RollSchema>;
const MemberSchema = z.object({
  role: Skill,
  joinedAt: z.number().int(),
  label: ShortText,
});
export const CardSchema = z.object({
  holderId: Id,
  kind: z.enum(["honest", "agenda"]),
  text: z.string(),
  favors: Id,
  reveal: z.string(),
});
const VoteSchema = z.object({
  choiceId: Id,
  note: z.string().trim().min(10).max(600),
  suspicion: z.boolean().default(false),
});
const EncounterSchema = z.object({
  id: Id,
  destId: Id,
  phase: z.enum([
    "sailing",
    "reading",
    "tasks",
    "council",
    "decision",
    "result",
    "reflection",
  ]),
  settings: SettingsSchema,
  arrivesAt: z.number().int(),
  eligible: z.array(Id),
  excused: z.record(Id, z.string()),
  evidence: z.record(Id, EvidenceSchema),
  answers: z.record(Id, z.array(z.number().int().min(0).max(5))),
  votes: z.record(Id, VoteSchema),
  choiceIds: z.array(Id),
  topIds: z.array(Id),
  choiceId: Id.nullable(),
  reason: z.string(),
  reflection: z.string(),
  card: CardSchema.nullable(),
  approval: z.enum(["none", "pending", "approved", "rejected"]),
  approvalFeedback: z.string(),
  roll: RollSchema.nullable(),
  settled: z.boolean(),
  interlude: z
    .object({
      id: Id,
      choiceId: Id.nullable(),
      text: z.string(),
      roll: z.number().int().min(1).max(6).nullable(),
      bonus: z.number().int(),
    })
    .nullable(),
});
export type Encounter = z.infer<typeof EncounterSchema>;
const TrialSchema = z.object({
  id: Id,
  ownerId: Id,
  skill: Skill,
  level: z.union([z.literal(1), z.literal(2)]),
  questionIndices: z.array(z.number().int().min(0)),
  answers: z.array(z.number().int().min(0).max(5)),
  phase: z.enum(["quiz", "practice", "pending", "failed", "passed"]),
  practice: z.string(),
  feedback: z.string(),
});
const SagaSchema = z.object({
  id: Id,
  destId: Id,
  destName: z.string(),
  choiceId: Id,
  choiceTitle: z.string(),
  reason: z.string(),
  at: z.number().int(),
  roll: RollSchema,
  trade: z.number().int(),
  reputation: z.number().int(),
  goods: GoodsMap,
  quiz: z.record(
    Id,
    z.object({ correct: z.number().int(), total: z.number().int() }),
  ),
  evidence: z.record(Id, EvidenceSchema),
  reflection: z.string(),
  historicalComparison: z.string(),
  cardReveal: z.string(),
  honors: z.array(Id),
  assessment: RubricSchema.nullable(),
});
export type Saga = z.infer<typeof SagaSchema>;
const TingSchema = z
  .object({
    id: Id,
    candidateId: Id,
    incumbentId: Id,
    eligible: z.array(Id),
    votes: z.record(Id, Id),
    startedAt: z.number().int(),
  })
  .nullable();
export const GroupSchema = z.object({
  id: Id,
  version: z.number().int().min(0),
  shipName: ShortText,
  shipSymbol: z.enum(["drage", "ulv", "ravn"]),
  shipColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  members: z.record(Id, MemberSchema),
  chiefId: Id,
  scores: Scores,
  svennebrev: z.object({
    språk: z.union([z.literal(0), z.literal(1), z.literal(2)]),
    sjømannskap: z.union([z.literal(0), z.literal(1), z.literal(2)]),
    krigskunst: z.union([z.literal(0), z.literal(1), z.literal(2)]),
    diplomati: z.union([z.literal(0), z.literal(1), z.literal(2)]),
    tro: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  }),
  conditions: z.partialRecord(Skill, z.number().int().min(-2).max(2)),
  goods: GoodsMap,
  visited: z.array(Id),
  locked: z.array(Id),
  unlockedSides: z.array(Id),
  performedActions: z.array(Id),
  saga: z.array(SagaSchema),
  encounter: EncounterSchema.nullable(),
  trial: TrialSchema.nullable(),
  ting: TingSchema,
  lastTingAt: z.number().int(),
  cardCounts: z.record(Id, z.number().int().min(0)),
  notices: z.array(
    z.object({
      id: Id,
      title: z.string(),
      text: z.string(),
      at: z.number().int(),
      ackedBy: z.array(Id),
    }),
  ),
  seenJourneys: z.array(Id),
  lastJourneyVisits: z.number().int().min(0),
});
export type Group = z.infer<typeof GroupSchema>;
const TradeSchema = z.object({
  id: Id,
  from: Id,
  to: Id,
  offer: GoodsMap,
  request: GoodsMap,
  status: z.enum(["pending", "accepted", "rejected"]),
  at: z.number().int(),
  resolvedAt: z.number().int().nullable(),
});
export type Trade = z.infer<typeof TradeSchema>;
const ChallengeSchema = z.object({
  id: Id,
  kind: z.enum(["trial", "duel"]),
  groups: z.array(Id).min(1),
  title: ShortText,
  status: z.enum(["open", "resolved"]),
  winnerId: Id.nullable(),
});
export const GameSchema = z.object({
  schemaVersion: z.literal(2),
  contentVersion: z.literal(1),
  code: Code,
  mode: z.enum(["classroom", "solo"]),
  teacherUid: Id,
  version: z.number().int().min(0),
  createdAt: z.number().int(),
  endsAt: z.number().int(),
  closed: z.boolean(),
  settings: SettingsSchema,
  members: z.record(Id, z.object({ groupId: Id.nullable() })),
  groups: z.record(Id, GroupSchema),
  trades: z.record(Id, TradeSchema),
  challenges: z.record(Id, ChallengeSchema),
  receipts: z.record(z.string(), z.number().int().min(0)),
  log: z.array(
    z.object({
      id: Id,
      actorId: Id,
      groupId: Id.nullable(),
      at: z.number().int(),
      seed: z.number().int(),
      presence: z.record(Id, z.number().int()),
      command: z.record(z.string(), z.unknown()),
      message: z.string(),
    }),
  ),
});
export type Game = z.infer<typeof GameSchema>;
const commandBase = {
  id: Id,
  expectedVersion: z.number().int().min(0),
  groupId: Id.optional(),
  encounterId: Id.optional(),
  trialId: Id.optional(),
};
const command = <K extends string, T extends z.ZodRawShape>(
  type: K,
  shape: T,
) => z.object({ ...commandBase, type: z.literal(type), ...shape }).strict();
export const CommandSchema = z.union([
  command("join", {}),
  command("create_ship", {
    shipName: ShortText,
    shipSymbol: z.enum(["drage", "ulv", "ravn"]),
    shipColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    role: Skill,
    label: ShortText,
  }),
  command("join_ship", { role: Skill, label: ShortText }),
  command("leave_ship", {}),
  command("sail", { destId: Id }),
  command("arrive", {}),
  command("advance", {}),
  command("journey_choice", { choiceId: Id }),
  command("contribute", {
    evidence: EvidenceSchema,
    answers: z.array(z.number().int().min(0).max(5)).max(4),
  }),
  command("vote", {
    choiceId: Id,
    note: z.string().trim().min(10).max(600),
    suspicion: z.boolean(),
  }),
  command("decide", { choiceId: Id, reason: z.string().trim().max(2000) }),
  command("roll", {}),
  command("reflect", {
    reflection: z.string().trim().max(2000),
    historicalComparison: z.string().trim().min(20).max(2000),
  }),
  command("finish", {}),
  command("action", { actionId: Id }),
  command("transfer", { memberId: Id }),
  command("take_helm", {}),
  command("call_ting", { candidateId: Id }),
  command("ting_vote", { candidateId: Id }),
  command("start_trial", { skill: Skill }),
  command("answer_trial", {
    answers: z.array(z.number().int().min(0).max(5)).min(3).max(4),
  }),
  command("practice", { text: Note }),
  command("close_trial", {}),
  command("offer_trade", { to: Id, offer: GoodsMap, request: GoodsMap }),
  command("accept_trade", { tradeId: Id }),
  command("reject_trade", { tradeId: Id }),
  command("challenge", { to: Id, title: ShortText }),
  command("ack", { noticeId: Id }),
  command("settings", { settings: SettingsSchema }),
  command("close_game", {}),
  command("excuse", {
    memberId: Id,
    reason: z.string().trim().min(10).max(600),
  }),
  command("approve_task", {
    approved: z.boolean(),
    feedback: z.string().trim().min(5).max(1000),
  }),
  command("approve_trial", {
    approved: z.boolean(),
    feedback: z.string().trim().min(5).max(1000),
  }),
  command("assess", { sagaId: Id, rubric: RubricSchema }),
  command("event", {
    kind: z.enum(["fate", "ragnarok", "trial", "summon"]),
    title: ShortText,
    message: z.string().trim().max(600),
  }),
  command("resolve_challenge", { challengeId: Id, winnerId: Id }),
]);
// The schema intentionally accepts only intent: scores, dice and final outcomes are never inputs.
export type Command = z.infer<typeof CommandSchema>;
export type Actor = {
  uid: string;
  now: number;
  seed: number;
  presence: Record<string, number>;
};
export type Source = { id: string; title: string; url: string; scope: string };
export type ContentPack = {
  version: 1;
  port: Destination;
  sources: Source[];
  editorial: {
    scenes: "dramatized";
    reviewStatus: "needs-historical-review";
    caution: string;
    historicalComparison: string;
  };
  roleTasks: Record<SkillKey, string>;
};
export type Content = {
  ports: ContentPack[];
  skillQuestions: Record<
    SkillKey,
    {
      tier2: {
        q: string;
        opts: string[];
        correct: number;
        feedback: string;
        source: string[];
      }[];
      tier3: {
        q: string;
        opts: string[];
        correct: number;
        feedback: string;
        source: string[];
      }[];
    }
  >;
};
export type GroupView = Omit<
  Group,
  "encounter" | "ting" | "trial" | "cardCounts"
> & {
  encounter:
    | (Omit<Encounter, "votes" | "card" | "answers"> & {
        votedCount: number;
        quizResults: Record<string, { correct: number; total: number }>;
        cardAvailable: boolean;
        voteCounts: Record<string, number>;
      })
    | null;
  trial:
    | (Omit<NonNullable<Group["trial"]>, "questionIndices" | "answers"> & {
        questions: { q: string; opts: string[] }[];
        correct: number | null;
      })
    | null;
  ting:
    | (Omit<NonNullable<Group["ting"]>, "votes"> & { votedCount: number })
    | null;
};
export type PrivateView = {
  vote: z.infer<typeof VoteSchema> | null;
  card: z.infer<typeof CardSchema> | null;
  tingVote: string | null;
  answers: number[];
  trialAnswers: number[];
};
export type PublicView = {
  code: string;
  version: number;
  settings: Settings;
  endsAt: number;
  closed: boolean;
  groups: Record<
    string,
    Pick<
      Group,
      | "id"
      | "shipName"
      | "shipColor"
      | "shipSymbol"
      | "version"
      | "chiefId"
      | "members"
      | "visited"
      | "scores"
      | "goods"
      | "notices"
    > & {
      phase: string;
      destId: string | null;
      pendingTask: boolean;
      pendingTrial: boolean;
      learningReviews: number;
    }
  >;
  trades: Record<string, Trade>;
  challenges: Game["challenges"];
};
export function portFor(content: Content, id: string): ContentPack {
  const pack = content.ports.find((p) => p.port.id === id);
  if (!pack) throw new Error("Ukjent havn.");
  return pack;
}
export function availableChoices(
  group: Group | GroupView,
  port: Destination,
): Choice[] {
  const hidden = port.hiddenChoice;
  const unlocked =
    hidden &&
    (group.svennebrev[hidden.unlock.skill] >= (hidden.unlock.nivå ?? 1) ||
      Object.values(group.members).some((m) => m.role === hidden.unlock.skill));
  return unlocked ? [...port.choices, hidden.choice] : port.choices;
}
export const emptyBrev = () =>
  ({ språk: 0, sjømannskap: 0, krigskunst: 0, diplomati: 0, tro: 0 }) as const;
