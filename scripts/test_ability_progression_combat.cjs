'use strict';
// Synthetic schedules exercise combat wiring; these are NOT approved game unlock levels.
const assert = require('node:assert/strict');
const vm = require('node:vm');
const load = require('./lib_engine_load.cjs');
const baseline = load();
const plain = value => JSON.parse(JSON.stringify(value));
const rules = {};
const thresholds = [1, 5, 9, 15, 20, 30];
for (const [cls, c] of Object.entries(baseline.CLASSES)) {
  for (const [spec, def] of Object.entries(c.specs)) {
    rules[cls + ':' + spec] = Object.fromEntries(def.skills.map((id, i) => [id, thresholds[Math.min(i, thresholds.length - 1)]]));
  }
}
const source = load.source();
const marker = 'const abilityProgression = makeAbilityProgression({});';
assert.equal(source.split(marker).length - 1, 1, 'fixture injection must match exactly once');
const instrumented = source.replace(marker, 'const abilityProgression = makeAbilityProgression(' + JSON.stringify(rules) + ');');
const m = {exports: {}};
vm.runInNewContext(instrumented, {module: m, console, Math, JSON, Object, Array, Number, String, Set, Map, Date});
const B = m.exports;
assert.equal(B.abilityProgression.configuredProfiles.length, Object.keys(rules).length);
let cases = 0;
for (const [cls, c] of Object.entries(B.CLASSES)) {
  for (const [spec, def] of Object.entries(c.specs)) {
    const expected = level => def.skills.filter(id => rules[cls + ':' + spec][id] <= level);
    for (const mainLevel of [1, 30]) {
      for (const companionLevel of [1, 4, 5, 8, 9, 14, 15, 19, 20, 29, 30]) {
        const state = B.createBattle({
          encounter: 'daily_wf_coast', level: 30, main: cls, seed: 123,
          party: [
            {cls, spec, level: mainLevel, main: true},
            {cls, spec, level: companionLevel}
          ]
        });
        const label = cls + ':' + spec + ' main=' + mainLevel + ' companion=' + companionLevel;
        assert.equal(state.heroes.length, 2, label + ': preserve both party members');
        assert.deepEqual(plain(state.heroes[0].skills), plain(expected(mainLevel)), label + ': main uses own level');
        assert.deepEqual(plain(state.heroes[1].skills), plain(expected(companionLevel)), label + ': companion uses own level, not main or encounter');
        cases++;
      }
    }
  }
}
assert.deepEqual(plain(baseline.abilityProgression.configuredProfiles), [], 'synthetic fixture must not change the ordinary engine');
console.log('Ability progression combat wiring passed:', cases, 'mixed-level party cases with synthetic schedules; production schedules unchanged');
