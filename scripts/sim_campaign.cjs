'use strict';
// BAL-04/05/06 balance REPORT (not a regression gate). Follows the real early-game path instead of putting the hero at each quest's level.
// Run: node scripts/sim_campaign.cjs [N=60] [--json out.json] [--only feel,campaign,group]   (SOLO_CURVE / GROUP_CURVE env: see below)
// Pre-BAL-04 numbers: docs/evidence/bal-04/sim-before-2026-11-26.md (made with the --old-curve mode of commit af18574).
// Section 1 (feel): hero alone, no gear, own level = enemy level, vs 1/2/3 typical zone enemies, levels 1-35 (zone content) and 40/50/60 (no content yet,
//   Duskwood enemies scaled by level as stand-ins); owner targets 2026-11-26, extended to every level by BAL-05 (2026-11-27):
//   1 enemy dies in 3-5 hits; 2 enemies cost about half HP (45-60%) and stay winnable; 3 enemies need gear or level (win <=60%, +2 levels >=75%).
// Section 2 (campaign): quest graph scripts/fixtures/quest-graph.json (runtime QUESTS dump), greedy lowest-level-first, every fight won,
//   own XP via the engine's xpShares, goal quests as repeated fights of the remaining goal enemies, at most SOLO_MAX_ENEMIES at once (prepareQuestEnemies),
//   group quests with main + free companion (warrior main: holy priest, otherwise prot warrior) at the companion's own level;
//   goal fights spawn at most SOLO_MAX_ENEMIES enemies in solo quests and 3 in group quests (prepareQuestEnemies).
// Section 4 (Deadmines): full runs with a party of five at levels 18-30, without gear, with the main's best gear, with rare companions.
// Section 3 (BAL-06 group quests, owner 2026-11-27): every group quest at its own level, no gear unless stated, enemies as the game spawns them.
//   Size 3: short = main + one companion (better of tank or healer), full = main + tank + healer. Size 5 (owner 2026-11-27: more than three):
//   short = 3 heroes, four, full = + fire mage + combat rogue. Strong short = main 2 levels above the quest with gear, companions legendary (rb 0.20)
//   or epic (0.15). Targets: short party win <=15%; full party >=80% (worst class >=60%); strong short with legendary >=50%.
//   Deadmines fills gaps: when the lowest open quest is above the main's level and the main is 17+, a full run is simulated
//   (main + prot warrior + holy priest + fire mage + combat rogue at the main's level) and its XP is added if cleared.
//   Not modelled: ambush XP, gear and tavern bonuses (both make the party stronger), parties larger than two.
// Seeds: s*7919+13 for s in 0..N-1.
const path = require('node:path');
const B = require('./lib_engine_load.cjs')();
const G = require(path.join(__dirname, 'fixtures/quest-graph.json'));
const args = process.argv.slice(2);
const N = +args.find(a => /^\d+$/.test(a)) || 60;
const jsonOut = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;
if (!B.SOLO_ENEMY_CURVE) throw new Error('SOLO_ENEMY_CURVE missing: needs script-05.zzzzzzz-solo-enemy-curve edit');
const SOLO_CAP = B.SOLO_MAX_ENEMIES;
// Tuning: SOLO_CURVE='{"hp":[...14],"atk":[...14],"high":[[lvl,hp,atk],...]}' and GROUP_CURVE='{"points":[[lvl,hp,atk],...],"target":{"3":n,"5":n},"single":x}' override the tables for this run only.
if (process.env.SOLO_CURVE) Object.assign(B.SOLO_ENEMY_CURVE, JSON.parse(process.env.SOLO_CURVE));
if (process.env.GROUP_CURVE) Object.assign(B.GROUP_ENEMY_CURVE, JSON.parse(process.env.GROUP_CURVE));
// Goal quests: the game sets packSize (BAL-06 power budget) to the size of a full goal fight (prepareQuestEnemies).
for (const q of G.quests) { const e = B.ENCOUNTERS[q.k]; if (!e || !q.goals) continue; e.packSize = Math.min(e.size === 1 ? SOLO_CAP : 3, q.goals.reduce((s, g) => s + g.count, 0)); }
const only = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',') : ['feel', 'campaign', 'group', 'dungeon'];
const CLS = ['warrior', 'paladin', 'druid', 'priest', 'mage', 'hunter', 'rogue', 'warlock'];
const PET = { hunter: 'wolf', warlock: 'imp' };
const DD = { warrior: 'arms', paladin: 'ret', druid: 'cat', priest: 'shadow', mage: 'fire', hunter: 'mm', rogue: 'combat', warlock: 'aff' };
const FEEL_MOBS = { 1: ['wolf', 'thief'], 2: ['kobold', 'wolf'], 3: ['kobold', 'boar'], 4: ['kobold', 'thief'], 5: ['kobold', 'gnollRunt'], 6: ['murloc', 'boar'], 7: ['murloc', 'kobold'],
  8: ['murloc', 'wolf'], 9: ['thief', 'murloc'], 10: ['goretusk', 'gnollRunt'], 11: ['looter', 'harvester'], 12: ['looter', 'gnollMiner'], 13: ['murlocWarrior', 'looter'], 14: ['murlocWarrior', 'pillager'],
  15: ['gnollMiner', 'tarantula'], 16: ['orcGrunt', 'murlocWarrior'], 17: ['gnollRunt', 'tarantula'], 18: ['orcGrunt', 'gnollMiner'], 20: ['dw_spider', 'gnollRunt'], 21: ['dw_wolf', 'murlocWarrior'],
  23: ['gnollMiner', 'dw_spider'], 25: ['dw_wolf', 'dw_skeleton'], 28: ['dw_spider', 'dw_skeleton'], 30: ['dw_wolf', 'dw_skeleton'], 35: ['dw_spider', 'dw_wolf'], 40: ['dw_wolf'], 50: ['dw_skeleton'], 60: ['dw_spider'] };
