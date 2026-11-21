'use strict';
// Balance SIMULATIONS for the isolated Arms prototype. Not a regression gate; results are a report for the owner.
// Run: node scripts/sim_arms_proto.cjs [N]   (default 300 seeds per row; seed = s*7919+13)
const B = require('./lib_engine_load.cjs')();
const P = B.armsProto;
const N = +process.argv[2] || 300;
function battle(opts) { const st = B.createBattle(opts); let g = 0; while (!st.over && g++ < 6000) B.step(st); return st; }
function agg(make) {
  let win = 0, acts = 0, deaths = 0, hpEnd = 0, mainDmg = 0, compDmg = 0, petDmg = 0, ownDmg = 0, heroes = 0;
  for (let s = 0; s < N; s++) {
    const st = battle(make(s * 7919 + 13));
    if (st.result === 'win') win++; acts += st.actions;
    st.heroes.forEach(h => { if (h.hp <= 0) deaths++; hpEnd += Math.max(0, h.hp) / h.maxHp; heroes++; });
    mainDmg += st.heroes[0].stats.dmg; compDmg += st.heroes[1] ? st.heroes[1].stats.dmg : 0;
    petDmg += (st.pets || []).reduce((a, p) => a + p.stats.dmg, 0);
    ownDmg += st.heroes.slice(1).filter(h => h.cls === 'hunter' || h.cls === 'warlock').reduce((a, h) => a + h.stats.dmg, 0);
  }
  return { win: (100 * win / N).toFixed(1) + '%', acts: (acts / N).toFixed(1), deaths: (deaths / N).toFixed(2), hpEnd: (100 * hpEnd / heroes).toFixed(1) + '%',
    mainDmg: Math.round(mainDmg / N), compDmg: Math.round(compDmg / N), petDmg: Math.round(petDmg / N), petShare: ownDmg + petDmg ? (100 * petDmg / (ownDmg + petDmg)).toFixed(1) + '%' : '—' };
}
const ENC = [['daily_wf_coast', 15, 3], ['dm_rhahk', 18, 5], ['vancleef', 19, 5], ['dw_worgen1', 25, 3], ['dw_nightwatch', 30, 3]];
function armsParty(L, size, mainVariant, compAcc) {
  const main = mainVariant === 'old' ? { cls: 'warrior', spec: 'arms', level: L, main: true }
    : { cls: 'warrior', spec: 'arms', level: L, main: true, proto: 'arms', talents: mainVariant === 'A' ? P.line(L) : mainVariant === 'B' ? P.buildAt(P.BUILD_B, L) : {} };
  const comp = mainVariant === 'old' ? { cls: 'warrior', spec: 'arms', level: L } : { cls: 'warrior', spec: 'arms', level: L, proto: 'arms', acc: compAcc || 0 };
  const p = [main, comp, { cls: 'priest', spec: 'holy', level: L }];
  if (size === 5) p.push({ cls: 'paladin', spec: 'prot', level: L }, { cls: 'mage', spec: 'fire', level: L });
  return p;
}
const row = (label, r, keys) => console.log('| ' + label + ' | ' + keys.map(k => r[k]).join(' | ') + ' |');
console.log('# Arms prototype simulations — N=' + N + ' seeds per row\n');
console.log('## 1. Builds (main) — companion = automatic line; "old" = current non-prototype Arms kit for reference');
for (const [enc, L, size] of ENC) {
  console.log('\n### ' + enc + ' — level ' + L + ', ' + size + ' heroes\n| variant | wins | actions | deaths/battle | HP left | main dmg | companion dmg |\n|---|---|---|---|---|---|---|');
  for (const v of ['A', 'B', 'none', 'old']) row(v === 'none' ? 'no talents (diagnostic)' : v === 'old' ? 'old Arms kit (reference)' : 'build ' + v, agg(seed => ({ encounter: enc, level: L, main: 'warrior', seed, party: armsParty(L, size, v) })), ['win', 'acts', 'deaths', 'hpEnd', 'mainDmg', 'compDmg']);
}
console.log('\n## 2. Accessory experiment (companion Arms warrior, green tier): none / scale B 7.5% / scale A 15% — main build A');
for (const [enc, L, size] of [['vancleef', 19, 5], ['dw_worgen1', 25, 3], ['dw_nightwatch', 30, 3]]) {
  console.log('\n### ' + enc + ' — level ' + L + '\n| accessory | wins | actions | deaths/battle | HP left | companion dmg |\n|---|---|---|---|---|---|');
  for (const [lab, acc] of [['none', 0], ['B green 7.5%', P.ACC_SCALES.B[2]], ['A green 15%', P.ACC_SCALES.A[2]]])
    row(lab, agg(seed => ({ encounter: enc, level: L, main: 'warrior', seed, party: armsParty(L, size, 'A', acc), experiment: { acc: true } })), ['win', 'acts', 'deaths', 'hpEnd', 'compDmg']);
}
console.log('\n## 3. Pet control (outside the Arms fragment): companions BM hunter + wolf and Demonology warlock + Voidwalker, both 5★ legendary rb=0.25; accessory green scale B 7.5%');
for (const [enc, L, size] of [['dw_nightwatch', 27, 3], ['vancleef', 18, 5]]) {
  console.log('\n### ' + enc + ' — heroes level ' + L + '\n| mode | wins | actions | deaths/battle | pet dmg | pet share (owner+pet) |\n|---|---|---|---|---|---|');
  const party = () => { const p = [{ cls: 'warrior', spec: 'arms', level: L, main: true }, { cls: 'hunter', spec: 'bm', level: L, rb: 0.25, pet: 'wolf', acc: P.ACC_SCALES.B[2] }, { cls: 'warlock', spec: 'demo', level: L, rb: 0.25, pet: 'voidwalker', acc: P.ACC_SCALES.B[2] }]; if (size === 5) p.push({ cls: 'priest', spec: 'holy', level: L }, { cls: 'paladin', spec: 'prot', level: L }); return p; };
  for (const [lab, exp] of [['current (no experiment)', undefined], ['(a) accessory only', { acc: true }], ['(b) rb to pet only', { petRb: true }], ['(c) both', { acc: true, petRb: true }]])
    row(lab, agg(seed => ({ encounter: enc, level: L, main: 'warrior', seed, party: party(), experiment: exp })), ['win', 'acts', 'deaths', 'petDmg', 'petShare']);
}
