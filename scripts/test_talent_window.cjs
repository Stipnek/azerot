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
  // TALENT-03: every warrior tree is live; the window only places nodes, the engine owns ids, ranks, tiers and prerequisites.
  const R = tree.live === 'armsIntegrated' ? B.armsIntegrated : tree.live === 'specTalents' ? B.specTalents.rules(data.class, tree.id) : null;
  assert.ok(R, 'live rules for ' + tree.id);
  assert.ok(B.CLASSES[data.class].specs[tree.id], 'tree id is a spec key: ' + tree.id);
  assert.deepEqual(JSON.parse(JSON.stringify(R.TREE.map(n => n.id))).sort(), tree.nodes.map(n => n.id).sort(), 'every engine talent is placed exactly once: ' + tree.id);
  assert.ok(!tree.nodes.some(n => n.baseline), 'no free baseline talents: ability talents are learned with points');
  for (const n of tree.nodes) {
    const e = R.TREE.find(x => x.id === n.id);
    assert.equal(e.tier, n.row, 'row = engine tier: ' + n.id);
    if (n.req) assert.equal(e.req, n.req, 'prerequisite matches engine: ' + n.id);
    if (n.max) assert.equal(e.max, n.max, 'rank count matches engine: ' + n.id);
  }
  assert.equal(R.CONFIG.perTier, 3, 'compressed tiers while the cap is 30');
}
const ms = B.armsIntegrated.TREE.find(n => n.id === 'mortal'), bt = B.specTalents.rules('warrior', 'fury').TREE.find(n => n.id === 'bloodthirst'), ss = B.specTalents.rules('warrior', 'prot').TREE.find(n => n.id === 'shieldslam');
for (const n of [ms, bt, ss]) assert.ok(n.tier === 7 && n.active, 'tier-7 ability talent: ' + n.id);
console.log('talent window data ok');
