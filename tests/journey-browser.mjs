import assert from "node:assert/strict";
import packs from "../src/content/packs.json" with { type: "json" };
const click = (page, name) =>
  page.getByRole("button", { name, exact: true }).click({ timeout: 30000 });
async function until(fn, label) {
  const start = Date.now();
  while (!(await fn())) {
    if (Date.now() - start > 30000) throw new Error(`Timeout: ${label}`);
    await new Promise((r) => setTimeout(r, 150));
  }
}
async function command(page, intent) {
  return page.evaluate(async (intent) => {
    const { getRemote } = await import("/src/classroom/remote.ts");
    const remote = await getRemote();
    const session = JSON.parse(localStorage.getItem("vikingspill:v2:session"));
    const id = crypto.randomUUID();
    for (let attempt = 0; attempt < 8; attempt++) {
      const state = await remote.read(
        `v2/games/${session.code}/${intent.groupId ? `groups/${intent.groupId}` : "publicJson"}`,
      );
      try {
        return await remote.call("gameCommand", {
          code: session.code,
          command: { ...intent, id, expectedVersion: state.version },
        });
      } catch (error) {
        if (error.code !== "functions/aborted" || attempt === 7) throw error;
        await new Promise((r) => setTimeout(r, 100));
      }
    }
  }, intent);
}
async function group(page) {
  return page.evaluate(async () => {
    const { getRemote } = await import("/src/classroom/remote.ts");
    const r = await getRemote();
    const s = JSON.parse(localStorage.getItem("vikingspill:v2:session"));
    return r.read(`v2/games/${s.code}/groups/${s.groupId}`);
  });
}
async function backup(page) {
  return page.evaluate(async () => {
    const { getRemote } = await import("/src/classroom/remote.ts");
    const r = await getRemote();
    const s = JSON.parse(localStorage.getItem("vikingspill:v2:session"));
    return r.call("exportClassroom", { code: s.code });
  });
}
async function publicView(page) {
  return page.evaluate(async () => {
    const { getRemote } = await import("/src/classroom/remote.ts");
    const r = await getRemote();
    const s = JSON.parse(localStorage.getItem("vikingspill:v2:session"));
    return r.read(`v2/games/${s.code}/publicJson`);
  });
}
export async function verifyJourneyFeatures(browser, url, watch) {
  const teacherContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const teacher = await teacherContext.newPage();
  watch(teacher);
  await teacher.goto(`${url}/teacher`);
  await click(teacher, "Opprett nytt spill");
  await teacher.locator(".td-code-value").waitFor();
  const code = await teacher.locator(".td-code-value").innerText();
  const players = [];
  for (let i = 0; i < 3; i++) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    watch(page);
    players.push({ page, context });
    await page.goto(`${url}/student`);
    await page.getByLabel("Spillkode", { exact: true }).fill(code);
    await click(page, "Bli med i spillet");
    await page.getByText("Finn mannskapet ditt", { exact: true }).waitFor();
    if (i === 1)
      await page
        .getByLabel("Skip", { exact: true })
        .selectOption({ label: "Reisefølget · 1 medlemmer" });
    else
      await page
        .getByLabel("Skipets navn", { exact: true })
        .fill(i === 0 ? "Reisefølget" : "Kvikksølvet");
    assert.equal(
      await page.getByLabel("Din rolle", { exact: true }).count(),
      0,
    );
    await page
      .getByLabel("Ditt visningsnavn eller kallenavn", { exact: true })
      .fill(`Spiller ${i + 1}`);
    await click(
      page,
      i === 1 ? "Bli med ombord" : "Opprett skipet og bli høvding",
    );
    await page
      .getByRole("heading", {
        name: i === 2 ? "Kvikksølvet" : "Reisefølget",
        exact: true,
      })
      .waitFor();
  }
  const [a, b, x] = players.map((p) => p.page);
  const ship = (await group(a)).id;
  const languageCard = a.locator(".cg-trial-card").filter({
    has: a.getByRole("heading", { name: "Språk og kilder", exact: true }),
  });
  assert.equal(await languageCard.getByRole("button").isDisabled(), true);
  await command(teacher, {
    type: "settings",
    settings: {
      minutes: 45,
      textLength: "group",
      requireQuiz: false,
      requireCouncil: false,
      requireSaga: false,
      requirePerspective: false,
      requireBridge: false,
      keyCards: false,
      saboteur: false,
    },
  });
  async function visit(id, alreadySailed = false) {
    const pack = packs.find((p) => p.port.id === id);
    if (!alreadySailed)
      await command(a, { type: "sail", groupId: ship, destId: id });
    await until(
      async () => (await group(a)).encounter?.phase === "reading",
      `${id} arrival`,
    );
    await a
      .getByRole("heading", {
        name: "Reisenotater · dette kan dere bruke i svenneprøven",
        exact: true,
      })
      .waitFor();
    await command(a, { type: "advance", groupId: ship });
    const factLabel =
      "Hva står konkret i teksten eller kilden? (minst 20 tegn)";
    await a.getByLabel(factLabel, { exact: true }).waitFor();
    if (id === "hedeby") {
      const draft =
        "Markedets avtale må forstås av begge parter før vi bytter.";
      await a.getByLabel(factLabel, { exact: true }).fill(draft);
      const before = await group(a);
      await click(teacher, "Hendelser");
      await click(teacher, "Utløs Ragnarok");
      await until(
        async () =>
          (await group(a)).notices.some((n) => n.title === "Ragnarok"),
        "public event",
      );
      assert.equal(
        await a.getByLabel(factLabel, { exact: true }).inputValue(),
        draft,
      );
      const after = await group(a);
      assert.equal(after.encounter.id, before.encounter.id);
      assert.equal(after.encounter.phase, "tasks");
      await a.reload();
      await a.getByLabel(factLabel, { exact: true }).waitFor();
      assert.equal(
        await a.getByLabel(factLabel, { exact: true }).inputValue(),
        draft,
      );
    }
    for (const page of [a, b]) {
      await page
        .getByLabel(factLabel, { exact: true })
        .fill(
          `Kilden til ${pack.port.name} er grunnlag for en konkret opplysning vi undersøkte.`,
        );
      await page
        .getByLabel("Hva betyr dette for valget vårt, og hvorfor?", {
          exact: true,
        })
        .fill(
          "Vi begrunner valget med opplysningen og skiller den fra vår egen dramatisering.",
        );
      await click(page, "Lever mitt bidrag");
      await page.getByText(/Ditt bidrag er levert/).waitFor();
    }
    await command(a, { type: "advance", groupId: ship });
    await command(a, {
      type: "decide",
      groupId: ship,
      choiceId: pack.port.choices[0].id,
      reason: "Vi har vurdert opplysningene og valgt et begrunnet alternativ.",
    });
    await command(a, { type: "roll", groupId: ship });
    await command(a, { type: "advance", groupId: ship });
    await command(a, {
      type: "reflect",
      groupId: ship,
      historicalComparison:
        "Vi skiller kildenes opplysninger fra den oppdiktede verkstedscenen.",
      reflection: "Vi tar med innsikten fra kulturmøtet til neste havn.",
    });
    await command(a, { type: "finish", groupId: ship });
    await a
      .getByRole("heading", { name: "Svenneprøver", exact: true })
      .waitFor();
  }
  await visit("hedeby");
  assert.equal(await languageCard.getByRole("button").isDisabled(), true);
  await visit("hebrides");
  await languageCard
    .getByRole("button", { name: "Start svenneprøven", exact: true })
    .click();
  await a
    .getByRole("heading", {
      name: "Språk og kilder · Svenneprøve",
      exact: true,
    })
    .waitFor();
  await a.locator('input[name="trial-0"]').first().check();
  await a.reload();
  await a.locator('input[name="trial-0"]').first().waitFor();
  assert.equal(
    await a.locator('input[name="trial-0"]').first().isChecked(),
    true,
  );
  const trialState = (await backup(teacher)).game.groups[ship];
  const answers = await a.evaluate(async (trial) => {
    const { content } = await import("/src/content/index.ts");
    const { trialBank } = await import("/src/domain/trials.ts");
    return trial.questionIndices.map(
      (i) => trialBank(trial, content)[i].correct,
    );
  }, trialState.trial);
  for (let i = 0; i < answers.length; i++)
    await a.locator(`input[name="trial-${i}"]`).nth(answers[i]).check();
  await click(a, "Lever teoriprøven");
  const practice = a.getByLabel(
    "Vis hva dere kan. Beskriv utførelsen og den faglige begrunnelsen.",
    { exact: true },
  );
  await practice.waitFor();
  const practiceDraft =
    "Hele laget viste en misforståelse på markedet og kontrollerte navnesporet med kilden fra Hebridene.";
  await practice.fill(practiceDraft);
  const pendingBefore = (await backup(teacher)).game.groups[ship].trial;
  await click(teacher, "Utløs Ragnarok");
  await until(
    async () =>
      Object.values((await group(a)).notices).filter(
        (n) => n.title === "Ragnarok",
      ).length >= 2,
    "Ragnarok during trial",
  );
  assert.deepEqual(
    (await backup(teacher)).game.groups[ship].trial,
    pendingBefore,
  );
  assert.equal(await practice.inputValue(), practiceDraft);
  await a.reload();
  await practice.waitFor();
  assert.equal(await practice.inputValue(), practiceDraft);
  await click(a, "Lever praksis til vurdering");
  await until(
    async () => (await group(a)).trial?.phase === "pending",
    "practice is committed before teacher assessment",
  );
  await command(teacher, {
    type: "approve_trial",
    groupId: ship,
    approved: true,
    feedback:
      "Dere knytter kildene til tydelig kommunikasjon og viser hva som er usikkert.",
  });
  await click(a, "Tilbake til sjøkartet");
  assert.equal((await group(a)).svennebrev.språk, 1);
  await teacher.getByLabel("Laglek", { exact: true }).selectOption("tapping");
  await click(teacher, "Åpne Gudenes prøve");
  for (const page of [a, b, x]) await click(page, "Jeg er klar");
  await click(teacher, "Start felles nedtelling");
  const challenge = Object.values((await publicView(a)).challenges).find(
    (c) => c.status === "open",
  );
  const target = (page) =>
    page.getByRole("button", { name: "Trykk på Tors tromme", exact: true });
  await until(async () => await target(a).isEnabled(), "shared party start");
  for (let i = 0; i < 6; i++) await target(a).click();
  for (let i = 0; i < 2; i++) await target(b).click();
  for (let i = 0; i < 5; i++) await target(x).click();
  const savedCount = await a.locator(".cg-tap-meta b").innerText();
  assert(Number(savedCount) > 0);
  await click(teacher, "Utløs Ragnarok");
  await until(
    async () =>
      (await group(a)).notices.filter((n) => n.title === "Ragnarok").length >=
      3,
    "Ragnarok during live clicking",
  );
  assert.equal(await a.locator(".cg-tap-meta b").innerText(), savedCount);
  await a.reload();
  await a.locator(".cg-tap-meta b").waitFor();
  assert.equal(await a.locator(".cg-tap-meta b").innerText(), savedCount);
  const countA = Number(await a.locator(".cg-tap-meta b").innerText()),
    countB = Number(await b.locator(".cg-tap-meta b").innerText()),
    countX = Number(await x.locator(".cg-tap-meta b").innerText());
  const winner = countX > (countA + countB) / 2 ? (await group(x)).id : ship;
  await a.screenshot({ path: "test-results/party-mobile.png", fullPage: true });
  await until(
    async () =>
      (await a.getByRole("button", { name: /Lever mine \d+ poeng/ }).count()) >
      0,
    "party deadline",
  );
  await a.getByRole("button", { name: /Lever mine \d+ poeng/ }).click();
  await players[1].context.setOffline(true);
  await b.getByRole("button", { name: /Lever mine \d+ poeng/ }).click();
  await until(
    async () =>
      b.evaluate(() =>
        Object.entries(localStorage).some(
          ([k, v]) =>
            k.endsWith(":queue") && JSON.parse(v).commands?.length === 1,
        ),
      ),
    "offline party result is queued",
  );
  await players[1].context.setOffline(false);
  await b.reload();
  await x.getByRole("button", { name: /Lever mine \d+ poeng/ }).click();
  await click(teacher, "Hendelser");
  await until(
    async () =>
      (await teacher
        .getByRole("button", { name: /Bekreft resultat/ })
        .count()) > 0,
    "all three results",
  );
  await teacher.getByRole("button", { name: /Bekreft resultat/ }).click();
  await until(
    async () =>
      (await publicView(a)).challenges[challenge.id].status === "resolved",
    "teacher confirmed party result",
  );
  const resolved = (await publicView(a)).challenges[challenge.id];
  assert.equal(resolved.status, "resolved");
  assert(resolved.winnerIds.includes(winner));
  assert.equal((await group(a)).svennebrev.språk, 1);
  // A second, nonacademic duel reuses the same shared transport and readiness flow.
  await a
    .getByLabel("Til skip", { exact: true })
    .selectOption((await group(x)).id);
  await a.getByLabel("Holmgangslek", { exact: true }).selectOption("signal");
  await click(a, "Utfordre valgt skip til holmgang");
  for (const page of [a, b, x]) await click(page, "Jeg er klar");
  await until(
    async () =>
      Object.values((await publicView(a)).challenges).some(
        (c) => c.status === "open" && c.kind === "duel" && c.startsAt !== null,
      ),
    "duel starts after all members are ready",
  );
  const duel = Object.values((await publicView(a)).challenges).find(
    (c) => c.status === "open",
  );
  assert.equal(duel.kind, "duel");
  assert.equal(duel.activity, "signal");
  assert(duel.startsAt !== null);
  await command(teacher, { type: "cancel_challenge", challengeId: duel.id });
  await click(teacher, "Spinn skjebnehjulet");
  await until(
    async () => !!(await publicView(a)).wheel,
    "authoritative wheel result",
  );
  await teacher.locator(".fate-wheel-result h3").waitFor();
  await teacher.screenshot({
    path: "test-results/wheel-teacher.png",
    fullPage: true,
  });
  await teacher.setViewportSize({ width: 390, height: 844 });
  const originalWheelTransform = await teacher
    .locator(".fate-wheel-rotor")
    .evaluate((el) => el.style.transform);
  for (const angle of [0, 60, 120, 180, 240, 300]) {
    await teacher.locator(".fate-wheel-rotor").evaluate((el, angle) => {
      el.style.transform = `rotate(${angle}deg)`;
    }, angle);
    assert.equal(
      await teacher.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      `Mobile wheel fits at ${angle} degrees`,
    );
  }
  await teacher.locator(".fate-wheel-rotor").evaluate((el, transform) => {
    el.style.transform = transform;
  }, originalWheelTransform);
  assert.equal(
    await teacher.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
    "Mobile wheel fits viewport",
  );
  await teacher.screenshot({
    path: "test-results/wheel-teacher-mobile.png",
    fullPage: true,
  });
  console.log(
    "PASS: no roles; visited harbor prerequisites; travel theory and practical assessment; drafts, trial answers and live click count survive Ragnarok/reload; shared three-player party countdown and per-member averages; nonacademic duel; authoritative wheel; desktop/mobile layout.",
  );
  for (const p of players) await p.context.close();
  await teacherContext.close();
}
