'use strict';
// TALENT-01: the owner-supplied spec switch sound is inlined (both formats, bytes match the vendored files) and the edit is up to date.
const assert = require('node:assert/strict');
const fs = require('node:fs'), crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const r = spawnSync('python3', ['scripts/build_spec_sound.py', '--check'], { encoding: 'utf8' });
assert.equal(r.status, 0, r.stdout + r.stderr);
const src = require('./lib_engine_load.cjs').source('src/scripts/script-06.txt');
const m = src.match(/const SPEC_SOUND = (\{[^\n]+\});/); assert.ok(m, 'SPEC_SOUND inlined');
const S = JSON.parse(m[1]);
for (const [k, type, file] of [['ogg', 'audio/ogg', 'ui-dual-talent-specialization.ogg'], ['mp3', 'audio/mpeg', 'ui-dual-talent-specialization.mp3']]) {
  assert.ok(S[k].startsWith('data:' + type + ';base64,'));
  const bytes = Buffer.from(S[k].split(',')[1], 'base64');
  assert.ok(bytes.equals(fs.readFileSync('src/assets/audio/' + file)), file + ' bytes unchanged');
}
const fnText = src.slice(src.indexOf('function specCastSound('), src.indexOf('function specCastBar('));
assert.ok(fnText.length > 0 && !/createOscillator/.test(fnText) && /SPEC_SOUND/.test(fnText), 'placeholder tone replaced by the real sound');
assert.ok(/specCastSound\('done'\)/.test(src) && /kind !== 'done'/.test(fnText), 'completion sound only');
console.log('spec switch sound ok');
