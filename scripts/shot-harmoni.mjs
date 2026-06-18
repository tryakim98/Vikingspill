import { chromium } from 'playwright';
const BASE = 'http://localhost:5173/';
const b = await chromium.launch();

// 1) RulesScreen (vises ved første lasting for elev)
{
  const ctx = await b.newContext({ viewport: { width: 900, height: 1300 }, deviceScaleFactor: 1.5 });
  const p = await ctx.newPage();
  await p.goto(BASE);
  await p.evaluate(() => { localStorage.setItem('vikingspill_role', 'student'); localStorage.removeItem('vikingspill_rules_seen_student'); });
  await p.reload();
  await p.waitForTimeout(1200);
  await p.screenshot({ path: '/tmp/harmoni-rules.png' });
  console.log('saved /tmp/harmoni-rules.png');
  await ctx.close();
}

// 2) Dashboard m/ HintToast (seed en tilstand som trigger en hint: rep > 0 første gang)
{
  const baseState = { scores: { culturalUnderstanding: 5, tradeGain: 0, reputation: 0 }, skills:{}, svennebrev: { språk: 0, sjømannskap: 0, krigskunst: 0, diplomati: 0, tro: 0 }, visited: [], locked: [], goods: {}, unlockedSides: [], performedActions: [], saga: [] };
  const seed = {
    vikingspill_role: 'student', vikingspill_rules_seen_student: '1',
    vikingspill_session: JSON.stringify({ mode: 'offline', groupId: 'g-test', memberId: 'm-test' }),
    vikingspill_group: JSON.stringify({ shipName: 'Drakens Vinge', shipSymbol: 'drage', shipColor: '#A0522D', role: 'språk' }),
    vikingspill_state: JSON.stringify(baseState),
  };
  const ctx = await b.newContext({ viewport: { width: 900, height: 1500 }, deviceScaleFactor: 1.5 });
  const p = await ctx.newPage();
  await p.goto(BASE);
  await p.evaluate((s) => { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); }, seed);
  await p.reload();
  await p.waitForTimeout(1500);
  await p.screenshot({ path: '/tmp/harmoni-dashboard.png' });
  console.log('saved /tmp/harmoni-dashboard.png');
  await ctx.close();
}

await b.close();
