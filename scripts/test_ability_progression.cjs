'use strict';
// Fixtures below exercise the API only; they are NOT approved game schedules.
const assert = require('node:assert/strict');
const B = require('./lib_engine_load.cjs')();
const P = B.abilityProgression;
const plain = value => JSON.parse(JSON.stringify(value));
assert.ok(P && Object.isFrozen(P));
// Production schedule (owner 2026-11-27): every spec configured, two core abilities from 1, the whole kit open by 30, nothing above 30.
assert.equal(P.configuredProfiles.length, Object.keys(B.ABILITY_UNLOCKS).length);
let profiles = 0;
for (const [cls, c] of Object.entries(B.CLASSES)) {
  for (const [spec, def] of Object.entries(c.specs)) {
    profiles++;
    const plan = B.ABILITY_UNLOCKS[cls + ':' + spec];
    assert.ok(plan, 'schedule for ' + cls + ':' + spec);
    assert.deepEqual(Object.keys(plan).sort(), [...def.skills].sort(), 'schedule covers the kit: ' + cls + ':' + spec);
    assert.ok(Object.values(plan).filter(l => l === 1).length >= 2, 'two core abilities from 1: ' + cls + ':' + spec);
    assert.ok(Math.max(...Object.values(plan)) === 30, 'last ability at 30: ' + cls + ':' + spec);
    for (const level of [1, 9, 14, 15, 20, 29, 30, 60]) {
      assert.deepEqual(plain(P.active(cls, spec, level)), plain(def.skills.filter(id => plan[id] <= level)));
      for (const slot of P.slots(cls, spec, level)) {
        assert.equal(slot.unlockLevel, plan[slot.id]);
        assert.equal(slot.source, 'level');
        assert.equal(slot.available, level >= plan[slot.id]);
        assert.equal(slot.name, B.SKILLS[slot.id].name);
        assert.ok(Object.isFrozen(slot));
      }
    }
    assert.deepEqual(plain(P.active(cls, spec, 30)), plain(def.skills), 'whole kit at 30: ' + cls + ':' + spec);
  }
}
const fixture = { 'warrior:prot': { heroicstrike: 1, taunt: 1, shieldblock: 15, thunder: 5, revenge: 20, wall: 30 } };
const profile = P.create(fixture);
fixture['warrior:prot'].wall = 1;
for (const [id, unlock] of Object.entries({ heroicstrike: 1, taunt: 1, shieldblock: 15, thunder: 5, revenge: 20, wall: 30 })) {
  if (unlock > 1) assert.equal(profile.slots('warrior', 'prot', unlock - 1).find(s => s.id === id).available, false);
  assert.equal(profile.slots('warrior', 'prot', unlock).find(s => s.id === id).available, true);
}
assert.ok(!profile.active('warrior', 'prot', 14).includes('shieldblock'));
assert.ok(profile.active('warrior', 'prot', 15).includes('shieldblock'));
assert.ok(!profile.active('warrior', 'prot', 3).includes('thunder'));
assert.deepEqual(plain(profile.active('mage', 'fire', 1)), plain(B.CLASSES.mage.specs.fire.skills));
const list = P.active('warrior', 'prot', 30); list.length = 0;
assert.equal(P.active('warrior', 'prot', 30).length, B.CLASSES.warrior.specs.prot.skills.length);
const changed = { ...fixture['warrior:prot'], wall: 30 };
assert.throws(() => P.create({ 'warrior:prot': { heroicstrike: 1 } }));
assert.throws(() => P.create({ 'warrior:prot': { ...changed, invented: 10 } }));
for (const level of [0, 61, 1.5, '15', NaN, null]) assert.throws(() => P.create({ 'warrior:prot': { ...changed, wall: level } }));
assert.throws(() => P.create({ 'warrior:missing': {} }));
assert.throws(() => P.create([]));
assert.throws(() => P.slots('missing', 'prot', 1));
for (const level of [0, 61, 1.5, '15', NaN]) assert.throws(() => P.slots('warrior', 'prot', level));
assert.deepEqual(plain(P.active('warrior', 'missing', 30)), plain(B.CLASSES.warrior.specs[B.CLASSES.warrior.def].skills));
console.log('Shared ability progression API passed; production schedule profiles:', profiles);
