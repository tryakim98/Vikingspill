/**
 * verify-svenneprove-labels.mjs — verifiserer at svenneprøvens to nivåer viser
 * grad-navnene «Sveinn» (nivå 1) og «Mester» (nivå 2) i tittelen, offline.
 * Seeder localStorage direkte og åpner svenneprøven for Sjømannskap.
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:5174/';
const b = await chromium.launch();

async function openSvenneprove(brev) {
  const ctx = await b.newContext({ viewport: { width: 900, height: 1400 } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => console.log('PAGE ERR:', e.message));
  await p.goto(BASE);
  await p.evaluate((brev) => {
    localStorage.setItem('vikingspill_role', 'student');
    localStorage.setItem('vikingspill_rules_seen_student', '1');
    localStorage.setItem('vikingspill_member_id', 'm_test');
    localStorage.setItem('vikingspill_session', JSON.stringify({ mode: 'offline', groupId: 'g1', memberId: 'm_test' }));
    localStorage.setItem('vikingspill_group', JSON.stringify({ shipName: 'Testskip', shipSymbol: 'drage', shipColor: '#D4A843', startSkill: 'sjømannskap' }));
    localStorage.setItem('vikingspill_state', JSON.stringify({
      scores: { culturalUnderstanding: 0, tradeGain: 0, reputation: 0 },
      svennebrev: { språk: 0, sjømannskap: brev, krigskunst: 0, diplomati: 0, tro: 0 },
      visited: ['lindisfarne', 'hedeby', 'dublin', 'paris', 'hebrides', 'sameland', 'faroyene'],
      locked: [], goods: {}, unlockedSides: [], performedActions: [], saga: [],
    }));
  }, brev);
  await p.reload();
  await p.waitForTimeout(1200);
  // Klikk svennebrev-chip (knapp) for Sjømannskap
  await p.locator('button', { hasText: 'Sjømannskap' }).first().click({ timeout: 5000 }).catch((e) => console.log('klikk feilet:', e.message));
  await p.waitForTimeout(800);
  const body = await p.locator('body').innerText();
  const titleLine = body.split('\n').find((l) => /sjømannskap\s*—/i.test(l)) || '(ingen tittel-linje funnet)';
  console.log(`brev=${brev}  →  «${titleLine.trim()}»`);
  await ctx.close();
}

await openSvenneprove(0); // forventer «Sjømannskap — Sveinn»
await openSvenneprove(1); // forventer «Sjømannskap — Mester»
await b.close();