const hero = (cls, L) => ({ cls, spec: L < 15 ? B.CLASSES[cls].def : DD[cls], level: L, main: true, neutralTraining: L < 15, race: 'human', pet: PET[cls] });
const freeComp = (cls, L) => cls === 'warrior' ? { cls: 'priest', spec: 'holy', level: L } : { cls: 'warrior', spec: 'prot', level: L };
// Group companions: prot warrior tank (Protection paladin tanks far worse: 15% vs 60% wins in the same party, see docs/evidence/bal-05-06) and holy priest
// (resto druid for a priest main).
const tankOf = (cls, L, rb) => ({ cls: 'warrior', spec: 'prot', level: L, rb: rb || 0 });
const healOf = (cls, L, rb) => cls === 'priest' ? { cls: 'druid', spec: 'resto', level: L, rb: rb || 0 } : { cls: 'priest', spec: 'holy', level: L, rb: rb || 0 };
// Best main gear in the game: Elwynn quest gear below 17 (chest+feet+legs), the four best Deadmines boss items from 17 (dmCatalogue).
const gear = (cls, L) => { const k = B.primaryKey(cls, L < 15 ? B.CLASSES[cls].def : DD[cls]); return L < 17 ? { armorFlat: 60, stamina: 7, [k]: 2 } : { armorFlat: 84, stamina: 17, [k]: 24 }; };
const avg = (xs, f) => xs.reduce((s, x) => s + f(x), 0) / xs.length;
const pct = x => Math.round(x * 100) + '%';

function fight(encKey, enemies, party, seed) {
  const e = B.ENCOUNTERS[encKey], saved = e.enemies; e.enemies = enemies;
  if (encKey === 'cl_sven15') party[0].morbentsBane = true; // the quest chain gives Morbent's Bane before this fight
  try {
    const st = B.createBattle({ encounter: encKey, level: party[0].level, main: party[0].cls, seed, party });
    const m = st.heroes[0], first = st.enemies[0]; let hits = 0, dead = false, g = 0;
    while (!st.over && g++ < 8000) { for (const x of B.step(st)) if (!dead && x.t === 'dmg' && x.src === m.id && x.tgt === first.id) hits++; if (!dead && first.hp <= 0) dead = true; }
    return { win: st.result === 'win', lost: st.result === 'win' ? 1 - Math.max(0, m.hp) / m.maxHp : 1, hits: dead ? hits : null };
  } finally { e.enemies = saved; }
}
function rate(encKey, enemies, mkParty) {
  return CLS.map(cls => { const rs = []; for (let s = 0; s < N; s++) rs.push(fight(encKey, enemies, mkParty(cls), s * 7919 + 13));
    const k = rs.filter(r => r.hits !== null); return { cls, win: avg(rs, r => r.win), lost: avg(rs, r => r.lost), hits: k.length ? avg(k, r => r.hits) : NaN }; });
}

