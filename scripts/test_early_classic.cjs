'use strict';
// PLAY-11/12 (owner decision 2026-11-27, option A): Classic level-1 ability from level 1, Classic trainer levels,
// training-kit damage shape (melee: auto-attack is the main damage; casters: spells, the melee staff swing only on a turn without a spell,
// bug hunt 2026-11-28 finding 1.1; their spells x1.2 replace the old staff damage), level-1 solo enemies.
const assert = require('node:assert/strict');
const B = require('./lib_engine_load.cjs')();
const T = B.neutralTraining;
const L1 = { warrior: ['heroicstrike'], paladin: ['crusader'], druid: ['wrath'], priest: ['smiteh'], mage: ['fireball'], hunter: ['raptor'], rogue: ['sinister', 'eviscerate'], warlock: ['shadowbolt', 'immolate'] };
for (const [cls, ids] of Object.entries(L1)) assert.deepEqual(JSON.parse(JSON.stringify(T.active(cls, 1))), ids, cls + ' level-1 Classic abilities');
for (const cls of ['mage', 'priest', 'warlock']) {
  assert.equal(B.autoOf(cls, null).name, 'Удар посохом'); assert.ok(!B.autoOf(cls, null).ranged, cls + ' staff is melee');
  assert.equal(B.autoOf(cls, B.CLASSES[cls].def).name, 'Удар жезлом', cls + ' from 15 the spec auto-attack is unchanged');
}
assert.ok(B.SOLO_ENEMY_CURVE.hp[0] > 1 && B.SOLO_ENEMY_CURVE.atk[0] > 1, 'level-1 solo enemies are set for an ability from level 1');
// Damage share at level 2 against one enemy, 12 seeds: melee auto-attack about 55-65%; casters with mana never swing the staff (auto share 0).
B.ENCOUNTERS.__early_t = { name: 't', place: 't', type: 'solo', size: 1, level: 2, enemies: ['kobold'] };
for (const cls of ['warrior', 'paladin', 'rogue', 'hunter', 'druid', 'priest', 'mage', 'warlock']) {
  let auto = 0, all = 0;
  for (let s = 0; s < 12; s++) {
    const st = B.createBattle({ encounter: '__early_t', level: 2, main: cls, seed: s * 7919 + 13, party: [{ cls, spec: B.CLASSES[cls].def, level: 2, main: true, neutralTraining: true, race: 'human' }] });
    const m = st.heroes[0]; let g = 0;
    while (!st.over && g++ < 5000) for (const x of B.step(st)) if (x.t === 'dmg' && x.src === m.id && x.amt) { all += x.amt; if (x.auto) auto += x.amt; }
  }
  const share = auto / all, melee = ['warrior', 'paladin', 'rogue', 'hunter'].includes(cls);
  assert.ok(melee ? share >= 0.45 && share <= 0.75 : share === 0, `${cls} auto-attack share ${share.toFixed(2)}`);
}
delete B.ENCOUNTERS.__early_t;
for (const cls of ['druid', 'priest', 'mage', 'warlock']) assert.equal(B.neutralTraining.shape[cls].skill, 1.2, cls + ' training spells x1.2');
console.log('early Classic kit: ok');
