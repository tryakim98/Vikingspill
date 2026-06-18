/**
 * verify-live-summon.mjs — verifiserer «kom til meg»-varselet mot LIVE
 * (vikingspill.vercel.app + prod-Firebase). Oppretter et midlertidig spill via
 * lærer-UI, seeder én gruppe, sender varsel, åpner en elev, sjekker overlay +
 * kvittering, og rydder opp. Skriver bare til et engangs-testspill som slettes.
 */
import { chromium } from 'playwright';

const BASE = 'https://vikingspill.vercel.app/';
const DB = 'https://vikingspill-2b754-default-rtdb.europe-west1.firebasedatabase.app';
const put = (p, b) => fetch(`${DB}/${p}.json`, { method: 'PUT', body: JSON.stringify(b) }).then(r => r.json());
const del = (p) => fetch(`${DB}/${p}.json`, { method: 'DELETE' });

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1400, height: 1200 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
p.on('pageerror', e => console.log('TEACHER PAGE ERR:', e.message));
p.on('dialog', (d) => d.accept('Kom til kateteret nå (LIVE-test)').catch(() => {}));

// Lærer: opprett spill på live
await p.goto(BASE);
await p.evaluate(() => { localStorage.setItem('vikingspill_role', 'teacher'); localStorage.setItem('vikingspill_rules_seen_teacher', '1'); });
await p.reload();
await p.waitForTimeout(1500);
await p.locator('[data-testid="create-new-game"]').click();
await p.waitForTimeout(4000);
const code = (await p.locator('.font-mono.text-3xl').first().innerText().catch(() => '')).trim();
console.log('LIVE game code =', code || 'FANT IKKE');
if (!code) { await b.close(); process.exit(1); }

// Seed én gruppe (gjennom prod-Firebase, samme som live-appen leser)
await put(`games/${code}/groups/g-live`, {
  shipName: 'Live-skipet', shipSymbol: 'ravn', shipColor: '#2B6B6B', startSkill: 'tro',
  scores: { culturalUnderstanding: 3, tradeGain: 1, reputation: 2 },
  skills: { språk: 0, sjømannskap: 1, krigskunst: 0, diplomati: 0, tro: 1 },
  visited: ['lindisfarne'], locked: [], updatedAt: Date.now(),
  chiefId: 'm-0', members: { 'm-0': { joinedAt: Date.now() } },
});
await p.waitForTimeout(2000);

// Lærer trykker «Kall hit» på gruppa (live-UI)
const summonBtn = p.locator('[data-testid="summon-g-live"]');
await summonBtn.waitFor({ timeout: 8000 });
await summonBtn.click();
await p.waitForTimeout(1500);
const sentState = (await p.locator('[data-testid="summon-waiting-g-live"]').count()) ? 'kalt (venter)' : 'IKKE sendt';
console.log('lærer-UI etter klikk:', sentState);

// Bekreft i Firebase at varselet ble skrevet (rules slapp det gjennom)
const written = await fetch(`${DB}/games/${code}/groups/g-live/summon.json`).then(r => r.json());
console.log('summon i prod-db:', JSON.stringify(written));

// Elev åpner live, blir med i gruppa, ser overlay
const stud = await b.newContext({ viewport: { width: 900, height: 1300 }, deviceScaleFactor: 1.5 });
const sp = await stud.newPage();
sp.on('pageerror', e => console.log('STUDENT PAGE ERR:', e.message));
await sp.goto(BASE);
await sp.evaluate((c) => {
  localStorage.setItem('vikingspill_role', 'student');
  localStorage.setItem('vikingspill_rules_seen_student', '1');
  localStorage.setItem('vikingspill_member_id', 'm-0');
  localStorage.setItem('vikingspill_session', JSON.stringify({ mode: 'online', gameCode: c, memberId: 'm-0', groupId: 'g-live' }));
}, code);
await sp.reload();
await sp.waitForTimeout(3500);
const overlay = await sp.locator('[data-testid="summon-overlay"]').count();
console.log('ELEV ser varsel-overlay på live:', overlay ? 'JA ✓' : 'NEI ✗');
await sp.screenshot({ path: '/tmp/live-summon-overlay.png', fullPage: true });
await sp.locator('[data-testid="summon-ack"]').click().catch(() => {});
await sp.waitForTimeout(2000);
await stud.close();

// Lærer ser «på vei»
await p.waitForTimeout(1500);
const acked = (await p.locator('[data-testid="summon-acked-g-live"]').count()) ? 'JA ✓ («på vei»)' : 'NEI ✗';
console.log('LÆRER ser kvittering på live:', acked);
const afterAck = await fetch(`${DB}/games/${code}/groups/g-live/summon.json`).then(r => r.json());
console.log('summon etter ack:', JSON.stringify(afterAck));

// Rydd opp
await del(`games/${code}`);
console.log('slettet testspill', code);
await b.close();
console.log('LIVE-VERIFISERING FERDIG.');
