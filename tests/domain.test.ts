import { SKJEBNEMOTER } from "../src/data/skjebnemoter";
import { test } from "node:test";
import assert from "node:assert/strict";
import { content } from "../src/content";
import { validateContent } from "../src/content/validate";
import packs from "../src/content/packs.json";
import quiz from "../src/data/vikingspill_quiz.json";
import {
  applyCommand,
  expectedVersion,
  groupView,
  hasAdvantage,
  newGame,
  privateView,
  projectGame,
  RuleError,
} from "../src/domain/engine";
import { makeBackup, parseBackup } from "../src/domain/backup";
import { effectiveOdds, resolveRoll } from "../src/domain/odds";
import { seededRandom, shuffle } from "../src/domain/random";
import type { SkillKey } from "../src/types";
import { HELM_FAILOVER_MS, type Game as EngineGame } from "../src/domain/model";
import type { Intent } from "../src/classroom/store";
import { replayCommands } from "../src/domain/replay";
import { trialBank } from "../src/domain/trials";

const now = 1_000_000;
let counter = 0;
function run(
  game: EngineGame,
  uid: string,
  intent: Intent,
  time = now,
  seed = 123,
) {
  return applyCommand(
    game,
    {
      ...intent,
      id: `c-${++counter}`,
      expectedVersion: expectedVersion(game, intent),
    },
    {
      uid,
      now: time,
      seed,
      presence: { a: time, b: time, c: time, d: time, x: time },
    },
    content,
  );
}
function fixture() {
  let g = newGame("TEST", "teacher", now);
  for (const uid of ["teacher", "a", "b", "c", "d", "x"])
    g = run(g, uid, { type: "join" });
  g = run(g, "a", {
    type: "create_ship",
    groupId: "ship",
    shipName: "Ravnen",
    shipColor: "#2B6B6B",
    shipSymbol: "ravn",
    role: "språk",
    label: "Elev A",
  });
  for (const [uid, role] of [
    ["b", "sjømannskap"],
    ["c", "diplomati"],
    ["d", "tro"],
  ] as [string, SkillKey][])
    g = run(g, uid, {
      type: "join_ship",
      groupId: "ship",
      role,
      label: `Elev ${uid}`,
    });
  g = run(g, "x", {
    type: "create_ship",
    groupId: "other",
    shipName: "Ulven",
    shipColor: "#4B6C5B",
    shipSymbol: "ulv",
    role: "krigskunst",
    label: "Elev X",
  });
  return g;
}
function tasks(g = fixture()) {
  g = run(g, "a", { type: "sail", groupId: "ship", destId: "lindisfarne" });
  g = run(g, "b", { type: "arrive", groupId: "ship" }, now + 3001);
  return run(g, "a", { type: "advance", groupId: "ship" }, now + 3002);
}
function ready(g = tasks(), correct = true) {
  const questions = content.ports[0].port.stedsquiz;
  for (const uid of ["a", "b", "c", "d"])
    g = run(g, uid, {
      type: "contribute",
      groupId: "ship",
      evidence: {
        fact: "Klosteret beskrives som et viktig religiøst sted.",
        interpretation: "Dette gir oss grunn til å lytte før vi handler.",
        perspective: "Munkene kan oppleve møtet som en alvorlig trussel.",
        sourceId: "game-material",
      },
      answers: questions.map((q) =>
        correct ? q.correct : (q.correct + 1) % q.opts.length,
      ),
    });
  return run(g, "a", { type: "advance", groupId: "ship" });
}
function decision(g = ready(), votes = ["spare", "spare", "plunder", "spare"]) {
  for (const [i, uid] of ["a", "b", "c", "d"].entries())
    g = run(g, uid, {
      type: "vote",
      groupId: "ship",
      choiceId: votes[i],
      note: "Vi må undersøke den andre partens perspektiv.",
      suspicion: false,
    });
  return g;
}
function settled(g = decision()) {
  g = run(g, "a", {
    type: "decide",
    groupId: "ship",
    choiceId: "spare",
    reason: "Vi velger å spare klosteret fordi begge perspektiver må telle.",
  });
  return run(g, "a", { type: "roll", groupId: "ship" });
}

