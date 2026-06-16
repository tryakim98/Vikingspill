/**
 * shot-teacher.mjs — skjermbilder av lærerpanelet i ulike tilstander.
 * Oppretter et MIDLERTIDIG testspill, seeder grupper/godkjenninger/prøve via REST,
 * tar skjermbilder, og SLETTER testspillet til slutt. Endrer ingen kode.
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:5173/';
const DB = 'https://vikingspill-2b754-default-rtdb.europe-west1.firebasedatabase.app';

const put = (path, body) => fetch(`${DB}/${path}.json`, { method: 'PUT', body: JSON.stringify(body) }).then(r => r.json());
const del = (path) => fetch(`${DB}/${path}.json`, { method: 'DELETE' });

function group(name, symbol, color, startSkill, scores, skills, visited, extra = {}) {
  return { shipName: name, shipSymbol: symbol, shipColor: color, startSkill, scores, skills, visited, locked: [], updatedAt: Date.now(), ...extra };
}

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1500, height: 1400 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
p.on('pageerror', e => console.log('PAGE ERROR:', e.message));
// Lærerens «kom til meg» bruker window.prompt — auto-aksepter med en beskjed.
p.on('dialog', (d) => d.accept('Kom til kateteret nå').catch(() => {}));

// Gå rett inn som lærer
await p.goto(BASE);
await p.evaluate(() => { localStorage.setItem('vikingspill_role', 'teacher'); localStorage.setItem('vikingspill_rules_seen_teacher', '1'); });
await p.reload();
await p.waitForTimeout(1200);

// 1) Landing
await p.screenshot({ path: '/tmp/teacher-1-landing.png', fullPage: true });
console.log('saved teacher-1-landing');

// Opprett spill
await p.locator('[data-testid="create-new-game"]').click();
await p.waitForTimeout(3500);
const code = await p.locator('.font-mono.text-3xl').first().innerText().catch(() => null);
console.log('game code =', code);
if (!code) { console.log('FANT IKKE KODE — Firebase utilgjengelig?'); await b.close(); process.exit(1); }

// 2) Tomt konsoll
await p.waitForTimeout(800);
await p.screenshot({ path: '/tmp/teacher-2-empty.png', fullPage: true });
console.log('saved teacher-2-empty');

// Seed grupper
const m = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [`m-${i}`, { joinedAt: Date.now() }]));
await put(`games/${code}/groups`, {
  'g-orm': group('Ormen Lange', 'drage', '#8B2929', 'krigskunst',
    { culturalUnderstanding: 18, tradeGain: 12, reputation: 9 },
    { språk: 1, sjømannskap: 2, krigskunst: 3, diplomati: 1, tro: 0 },
    ['lindisfarne', 'hedeby', 'dublin', 'paris', 'hebrides'],
    { chiefId: 'm-0', members: m(4), activeDestId: 'island', encounter: { destId: 'island', step: 'valg' }, goods: { solv: 6, jern: 3 } }),
  'g-ulv': group('Sjøulven', 'ulv', '#2B6B6B', 'sjomannskap',
    { culturalUnderstanding: 9, tradeGain: 7, reputation: 4 },
    { språk: 2, sjømannskap: 2, krigskunst: 0, diplomati: 1, tro: 1 },
    ['lindisfarne', 'hedeby'],
    { chiefId: 'm-0', members: m(3), activeDestId: 'dublin', encounter: { destId: 'dublin', step: 'quiz', quizIdx: 2, quizCorrect: 1 } }),
  'g-ravn': group('Ravnvinge', 'ravn', '#6B3FA0', 'tro',
    { culturalUnderstanding: 0, tradeGain: 0, reputation: 0 },
    { språk: 0, sjømannskap: 0, krigskunst: 0, diplomati: 0, tro: 1 },
    [],
    { chiefId: 'm-0', members: m(2) }),
});
// Seed godkjenninger (pending)
await put(`games/${code}/approvals`, {
  'g-orm': { destId: 'island', taskTitle: 'Lag en kort rap/sang om reisen og spill den inn', shipName: 'Ormen Lange', status: 'pending', requestedAt: Date.now() },
  'g-ulv': { destId: 'dublin', taskTitle: 'Finn tre steder med norrøne stedsnavn-endelser', shipName: 'Sjøulven', status: 'pending', requestedAt: Date.now() },
});
await p.waitForTimeout(1500);

// 3) Konsoll med grupper + godkjenninger (nytt: godkjenning øverst, leaderboard m/status)
await p.screenshot({ path: '/tmp/teacher-3-with-groups.png', fullPage: true });
console.log('saved teacher-3-with-groups');

// Kart-utsnitt (skip plassert der gruppene ER nå + live status)
const map = p.locator('.border-viking-gold\\/70').first();
if (await map.count()) { await map.first().screenshot({ path: '/tmp/teacher-4-map.png' }).catch(() => {}); console.log('saved teacher-4-map'); }

// 3b) Fold ut en gruppe → per-gruppe-detalj
const row = p.locator('[data-testid="leaderboard-row-g-orm"]');
if (await row.count()) {
  await row.click();
  await p.waitForTimeout(400);
  await p.screenshot({ path: '/tmp/teacher-3b-group-detail.png', fullPage: true });
  console.log('saved teacher-3b-group-detail');
}

// 4) Seed en aktiv Gudenes prøve → vis kåring-UI
await put(`games/${code}/trial`, { id: `t-${Date.now()}`, challengeId: 'flaskeflipp', navn: 'Flaskeflipp-mesterskap', desc: 'Hver gruppe får tre forsøk på å lande en flaskeflipp. Flest landinger vinner.', skill: 'krigskunst', at: Date.now() });
await p.waitForTimeout(1200);
await p.screenshot({ path: '/tmp/teacher-5-trial-settle.png', fullPage: true });
console.log('saved teacher-5-trial-settle');

// 5) Spinn skjebnehjulet → fang avsløringen
await del(`games/${code}/trial`);
await p.waitForTimeout(400);
const spin = p.locator('[data-testid="skjebnehjul-spin"]');
if (await spin.count()) {
  await spin.click();
  await p.waitForTimeout(4600); // vent til landing + avsløring vises
  await p.screenshot({ path: '/tmp/teacher-6-wheel-reveal.png', fullPage: true });
  console.log('saved teacher-6-wheel-reveal');
}

// 6b) «KOM TIL MEG»-VARSEL: lærer kaller g-ulv hit → elev ser overlay → kvitterer
const summonBtn = p.locator('[data-testid="summon-g-ulv"]');
if (await summonBtn.count()) {
  await summonBtn.click();
  await p.waitForTimeout(1000);
  await p.screenshot({ path: '/tmp/teacher-8-summon-sent.png', fullPage: true });
  console.log('saved teacher-8-summon-sent (lærer: g-ulv «kalt …»)');
}
{
  const stud2 = await b.newContext({ viewport: { width: 900, height: 1300 }, deviceScaleFactor: 1.5 });
  const sp2 = await stud2.newPage();
  await sp2.goto(BASE);
  await sp2.evaluate((c) => {
    localStorage.setItem('vikingspill_role', 'student');
    localStorage.setItem('vikingspill_rules_seen_student', '1');
    localStorage.setItem('vikingspill_member_id', 'm-0');
    localStorage.setItem('vikingspill_session', JSON.stringify({ mode: 'online', gameCode: c, memberId: 'm-0', groupId: 'g-ulv' }));
  }, code);
  await sp2.reload();
  await sp2.waitForTimeout(2500);
  console.log('elev ser varsel-overlay:', (await sp2.locator('[data-testid="summon-overlay"]').count()) ? 'JA' : 'NEI');
  await sp2.screenshot({ path: '/tmp/teacher-9-summon-overlay.png', fullPage: true });
  console.log('saved teacher-9-summon-overlay');
  await sp2.locator('[data-testid="summon-ack"]').click().catch(() => {});
  await sp2.waitForTimeout(1500);
  await stud2.close();
}
await p.waitForTimeout(1300);
console.log('lærer ser kvittering:', (await p.locator('[data-testid="summon-acked-g-ulv"]').count()) ? 'JA («på vei»)' : 'NEI');

// 7) ELEV-SIDEN: godkjenning gir synlig utfall + terningbonus (§6.2)
// Sett g-orm sin godkjenning til 'approved' for island, og plasser gruppa på oppgavesteget.
await put(`games/${code}/approvals/g-orm`, { destId: 'island', taskTitle: 'Lag en kort rap/sang om reisen', shipName: 'Ormen Lange', status: 'approved', requestedAt: Date.now() });
await put(`games/${code}/groups/g-orm/encounter`, { destId: 'island', step: 'oppgave' });
await put(`games/${code}/groups/g-orm/activeDestId`, 'island');
await p.waitForTimeout(500);

const stud = await b.newContext({ viewport: { width: 900, height: 1300 }, deviceScaleFactor: 1.5 });
const sp = await stud.newPage();
await sp.goto(BASE);
await sp.evaluate((c) => {
  localStorage.setItem('vikingspill_role', 'student');
  localStorage.setItem('vikingspill_rules_seen_student', '1');
  localStorage.setItem('vikingspill_member_id', 'm-0');
  localStorage.setItem('vikingspill_session', JSON.stringify({ mode: 'online', gameCode: c, memberId: 'm-0', groupId: 'g-orm' }));
}, code);
await sp.reload();
await sp.waitForTimeout(2500);
const res = sp.locator('[data-testid="approval-result"]');
console.log('elev ser godkjennings-utfall:', (await res.count()) ? (await res.first().innerText()).replace(/\n/g, ' ') : 'IKKE FUNNET');
await sp.screenshot({ path: '/tmp/teacher-7-student-approval.png', fullPage: true });
console.log('saved teacher-7-student-approval');
await stud.close();

// Rydd opp — slett testspillet
await del(`games/${code}`);
console.log('slettet testspill', code);

await b.close();
console.log('ferdig.');
