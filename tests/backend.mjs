import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
const project = "demo-vikingspill";
async function identity() {
  const response = await fetch(
    "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ returnSecureToken: true }),
    },
  );
  assert.equal(response.status, 200);
  const value = await response.json();
  return { uid: value.localId, token: value.idToken };
}
async function call(user, name, data, expected = 200) {
  const response = await fetch(
    `http://127.0.0.1:5001/${project}/europe-west1/${name}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(user ? { authorization: `Bearer ${user.token}` } : {}),
      },
      body: JSON.stringify({ data }),
    },
  );
  const value = await response.json();
  assert.equal(response.status, expected, JSON.stringify(value));
  return value.result ?? value.error;
}
async function read(user, code, path, expected = 200) {
  const response = await fetch(
    `http://127.0.0.1:9000/v2/games/${code}/${path}.json?ns=${project}-default-rtdb&auth=${user.token}`,
  );
  assert.equal(response.status, expected);
  const value = await response.json();
  return typeof value === "string" ? JSON.parse(value) : value;
}
const teacher = await identity(),
  student = await identity(),
  outsider = await identity();
await call(null, "createClassroom", { id: randomUUID() }, 401);
const id = randomUUID();
const { code } = await call(teacher, "createClassroom", { id });
assert.equal(
  (await call(teacher, "createClassroom", { id })).code,
  code,
  "Creation retry has the same code",
);
for (const user of [teacher, student])
  await call(user, "joinClassroom", { code, id: randomUUID() });
const publicView = await read(student, code, "publicJson");
const groupId = `g-${randomUUID()}`;
const command = {
  type: "create_ship",
  id: randomUUID(),
  expectedVersion: publicView.version,
  groupId,
  shipName: "Backendprøven",
  shipSymbol: "ravn",
  shipColor: "#2B6B6B",
  role: "språk",
  label: "Prøveelev",
};
await call(student, "gameCommand", { code, command });
await call(student, "gameCommand", { code, command });
let group = await read(student, code, `groups/${groupId}`);
assert.equal(Object.keys(group.members).length, 1);
await read(outsider, code, "publicJson", 401);
await read(teacher, code, `private/${student.uid}`, 401);
await read(student, code, "stateJson", 401);
await call(
  student,
  "gameCommand",
  {
    code,
    command: {
      type: "event",
      id: randomUUID(),
      expectedVersion: (await read(student, code, "publicJson")).version,
      kind: "ragnarok",
      title: "Uautorisert",
      message: "",
    },
  },
  403,
);
await call(
  student,
  "gameCommand",
  {
    code,
    command: {
      type: "roll",
      id: randomUUID(),
      expectedVersion: group.version,
      groupId,
      dice: [6],
      scores: { reputation: 999 },
    },
  },
  400,
);
const event = {
  type: "event",
  id: randomUUID(),
  expectedVersion: (await read(teacher, code, "publicJson")).version,
  kind: "fate",
  title: "Skjebne",
  message: "",
};
await call(teacher, "gameCommand", { code, command: event });
group = await read(student, code, `groups/${groupId}`);
await call(teacher, "gameCommand", { code, command: event });
assert.deepEqual(
  (await read(student, code, `groups/${groupId}`)).scores,
  group.scores,
  "Lost-response retry does not award again",
);
const backup = await call(teacher, "exportClassroom", { code });
await call(student, "exportClassroom", { code }, 403);
const importId = randomUUID();
const restored = await call(student, "importClassroom", {
  id: importId,
  backup: JSON.stringify(backup),
});
assert.notEqual(restored.code, code);
assert.equal(
  (
    await call(student, "importClassroom", {
      id: importId,
      backup: JSON.stringify(backup),
    })
  ).code,
  restored.code,
);
assert.equal(
  (
    await call(student, "joinClassroom", {
      code: restored.code,
      id: randomUUID(),
    })
  ).teacher,
  true,
);
assert.ok(
  (await read(student, restored.code, `groups/${groupId}`)).members[
    student.uid
  ],
  "Import keeps an existing member when they become the teacher",
);
await call(student, "submitFeedback", {
  code: restored.code,
  post: {
    id: randomUUID(),
    category: "forslag",
    comment: "Dette er en integrasjonsprøve av lagring.",
    screen: "sjøkart",
    at: Date.now(),
    okt: "prøve",
  },
});
await call(
  outsider,
  "submitFeedback",
  {
    code,
    post: {
      id: randomUUID(),
      category: "bug",
      comment: "Uautorisert innsendelse",
      screen: "kart",
      at: Date.now(),
      okt: "",
    },
  },
  403,
);
console.log(
  "PASS: actual callable auth, creation/import retries, cold transactions, member ownership, private data, forged outcomes, exactly-once fate, backup/import and feedback.",
);
