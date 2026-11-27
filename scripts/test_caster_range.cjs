'use strict';
// PLAY-19 (owner decision 2026-11-27): approach turn for melee enemies against an all-ranged party (no pets), extended once by a hero's slow;
// Classic protective spells in the training kit.
const assert = require('node:assert/strict');
const B = require('./lib_engine_load.cjs')();
B.ENCOUNTERS.__range_t = { name: 't', place: 't', type: 'solo', size: 1, level: 5, enemies: ['kobold'] };
function firstEnemyActs(cls, extra, enemies) {
  B.ENCOUNTERS.__range_t.enemies = enemies || ['kobold'];
  const st = B.createBattle({ encounter: '__range_t', level: 5, main: cls, seed: 4242, party: [Object.assign({ cls, spec: B.CLASSES[cls].def, level: 5, main: true, neutralTraining: true, race: 'human' }, extra || {})] });
  const e = st.enemies[0], acts = []; let g = 0, cur = false;
  while (!st.over && acts.length < 3 && g++ < 4000) for (const x of B.step(st)) {
    if (x.t === 'act') cur = x.id === e.id;
    if (cur && x.t === 'eskill' && x.src === e.id) acts.push(x.id);
    if (cur && x.t === 'dmg' && x.src === e.id && !acts.length) acts.push('hit');
  }
  return { acts, st };
}
const mage = firstEnemyActs('mage');
assert.equal(mage.acts[0], 'approach', 'a melee enemy first approaches a mage: ' + mage.acts);
const warrior = firstEnemyActs('warrior');
assert.notEqual(warrior.acts[0], 'approach', 'no approach against a melee hero');
const hunter = firstEnemyActs('hunter', { level: 12, pet: 'wolf' });
assert.ok(!hunter.acts.includes('approach'), 'a pet holds the enemy: no approach');
const shaman = firstEnemyActs('mage', {}, ['murlocShaman']);
assert.ok(!shaman.acts.includes('approach'), 'enemy casters do not approach');
// Wards: training kit only.
const W = B.neutralTraining.wards;
for (const cls of ['mage', 'warlock', 'druid']) {
  B.ENCOUNTERS.__range_t.enemies = ['kobold'];
  const st = B.createBattle({ encounter: '__range_t', level: 5, main: cls, seed: 1, party: [{ cls, spec: B.CLASSES[cls].def, level: 5, main: true, neutralTraining: true, race: 'human' }] });
  assert.ok(st.heroes[0].effects.some(f => f.name === W[cls].name), cls + ' ward');
}
const pr = l => B.createBattle({ encounter: '__range_t', level: l, main: 'priest', seed: 1, party: [{ cls: 'priest', spec: 'shadow', level: l, main: true, neutralTraining: true, race: 'human' }] }).heroes[0];
assert.ok(!pr(5).effects.some(f => f.kind === 'shield'), 'Power Word: Shield from 6');
assert.ok(pr(6).effects.some(f => f.kind === 'shield' && f.amt > 0), 'Power Word: Shield at 6');
const spec = B.createBattle({ encounter: '__range_t', level: 16, main: 'mage', seed: 1, party: [{ cls: 'mage', spec: 'fire', level: 16, main: true, race: 'human' }] }).heroes[0];
assert.ok(!spec.effects.some(f => f.name === W.mage.name), 'wards are training-kit only');
delete B.ENCOUNTERS.__range_t;
console.log('caster range: ok');
