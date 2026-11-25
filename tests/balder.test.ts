import assert from "node:assert/strict";
import { test } from "node:test";
import { content } from "../src/content";
import { GATES, HARBOURS, harbourQuiz, PRACTICES } from "../src/content/balder";
import {
  applyCommand,
  expectedVersion,
  newGame,
  publicView,
} from "../src/domain/engine";
import { DEFAULT_SETTINGS } from "../src/domain/model";
import { balderPoints, signalPuzzle } from "../src/domain/balder";
import type { Action } from "../src/domain/balder";
import type { Intent } from "../src/classroom/store";
import { makeBackup, parseBackup } from "../src/domain/backup";

function room() {
  let game = newGame("TEST", "teacher", 0, "classroom", {
    ...DEFAULT_SETTINGS,
    variant: "balder",
  });
  let id = 0;
  function run(uid: string, cmd: Intent, now = 10) {
    game = applyCommand(
      game,
      { ...cmd, id: "c" + ++id, expectedVersion: expectedVersion(game, cmd) },
      { uid, now, seed: id, presence: {} },
      content,
    );
  }
  for (const [uid, groupId] of [
    ["anna", "ravn"],
    ["per", "ulv"],
  ]) {
    run(uid, { type: "join" });
    run(uid, {
      type: "create_ship",
      groupId,
      shipName: groupId,
      shipSymbol: "ravn",
      shipColor: "#123456",
      label: uid,
    });
  }
  function act(action: Action, uid = "anna", groupId = "ravn") {
    run(uid, { type: "balder", groupId, action });
  }
  function visit(port: string) {
    act({ kind: "visit", port });
    act({
      kind: "reflect",
      port,
      text: "De som møttes, kunne forstå gesten på ulike måter.",
    });
    act({
      kind: "quiz",
      port,
      answers: harbourQuiz(port).map((q) => q.correct),
    });
  }
  return {
    run,
    act,
    visit,
    get game() {
      return game;
    },
  };
}
test("Balder: all 12 ports reachable, written reflection gates quiz and evidence gates all three tiers", () => {
  const r = room();
  assert.deepEqual(
    Object.keys(HARBOURS).sort(),
    content.ports.map((p) => p.port.id).sort(),
  );
  r.act({ kind: "visit", port: "vinland" });
  assert.equal(r.game.groups.ravn.balder!.current, null);
  const signal = r.game.balderSignals!["1"];
  r.act({ kind: "visit", port: "paris" }, "per", "ulv");
  assert.equal(r.game.balderSignals!["1"], signal);
  r.act(
    { kind: "bonus", level: 1, answers: signalPuzzle(1, signal).solution },
    "per",
    "ulv",
  );
  assert.equal(balderPoints(r.game.groups.ulv), 4);
  assert.throws(() =>
    r.act({ kind: "bonus", level: 1, answers: [0, 1, 2, 3] }, "per", "ulv"),
  );
  assert.throws(() =>
    r.act({
      kind: "submit",
      trial: "tolk",
      text: "En dokumentasjon som ingen har lagt fram.",
    }),
  );
  r.act({ kind: "visit", port: "hedeby" });
  assert.throws(() =>
    r.act({ kind: "quiz", port: "hedeby", answers: [0, 0, 0] }),
  );
  assert.throws(() => r.act({ kind: "reflect", port: "hedeby", text: " " }));
  for (const [i, t] of PRACTICES.entries()) {
    r.visit(t.port);
    const submit = {
      kind: "submit",
      trial: t.id,
      text: "Vi viste to ulike mengder, og avklarte forskjellen.",
    } as const;
    r.act(submit);
    const review = {
      kind: "review",
      trial: t.id,
      submission: r.game.groups.ravn.balder!.trials[t.id].id,
      approved: false,
      feedback: "Vis begge versjonene.",
    } as const;
    assert.throws(() => r.act(review));
    r.act(review, "teacher");
    r.act(submit);
    assert.throws(() => r.act({ ...review, approved: true }, "teacher"));
    r.act(
      {
        ...review,
        submission: r.game.groups.ravn.balder!.trials[t.id].id,
        approved: true,
      },
      "teacher",
    );
    for (const p of Object.keys(GATES).filter((id) => GATES[id] === i + 1))
      r.visit(p);
  }
  for (const p of Object.keys(HARBOURS).filter(
    (id) => !r.game.groups.ravn.visited.includes(id),
  ))
    r.visit(p);
  assert.equal(r.game.groups.ravn.visited.length, 12);
  assert.equal(balderPoints(r.game.groups.ravn), 36);
  assert.deepEqual(
    parseBackup(JSON.stringify(makeBackup(r.game, 10)), content),
    r.game,
  );
  assert(!JSON.stringify(publicView(r.game)).includes("Vi viste to ulike"));
  assert.throws(() => r.run("anna", { type: "roll", groupId: "ravn" }));
  assert.throws(() => r.act({ kind: "visit", port: "hedeby" }));
});
test("Balder: automatic digital duel, tie and missing device, one settlement even after reload", () => {
  for (const missing of [false, true]) {
    const r = room();
    r.act({ kind: "visit", port: "hedeby" });
    assert.throws(() =>
      r.run("anna", {
        type: "challenge",
        groupId: "ravn",
        to: "ulv",
        title: "Holmgang",
        activity: "mime",
      }),
    );
    r.run("anna", {
      type: "challenge",
      groupId: "ravn",
      to: "ulv",
      title: "Holmgang",
      activity: "tapping",
    });
    const id = Object.keys(r.game.challenges)[0];
    for (const [u, g] of [
      ["anna", "ravn"],
      ["per", "ulv"],
    ])
      r.run(u, { type: "ready_challenge", groupId: g, challengeId: id });
    const end = r.game.challenges[id].endsAt!;
    assert.throws(() =>
      r.run(
        "anna",
        {
          type: "submit_challenge",
          groupId: "ravn",
          challengeId: id,
          score: 2,
        },
        end - 1,
      ),
    );
    r.run(
      "anna",
      { type: "submit_challenge", groupId: "ravn", challengeId: id, score: 2 },
      end,
    );
    if (missing)
      r.run(
        "anna",
        { type: "balder_timeout", groupId: "ravn", challengeId: id },
        end + 30000,
      );
    else
      r.run(
        "per",
        { type: "submit_challenge", groupId: "ulv", challengeId: id, score: 2 },
        end,
      );
    r.run(
      "anna",
      { type: "balder_timeout", groupId: "ravn", challengeId: id },
      end + 40000,
    );
    assert.equal(r.game.challenges[id].status, "resolved");
    assert.equal(balderPoints(r.game.groups.ravn), 2);
    assert.equal(balderPoints(r.game.groups.ulv), missing ? 0 : 2);
    assert.equal(r.game.groups.ravn.balder!.current, "hedeby");
  }
});
