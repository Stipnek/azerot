'use strict';
// Regenerates scripts/fixtures/quest-graph.json from the built game (report tooling, not a test).
// Run: python3 scripts/build_combined_preview.py && node scripts/dump_quest_graph.cjs
// Loads an in-memory copy of preview/combined.html in Chromium (isolated context, no saves) with one debug line
// exposing the closure QUESTS/PLACES; the source and the build on disk are not changed.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const A = 'for(const q of QUESTS){const old=V57_OLD_QUESTS.get(q.k);';
let html = fs.readFileSync(path.join(root, 'preview/combined.html'), 'utf8');
if (html.split(A).length !== 2) throw new Error('Quest rewrite anchor not unique: update dump_quest_graph.cjs');
html = html.replace(A, 'window.__dbg={QUESTS:QUESTS,PLACES:PLACES};' + A);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'azq-')), file = path.join(tmp, 'g.html');
fs.writeFileSync(file, html);
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext()).newPage();
  await p.goto('file://' + file); await p.waitForFunction(() => window.__dbg, null, { timeout: 60000 });
  const q = await p.evaluate(() => window.__dbg.QUESTS.map(q => ({ k: q.k, z: (window.__dbg.PLACES[q.d] || {}).z, need: q.need || [], minLevel: q.minLevel || 0, goals: q.goals ? q.goals.map(g => ({ enemy: g.enemy, count: g.count })) : null, intro: !!q.v57intro })));
  await b.close(); fs.rmSync(tmp, { recursive: true, force: true });
  const quests = q.filter(x => x.z).map(x => { const o = { k: x.k, z: x.z, need: x.need }; if (x.minLevel) o.minLevel = x.minLevel; if (x.goals) o.goals = x.goals; if (x.intro) o.intro = true; return o; });
  fs.writeFileSync(path.join(__dirname, 'fixtures/quest-graph.json'), JSON.stringify({ source: 'Runtime QUESTS of preview/combined.html (all zones), dumped by scripts/dump_quest_graph.cjs. Regenerate after quest changes.', quests }, null, 1) + '\n');
  console.log('quests:', quests.length);
})().catch(e => { console.error(e); process.exit(1); });
