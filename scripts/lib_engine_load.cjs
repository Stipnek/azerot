'use strict';
// Apply the same source-bound manifests as build_game.py before loading the engine.
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const crypto = require('node:crypto');
function engineSource(sourcePath) {
  const file = path.resolve(sourcePath || 'src/scripts/script-05.txt');
  const original = fs.readFileSync(file);
  const sha256 = crypto.createHash('sha256').update(original).digest('hex');
  const blob = crypto.createHash('sha1').update(Buffer.from('blob ' + original.length + '\0')).update(original).digest('hex');
  const stem = path.basename(file, '.txt');
  let text = original.toString('utf8');
  const manifests = fs.readdirSync(path.dirname(file)).filter(n => n.startsWith(stem) && n.endsWith('.edits.json')).sort();
  for (const name of manifests) {
    const spec = JSON.parse(fs.readFileSync(path.join(path.dirname(file), name), 'utf8'));
    if (spec.sourceSha256 !== sha256 && spec.sourceBlobSha1 !== blob) throw new Error('Source changed: inspect ' + name);
    if (!Array.isArray(spec.edits)) throw new Error('Missing edits: ' + name);
    for (const edit of spec.edits) {
      if (typeof edit.old !== 'string' || !edit.old || typeof edit.new !== 'string') throw new Error('Invalid edit: ' + name);
      const at = text.indexOf(edit.old);
      if (at < 0 || text.indexOf(edit.old, at + 1) >= 0) throw new Error('Non-unique source edit: ' + name + ': ' + edit.name);
      text = text.slice(0, at) + edit.new + text.slice(at + edit.old.length);
    }
  }
  return text;
}
module.exports = function loadEngine(sourcePath) {
  const m = { exports: {} };
  vm.runInNewContext(engineSource(sourcePath), { module: m, console, Math, JSON, Object, Array, Number, String, Set, Map, Date });
  return m.exports;
};
module.exports.source = engineSource;