test("all twelve packs and every quiz/reference are validated", () =>
  assert.equal(content.ports.length, 12));

test("captured commands replay the entire classroom with identical private state and dice", () => {
  const game = settled();
  assert.deepEqual(
    replayCommands(newGame("TEST", "teacher", now), game.log, content),
    game,
  );
});
test("requirements are frozen at departure so a setting change cannot bypass a majority", () => {
  let game = ready();
  game = run(game, "teacher", {
    type: "settings",
    settings: { ...game.settings, requireCouncil: false, requireQuiz: false },
  });
  game = decision(game);
  assert.throws(
    () =>
      run(game, "a", {
        type: "decide",
        groupId: "ship",
        choiceId: "plunder",
        reason: "Jeg prøver å overstyre flertallet etter en endring.",
      }),
    /flertallet/,
  );
  assert.equal(game.groups.ship.encounter?.settings.requireCouncil, true);
});
test("optional perspective works for the next round but does not relax a current round", () => {
  let game = fixture();
  game = run(game, "teacher", {
    type: "settings",
    settings: {
      ...game.settings,
      requirePerspective: false,
      requireQuiz: false,
    },
  });
  game = tasks(game);
  game = run(game, "a", {
    type: "contribute",
    groupId: "ship",
    evidence: {
      fact: "Dette er en konkret opplysning i den dramatiserte teksten.",
      interpretation:
        "Denne opplysningen påvirker valget fordi vi må vurdere risiko.",
      perspective: "",
      sourceId: "game-material",
    },
    answers: [],
  });
  assert.equal(game.groups.ship.encounter?.evidence.a.perspective, "");
});
test("backup rejects one-way membership claims and an active trial prevents leaving", () => {
  const game = fixture();
  game.members.ghost = { groupId: "ship" };
  assert.throws(
    () => parseBackup(JSON.stringify(makeBackup(game, now)), content),
    /medlemslisten/,
  );
  delete game.members.ghost;
  game.groups.ship.visited = content.ports.map((p) => p.port.id);
  const trial = run(game, "a", {
    type: "start_trial",
    groupId: "ship",
    skill: "språk",
  });
  assert.throws(
    () => run(trial, "a", { type: "leave_ship", groupId: "ship" }),
    /prøven/,
  );
});
test("teacher can assess after closing the session without enabling student actions", () => {
  let game = settled();
  game = run(game, "teacher", { type: "close_game" });
  const sagaId = game.groups.ship.saga[0].id;
  game = run(game, "teacher", {
    type: "assess",
    groupId: "ship",
    sagaId,
    rubric: {
      reasoning: 2,
      sourceUse: 1,
      perspective: 2,
      feedback: "God begrunnelse og nyansert perspektiv.",
    },
  });
  assert.equal(game.groups.ship.scores.culturalUnderstanding, 5);
  assert.throws(
    () => run(game, "a", { type: "advance", groupId: "ship" }),
    /avsluttet/,
  );
});
test("journey settlement survives retries and never grants unearned competence", () => {
  const initial = fixture();
  initial.groups.ship.visited = ["lindisfarne", "hedeby"];
  let game = initial;
  for (let seed = 1; seed < 200; seed++) {
    game = run(
      initial,
      "a",
      { type: "sail", groupId: "ship", destId: "paris" },
      now,
      seed,
    );
    if (game.groups.ship.encounter?.interlude) break;
  }
  const interlude = game.groups.ship.encounter!.interlude!;
  assert.ok(interlude);
  assert.throws(
    () => run(game, "b", { type: "arrive", groupId: "ship" }, now + 4000),
    /skjebnemøtet/,
  );
  const command = {
    type: "journey_choice",
    choiceId: SKJEBNEMOTER.find((j) => j.id === interlude.id)!.choices[0].id,
    groupId: "ship",
    id: "journey-once",
    expectedVersion: game.groups.ship.version,
  };
  const actor = { uid: "a", now: now + 4000, seed: 12, presence: {} };
  const next = applyCommand(game, command, actor, content);
  assert.deepEqual(next.groups.ship.svennebrev, game.groups.ship.svennebrev);
  assert.deepEqual(applyCommand(next, command, actor, content), next);
  assert.equal(
    run(next, "b", { type: "arrive", groupId: "ship" }, now + 4001).groups.ship
      .encounter?.phase,
    "reading",
  );
});
test("content rejects broken probabilities, answer keys and choice references", () => {
  for (const mutate of [
    (p: typeof packs) => {
      p[0].port.choices[0].baseRoll.bad = 9;
    },
    (p: typeof packs) => {
      p[0].port.stedsquiz[0].correct = 99;
    },
    (p: typeof packs) => {
      p[0].port.historicalChoiceId = "missing";
    },
  ]) {
    const copy = structuredClone(packs);
    mutate(copy);
    assert.throws(() => validateContent(copy, quiz));
  }
});
test("only teacher can change settings, trigger events, grade or award a challenge", () => {
  const g = fixture();
  for (const intent of [
    { type: "settings", settings: g.settings },
    { type: "event", kind: "ragnarok", title: "Ragnarok", message: "" },
    { type: "close_game" },
  ] as Intent[])
    assert.throws(() => run(g, "b", intent), /Bare spillets lærer/);
});
test("a client cannot send fabricated scores, dice or final outcomes", () => {
  const g = decision();
  for (const injected of [
    { scores: { tradeGain: 10000 } },
    { dice: [6] },
    { finalOutcome: "crit" },
  ])
    assert.throws(
      () =>
        applyCommand(
          g,
          {
            type: "roll",
            groupId: "ship",
            id: "forged",
            expectedVersion: g.groups.ship.version,
            ...injected,
          },
          { uid: "a", now, seed: 1, presence: {} },
          content,
        ),
      /ugyldige/,
    );
});
test("outsiders and ordinary members cannot sail or impersonate the chief", () => {
  const g = fixture();
  assert.throws(
    () => run(g, "x", { type: "sail", groupId: "ship", destId: "lindisfarne" }),
    /ikke medlem/,
  );
  assert.throws(
    () => run(g, "b", { type: "sail", groupId: "ship", destId: "lindisfarne" }),
    /Bare høvdingen/,
  );
});
test("crew membership has no assigned roles and rejoining preserves join time", () => {
  const g = fixture();
  assert.throws(
    () =>
      run(g, "x", {
        type: "join_ship",
        groupId: "ship",
        role: "språk",
        label: "Elev X",
      }),
    /annet skip/,
  );
  const withoutRole = run(g, "b", {
    type: "join_ship",
    groupId: "ship",
    label: "Elev B",
  });
  assert(!Object.hasOwn(withoutRole.groups.ship.members.b, "role"));
  const next = run(
    g,
    "b",
    {
      type: "join_ship",
      groupId: "ship",
      role: "sjømannskap",
      label: "Elev B",
    },
    now + 10000,
  );
  assert.equal(
    next.groups.ship.members.b.joinedAt,
    g.groups.ship.members.b.joinedAt,
  );
});
test("deadline lives in state and a reloaded member can complete the seilas", () => {
  let g = fixture();
  g = run(g, "a", { type: "sail", groupId: "ship", destId: "lindisfarne" });
  const reload = parseBackup(JSON.stringify(makeBackup(g, now)), content);
  assert.throws(
    () => run(reload, "b", { type: "arrive", groupId: "ship" }),
    /pågår/,
  );
  assert.equal(
    run(reload, "b", { type: "arrive", groupId: "ship" }, now + 3001).groups
      .ship.encounter?.phase,
    "reading",
  );
});
test("chief cannot skip individual evidence or quiz", () =>
  assert.throws(
    () => run(tasks(), "a", { type: "advance", groupId: "ship" }),
    /Alle i rundens/,
  ));
