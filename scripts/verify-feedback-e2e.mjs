/**
 * verify-feedback-e2e.mjs — ende-til-ende-verifisering av tilbakemeldings-pingen.
 * Forutsetter en kjørende app (preview på :4173 som default) + Firebase CLI innlogget.
 *
 * Sjekker:
 *   (rules) uinnlogget REST-skriv TILLATES (gyldig post), AVVISES (ugyldig kategori / for lang okt)
 *   (a) EKTE app-bane (Playwright → submitFeedback) lander i Firebase med ALLE felt + okt
 *   (b) offline: feilen svelges stille, posten ligger i localStorage, ingen krasj
 * Rydder opp alle testposter i feedback-noden etterpå (CLI admin).
 */
import { chromium } from 'playwright';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const BASE = process.env.BASE || 'http://localhost:4173/';
const env = Object.fromEntries(
  readFileSync('.env', 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => {
    const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  })
);
const DB = env.VITE_FIREBASE_DATABASE_URL;
const PROJECT = env.VITE_FIREBASE_PROJECT_ID;
const MARK = `E2E-${Date.now()}`;        // unik markør i kommentaren → finn/rydd testposten
const OKT = 'E2E-3B-mandag';

let fail = 0;
const ok = (c, m) => { if (!c) fail++; console.log(`  ${c ? '✓' : '✗'} ${m}`); };
const fbGet = () => { try { return JSON.parse(execSync(`firebase database:get /feedback --project ${PROJECT}`, { encoding: 'utf8' }) || 'null'); } catch { return null; } };
const fbDel = (key) => { try { execSync(`firebase database:remove /feedback/${key} --project ${PROJECT} --force`, { stdio: 'ignore' }); } catch { /* */ } };

// ── (rules) direkte REST-prober (uinnlogget elev-enhet) ───────────────────────────
console.log('\n[REGLER] uinnlogget REST-skriv mot prod feedback-node');
const restPost = (body) => fetch(`${DB}/feedback.json`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  .then(async (r) => ({ status: r.status, json: await r.json().catch(() => null) }));

const validRest = await restPost({ tidspunkt: Date.now(), tidspunktISO: new Date().toISOString(), skjerm: 'dashboard', kategori: 'likte', kommentar: `${MARK}-rest`, sesjonsId: 's-e2e', okt: OKT });
ok(validRest.status === 200 && validRest.json?.name, `gyldig post TILLATES (HTTP ${validRest.status}, key=${validRest.json?.name || '—'})`);
const restKey = validRest.json?.name;

const badCat = await restPost({ tidspunkt: 1, skjerm: 'dashboard', kategori: 'UGYLDIG', kommentar: MARK, sesjonsId: 's', okt: '' });
ok(badCat.status >= 400, `ugyldig kategori AVVISES (HTTP ${badCat.status})`);
const longOkt = await restPost({ tidspunkt: 1, skjerm: 'dashboard', kategori: 'likte', kommentar: MARK, sesjonsId: 's', okt: 'x'.repeat(50) });
ok(longOkt.status >= 400, `for lang okt AVVISES (HTTP ${longOkt.status})`);

// ── (a) EKTE app-bane: Playwright → submitFeedback → Firebase ─────────────────────
console.log('\n[A] ekte app-bane (UI → submitFeedback) lander i Firebase med alle felt + okt');
const b = await chromium.launch();
const seed = (okt) => ({
  vikingspill_role: 'student', vikingspill_rules_seen_student: '1',
  vikingspill_session: JSON.stringify({ mode: 'offline', groupId: 'g-e2e', memberId: 'm-e2e' }),
  vikingspill_group: JSON.stringify({ shipName: 'E2E-skipet', shipSymbol: 'ravn', shipColor: '#2B6B6B', role: 'tro' }),
  vikingspill_state: JSON.stringify({ scores: { culturalUnderstanding: 3, tradeGain: 0, reputation: 0 }, svennebrev: { språk:0,sjømannskap:0,krigskunst:0,diplomati:0,tro:0 }, visited: [], locked: [], goods: {}, unlockedSides: [], performedActions: [], saga: [] }),
});

async function sendViaUi({ okt, offline }) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 800 } });
  const p = await ctx.newPage();
  let crashed = false;
  p.on('pageerror', (e) => { crashed = true; console.log('   PAGE ERR:', e.message); });
  await p.goto(BASE + (okt ? `?okt=${encodeURIComponent(okt)}` : ''));
  await p.evaluate((s) => { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); }, seed(okt));
  await p.reload();
  await p.waitForSelector('[data-testid="feedback-button"]', { timeout: 10000 });
  if (offline) await ctx.setOffline(true);
  await p.locator('[data-testid="feedback-button"]').click();
  await p.locator('[data-testid="feedback-cat-bug"]').click();
  await p.locator('[data-testid="feedback-text"]').fill(offline ? `${MARK}-offline` : `${MARK}-ui`);
  await p.locator('[data-testid="feedback-send"]').click();
  const thanks = await p.locator('[data-testid="feedback-thanks"]').count();
  const ls = await p.evaluate(() => { try { return JSON.parse(localStorage.getItem('vikingspill_feedback') || '[]'); } catch { return []; } });
  await p.waitForTimeout(offline ? 500 : 2500); // online: la SDK-skrivet propagere
  await ctx.close();
  return { crashed, thanks, ls };
}

