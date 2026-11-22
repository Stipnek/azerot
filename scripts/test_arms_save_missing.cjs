'use strict';
// Regression coverage for incomplete and malformed prototype saves; no browser required.
const assert = require('node:assert/strict');
const P = require('./lib_engine_load.cjs')().armsProto;
const plain = x => JSON.parse(JSON.stringify(x));
const emptyCases = [
  { schema: 1 },
  { schema: 1, main: null },
  { schema: 1, main: { level: 15 } },
  { schema: 1, main: { level: 15, talents: null } },
  { schema: 1, main: { level: 15, talents: {} } }
];
for (const raw of emptyCases) {
  let result;
  assert.doesNotThrow(() => { result = P.migrateSave(raw); });
  assert.deepEqual(plain(result.state.main.talents), {});
  assert.equal(result.reset, false);
}
for (const talents of [[], ['ihs'], '', 'ihs', 0, 3, false, true]) {
  const result = P.migrateSave({ schema: 1, main: { level: 15, talents } });
  assert.equal(result.reset, true);
  assert.deepEqual(plain(result.state.main.talents), {});
  assert.ok(result.errors.length > 0);
}
const valid = { schema: 1, main: { level: 30, talents: P.buildAt(P.BUILD_B, 30) } };
assert.deepEqual(plain(P.migrateSave(valid).state.main.talents), plain(valid.main.talents));
const normal = '{"chars":[{"name":"Не изменять"}]}';
const values = new Map([['azeroth-ab-setup-v5', normal]]);
const store = { getItem(k) { return values.has(k) ? values.get(k) : null; }, setItem(k, v) { values.set(k, String(v)); } };
for (const raw of emptyCases) {
  store.setItem(P.CONFIG.saveKey, JSON.stringify(raw));
  const loaded = P.load(store);
  P.save(store, loaded.state);
  assert.deepEqual(plain(P.load(store).state), plain(loaded.state));
  assert.equal(store.getItem('azeroth-ab-setup-v5'), normal);
}
console.log('Arms incomplete-save regressions passed');
