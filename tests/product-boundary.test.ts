import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

test("Vikingspillet has its own app shell and Firebase project", () => {
  const app = readFileSync("src/App.tsx", "utf8");
  const firebaseRc = JSON.parse(readFileSync(".firebaserc", "utf8")) as {
    projects?: { default?: string };
  };

  assert.doesNotMatch(app, /Ludus|LudusForside|skin-ludus/);
  assert.doesNotMatch(app, /\/katalog|\/generator|\/radslagning/);
  assert.match(app, /path="\/teacher"/);
  assert.match(app, /path="\/student"/);
  assert.match(app, /path="\*" element={<Navigate to="\/" replace \/>}/);
  assert.equal(firebaseRc.projects?.default, "vikingspill-2b754");
});

test("Vikingspillet source never points at Ludus production Firebase", () => {
  for (const path of [
    "src/classroom/firebaseClient.ts",
    "functions/src/index.ts",
    "firebase.json",
    ".firebaserc",
  ]) {
    assert.doesNotMatch(readFileSync(path, "utf8"), /ludus-1903/);
  }
});
