import { z } from "zod";
import { GameSchema, portFor } from "./model";
import type { Content, Game } from "./model";
import { trialBank, trialRoute } from "./trials";
import { PARTY_GAMES, partyMembers } from "./party";
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
      const bank = trialBank(trial, content);
      if (
        !group.members[trial.ownerId] ||
        trial.questionIndices.length !== (trial.level === 1 ? 3 : 4) ||
        trial.questionIndices.some((i) => !bank[i]) ||
        trial.answers.some(
          (a, i) => a >= bank[trial.questionIndices[i]].opts.length,
        )
      )
        throw new Error("Ugyldig svenneprøve.");
      if (
        trial.bankVersion === "journey-v1" &&
        (JSON.stringify(trial.requiredPorts) !==
          JSON.stringify(trialRoute(trial.skill, trial.level).ports) ||
          trial.requiredPorts.some((id) => !group.visited.includes(id)) ||
          trial.questionIndices.some((i) =>
            bank[i].source.some((id) => !group.visited.includes(id)),
          ))
      )
        throw new Error("Svenneprøven mangler fullførte havnebesøk.");
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
  for (const [id, c] of Object.entries(game.challenges)) {
    const roster = Object.values(c.roster).flat();
    const legacy = !roster.length;
    if (
      c.id !== id ||
      new Set(c.groups).size !== c.groups.length ||
      c.groups.some((g) => !game.groups[g]) ||
      new Set(roster).size !== roster.length ||
      Object.keys(c.roster).some((g) => !c.groups.includes(g)) ||
      c.winnerIds.some((g) => !c.groups.includes(g)) ||
      (c.winnerId && !c.groups.includes(c.winnerId))
    )
      throw new Error("Ugyldig laglek.");
    if (
      !legacy &&
      (c.groups.some((g) => !c.roster[g]?.length) ||
        c.ready.some((uid) => !roster.includes(uid)) ||
        Object.keys(c.excused).some((uid) => !roster.includes(uid)) ||
        Object.entries(c.results).some(
          ([uid, score]) =>
            !roster.includes(uid) ||
            !c.ready.includes(uid) ||
            (PARTY_GAMES[c.activity].digital
              ? score > PARTY_GAMES[c.activity].duration * 25
              : score !== 0),
        ) ||
        (c.phase === "playing" &&
          (c.startsAt === null ||
            c.endsAt !== c.startsAt + PARTY_GAMES[c.activity].duration * 1000 ||
            c.groups
              .flatMap((g) => partyMembers(c, g))
              .some((uid) => !c.ready.includes(uid)))))
    )
      throw new Error("Ugyldig deltakelse eller tid i lagleken.");
  }
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
