import { chromium } from 'playwright';
const BASE = 'http://localhost:5173/';
const TAG = process.argv[2] || 'before';
const baseState = {
  scores: { culturalUnderstanding: 14, tradeGain: 8, reputation: 5 },
  skills: { språk: 2, sjømannskap: 2, krigskunst: 1, diplomati: 1, tro: 1 },
  visited: ['lindisfarne', 'hedeby'], locked: [], goods: { silke: 1, krydder: 2 },
  unlockedSides: ['miklagard'], performedActions: [], saga: [],
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

// 1) Dashboard top (stat hero + crew)
await p.screenshot({ path: `/tmp/gull-${TAG}-dashboard.png` });

// 2) "Hva kan vi gjøre"-panel
const hva = p.locator('[data-testid="hva-kan-vi-gjore"]');
await hva.scrollIntoViewIfNeeded();
await p.waitForTimeout(300);
await hva.screenshot({ path: `/tmp/gull-${TAG}-hva.png` });

// 3) Kart (sjøkartet)
const map = p.locator('[data-testid="sea-journey-map"]');
await map.scrollIntoViewIfNeeded();
await p.waitForTimeout(400);
await map.screenshot({ path: `/tmp/gull-${TAG}-kart.png` });

console.log(`saved /tmp/gull-${TAG}-{dashboard,hva,kart}.png`);
await b.close();
