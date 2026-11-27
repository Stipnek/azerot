'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {spawnSync} = require('node:child_process');
const load = require('./lib_engine_load.cjs');
const marker = '__AZEROT_CORE_ABILITY_PROGRESSION__';
const root = path.resolve(__dirname, '..');
const core = fs.readFileSync(path.join(root, 'src/core/ability-progression.js'), 'utf8');
assert.equal(load.inlineCore(marker), core);
assert.equal(load.inlineCore('unchanged'), 'unchanged');
assert.throws(() => load.inlineCore(marker + marker), /Duplicate/);
assert.throws(() => load.inlineCore('__AZEROT_CORE_UNKNOWN__'), /Unresolved/);
const python = input => spawnSync('python3', ['-c', "import sys; from pathlib import Path; sys.path.insert(0, 'scripts'); from core_sources import inline_core; sys.stdout.buffer.write(inline_core(sys.stdin.buffer.read(), Path.cwd()))"], {cwd: root, input, encoding: 'utf8'});
const expanded = python(marker);
assert.equal(expanded.status, 0, expanded.stderr);
assert.equal(expanded.stdout, core, 'Python and Node embed identical bytes');
assert.notEqual(python(marker + marker).status, 0);
assert.notEqual(python('__AZEROT_CORE_UNKNOWN__').status, 0);
const B = load();
const plain = value => JSON.parse(JSON.stringify(value));
const standalone = vm.runInNewContext(core)(B.CLASSES, B.SKILLS)(JSON.parse(JSON.stringify(B.ABILITY_UNLOCKS)));
let checked = 0;
for (const [cls, c] of Object.entries(B.CLASSES)) {
  for (const spec of Object.keys(c.specs)) {
    for (let level = 1; level <= 60; level++) {
      assert.deepEqual(plain(standalone.slots(cls, spec, level)), plain(B.abilityProgression.slots(cls, spec, level)));
      checked++;
    }
  }
}
assert.ok(load.source().includes(core), 'engine includes the actual standalone core source');
assert.ok(!load.source().includes('__AZEROT_CORE_'), 'no unresolved core marker');
console.log('Core inlining passed: Python/Node parity, rejected markers, standalone API and', checked, 'slot comparisons');
