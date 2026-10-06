import { z } from "zod";
import { GameSchema, portFor } from "./model";
import type { Content, Game } from "./model";
const Envelope = z
  .object({
    format: z.literal("vikingspill-backup"),
    version: z.literal(2),
    exportedAt: z.number().int(),
    game: GameSchema,
  })
  .strict();
export function validateGame(value: unknown, content: Content): Game {
  const game = GameSchema.parse(value);
  const knownPorts = new Set(content.ports.map((p) => p.port.id));
  const seenMembers = new Set<string>();
  for (const [id, group] of Object.entries(game.groups)) {
    if (
      group.id !== id ||
      (Object.keys(group.members).length && !group.members[group.chiefId])
    )
      throw new Error("Ugyldig skip eller høvding.");
    for (const uid of Object.keys(group.members)) {
      if (seenMembers.has(uid) || game.members[uid]?.groupId !== id)
        throw new Error("Ugyldig medlemskap.");
      seenMembers.add(uid);
    }
    for (const ids of [group.visited, group.locked, group.unlockedSides])
      if (
        new Set(ids).size !== ids.length ||
        ids.some((i) => !knownPorts.has(i))
      )
        throw new Error("Ugyldig havnereferanse.");
    if (group.encounter) {
      const e = group.encounter;
      const pack = portFor(content, e.destId);
      const ids = [
        ...pack.port.choices,
        ...(pack.port.hiddenChoice ? [pack.port.hiddenChoice.choice] : []),
      ].map((c) => c.id);
      if (
        e.choiceIds.some((c) => !ids.includes(c)) ||
        (e.choiceId && !ids.includes(e.choiceId)) ||
        new Set(e.eligible).size !== e.eligible.length ||
        e.eligible.some((uid) => !group.members[uid])
      )
        throw new Error("Ugyldig aktiv runde.");
      for (const [uid, vote] of Object.entries(e.votes))
        if (!e.eligible.includes(uid) || !e.choiceIds.includes(vote.choiceId))
          throw new Error("Ugyldig stemme.");
      for (const answers of Object.values(e.answers))
        if (
          answers.length &&
          (answers.length !== 4 ||
            answers.some((a, i) => a >= pack.port.stedsquiz[i].opts.length))
        )
          throw new Error("Ugyldige quizsvar.");
      if (
        e.settled !== !!e.roll ||
        (e.settled && !group.saga.some((s) => s.id === e.id))
      )
        throw new Error("Ufullstendig oppgjør.");
    }
    if (new Set(group.saga.map((s) => s.id)).size !== group.saga.length)
      throw new Error("Duplikatoppgjør.");
    for (const saga of group.saga) {
      const pack = portFor(content, saga.destId);
      const choice = [
        ...pack.port.choices,
        ...(pack.port.hiddenChoice ? [pack.port.hiddenChoice.choice] : []),
      ].find((c) => c.id === saga.choiceId);
      if (
        !choice?.outcomes[saga.roll.tier] ||
        !group.visited.includes(saga.destId)
      )
        throw new Error("Ugyldig saga.");
    }
    if (group.trial) {
      const trial = group.trial;
      const bank =
        content.skillQuestions[trial.skill][
          trial.level === 1 ? "tier2" : "tier3"
        ];
      if (
        !group.members[trial.ownerId] ||
        trial.questionIndices.length !== (trial.level === 1 ? 3 : 4) ||
        trial.questionIndices.some((i) => !bank[i]) ||
        trial.answers.some(
          (a, i) => a >= bank[trial.questionIndices[i]].opts.length,
        )
      )
        throw new Error("Ugyldig svenneprøve.");
    }
  }
  for (const [uid, m] of Object.entries(game.members))
    if (m.groupId && (!game.groups[m.groupId] || !seenMembers.has(uid)))
      throw new Error("Ukjent skip i medlemslisten.");
  for (const trade of Object.values(game.trades))
    if (
      !game.groups[trade.from] ||
      !game.groups[trade.to] ||
      trade.from === trade.to
    )
      throw new Error("Ugyldig handel.");
  return game;
}
export function makeBackup(game: Game, now: number) {
  return {
    format: "vikingspill-backup" as const,
    version: 2 as const,
    exportedAt: now,
    game,
  };
}
export function parseBackup(text: string, content: Content): Game {
  if (text.length > 4_000_000)
    throw new Error("Sikkerhetskopien er for stor (maks 4 MB).");
  const envelope = Envelope.parse(JSON.parse(text));
  return validateGame(envelope.game, content);
}
