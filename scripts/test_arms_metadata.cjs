'use strict';
const assert = require('node:assert/strict');
const B = require('./lib_engine_load.cjs')();
const P = B.armsProto;
const ids = new Set(P.CONFIG.trainingKit.concat(P.CONFIG.specKit).map(entry => entry[0]));
for (const node of P.TREE) if (node.active) ids.add(node.id);
let kits = 0;
for (let level = 1; level <= B.XPC.cap; level++) {
  for (const alloc of [{}, P.line(level), P.buildAt(P.BUILD_B, level)]) {
    assert.equal(P.validate(alloc, level).ok, true, 'legal fixture at own level ' + level);
    for (const id of P.kit(level, alloc)) ids.add(id);
    kits++;
  }
}
for (const id of ids) {
  const skill = B.SKILLS[id];
  assert.ok(skill, 'Missing shared skill metadata: ' + id);
  assert.equal(typeof skill.name, 'string', 'name: ' + id);
  assert.ok(skill.name.trim(), 'nonempty name: ' + id);
  assert.equal(typeof skill.text, 'string', 'description: ' + id);
  assert.ok(skill.text.trim(), 'nonempty description: ' + id);
  assert.ok(Number.isFinite(skill.cd) && skill.cd >= 0, 'cooldown: ' + id);
}
assert.equal(B.SKILLS.sweeping.name, 'Размашистые удары');
assert.equal(B.SKILLS.sweeping.cd, P.CONFIG.sweeping.cd);
assert.equal(B.SKILLS.sweeping.rage, P.CONFIG.sweeping.rage);
assert.ok(P.kit(30, P.line(30)).includes('sweeping'), 'reproduce the formerly crashing hero kit');
console.log('Arms metadata coverage passed:', ids.size, 'skills across', kits, 'legal kits and every active talent');
