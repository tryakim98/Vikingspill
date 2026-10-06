import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { verifyJourneyFeatures } from "./journey-browser.mjs";
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
// Extra authenticated ships exercise a classroom-sized fleet and offline help.
async function seedFleet(code) {
  const names = [
    "Bølgebryteren",
    "Drageskipet",
    "Nordlyset",
    "Havørnen",
    "Ulven",
  ];
  for (let i = 0; i < names.length; i++) {
    const auth = await fetch(
      "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ returnSecureToken: true }),
      },
    );
    assert.equal(auth.status, 200);
    const { idToken: token } = await auth.json();
    const call = async (name, data) => {
      const response = await fetch(
        `http://127.0.0.1:5001/demo-vikingspill/europe-west1/${name}`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ data }),
        },
      );
      const value = await response.json();
      assert.equal(response.status, 200, JSON.stringify(value));
      return value.result;
    };
    const read = async (path) => {
      const response = await fetch(
        `http://127.0.0.1:9000/v2/games/${code}/${path}.json?ns=demo-vikingspill-default-rtdb&auth=${token}`,
      );
      assert.equal(response.status, 200);
      return JSON.parse(await response.json());
    };
    await call("joinClassroom", { code, id: randomUUID() });
    const groupId = `g-${randomUUID()}`;
    await call("gameCommand", {
      code,
      command: {
        id: randomUUID(),
        expectedVersion: (await read("publicJson")).version,
        type: "create_ship",
        groupId,
        shipName: names[i],
        shipColor: ["#8b5550", "#9a854e", "#638172", "#667d93", "#9b806e"][i],
        shipSymbol: ["drage", "ulv", "ravn"][i % 3],
        role: "språk",
        label: `Mannskap ${i + 1}`,
      },
    });
    await call("gameCommand", {
      code,
      command: {
        id: randomUUID(),
        expectedVersion: (await read(`groups/${groupId}`)).version,
        type: "sail",
        groupId,
        destId: ["hedeby", "dublin", "lindisfarne"][i % 3],
      },
    });
  }
}
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
  await teacher.locator(".td-code-value").waitFor({ timeout: 30000 });
  const code = await teacher.locator(".td-code-value").innerText();
  assert.equal(
    await teacher
      .getByRole("button", { name: "Oversikt", exact: true })
      .getAttribute("aria-pressed"),
    "true",
    "Current teacher view is marked",
  );
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
        .selectOption({ label: `Ravnen · ${i} medlemmer` });
    await page
      .getByLabel("Ditt visningsnavn eller kallenavn", { exact: true })
      .fill(`Elev ${i + 1}`);
    await click(
      page,
      i === 0 ? "Opprett skipet og bli høvding" : "Bli med ombord",
    );
    await page
      .getByRole("heading", { name: "Ravnen", exact: true })
      .waitFor({ timeout: 30000 });
  }
  const chief = students[0].page;
  await teacher
    .locator(".td-ship-card h3")
    .filter({ hasText: "Ravnen" })
    .waitFor();
  await teacher.screenshot({
    path: "test-results/teacher-overview.png",
    fullPage: true,
  });
  await chief
    .locator(".cg-map-list")
    .getByRole("button", { name: "Lindisfarne", exact: true })
    .click();
  await click(chief, "Bekreft seilas →");
  await chief.reload();
  await click(chief, "Til mannskapets oppgaver");
  await chief
    .getByLabel("Hva står konkret i teksten eller kilden? (minst 20 tegn)", {
      exact: true,
    })
    .waitFor();
  // One quick signal works without typing and carries the exact encounter.
  const chiefFeedback = chief.locator("details.cg-feedback");
  await chiefFeedback.locator(":scope > summary").click();
  await click(chief, "For mange regler");
  await click(chief, "Send tilbakemelding");
  await chiefFeedback
    .getByText("Mottatt. Læreren kan lese den.", { exact: true })
    .waitFor();
  const quick = await chief.evaluate(
    () => JSON.parse(localStorage.getItem("vikingspill_feedback_v3"))[0],
  );
  assert.equal(quick.post.comment, "");
  assert.equal(quick.post.destId, "lindisfarne");
  assert.equal(quick.post.screen, "tasks");
  assert.ok(quick.post.encounterId);
  assert.equal(quick.status, "sent");
  await click(chief, "Gi en tilbakemelding til");
  await click(chief, "Noe virker ikke");
  await chiefFeedback.locator(".cg-feedback-extra > summary").click();
  const gameFeedbackComment = "Tilbakemeldingstest: en knapp reagerte ikke.";
  await chief
    .getByLabel("Hva vil du fortelle? (valgfritt)", { exact: true })
    .fill(gameFeedbackComment);
  await click(chief, "Send tilbakemelding");
  await chiefFeedback
    .getByText("Mottatt. Læreren kan lese den.", { exact: true })
    .waitFor();
  const two = await chief.evaluate(() =>
    JSON.parse(localStorage.getItem("vikingspill_feedback_v3")),
  );
  assert.equal(two.length, 2);
  assert.notEqual(
    two[0].post.id,
    two[1].post.id,
    "A new report never reuses the previous receipt",
  );
  assert.equal(two[1].post.comment, gameFeedbackComment);
  // Keep the form compact once the optional feedback is done.
  await chiefFeedback.locator(":scope > summary").click();
  const mobilePupil = students[3];
  await mobilePupil.ctx.setOffline(true);
  const mobileFeedback = mobilePupil.page.locator("details.cg-feedback");
  await mobileFeedback.locator(":scope > summary").click();
  await click(mobilePupil.page, "Usikker på neste steg");
  assert.equal(
    await mobilePupil.page
      .getByRole("button", { name: "Usikker på neste steg", exact: true })
      .evaluate((el) => getComputedStyle(el).backgroundColor),
    "rgb(245, 221, 160)",
    "Selected quick feedback remains readable while hovered",
  );
  await mobileFeedback.screenshot({
    path: "test-results/feedback-mobile.png",
  });
  await click(mobilePupil.page, "Send tilbakemelding");
  await mobileFeedback
    .getByText(
      "Lagret på enheten. Sendes når nettet er tilbake i denne økten.",
      { exact: true },
    )
    .waitFor();
  const offlineFeedback = await mobilePupil.page.evaluate(
    () => JSON.parse(localStorage.getItem("vikingspill_feedback_v3"))[0],
  );
  assert.equal(offlineFeedback.status, "pending");
  // A reload may interrupt the first reconnect request; the same ID is retried.
  await mobilePupil.ctx.setOffline(false);
  await mobilePupil.page.reload();
  await wait(
    async () =>
      (
        await mobilePupil.page.evaluate(
          () => JSON.parse(localStorage.getItem("vikingspill_feedback_v3"))[0],
        )
      ).status === "sent",
    "feedback outbox after reconnect and reload",
  );
  await teacher
    .getByRole("button", {
      name: "Se spillernes tilbakemeldinger (3)",
      exact: true,
    })
    .waitFor();
  await click(teacher, "Se spillernes tilbakemeldinger (3)");
  const inbox = teacher.locator("#feedback-inbox");
  await inbox.getByText(gameFeedbackComment, { exact: true }).waitFor();
  assert.equal(await inbox.locator(".cg-feedback-list li").count(), 3);
  assert.ok((await inbox.innerText()).includes("Lindisfarne · Oppgavene"));
  assert.equal(
    await inbox.getByText("Elev 1", { exact: true }).count(),
    0,
    "The inbox does not add learner names",
  );
  assert.equal(
    await inbox.evaluate((el) => document.activeElement === el),
    true,
    "The inbox shortcut moves keyboard focus",
  );
  await inbox
    .getByLabel("Vis tilbakemeldinger", { exact: true })
    .selectOption("bug");
  assert.equal(await inbox.locator(".cg-feedback-list li").count(), 1);
  await inbox
    .getByLabel("Vis tilbakemeldinger", { exact: true })
    .selectOption("all");
  const feedbackDownload = teacher.waitForEvent("download");
  await click(teacher, "Eksporter tilbakemeldinger");
  await (await feedbackDownload).saveAs("test-results/player-feedback.csv");
  await inbox.screenshot({
    path: "test-results/feedback-teacher.png",
  });
  await click(teacher, "Oversikt");
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
  const learnerContribution = teacher
    .locator(".td-evidence")
    .filter({ hasText: "Elev 2" });
  await learnerContribution.locator("summary").click();
  assert.equal(
    await learnerContribution
      .getByText("Fakta fra teksten eller kilden", { exact: true })
      .isVisible(),
    true,
    "Historical contributions identify the individual learner",
  );
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
  await teacher.screenshot({
    path: "test-results/teacher.png",
    fullPage: true,
  });
  await students[3].page.screenshot({
    path: "test-results/student-mobile.png",
    fullPage: true,
  });
  await seedFleet(code);
  await click(teacher, "Oversikt");
  await wait(
    async () => (await teacher.locator(".td-ship-card").count()) === 6,
    "Six ships on the fleet overview",
  );
  await teacher.screenshot({
    path: "test-results/teacher-fleet.png",
    fullPage: true,
  });
  await click(teacher, "Se Ulven");
  await teacher.getByRole("heading", { name: "Ulven", exact: true }).waitFor();
  await teacher.getByRole("button", { name: "Ravnen", exact: true }).click();
  await teacher
    .locator("summary")
    .filter({ hasText: "Lindisfarne · faglig vurdering" })
    .click();
  const originalFeedback = await teacher
    .getByLabel("Faglig tilbakemelding", { exact: true })
    .inputValue();
  const unsavedFeedback = `${originalFeedback} Dette er et ulagret utkast.`;
  await teacher
    .getByLabel("Faglig tilbakemelding", { exact: true })
    .fill(unsavedFeedback);
  await teacher.getByRole("button", { name: "Ulven", exact: true }).click();
  await teacher.getByRole("button", { name: "Ravnen", exact: true }).click();
  await teacher
    .locator("summary")
    .filter({ hasText: "Lindisfarne · faglig vurdering" })
    .click();
  assert.equal(
    await teacher
      .getByLabel("Faglig tilbakemelding", { exact: true })
      .inputValue(),
    unsavedFeedback,
    "Unsaved rubric survives choosing a different ship",
  );
  await click(teacher, "Vis på storskjerm");
  await teacher
    .getByRole("heading", { name: "Flåten på sjøkartet", exact: true })
    .waitFor();
  assert.equal(
    (await teacher.getByText("Ravnen", { exact: true }).count()) > 0,
    true,
    "Presentation includes ship names",
  );
  assert.equal(
    await teacher.getByText(/Elev [1-4]/).count(),
    0,
    "Presentation excludes individual learner names",
  );
  assert.equal(
    await teacher.getByText(/Mannskap [1-5]/).count(),
    0,
    "Presentation excludes fixture learner names",
  );
  assert.equal(
    await teacher.getByText(/God begrunnelse og tydelig skille/).count(),
    0,
    "Presentation excludes teacher feedback",
  );
  assert.equal(
    await teacher.getByText(gameFeedbackComment, { exact: true }).count(),
    0,
    "Presentation excludes game feedback, even though the teacher inbox is subscribed",
  );
  assert.equal(
    await teacher
      .locator("textarea, select, .td-navigation, .td-rubric")
      .count(),
    0,
    "Presentation excludes teacher controls",
  );
  await teacher.screenshot({
    path: "test-results/teacher-presentation.png",
    fullPage: true,
  });
  await teacher.keyboard.press("Escape");
  await wait(
    async () =>
      teacher
        .getByRole("button", { name: "Vis på storskjerm", exact: true })
        .evaluate((el) => el === document.activeElement),
    "Escape restores keyboard focus",
  );
  await teacher
    .locator("summary")
    .filter({ hasText: "Lindisfarne · faglig vurdering" })
    .click();
  assert.equal(
    await teacher
      .getByLabel("Faglig tilbakemelding", { exact: true })
      .inputValue(),
    unsavedFeedback,
    "Unsaved rubric survives presentation mode",
  );
  await teacher
    .getByLabel("Faglig tilbakemelding", { exact: true })
    .fill(originalFeedback);
  await click(teacher, "Økt og innstillinger");
  await teacher.getByLabel("Øktlengde", { exact: true }).selectOption("90");
  await text(teacher, "Av 90 minutter · 20 min til etterarbeid");
  await teacher.getByLabel("Øktlengde", { exact: true }).selectOption("45");
  await text(teacher, "Av 45 minutter · 10 min til etterarbeid");
  const downloadEvent = teacher.waitForEvent("download");
  await click(teacher, "Sikkerhetskopier hele spillet");
  const backupDownload = await downloadEvent;
  await backupDownload.saveAs("test-results/classroom-backup.json");
  await teacher.screenshot({
    path: "test-results/teacher-settings.png",
    fullPage: true,
  });
  await teacher.setViewportSize({ width: 390, height: 844 });
  for (const name of [
    "Oversikt",
    "Oppgaver og vurdering",
    "Hendelser",
    "Økt og innstillinger",
  ]) {
    await click(teacher, name);
    assert.equal(
      await teacher.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      `No horizontal overflow in teacher view: ${name}`,
    );
  }
  await click(teacher, "Oversikt");
  await teacher.screenshot({
    path: "test-results/teacher-mobile.png",
    fullPage: true,
  });
  await click(teacher, "Oppgaver og vurdering");
  await teacher
    .getByRole("combobox", { name: "Velg skip til vurdering", exact: true })
    .selectOption({ label: "Ulven" });
  await teacher.getByRole("heading", { name: "Ulven", exact: true }).waitFor();
  await teacher
    .getByRole("combobox", { name: "Velg skip til vurdering", exact: true })
    .selectOption({ label: "Ravnen" });
  await teacher
    .locator("summary")
    .filter({ hasText: "Lindisfarne · faglig vurdering" })
    .click();
  assert.equal(
    await teacher.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
    "Expanded mobile assessment fits the viewport",
  );
  await teacher.screenshot({
    path: "test-results/teacher-mobile-review.png",
    fullPage: true,
  });
  await teacher.setViewportSize({ width: 1440, height: 1000 });
  // Returning to a ship keeps a saved assessment available, including after closing.
  await click(teacher, "Økt og innstillinger");
  await click(teacher, "Avslutt økten og behold sagaene");
  await teacher
    .getByRole("button", { name: "Økten er avsluttet", exact: true })
    .waitFor();
  // Reports remain available after the lesson; asking for one is optional.
  await chief
    .getByText("Før dere går: gi tilbakemelding om spillet", { exact: true })
    .waitFor();
  await chief.locator("details.cg-feedback > summary").click();
  const anotherFeedback = chief.getByRole("button", {
    name: "Gi en tilbakemelding til",
    exact: true,
  });
  if (await anotherFeedback.count()) await anotherFeedback.click();
  await click(chief, "Dette likte jeg");
  await click(chief, "Send tilbakemelding");
  await chief
    .locator("details.cg-feedback")
    .getByText("Mottatt. Læreren kan lese den.", { exact: true })
    .waitFor();
  await teacher
    .getByRole("button", {
      name: "Se spillernes tilbakemeldinger (4)",
      exact: true,
    })
    .waitFor();
  await click(teacher, "Se spillernes tilbakemeldinger (4)");
  await teacher
    .locator("#feedback-inbox .cg-feedback-list li")
    .filter({ hasText: "Dette likte jeg" })
    .getByText(/Etter økten/)
    .waitFor();
  // Block only feedback storage: Firebase auth and the game remain available.
  const blocked = students[1].page;
  await blocked.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "vikingspill_feedback_v3")
        throw new DOMException("Test storage limit", "QuotaExceededError");
      return original.call(this, key, value);
    };
  });
  await blocked.locator("details.cg-feedback > summary").click();
  await click(blocked, "Dette likte jeg");
  await click(blocked, "Send tilbakemelding");
  await blocked
    .locator("details.cg-feedback")
    .getByText("Mottatt. Læreren kan lese den.", { exact: true })
    .waitFor();
  assert.equal(
    await blocked.evaluate(() =>
      localStorage.getItem("vikingspill_feedback_v3"),
    ),
    null,
  );
  await teacher
    .getByRole("button", {
      name: "Se spillernes tilbakemeldinger (5)",
      exact: true,
    })
    .waitFor();
  await click(teacher, "Oppgaver og vurdering");
  await teacher
    .locator("summary")
    .filter({ hasText: "Lindisfarne · faglig vurdering" })
    .click();
  assert.equal(
    await teacher.getByLabel("Begrunnelse", { exact: true }).inputValue(),
    "2",
    "Saved rubric survives view changes and classroom closing",
  );
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
  const soloFeedback = solo.locator("details.cg-feedback");
  await soloFeedback.locator(":scope > summary").click();
  await soloFeedback.locator(".cg-feedback-extra > summary").click();
  await solo
    .getByLabel("Hva vil du fortelle? (valgfritt)", { exact: true })
    .fill("Færre oppgaver.");
  await click(solo, "Send tilbakemelding");
  await soloFeedback
    .getByText(
      "Lagret på denne enheten. Last ned og del den med læreren eller den som utvikler spillet.",
      { exact: true },
    )
    .waitFor();
  const soloPost = await solo.evaluate(
    () => JSON.parse(localStorage.getItem("vikingspill_feedback_v3"))[0],
  );
  assert.equal(soloPost.status, "local");
  assert.equal(soloPost.code, null);
  assert.equal(soloPost.uid, null);
  const soloDownload = solo.waitForEvent("download");
  await click(solo, "Last ned tilbakemeldinger");
  await (await soloDownload).saveAs("test-results/solo-feedback.json");
  // Use the same command store to open a deterministic solo practice game.
  const soloParty = await solo.evaluate(async () => {
    const { GameStore, loadSession } = await import("/src/classroom/store.ts");
    const session = loadSession();
    const store = new GameStore(session);
    const stop = store.start();
    try {
      await store.send({
        type: "event",
        kind: "trial",
        title: "Gudenes prøve",
        message: "",
        activity: "tapping",
      });
      if (store.getSnapshot().error) throw new Error(store.getSnapshot().error);
      const game = store.exportSolo();
      return {
        id: Object.keys(game.challenges)[0],
        storageKey: store.storageKey,
        groupId: session.groupId,
        encounter: game.groups[session.groupId].encounter,
      };
    } finally {
      stop();
    }
  });
  await solo.reload();
  await click(solo, "Jeg er klar");
  const drum = solo.getByRole("button", { name: "Trykk på Tors tromme" });
  await wait(async () => drum.isEnabled(), "solo party starts without teacher");
  await drum.click();
  await solo.getByRole("button", { name: "Lever mine 1 poeng" }).click();
  await click(solo, "Avslutt øvingsleken");
  await wait(
    async () =>
      solo.evaluate(
        ({ storageKey, id }) =>
          JSON.parse(localStorage.getItem(storageKey)).challenges[id].status ===
          "resolved",
        soloParty,
      ),
    "solo party is resolved without teacher",
  );
  assert.deepEqual(
    await solo.evaluate(
      ({ storageKey, groupId }) =>
        JSON.parse(localStorage.getItem(storageKey)).groups[groupId].encounter,
      soloParty,
    ),
    soloParty.encounter,
    "Solo party leaves the current culture encounter intact",
  );
  await verifyJourneyFeatures(browser, url, watch);
  assert.deepEqual(errors, [], "No uncaught browser errors");
  console.log(
    "PASS: teacher + four independent learners; private voting; refresh; offline queue; exactly-once reward; reflection; assessment; backup; teacher navigation, settings and private presentation; mobile teacher views; closed-session assessment; solo resume and party completion; quick/optional feedback, context, offline retry, teacher inbox, filters, exports and post-lesson feedback.",
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
