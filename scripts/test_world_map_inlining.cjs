'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const load = require('./lib_engine_load.cjs');
const marker = '__AZEROT_CORE_WORLD_MAPS__';
const source = load.inlineCore(marker);
assert.ok(!source.includes('__AZEROT_CORE_'));
assert.ok(!source.includes('__AZEROT_WORLD_'));
new vm.Script('(function(){' + source + '\n})');
const images = [...source.matchAll(/data:image\/png;base64,([A-Za-z0-9+/=]+)/g)].map(match => Buffer.from(match[1], 'base64'));
assert.equal(images.length, 4, 'all four maps must be embedded as PNG');
const files = [
  'file_000000004df081f5a1a4a8110095645f.png',
  'file_00000000301481f588f0385ce354c857.png',
  'file_000000006a9081f58eda6c57319bffc7.png',
  'file_00000000ebf881f5a401dd8c3ad2c6a5.png'
];
for (let i = 0; i < files.length; i++) {
  const original = fs.readFileSync(path.join(__dirname, '../src/assets', files[i]));
  assert.ok(images[i].equals(original), 'image correspondence: ' + files[i]);
  assert.equal(images[i].subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  const ratio = original.readUInt32BE(16) + ' / ' + original.readUInt32BE(20);
  assert.ok(source.includes("ratio: '" + ratio + "'"), 'retain original image aspect ratio');
}
assert.throws(() => load.inlineCore(marker + '\n' + marker), /Duplicate core module marker/);
assert.throws(() => load.inlineCore('__AZEROT_CORE_UNKNOWN__'), /Unresolved core module marker/);
console.log('World-map inlining passed: production Python path, four exact PNG payloads, aspect ratios, JavaScript syntax and marker guards. No browser or geography validation.');
