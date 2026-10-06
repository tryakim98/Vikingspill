import { createHash, randomBytes } from "node:crypto";
import { initializeApp } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import type { Reference } from "firebase-admin/database";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { content } from "../../src/content";
import {
  applyCommand,
  newGame,
  projectGame,
  RuleError,
} from "../../src/domain/engine";
import {
  Code,
  CommandSchema,
  GameSchema,
  SettingsSchema,
  Id,
} from "../../src/domain/model";
import { makeBackup, parseBackup } from "../../src/domain/backup";
import { FeedbackSchema } from "../../src/domain/feedback";
const emulatorHost = process.env.FIREBASE_DATABASE_EMULATOR_HOST;
if (emulatorHost) {
  const config = JSON.parse(process.env.FIREBASE_CONFIG ?? "{}");
  initializeApp({
    ...config,
    databaseURL: `http://${emulatorHost}/?ns=${config.projectId ?? "demo-vikingspill"}-default-rtdb`,
  });
} else initializeApp();
const db = getDatabase();
const options = {
  region: "europe-west1",
  maxInstances: 10,
  timeoutSeconds: 30,
};
// Keep an active listener until the transaction finishes: get() alone does not
// prime the transaction's local cache, so an existing game can initially be null.
async function warmed<T>(
  reference: Reference,
  work: () => Promise<T>,
): Promise<T> {
  const keep = () => {};
  reference.on("value", keep);
  try {
    await reference.once("value");
    return await work();
  } finally {
    reference.off("value", keep);
  }
}
function uidOf(request: { auth?: { uid: string } }) {
  if (!request.auth)
    throw new HttpsError("unauthenticated", "Logg inn på nytt.");
  return request.auth.uid;
}
function error(error: unknown): never {
  if (error instanceof HttpsError) throw error;
  if (error instanceof RuleError)
    throw new HttpsError(
      error.code === "permission"
        ? "permission-denied"
        : error.code === "conflict"
          ? "aborted"
          : "failed-precondition",
      error.message,
    );
  console.error(
    "Vikingspill command failed",
    error instanceof Error ? error.message : "unknown",
  );
  throw new HttpsError(
    "invalid-argument",
    "Ugyldig data eller sikkerhetskopi.",
  );
}
async function create(
  uid: string,
  requestId: string,
  restored?: ReturnType<typeof GameSchema.parse>,
  settings = SettingsSchema.parse({}),
) {
  const creationId = `${uid}:${Id.parse(requestId)}`;
  for (let attempt = 0; attempt < 20; attempt++) {
    const hash = createHash("sha256")
      .update(`${creationId}:${attempt}`)
      .digest();
    const code = Array.from(hash.subarray(0, 4), (n) =>
      String.fromCharCode(65 + (n % 26)),
    ).join("");
    const game = restored
      ? {
          ...restored,
          code,
          teacherUid: uid,
          mode: "classroom" as const,
          closed: false,
          members: {
            ...restored.members,
            [uid]: restored.members[uid] ?? { groupId: null },
          },
        }
      : newGame(code, uid, Date.now(), "classroom", settings);
    const result = await db
      .ref(`v2/games/${code}`)
      .transaction((current) =>
        current
          ? current.creationId === creationId
            ? current
            : undefined
          : { ...projectGame(game, content), creationId },
      );
    if (result.committed) return { code };
  }
  throw new HttpsError("resource-exhausted", "Kunne ikke finne en ledig kode.");
}
export const createClassroom = onCall(options, async (request) => {
  try {
    return await create(
      uidOf(request),
      Id.parse(request.data?.id),
      undefined,
      SettingsSchema.parse(request.data?.settings ?? {}),
    );
  } catch (e) {
    error(e);
  }
});
export const joinClassroom = onCall(options, async (request) => {
  try {
    const uid = uidOf(request);
    const code = Code.parse(request.data?.code);
    const commandId = String(
      request.data?.id ?? randomBytes(16).toString("hex"),
    );
    const ref = db.ref(`v2/games/${code}`);
    const existing = await ref.get();
    if (!existing.exists())
      throw new HttpsError("not-found", "Spillkoden finnes ikke.");
    const result = await warmed(ref, () =>
      ref.transaction((current) => {
        if (!current) return undefined;
        const game = GameSchema.parse(JSON.parse(current.stateJson));
        return {
          ...projectGame(
            applyCommand(
              game,
              { type: "join", id: commandId, expectedVersion: game.version },
              { uid, seed: 0, now: Date.now(), presence: {} },
              content,
            ),
            content,
          ),
          creationId: current.creationId ?? "",
        };
      }),
    );
    if (!result.committed)
      throw new HttpsError("not-found", "Spillet finnes ikke lenger.");
    const game = GameSchema.parse(
      JSON.parse(result.snapshot.child("stateJson").val()),
    );
    return {
      code,
      groupId: game.members[uid]?.groupId ?? null,
      teacher: game.teacherUid === uid,
    };
  } catch (e) {
    error(e);
  }
});
export const gameCommand = onCall(options, async (request) => {
  try {
    const uid = uidOf(request);
    const code = Code.parse(request.data?.code);
    const command = CommandSchema.parse(request.data?.command);
    const ref = db.ref(`v2/games/${code}`);
    const [existing, connections] = await Promise.all([
      ref.get(),
      db.ref(`v2/presence/${code}`).get(),
    ]);
    if (!existing.exists())
      throw new HttpsError("not-found", "Spillet finnes ikke.");
    const now = Date.now();
    const seed = randomBytes(4).readUInt32LE();
    const presence: Record<string, number> = {};
    connections.forEach((member) => {
      member.forEach((connection) => {
        const p = connection.val();
        presence[member.key!] = Math.max(
          presence[member.key!] ?? 0,
          Number(p.at) || 0,
        );
      });
    });
    const result = await warmed(ref, () =>
      ref.transaction((current) => {
        if (!current) return undefined;
        const game = GameSchema.parse(JSON.parse(current.stateJson));
        return {
          ...projectGame(
            applyCommand(game, command, { uid, now, seed, presence }, content),
            content,
          ),
          creationId: current.creationId ?? "",
        };
      }),
    );
    if (!result.committed)
      throw new HttpsError("not-found", "Spillet finnes ikke lenger.");
    const game = GameSchema.parse(
      JSON.parse(result.snapshot.child("stateJson").val()),
    );
    return {
      version:
        command.groupId && game.groups[command.groupId]
          ? game.groups[command.groupId].version
          : game.version,
    };
  } catch (e) {
    error(e);
  }
});
export const exportClassroom = onCall(options, async (request) => {
  try {
    const uid = uidOf(request);
    const code = Code.parse(request.data?.code);
    const snapshot = await db.ref(`v2/games/${code}/stateJson`).get();
    if (!snapshot.exists())
      throw new HttpsError("not-found", "Spillet finnes ikke.");
    const game = GameSchema.parse(JSON.parse(snapshot.val()));
    if (game.teacherUid !== uid)
      throw new HttpsError(
        "permission-denied",
        "Bare læreren kan eksportere hele spillet.",
      );
    return makeBackup(game, Date.now());
  } catch (e) {
    error(e);
  }
});
export const importClassroom = onCall(options, async (request) => {
  try {
    return await create(
      uidOf(request),
      Id.parse(request.data?.id),
      parseBackup(String(request.data?.backup ?? ""), content),
    );
  } catch (e) {
    error(e);
  }
});
export const submitFeedback = onCall(options, async (request) => {
  try {
    const uid = uidOf(request);
    const code = Code.parse(request.data?.code);
    const post = FeedbackSchema.parse(request.data?.post);
    const snapshot = await db.ref(`v2/games/${code}/control`).get();
    if (
      !snapshot.child(`members/${uid}/joined`).val() &&
      snapshot.child("teacherUid").val() !== uid
    )
      throw new HttpsError(
        "permission-denied",
        "Bli med i klasserommet først.",
      );
    await db
      .ref(`v2/feedback/${code}/${uid}/${post.id}`)
      .transaction((current) => current ?? { ...post, receivedAt: Date.now() });
    return { received: true };
  } catch (e) {
    error(e);
  }
});
