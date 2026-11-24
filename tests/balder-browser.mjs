import assert from "node:assert/strict";

export async function verifyBalder(browser, url, watch) {
  const teacher = await browser.newPage(),
    student = await browser.newPage({ viewport: { width: 390, height: 844 } }),
    peer = await browser.newPage();
  const button = (page, name) =>
    page.getByRole("button", { name, exact: true });
  const see = (page, name) => page.getByText(name, { exact: true }).waitFor();
  for (const p of [teacher, student, peer]) watch(p);
  try {
    await teacher.goto(url);
    await teacher.getByTestId("start-balder").click();
    await button(teacher, "Start Balder for klassen").click();
    await teacher.locator(".bd-code").waitFor();
    const code = await teacher.locator(".bd-code").innerText();
    for (const [p, name] of [
      [student, "Ravnen"],
      [peer, "Stormen"],
    ]) {
      await p.goto(url + "/balder");
      await p.getByLabel("Spillkode fra læreren").fill(code);
      await button(p, "Bli med i Balder").click();
      await p.getByLabel("Skipets navn").fill(name);
      await p
        .getByLabel("Ditt visningsnavn eller kallenavn")
        .fill(name + " elev");
      await button(p, "Opprett skipet").click();
      await p.getByRole("heading", { name: "Sjøkartet" }).waitFor();
    }
    const chart = student.getByRole("region", {
      name: "Sjøkart med tolv havner",
    });
    assert(
      await chart.evaluate(
        (el) => el.scrollWidth > el.clientWidth && el.clientHeight >= 400,
      ),
    );
    assert(
      await student.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await chart.getByRole("button", { name: /Paris/ }).click();
    await see(peer, "Ny klasseutfordring · Flåtesignal 1");
    await peer.getByText("Ny klasseutfordring · Flåtesignal 1").click();
    const shown = await peer.locator(".bd-bonus b").innerText();
    for (const part of shown.split(" · ").reverse())
      await button(peer, part).click();
    await button(peer, "Send signalet").click();
    await see(peer, "Flåtesignal 1 løst · 4/4 bonuspoeng.");
    await button(student, "Seil til Hedeby").click();
    const reflection = student.getByLabel("Skipets refleksjon");
    assert.equal(await student.getByRole("radio").count(), 0);
    await reflection.fill(
      "De kan vise hvor mye tøy hver av dem mener at nikket gjelder.",
    );
    await student.reload();
    await reflection.waitFor();
    assert((await reflection.inputValue()).includes("tøy"));
    await button(student, "Lever og åpne quizen").click();
    const fields = student.locator("fieldset.bd-question");
    await fields.first().waitFor();
    for (const f of await fields.all())
      await f.getByRole("radio").first().check();
    await button(student, "Lever quizsvarene").click();
    await student.getByText("Markedstolken · Klar", { exact: true }).click();
    const proof = student.getByLabel("Dokumentasjon fra gruppa");
    await proof.fill(
      "Den ene pekte på en alen, den andre på hele rullen. Vi målte med hendene.",
    );
    await button(student, "Lever svenneprøven").click();
    await teacher.getByText("Be om en endring", { exact: true }).click();
    await teacher
      .getByLabel("Hva skal gruppa endre?")
      .fill("Skriv hva hver part trodde først.");
    await button(teacher, "Send tilbake").click();
    await see(student, "Fra læreren: Skriv hva hver part trodde først.");
    await proof.fill(
      "A trodde nikket gjaldt hele rullen. B viste én alen mellom hendene.",
    );
    await button(student, "Lever svenneprøven").click();
    await button(teacher, "Godkjenn prøven").click();
    await chart
      .getByRole("button", { name: "Paris · Åpen", exact: true })
      .click();
    await student.getByLabel("Skipets refleksjon").waitFor();
    await peer
      .getByText("Utfordre et skip til holmgang", { exact: true })
      .click();
    await button(peer, "Utfordre Ravnen").click();
    await button(peer, "Jeg er klar").click();
    await button(student, "Jeg er klar").click();
    const drum = button(peer, "Trykk på Tors tromme");
    await drum.click({ timeout: 15000 });
    await drum.click();
    await peer
      .getByText("Stormen vant.", { exact: true })
      .waitFor({ timeout: 55000 });
    await student.getByLabel("Skipets refleksjon").waitFor();
    console.log(
      "PASS: Balder teacher and two independent ships, mobile map, reflection and reload, quiz, revision, lock, cross-class bonus and automatic duel.",
    );
  } finally {
    await Promise.all([teacher.close(), student.close(), peer.close()]);
  }
}