// Section 1: feel
B.ENCOUNTERS.__sim_feel = { name: 'sim', place: 'sim', type: 'solo', size: 1, level: 1, enemies: [] };
const feel = [];
if (only.includes('feel')) for (const L of Object.keys(FEEL_MOBS).map(Number)) for (const mob of FEEL_MOBS[L]) {
  B.ENCOUNTERS.__sim_feel.level = L;
  const r = n => rate('__sim_feel', Array(n).fill(mob), cls => [hero(cls, L)]);
  const one = r(1), two = r(2), three = r(3), adv = rate('__sim_feel', Array(3).fill(mob), cls => [hero(cls, Math.min(60, L + 2))]);
  const row = { level: L, mob, hits1: avg(one, x => x.hits), lost1: avg(one, x => x.lost), lost2: avg(two, x => x.lost), worst2: two.reduce((a, x) => x.win < a.win ? x : a),
    win3: avg(three, x => x.win), win3adv: avg(adv, x => x.win) };
  row.ok = { hits1: row.hits1 >= 3 && row.hits1 <= 5.5, lost2: row.lost2 >= 0.40 && row.lost2 <= 0.65 && row.worst2.win >= 0.7, win3: row.win3 <= 0.6, win3adv: row.win3adv >= 0.75 };
  feel.push(row);
}
delete B.ENCOUNTERS.__sim_feel;
console.log('Solo curve at every level (BAL-05), at most ' + SOLO_CAP + ' enemies per solo fight, group curve ' + JSON.stringify(B.GROUP_ENEMY_CURVE.points) + ', XP curve v' + B.XP_CURVE.version + ' (quests per level ' + B.XP_CURVE.quests.first + ' + ' + B.XP_CURVE.quests.perLevel + '/level); N=' + N + ' per class\n');
if (only.includes('feel')) console.log('## 1. Fight feel: hero alone, no gear, own level = enemy level (avg over 8 classes; * = outside target)\n');
if (only.includes('feel')) console.log('| lvl | enemy | 1: hits to kill | 1: HP lost | 2: HP lost | 2: worst class win | 3: win | 3 at +2 lvl: win |');
if (only.includes('feel')) console.log('|---|---|---|---|---|---|---|---|');
const mark = (v, ok) => v + (ok ? '' : ' *');
if (only.includes('feel')) for (const r of feel) console.log(`| ${r.level} | ${r.mob} | ${mark(r.hits1.toFixed(1), r.ok.hits1)} | ${pct(r.lost1)} | ${mark(pct(r.lost2), r.ok.lost2)} | ${r.worst2.cls} ${pct(r.worst2.win)} | ${mark(pct(r.win3), r.ok.win3)} | ${mark(pct(r.win3adv), r.ok.win3adv)} |`);

