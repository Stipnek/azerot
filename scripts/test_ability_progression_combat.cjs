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
const marker = 'const abilityProgression = makeAbilityProgression(ABILITY_UNLOCKS);';
assert.equal(source.split(marker).length - 1, 1, 'fixture injection must match exactly once');
const instrumented = source.replace(marker, 'const abilityProgression = makeAbilityProgression(' + JSON.stringify(rules) + ');');
const m = {exports: {}};
vm.runInNewContext(instrumented, {module: m, console, Math, JSON, Object, Array, Number, String, Set, Map, Date});
const B = m.exports;
assert.equal(B.abilityProgression.configuredProfiles.length, Object.keys(rules).length);
let cases = 0;
for (const [cls, c] of Object.entries(B.CLASSES)) {
  for (const [spec, def] of Object.entries(c.specs)) {
    // TALENT-03: companions also get ability talents from their automatic line; a main without a saved allocation gets none.
    const R = B.specTalents.rules(cls, spec);
    const talentActives = (level, isMain) => R && !isMain ? R.actives(R.line(level)) : [];
    const expected = (level, isMain) => { const kit = def.skills.filter(id => rules[cls + ':' + spec][id] <= level); return kit.concat(talentActives(level, isMain).filter(id => !kit.includes(id))); };
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
        assert.deepEqual(plain(state.heroes[0].skills), plain(expected(mainLevel, true)), label + ': main uses own level');
        assert.deepEqual(plain(state.heroes[1].skills), plain(expected(companionLevel, false)), label + ': companion uses own level, not main or encounter');
        cases++;
      }
    }
  }
}
assert.equal(baseline.abilityProgression.configuredProfiles.length, Object.keys(baseline.ABILITY_UNLOCKS).length, 'synthetic fixture must not change the ordinary engine (production schedule stays)');
// Production schedule (owner 2026-11-27): own level decides, everything open at 30.
for (const [key, plan] of Object.entries(baseline.ABILITY_UNLOCKS)) {
  const [cls, spec] = key.split(':'); if (cls === 'warrior' && spec === 'arms') continue; // integrated Arms has its own kit path
  for (const lvl of [1, 15, 22, 30]) {
    const st = baseline.createBattle({ encounter: 'daily_wf_coast', level: 30, main: cls, seed: 7, party: [{ cls: 'warrior', spec: 'prot', level: 30, main: true }, { cls, spec, level: lvl }] });
    const R = baseline.specTalents.rules(cls, spec), kit = baseline.CLASSES[cls].specs[spec].skills.filter(id => plan[id] <= lvl);
    assert.deepEqual(plain(st.heroes[1].skills), plain(kit.concat(R ? R.actives(R.line(lvl)).filter(id => !kit.includes(id)) : [])), key + ' companion at ' + lvl);
  }
}
console.log('Ability progression combat wiring passed:', cases, 'mixed-level party cases with synthetic schedules and the production schedule for companions at 1/15/22/30');
