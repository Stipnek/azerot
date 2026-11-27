'use strict';
// The generated talent window edit must match src/talents/*.json and the vendored art; live tree ids must exist in the engine.
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const r = spawnSync('python3', ['scripts/build_talent_window.py', '--check'], { encoding: 'utf8' });
assert.equal(r.status, 0, r.stdout + r.stderr);
const B = require('./lib_engine_load.cjs')();
const data = require('../src/talents/warrior.json');
for (const tree of data.trees) {
  const seen = new Set();
  for (const n of tree.nodes) { const key = n.row + ',' + n.col; assert.ok(!seen.has(key), 'one talent per cell: ' + tree.id + ' ' + key); seen.add(key); }
  if (tree.live === 'armsIntegrated') {
    const ids = new Set(B.armsIntegrated.TREE.map(n => n.id));
    assert.deepEqual([...ids].sort(), tree.nodes.map(n => n.id).sort(), 'every engine Arms talent is placed exactly once');
    for (const n of tree.nodes) assert.equal(B.armsIntegrated.TREE.find(x => x.id === n.id).tier, n.row, 'row = engine tier: ' + n.id);
  } else for (const n of tree.nodes) if (n.req) assert.ok(tree.nodes.some(x => x.id === n.req), 'prerequisite exists: ' + n.id);
}
console.log('talent window data ok');