// Section 2: campaign path
const Q = G.quests.filter(q => B.ENCOUNTERS[q.k] && !q.intro);
const done = new Set(); let xpMain = 0, xpComp = 0; const route = [];
for (let guard = 0; guard < 200 && only.includes('campaign'); guard++) {
  const Lm = B.levelOf(xpMain);
  const open = Q.filter(q => !done.has(q.k) && q.need.every(n => done.has(n) || !Q.some(x => x.k === n)) && (!q.minLevel || Lm >= q.minLevel));
  open.sort((a, b) => B.ENCOUNTERS[a.k].level - B.ENCOUNTERS[b.k].level || a.k.localeCompare(b.k));
  if ((!open.length || B.ENCOUNTERS[open[0].k].level > Lm) && Lm >= 17 && Lm < B.XPC.cap) { // Deadmines run fills the gap
    const runs = [], mk = (cls, spec, main) => ({ cls, spec, level: Lm, main, race: 'human', pet: cls === 'hunter' ? 'wolf' : cls === 'warlock' ? 'imp' : undefined });
    for (const cls of CLS) { let c = 0; for (let s = 0; s < Math.max(4, N >> 2); s++) { const run = B.newRun('deadmines', [mk(cls, DD[cls], true), mk('warrior', 'prot'), mk('priest', 'holy'), mk('mage', 'fire'), mk('rogue', 'combat')], cls, Lm, s * 7919 + 13); B.simulateRun(run); if (run.state === 'cleared') c++; } runs.push(c / Math.max(4, N >> 2)); }
    const clear = avg(runs, x => x), xp = B.dungeonXp(Lm, 'deadmines');
    route.push({ k: 'deadmines run', zone: 'westfall', type: 'dungeon', size: 5, encLevel: 19, mainLevel: Lm, compLevel: B.levelOf(xpComp), dungeon: { clear, xp }, fights: [] });
    if (clear < 0.2) { route[route.length - 1].dungeon.stuck = true; break; } // below 20% clears the path is stuck; 20-50% means retries (owner: the Deadmines should be hard)
    xpMain += xp; xpComp += xp; continue;
  }
  if (!open.length) break;
  const q = open[0], e = B.ENCOUNTERS[q.k], Lc = B.levelOf(xpComp);
  const step = { k: q.k, zone: q.z, type: e.type, size: e.size, encLevel: e.level, mainLevel: Lm, compLevel: Lc, fights: [] };
  const share = (enc, fights) => { const x = B.xpShares(enc, [{ cls: 'me', level: B.levelOf(xpMain), main: true, fights: true }, { cls: 'c', level: B.levelOf(xpComp), fights }]); xpMain += x[0].xp; xpComp += x[1].xp; };
  if (q.goals) { // repeated fights of up to 3 remaining goal enemies, 0.12 XP per kill
    const left = q.goals.map(g => g.count), cap = e.size === 1 ? SOLO_CAP : 3;
    while (left.some(n => n > 0)) { const en = []; q.goals.forEach((g, i) => { const n = Math.min(left[i], cap - en.length); for (let j = 0; j < n; j++) en.push(g.enemy); left[i] -= n; });
      const prev = step.fights[step.fights.length - 1];
      if (prev && prev.enemies.join() === en.join() && prev.mainLevel === B.levelOf(xpMain)) prev.count++; else step.fights.push({ enemies: en, count: 1, mainLevel: B.levelOf(xpMain) });
      share(Object.assign({}, e, { xpMult: 0.12 * en.length }), false); }
  } else if (e.type !== 'talk' && e.enemies.length) step.fights.push({ enemies: e.enemies.slice(), count: 1, mainLevel: Lm });
  share(e, e.size !== 1); done.add(q.k); step.levelAfter = B.levelOf(xpMain); route.push(step);
}
if (only.includes('campaign')) console.log('\n## 2. Campaign path (own level on arrival; every fight won; size-3 quests with main + free companion; Deadmines fills gaps from 17)\n');
if (only.includes('campaign')) console.log('| quest | type | quest lvl | own lvl (main/comp) | enemies per fight | win avg | worst class | HP lost avg |');
if (only.includes('campaign')) console.log('|---|---|---|---|---|---|---|---|');
for (const s of route) { if (s.dungeon) { console.log(`| deadmines run | dungeon/5 | 18-19 | ${s.mainLevel}/${s.compLevel} | full run, party of 5 | ${pct(s.dungeon.clear)} cleared | — | +${s.dungeon.xp} XP${s.dungeon.stuck ? ' (stuck: <20% clears)' : s.dungeon.clear < 0.5 ? ' (hard: retries expected)' : ''} |`); continue; } for (const f of s.fights) {
  if (f.enemies.some(x => /dummy/.test(x))) continue;
  const r = rate(s.k, f.enemies, cls => s.size === 1 ? [hero(cls, f.mainLevel)] : [hero(cls, f.mainLevel), freeComp(cls, s.compLevel)]);
  const w = r.reduce((a, x) => x.win < a.win ? x : a);
  f.result = { win: avg(r, x => x.win), worst: w.cls + ' ' + pct(w.win), lost: avg(r, x => x.lost), byClass: r };
  console.log(`| ${s.k} | ${s.type}/${s.size} | ${s.encLevel} | ${f.mainLevel}/${s.compLevel} | ${f.enemies.join(', ')}${f.count > 1 ? ' ×' + f.count + ' fights' : ''} | ${pct(f.result.win)} | ${f.result.worst} | ${pct(f.result.lost)} |`);
}
}
const zoneEnd = {}; for (const r of route) if (!r.dungeon) zoneEnd[r.zone] = r.levelAfter;
if (only.includes('campaign')) console.log('\nLevel at the end of each zone: ' + Object.entries(zoneEnd).map(([z, l]) => z + ' ' + l).join(', ') + '; Deadmines runs: ' + route.filter(r => r.dungeon && !r.dungeon.stuck).length);
if (only.includes('campaign')) console.log('Level after the last quest: main ' + B.levelOf(xpMain) + ' (' + xpMain + ' XP), companion ' + B.levelOf(xpComp));

