/**
 * verify-solo-refresh.mjs — sjekker at en solo/offline-økt gjenopptas rent etter
 * sidelast, både fra kartet og midt i et encounter. Driver vite preview lokalt.
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:4173/';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 900, height: 1300 } });
const p = await ctx.newPage();
let crashed = false;
p.on('pageerror', (e) => { crashed = true; console.log('PAGE ERR:', e.message); });

await p.goto(BASE);
await p.evaluate(() => {
  localStorage.setItem('vikingspill_role', 'student');
  localStorage.setItem('vikingspill_rules_seen_student', '1');
  localStorage.setItem('vikingspill_session', JSON.stringify({ mode: 'offline', groupId: 'g-test', memberId: 'm-test' }));
  localStorage.setItem('vikingspill_group', JSON.stringify({ shipName: 'Prøveskipet', shipSymbol: 'ravn', shipColor: '#2B6B6B', role: 'tro' }));
  // Pre-seed FREMGANG (slik persist() lagrer den) for å bevise ren gjenopptakelse.
  localStorage.setItem('vikingspill_state', JSON.stringify({
    shipName: 'Prøveskipet', shipSymbol: 'ravn', shipColor: '#2B6B6B',
    scores: { culturalUnderstanding: 4, tradeGain: 2, reputation: 3 },
    svennebrev: { språk: 0, sjømannskap: 1, krigskunst: 0, diplomati: 0, tro: 0 },
    visited: ['lindisfarne'], locked: [], goods: {}, unlockedSides: [],
    performedActions: [], saga: [],
  }));
});
await p.reload();
await p.waitForSelector('[data-testid="sea-journey-map"]', { timeout: 10000 });
console.log('1) Landet på kartet (dashboard) med pre-seedet fremgang ✓');

// Fremgangen skal fortsatt ligge i localStorage etter at appen har lest den.
const visitedOk = await p.evaluate(() => {
  try { return (JSON.parse(localStorage.getItem('vikingspill_state')).visited || []).includes('lindisfarne'); }
  catch { return false; }
});
console.log(`2) Besøkt havn (lindisfarne) persistert etter lasting: ${visitedOk ? 'JA ✓' : 'NEI ✗'}`);

// REFRESH fra kartet → skal lande rett på kartet igjen.
await p.reload();
await p.waitForSelector('[data-testid="sea-journey-map"]', { timeout: 10000 });
console.log('3) Reload fra kartet → tilbake på kartet ✓');

// Gå inn i et encounter (history-steget), så reload MIDT i møtet.
await p.locator('[data-testid="map-dest-paris"]').click();
await p.waitForTimeout(500);
await p.locator('[data-testid="confirm-sailing"]').click();
await p.waitForSelector('text=Videre →', { timeout: 15000 });
console.log('4) Inne i encounter (history-steget) ✓');

await p.reload();
await p.waitForTimeout(2500);
const onMap = await p.locator('[data-testid="sea-journey-map"]').count();
const errorScreen = await p.getByText('Skipet gikk på grunn').count();
console.log(`5) Reload MIDT i encounter → ${onMap ? 'tilbake på kartet (fungerende) ✓' : 'IKKE på kartet ✗'}${errorScreen ? ' [FEILSKJERM!]' : ''}`);

const ok = visitedOk && onMap && !errorScreen && !crashed;
console.log(ok ? '\nALLE OK ✓ — solo gjenopptas rent, ingen kræsj/hvit skjerm' : '\nNOE FEILET ✗');
await p.screenshot({ path: '/tmp/solo-refresh-resume.png', fullPage: true });
await b.close();
process.exit(ok ? 0 : 1);