test("member contributions are immutable and do not overwrite peers", () => {
  const g = ready();
  assert.equal(Object.keys(g.groups.ship.encounter!.evidence).length, 4);
  assert.throws(
    () =>
      run(g, "a", {
        type: "contribute",
        groupId: "ship",
        evidence: g.groups.ship.encounter!.evidence.a,
        answers: [0, 0, 0, 0],
      }),
    /steget/,
  );
});
test("private votes and card holder are absent from every shared projection", () => {
  let g = ready();
  g.groups.ship.encounter!.card = {
    holderId: "b",
    kind: "agenda",
    text: "secret-brief",
    favors: "plunder",
    reveal: "later",
  };
  g = run(g, "a", {
    type: "vote",
    groupId: "ship",
    choiceId: "spare",
    note: "secret-vote-note",
    suspicion: false,
  });
  const shared = JSON.stringify(groupView(g.groups.ship, content));
  assert(!shared.includes("secret-brief"));
  assert(!shared.includes("secret-vote-note"));
  assert(!shared.includes("holderId"));
  assert.equal(privateView(g.groups.ship, "a").vote?.choiceId, "spare");
  assert.equal(privateView(g.groups.ship, "a").card, null);
  assert.equal(privateView(g.groups.ship, "b").card?.text, "secret-brief");
  const projected = projectGame(g, content);
  assert(!projected.publicJson.includes("secret-brief"));
});
test("majority is binding and a chief has no veto", () => {
  const g = decision();
  assert.equal(g.groups.ship.encounter!.choiceId, "spare");
  assert.throws(
    () =>
      run(g, "a", {
        type: "decide",
        groupId: "ship",
        choiceId: "plunder",
        reason: "Jeg vil heller bestemme dette alene.",
      }),
    /flertallet/,
  );
});
test("chief only breaks ties among the tied options", () => {
  const g = decision(ready(), ["spare", "spare", "plunder", "plunder"]);
  assert.deepEqual(g.groups.ship.encounter!.topIds.sort(), [
    "plunder",
    "spare",
  ]);
  assert.throws(
    () =>
      run(g, "a", {
        type: "decide",
        groupId: "ship",
        choiceId: "ransom",
        reason: "Dette var ikke et av de to valgene.",
      }),
    /flertallet/,
  );
});
test("eligible roster is frozen; teacher can excuse a missing learner with a logged reason", () => {
  let g = ready();
  g = run(g, "a", {
    type: "vote",
    groupId: "ship",
    choiceId: "spare",
    note: "Vi må lytte til de andre.",
    suspicion: false,
  });
  for (const uid of ["b", "c", "d"])
    g = run(g, "teacher", {
      type: "excuse",
      groupId: "ship",
      memberId: uid,
      reason: "Enheten har gått tom for strøm.",
    });
  assert.equal(g.groups.ship.encounter!.phase, "decision");
  assert.equal(g.groups.ship.encounter!.eligible.length, 4);
  assert(g.log.at(-1)!.message.includes("tom for strøm"));
});
test("stale concurrent writes are rejected, and retries merge intent with current state", () => {
  const g = ready();
  const version = g.groups.ship.version;
  const command = {
    type: "vote",
    groupId: "ship",
    id: "parallel",
    expectedVersion: version,
    choiceId: "spare",
    note: "Jeg vil lytte før vi handler.",
    suspicion: false,
  };
  const next = run(g, "a", {
    type: "vote",
    groupId: "ship",
    choiceId: "spare",
    note: "Jeg vil også undersøke kildene.",
    suspicion: false,
  });
  assert.throws(
    () =>
      applyCommand(
        next,
        command,
        { uid: "b", now, seed: 0, presence: {} },
        content,
      ),
    (e: unknown) => e instanceof RuleError && e.code === "conflict",
  );
  const retry = applyCommand(
    next,
    { ...command, expectedVersion: next.groups.ship.version },
    { uid: "b", now, seed: 0, presence: {} },
    content,
  );
  assert.equal(Object.keys(retry.groups.ship.encounter!.votes).length, 2);
});
test("roll + goods + saga + visited settle exactly once, even after ambiguous retry", () => {
  const g = settled();
  const last = g.log.at(-1)!;
  const replay = applyCommand(
    g,
    last.command,
    { uid: last.actorId, now, seed: 999, presence: {} },
    content,
  );
  assert.equal(replay, g);
  assert.equal(g.groups.ship.saga.length, 1);
  assert.equal(g.groups.ship.visited.length, 1);
  assert.throws(() => run(g, "a", { type: "roll", groupId: "ship" }), /steget/);
  assert.equal(g.groups.ship.scores.culturalUnderstanding, 0);
});
test("knowledge assessment is independent of fortune and recomputation is idempotent", () => {
  let g = settled();
  const s = g.groups.ship.saga[0];
  const intent = {
    type: "assess",
    groupId: "ship",
    sagaId: s.id,
    rubric: {
      reasoning: 2,
      sourceUse: 1,
      perspective: 2,
      feedback: "Godt begrunnet med ulike perspektiver.",
    },
  } as const;
  g = run(g, "teacher", intent);
  g = run(g, "teacher", intent);
  assert.equal(g.groups.ship.scores.culturalUnderstanding, 5);
});
test("preparation gives at most one reroll; 2/4 is insufficient", () => {
  const g = ready();
  assert(hasAdvantage(g.groups.ship, content));
  for (const id of ["a", "b", "c", "d"])
    g.groups.ship.encounter!.answers[id] = content.ports[0].port.stedsquiz.map(
      (q, i) => (i < 2 ? q.correct : (q.correct + 1) % q.opts.length),
    );
  assert.equal(hasAdvantage(g.groups.ship, content), false);
  g.groups.ship.encounter!.approval = "approved";
  assert.equal(hasAdvantage(g.groups.ship, content), true);
});
test("displayed odds enumerate the same modified/repeated dice used for settlement", () => {
  for (const p of content.ports)
    for (const c of p.port.choices)
      for (const advantage of [true, false])
        for (const penalty of [-1, 0]) {
          const actual = { bad: 0, mid: 0, good: 0, crit: 0 };
          for (let a = 1; a <= 6; a++)
            for (let b = 1; b <= (advantage ? 6 : 1); b++) {
              let i = 0;
              const values = [(a - 0.5) / 6, (b - 0.5) / 6];
              actual[
                resolveRoll(c.baseRoll, advantage, penalty, () => values[i++])
                  .tier
              ]++;
            }
          const odds = effectiveOdds(c.baseRoll, advantage, penalty);
          for (const tier of ["bad", "mid", "good", "crit"] as const)
            assert(
              Math.abs(
                odds[tier] - (actual[tier] * 100) / (advantage ? 36 : 6),
              ) < 1e-8,
            );
        }
});
test("ragnarok is applied once per group by teacher and acknowledgements award nothing", () => {
  let g = fixture();
  g.groups.ship.scores.tradeGain = 9;
  g = run(g, "teacher", {
    type: "event",
    kind: "ragnarok",
    title: "Ragnarok",
    message: "Halvparten av lasten går tapt.",
  });
  assert.equal(g.groups.ship.scores.tradeGain, 5);
  const id = g.groups.ship.notices[0].id;
  for (const uid of ["a", "b", "c", "d"])
    g = run(g, uid, { type: "ack", groupId: "ship", noticeId: id });
  assert.equal(g.groups.ship.scores.tradeGain, 5);
  assert.equal(g.groups.ship.notices[0].ackedBy.length, 4);
});
test("fate updates are atomic and cannot change an earned competence certificate", () => {
  let g = fixture();
  g.groups.ship.svennebrev.sjømannskap = 2;
  for (let i = 0; i < 30; i++)
    g = run(
      g,
      "teacher",
      { type: "event", kind: "fate", title: "Skjebne", message: "" },
      now,
      i,
    );
  assert.equal(g.groups.ship.svennebrev.sjømannskap, 2);
  assert(g.groups.ship.notices.length > 0);
});
test("trade validates latest inventories and settles both groups atomically", () => {
  let g = fixture();
  g.groups.ship.goods.solv = 2;
  g.groups.other.goods.pelsverk = 1;
  g = run(g, "a", {
    type: "offer_trade",
    groupId: "ship",
    to: "other",
    offer: { solv: 2 },
    request: { pelsverk: 1 },
  });
  const tradeId = Object.keys(g.trades)[0];
  const before = structuredClone(g);
  g.groups.ship.goods.solv = 1;
  assert.throws(
    () => run(g, "x", { type: "accept_trade", groupId: "other", tradeId }),
    /brukt varene/,
  );
  g = run(before, "x", { type: "accept_trade", groupId: "other", tradeId });
  assert.equal(g.groups.ship.goods.solv, 0);
  assert.equal(g.groups.other.goods.solv, 2);
  assert.equal(g.groups.ship.goods.pelsverk, 1);
  assert.equal(g.groups.other.goods.pelsverk, 0);
  assert.throws(
    () => run(g, "x", { type: "accept_trade", groupId: "other", tradeId }),
    /allerede avsluttet/,
  );
});
test("special actions enforce costs and requirements in the engine", () => {
  const g = fixture();
  g.groups.ship.visited.push("hedeby");
  assert.throws(
    () =>
      run(g, "a", {
        type: "action",
        groupId: "ship",
        actionId: "hedeby-marked-jern",
      }),
    /mangler/,
  );
  g.groups.ship.scores.tradeGain = 3;
  const next = run(g, "a", {
    type: "action",
    groupId: "ship",
    actionId: "hedeby-marked-jern",
  });
  assert.equal(next.groups.ship.scores.tradeGain, 0);
  assert.equal(next.groups.ship.goods.jern, 2);
  assert.throws(
    () =>
      run(next, "a", {
        type: "action",
        groupId: "ship",
        actionId: "hedeby-marked-jern",
      }),
    /allerede utført/,
  );
});
test("takeover waits for disconnect grace and survives old chief disappearing", () => {
  const g = fixture();
  const command = {
    type: "take_helm",
    groupId: "ship",
    id: "takeover",
    expectedVersion: g.groups.ship.version,
  };
  assert.throws(
    () =>
      applyCommand(
        g,
        command,
        {
          uid: "b",
          now,
          seed: 0,
          presence: { a: now - (HELM_FAILOVER_MS - 1000) },
        },
        content,
      ),
    /fristen/,
  );
  const next = applyCommand(
    g,
    command,
    {
      uid: "b",
      now,
      seed: 0,
      presence: { a: now - (HELM_FAILOVER_MS + 1000) },
    },
    content,
  );
  assert.equal(next.groups.ship.chiefId, "b");
});
test("teacher can remove a stale member without resetting ship progress", () => {
  let g = fixture();
  g.groups.ship.visited = ["lindisfarne"];
  g.groups.ship.scores.tradeGain = 7;

  g = run(g, "teacher", {
    type: "remove_member",
    groupId: "ship",
    memberId: "d",
  });

  assert.equal(g.groups.ship.members.d, undefined);
  assert.equal(g.members.d.groupId, null);
  assert.deepEqual(g.groups.ship.visited, ["lindisfarne"]);
  assert.equal(g.groups.ship.scores.tradeGain, 7);
});

