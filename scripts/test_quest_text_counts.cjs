'use strict';
// PLAY-09 (owner play-test 2026-11-27): quest texts and tips must not promise more or other enemies than the fight spawns.
// Every encounter (solo fights are capped at SOLO_MAX_ENEMIES by BAL-04/05): a count word in the text/tip must not exceed the spawned enemies,
// and a named enemy type that is not in the spawned list must not be named in the tip.
// Scope: encounter text and tip from the engine (script-05). Retellings (script-06) are covered by test_elwynn_dialogue_browser.py only for Eagan.
const assert = require('node:assert/strict');
const B = require('./lib_engine_load.cjs')();
const W = w => new RegExp('(?<!\\p{L})(?:' + w + ')(?!\\p{L})', 'iu'); // \b is ASCII-only in JS
const COUNT = [[W('три|трое|троих'), 3], [W('четыре|четверо'), 4], [W('пять|пятеро'), 5]];
const NAMED = [[/шаман/i, 'murlocShaman'], [/глаза мурлока/i, 'murloc']];
const bad = [];
for (const [k, e] of Object.entries(B.ENCOUNTERS)) {
  if (!Array.isArray(e.enemies) || !e.enemies.length) continue;
  for (const field of ['text', 'tip']) {
    const s = e[field] || '';
    for (const [re, n] of COUNT) if (re.test(s) && e.enemies.length < n) bad.push(`${k}.${field}: «${s}» but ${e.enemies.length} enemies`);
    for (const [re, id] of NAMED) if (re.test(s) && !e.enemies.some(x => x === id || x.startsWith(id))) bad.push(`${k}.${field}: «${s}» but no ${id}`);
  }
}
assert.deepEqual(bad, [], 'Quest texts out of step with spawned enemies:\n' + bad.join('\n'));
assert.equal(B.ENCOUNTERS.fargo.text, 'Два кобольда в тесной шахте');
console.log('quest text counts: ok');