const uiRes = await sendViaUi({ okt: OKT, offline: false });
ok(!uiRes.crashed, 'ingen krasj ved Send');
ok(uiRes.thanks === 1, '«takk»-kvittering vist');
const uiLs = uiRes.ls.find((x) => x.kommentar === `${MARK}-ui`);
ok(!!uiLs, 'posten i localStorage');
ok(uiLs?.okt === OKT, `localStorage.okt = "${uiLs?.okt}"`);

// les tilbake fra Firebase (admin) — bekreft at den EKTE banen landet, ikke bare LS
let landed = null;
for (let i = 0; i < 6 && !landed; i++) {
  const node = fbGet() || {};
  landed = Object.entries(node).find(([, v]) => v?.kommentar === `${MARK}-ui`);
  if (!landed) await new Promise((r) => setTimeout(r, 1000));
}
ok(!!landed, 'posten DUKKER OPP i Firebase (ikke bare localStorage)');
if (landed) {
  const v = landed[1];
  const felt = ['tidspunkt', 'tidspunktISO', 'skjerm', 'rolle', 'kategori', 'kommentar', 'sesjonsId', 'okt'];
  const mangler = felt.filter((f) => v[f] === undefined);
  ok(mangler.length === 0, `alle felt med (mangler: ${mangler.join(',') || 'ingen'})`);
  ok(v.okt === OKT, `Firebase.okt = "${v.okt}"`);
  ok(v.skjerm === 'dashboard' && v.rolle === 'tro', `kontekst festet (skjerm=${v.skjerm}, rolle=${v.rolle})`);
}

// ── (b) offline: svelges stille, LS trygg, ingen krasj ────────────────────────────
console.log('\n[B] offline: feilen svelges stille, posten i localStorage, ingen krasj');
const offRes = await sendViaUi({ okt: OKT, offline: true });
ok(!offRes.crashed, 'ingen krasj når enheten er offline');
ok(offRes.thanks === 1, '«takk» vist selv om Firebase utilgjengelig');
ok(!!offRes.ls.find((x) => x.kommentar === `${MARK}-offline`), 'offline-posten ligger trygt i localStorage');
await b.close();

// ── opprydding: fjern alle testposter (rest + ui) fra Firebase ────────────────────
console.log('\n[opprydding]');
if (restKey) fbDel(restKey);
const node = fbGet() || {};
let removed = restKey ? 1 : 0;
for (const [key, v] of Object.entries(node)) {
  if (typeof v?.kommentar === 'string' && v.kommentar.startsWith(MARK)) { fbDel(key); removed++; }
}
const after = fbGet();
const leftover = after ? Object.values(after).filter((v) => typeof v?.kommentar === 'string' && v.kommentar.startsWith(MARK)).length : 0;
ok(leftover === 0, `testposter ryddet (slettet ~${removed}, gjenstår ${leftover})`);

console.log(`\n${fail === 0 ? '✅ ALLE OK' : `❌ ${fail} feil`}`);
process.exit(fail === 0 ? 0 : 1);
