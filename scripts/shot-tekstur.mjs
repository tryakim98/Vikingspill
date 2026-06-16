/**
 * shot-tekstur.mjs — skjermbilder av alle elevskjermer for tekstur-arbeidet.
 * Bruk: node scripts/shot-tekstur.mjs <prefix>   (f.eks. "before" eller "after")
 * Lagrer /tmp/tekstur-<prefix>-<skjerm>.png
 */
import { chromium } from 'playwright';

const PREFIX = process.argv[2] || 'shot';
const BASE = 'http://localhost:5173/';

const baseState = {
  scores: { culturalUnderstanding: 14, tradeGain: 8, reputation: 5 },
  skills: { språk: 1, sjømannskap: 2, krigskunst: 1, diplomati: 0, tro: 1 },
  visited: ['lindisfarne', 'hedeby', 'dublin', 'paris'],
  locked: [],
  goods: { pelsverk: 3, solv: 5, jern: 2, silke: 1 },
  unlockedSides: ['hebrides'],
  performedActions: [],
  saga: [
    { destId: 'lindisfarne', destName: 'Lindisfarne', choiceId: 'c1', choiceTitle: 'Vi viste respekt for klosteret', reason: 'Vi valgte fred fordi munkene var ubevæpnede, og vi ville heller ha varer enn blod.', at: 1 },
    { destId: 'hedeby', destName: 'Hedeby', choiceId: 'c2', choiceTitle: 'Vi handlet rettferdig på markedet', reason: 'Et godt rykte er verdt mer enn et raskt kupp.', at: 2 },
  ],
};
const seed = {
  vikingspill_role: 'student',
  vikingspill_rules_seen_student: '1',
  vikingspill_session: JSON.stringify({ mode: 'offline', groupId: 'g-test', memberId: 'm-test' }),
  vikingspill_group: JSON.stringify({ shipName: 'Drakens Vinge', shipSymbol: 'drage', shipColor: '#A0522D', startSkill: 'språk' }),
  vikingspill_state: JSON.stringify(baseState),
};

const b = await chromium.launch();
async function newPage() {
  const ctx = await b.newContext({ viewport: { width: 900, height: 1300 }, deviceScaleFactor: 1.5 });
  const p = await ctx.newPage();
  await p.goto(BASE);
  await p.evaluate((s) => { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); }, seed);
  await p.reload();
  await p.waitForTimeout(1200);
  const close = p.locator('[data-testid="hint-toast"] button[aria-label="Lukk forklaring"]');
  if (await close.count()) { await close.first().click().catch(() => {}); await p.waitForTimeout(200); }
  return { ctx, p };
}
async function save(p, name, full = true) {
  await p.screenshot({ path: `/tmp/tekstur-${PREFIX}-${name}.png`, fullPage: full });
  console.log(`  saved /tmp/tekstur-${PREFIX}-${name}.png`);
}

// 1) Dashboard (full)
{
  const { ctx, p } = await newPage();
  await save(p, 'dashboard');
  await ctx.close();
}

// 2) Saga-logg
{
  const { ctx, p } = await newPage();
  await p.locator('[data-testid="open-own-saga"]').click();
  await p.waitForSelector('[data-testid="saga-reader"]', { timeout: 5000 });
  await p.waitForTimeout(400);
  await save(p, 'saga');
  await ctx.close();
}

// 3) Sluttseremoni (regnskap)
{
  const { ctx, p } = await newPage();
  await p.getByRole('button', { name: 'Sluttseremoni' }).click();
  await p.waitForTimeout(500);
  await p.getByRole('button', { name: /Stig i land/ }).click();
  await p.waitForTimeout(700);
  await save(p, 'ceremony', false);
  await ctx.close();
}

// 4) Encounter: historie → kulturmøte (quiz) → oppgave
async function encounter(destId) {
  const { ctx, p } = await newPage();
  await p.locator(`[data-testid="map-dest-${destId}"]`).click();
  await p.waitForTimeout(400);
  await p.locator('[data-testid="confirm-sailing"]').click();
  await p.waitForSelector('text=Videre →', { timeout: 9000 });
  await p.waitForTimeout(900);
  await save(p, 'encounter-historie');
  // kulturmøte
  await p.getByRole('button', { name: 'Videre →' }).click();
  await p.waitForTimeout(700);
  await save(p, 'encounter-kulturmote');
  await ctx.close();
}
await encounter('island');

// 5) Oppgaveside — egen flyt for å rekke å svare på kulturmøtespørsmålet
{
  const { ctx, p } = await newPage();
  await p.locator('[data-testid="map-dest-island"]').click();
  await p.waitForTimeout(400);
  await p.locator('[data-testid="confirm-sailing"]').click();
  await p.waitForSelector('text=Videre →', { timeout: 9000 });
  await p.waitForTimeout(700);
  await p.getByRole('button', { name: 'Videre →' }).click();
  await p.waitForTimeout(600);
  // svar på første alternativ i kulturmøte-spørsmålet
  const optionBtns = p.locator('.grid button');
  if (await optionBtns.count()) { await optionBtns.first().click(); await p.waitForTimeout(400); }
  const videre = p.getByRole('button', { name: 'Videre →' });
  if (await videre.count()) { await videre.first().click(); await p.waitForTimeout(600); }
  await save(p, 'encounter-oppgave');
  await ctx.close();
}

// 6) Ferdighetsprøve (jern) — klikk Språk-ferdigheten (nivå 1 = kvalifisert)
{
  const { ctx, p } = await newPage();
  const skillBtn = p.locator('button', { hasText: 'Språk' }).first();
  if (await skillBtn.count()) {
    await skillBtn.click().catch(() => {});
    await p.waitForTimeout(700);
  }
  await save(p, 'ferdighetsprove', false);
  await ctx.close();
}

await b.close();
console.log('ferdig.');