test("teacher removing the chief hands the helm to a remaining member", () => {
  const g = run(fixture(), "teacher", {
    type: "remove_member",
    groupId: "ship",
    memberId: "a",
  });
  assert.equal(g.groups.ship.members.a, undefined);
  assert.ok(g.groups.ship.members[g.groups.ship.chiefId]);
  assert.notEqual(g.groups.ship.chiefId, "a");
});

test("ting is resolved by the engine without depending on the old chief device", () => {
  let g = fixture();
  g = run(g, "b", { type: "call_ting", groupId: "ship", candidateId: "b" });
  for (const uid of ["a", "b", "c", "d"])
    g = run(g, uid, { type: "ting_vote", groupId: "ship", candidateId: "b" });
  assert.equal(g.groups.ship.chiefId, "b");
  assert.equal(g.groups.ship.ting, null);
});
test("trial owner, valid answers and teacher practice approval are enforced", () => {
  let g = fixture();
  g.groups.ship.visited = content.ports.map((p) => p.port.id);
  g = run(g, "a", { type: "start_trial", groupId: "ship", skill: "språk" });
  assert.throws(
    () => run(g, "b", { type: "close_trial", groupId: "ship" }),
    /eies/,
  );
  const trial = g.groups.ship.trial!;
  const bank = trialBank(trial, content);
  g = run(g, "a", {
    type: "answer_trial",
    groupId: "ship",
    answers: trial.questionIndices.map((i) => bank[i].correct),
  });
  g = run(g, "a", {
    type: "practice",
    groupId: "ship",
    text: "Jeg skiller mellom utsagn i teksten og min egen tolkning av møtet.",
  });
  assert.throws(
    () =>
      run(g, "b", {
        type: "approve_trial",
        groupId: "ship",
        approved: true,
        feedback: "Vi vil gi oss selv et brev.",
      }),
    /Bare spillets lærer/,
  );
  g = run(g, "teacher", {
    type: "approve_trial",
    groupId: "ship",
    approved: true,
    feedback: "God utførelse med en tydelig faglig begrunnelse.",
  });
  assert.equal(g.groups.ship.svennebrev.språk, 1);
});
test("backup rejects unsupported versions, malformed codes, foreign references and arbitrary data", () => {
  const original = makeBackup(fixture(), now);
  for (const bad of [
    { ...original, version: 999 },
    { ...original, game: { ...original.game, code: "INVALID" } },
    { ...original, game: 42 },
  ])
    assert.throws(() => parseBackup(JSON.stringify(bad), content));
  const bad = structuredClone(original);
  bad.game.groups.ship.visited = ["invented"];
  assert.throws(() => parseBackup(JSON.stringify(bad), content), /havne/);
});
test("backup preserves an active round, sealed votes and receipts without duplication", () => {
  const g = decision();
  assert.deepEqual(parseBackup(JSON.stringify(makeBackup(g, now)), content), g);
});
test("random seeds replay identically; Fisher–Yates preserves every item", () => {
  const a = seededRandom(999),
    b = seededRandom(999);
  for (let i = 0; i < 100; i++) assert.equal(a(), b());
  assert.deepEqual(shuffle([1, 2, 3, 4], seededRandom(8)).sort(), [1, 2, 3, 4]);
});

test("a durable command from an earlier encounter cannot affect a later round", () => {
  const game = tasks();
  assert.throws(
    () =>
      applyCommand(
        game,
        {
          type: "advance",
          id: "stale-round",
          groupId: "ship",
          encounterId: "previous-round",
          expectedVersion: game.groups.ship.version,
        },
        { uid: "a", now, seed: 1, presence: {} },
        content,
      ),
    /tidligere kulturmøte/,
  );
  assert.equal(game.groups.ship.encounter?.phase, "tasks");
});
