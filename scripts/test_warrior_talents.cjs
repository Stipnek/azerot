'use strict';
// TALENT-03 warrior: Fury/Protection rules (3-point tiers, lines, ability talents) and the reworked Last Stand (owner 2026-11-27:
// triggers by itself on a lethal hit, leaves 1 HP, immortal until the warrior's next turn, once per fight).
const assert = require('node:assert/strict');
const B = require('./lib_engine_load.cjs')();
const plain = x => JSON.parse(JSON.stringify(x));
for (const spec of ['fury', 'prot']) {
  const R = B.specTalents.rules('warrior', spec);
  assert.ok(R && R.CONFIG.perTier === 3, spec + ' rules with 3-point tiers');
  for (let l = 1; l <= B.XPC.cap; l++) assert.ok(R.validate(R.line(l), l).ok, spec + ' line valid at ' + l);
  for (const n of R.TREE) if (n.active) assert.ok(B.SKILLS[n.active], 'skill for ' + n.id);
  assert.ok(!B.CLASSES.warrior.specs[spec].skills.some(id => R.TREE.some(n => n.active === id)), spec + ' kit has no talent abilities');
}
const F = B.specTalents.rules('warrior', 'fury'), P = B.specTalents.rules('warrior', 'prot');
assert.equal(F.line(27).bloodthirst, undefined); assert.equal(F.line(28).bloodthirst, 1);
assert.equal(P.line(27).shieldslam, undefined); assert.equal(P.line(28).shieldslam, 1);
assert.equal(P.validate({ shieldspec: 2, toughness: 1 }, 15).ok, false, 'tier 2 needs 3 points');
assert.equal(P.validate({ ironwill: 1, shieldspec: 3 }, 20).ok, false, 'closed node');
assert.equal(P.validate(P.line(30), 29).ok, false, 'budget');
// Last Stand
B.ENCOUNTERS.__lst = { name: 'lst', place: 'lst', type: 'solo', size: 1, level: 28, enemies: ['dw_spider', 'dw_skeleton', 'dw_wolf'] };
let triggered = 0;
for (let s = 0; s < 30; s++) {
  const st = B.createBattle({ encounter: '__lst', level: 28, main: 'warrior', seed: s * 7919 + 13, party: [{ cls: 'warrior', spec: 'prot', level: 28, main: true, talents: plain(P.line(28)) }] });
  const h = st.heroes[0]; assert.ok(h.skills.includes('laststand'));
  let n = 0, g = 0;
  while (!st.over && g++ < 8000) {
    B.step(st);
    for (const e of st.events) {
      if (e.laststand) { n++; assert.equal(e.tgt, h.id); assert.equal(h.hp, 1, 'lethal hit leaves 1 HP'); assert.ok(h.effects.some(f => f.kind === 'undying')); }
      if (e.t === 'skill' && e.skill === 'laststand') assert.fail('Last Stand is not pressed');
    }
    st.events.length = 0;
  }
  assert.ok(n <= 1, 'once per fight'); if (n) triggered++;
}
assert.ok(triggered >= 10, 'Last Stand triggers in hard fights: ' + triggered);
{ // without the talent the same hit kills
  const st = B.createBattle({ encounter: '__lst', level: 28, main: 'warrior', seed: 13, party: [{ cls: 'warrior', spec: 'prot', level: 28, main: true, talents: {} }] });
  const h = st.heroes[0], e = st.enemies[0]; h.hp = 5;
  B.SKILLS && e && (e.atk *= 3);
  let g = 0; while (!st.over && h.hp > 0 && g++ < 400) B.step(st);
  assert.ok(!h.lastStandUsed);
}
console.log('warrior talents ok; Last Stand triggered in', triggered, 'of 30 hard fights');
{ // owner 2026-11-27: in a dungeon Last Stand is carried between rooms; a rest refreshes it, and the Deadmines run has one rest
  const run = B.newRun('deadmines', [{ cls: 'warrior', spec: 'prot', level: 28, main: true, talents: plain(P.line(28)) }], 'warrior', 28, 7);
  const st = B.createBattle({ party: run.party, main: run.main, encounter: B.roomKey(run), level: 28, seed: 1, carry: [{ hp: 100, maxHp: 1e9, mana: 0, maxMana: 0, lastStandUsed: true }] });
  assert.equal(st.heroes[0].lastStandUsed, true, 'carried flag applies');
  run.carry = [{ hp: 10, maxHp: 100, mana: 0, maxMana: 0, lastStandUsed: true }]; B.restRun(run);
  assert.equal(run.carry[0].lastStandUsed, false, 'owner 2026-11-27: a rest refreshes Last Stand');
  assert.equal(B.DUNGEONS.deadmines.rests, 1, 'one rest per Deadmines run for now');
  const src = require('./lib_engine_load.cjs').source('src/scripts/script-05.txt');
  assert.ok(/lastStandUsed: !!h\.lastStandUsed/.test(src), 'room end carries the flag');
}
console.log('Last Stand once per dungeon run ok');
