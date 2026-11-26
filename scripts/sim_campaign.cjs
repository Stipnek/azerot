'use strict';
// BAL-04 balance REPORT (not a regression gate). Follows the real early-game path instead of putting the hero at each quest's level.
// Run: node scripts/sim_campaign.cjs [N=60] [--old-curve] [--json out.json]   (SOLO_CURVE env: see below)
//   --old-curve  the game before BAL-04 (general enemy curve, up to 3 enemies per solo fight, no early XP bonus) for comparison.
// Section 1 (feel): hero alone, no gear, own level = enemy level, vs 1/2/3 typical zone enemies; owner targets 2026-11-26:
//   1 enemy dies in 3-5 hits; 2 enemies cost about half HP (45-60%) and stay winnable; 3 enemies need gear or level (win <=60%, +2 levels >=75%).
// Section 2 (campaign): quest graph scripts/fixtures/early-quest-graph.json (runtime QUESTS dump), greedy lowest-level-first, every fight won,
//   own XP via the engine's xpShares, goal quests as repeated fights of the remaining goal enemies, at most SOLO_MAX_ENEMIES at once (prepareQuestEnemies),
//   group quests with main + free companion (warrior main: holy priest, otherwise prot warrior) at the companion's own level.
//   Not modelled: ambush XP, gear and tavern bonuses (both make the party stronger), parties larger than two.
// Seeds: s*7919+13 for s in 0..N-1.
const path = require('node:path');
const B = require('./lib_engine_load.cjs')();
const G = require(path.join(__dirname, 'fixtures/early-quest-graph.json'));
const args = process.argv.slice(2);
const N = +args.find(a => /^\d+$/.test(a)) || 60;
const jsonOut = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;
if (!B.SOLO_ENEMY_CURVE) throw new Error('SOLO_ENEMY_CURVE missing: needs script-05.zzzzzzz-solo-enemy-curve edit');
const OLD = args.includes('--old-curve');
if (OLD) { // the game before BAL-04: general curve, up to 3 enemies, no early XP bonus
  B.SOLO_ENEMY_CURVE.enabled = false; B.EARLY_XP.mult = 1;
  for (const e of Object.values(B.ENCOUNTERS)) if (e && e.uncappedEnemies) e.enemies = e.uncappedEnemies.slice();
}
const SOLO_CAP = OLD ? 3 : B.SOLO_MAX_ENEMIES;
// Tuning: SOLO_CURVE='{"hp":[...14],"atk":[...14]}' overrides the table rows for this run only.
if (!OLD && process.env.SOLO_CURVE) Object.assign(B.SOLO_ENEMY_CURVE, JSON.parse(process.env.SOLO_CURVE));
const CLS = ['warrior', 'paladin', 'druid', 'priest', 'mage', 'hunter', 'rogue', 'warlock'];
const PET = { hunter: 'wolf', warlock: 'imp' };
const DD = { warrior: 'arms', paladin: 'ret', druid: 'cat', priest: 'shadow', mage: 'fire', hunter: 'mm', rogue: 'combat', warlock: 'aff' };
const FEEL_MOBS = { 1: ['wolf', 'thief'], 2: ['kobold', 'wolf'], 3: ['kobold', 'boar'], 4: ['kobold', 'thief'], 5: ['kobold', 'gnollRunt'], 6: ['murloc', 'boar'], 7: ['murloc', 'kobold'],
  8: ['murloc', 'wolf'], 9: ['thief', 'murloc'], 10: ['goretusk', 'gnollRunt'], 11: ['looter', 'harvester'], 12: ['looter', 'gnollMiner'], 13: ['murlocWarrior', 'looter'], 14: ['murlocWarrior', 'pillager'] };
const hero = (cls, L) => ({ cls, spec: L < 15 ? B.CLASSES[cls].def : DD[cls], level: L, main: true, neutralTraining: L < 15, race: 'human', pet: PET[cls] });
const freeComp = (cls, L) => cls === 'warrior' ? { cls: 'priest', spec: 'holy', level: L } : { cls: 'warrior', spec: 'prot', level: L };
const avg = (xs, f) => xs.reduce((s, x) => s + f(x), 0) / xs.length;
const pct = x => Math.round(x * 100) + '%';

