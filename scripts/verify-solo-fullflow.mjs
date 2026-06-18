/**
 * verify-solo-fullflow.mjs — spiller solo/offline gjennom EN hel havn fra kart til
 * resultat, og bekrefter at flyten ALDRI stopper på en grået-ut «videre»-knapp
 * (tvungne fritekst-felt er AV i solo etter funn 1). Driver vite preview lokalt.
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:4173/';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 800 } }); // liten skjerm
const p = await ctx.newPage();
let crashed = false;
p.on('pageerror', (e) => { crashed = true; console.log('PAGE ERR:', e.message); });

// Tilbakemeldings-knappen skal være til stede (solo/offline) på HVERT steg.
const fbMissing = [];
async function fb(step) {
  if ((await p.locator('[data-testid="feedback-button"]').count()) === 0) fbMissing.push(step);
}

await p.goto(BASE);
await p.evaluate(() => {
  localStorage.setItem('vikingspill_role', 'student');
  localStorage.setItem('vikingspill_rules_seen_student', '1');
  localStorage.setItem('vikingspill_session', JSON.stringify({ mode: 'offline', groupId: 'g-test', memberId: 'm-test' }));
  localStorage.setItem('vikingspill_group', JSON.stringify({ shipName: 'Prøveskipet', shipSymbol: 'ravn', shipColor: '#2B6B6B', role: 'tro' }));
  localStorage.removeItem('vikingspill_state');
});
await p.reload();
await p.waitForSelector('[data-testid="sea-journey-map"]', { timeout: 10000 });
await fb('kart');
console.log('rolle → kart ✓');

// Inn i havna
await p.locator('[data-testid="map-dest-lindisfarne"]').click({ force: true });
await p.waitForTimeout(500);
await p.locator('[data-testid="confirm-sailing"]').click();

// Et skjebnemøte kan trigge tilfeldig før encounteret — håndter modalen om den dukker opp.
await p.waitForTimeout(4000);
if (await p.locator('[data-testid="skjebnemote-modal"]').count()) {
  await p.locator('[data-testid^="skjebnemote-choice-"]').first().click().catch(() => {});
  await p.waitForTimeout(800);
  await p.locator('[data-testid="skjebnemote-dismiss"]').click().catch(() => {});
  console.log('(skjebnemøte håndtert)');
}

// history → kulturmote → oppgave
await p.waitForSelector('text=Videre →', { timeout: 15000 });
await fb('historie');
await p.locator('text=Videre →').first().click(); // history → kulturmote
await p.waitForTimeout(500);
await fb('kulturmøte');
await p.locator('text=Videre →').first().click(); // kulturmote → oppgave
await p.waitForSelector('text=Start stedsquiz →', { timeout: 8000 });
await fb('på stedet');
console.log('historie → kulturmøte → på stedet ✓');

// oppgave → quiz (transition auto-advancer ~1.5s)
await p.locator('text=Start stedsquiz →').click();

// Quiz: svar på alle spørsmålene til vi når valgene
for (let i = 0; i < 6; i++) {
  await p.waitForTimeout(1800);
  const toValg = await p.locator('[data-testid="solo-council-continue"]').count();
  if (toValg) break; // nådd rådslagning
  await fb('quiz');
  // velg første svaralternativ i QuestionCard
  await p.locator('div.grid.gap-2 > button').first().click().catch(() => {});
  await p.waitForTimeout(400);
  // klikk «Neste spørsmål →» eller «Til valgene →»
  const next = p.locator('button', { hasText: /Neste spørsmål →|Til valgene →/ });
  await next.first().click().catch(() => {});
}
console.log('stedsquiz fullført ✓');

// rådslagning (solo) → valgene. Bekreft at mistanke-knappen IKKE finnes (sabotør av)
await p.waitForSelector('[data-testid="solo-council-continue"]', { timeout: 8000 });
await fb('rådslagning');
const suspectBtns = await p.locator('[data-testid^="solo-suspect-"]').count();
console.log(`rådslagning: «Mistenk denne»-knapper synlige = ${suspectBtns} (forventer 0) ${suspectBtns === 0 ? '✓' : '✗'}`);
await p.locator('[data-testid="solo-council-continue"]').click();

// valg → velg første kjernevalg
await p.waitForSelector('[data-testid^="pick-"]', { timeout: 8000 });
await fb('valg');
await p.locator('[data-testid^="pick-"]').first().click();

// Saga skal være HOPPET OVER i solo (requireSaga av) → vi havner rett på terningkastet
await p.waitForTimeout(800);
const sawSaga = await p.locator('[data-testid="saga-textarea"]').count();
console.log(`saga-steget vist = ${sawSaga} (forventer 0 — hoppet over i solo) ${sawSaga === 0 ? '✓' : '✗'}`);

// terningkast → rulling → resultat
await p.waitForSelector('text=Kast terningen', { timeout: 8000 });
await fb('terning');
await p.locator('text=Kast terningen').click();
await p.waitForSelector('text=Seil videre', { timeout: 12000 });
await fb('resultat');
console.log('terningkast → resultat ✓');

// Bro-til-i-dag skal være av i solo → «Seil videre» fullfører rett til kartet
await p.locator('text=Seil videre').click();
await p.waitForSelector('[data-testid="sea-journey-map"]', { timeout: 8000 });
await fb('tilbake på kart');
// (force-klikk forbi den overlappende kart-klyngen kan lande på en nabo-havn — derfor
//  sjekker vi at EN hel havn ble fullført og persistert, ikke nødvendigvis lindisfarne.)
const visitedList = await p.evaluate(() => {
  try { return JSON.parse(localStorage.getItem('vikingspill_state')).visited || []; } catch { return []; }
});
const visitedNow = visitedList.length >= 1;
console.log(`hel havn fullført → tilbake på kartet, besøkt = [${visitedList.join(', ')}] ${visitedNow ? '✓' : '✗'}`);

console.log(`tilbakemeldings-knapp til stede på alle steg = ${fbMissing.length === 0 ? 'JA ✓' : `NEI ✗ (mangler: ${fbMissing.join(', ')})`}`);

const ok = !crashed && suspectBtns === 0 && sawSaga === 0 && visitedNow && fbMissing.length === 0;
console.log(ok ? '\nALLE OK ✓ — solo går helt gjennom uten tomt-felt-blokk, feedback-knapp overalt' : '\nNOE FEILET ✗');
await p.screenshot({ path: '/tmp/solo-fullflow-end.png', fullPage: true });
await b.close();
process.exit(ok ? 0 : 1);
