import { test } from "node:test";
import assert from "node:assert/strict";
import { content } from "../src/content";
import {
  applyCommand,
  expectedVersion,
  groupView,
  newGame,
} from "../src/domain/engine";
import { makeBackup, parseBackup } from "../src/domain/backup";
import { SKILLS, availableChoices } from "../src/domain/model";
import type { Game } from "../src/domain/model";
import type { Intent } from "../src/classroom/store";
import { trialAvailability, trialBank, trialRoute } from "../src/domain/trials";
import { clickSignal, partyScores, partyWinners } from "../src/domain/party";
import { replayCommands } from "../src/domain/replay";
const now = 1_000_000;
test("Loki changes between click and wait signals during the full round", () => {
  for (const seed of [0, 1, 3, 71, 123, 2147483647]) {
    const signals = Array.from({ length: 23 }, (_, i) =>
      clickSignal(seed, i * 900),
    );
    assert(signals.some(Boolean));
    assert(signals.some((s) => !s));
    assert.deepEqual(
      Array.from({ length: 23 }, (_, i) => clickSignal(seed, i * 900)),
      signals,
    );
  }
});
let count = 0;
function run(game: Game, uid: string, intent: Intent, at = now, seed = 71) {
  return applyCommand(
    game,
    {
      ...intent,
      id: `new-${++count}`,
      expectedVersion: expectedVersion(game, intent),
    },
    { uid, now: at, seed, presence: { a: at, b: at, x: at } },
    content,
  );
}
function fixture() {
  let g = newGame("TEST", "teacher", now);
  for (const uid of ["a", "b", "x", "later"]) g = run(g, uid, { type: "join" });
  for (const [uid, id, name] of [
    ["a", "ship", "Ravnen"],
    ["x", "other", "Ulven"],
  ])
    g = run(g, uid, {
      type: "create_ship",
      groupId: id,
      shipName: name,
      shipColor: "#2B6B6B",
      shipSymbol: "ravn",
      label: `Elev ${uid}`,
    });
  return run(g, "b", { type: "join_ship", groupId: "ship", label: "Elev B" });
}
function trialFixture() {
  const g = fixture();
  g.groups.ship.visited = ["hedeby", "hebrides"];
  return run(g, "a", { type: "start_trial", groupId: "ship", skill: "språk" });
}
function partyFixture(kind: "trial" | "duel" = "trial") {
  return kind === "trial"
    ? run(fixture(), "teacher", {
        type: "event",
        kind: "trial",
        title: "Gudenes prøve",
        message: "",
        activity: "tapping",
      })
    : run(fixture(), "a", {
        type: "challenge",
        groupId: "ship",
        to: "other",
        title: "Holmgang",
        activity: "tapping",
      });
}
function readyParty(g: Game) {
  const id = Object.keys(g.challenges)[0];
  for (const [uid, groupId] of [
    ["a", "ship"],
    ["b", "ship"],
    ["x", "other"],
  ])
    g = run(g, uid, { type: "ready_challenge", groupId, challengeId: id });
  if (g.challenges[id].kind === "trial")
    g = run(g, "teacher", { type: "start_challenge", challengeId: id });
  return { game: g, id };
}
test("ship creation and membership need no role, even with more than five members", () => {
  let g = fixture();
  for (let i = 0; i < 6; i++) {
    const uid = `crew-${i}`;
    g = run(g, uid, { type: "join" });
    g = run(g, uid, {
      type: "join_ship",
      groupId: "ship",
      label: `Medlem ${i}`,
    });
  }
  assert.equal(Object.keys(g.groups.ship.members).length, 8);
  assert(
    Object.values(g.groups.ship.members).every(
      (m) => !Object.hasOwn(m, "role"),
    ),
  );
  const port = content.ports.find((p) => p.port.hiddenChoice)!;
  assert.equal(
    availableChoices(g.groups.ship, port.port).length,
    port.port.choices.length,
  );
});
test("every new trial is locked until all its travel prerequisites are complete", () => {
  for (const skill of SKILLS)
    for (const level of [1, 2] as const) {
      const g = fixture();
      g.groups.ship.svennebrev[skill] = (level - 1) as 0 | 1;
      const route = trialRoute(skill, level);
      g.groups.ship.visited = route.ports.slice(1);
      assert.equal(trialAvailability(g.groups.ship, skill).available, false);
      assert.throws(
        () => run(g, "a", { type: "start_trial", groupId: "ship", skill }),
        /Fullfør besøkene/,
      );
      g.groups.ship.visited = [...route.ports];
      const opened = run(g, "a", {
        type: "start_trial",
        groupId: "ship",
        skill,
      });
      const trial = opened.groups.ship.trial!;
      const bank = trialBank(trial, content);
      assert.equal(trial.questionIndices.length, level === 1 ? 3 : 4);
      assert(
        route.ports.every((id) =>
          trial.questionIndices.some((i) => bank[i].source.includes(id)),
        ),
      );
      assert(
        trial.questionIndices.every((i) =>
          bank[i].source.every((id) => g.groups.ship.visited.includes(id)),
        ),
      );
      assert.equal(trial.practicePrompt, route.practice);
      assert.deepEqual(
        parseBackup(JSON.stringify(makeBackup(opened, now)), content),
        opened,
      );
    }
});
test("entering a harbor does not unlock its travel information", () => {
  let g = fixture();
  g = run(g, "a", { type: "sail", groupId: "ship", destId: "hedeby" });
  g = run(g, "a", { type: "arrive", groupId: "ship" }, now + 3100);
  assert(!g.groups.ship.visited.includes("hedeby"));
  assert(trialAvailability(g.groups.ship, "språk").missing.includes("hedeby"));
});
test("travel theory hides the key and only judged practice earns a certificate", () => {
  let g = trialFixture();
  const trial = g.groups.ship.trial!;
  assert(
    groupView(g.groups.ship, content).trial!.questions.every(
      (q) => q.feedback === null,
    ),
  );
  const answers = trial.questionIndices.map(
    (i) => trialBank(trial, content)[i].correct,
  );
  assert.throws(
    () => run(g, "b", { type: "answer_trial", groupId: "ship", answers }),
    /din åpne prøve/,
  );
  g = run(g, "a", { type: "answer_trial", groupId: "ship", answers });
  assert(
    groupView(g.groups.ship, content).trial!.questions.every((q) => q.feedback),
  );
  g = run(g, "a", {
    type: "practice",
    groupId: "ship",
    text: "Vi viste en avtale og sjekket mottakerens forståelse med kilder fra begge havner.",
  });
  assert.equal(g.groups.ship.svennebrev.språk, 0);
  g = run(g, "teacher", {
    type: "approve_trial",
    groupId: "ship",
    approved: true,
    feedback: "Tydelig kildegrunnlag og god kontroll av forståelsen.",
  });
  assert.equal(g.groups.ship.svennebrev.språk, 1);
});
test("old backups drop assigned roles while keeping active legacy trials and certificates", () => {
  const raw = JSON.parse(JSON.stringify(makeBackup(fixture(), now)));
  raw.game.groups.ship.members.a.role = "språk";
  raw.game.groups.ship.svennebrev.tro = 2;
  raw.game.groups.ship.trial = {
    id: "legacy-trial",
    ownerId: "a",
    skill: "språk",
    level: 1,
    questionIndices: [0, 1, 2],
    answers: [],
    phase: "practice",
    practice: "",
    feedback: "2 av 3 riktige.",
  };
  const restored = parseBackup(JSON.stringify(raw), content);
  assert(!Object.hasOwn(restored.groups.ship.members.a, "role"));
  assert.equal(restored.groups.ship.trial!.bankVersion, "legacy");
  assert.equal(
    groupView(restored.groups.ship, content).trial!.questions[0].q,
    content.skillQuestions.språk.tier2[0].q,
  );
  assert.equal(restored.groups.ship.svennebrev.tro, 2);
  assert.equal(restored.groups.ship.trial!.phase, "practice");
});
test("Ragnarok preserves every encounter phase, collected information and negative trade", () => {
  let base = fixture();
  base = run(base, "a", {
    type: "sail",
    groupId: "ship",
    destId: "lindisfarne",
  });
  base.groups.other.scores.tradeGain = -7;
  for (const phase of [
    "sailing",
    "reading",
    "tasks",
    "council",
    "decision",
    "result",
    "reflection",
  ] as const) {
    const g = structuredClone(base);
    const ship = g.groups.ship;
    ship.encounter!.phase = phase;
    ship.scores.tradeGain = 11;
    ship.visited = ["hedeby"];
    ship.svennebrev.språk = 1;
    ship.encounter!.evidence.a = {
      fact: "En konkret opplysning fra kilden.",
      interpretation: "Vår begrunnelse er skrevet og levert.",
      perspective: "Den andre parten ønsker trygghet.",
      sourceId: content.ports[0].sources[0].id,
    };
    ship.encounter!.answers.a = [0, 1, 2, 0];
    ship.encounter!.votes.a = {
      choiceId: "spare",
      note: "Vår forseglete stemme begrunnes her.",
      suspicion: false,
    };
    const after = run(g, "teacher", {
      type: "event",
      kind: "ragnarok",
      title: "Ragnarok",
      message: "",
    });
    assert.deepEqual(after.groups.ship.encounter, ship.encounter);
    assert.deepEqual(after.groups.ship.visited, ship.visited);
    assert.deepEqual(after.groups.ship.svennebrev, ship.svennebrev);
    assert.deepEqual(after.groups.ship.saga, ship.saga);
    assert.equal(after.groups.ship.scores.tradeGain, 6);
    assert.equal(after.groups.other.scores.tradeGain, -7);
  }
});
test("Ragnarok keeps the active trial, its answers and pending practice exactly", () => {
  let g = trialFixture();
  const t = g.groups.ship.trial!;
  g = run(g, "a", {
    type: "answer_trial",
    groupId: "ship",
    answers: t.questionIndices.map((i) => trialBank(t, content)[i].correct),
  });
  g = run(g, "a", {
    type: "practice",
    groupId: "ship",
    text: "Hele laget fremførte og begrunnet en konkret avtale fra reisen.",
  });
  const after = run(g, "teacher", {
    type: "event",
    kind: "ragnarok",
    title: "Ragnarok",
    message: "",
  });
  assert.deepEqual(after.groups.ship.trial, g.groups.ship.trial);
  assert.deepEqual(
    parseBackup(JSON.stringify(makeBackup(after, now)), content).groups.ship
      .trial,
    g.groups.ship.trial,
  );
});
test("party games freeze all members and start only when every active player is ready", () => {
  let g = partyFixture();
  const id = Object.keys(g.challenges)[0];
  assert.throws(
    () => run(g, "teacher", { type: "start_challenge", challengeId: id }),
    /Alle aktive/,
  );
  assert.throws(
    () =>
      run(g, "a", {
        type: "start_challenge",
        groupId: "ship",
        challengeId: id,
      }),
    /Bare spillets lærer/,
  );
  g = run(g, "later", {
    type: "join_ship",
    groupId: "ship",
    label: "Sent medlem",
  });
  assert.throws(
    () =>
      run(g, "later", {
        type: "ready_challenge",
        groupId: "ship",
        challengeId: id,
      }),
    /deltar ikke/,
  );
  assert.throws(
    () => run(g, "a", { type: "leave_ship", groupId: "ship" }),
    /lagleken/,
  );
  const started = readyParty(g).game;
  assert.equal(started.challenges[id].startsAt, now + 5000);
  assert.equal(started.challenges[id].endsAt, now + 25000);
  assert.throws(
    () =>
      run(started, "teacher", {
        type: "excuse_challenge",
        challengeId: id,
        memberId: "b",
        reason: "Medlemmet er fraværende.",
      }),
    /før leken/,
  );
});
test("duels start a shared countdown when both full teams are ready", () => {
  const { game, id } = readyParty(partyFixture("duel"));
  assert.equal(game.challenges[id].phase, "playing");
  assert.equal(game.challenges[id].startsAt, now + 5000);
});
test("a solo party starts on readiness and can be completed without a teacher", () => {
  let g = run(newGame("SOLO", "a", now, "solo"), "a", { type: "join" });
  g = run(g, "a", {
    type: "create_ship",
    groupId: "ship",
    shipName: "Soloseilet",
    shipColor: "#2B6B6B",
    shipSymbol: "ravn",
    label: "Solo",
  });
  g = run(g, "a", {
    type: "event",
    kind: "trial",
    title: "Gudenes prøve",
    message: "",
    activity: "tapping",
  });
  const id = Object.keys(g.challenges)[0];
  g = run(g, "a", {
    type: "ready_challenge",
    groupId: "ship",
    challengeId: id,
  });
  assert.equal(g.challenges[id].phase, "playing");
  assert.equal(g.challenges[id].startsAt, now + 5000);
  g = run(
    g,
    "a",
    { type: "submit_challenge", groupId: "ship", challengeId: id, score: 3 },
    now + 25000,
  );
  g = run(
    g,
    "a",
    { type: "resolve_challenge", challengeId: id, winnerId: "ship" },
    now + 25000,
  );
  assert.equal(g.challenges[id].status, "resolved");
  assert.deepEqual(g.challenges[id].winnerIds, ["ship"]);
  assert.equal(g.groups.ship.scores.reputation, 4);
});
test("party results require every member and use average, not team totals", () => {
  const started = readyParty(partyFixture());
  let g = started.game;
  const id = started.id;
  assert.throws(
    () =>
      run(
        g,
        "a",
        {
          type: "submit_challenge",
          groupId: "ship",
          challengeId: id,
          score: 120,
        },
        now + 24000,
      ),
    /pågår/,
  );
  assert.throws(
    () =>
      run(
        g,
        "a",
        {
          type: "submit_challenge",
          groupId: "ship",
          challengeId: id,
          score: 999,
        },
        now + 26000,
      ),
    /grenser/,
  );
  g = run(
    g,
    "a",
    { type: "submit_challenge", groupId: "ship", challengeId: id, score: 120 },
    now + 26000,
  );
  assert.throws(
    () =>
      run(
        g,
        "a",
        {
          type: "submit_challenge",
          groupId: "ship",
          challengeId: id,
          score: 121,
        },
        now + 26000,
      ),
    /allerede/,
  );
  assert.throws(
    () =>
      run(
        g,
        "teacher",
        { type: "resolve_challenge", challengeId: id, winnerId: "ship" },
        now + 26000,
      ),
    /Alle aktive/,
  );
  g = run(
    g,
    "b",
    { type: "submit_challenge", groupId: "ship", challengeId: id, score: 40 },
    now + 26000,
  );
  g = run(
    g,
    "x",
    { type: "submit_challenge", groupId: "other", challengeId: id, score: 100 },
    now + 26000,
  );
  assert.equal(partyScores(g.challenges[id])[0].total, 160);
  assert.equal(partyScores(g.challenges[id])[0].average, 80);
  assert.deepEqual(partyWinners(g.challenges[id]), ["other"]);
  assert.throws(
    () =>
      run(
        g,
        "teacher",
        { type: "resolve_challenge", challengeId: id, winnerId: "ship" },
        now + 26000,
      ),
    /høyest snitt/,
  );
  const academic = g.groups.other.scores.culturalUnderstanding;
  const done = run(
    g,
    "teacher",
    { type: "resolve_challenge", challengeId: id, winnerId: "other" },
    now + 26000,
  );
  assert.equal(
    done.groups.other.scores.reputation,
    g.groups.other.scores.reputation + 4,
  );
  assert.equal(done.groups.other.scores.culturalUnderstanding, academic);
  assert.throws(
    () =>
      run(
        done,
        "teacher",
        { type: "resolve_challenge", challengeId: id, winnerId: "other" },
        now + 26000,
      ),
    /avsluttet/,
  );
});
test("ties share the win and physical party games require participation without quiz scores", () => {
  const started = readyParty(partyFixture());
  let g = started.game;
  const id = started.id;
  for (const [uid, groupId] of [
    ["a", "ship"],
    ["b", "ship"],
    ["x", "other"],
  ])
    g = run(
      g,
      uid,
      { type: "submit_challenge", groupId, challengeId: id, score: 50 },
      now + 26000,
    );
  const done = run(
    g,
    "teacher",
    { type: "resolve_challenge", challengeId: id, winnerId: "ship" },
    now + 26000,
  );
  assert.deepEqual(done.challenges[id].winnerIds, ["ship", "other"]);
  let physical = run(fixture(), "teacher", {
    type: "event",
    kind: "trial",
    title: "Gudenes prøve",
    message: "",
    activity: "mime",
  });
  const start = readyParty(physical);
  physical = start.game;
  for (const [uid, groupId] of [
    ["a", "ship"],
    ["b", "ship"],
    ["x", "other"],
  ])
    physical = run(
      physical,
      uid,
      { type: "submit_challenge", groupId, challengeId: start.id, score: 0 },
      now + 36000,
    );
  const resolved = run(
    physical,
    "teacher",
    { type: "resolve_challenge", challengeId: start.id, winnerId: "ship" },
    now + 36000,
  );
  assert.equal(resolved.challenges[start.id].winnerId, "ship");
});
test("wheel effects preserve ongoing work, settle once and replay with the same sector", () => {
  const sectors = new Set<string>();
  for (let seed = 0; seed < 150; seed++) {
    const g = trialFixture();
    g.groups.ship.scores.tradeGain = 15;
    const before = structuredClone(g);
    const command = {
      id: `spin-${seed}`,
      expectedVersion: g.version,
      type: "spin_wheel",
    };
    const actor = { uid: "teacher", now, seed, presence: {} };
    const next = applyCommand(g, command, actor, content);
    sectors.add(next.wheel!.fieldId);
    assert.deepEqual(next.groups.ship.trial, before.groups.ship.trial);
    assert.deepEqual(next.groups.ship.visited, before.groups.ship.visited);
    assert.deepEqual(
      next.groups.ship.svennebrev,
      before.groups.ship.svennebrev,
    );
    assert.deepEqual(applyCommand(next, command, actor, content), next);
    assert.deepEqual(
      replayCommands(before, next.log.slice(before.log.length), content),
      next,
    );
    assert.deepEqual(
      parseBackup(JSON.stringify(makeBackup(next, now)), content),
      next,
    );
  }
  assert.equal(sectors.size, 6);
});
test("Ragnarok preserves a live party game and already submitted results", () => {
  const { game, id } = readyParty(partyFixture());
  const after = run(
    game,
    "teacher",
    { type: "event", kind: "ragnarok", title: "Ragnarok", message: "" },
    now + 13000,
  );
  assert.deepEqual(after.challenges[id], game.challenges[id]);
});
