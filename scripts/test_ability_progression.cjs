'use strict';
// Fixtures below exercise the API only; they are NOT approved game schedules.
const assert = require('node:assert/strict');
const B = require('./lib_engine_load.cjs')();
const P = B.abilityProgression;
const plain = value => JSON.parse(JSON.stringify(value));
assert.ok(P && Object.isFrozen(P));
assert.deepEqual(plain(P.configuredProfiles), []);
let profiles = 0;
for (const [cls, c] of Object.entries(B.CLASSES)) {
  for (const [spec, def] of Object.entries(c.specs)) {
    profiles++;
    for (const level of [1, 9, 10, 14, 15, 20, 29, 30, 60]) {
      assert.deepEqual(plain(P.active(cls, spec, level)), plain(def.skills));
      const slots = P.slots(cls, spec, level);
      assert.equal(slots.length, def.skills.length);
      for (const slot of slots) {
        assert.equal(slot.unlockLevel, null);
        assert.equal(slot.source, 'legacy');
        assert.equal(slot.available, true);
        assert.equal(slot.name, B.SKILLS[slot.id].name);
        assert.equal(slot.description, B.SKILLS[slot.id].text);
        assert.ok(Object.isFrozen(slot));
      }
    }
    const battle = B.createBattle({ encounter: 'daily_wf_coast', level: 30, main: cls, seed: 123, party: [{ cls, spec, level: 1, main: true }] });
    assert.deepEqual(plain(battle.heroes[0].skills), plain(def.skills));
  }
}
const fixture = { 'warrior:prot': { heroicstrike: 1, taunt: 1, shieldslam: 15, thunder: 5, revenge: 20, wall: 30 } };
const profile = P.create(fixture);
fixture['warrior:prot'].wall = 1;
for (const [id, unlock] of Object.entries({ heroicstrike: 1, taunt: 1, shieldslam: 15, thunder: 5, revenge: 20, wall: 30 })) {
  if (unlock > 1) assert.equal(profile.slots('warrior', 'prot', unlock - 1).find(s => s.id === id).available, false);
  assert.equal(profile.slots('warrior', 'prot', unlock).find(s => s.id === id).available, true);
}
assert.ok(!profile.active('warrior', 'prot', 14).includes('shieldslam'));
assert.ok(profile.active('warrior', 'prot', 15).includes('shieldslam'));
assert.ok(!profile.active('warrior', 'prot', 3).includes('thunder'));
assert.deepEqual(plain(profile.active('mage', 'fire', 1)), plain(B.CLASSES.mage.specs.fire.skills));
const list = P.active('warrior', 'prot', 1); list.length = 0;
assert.equal(P.active('warrior', 'prot', 1).length, B.CLASSES.warrior.specs.prot.skills.length);
const changed = { ...fixture['warrior:prot'], wall: 30 };
assert.throws(() => P.create({ 'warrior:prot': { heroicstrike: 1 } }));
assert.throws(() => P.create({ 'warrior:prot': { ...changed, invented: 10 } }));
for (const level of [0, 61, 1.5, '15', NaN, null]) assert.throws(() => P.create({ 'warrior:prot': { ...changed, wall: level } }));
assert.throws(() => P.create({ 'warrior:missing': {} }));
assert.throws(() => P.create([]));
assert.throws(() => P.slots('missing', 'prot', 1));
for (const level of [0, 61, 1.5, '15', NaN]) assert.throws(() => P.slots('warrior', 'prot', level));
assert.deepEqual(plain(P.active('warrior', 'missing', 1)), plain(B.CLASSES.warrior.specs[B.CLASSES.warrior.def].skills));
console.log('Shared ability progression API passed; unchanged legacy profiles:', profiles);
