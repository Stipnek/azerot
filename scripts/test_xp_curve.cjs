'use strict';
// XP curve v2: Classic-shaped level table, quest reward from quests-per-level, Deadmines ~1 level, legacy save conversion.
const assert = require('node:assert/strict');
const vm = require('node:vm');
const load = require('./lib_engine_load.cjs');
const B = load(), source = load.source('src/scripts/script-06.txt');
assert.equal(B.XP_CURVE.version, 2);
assert.equal(B.xpNeed(1), 400, 'level 1 -> 2 needs 400 XP like Classic');
assert.equal(B.xpNeed(10), 7600);
for (let l = 1; l < B.XPC.cap - 1; l++) assert.ok(B.xpNeed(l + 1) > B.xpNeed(l), 'need grows at ' + l);
assert.equal(B.levelOf(B.xpAt(2) - 1), 1); assert.equal(B.levelOf(B.xpAt(2)), 2); assert.equal(B.levelOf(1e12), B.XPC.cap);
const solo = l => B.xpFor(l, { level: l, type: 'solo', size: 1 });
assert.ok(solo(1) >= 300 && solo(1) < 400, 'one level-1 quest is most of level 2; a few enemies finish it');
for (let l = 1; l < B.XPC.cap - 1; l++) assert.ok(B.xpNeed(l + 1) / solo(l + 1) > B.xpNeed(l) / solo(l), 'quests per level grow at ' + l);
assert.equal(B.xpFor(5, { level: 5, type: 'group', size: 3 }), solo(5) * 2, 'group quests keep x2');
const dm = B.dungeonXp(19, 'deadmines') / B.xpNeed(19);
assert.ok(dm > 0.8 && dm < 1.2, 'one Deadmines run at 19 is about one level: ' + dm);
// Legacy conversion (real functions from the assembled interface source)
function fn(name) {
  const start = source.indexOf('  function ' + name + '(');
  assert.ok(start >= 0, 'function ' + name);
  let depth = 0;
  for (let i = source.indexOf('{', start); i < source.length; i++) { if (source[i] === '{') depth++; if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1); }
  throw new Error('Unclosed ' + name);
}
const ctx = vm.createContext({ B, isGid: k => /^g/.test(k) });
vm.runInContext(fn('legacyXpToV2') + '\n' + fn('cleanHxp'), ctx);
const oldNeed = l => Math.round(350 * (1 + 0.1 * (l - 1)));
const oldAt = (l, frac) => { let s = 0; for (let i = 1; i < l; i++) s += oldNeed(i); return s + Math.floor(oldNeed(l) * frac); };
for (const [l, frac] of [[1, 0], [1, 0.5], [7, 0.25], [14, 0.9], [29, 0.5]]) {
  const v = vm.runInContext('legacyXpToV2(' + oldAt(l, frac) + ')', ctx), p = B.levelProgress(v);
  assert.equal(p.level, l, 'level kept for ' + l);
  assert.ok(Math.abs(p.cur / p.need - frac) < 0.01, 'progress kept for ' + l + ': ' + p.cur / p.need);
}
assert.equal(vm.runInContext('legacyXpToV2(1e9)', ctx), B.xpAt(B.XPC.cap), 'cap stays cap');
const legacy = JSON.stringify({ level: 7, hxp: { me: oldAt(7, 0.25), g_a: oldAt(3, 0) } });
const conv = JSON.parse(JSON.stringify(vm.runInContext('cleanHxp(' + legacy + ')', ctx)));
assert.equal(B.levelOf(conv.me), 7); assert.equal(B.levelOf(conv.g_a), 3);
const current = vm.runInContext('cleanHxp({ level: 7, xpCurve: 2, hxp: { me: ' + B.xpAt(7) + ' } })', ctx);
assert.equal(current.me, B.xpAt(7), 'curve-v2 characters are not converted again');
// The character record keeps the flag and a rollback copy
assert.ok(source.includes("hxp: cleanHxp(h), xpCurve: 2,"), 'cleanChar marks curve v2');
assert.ok(source.includes("hxpLegacy: Object.assign({}, h.hxp)"), 'cleanChar keeps the legacy XP copy');
assert.ok(source.includes("hxp: cleanHxp({ level: 1, hxp: {}, xpCurve: 2 }), xpCurve: 2,"), 'new characters start on curve v2');
console.log('XP curve v2: table, rewards, Deadmines and legacy conversion OK');
