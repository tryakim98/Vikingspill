import { chromium } from 'playwright';
const BASE = 'http://localhost:5173/';
const baseState = {
  scores: { culturalUnderstanding: 14, tradeGain: 8, reputation: 5 },
  skills: { språk: 2, sjømannskap: 2, krigskunst: 1, diplomati: 1, tro: 1 },
  visited: [], locked: [], goods: {}, unlockedSides: ['miklagard', 'hebrides'], performedActions: [], saga: [],
};
const seed = {
  vikingspill_role: 'student', vikingspill_rules_seen_student: '1',
  vikingspill_session: JSON.stringify({ mode: 'offline', groupId: 'g-test', memberId: 'm-test' }),
  vikingspill_group: JSON.stringify({ shipName: 'Drakens Vinge', shipSymbol: 'drage', shipColor: '#A0522D', startSkill: 'språk' }),
  vikingspill_state: JSON.stringify(baseState),
};
const b = await chromium.launch();
async function shoot(destId) {
  const ctx = await b.newContext({ viewport: { width: 900, height: 1300 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.goto(BASE);
  await p.evaluate((s) => { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); }, seed);
  await p.reload();
  await p.waitForTimeout(1200);
  const close = p.locator('[data-testid="hint-toast"] button[aria-label="Lukk forklaring"]');
  if (await close.count()) { await close.first().click().catch(() => {}); await p.waitForTimeout(200); }
  await p.locator(`[data-testid="map-dest-${destId}"]`).click();
  await p.waitForTimeout(500);
  await p.locator('[data-testid="confirm-sailing"]').click();
  // Historiesteget: «Videre →» finnes, men vi skjermbilder FØR vi klikker den.
  await p.waitForSelector('text=Videre →', { timeout: 8000 });
  await p.waitForTimeout(900); // la bildet dekode
  const banner = p.locator('img[alt^="Ankomst til"]');
  const ok = await banner.count();
  const natural = ok ? await banner.first().evaluate((el) => ({ w: el.naturalWidth, h: el.naturalHeight })) : null;
  console.log(`${destId}: banner=${ok ? 'JA' : 'NEI'} ${natural ? `(lastet ${natural.w}x${natural.h})` : ''}`);
  await p.screenshot({ path: `/tmp/historie-${destId}.png` });
  console.log(`  saved /tmp/historie-${destId}.png`);
  await ctx.close();
}
await shoot('lindisfarne');
await shoot('hebrides');
await b.close();