function fight(encKey, enemies, party, seed) {
  const e = B.ENCOUNTERS[encKey], saved = e.enemies; e.enemies = enemies;
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
for (let L = 1; L <= 14; L++) for (const mob of FEEL_MOBS[L]) {
  B.ENCOUNTERS.__sim_feel.level = L;
  const r = n => rate('__sim_feel', Array(n).fill(mob), cls => [hero(cls, L)]);
  const one = r(1), two = r(2), three = r(3), adv = rate('__sim_feel', Array(3).fill(mob), cls => [hero(cls, Math.min(60, L + 2))]);
  const row = { level: L, mob, hits1: avg(one, x => x.hits), lost1: avg(one, x => x.lost), lost2: avg(two, x => x.lost), worst2: two.reduce((a, x) => x.win < a.win ? x : a),
    win3: avg(three, x => x.win), win3adv: avg(adv, x => x.win) };
  row.ok = { hits1: row.hits1 >= 3 && row.hits1 <= 5.5, lost2: row.lost2 >= 0.40 && row.lost2 <= 0.65 && row.worst2.win >= 0.7, win3: row.win3 <= 0.6, win3adv: row.win3adv >= 0.75 };
  feel.push(row);
}
delete B.ENCOUNTERS.__sim_feel;
console.log((OLD ? 'Game before BAL-04 (general curve, up to 3 enemies, XP x1)' : 'BAL-04: solo curve, at most ' + SOLO_CAP + ' enemies per solo fight, early XP x' + B.EARLY_XP.mult) + '; N=' + N + ' per class\n');
console.log('## 1. Fight feel: hero alone, no gear, own level = enemy level (avg over 8 classes; * = outside target)\n');
console.log('| lvl | enemy | 1: hits to kill | 1: HP lost | 2: HP lost | 2: worst class win | 3: win | 3 at +2 lvl: win |');
console.log('|---|---|---|---|---|---|---|---|');
const mark = (v, ok) => v + (ok ? '' : ' *');
for (const r of feel) console.log(`| ${r.level} | ${r.mob} | ${mark(r.hits1.toFixed(1), r.ok.hits1)} | ${pct(r.lost1)} | ${mark(pct(r.lost2), r.ok.lost2)} | ${r.worst2.cls} ${pct(r.worst2.win)} | ${mark(pct(r.win3), r.ok.win3)} | ${mark(pct(r.win3adv), r.ok.win3adv)} |`);

// Section 2: campaign path
const Q = G.quests.filter(q => B.ENCOUNTERS[q.k] && B.ENCOUNTERS[q.k].level <= 14 && !q.intro);
const done = new Set(); let xpMain = 0, xpComp = 0; const route = [];
for (let guard = 0; guard < 200; guard++) {
  const Lm = B.levelOf(xpMain);
  const open = Q.filter(q => !done.has(q.k) && q.need.every(n => done.has(n) || !Q.some(x => x.k === n)) && (!q.minLevel || Lm >= q.minLevel));
  if (!open.length) break;
  open.sort((a, b) => B.ENCOUNTERS[a.k].level - B.ENCOUNTERS[b.k].level || a.k.localeCompare(b.k));
  const q = open[0], e = B.ENCOUNTERS[q.k], Lc = B.levelOf(xpComp);
  const step = { k: q.k, zone: q.z, type: e.type, size: e.size, encLevel: e.level, mainLevel: Lm, compLevel: Lc, fights: [] };
  const share = (enc, fights) => { const x = B.xpShares(enc, [{ cls: 'me', level: B.levelOf(xpMain), main: true, fights: true }, { cls: 'c', level: B.levelOf(xpComp), fights }]); xpMain += x[0].xp; xpComp += x[1].xp; };
  if (q.goals) { // repeated fights of up to 3 remaining goal enemies, 0.12 XP per kill
    const left = q.goals.map(g => g.count);
    while (left.some(n => n > 0)) { const en = []; q.goals.forEach((g, i) => { const n = Math.min(left[i], SOLO_CAP - en.length); for (let j = 0; j < n; j++) en.push(g.enemy); left[i] -= n; });
      const prev = step.fights[step.fights.length - 1];
      if (prev && prev.enemies.join() === en.join() && prev.mainLevel === B.levelOf(xpMain)) prev.count++; else step.fights.push({ enemies: en, count: 1, mainLevel: B.levelOf(xpMain) });
      share(Object.assign({}, e, { xpMult: 0.12 * en.length }), false); }
  } else if (e.type !== 'talk' && e.enemies.length) step.fights.push({ enemies: e.enemies.slice(), count: 1, mainLevel: Lm });
  share(e, e.size !== 1); done.add(q.k); step.levelAfter = B.levelOf(xpMain); route.push(step);
}
console.log('\n## 2. Campaign path (own level on arrival; every fight won; size-3 quests with main + free companion)\n');
console.log('| quest | type | quest lvl | own lvl (main/comp) | enemies per fight | win avg | worst class | HP lost avg |');
console.log('|---|---|---|---|---|---|---|---|');
for (const s of route) for (const f of s.fights) {
  if (f.enemies.some(x => /dummy/.test(x))) continue;
  const r = rate(s.k, f.enemies, cls => s.size === 1 ? [hero(cls, f.mainLevel)] : [hero(cls, f.mainLevel), freeComp(cls, s.compLevel)]);
  const w = r.reduce((a, x) => x.win < a.win ? x : a);
  f.result = { win: avg(r, x => x.win), worst: w.cls + ' ' + pct(w.win), lost: avg(r, x => x.lost), byClass: r };
  console.log(`| ${s.k} | ${s.type}/${s.size} | ${s.encLevel} | ${f.mainLevel}/${s.compLevel} | ${f.enemies.join(', ')}${f.count > 1 ? ' ×' + f.count + ' fights' : ''} | ${pct(f.result.win)} | ${f.result.worst} | ${pct(f.result.lost)} |`);
}
console.log('\nLevel after the last quest up to 14: main ' + B.levelOf(xpMain) + ' (' + xpMain + ' XP), companion ' + B.levelOf(xpComp));
if (jsonOut) require('node:fs').writeFileSync(jsonOut, JSON.stringify({ N, soloCurve: B.SOLO_ENEMY_CURVE, feel, route }, null, 1));
