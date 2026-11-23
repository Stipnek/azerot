'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const dir = path.join(root, 'src/scripts');
const raw = fs.readFileSync(path.join(dir, 'script-06.txt'));
let source = raw.toString('utf8');
const digest = crypto.createHash('sha256').update(raw).digest('hex');
for (const name of fs.readdirSync(dir).filter(n => n.startsWith('script-06') && n.endsWith('.edits.json')).sort()) {
  const spec = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
  if (spec.sourceSha256) assert.equal(spec.sourceSha256, digest, name);
  for (const edit of spec.edits) {
    assert.ok(edit.old, name);
    assert.equal(source.split(edit.old).length - 1, 1, name + ': ' + edit.name);
    source = source.replace(edit.old, () => edit.new);
  }
}
const start = source.indexOf('  function cleanTav(tv) {');
assert.ok(start >= 0, 'cleanTav missing');
const end = source.indexOf('  function migrateTav(', start);
assert.ok(end > start, 'migrateTav boundary missing');
const cleaner = source.slice(start, end);
const match = cleaner.match(/st = (Math\.min\(5, Math\.max\(0, Number\.isFinite[^;]+?\)\));/);
assert.ok(match, 'zero-star normalization missing from assembled source');
function normalize(k) { return vm.runInNewContext(match[1], {c:{k}}); }
for (let k = 0; k <= 5; k++) assert.equal(normalize(k), k);
for (const k of [undefined, null, '', 'invalid']) assert.equal(normalize(k), 1);
assert.equal(normalize(-1), 0);
assert.equal(normalize(99), 5);
assert.equal(normalize('0'), 0);
assert.equal(normalize('3'), 3);
console.log('PASS: assembled cleanTav preserves 0..5 stars; legacy defaults preserved. Grant and duplicate flows not covered.');
