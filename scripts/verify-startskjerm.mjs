/**
 * verify-startskjerm.mjs — verifiserer den tre-veis startskjermen:
 * skjermbilder (desktop + 360px) og at hvert kort ruter til riktig inngang.
 * Krever dev-server på :5173.
 */
import { chromium } from 'playwright';
const BASE = 'http://localhost:5173/';
const b = await chromium.launch();
let fail = 0;
const ok = (c, m) => { if (!c) fail++; console.log(`  ${c ? '✓' : '✗'} ${m}`); };

async function fresh(viewport) {
  const ctx = await b.newContext({ viewport, deviceScaleFactor: 1.5 });
  const p = await ctx.newPage();
  await p.goto(BASE);
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(800);
  return { ctx, p };
}

// 1) Skjermbilder
{
  const { ctx, p } = await fresh({ width: 1280, height: 900 });
  ok(await p.locator('[data-testid="start-odin"]').count() === 1, 'Odin-kort finnes');
  ok(await p.locator('[data-testid="start-viking"]').count() === 1, 'Viking-kort finnes');
  ok(await p.locator('[data-testid="start-tor"]').count() === 1, 'Tor-kort finnes');
  await p.screenshot({ path: '/tmp/start-desktop.png' });
  console.log('  saved /tmp/start-desktop.png');
  await ctx.close();
}
{
  const { ctx, p } = await fresh({ width: 360, height: 760 });
  await p.screenshot({ path: '/tmp/start-360.png', fullPage: true });
  console.log('  saved /tmp/start-360.png');
  await ctx.close();
}

// 2) Ruting: ODIN → /teacher
{
  console.log('\n[ODIN → lærer]');
  const { ctx, p } = await fresh({ width: 1280, height: 900 });
  await p.locator('[data-testid="start-odin"]').click();
  await p.waitForTimeout(1200);
  ok(p.url().includes('/teacher'), `URL = ${p.url()}`);
  ok((localStorage_role(await p.evaluate(() => localStorage.getItem('vikingspill_role')))) === 'teacher', 'rolle = teacher');
  await ctx.close();
}

// 3) Ruting: VIKING → /student + JoinGame (online kode-inngang), ingen økt seeded
{
  console.log('\n[VIKING → flerspiller/online]');
  const { ctx, p } = await fresh({ width: 1280, height: 900 });
  await p.locator('[data-testid="start-viking"]').click();
  await p.waitForTimeout(1200);
  ok(p.url().includes('/student'), `URL = ${p.url()}`);
  const sess = await p.evaluate(() => localStorage.getItem('vikingspill_session'));
  ok(sess === null, 'ingen økt seeded (JoinGame tar koden)');
  // Ny elev ser regelskjermen først (eksisterende oppførsel) → avvis den, så kommer JoinGame.
  const klar = p.getByText('Jeg er klar', { exact: false });
  if (await klar.count()) { await klar.first().click(); await p.waitForTimeout(600); }
  ok(await p.getByText('Bli med i lærerens spill').count() > 0, 'JoinGame kode-inngang vises');
  await ctx.close();
}

// 4) Ruting: TOR → /student offline (playOffline seeder økt → SetupFlow)
{
  console.log('\n[TOR → alene/offline]');
  const { ctx, p } = await fresh({ width: 1280, height: 900 });
  await p.locator('[data-testid="start-tor"]').click();
  await p.waitForTimeout(1400);
  ok(p.url().includes('/student'), `URL = ${p.url()}`);
  const sess = JSON.parse(await p.evaluate(() => localStorage.getItem('vikingspill_session')) || 'null');
  ok(sess && sess.mode === 'offline', `økt seeded offline: ${JSON.stringify(sess)}`);
  await ctx.close();
}

function localStorage_role(v) { return v; }

await b.close();
console.log(`\n${fail === 0 ? '✅ ALLE OK' : `❌ ${fail} feil`}`);
process.exit(fail === 0 ? 0 : 1);
