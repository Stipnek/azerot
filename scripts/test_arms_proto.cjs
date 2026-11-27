'use strict';
// Fast regressions for the isolated Arms talent prototype (flag party[i].proto === 'arms'). Balance is NOT checked here.
const assert = require('node:assert/strict');
const B = require('./lib_engine_load.cjs')();
const fingerprint = require('./lib_flagoff_fingerprint.cjs');
const P = B.armsProto;
const run = (opts) => { const st = B.createBattle(opts); const ev = []; let g = 0; while (!st.over && g++ < 6000) { B.step(st); ev.push(...st.events); st.events.length = 0; } return { st, ev }; };
const party30 = (talents, extra) => [{ cls: 'warrior', spec: 'arms', level: 30, main: true, proto: 'arms', talents }, { cls: 'warrior', spec: 'arms', level: 30, proto: 'arms' }, { cls: 'priest', spec: 'holy', level: 30 }].concat(extra || []);
const j = x => JSON.parse(JSON.stringify(x)); const deq = (a, b, m) => assert.deepEqual(j(a), j(b), m); // vm objects have a foreign prototype
let n = 0; const ok = (name, f) => { f(); n++; console.log('ok', name); };

ok('flag off: fixed scenarios of all ordinary classes unchanged', () => {
  const base = require('./fixtures/arms-proto-flagoff-baseline.json');
  // The baseline predates BAL-06, which retunes group quests such as daily_wf_coast on purpose; it guards the prototype flag, not balance,
  // so it is compared with the group curve off (BAL-06 has its own test, test_bal05_06_curves.cjs).
  const g = B.GROUP_ENEMY_CURVE.enabled; B.GROUP_ENEMY_CURVE.enabled = false;
  let fp; try { fp = fingerprint(B); } finally { B.GROUP_ENEMY_CURVE.enabled = g; }
  assert.equal(fp.count, base.scenarios); assert.equal(fp.sha256, base.sha256);
});
ok('point budget: 0 before 15, L-9 from 15', () => {
  deq([1, 14, 15, 19, 20, 24, 25, 29, 30].map(P.points), [0, 0, 6, 10, 11, 15, 16, 20, 21]);
});
ok('earliest purchase by row: 3@20, 4@25, 5@30; Mortal Strike impossible at 30', () => {
  assert.equal(P.validate({ imprend: 3, deflection: 5, impthunder: 2, deepwounds: 1 }, 19).ok, false);
  assert.equal(P.validate({ imprend: 3, deflection: 5, impthunder: 2, deepwounds: 1 }, 20).ok, true);
  assert.equal(P.validate(P.line(24), 24).ok, true); assert.equal(P.line(24).impale, undefined);
  assert.equal(P.line(25).impale, 1);
  assert.equal(P.line(29).sweeping, undefined); assert.equal(P.line(30).sweeping, 1);
  const ms = Object.assign({}, P.line(30), { mortal: 1 }); assert.equal(P.validate(ms, 30).ok, false);
  assert.ok(!P.kit(30, P.line(30)).includes('mortal'));
});
ok('validation rejects unavailable, tier, prerequisite, budget, rank errors', () => {
  assert.match(P.validate({ tactical: 1 }, 30).errors.join(), /недоступно в прототипе/);
  assert.match(P.validate({ deepwounds: 1, deflection: 5, ihs: 3, impthunder: 2 }, 30).errors.join(), /требует полного/);
  assert.match(P.validate({ impthunder: 1 }, 30).errors.join(), /Ряд 2/);
  assert.match(P.validate({ deflection: 5, imprend: 3 }, 15).errors.join(), /бюджете 6/);
  assert.match(P.validate({ ihs: 4 }, 30).errors.join(), /недопустимый ранг/);
  assert.match(P.validate({ nope: 1 }, 30).errors.join(), /Неизвестный узел/);
  assert.equal(P.validate({ tactical: 1 }, 30, { ignoreAvailability: true }).errors.length, 1); // availability is a prototype layer only
});
ok('companion line legal at every level 15..30 and milestones exact', () => {
  for (let L = 15; L <= 30; L++) assert.equal(P.validate(P.line(L), L).ok, true, 'line ' + L);
  for (let L = 15; L <= 30; L++) assert.equal(P.validate(P.buildAt(P.BUILD_B, L), L).ok, true, 'B ' + L);
  deq(P.line(15), { imprend: 3, deflection: 2, impthunder: 1 });
  deq(P.line(20), { imprend: 3, deflection: 4, impthunder: 3, deepwounds: 1 });
  deq(P.line(25), { imprend: 3, deflection: 5, impthunder: 3, deepwounds: 3, ihs: 1, impale: 1 });
  deq(P.line(30), { imprend: 3, deflection: 5, impthunder: 3, deepwounds: 3, ihs: 1, impale: 2, twohand: 3, sweeping: 1 });
});
ok('14 -> 15: training kit, no talents and no spec aura before 15; own level of companion', () => {
  const mk = (lm, lc) => B.createBattle({ encounter: 'daily_wf_coast', level: 15, main: 'warrior', seed: 1, party: [{ cls: 'warrior', spec: 'arms', level: lm, main: true, proto: 'arms', talents: {} }, { cls: 'warrior', spec: 'arms', level: lc, proto: 'arms' }] });
  const a = mk(14, 30), b = mk(15, 14);
  assert.equal(a.aura.name, undefined); assert.equal(a.aura.physDmg, undefined);
  deq(a.heroes[0].skills, ['heroicstrike', 'thunder', 'rend']); deq(a.heroes[0].tal, {});
  deq(a.heroes[1].tal, P.line(30));
  assert.equal(b.aura.name, 'Зов полководца');
  deq(b.heroes[1].tal, {}); deq(b.heroes[1].skills, ['heroicstrike', 'thunder', 'rend']);
  deq(b.heroes[0].pids, []);
});
ok('invalid main build from any source is rejected, not partially applied', () => {
  const st = B.createBattle({ encounter: 'daily_wf_coast', level: 15, main: 'warrior', seed: 1, party: [{ cls: 'warrior', spec: 'arms', level: 15, main: true, proto: 'arms', talents: { deepwounds: 3 } }] });
  deq(st.heroes[0].tal, {}); assert.ok(st.protoErrors.length > 0);
});
ok('node effects: costs, Rend, Deflection, Impale formula', () => {
  const st = B.createBattle({ encounter: 'dw_nightwatch', level: 30, main: 'warrior', seed: 1, party: party30(P.buildAt(P.BUILD_B, 30)) });
  const h = st.heroes[0]; h.rage = 100;
  assert.equal(B.rageCost(h, 'heroicstrike'), 12); assert.equal(B.rageCost(h, 'thunder'), 16);
  assert.equal(h.parryBase, 0.03);
  assert.equal(P.critMul({ proto: 'arms', tal: { impale: 1 } }, {}), 1.55);
  assert.equal(P.critMul({ proto: 'arms', tal: { impale: 2 } }, {}), 1.6);
  assert.equal(P.critMul({ proto: 'arms', tal: { impale: 2 } }, { auto: true }), 1.5);
  assert.equal(P.critMul({ proto: 'arms', tal: { impale: 2 } }, { dot: true }), 1.5);
});
ok('Improved Rend multiplies the Rend bleed by rank', () => {
  for (const [r, mult] of [[0, 0.12], [3, 0.12 * 1.35]]) {
    const talents = r ? { imprend: 3 } : {};
    const st = B.createBattle({ encounter: 'daily_wf_coast', level: 15, main: 'warrior', seed: 2, party: [{ cls: 'warrior', spec: 'arms', level: 15, main: true, proto: 'arms', talents }] });
    let f = null, g = 0;
    while (!st.over && g++ < 3000 && !f) { B.step(st); st.events.length = 0; for (const e of st.enemies) { const x = e.effects.find(q => q.name === 'Кровопускание' && q.src === st.heroes[0].id); if (x) f = x; } }
    assert.ok(f, 'rend applied'); assert.ok(Math.abs(f.mult - mult) < 1e-9, 'mult ' + f.mult);
  }
});
ok('Deep Wounds, Sweeping Strikes and parry use only eligible events (300 seeds)', () => {
  const allowed = new Set(['auto', 'heroicstrike', 'cleave', 'slam', 'execute', 'mortal']);
  let parries = 0, dw = 0, sweepAct = 0, sweepProc = 0;
  for (let s = 0; s < 300; s++) {
    const { ev } = run({ encounter: 'dw_nightwatch', level: 30, main: 'warrior', seed: s * 7919 + 13, party: party30(P.line(30)) });
    const charges = {};
    for (const e of ev) {
      if (e.t === 'proc' && e.proc === 'deepwounds') { dw++; assert.ok(allowed.has(e.via), 'DW via ' + e.via); }
      if (e.t === 'skill' && e.skill === 'sweeping') { sweepAct++; charges[e.src] = 5; }
      if (e.t === 'proc' && e.proc === 'sweeping') { sweepProc++; charges[e.src]--; assert.ok(charges[e.src] >= 0 && e.left === charges[e.src], 'charges'); }
      if (e.t === 'dmg' && e.parry) parries++;
    }
  }
  assert.ok(dw > 0 && sweepAct > 0 && sweepProc > 0 && parries > 0, JSON.stringify({ dw, sweepAct, sweepProc, parries }));
});
ok('accessory experiment changes only HP and role output; mana unchanged; pet gets it once; ignored without flag', () => {
  const party = acc => [{ cls: 'warrior', spec: 'arms', level: 30, main: true }, { cls: 'priest', spec: 'holy', level: 30, rb: 0.1, acc }, { cls: 'hunter', spec: 'bm', level: 30, rb: 0.1, acc, pet: 'wolf' }];
  const mk = (acc, experiment) => B.createBattle({ encounter: 'dw_nightwatch', level: 30, main: 'warrior', seed: 3, party: party(acc), experiment });
  const off = mk(0.15), base = mk(0, { acc: true }), on = mk(0.15, { acc: true });
  const rnd = x => Math.round(x * 1e6) / 1e6;
  assert.equal(off.heroes[1].maxHp, mk(0).heroes[1].maxHp); assert.equal(off.pets[0].maxHp, mk(0).pets[0].maxHp);
  const [p0, p1, h0, h1] = [base.heroes[1], on.heroes[1], base.heroes[2], on.heroes[2]];
  assert.ok(Math.abs(p1.maxHp / p0.maxHp - 1.25 / 1.1) < 0.002);
  assert.equal(rnd(p1.healPow / p0.healPow), rnd(1.25 / 1.1)); assert.equal(rnd(p1.atk), rnd(p0.atk));
  assert.equal(rnd(h1.atk / h0.atk), rnd(1.25 / 1.1)); assert.equal(rnd(h1.healPow || 0), rnd(h0.healPow || 0));
  assert.equal(p1.maxMana, p0.maxMana); assert.equal(p1.spd, p0.spd); assert.equal(p1.crit, p0.crit);
  assert.equal(rnd(on.pets[0].atk / base.pets[0].atk), 1.15);
  const again = mk(0.15, { acc: true }); assert.equal(again.heroes[2].maxHp, h1.maxHp); assert.equal(again.pets[0].atk, on.pets[0].atk);
});
ok('pet rb transfer only in experiment mode', () => {
  const mk = (experiment) => B.createBattle({ encounter: 'dw_nightwatch', level: 30, main: 'warrior', seed: 3, party: [{ cls: 'warrior', spec: 'arms', level: 30, main: true }, { cls: 'warlock', spec: 'demo', level: 30, rb: 0.25, pet: 'voidwalker' }], experiment });
  const off = mk(), on = mk({ petRb: true }), both = mk({ petRb: true, acc: true });
  assert.ok(Math.abs(on.pets[0].maxHp / off.pets[0].maxHp - 1.25) < 0.002);
  assert.equal(Math.round(on.pets[0].atk / off.pets[0].atk * 1e6) / 1e6, 1.25);
  assert.equal(both.pets[0].atk, on.pets[0].atk); // no accessory on that companion
});
ok('separate save namespace; normal save untouched; no derived stats saved; migration of bad data', () => {
  const store = { m: new Map([['azeroth-ab-setup-v5', '{"chars":[{"name":"Копия"}]}']]), getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }, setItem(k, v) { this.m.set(k, String(v)); } };
  const before = store.getItem('azeroth-ab-setup-v5');
  const s = P.load(store).state; s.main.level = 30; s.main.talents = P.buildAt(P.BUILD_B, 30);
  const saved = P.save(store, s);
  assert.equal(store.getItem('azeroth-ab-setup-v5'), before);
  assert.equal(P.CONFIG.saveKey !== 'azeroth-ab-setup-v5', true);
  const raw = JSON.parse(store.getItem(P.CONFIG.saveKey));
  assert.ok(!/maxHp|atk|healPow|crit|spd/.test(JSON.stringify(raw)));
  deq(P.load(store).state, saved);
  const bad = P.migrateSave({ schema: 1, main: { level: 15, talents: { deepwounds: 3 } } });
  assert.equal(bad.reset, true); deq(bad.state.main.talents, {});
  assert.equal(P.migrateSave({ schema: 99 }).reset, true);
});
ok('UI click path uses the same validation as loaded builds', () => {
  let a = {}; const L = 30;
  for (const id of P.BUILD_B) { const r = P.change(a, id, +1, L); assert.equal(r.ok, true, id); a = r.alloc; }
  deq(a, P.buildAt(P.BUILD_B, L));
  assert.equal(P.change(a, 'ihs', +1, L).ok, false);
  assert.equal(P.change(a, 'imprend', -1, L).ok, false); // would break Deep Wounds prerequisite
  assert.equal(P.change({}, 'tactical', +1, L).ok, false);
});
console.log('arms prototype regressions passed:', n);
