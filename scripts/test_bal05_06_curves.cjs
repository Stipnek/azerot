'use strict';
// BAL-05 (solo rule at every level) and BAL-06 (group quests need three heroes): engine curves, caps and a small fight check.
const assert = require('node:assert/strict');
const vm = require('node:vm');
const load = require('./lib_engine_load.cjs');
const B = load(), source = load.source('src/scripts/script-06.txt');
const E = B.ENCOUNTERS;

// BAL-05: the solo curve continues above level 14 and solo fights keep the two-enemy cap at every level.
const sc = B.SOLO_ENEMY_CURVE;
assert.ok(Array.isArray(sc.high) && sc.high.length >= 2, 'solo curve has points from level 15');
assert.equal(B.enemyCurve(15, 'atk', true), sc.high[0][2]);
assert.ok(B.enemyCurve(25, 'atk', true) > 1.2, 'two enemies at 25 hit harder than the general curve');
assert.equal(B.enemyCurve(60, 'atk', true), sc.high[sc.high.length - 1][2], 'flat after the last point');
const [a, b] = sc.high; const mid = Math.round((a[0] + b[0]) / 2);
assert.ok(Math.abs(B.enemyCurve(mid, 'atk', true) - (a[2] + (b[2] - a[2]) * (mid - a[0]) / (b[0] - a[0]))) < 1e-9, 'linear between points');
assert.equal(B.enemyCurve(25, 'atk', false), 1, 'non-solo fights keep the general curve at 15+');
assert.equal(B.enemyCurve(14, 'hp', true), sc.hp[13], 'levels 1-14 unchanged');
for (const [k, e] of Object.entries(E)) if (e.type === 'solo' && e.size === 1) assert.ok(e.enemies.length <= B.SOLO_MAX_ENEMIES, 'solo cap at every level: ' + k);
assert.equal(JSON.stringify(E.rr_assess.uncappedEnemies), JSON.stringify(['gnollMiner', 'gnollMiner', 'gnollMiner']), 'level-15 three-enemy solo quest is capped, list kept');

// BAL-06: group quests get a power budget; dungeons, solo fights and the training ground do not.
const G = B.GROUP_ENEMY_CURVE;
assert.ok(G.enabled && G.target[3] > 0 && G.target[5] > 0);
assert.ok(G.target[5] > G.target[3], 'five-hero quests need more than three heroes');
// Deadmines: every room, including the optional one, is harder; other fights are not.
const dm = B.DUNGEONS.deadmines, dc = B.DUNGEON_CURVE.deadmines;
assert.ok(dc.hp > 1 && dc.atk > 1);
for (const k of dm.rooms.concat(dm.optional || [])) { assert.equal(B.dungeonCurve(k, 'hp'), dc.hp, 'Deadmines room ' + k); assert.equal(B.dungeonCurve(k, 'atk'), dc.atk); }
assert.equal(B.dungeonCurve('dw1', 'hp'), 1, 'dungeons without an entry keep 1');
assert.equal(B.dungeonCurve('cl_watch1', 'hp'), 1, 'group quests are not dungeons');
assert.equal(B.groupCurve(E.vancleef, 'hp', 'vancleef'), 1, 'dungeon rooms untouched');
assert.equal(B.groupCurve(E.dw1, 'hp', 'dw1'), 1, 'size-3 dungeon untouched');
assert.equal(B.groupCurve(E.kobold_camp, 'hp', 'kobold_camp'), 1, 'solo untouched');
assert.equal(B.groupCurve(E.test, 'hp', 'test'), 1, 'training ground untouched');
assert.equal(B.groupCurve({ type: 'group', size: 3, level: 1, enemies: ['v56_dummy', 'v56_dummy'], packSize: 2 }, 'hp', 'tutorial57_team'), 1, 'tutorial fight with the first companion keeps its dummies');
assert.ok(B.groupCurve(E.cl_watch1, 'hp', 'cl_watch1') > 3, 'three weak skeletons as a group quest are scaled up');
assert.equal(B.encounterCurve(E.cl_watch1, 'atk', 'cl_watch1'), B.groupCurve(E.cl_watch1, 'atk', 'cl_watch1'), 'level 24: general curve is 1');
// Same budget for the same pack size, whatever the enemy type; the last smaller goal fight is weaker, not scaled up.
const enc = Object.assign({}, E.cl_watch1, { packSize: 3 });
const budget = list => { enc.enemies = list; const f = B.groupCurve(enc, 'hp'); let hp = 0, atk = 0; list.forEach(k => { hp += B.ENEMIES[k].hp * f; atk += B.ENEMIES[k].atk * f; }); return { f, hp, atk }; };
const full = budget(['v56_skw', 'v56_skw', 'v56_skw']), last = budget(['v56_skw']);
assert.ok(Math.abs(full.f - last.f) < 1e-9, 'goal fights scale by the full fight');
assert.ok(last.hp < full.hp / 2, 'one remaining skeleton is weaker than three');
G.enabled = false; assert.equal(B.groupCurve(E.cl_watch1, 'hp', 'cl_watch1'), 1, 'enabled: false restores old group fights'); G.enabled = true;
for (const [k, t] of Object.entries(G.tune)) { assert.ok(E[k] && E[k].type === 'group', 'tune key is a group quest: ' + k); assert.ok(t >= 0.5 && t <= 2, 'tune stays a correction: ' + k); }

