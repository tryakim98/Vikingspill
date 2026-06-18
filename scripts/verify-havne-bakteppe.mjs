/**
 * verify-havne-bakteppe.mjs — verifiserer at havnens egen gravering
 * (steder/sted-<id>.jpg) vises som STORT full-bleed bakteppe bak teksten på
 * lese-stegene (historie + kulturmøte), med scrim, lokalt mot vite-dev.
 * Sjekker: bakteppe-img finnes, er lastet (naturalWidth>0), dekker viewporten,
 * og at scrim-gradienten ligger over. Kjør med dev-server på :5173.
 */
import { chromium } from 'playwright';
const BASE = 'http://localhost:5173/';

const baseState = {
  scores: { culturalUnderstanding: 14, tradeGain: 8, reputation: 5 },
  skills: { språk: 2, sjømannskap: 2, krigskunst: 1, diplomati: 1, tro: 1 },
  svennebrev: { språk: 2, sjømannskap: 2, krigskunst: 1, diplomati: 1, tro: 1 },
  visited: [], locked: [], goods: {}, unlockedSides: ['baghdad', 'miklagard'], performedActions: [], saga: [],
};
const seed = {
  vikingspill_role: 'student', vikingspill_rules_seen_student: '1',
  vikingspill_session: JSON.stringify({ mode: 'offline', groupId: 'g-test', memberId: 'm-test' }),
  vikingspill_group: JSON.stringify({ shipName: 'Drakens Vinge', shipSymbol: 'drage', shipColor: '#A0522D', role: 'språk' }),
  vikingspill_state: JSON.stringify(baseState),
};

const b = await chromium.launch();
let failures = 0;

// Returner info om Shell-bakteppet (aria-hidden full-bleed img + scrim) på gjeldende steg.
async function inspectBackdrop(p, expectId) {
  return await p.evaluate((expectId) => {
    // Bakteppet: img i en aria-hidden absolute inset-0 z-0-container (Shell), ikke banneret (alt^="Ankomst").
    const imgs = [...document.querySelectorAll('img')];
    const bd = imgs.find((im) => {
      const wrap = im.closest('[aria-hidden="true"]');
      return wrap && /steder\/sted-/.test(im.getAttribute('src') || '') && (im.getAttribute('alt') || '') === '';
    });
    if (!bd) return { found: false };
    const r = bd.getBoundingClientRect();
    const wrap = bd.closest('[aria-hidden="true"]');
    // Backdrop-wrapperen kan ha flere lag (per-kultur materiallag + gradient-scrim);
    // sjekk om NOEN av barne-div-ene har en gradient-scrim.
    const divs = wrap ? [...wrap.children].filter((c) => c.tagName === 'DIV') : [];
    const bg = divs.map((d) => getComputedStyle(d).backgroundImage).join(' ');
    return {
      found: true,
      src: bd.getAttribute('src'),
      matchesId: (bd.getAttribute('src') || '').includes(`sted-${expectId}.jpg`),
      loaded: bd.naturalWidth > 0,
      natural: { w: bd.naturalWidth, h: bd.naturalHeight },
      coversWidth: r.width >= window.innerWidth - 2,
      coversTop: r.top <= 2,
      coversViewportHeight: r.height >= window.innerHeight - 2,
      hasGradientScrim: /gradient/i.test(bg),
    };
  }, expectId);
}

async function check(label, info, expectId) {
  const ok = info.found && info.matchesId && info.loaded && info.coversWidth && info.coversTop && info.hasGradientScrim;
  if (!ok) failures++;
  console.log(`  ${ok ? '✓' : '✗'} ${label}: ${JSON.stringify(info)}`);
}

async function run(destId) {
  console.log(`\n=== ${destId} ===`);
  const ctx = await b.newContext({ viewport: { width: 900, height: 1300 }, deviceScaleFactor: 1.5 });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => console.log('  PAGE ERR:', e.message));
  await p.goto(BASE);
  await p.evaluate((s) => { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); }, seed);
  await p.reload();
  await p.waitForTimeout(1200);
  const close = p.locator('[data-testid="hint-toast"] button[aria-label="Lukk forklaring"]');
  if (await close.count()) { await close.first().click().catch(() => {}); await p.waitForTimeout(200); }
  await p.locator(`[data-testid="map-dest-${destId}"]`).click();
  await p.waitForTimeout(500);
  await p.locator('[data-testid="confirm-sailing"]').click();

  // HISTORIE-steget
  await p.waitForSelector('text=Videre →', { timeout: 8000 });
  await p.waitForTimeout(900); // la bildet dekode
  await check('historie-bakteppe', await inspectBackdrop(p, destId), destId);
  await p.screenshot({ path: `/tmp/bakteppe-historie-${destId}.png` });

  // → KULTURMØTE-steget (klikk «Videre →»)
  await p.locator('text=Videre →').first().click();
  await p.waitForTimeout(900);
  await check('kulturmote-bakteppe', await inspectBackdrop(p, destId), destId);
  await p.screenshot({ path: `/tmp/bakteppe-kulturmote-${destId}.png` });

  await ctx.close();
}

await run('sameland');   // vidda (main route)
await run('baghdad');    // basaren (side unlock)
await b.close();
console.log(`\n${failures === 0 ? '✅ ALLE OK' : `❌ ${failures} feil`}`);
process.exit(failures === 0 ? 0 : 1);
