import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { content } from "../src/content";
import {
  applyCommand,
  newGame,
  projectGame,
  expectedVersion,
} from "../src/domain/engine";
import type { Game } from "../src/domain/model";
import type { Intent } from "../src/classroom/store";

let env: RulesTestEnvironment;
let game: Game;
before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-vikingspill",
    database: {
      host: "127.0.0.1",
      port: 9000,
      rules: await readFile("database.rules.json", "utf8"),
    },
  });
  game = newGame("TEST", "teacher", Date.now());
  let n = 0;
  const run = (uid: string, intent: Intent) => {
    game = applyCommand(
      game,
      {
        ...intent,
        id: `rules-${++n}`,
        expectedVersion: expectedVersion(game, intent),
      },
      { uid, now: Date.now(), seed: 0, presence: {} },
      content,
    );
  };
  for (const id of ["teacher", "a", "b", "x"]) run(id, { type: "join" });
  run("a", {
    type: "create_ship",
    groupId: "ship",
    shipName: "Ravnen",
    shipSymbol: "ravn",
    shipColor: "#2B6B6B",
    role: "språk",
    label: "Elev A",
  });
  run("b", {
    type: "join_ship",
    groupId: "ship",
    role: "tro",
    label: "Elev B",
  });
  run("x", {
    type: "create_ship",
    groupId: "other",
    shipName: "Ulven",
    shipSymbol: "ulv",
    shipColor: "#2B6B6B",
    role: "språk",
    label: "Elev X",
  });
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx.database().ref("v2/games/TEST").set(projectGame(game, content));
  });
});
after(async () => {
  await env?.cleanup();
});
test("unauthenticated users and outsiders cannot read game data", async () => {
  for (const ctx of [
    env.unauthenticatedContext(),
    env.authenticatedContext("outsider"),
  ])
    await assertFails(ctx.database().ref("v2/games/TEST/publicJson").get());
});
test("members can read public summaries and their own group, not whole game or other groups", async () => {
  const db = env.authenticatedContext("a").database();
  await assertSucceeds(db.ref("v2/games/TEST/publicJson").get());
  await assertSucceeds(db.ref("v2/games/TEST/groups/ship").get());
  await assertFails(db.ref("v2/games/TEST/groups/other").get());
  await assertFails(db.ref("v2/games/TEST").get());
  await assertFails(db.ref("v2/games/TEST/stateJson").get());
  await assertFails(db.ref("v2/games/TEST/control").get());
});
test("each private projection is readable by its owner only, including against teacher", async () => {
  const a = env.authenticatedContext("a").database();
  await assertSucceeds(a.ref("v2/games/TEST/private/a").get());
  await assertFails(a.ref("v2/games/TEST/private/b").get());
  await assertFails(
    env
      .authenticatedContext("teacher")
      .database()
      .ref("v2/games/TEST/private/a")
      .get(),
  );
});
test("teacher can read group reviews but cannot directly write authoritative data", async () => {
  const db = env.authenticatedContext("teacher").database();
  await assertSucceeds(db.ref("v2/games/TEST/groups").get());
  await assertFails(db.ref("v2/games/TEST/publicJson").set("{}"));
  await assertFails(db.ref("v2/games/TEST/stateJson").set("{}"));
});
test("students cannot write scores, roles, votes, ownership or somebody else’s presence", async () => {
  const db = env.authenticatedContext("a").database();
  for (const path of [
    "v2/games/TEST/groups/ship",
    "v2/games/TEST/private/a",
    "v2/games/TEST/control/teacherUid",
    "v2/presence/TEST/b/conn",
  ])
    await assertFails(db.ref(path).set({ online: true, at: Date.now() }));
});
test("presence accepts own valid connections and rejects extra fields/future timestamps", async () => {
  const db = env.authenticatedContext("a").database();
  await assertSucceeds(
    db.ref("v2/presence/TEST/a/conn").set({ online: true, at: Date.now() }),
  );
  await assertFails(
    db
      .ref("v2/presence/TEST/a/conn")
      .set({ online: true, at: Date.now() + 100000 }),
  );
  await assertFails(
    db
      .ref("v2/presence/TEST/a/conn")
      .set({ online: true, at: Date.now(), teacher: true }),
  );
  const snap = await db.ref("v2/presence/TEST/a/conn").get();
  assert.equal(snap.val().online, true);
});
test("legacy unsecured paths are closed", async () => {
  const db = env.authenticatedContext("a").database();
  await assertFails(db.ref("games/TEST").get());
  await assertFails(db.ref("games/TEST/groups/ship").set({ scores: 999 }));
});
test("only this classroom's teacher can read feedback; clients cannot write it directly", async () => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx
      .database()
      .ref("v2/feedback/TEST/a/post")
      .set({ comment: "A report" });
  });
  await assertSucceeds(
    env
      .authenticatedContext("teacher")
      .database()
      .ref("v2/feedback/TEST")
      .get(),
  );
  await assertFails(
    env
      .authenticatedContext("teacher")
      .database()
      .ref("v2/feedback/NEXT")
      .get(),
  );
  for (const context of [
    env.unauthenticatedContext(),
    env.authenticatedContext("a"),
    env.authenticatedContext("outsider"),
  ]) {
    await assertFails(context.database().ref("v2/feedback/TEST").get());
    await assertFails(context.database().ref("v2/feedback/TEST/a/post").get());
  }
  for (const uid of ["teacher", "a"])
    await assertFails(
      env
        .authenticatedContext(uid)
        .database()
        .ref("v2/feedback/TEST/a/post")
        .set({ comment: "Forged" }),
    );
});