// The battle spawns what the curve says.
const st = B.createBattle({ encounter: 'cl_watch1', level: 24, main: 'mage', seed: 7, party: [{ cls: 'mage', spec: 'fire', level: 24, main: true }] });
const d = B.ENEMIES[E.cl_watch1.enemies[0]];
assert.equal(st.enemies[0].maxHp, Math.round(d.hp * B.lvlFactor(24) * 1.10 * 1.08 * B.encounterCurve(E.cl_watch1, 'hp', 'cl_watch1')));

// Fight check (fixed seeds): three heroes of the quest level win, two do not.
function wins(party, n) { let w = 0; for (let s = 0; s < n; s++) { const x = B.createBattle({ encounter: 'cl_watch2', level: 26, main: party[0].cls, seed: s * 7919 + 13, party: JSON.parse(JSON.stringify(party)) }); let g = 0; while (!x.over && g++ < 8000) B.step(x); if (x.result === 'win') w++; } return w / n; }
const main = { cls: 'rogue', spec: 'combat', level: 26, main: true, race: 'human' }, tank = { cls: 'warrior', spec: 'prot', level: 26 }, heal = { cls: 'priest', spec: 'holy', level: 26 };
const three = wins([main, tank, heal], 20), two = Math.max(wins([main, tank], 20), wins([main, heal], 20));
assert.ok(three >= 0.7, 'three heroes win the group quest: ' + three);
assert.ok(two <= 0.3, 'two heroes practically lose: ' + two);

// Interface: goal fights use the solo cap at every level and record the full goal-fight size.
const start = source.indexOf('function prepareQuestEnemies(');
assert.ok(start >= 0);
const fnSrc = source.slice(start, source.indexOf('\n', start));
const ctx = vm.createContext({ B: { ENCOUNTERS: { q: { size: 1, level: 25, enemies: [] }, g: { size: 3, level: 25, enemies: [] } }, SOLO_MAX_ENEMIES: 2 }, questProgress: () => [] });
vm.runInContext(fnSrc, ctx);
vm.runInContext("prepareQuestEnemies({ k: 'q', goals: [{ enemy: 'dw_wolf', count: 10 }] }); prepareQuestEnemies({ k: 'g', goals: [{ enemy: 'dw_ghoul', count: 2 }, { enemy: 'dw_spider', count: 5 }] });", ctx);
assert.equal(ctx.B.ENCOUNTERS.q.enemies.length, 2, 'solo goal fight at 25 spawns two');
assert.equal(ctx.B.ENCOUNTERS.q.packSize, 2);
assert.equal(ctx.B.ENCOUNTERS.g.enemies.length, 3, 'group goal fight spawns three');
assert.equal(ctx.B.ENCOUNTERS.g.packSize, 3);
console.log('bal05/06 curves ok: three heroes ' + three + ', two heroes ' + two);
