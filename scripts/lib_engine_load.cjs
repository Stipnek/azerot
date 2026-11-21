'use strict';
// Loads the combat engine directly from src/scripts/script-05.txt (no build needed).
const fs = require('node:fs');
const vm = require('node:vm');
module.exports = function loadEngine(path) {
  const src = fs.readFileSync(path || 'src/scripts/script-05.txt', 'utf8');
  const m = { exports: {} };
  vm.runInNewContext(src, { module: m, console, Math, JSON, Object, Array, Number, String, Set, Map, Date });
  return m.exports;
};
