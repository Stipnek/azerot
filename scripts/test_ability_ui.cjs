'use strict';
// Synthetic fixture only: no actual game unlock schedule is enabled by this test.
const assert = require('node:assert/strict');
const vm = require('node:vm');
const load = require('./lib_engine_load.cjs');
const B = load();
const source = load.source('src/scripts/script-06.txt');
const start = source.indexOf('  function skillsHtml(');
const end = source.indexOf('  function pagerHtml(', start);
assert.ok(start >= 0 && end > start, 'locate the real assembled renderer');
const passiveHelper = source.match(/  function passivesOf\(sp\) \{[^\n]*\}/);
assert.ok(passiveHelper, 'load the real passive helper used by skillsHtml');
// Every skills view must pass the displayed character's own level; a new view must be added here explicitly.
const callers = [
  'skillsHtml(S.main, sp, cl, true, lv)',
  "skillsHtml(ck, sp, c, k === 'me', hLevel(k))",
  'skillsHtml(x.cls,B.specOf(x.cls,x.sp),B.CLASSES[x.cls],false,hLevel(id))',
  'skillsHtml(x.cls,B.specOf(x.cls,x.sp),B.CLASSES[x.cls],false,1)'
];
for (const call of callers) assert.equal(source.split(call).length - 1, 1, 'caller wired once: ' + call);
assert.equal((source.match(/\bskillsHtml\s*\(/g) || []).length, callers.length + 1, 'audit every caller when adding another skills view');
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function renderer(progression) {
  return vm.runInNewContext(passiveHelper[0] + '\n(' + source.slice(start, end).trim() + ')', {
    B: { ...B, abilityProgression: progression }, openSk: {}, esc,
    wowIcon() { return '<i class="test-icon"></i>'; }
  });
}
function row(html, id) {
  const found = html.match(new RegExp('<li[^>]*data-skill="' + id + '"[^>]*>'));
  assert.ok(found, 'missing row: ' + id);
  return found[0];
}
const profile = B.abilityProgression.create({ 'warrior:prot': {
  heroicstrike: 1, taunt: 1, thunder: 5, shieldslam: 15, revenge: 20, wall: 30
} });
const render = renderer(profile), c = B.CLASSES.warrior, sp = c.specs.prot;
const low = render('warrior', sp, c, false, 1);
const high = render('warrior', sp, c, true, 30);
assert.match(row(low, 'shieldslam'), /data-available="false"/);
assert.match(row(low, 'shieldslam'), /az-ability-locked/);
assert.match(row(low, 'shieldslam'), /data-own-level="1"/);
assert.match(low, /Откроется на 15 уровне/);
assert.match(row(high, 'shieldslam'), /data-available="true"/);
assert.doesNotMatch(row(high, 'shieldslam'), /az-ability-locked/);
assert.match(row(high, 'shieldslam'), /data-own-level="30"/);
assert.match(row(low, 'heroicstrike'), /data-available="true"/);
for (const level of [14, 15, 29, 30]) {
  const html = render('warrior', sp, c, false, level);
  const slots = profile.slots('warrior', 'prot', level);
  for (const slot of slots) assert.ok(row(html, slot.id).includes('data-available="' + slot.available + '"'));
}
const legacyRender = renderer(B.abilityProgression);
let profiles = 0;
for (const [cls, clsDef] of Object.entries(B.CLASSES)) {
  for (const [spec, specDef] of Object.entries(clsDef.specs)) {
    profiles++;
    const html = legacyRender(cls, specDef, clsDef, false, 30);
    for (const id of specDef.skills) assert.match(row(html, id), /data-available="true"/);
    assert.doesNotMatch(html, /Откроется на/);
    const low = legacyRender(cls, specDef, clsDef, false, 1), plan = B.ABILITY_UNLOCKS[cls + ':' + spec];
    for (const id of specDef.skills) assert.match(row(low, id), plan[id] <= 1 ? /data-available="true"/ : /data-available="false"/);
    assert.ok(html.includes('автоатака'));
    for (const passive of specDef.passives || (specDef.passive ? [specDef.passive] : [])) {
      assert.ok(html.includes(esc(passive.name)), 'passive rendered: ' + cls + ':' + spec);
    }
  }
}
const hostile = renderer({ slots(...args) {
  return B.abilityProgression.slots(...args).map(s => ({ ...s, name: '<unsafe-name>', description: '<unsafe-description>' }));
} });
const safe = hostile('warrior', sp, c, false, 1);
assert.ok(safe.includes('&lt;unsafe-name&gt;') && safe.includes('&lt;unsafe-description&gt;'));
assert.ok(!safe.includes('<unsafe-name>') && !safe.includes('<unsafe-description>'));
assert.throws(() => render('warrior', sp, c, false));
console.log('Shared skill UI passed: own-level boundaries, legacy profiles, caller coverage, real passive helper and escaping;', profiles, 'profiles');