// Section 3: BAL-06 group quests at their own level
const groups = [];
if (only.includes('group')) {
  const GQ = G.quests.filter(q => { const e = B.ENCOUNTERS[q.k]; return e && e.type === 'group' && e.size >= 3 && !q.intro && e.enemies.length; });
  GQ.sort((a, b) => B.ENCOUNTERS[a.k].level - B.ENCOUNTERS[b.k].level || a.k.localeCompare(b.k));
  const fightsOf = q => { const e = B.ENCOUNTERS[q.k]; if (!q.goals) return [e.enemies.slice()];
    const seen = new Map(), left = q.goals.map(g => g.count);
    while (left.some(n => n > 0)) { const en = []; q.goals.forEach((g, i) => { const n = Math.min(left[i], 3 - en.length); for (let j = 0; j < n; j++) en.push(g.enemy); left[i] -= n; }); seen.set(en.join(), en); }
    return [...seen.values()]; };
  const isRemainder = (q, en) => !!q.goals && en.length < B.ENCOUNTERS[q.k].packSize; // last, smaller goal fight: no target
  const worstOf = rs => rs.reduce((a, x) => x.win < a.win ? x : a);
  // Size 3: full = main + tank + healer; short = main + the better of tank or healer (2 heroes).
  // Size 5 (owner 2026-11-27: needs more than three): full = main + tank + healer + fire mage + combat rogue; short = main + tank + healer (3 heroes); four = full minus the rogue.
  const mainOf = (cls, L, geared) => Object.assign(hero(cls, L), geared ? { statBonuses: gear(cls, L) } : {});
  const dps = (L, rb) => [{ cls: 'mage', spec: 'fire', level: L, rb: rb || 0 }, { cls: 'rogue', spec: 'combat', level: L, rb: rb || 0 }];
  const fullRate = (k, en, L, size) => rate(k, en, cls => [hero(cls, L), tankOf(cls, L), healOf(cls, L)].concat(size >= 5 ? dps(L) : []));
  const fourRate = (k, en, L) => rate(k, en, cls => [hero(cls, L), tankOf(cls, L), healOf(cls, L), dps(L)[0]]);
  const shortRate = (k, en, L, size, rb, geared) => {
    if (size >= 5) return rate(k, en, cls => [mainOf(cls, L, geared), tankOf(cls, L, rb), healOf(cls, L, rb)]);
    const t = rate(k, en, cls => [mainOf(cls, L, geared), tankOf(cls, L, rb)]), h = rate(k, en, cls => [mainOf(cls, L, geared), healOf(cls, L, rb)]); return t.map((x, i) => x.win >= h[i].win ? x : h[i]); };
  if (args.includes('--calibrate')) { // per-quest tune: hardest full fight of the quest, the full party wins ~90% (avg over main classes)
    const tune = {}, T = B.GROUP_ENEMY_CURVE.tune;
    for (const q of GQ) { const e = B.ENCOUNTERS[q.k], packs = fightsOf(q).filter(en => !isRemainder(q, en));
      const winAt = t => { T[q.k] = t; return Math.min(...packs.map(en => avg(fullRate(q.k, en, e.level, e.size), x => x.win))); };
      let lo = Math.log(0.35), hi = Math.log(4);
      for (let i = 0; i < 9; i++) { const mid = (lo + hi) / 2; if (winAt(Math.exp(mid)) >= 0.9) lo = mid; else hi = mid; }
      tune[q.k] = Math.round(Math.exp(lo) * 100) / 100; T[q.k] = tune[q.k]; }
    const out = args[args.indexOf('--calibrate') + 1];
    require('node:fs').writeFileSync(out, JSON.stringify(tune, null, 1) + '\n'); console.log('calibrated tune written to ' + out);
  }
  console.log('\n## 3. Group quests at the quest level (BAL-06; avg win over 8 main classes, worst class; main HP lost avg for the full party; * = outside target)\n');
  console.log('Size 3: full = 3 heroes, short = 2. Size 5: full = 5 heroes, short = 3, four = 4. Strong short: main 2 levels above with gear, companions legendary (rb 0.20) or epic (0.15).\n');
  console.log('| quest | size | lvl | enemies per fight | short: win | four: win | full: win (worst) | full: HP lost | strong short, legendary: win | strong short, epic: win |');
  console.log('|---|---|---|---|---|---|---|---|---|---|');
  for (const q of GQ) { const e = B.ENCOUNTERS[q.k], L = e.level, Ls = Math.min(60, L + 2);
    for (const en of fightsOf(q)) {
      const two = shortRate(q.k, en, L, e.size, 0, false), three = fullRate(q.k, en, L, e.size), four = e.size >= 5 ? fourRate(q.k, en, L) : null;
      const leg = shortRate(q.k, en, Ls, e.size, 0.20, true), epic = shortRate(q.k, en, Ls, e.size, 0.15, true);
      const row = { k: q.k, size: e.size, level: L, enemies: en, two: avg(two, x => x.win), four: four ? avg(four, x => x.win) : null, three: avg(three, x => x.win), threeWorst: worstOf(three), threeLost: avg(three, x => x.lost), leg: avg(leg, x => x.win), epic: avg(epic, x => x.win) };
      row.remainder = isRemainder(q, en);
      row.ok = row.remainder ? { two: true, three: true, leg: true } : { two: row.two <= 0.15, three: row.three >= 0.8 && row.threeWorst.win >= 0.6, leg: row.leg >= 0.5 };
      groups.push(row);
      console.log(`| ${q.k} | ${e.size} | ${L} | ${en.join(', ')}${row.remainder ? ' (last, smaller fight)' : ''} | ${mark(pct(row.two), row.ok.two)} | ${four ? pct(row.four) : '—'} | ${mark(pct(row.three), row.ok.three)} (${row.threeWorst.cls} ${pct(row.threeWorst.win)}) | ${pct(row.threeLost)} | ${mark(pct(row.leg), row.ok.leg)} | ${pct(row.epic)} |`);
    }
  }
  const full = groups.filter(r => !r.remainder), okN = f => full.filter(r => r.ok[f]).length;
  console.log(`\nOn target (full fights): short party <=15% ${okN('two')}/${full.length}; full party ${okN('three')}/${full.length}; strong short with legendary >=50% ${okN('leg')}/${full.length}; full party: median main HP lost ${pct(full.map(r => r.threeLost).sort((a, b) => a - b)[full.length >> 1] || 0)}`);
}
// Section 4: Deadmines (owner 2026-11-27: hard without gear at the dungeon level). Party: main + prot warrior + holy priest + fire mage + combat rogue.
const dungeon = [];
if (only.includes('dungeon')) {
  const run = (L, rb, geared) => { let c = 0, n = 0; const M = Math.max(4, N >> 2);
    for (const cls of CLS) for (let s = 0; s < M; s++) { const mk = (c2, sp, main, ex) => Object.assign({ cls: c2, spec: sp, level: L, main, race: 'human', pet: c2 === 'hunter' ? 'wolf' : c2 === 'warlock' ? 'imp' : undefined }, ex || {});
      const r = B.newRun('deadmines', [mk(cls, DD[cls], true, geared ? { statBonuses: gear(cls, L) } : {}), mk('warrior', 'prot', false, { rb }), mk('priest', 'holy', false, { rb }), mk('mage', 'fire', false, { rb }), mk('rogue', 'combat', false, { rb })], cls, L, s * 7919 + 13);
      B.simulateRun(r); n++; if (r.state === 'cleared') c++; } return c / n; };
  console.log('\n## 4. Deadmines full run (party of 5; cleared share over 8 main classes; DUNGEON_CURVE ' + JSON.stringify(B.DUNGEON_CURVE.deadmines) + ')\n');
  console.log('| party | 18 | 19 | 20 | 21 | 24 | 30 |'); console.log('|---|---|---|---|---|---|---|');
  for (const [name, rb, geared] of [['no gear, common companions', 0, false], ['main in the best Deadmines gear', 0, true], ['main geared, rare companions (rb 0.08)', 0.08, true]]) {
    const row = { name, rates: [18, 19, 20, 21, 24, 30].map(L => run(L, rb, geared)) }; dungeon.push(row);
    console.log(`| ${name} | ${row.rates.map(pct).join(' | ')} |`); }
}
if (jsonOut) require('node:fs').writeFileSync(jsonOut, JSON.stringify({ N, soloCurve: B.SOLO_ENEMY_CURVE, groupCurve: B.GROUP_ENEMY_CURVE, feel, route, groups, dungeon }, null, 1));
