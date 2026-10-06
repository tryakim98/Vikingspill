import assert from "node:assert/strict";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import packs from "../src/content/packs.json" with { type: "json" };

const url = "http://127.0.0.1:4178";
const env = { ...process.env, VITE_FIREBASE_EMULATORS: "true" };
const vite = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "--host",
    "127.0.0.1",
    "--port",
    "4178",
    "--strictPort",
  ],
  { env, stdio: ["ignore", "pipe", "pipe"] },
);
let serverLog = "";
vite.stdout.on("data", (b) => {
  serverLog += b;
});
vite.stderr.on("data", (b) => {
  serverLog += b;
});
let browser;
await mkdir("test-results", { recursive: true });
const errors = [];
const watch = (page) => {
  page.on("pageerror", (e) => errors.push(e.message));
};
const click = (page, name) =>
  page.getByRole("button", { name, exact: true }).click({ timeout: 30000 });
const text = (page, value) =>
  page.getByText(value, { exact: true }).waitFor({ timeout: 30000 });
const wait = async (fn, label) => {
  const start = Date.now();
  while (!(await fn())) {
    if (Date.now() - start > 30000) throw new Error(`Timeout: ${label}`);
    await new Promise((r) => setTimeout(r, 200));
  }
};
try {
  await wait(async () => {
    try {
      return (await fetch(url)).ok;
    } catch {
      return false;
    }
  }, "Vite startup");
  try {
    const r = await promisify(execFile)(
      "node_modules/.bin/agent-browser",
      [
        "--executable-path",
        process.env.VIKING_BROWSER_PATH || chromium.executablePath(),
        "open",
        url,
      ],
      { timeout: 15000 },
    );
    console.log("agent-browser:", r.stdout.trim());
    await promisify(execFile)("node_modules/.bin/agent-browser", ["close"], {
      timeout: 10000,
    });
  } catch (e) {
    console.log(
      "agent-browser unavailable in this environment:",
      e.stderr?.trim() || e.message,
    );
  }
  browser = await chromium.launch({
    headless: true,
    ...(process.env.VIKING_BROWSER_PATH
      ? { executablePath: process.env.VIKING_BROWSER_PATH }
      : {}),
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const teacher = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  watch(teacher);
  await teacher.goto(`${url}/teacher`);
  await click(teacher, "Opprett nytt spill");
  await teacher
    .getByRole("heading", { name: /^Klasserom [A-Z]{4}$/ })
    .waitFor({ timeout: 30000 });
  const code = (await teacher.locator("h1").innerText()).slice(-4);
  const students = [];
  for (let i = 0; i < 4; i++) {
    const ctx = await browser.newContext({
      viewport:
        i === 3 ? { width: 390, height: 844 } : { width: 1280, height: 900 },
    });
    const page = await ctx.newPage();
    watch(page);
    students.push({ ctx, page });
    await page.goto(`${url}/student`);
    await page.getByLabel("Spillkode", { exact: true }).fill(code);
    await click(page, "Bli med i spillet");
    await text(page, "Finn mannskapet ditt");
    if (i === 0)
      await page.getByLabel("Skipets navn", { exact: true }).fill("Ravnen");
    else
      await page
        .getByLabel("Skip", { exact: true })
        .selectOption({ label: `Ravnen · ${i}/5 roller` });
    await page
      .getByLabel("Ditt visningsnavn eller kallenavn", { exact: true })
      .fill(`Elev ${i + 1}`);
    await page
      .getByLabel("Din rolle", { exact: true })
      .selectOption(["språk", "sjømannskap", "diplomati", "tro"][i]);
    await click(
      page,
      i === 0 ? "Opprett skipet og bli høvding" : "Bli med ombord",
    );
    await page
      .getByRole("heading", { name: "Ravnen", exact: true })
      .waitFor({ timeout: 30000 });
  }
  const chief = students[0].page;
  await chief
    .locator(".cg-map-list")
    .getByRole("button", { name: "Lindisfarne", exact: true })
    .click();
  await click(chief, "Bekreft seilas →");
  await chief.reload();
  await click(chief, "Til mannskapets oppgaver");
  const pack = packs.find((p) => p.port.id === "lindisfarne");
  for (const { page } of students) {
    await page
      .getByLabel("Hva står konkret i teksten eller kilden? (minst 20 tegn)", {
        exact: true,
      })
      .fill(
        "Klosteret beskrives som et religiøst sted med betydning for lokalbefolkningen.",
      );
    await page
      .getByLabel("Hva betyr dette for valget vårt, og hvorfor?", {
        exact: true,
      })
      .fill(
        "Vi må vurdere begge parters interesser før vi handler for å unngå unødvendig konflikt.",
      );
    await page
      .getByLabel(/^Hvordan kan den andre parten/)
      .fill(
        "Munkene kan oppleve fremmede som en trussel mot mennesker, eiendom og religiøse tradisjoner.",
      );
    for (let i = 0; i < 4; i++)
      await page
        .locator(`input[name="quiz-${i}"]`)
        .nth(pack.port.stedsquiz[i].correct)
        .check();
    await click(page, "Lever mitt bidrag");
    await page.getByText(/Ditt bidrag er levert/).waitFor({ timeout: 30000 });
  }
  await click(chief, "Åpne rådslagningen");
  for (let i = 0; i < 3; i++) {
    const page = students[i].page;
    await page.locator('input[name="choice"][value="spare"]').check();
    await page
      .getByLabel("Begrunn stemmen din (minst 10 tegn)", { exact: true })
      .fill(
        "Vi bør undersøke kilden og den andre partens perspektiv før vi handler.",
      );
    await click(page, "Forsegl min stemme");
    await text(
      page,
      "Stemmen din er forseglet. De andre kan ikke lese den før opptellingen.",
    );
  }
  assert.equal(
    await chief.getByText(/^Opptelling:/).count(),
    0,
    "Votes stay sealed until the last member votes",
  );
  await chief.reload();
  await text(
    chief,
    "Stemmen din er forseglet. De andre kan ikke lese den før opptellingen.",
  );
  // Queue survives an offline submit and a page refresh, then reconnects under the same identity.
  const last = students[3];
  await last.page.locator('input[name="choice"][value="plunder"]').check();
  await last.page
    .getByLabel("Begrunn stemmen din (minst 10 tegn)", { exact: true })
    .fill(
      "Dette er et alternativ vi ønsker å diskutere med gruppen før utfallet.",
    );
  await last.ctx.setOffline(true);
  await click(last.page, "Forsegl min stemme");
  await wait(
    async () =>
      last.page.evaluate(() =>
        Object.entries(localStorage).some(
          ([key, value]) =>
            key.endsWith(":queue") && JSON.parse(value).commands?.length === 1,
        ),
      ),
    "durable vote queue",
  );
  await last.ctx.setOffline(false);
  await last.page.reload();
  await chief.getByText(/^Opptelling:/).waitFor({ timeout: 30000 });
  await chief
    .getByLabel("Gruppens begrunnelse før utfallet", { exact: true })
    .fill(
      "Flertallet velger å spare klosteret fordi lokalbefolkningens perspektiv og kildens beskrivelse må telle.",
    );
  await click(chief, "Bekreft avgjørelsen");
  await click(chief, "Kast terningen");
  await text(
    chief,
    "Belønningen er allerede lagret én gang. Terningen vurderer ikke den faglige kvaliteten i valget deres.",
  );
  const scores = await chief.locator(".cg-score").innerText();
  await chief.reload();
  await text(
    chief,
    "Belønningen er allerede lagret én gang. Terningen vurderer ikke den faglige kvaliteten i valget deres.",
  );
  assert.equal(
    await chief.locator(".cg-score").innerText(),
    scores,
    "Reload does not grant another reward",
  );
  await click(chief, "Sammenlign og reflekter");
  await chief
    .getByLabel(
      "Hva støtter kilden, og hva er dramatisert eller usikkert? Sammenlign med valget vårt.",
      { exact: true },
    )
    .fill(
      "Kilden støtter at angrepet skapte frykt. Dialogen og mannskapets motiver er dramatisert, og alternativet vårt er en kontrafaktisk øvelse.",
    );
  await chief
    .getByLabel("Bro til i dag: hva vil vi ta med oss?", { exact: true })
    .fill(
      "Vi vil undersøke ulike interesser og kilder før vi bedømmer andre mennesker.",
    );
  await click(chief, "Lagre etterarbeidet");
  await click(chief, "Tilbake til sjøkartet");
  await click(teacher, "Oppgaver og vurdering");
  await teacher
    .locator("summary")
    .filter({ hasText: "Lindisfarne · faglig vurdering" })
    .click();
  await teacher.getByLabel("Begrunnelse", { exact: true }).selectOption("2");
  await teacher.getByLabel("Kildebruk", { exact: true }).selectOption("2");
  await teacher.getByLabel("Perspektiv", { exact: true }).selectOption("1");
  await teacher
    .getByLabel("Faglig tilbakemelding", { exact: true })
    .fill(
      "God begrunnelse og tydelig skille mellom kilde og dramatisering. Utdyp den andre partens perspektiv.",
    );
  await click(teacher, "Lagre faglig vurdering");
  await wait(
    async () =>
      (await chief.locator(".cg-score").innerText()).includes(
        "5\nFaglig vurdering",
      ),
    "independent assessment",
  );
  const downloadEvent = teacher.waitForEvent("download");
  await click(teacher, "Sikkerhetskopier hele spillet");
  const backupDownload = await downloadEvent;
  await backupDownload.saveAs("test-results/classroom-backup.json");
  await teacher.screenshot({
    path: "test-results/teacher.png",
    fullPage: true,
  });
  await students[3].page.screenshot({
    path: "test-results/student-mobile.png",
    fullPage: true,
  });
  assert.equal(
    await students[3].page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
    "No mobile horizontal overflow",
  );
  // Independent solo route shares the engine and resumes after refresh.
  const solo = await browser.newPage();
  watch(solo);
  await solo.goto(`${url}/student?mode=solo`);
  await solo.getByLabel("Skipets navn", { exact: true }).fill("Soloseilet");
  await solo
    .getByLabel("Ditt visningsnavn eller kallenavn", { exact: true })
    .fill("Solo");
  await click(solo, "Opprett skipet og bli høvding");
  await solo
    .locator(".cg-map-list")
    .getByRole("button", { name: "Lindisfarne", exact: true })
    .click();
  await click(solo, "Bekreft seilas →");
  await solo.reload();
  await solo
    .getByRole("heading", { name: "Lindisfarne · Kulturmøte", exact: true })
    .waitFor({ timeout: 30000 });
  await solo.screenshot({ path: "test-results/solo.png", fullPage: true });
  assert.deepEqual(errors, [], "No uncaught browser errors");
  console.log(
    "PASS: teacher + four independent learners; private voting; refresh; offline queue; exactly-once reward; reflection; assessment; backup; mobile; solo resume.",
  );
} catch (e) {
  if (browser)
    for (const context of browser.contexts())
      for (const [i, page] of context.pages().entries()) {
        console.error(
          "FAILED PAGE",
          page.url(),
          (await page.locator("body").innerText()).slice(0, 1600),
        );
        await page
          .screenshot({ path: `test-results/failure-${Date.now()}-${i}.png` })
          .catch(() => {});
      }
  console.error(serverLog);
  throw e;
} finally {
  if (browser) await browser.close();
  vite.kill("SIGTERM");
  await writeFile("test-results/vite.log", serverLog);
}
