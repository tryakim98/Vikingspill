import { chromium } from 'playwright';
const BASE = 'http://localhost:5173/';
const baseState = {
  scores: { culturalUnderstanding: 14, tradeGain: 8, reputation: 5 },
  skills: { språk: 2, sjømannskap: 2, krigskunst: 1, diplomati: 1, tro: 1 },
  visited: [], locked: [], goods: {}, unlockedSides: ['miklagard'], performedActions: [], saga: [],
};
const seed = {
  vikingspill_role: 'student', vikingspill_rules_seen_student: '1',
  vikingspill_session: JSON.stringify({ mode: 'offline', groupId: 'g-test', memberId: 'm-test' }),
  vikingspill_group: JSON.stringify({ shipName: 'Drakens Vinge', shipSymbol: 'drage', shipColor: '#A0522D', startSkill: 'språk' }),
  vikingspill_state: JSON.stringify(baseState),
};
const b = await chromium.launch();
async function shoot(destId, label) {
  const ctx = await b.newContext({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.addInitScript(() => { Math.random = () => 0.9; });
  await p.goto(BASE);
  await p.evaluate((s) => { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); }, seed);
  await p.reload();
  await p.waitForTimeout(1200);
  const close = p.locator('[data-testid="hint-toast"] button[aria-label="Lukk forklaring"]');
  if (await close.count()) { await close.first().click().catch(() => {}); await p.waitForTimeout(200); }
  await p.locator(`[data-testid="map-dest-${destId}"]`).click();
  await p.waitForTimeout(500);
  await p.locator('[data-testid="confirm-sailing"]').click();
  await p.waitForSelector('text=Videre →', { timeout: 8000 });
  await p.locator('text=Videre →').first().click();
  await p.waitForSelector('[data-testid="runepinne"]', { timeout: 5000 });
  await p.waitForTimeout(700);
  const frame = p.locator('[data-testid="runepinne"]');
  await frame.scrollIntoViewIfNeeded();
  await p.waitForTimeout(300);
  const info = await frame.evaluate((el) => {
    const field = el.querySelector('div'); const p = el.querySelector('p');
    return { chars: (p?.textContent || '').length, scrollH: field.scrollHeight, clientH: field.clientHeight };
  });
  console.log(`${label} (${destId}): ${info.chars} tegn | felt ${info.clientH}px, innhold ${info.scrollH}px ${info.scrollH > info.clientH + 2 ? '(scroller)' : '(får plass)'}`);
  await frame.screenshot({ path: `/tmp/km2-${label}-frame.png` });
  await p.screenshot({ path: `/tmp/km2-${label}-full.png` });
  console.log(`  saved /tmp/km2-${label}-frame.png + -full.png`);
  await ctx.close();
}
await shoot('hedeby', 'kort');
await shoot('miklagard', 'lang');
await b.close();
