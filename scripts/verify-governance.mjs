/**
 * verify-governance.mjs — sjekker at styresett-kortet vises i oppgave-steget
 * («På stedet») for et par havner. Driver OFFLINE-flyten lokalt (vite preview).
 * Online og solo deler samme EncounterFlow-oppgave-steg (kortet er utenfor
 * isChief-gaten), så solo-verifisering dekker begge spor.
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:4173/';
const b = await chromium.launch();

async function checkDest(destId, expectStyreform) {
  const ctx = await b.newContext({ viewport: { width: 900, height: 1300 } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => console.log(`  PAGE ERR (${destId}):`, e.message));
  await p.goto(BASE);
  // Seed offline-økt + ferdig oppsett så vi hopper rett til dashbordet.
  await p.evaluate(() => {
    localStorage.setItem('vikingspill_role', 'student');
    localStorage.setItem('vikingspill_rules_seen_student', '1');
    localStorage.setItem('vikingspill_session', JSON.stringify({ mode: 'offline', groupId: 'g-test', memberId: 'm-test' }));
    localStorage.setItem('vikingspill_group', JSON.stringify({ shipName: 'Prøveskipet', shipSymbol: 'ravn', shipColor: '#2B6B6B', role: 'tro' }));
    localStorage.removeItem('vikingspill_state');
  });
  await p.reload();
  await p.waitForTimeout(2000);

  // Åpne havna på kartet, bekreft seilas.
  await p.locator(`[data-testid="map-dest-${destId}"]`).click();
  await p.waitForTimeout(600);
  await p.locator('[data-testid="confirm-sailing"]').click();
  // Seilas-animasjon → encounter (history). Vent til Videre-knappen finnes.
  await p.waitForSelector('text=Videre →', { timeout: 15000 });
  await p.locator('text=Videre →').first().click(); // history → kulturmote
  await p.waitForTimeout(800);
  await p.locator('text=Videre →').first().click(); // kulturmote → oppgave
  await p.waitForSelector('[data-testid="governance-card"]', { timeout: 8000 });

  const card = p.locator('[data-testid="governance-card"]');
  const present = await card.count();
  const text = present ? (await card.innerText()).replace(/\s+/g, ' ').trim() : '';
  const ok = present && text.includes(expectStyreform);
  console.log(`${destId}: styresett-kort ${ok ? 'VIST ✓' : 'MANGLER ✗'} — "${text.slice(0, 90)}…"`);
  await p.screenshot({ path: `/tmp/governance-${destId}.png`, fullPage: true });
  await ctx.close();
  return ok;
}

const r1 = await checkDest('lindisfarne', 'Kongedømme');
const r2 = await checkDest('paris', 'Føydalt kongedømme');
await b.close();
console.log(r1 && r2 ? 'ALLE OK ✓' : 'NOE FEILET ✗');
process.exit(r1 && r2 ? 0 : 1);
