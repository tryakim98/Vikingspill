import { chromium } from 'playwright';
const BASE = 'http://localhost:5173/';
const TAG = process.argv[2] || 'before';
const baseState = {
  scores: { culturalUnderstanding: 14, tradeGain: 8, reputation: 5 },
  skills: { språk: 2, sjømannskap: 2, krigskunst: 1, diplomati: 1, tro: 1 },
  visited: ['lindisfarne'], locked: [], goods: {}, unlockedSides: ['miklagard'], performedActions: [], saga: [],
};
const seed = {
  vikingspill_role: 'student', vikingspill_rules_seen_student: '1',
  vikingspill_session: JSON.stringify({ mode: 'offline', groupId: 'g-test', memberId: 'm-test' }),
  vikingspill_group: JSON.stringify({ shipName: 'Drakens Vinge', shipSymbol: 'drage', shipColor: '#A0522D', startSkill: 'språk' }),
  vikingspill_state: JSON.stringify(baseState),
};
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 900, height: 1300 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.addInitScript(() => { Math.random = () => 0.9; });
await p.goto(BASE);
await p.evaluate((s) => { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); }, seed);
await p.reload();
await p.waitForTimeout(1500);
const close = p.locator('[data-testid="hint-toast"] button[aria-label="Lukk forklaring"]');
if (await close.count()) { await close.first().click().catch(() => {}); await p.waitForTimeout(200); }
await p.locator('[data-testid="map-dest-hedeby"]').click();
await p.waitForTimeout(400);
await p.locator('[data-testid="confirm-sailing"]').click();

async function answerQuestion() {
  const btns = await p.locator('button:visible').all();
  for (const btn of btns) {
    const t = (await btn.textContent() || '').trim();
    if (t.length > 4 && !/→|Avbryt|Forkort|Hopp|Forlat|Avslutt/.test(t)) { await btn.click().catch(()=>{}); break; }
  }
  await p.waitForTimeout(500);
}
await p.getByText('Videre →').first().waitFor({ timeout: 15000 });
await p.getByText('Videre →').first().click();           // history -> kulturmote
await p.waitForTimeout(700);
await answerQuestion();                                   // svar på kulturmøtespørsmål
await p.getByText('Videre →').first().click();           // kulturmote -> oppgave
await p.waitForTimeout(700);
await p.getByText('Start stedsquiz →').first().click();  // oppgave -> transition
await p.waitForTimeout(2300);                            // overgang

for (let i = 0; i < 14; i++) {
  if (await p.locator('[data-testid^="valg-"]').count()) break;
  const next = p.getByText(/Neste spørsmål →|Til valgene →/);
  if (await next.count()) { await next.first().click().catch(()=>{}); await p.waitForTimeout(500); continue; }
  // ellers: vi er på et spørsmål — klikk et svaralternativ (knapp uten pil/avbryt)
  const btns = await p.locator('button:visible').all();
  for (const btn of btns) {
    const t = (await btn.textContent() || '').trim();
    if (t.length > 4 && !/→|Avbryt|Forkort|Hopp|Forlat|Avslutt/.test(t)) { await btn.click().catch(()=>{}); break; }
  }
  await p.waitForTimeout(500);
}

await p.waitForTimeout(600);
const valg = p.locator('[data-testid^="valg-"]').first();
if (await valg.count()) {
  await valg.scrollIntoViewIfNeeded();
  await p.waitForTimeout(300);
  await valg.screenshot({ path: `/tmp/odds-${TAG}.png` });
  console.log(`saved /tmp/odds-${TAG}.png`);
} else {
  await p.screenshot({ path: `/tmp/odds-${TAG}-fallback.png` });
  console.log(`valg ikke nådd — fallback`);
}
await b.close();
